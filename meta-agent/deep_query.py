#!/usr/bin/env python3
"""
deep_query.py — Evolva Meta-Agent: Async Deep Research Query

Use when you need Manus to do real research (not just read local files).
Creates a Manus task and polls until complete. Takes 5-15 minutes.

Usage:
    python3 /home/ubuntu/meta-agent/deep_query.py "Research the best approach for X"
    python3 /home/ubuntu/meta-agent/deep_query.py --check TASK_ID
"""

import os
import sys
import json
import time
import argparse
import requests

MANUS_API_KEY = os.environ.get("MANUS_API_KEY", "")
API_BASE = "https://api.manus.ai/v2"
TASKS_FILE = "/home/ubuntu/meta-agent/pending_tasks.json"

HEADERS = {
    "Content-Type": "application/json",
    "x-manus-api-key": MANUS_API_KEY,
}


def create_task(query: str) -> str:
    resp = requests.post(
        f"{API_BASE}/task.create",
        headers=HEADERS,
        json={"message": {"content": query}},
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    task_id = data.get("task_id", "")
    task_url = data.get("task_url", "")
    print(f"Task created: {task_id}")
    print(f"View at: {task_url}")

    # Save to pending tasks
    pending = {}
    if os.path.exists(TASKS_FILE):
        with open(TASKS_FILE) as f:
            pending = json.load(f)
    pending[task_id] = {
        "query": query[:100],
        "created": time.strftime("%Y-%m-%d %H:%M UTC"),
        "url": task_url,
        "status": "running",
    }
    with open(TASKS_FILE, "w") as f:
        json.dump(pending, f, indent=2)

    return task_id


def check_task(task_id: str) -> dict:
    resp = requests.get(
        f"{API_BASE}/task.listMessages",
        headers=HEADERS,
        params={"task_id": task_id, "order": "desc", "limit": 20},
        timeout=15,
    )
    resp.raise_for_status()
    messages = resp.json().get("messages", [])

    result = {"status": "running", "response": "", "structured": None}

    for msg in messages:
        t = msg.get("type")
        if t == "status_update":
            result["status"] = msg["status_update"]["agent_status"]
        elif t == "structured_output_result":
            sor = msg.get("structured_output_result", {})
            result["structured"] = sor.get("value") or sor.get("output")
        elif t == "assistant_message" and not result["response"]:
            result["response"] = msg.get("assistant_message", {}).get("content", "")

    return result


def poll_task(task_id: str, timeout: int = 900) -> dict:
    """Poll until done. Default 15 min timeout."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        result = check_task(task_id)
        status = result["status"]
        print(f"  [{time.strftime('%H:%M:%S')}] {status}")
        if status in ("stopped", "error"):
            return result
        time.sleep(15)
    return {"status": "timeout", "response": "", "structured": None}


def main():
    parser = argparse.ArgumentParser(description="Async deep research query via Manus API")
    parser.add_argument("query", nargs="?", default="", help="Research query")
    parser.add_argument("--check", default="", help="Check status of existing task ID")
    parser.add_argument("--wait", action="store_true", help="Wait for completion (up to 15 min)")
    args = parser.parse_args()

    if args.check:
        print(f"Checking task {args.check}...")
        result = check_task(args.check)
        print(f"Status: {result['status']}")
        if result["structured"]:
            print(f"Structured output:\n{json.dumps(result['structured'], indent=2)}")
        elif result["response"]:
            print(f"Response:\n{result['response'][:2000]}")
        return

    if not args.query:
        print("Usage: python3 deep_query.py 'Your research question'")
        sys.exit(1)

    task_id = create_task(args.query)

    if args.wait:
        print("Waiting for completion (up to 15 min)...")
        result = poll_task(task_id)
        print(f"\nStatus: {result['status']}")
        if result["structured"]:
            print(f"Structured output:\n{json.dumps(result['structured'], indent=2)}")
        elif result["response"]:
            print(f"Response:\n{result['response'][:3000]}")
    else:
        print(f"\nTask submitted. Check later with:")
        print(f"  python3 /home/ubuntu/meta-agent/deep_query.py --check {task_id}")
        print(f"  python3 /home/ubuntu/meta-agent/deep_query.py --check {task_id} --wait")


if __name__ == "__main__":
    main()
