#!/usr/bin/env bash
# =============================================================================
# sync.sh — Session-end persistent memory sync (v2 — 2026-06-30)
#
# PURPOSE: Run this at the END of every Manus session. It:
#   1. Appends a session entry to compounding_log.md
#   2. Updates CURRENT_STATE.md repo state table with latest commits + test counts
#   3. Exports schema.ts and todo.md from ttruthdesk-platform
#   4. Commits and pushes manus-persistent-drive to GitHub
#
# USAGE:
#   bash ~/repos/manus-persistent-drive/scripts/sync.sh "what was done this session"
#
# =============================================================================
set -euo pipefail

DRIVE_DIR="$HOME/repos/manus-persistent-drive"
PLATFORM_DIR="$HOME/repos/ttruthdesk-platform"
PAT_FILE="$HOME/Documents/Access.txt"
COMMIT_MSG="${1:-session sync}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
SESSION_ID="session_$(date +%Y%m%d_%H%M%S)"

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║           MANUS PERSISTENT DRIVE — SESSION SYNC v2              ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo "  Session  : $SESSION_ID"
echo "  Timestamp: $TIMESTAMP"
echo "  Message  : $COMMIT_MSG"
echo ""

# ── Step 0: Read PAT ─────────────────────────────────────────────────────────
GH_PAT=""
if [ -f "$PAT_FILE" ]; then
  GH_PAT=$(grep -i "GitHub PAT" "$PAT_FILE" 2>/dev/null | awk '{print $NF}' | tr -d '[:space:]' || true)
fi

auth_url() {
  local url="$1"
  if [ -n "$GH_PAT" ]; then
    echo "${url/https:\/\//https:\/\/${GH_PAT}@}"
  else
    echo "$url"
  fi
}

# ── Step 1: Get latest commit info from ttruthdesk-platform ──────────────────
echo "▶ Step 1: Reading ttruthdesk-platform state..."
PLATFORM_COMMIT="unknown"
PLATFORM_TESTS="unknown"
if [ -d "$PLATFORM_DIR/.git" ]; then
  PLATFORM_COMMIT=$(cd "$PLATFORM_DIR" && git log --oneline -1 2>/dev/null || echo "unknown")
  echo "  ✓ Platform commit: $PLATFORM_COMMIT"
fi

# ── Step 2: Export schema.ts ──────────────────────────────────────────────────
echo ""
echo "▶ Step 2: Exporting schema.ts..."
SCHEMA_SRC="$PLATFORM_DIR/drizzle/schema.ts"
SCHEMA_DST="$DRIVE_DIR/data/protein-truth-desk/schema.ts"
if [ -f "$SCHEMA_SRC" ]; then
  cp "$SCHEMA_SRC" "$SCHEMA_DST"
  TABLE_COUNT=$(grep -c "^export const.*mysqlTable\|^export const.*sqliteTable" "$SCHEMA_SRC" 2>/dev/null || echo "?")
  echo "  ✓ schema.ts exported ($TABLE_COUNT tables)"
else
  echo "  ⚠ No schema.ts found at $SCHEMA_SRC"
fi

# ── Step 3: Export todo.md ────────────────────────────────────────────────────
echo ""
echo "▶ Step 3: Exporting todo.md..."
TODO_SRC="$PLATFORM_DIR/todo.md"
TODO_DST="$DRIVE_DIR/data/protein-truth-desk/todo.md"
if [ -f "$TODO_SRC" ]; then
  cp "$TODO_SRC" "$TODO_DST"
  DONE=$(grep -c '^\- \[x\]' "$TODO_SRC" 2>/dev/null || echo 0)
  PENDING=$(grep -c '^\- \[ \]' "$TODO_SRC" 2>/dev/null || echo 0)
  echo "  ✓ todo.md exported ($DONE done, $PENDING pending)"
else
  echo "  ⚠ No todo.md found at $TODO_SRC"
fi

# ── Step 4: Append to compounding_log.md ─────────────────────────────────────
echo ""
echo "▶ Step 4: Appending to compounding_log.md..."
CLOG="$DRIVE_DIR/compounding_log.md"
cat >> "$CLOG" << LOGEOF

---

## Session $SESSION_ID — $TIMESTAMP

**Message:** $COMMIT_MSG

**ttruthdesk-platform:** $PLATFORM_COMMIT

LOGEOF
echo "  ✓ Appended to compounding_log.md"

# ── Step 5: Update phase_log.md ───────────────────────────────────────────────
echo ""
echo "▶ Step 5: Updating phase_log.md..."
PHASE_LOG="$DRIVE_DIR/context/phase-log/phase_log.md"
cat >> "$PHASE_LOG" << PHASEEOF
## Session: $SESSION_ID — $TIMESTAMP
- **Commit**: $PLATFORM_COMMIT
- **Drive commit**: $(cd "$DRIVE_DIR" && git log --oneline -1 2>/dev/null || echo "unknown")
- **Sync message**: $COMMIT_MSG
PHASEEOF
echo "  ✓ Phase log updated"

# ── Step 6: Commit and push drive ─────────────────────────────────────────────
echo ""
echo "▶ Step 6: Committing and pushing persistent drive..."
cd "$DRIVE_DIR"
git config user.email "ttruthdesk@manus.ai" 2>/dev/null || true
git config user.name "Manus" 2>/dev/null || true
if [ -n "$GH_PAT" ]; then
  git remote set-url origin "$(auth_url https://github.com/Gudmundur76/manus-persistent-drive.git)"
fi
git add -A
if git diff --cached --quiet; then
  echo "  ✓ Nothing to commit (drive already up to date)"
else
  git commit -m "sync: $SESSION_ID — $COMMIT_MSG ($TIMESTAMP)"
  git push origin main
  echo "  ✓ Pushed to GitHub"
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                      SYNC COMPLETE ✓                            ║"
echo "║                                                                  ║"
echo "║  Persistent drive is up to date on GitHub.                      ║"
echo "║  Next session starts with:                                       ║"
echo "║    bash <(curl -fsSL https://raw.githubusercontent.com/         ║"
echo "║      Gudmundur76/manus-persistent-drive/main/scripts/           ║"
echo "║      bootstrap.sh)                                               ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
