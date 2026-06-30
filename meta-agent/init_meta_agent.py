#!/usr/bin/env python3
"""
init_meta_agent.py

Seeds the Evolva Meta-Agent (Manus IM agent) with the full project state
from manus-persistent-drive. Run once to bootstrap, then use
session_start.py / session_end.py for ongoing use.
"""

import os
import sys
import json
import time
import requests

MANUS_API_KEY = os.environ.get("MANUS_API_KEY", "")
API_BASE = "https://api.manus.ai/v2"
AGENT_TASK_ID = "agent-default-main_task"
PERSISTENT_DRIVE = "/home/ubuntu/repos/manus-persistent-drive"

HEADERS = {
    "Content-Type": "application/json",
    "x-manus-api-key": MANUS_API_KEY,
}


def read_file(path: str, max_chars: int = 8000) -> str:
    try:
        with open(path) as f:
            content = f.read()
        return content[:max_chars]
    except FileNotFoundError:
        return f"[File not found: {path}]"


def send_message(content: str) -> dict:
    resp = requests.post(
        f"{API_BASE}/task.sendMessage",
        headers=HEADERS,
        json={"task_id": AGENT_TASK_ID, "message": {"content": content}},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def wait_for_response(timeout: int = 120) -> str:
    """Poll until the agent stops running and return its last assistant message."""
    deadline = time.time() + timeout
    last_cursor = None

    while time.time() < deadline:
        params = {"task_id": AGENT_TASK_ID, "order": "desc", "limit": 10}
        if last_cursor:
            params["cursor"] = last_cursor

        resp = requests.get(
            f"{API_BASE}/task.listMessages",
            headers=HEADERS,
            params=params,
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        messages = data.get("messages", [])

        # Find the latest status
        for msg in messages:
            if msg.get("type") == "status_update":
                status = msg.get("status_update", {}).get("agent_status")
                if status in ("stopped", "waiting"):
                    # Find the last assistant message
                    for m in messages:
                        if m.get("type") == "assistant_message":
                            return m.get("assistant_message", {}).get("content", "")
                    return "[Agent stopped but no assistant message found]"

        time.sleep(3)

    return "[Timeout waiting for agent response]"


def main():
    print("=== Evolva Meta-Agent Bootstrap ===\n")

    # 1. Read project state
    current_state = read_file(f"{PERSISTENT_DRIVE}/CURRENT_STATE.md", 6000)
    phase_log = read_file(f"{PERSISTENT_DRIVE}/phase_log.md", 3000)
    session_report = read_file(
        f"{PERSISTENT_DRIVE}/sessions/session-2026-06-30-codebase-memory-install.md",
        2000,
    )

    # 2. Send the bootstrap message
    bootstrap_msg = f"""EVOLVA META-AGENT BOOTSTRAP — {time.strftime('%Y-%m-%d')}

You are the Evolva Meta-Agent: the persistent development memory for the Gudmundur76 platform. Your role is to hold project state across Manus sessions, brief new sessions with context, receive session reports, and enforce development consistency.

## Your Responsibilities

1. **Session Start (when asked "What is the current state?")**
   - Return: current phase, last completed work, active blockers, next 3 tasks
   - Flag any contradictions with locked architectural decisions

2. **Mid-session queries (when asked "Have we tried X?" or "What does Y do?")**
   - Answer from your accumulated knowledge of the codebase and session history
   - Reference specific files and line numbers when possible

3. **Session End (when given a SESSION REPORT)**
   - Acknowledge what was done
   - Update your internal model of the project state
   - Identify any new blockers or decisions that need to be locked

4. **Consistency enforcement**
   - If a proposed change contradicts a previous decision, say so explicitly
   - Maintain the development discipline: no drift, no skeleton code, no repeated mistakes

## Current Project State

{current_state}

## Recent Phase Log

{phase_log}

## Most Recent Session

{session_report}

## Repos Under Your Watch

- `Gudmundur76/ttruthdesk-platform` — citation.is verification engine (Node.js/TypeScript)
- `Gudmundur76/generic-signal-api` — drug discovery autonomous loop (Node.js/TypeScript)  
- `Gudmundur76/asi-evolve-discovery-engine` — SMILES mutation / molecular evolution (Python)
- `protein-truth-desk` — Manus webdev project (React + tRPC + Express)
- `Gudmundur76/manus-persistent-drive` — persistent memory store (Markdown + JSON)

## Codebase Memory

All four repos are indexed with codebase-memory-mcp (v0.8.1). Graph snapshots are in `.codebase-memory/graph.db.gz` in each repo. Bootstrap script: `bash /home/ubuntu/repos/manus-persistent-drive/scripts/bootstrap-codebase-memory.sh`

---

Acknowledge this bootstrap by stating:
1. The current phase of the project
2. The 3 most important things to do next
3. Any active blockers you are aware of
"""

    print("Sending bootstrap context to meta-agent...")
    result = send_message(bootstrap_msg)
    print(f"Message sent. Task ID: {result.get('task_id', AGENT_TASK_ID)}")

    print("Waiting for agent response (up to 120s)...")
    response = wait_for_response(120)
    print(f"\n=== Meta-Agent Response ===\n{response}\n")

    # Save the response
    os.makedirs(f"{PERSISTENT_DRIVE}/sessions", exist_ok=True)
    with open(f"{PERSISTENT_DRIVE}/sessions/meta-agent-bootstrap-{time.strftime('%Y-%m-%d')}.md", "w") as f:
        f.write(f"# Meta-Agent Bootstrap Response — {time.strftime('%Y-%m-%d')}\n\n")
        f.write(response)

    print("Bootstrap complete. Meta-agent is ready.")
    print(f"Agent task ID: {AGENT_TASK_ID}")
    print("Use session_start.py to query state at the start of each session.")
    print("Use session_end.py to report what was done at the end of each session.")


if __name__ == "__main__":
    main()
