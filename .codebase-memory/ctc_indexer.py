#!/usr/bin/env python3
"""
ctc_indexer.py
Builds the Cue-Tag-Content (MRAgent) layer on top of the existing codebase graph.

Reads git history from each indexed repo and runs the 3-stage MRAgent ingestion pipeline:
  Stage 1: Rewrite (LLM) — resolve pronouns, absolute times, assign semantic tags
  Stage 2: Keyword extraction (LLM) — extract cues per commit sentence
  Stage 3: Store — build CTC graph in MemorySystem

Outputs: ~/.codebase-memory/ctc_graph.db (SQLite)

Usage:
  python3 ctc_indexer.py [--repos /path/to/repos] [--db /path/to/ctc_graph.db] [--incremental]
"""

import argparse
import json
import logging
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

# Add evolva-mragent to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "evolva-mragent"))

from evolva_mragent.memory.system import MemorySystem
from evolva_mragent.memory.indexer import CodebaseIndexer
from evolva_mragent.memory.persistence import MemoryPersistence
from evolva_mragent.llm.controller import LLMController
from evolva_mragent import config

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# Default paths
DEFAULT_REPOS_DIR = Path.home() / "cbm-repos"
DEFAULT_DB_PATH = Path.home() / ".codebase-memory" / "ctc_graph.db"
TTRUTHDESK_PATH = Path.home() / "ttruthdesk-platform"

# Repos to index (in order of priority)
REPO_PATHS = [
    TTRUTHDESK_PATH,
    DEFAULT_REPOS_DIR / "citation-desk",
    DEFAULT_REPOS_DIR / "generic-signal-api",
    DEFAULT_REPOS_DIR / "cognitive-loop-framework",
    DEFAULT_REPOS_DIR / "self-direct",
    DEFAULT_REPOS_DIR / "manus-persistent-drive",
    DEFAULT_REPOS_DIR / "dna-evolve",
    DEFAULT_REPOS_DIR / "dna-evolve-web",
    DEFAULT_REPOS_DIR / "asi-evolve-discovery-engine",
    DEFAULT_REPOS_DIR / "asi-evolve-self-direct",
    DEFAULT_REPOS_DIR / "notus-is",
    DEFAULT_REPOS_DIR / "novus-is",
    DEFAULT_REPOS_DIR / "slm-infra-deploy",
    DEFAULT_REPOS_DIR / "ttruthdesk-autodeploy",
    DEFAULT_REPOS_DIR / "asi-evolve-autodeploy",
    DEFAULT_REPOS_DIR / "awesome-mcp-servers",
]

MAX_COMMITS_PER_REPO = 200  # Limit to avoid excessive LLM cost on first run


def get_git_commits(repo_path: Path, max_commits: int = MAX_COMMITS_PER_REPO, since: Optional[str] = None) -> List[Dict]:
    """Extract git commit history from a repo."""
    if not (repo_path / ".git").exists():
        logger.warning(f"No .git directory in {repo_path} — skipping git history")
        return []

    cmd = [
        "git", "-C", str(repo_path), "log",
        f"--max-count={max_commits}",
        "--format=%H|%ae|%ai|%s",
        "--name-only",
    ]
    if since:
        cmd.append(f"--since={since}")

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            logger.warning(f"git log failed for {repo_path}: {result.stderr[:200]}")
            return []
    except (subprocess.TimeoutExpired, FileNotFoundError) as e:
        logger.warning(f"git command failed for {repo_path}: {e}")
        return []

    commits = []
    current_commit = None
    files = []

    for line in result.stdout.splitlines():
        if "|" in line and len(line.split("|")) == 4:
            if current_commit:
                current_commit["files_changed"] = files
                commits.append(current_commit)
            parts = line.split("|", 3)
            current_commit = {
                "hash": parts[0],
                "author": parts[1],
                "date": parts[2][:10],  # YYYY-MM-DD
                "message": parts[3],
                "diff_summary": "",
                "files_changed": [],
            }
            files = []
        elif line.strip() and current_commit:
            files.append(line.strip())

    if current_commit:
        current_commit["files_changed"] = files
        commits.append(current_commit)

    # Enrich with diff summaries for recent commits (last 50)
    for commit in commits[:50]:
        try:
            diff_cmd = [
                "git", "-C", str(repo_path), "diff",
                "--stat", f"{commit['hash']}^", commit["hash"]
            ]
            diff_result = subprocess.run(diff_cmd, capture_output=True, text=True, timeout=10)
            if diff_result.returncode == 0:
                # Take last line of diff stat (summary line)
                lines = [l for l in diff_result.stdout.splitlines() if l.strip()]
                if lines:
                    commit["diff_summary"] = lines[-1].strip()
        except Exception:
            pass

    logger.info(f"Extracted {len(commits)} commits from {repo_path.name}")
    return commits


def get_last_indexed_hash(db_path: Path, repo_name: str) -> Optional[str]:
    """Get the last indexed commit hash for a repo (for incremental indexing)."""
    import sqlite3
    if not db_path.exists():
        return None
    try:
        conn = sqlite3.connect(str(db_path))
        row = conn.execute(
            "SELECT value FROM meta WHERE key = ?",
            (f"last_hash_{repo_name}",)
        ).fetchone()
        conn.close()
        return row[0] if row else None
    except Exception:
        return None


