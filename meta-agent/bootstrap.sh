#!/usr/bin/env bash
# bootstrap.sh — Evolva Meta-Agent full session bootstrap
#
# Run this at the START of every Manus development session.
# It does four things in order:
#   1. Restores codebase-memory-mcp graphs for all repos
#   2. Queries the Evolva Meta-Agent for current project state
#   3. Prints the context brief so Manus reads it before touching code
#   4. Sets up the session_end alias for easy reporting
#
# Usage:
#   bash /home/ubuntu/meta-agent/bootstrap.sh [--task "description of today's work"]
#
# Example:
#   bash /home/ubuntu/meta-agent/bootstrap.sh --task "Build evolva-mragent FastAPI server"

set -e
export PATH="$HOME/.local/bin:$PATH"

TASK="${2:-}"
if [ "$1" = "--task" ]; then
  TASK="$2"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║         EVOLVA META-AGENT SESSION BOOTSTRAP              ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Restore codebase-memory graphs ────────────────────────────────────
echo "[1/3] Restoring codebase-memory graphs..."
bash /home/ubuntu/repos/manus-persistent-drive/scripts/bootstrap-codebase-memory.sh 2>/dev/null \
  || echo "  Warning: codebase-memory bootstrap had issues, continuing..."
echo ""

# ── Step 2: Query meta-agent for current state ────────────────────────────────
echo "[2/3] Querying Evolva Meta-Agent for project state..."
if [ -n "$TASK" ]; then
  python3 /home/ubuntu/meta-agent/session_start.py --task "$TASK"
else
  python3 /home/ubuntu/meta-agent/session_start.py
fi
echo ""

# ── Step 3: Set up session_end alias ─────────────────────────────────────────
echo "[3/3] Session end alias ready."
echo ""
echo "  To report session end:"
echo "  python3 /home/ubuntu/meta-agent/session_end.py \\"
echo "    --what 'What you built' \\"
echo "    --phase 'Phase N — name' \\"
echo "    --blockers 'Any blockers' \\"
echo "    --push --pat YOUR_PAT"
echo ""
echo "  To ask a mid-session question:"
echo "  python3 /home/ubuntu/meta-agent/query.py 'Your question'"
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Context loaded. Ready to develop.                       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
