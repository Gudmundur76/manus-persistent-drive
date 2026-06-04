#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# bootstrap.sh — Session-start persistent memory loader
#
# PURPOSE: Run this at the START of every Manus agent session to:
#   1. Pull the latest state from GitHub
#   2. Load the current session context into the agent's working memory
#   3. Register this session in the task registry
#   4. Print a summary of where the project stands
#
# USAGE:
#   cd /home/ubuntu
#   git clone https://github.com/Gudmundur76/manus-persistent-drive.git
#   bash manus-persistent-drive/scripts/bootstrap.sh [SESSION_ID] [TASK_TYPE]
#
# ARGUMENTS:
#   SESSION_ID  — unique identifier for this session (default: timestamp)
#   TASK_TYPE   — one of: main | pipeline | audit | research | parallel
#
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DRIVE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SESSION_ID="${1:-session_$(date +%Y%m%d_%H%M%S)}"
TASK_TYPE="${2:-main}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         MANUS PERSISTENT DRIVE — SESSION BOOTSTRAP          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "  Session ID : $SESSION_ID"
echo "  Task Type  : $TASK_TYPE"
echo "  Timestamp  : $TIMESTAMP"
echo "  Drive Dir  : $DRIVE_DIR"
echo ""

# ── Step 1: Pull latest state from GitHub ────────────────────────────────────
echo "▶ Step 1: Pulling latest state from GitHub..."
cd "$DRIVE_DIR"
git pull origin main --quiet 2>&1 || echo "  ⚠ Could not pull (offline?). Using cached state."
echo "  ✓ Drive is at: $(git log --oneline -1)"
echo ""

# ── Step 2: Register this session ────────────────────────────────────────────
echo "▶ Step 2: Registering session..."
SESSION_FILE="$DRIVE_DIR/sessions/current/${SESSION_ID}.json"
cat > "$SESSION_FILE" << SESSIONEOF
{
  "sessionId": "$SESSION_ID",
  "taskType": "$TASK_TYPE",
  "startedAt": "$TIMESTAMP",
  "status": "active",
  "host": "$(hostname)",
  "pid": $$,
  "projectRepo": "https://github.com/Gudmundur76/protein-truth-desk",
  "driveRepo": "https://github.com/Gudmundur76/manus-persistent-drive",
  "checkpointRef": "91c44bbb",
  "notes": ""
}
SESSIONEOF
echo "  ✓ Session registered: $SESSION_FILE"
echo ""

# ── Step 3: Load project state ────────────────────────────────────────────────
echo "▶ Step 3: Loading project state..."

PHASE_LOG="$DRIVE_DIR/context/phase-log/phase_log.md"
if [ -f "$PHASE_LOG" ]; then
  echo "  Phase log found. Last 10 lines:"
  tail -10 "$PHASE_LOG" | sed 's/^/    /'
else
  echo "  ⚠ No phase log found. Starting fresh."
fi
echo ""

TODO_FILE="$DRIVE_DIR/data/protein-truth-desk/todo/todo.md"
if [ -f "$TODO_FILE" ]; then
  COMPLETED=$(grep -c '^\- \[x\]' "$TODO_FILE" 2>/dev/null || echo 0)
  PENDING=$(grep -c '^\- \[ \]' "$TODO_FILE" 2>/dev/null || echo 0)
  echo "  Todo status: $COMPLETED completed, $PENDING pending"
else
  echo "  ⚠ No todo.md found in drive."
fi
echo ""

# ── Step 4: Load KG summary ───────────────────────────────────────────────────
echo "▶ Step 4: Knowledge graph summary..."
KG_SUMMARY="$DRIVE_DIR/context/kg/kg_summary.json"
if [ -f "$KG_SUMMARY" ]; then
  echo "  KG summary:"
  cat "$KG_SUMMARY" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(f'    Entities: {d.get(\"entity_count\",0)}')
print(f'    Claims:   {d.get(\"claim_count\",0)}')
print(f'    Docs:     {d.get(\"document_count\",0)}')
print(f'    Updated:  {d.get(\"updated_at\",\"unknown\")}')
" 2>/dev/null || echo "  ⚠ Could not parse KG summary."
else
  echo "  ⚠ No KG summary found. Run sync.sh after first pipeline run."
fi
echo ""

# ── Step 5: Print task registry ───────────────────────────────────────────────
echo "▶ Step 5: Active parallel tasks..."
REGISTRY="$DRIVE_DIR/context/task-registry/registry.json"
if [ -f "$REGISTRY" ]; then
  python3 -c "
import json,sys
with open('$REGISTRY') as f:
  tasks = json.load(f)
active = [t for t in tasks if t.get('status') in ('active','pending')]
if active:
  for t in active:
    print(f'    [{t[\"status\"]}] {t[\"sessionId\"]} — {t[\"taskType\"]} (started {t[\"startedAt\"]})')
else:
  print('    No active parallel tasks.')
" 2>/dev/null || echo "  ⚠ Could not parse registry."
else
  echo "  No registry found. This is the first session."
fi
echo ""

# ── Step 6: Clone or update protein-truth-desk ────────────────────────────────
echo "▶ Step 6: Ensuring protein-truth-desk repo is available..."
PROJECT_DIR="/home/ubuntu/protein-truth-desk-full"
if [ -d "$PROJECT_DIR/.git" ]; then
  echo "  Repo exists at $PROJECT_DIR. Pulling..."
  cd "$PROJECT_DIR" && git pull origin main --quiet 2>&1 || echo "  ⚠ Pull failed."
  echo "  ✓ At: $(git log --oneline -1)"
else
  echo "  Cloning protein-truth-desk..."
  cd /home/ubuntu && gh repo clone Gudmundur76/protein-truth-desk protein-truth-desk-full
  echo "  ✓ Cloned to $PROJECT_DIR"
fi
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    BOOTSTRAP COMPLETE                        ║"
echo "║                                                              ║"
echo "║  Next steps:                                                 ║"
echo "║  1. Read context/phase-log/phase_log.md for history         ║"
echo "║  2. Read data/protein-truth-desk/todo/todo.md for tasks     ║"
echo "║  3. Run: bash scripts/sync.sh $SESSION_ID at session end    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
