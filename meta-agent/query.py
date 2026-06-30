#!/usr/bin/env python3
"""
query.py — Evolva Meta-Agent: Fast Codebase Query

Queries codebase-memory-mcp graphs for functions, files, and architecture.
Instant results (< 2s). For project-level questions, use the IM agent.

Usage:
    python3 /home/ubuntu/meta-agent/query.py "deliverToPartner"
    python3 /home/ubuntu/meta-agent/query.py "What does verifyClaim call?" --repo ttruthdesk-platform
    python3 /home/ubuntu/meta-agent/query.py "mutate_smiles" --repo asi-evolve-discovery-engine
    python3 /home/ubuntu/meta-agent/query.py --all "analysisPipeline"   # search all repos
"""

import os
import sys
import json
import subprocess
import argparse

PATH_PREFIX = os.path.expanduser("~/.local/bin")
REPO_MAP = {
    "ttruthdesk": "home-ubuntu-repos-ttruthdesk-platform",
    "ttruthdesk-platform": "home-ubuntu-repos-ttruthdesk-platform",
    "generic-signal-api": "home-ubuntu-repos-generic-signal-api",
    "generic": "home-ubuntu-repos-generic-signal-api",
    "asi-evolve": "home-ubuntu-repos-asi-evolve-discovery-engine",
    "asi": "home-ubuntu-repos-asi-evolve-discovery-engine",
    "protein-truth-desk": "home-ubuntu-protein-truth-desk",
    "protein": "home-ubuntu-protein-truth-desk",
}
ALL_PROJECTS = list(set(REPO_MAP.values()))


def run_tool(tool: str, args: dict) -> dict | None:
    env = {**os.environ, "PATH": f"{PATH_PREFIX}:{os.environ.get('PATH', '')}"}
    try:
        result = subprocess.run(
            ["codebase-memory-mcp", "cli", tool, json.dumps(args)],
            capture_output=True, text=True, timeout=12, env=env
        )
        for line in result.stdout.split("\n"):
            line = line.strip()
            if line.startswith("{"):
                try:
                    return json.loads(line)
                except json.JSONDecodeError:
                    pass
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
    return None


def search_project(project: str, query: str, top_k: int = 5) -> list[dict]:
    data = run_tool("search_graph", {"project": project, "query": query, "top_k": top_k})
    if data and "results" in data:
        return data["results"]
    return []


def trace_path(project: str, function_name: str) -> dict | None:
    return run_tool("trace_path", {"project": project, "function_name": function_name})


def format_results(results: list[dict], project_label: str) -> str:
    if not results:
        return f"  [{project_label}] No results found"

    lines = [f"  [{project_label}]"]
    for r in results:
        name = r.get("name", "?")
        file_path = r.get("file_path", r.get("file", "?"))
        start = r.get("start_line", r.get("line", "?"))
        label = r.get("label", "")
        lines.append(f"    {label} {name}")
        lines.append(f"      → {file_path}:{start}")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Query codebase-memory graphs")
    parser.add_argument("query", nargs="?", default="", help="Search query or function name")
    parser.add_argument("--repo", "-r", default="ttruthdesk", help="Repo to search (default: ttruthdesk)")
    parser.add_argument("--all", "-a", action="store_true", help="Search all repos")
    parser.add_argument("--trace", "-t", action="store_true", help="Trace call graph for function")
    parser.add_argument("--top", "-n", type=int, default=5, help="Number of results (default: 5)")
    args = parser.parse_args()

    if not args.query:
        print("Usage: python3 query.py 'function or concept to search'")
        print("       python3 query.py 'deliverToPartner' --repo generic-signal-api")
        print("       python3 query.py 'verifyClaim' --trace")
        print("       python3 query.py 'analysisPipeline' --all")
        sys.exit(0)

    query = args.query

    if args.all:
        print(f"Searching all repos for: {query}\n")
        for project in ALL_PROJECTS:
            label = project.replace("home-ubuntu-repos-", "").replace("home-ubuntu-", "")
            results = search_project(project, query, args.top)
            print(format_results(results, label))
        return

    project = REPO_MAP.get(args.repo, REPO_MAP.get("ttruthdesk"))
    label = project.replace("home-ubuntu-repos-", "").replace("home-ubuntu-", "")

    print(f"Searching {label} for: {query}\n")
    results = search_project(project, query, args.top)
    print(format_results(results, label))

    if args.trace and results:
        func_name = results[0].get("name", query)
        print(f"\nTracing call graph for: {func_name}")
        trace = trace_path(project, func_name)
        if trace:
            callers = trace.get("callers", [])
            callees = trace.get("callees", [])
            if callers:
                print(f"  Called by: {', '.join(c.get('name','?') for c in callers[:5])}")
            if callees:
                print(f"  Calls:     {', '.join(c.get('name','?') for c in callees[:5])}")


if __name__ == "__main__":
    main()
