#!/usr/bin/env python3
"""
session_start.py — Evolva Meta-Agent: Fast Local Session Start

Reads CURRENT_STATE.md and codebase-memory graphs locally to produce
an instant context brief. No API round-trip. Runs in < 5 seconds.

Usage:
    python3 /home/ubuntu/meta-agent/session_start.py [--task "description"]
    python3 /home/ubuntu/meta-agent/session_start.py --query "What does deliverToPartner call?"

Output:
    Prints context brief to stdout.
    Saves to /home/ubuntu/meta-agent/current_context.md
"""

import os
import sys
import re
import json
import time
import argparse
import subprocess

PERSISTENT_DRIVE = "/home/ubuntu/repos/manus-persistent-drive"
CONTEXT_FILE = "/home/ubuntu/meta-agent/current_context.md"


def read_file(path: str, max_chars: int = 8000) -> str:
    try:
        with open(path) as f:
            return f.read()[:max_chars]
    except FileNotFoundError:
        return ""


def parse_current_state(content: str) -> dict:
    """Extract key fields from CURRENT_STATE.md using regex."""
    result = {
        "phase": "Unknown",
        "status": "Unknown",
        "last_updated": "Unknown",
        "executive_summary": "",
        "next_tasks": [],
        "blockers": [],
        "locked_decisions": [],
    }

    # Extract last updated
    m = re.search(r"\*Last updated: ([^\*\n]+)\*", content)
    if m:
        result["last_updated"] = m.group(1).strip()
        result["phase"] = m.group(1).strip()

    # Extract executive summary (first 500 chars of section 1)
    m = re.search(r"## 1\. Executive Summary\n(.*?)(?=\n## |\Z)", content, re.DOTALL)
    if m:
        result["executive_summary"] = m.group(1).strip()[:600]

    # Extract overall status
    m = re.search(r"\*\*Overall Product Status:\*\* (\w+)", content)
    if m:
        result["status"] = m.group(1)

    # Extract next sprint / upcoming work
    m = re.search(r"(?:Sprint \d+|Phase \w+)[^\n]*\n(.*?)(?=\n## |\n---|\Z)", content, re.DOTALL)
    if m:
        lines = [l.strip() for l in m.group(1).split("\n") if l.strip() and not l.startswith("#")]
        result["next_tasks"] = lines[:5]

    # Look for blockers
    for pattern in [r"(?:Blocker|BLOCKER|blocked|BLOCKED)[:\s]+([^\n]+)", r"❌[^\n]+"]:
        for match in re.finditer(pattern, content):
            result["blockers"].append(match.group(0).strip()[:120])

    return result


def query_codebase_memory(query: str, repo: str = "ttruthdesk-platform") -> str:
    """Query codebase-memory-mcp for a specific function or concept."""
    try:
        result = subprocess.run(
            ["codebase-memory-mcp", "search_graph",
             "--repo_path", f"/home/ubuntu/repos/{repo}",
             "--query", query,
             "--top_k", "3"],
            capture_output=True, text=True, timeout=15,
            env={**os.environ, "PATH": f"{os.environ.get('HOME','')}.local/bin:{os.environ.get('PATH','')}"}
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()[:800]
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
    return ""


def get_recent_sessions(n: int = 3) -> list[dict]:
    """Read the most recent session reports from manus-persistent-drive."""
    sessions_dir = os.path.join(PERSISTENT_DRIVE, "sessions")
    if not os.path.exists(sessions_dir):
        return []

    files = sorted(
        [f for f in os.listdir(sessions_dir) if f.endswith(".md")],
        reverse=True
    )[:n]

    sessions = []
    for fname in files:
        content = read_file(os.path.join(sessions_dir, fname), 500)
        sessions.append({"file": fname, "summary": content[:300]})
    return sessions


def format_brief(state: dict, sessions: list, task: str, codebase_context: str) -> str:
    lines = [
        "╔══════════════════════════════════════════════════════════╗",
        "║         EVOLVA META-AGENT — SESSION CONTEXT BRIEF        ║",
        "╚══════════════════════════════════════════════════════════╝",
        "",
        f"Phase:        {state['phase']}",
        f"Status:       {state['status']}",
        f"Generated:    {time.strftime('%Y-%m-%d %H:%M UTC')}",
        "",
    ]

    if task:
        lines += [f"Session Task: {task}", ""]

    lines += ["## Executive Summary", state["executive_summary"], ""]

    if state["next_tasks"]:
        lines += ["## Next Tasks"]
        for i, t in enumerate(state["next_tasks"][:5], 1):
            lines.append(f"  {i}. {t}")
        lines.append("")

    if state["blockers"]:
        lines += ["## Active Blockers"]
        for b in state["blockers"][:3]:
            lines.append(f"  - {b}")
        lines.append("")

    if codebase_context:
        lines += ["## Codebase Context (from graph)", codebase_context, ""]

    if sessions:
        lines += ["## Recent Sessions"]
        for s in sessions:
            lines.append(f"  [{s['file']}]")
            lines.append(f"  {s['summary'][:150]}")
        lines.append("")

    lines += [
        "## Commands",
        "  End session:  python3 /home/ubuntu/meta-agent/session_end.py --what '...' --phase '...'",
        "  Query graph:  python3 /home/ubuntu/meta-agent/query.py 'What does X do?'",
        "  Deep query:   python3 /home/ubuntu/meta-agent/deep_query.py 'Research X'  (async, 5-15min)",
        "",
        "══════════════════════════════════════════════════════════",
    ]

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Evolva Meta-Agent session start")
    parser.add_argument("--task", default="", help="Description of today's task")
    parser.add_argument("--query", default="", help="Codebase query (e.g. 'What does deliverToPartner call?')")
    args = parser.parse_args()

    # Read project state
    content = read_file(f"{PERSISTENT_DRIVE}/CURRENT_STATE.md")
    if not content:
        print("Warning: CURRENT_STATE.md not found. Cloning manus-persistent-drive...")
        subprocess.run(
            ["git", "clone", "https://github.com/Gudmundur76/manus-persistent-drive.git",
             f"{PERSISTENT_DRIVE}"],
            capture_output=True
        )
        content = read_file(f"{PERSISTENT_DRIVE}/CURRENT_STATE.md")

    state = parse_current_state(content)
    sessions = get_recent_sessions(3)

    # Optional codebase query
    codebase_context = ""
    if args.query:
        codebase_context = query_codebase_memory(args.query)
    elif args.task:
        # Auto-extract key terms from task for codebase lookup
        words = [w for w in args.task.split() if len(w) > 5]
        if words:
            codebase_context = query_codebase_memory(args.task[:100])

    brief = format_brief(state, sessions, args.task, codebase_context)
    print(brief)

    # Save to file
    os.makedirs(os.path.dirname(CONTEXT_FILE), exist_ok=True)
    with open(CONTEXT_FILE, "w") as f:
        f.write(brief)
        f.write(f"\n\n---\n## Full CURRENT_STATE.md\n\n{content[:5000]}\n")

    print(f"\nFull context saved to: {CONTEXT_FILE}")


if __name__ == "__main__":
    main()