def save_last_indexed_hash(db_path: Path, repo_name: str, commit_hash: str) -> None:
    """Save the last indexed commit hash for a repo."""
    import sqlite3
    conn = sqlite3.connect(str(db_path))
    conn.execute(
        "INSERT OR REPLACE INTO meta VALUES (?, ?)",
        (f"last_hash_{repo_name}", commit_hash)
    )
    conn.commit()
    conn.close()


def index_repo(repo_path: Path, llm: LLMController, incremental: bool = False,
               existing_memory: Optional[MemorySystem] = None, db_path: Optional[Path] = None) -> MemorySystem:
    """Index a single repo and return its MemorySystem."""
    repo_name = repo_path.name
    logger.info(f"=== Indexing {repo_name} ===")

    # Get commits
    since = None
    if incremental and db_path:
        last_hash = get_last_indexed_hash(db_path, repo_name)
        if last_hash:
            # Get commits since the last indexed one
            logger.info(f"Incremental mode: indexing commits after {last_hash[:8]}")
            # Use git log with --ancestry-path to get only new commits
            since_cmd = [
                "git", "-C", str(repo_path), "log",
                "--format=%ai", f"{last_hash}^..HEAD", "--max-count=1"
            ]
            try:
                result = subprocess.run(since_cmd, capture_output=True, text=True, timeout=10)
                if result.returncode == 0 and result.stdout.strip():
                    since = result.stdout.strip()[:10]
            except Exception:
                pass

    commits = get_git_commits(repo_path, since=since)
    if not commits:
        logger.info(f"No commits to index for {repo_name}")
        return existing_memory or MemorySystem()

    # Use existing memory for incremental, fresh for full
    memory = existing_memory if (incremental and existing_memory) else MemorySystem()
    indexer = CodebaseIndexer(llm=llm, memory=memory)
    indexer.index_commits(commits, repo=repo_name)

    # Save last indexed hash
    if db_path and commits:
        save_last_indexed_hash(db_path, repo_name, commits[0]["hash"])

    return indexer.get_memory()


def build_ctc_graph(
    repo_paths: List[Path],
    db_path: Path,
    incremental: bool = False,
) -> MemorySystem:
    """Build the unified CTC graph from all repos."""
    llm = LLMController()
    persistence = MemoryPersistence()

    # Load existing graph for incremental mode
    unified_memory = None
    if incremental and db_path.exists():
        logger.info(f"Loading existing CTC graph from {db_path}")
        unified_memory = persistence.load(str(db_path))
        logger.info(f"Loaded {len(unified_memory.episode_events)} existing events")
    else:
        unified_memory = MemorySystem()

    # Index each repo
    for repo_path in repo_paths:
        if not repo_path.exists():
            logger.debug(f"Repo path does not exist: {repo_path}")
            continue
        try:
            repo_memory = index_repo(
                repo_path, llm,
                incremental=incremental,
                existing_memory=None,  # Each repo gets its own memory first
                db_path=db_path,
            )
            # Merge into unified graph with repo prefix
            prefix = f"{repo_path.name}:"
            unified_memory.merge(repo_memory, prefix=prefix)
            logger.info(f"Merged {repo_path.name}: {len(repo_memory.episode_events)} events")
        except Exception as e:
            logger.error(f"Failed to index {repo_path.name}: {e}")
            continue

    # Save unified graph
    db_path.parent.mkdir(parents=True, exist_ok=True)
    logger.info(f"Saving CTC graph to {db_path} ({len(unified_memory.episode_events)} events)")
    persistence.save(unified_memory, str(db_path))
    logger.info("CTC graph saved successfully")

    return unified_memory


def main():
    parser = argparse.ArgumentParser(description="Build CTC graph for codebase MCP server")
    parser.add_argument("--db", default=str(DEFAULT_DB_PATH), help="Output SQLite DB path")
    parser.add_argument("--incremental", action="store_true", help="Only index new commits")
    parser.add_argument("--repos", nargs="+", help="Override repo paths")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be indexed, don't run LLM")
    args = parser.parse_args()

    db_path = Path(args.db)
    repo_paths = [Path(r) for r in args.repos] if args.repos else REPO_PATHS

    if args.dry_run:
        print("=== DRY RUN — repos that would be indexed ===")
        for rp in repo_paths:
            exists = rp.exists()
            has_git = (rp / ".git").exists() if exists else False
            commits = len(get_git_commits(rp)) if has_git else 0
            print(f"  {'✓' if exists else '✗'} {rp.name} — {'git: ' + str(commits) + ' commits' if has_git else 'no .git'}")
        return

    logger.info(f"Building CTC graph: {len(repo_paths)} repos → {db_path}")
    memory = build_ctc_graph(repo_paths, db_path, incremental=args.incremental)

    print(f"\n=== CTC Graph Built ===")
    print(f"Events: {len(memory.episode_events)}")
    print(f"Keys (cues): {len(memory.keys)}")
    print(f"Tags: {len(memory.tag_list)}")
    print(f"Topics: {len(memory.topic_dict)}")
    print(f"Personas: {len(memory.persona_list)}")
    print(f"Saved to: {db_path}")


if __name__ == "__main__":
    main()
