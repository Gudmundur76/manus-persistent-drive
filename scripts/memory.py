#!/usr/bin/env python3
"""
Letta-compatible persistent memory helper.

Reads and writes agent memory blocks from/to the git-backed store at
manus-persistent-drive/memory/agent_memory_blocks.json.

Usage:
  python3 memory.py read <block_label>
  python3 memory.py write <block_label> <value>
  python3 memory.py list
  python3 memory.py dump
"""

import json
import sys
import os
from datetime import datetime, timezone
from pathlib import Path

MEMORY_FILE = Path(__file__).parent.parent / "memory" / "agent_memory_blocks.json"


def load() -> dict:
    with open(MEMORY_FILE) as f:
        return json.load(f)


def save(data: dict) -> None:
    data["last_updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    with open(MEMORY_FILE, "w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


def read_block(label: str) -> str:
    data = load()
    block = data["blocks"].get(label)
    if not block:
        print(f"ERROR: block '{label}' not found", file=sys.stderr)
        sys.exit(1)
    return block["value"]


def write_block(label: str, value: str) -> None:
    data = load()
    if label not in data["blocks"]:
        data["blocks"][label] = {"label": label, "value": "", "limit": 2000}
    block = data["blocks"][label]
    limit = block.get("limit", 2000)
    if len(value) > limit:
        print(f"WARNING: value truncated to {limit} chars", file=sys.stderr)
        value = value[:limit]
    block["value"] = value
    save(data)
    print(f"OK: block '{label}' updated ({len(value)} chars)")


def list_blocks() -> None:
    data = load()
    print(f"Memory blocks (last updated: {data['last_updated']}):")
    for label, block in data["blocks"].items():
        chars = len(block["value"])
        limit = block.get("limit", 2000)
        pct = int(chars / limit * 100)
        print(f"  {label:20s} {chars:4d}/{limit} chars ({pct}%)")


def dump_blocks() -> None:
    data = load()
    for label, block in data["blocks"].items():
        print(f"\n{'='*60}")
        print(f"BLOCK: {label}")
        print(f"{'='*60}")
        print(block["value"])


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    cmd = sys.argv[1]

    if cmd == "read":
        if len(sys.argv) < 3:
            print("Usage: memory.py read <label>")
            sys.exit(1)
        print(read_block(sys.argv[2]))

    elif cmd == "write":
        if len(sys.argv) < 4:
            print("Usage: memory.py write <label> <value>")
            sys.exit(1)
        write_block(sys.argv[2], " ".join(sys.argv[3:]))

    elif cmd == "list":
        list_blocks()

    elif cmd == "dump":
        dump_blocks()

    else:
        print(f"Unknown command: {cmd}")
        sys.exit(1)
