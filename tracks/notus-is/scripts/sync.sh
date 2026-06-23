#!/usr/bin/env bash
# ============================================================
# notus-is Sync Ritual — run at the END of every session
# ============================================================
# Usage: ./sync.sh "Sprint 2 — SwissADME integration"
# This script commits the session log and updated state to GitHub.

set -euo pipefail

DRIVE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
TRACK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SPRINT_NAME="${1:-session-$(date +%Y-%m-%d)}"
SPRINT_SLUG=$(echo "$SPRINT_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g')
SPRINT_DIR="$TRACK_DIR/sprints/$SPRINT_SLUG"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║          notus.is — Session Sync Ritual              ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Step 1: Create sprint directory if it doesn't exist
mkdir -p "$SPRINT_DIR"

# Step 2: Prompt for session log if it doesn't exist
if [ ! -f "$SPRINT_DIR/session_log.md" ]; then
  echo "→ Creating session log at $SPRINT_DIR/session_log.md"
  cat > "$SPRINT_DIR/session_log.md" << TEMPLATE
# $SPRINT_NAME

**Date:** $(date +%Y-%m-%d)
**Manus checkpoint:** [FILL IN]
**Tests:** [X]/12 passing | TypeScript: 0 errors

---

## What Was Built

[FILL IN]

---

## Key Decisions Made

[FILL IN]

---

## Blockers Encountered

[FILL IN]

---

## Next Sprint Priorities

[FILL IN]
TEMPLATE
  echo "  Created. Please fill in the session log before committing."
  echo "  File: $SPRINT_DIR/session_log.md"
fi

# Step 3: Commit and push
echo ""
echo "→ Committing to persistent drive..."
cd "$DRIVE_DIR"
git add -A
git config user.email "manus-agent@notus.is" 2>/dev/null || true
git config user.name "Manus Agent" 2>/dev/null || true
git commit -m "notus-is: sync session — $SPRINT_NAME" || echo "  (nothing to commit)"
git push origin main

echo ""
echo "✓ Sync complete. Session state committed to GitHub."
echo "  Repo: https://github.com/Gudmundur76/manus-persistent-drive"
echo "  Track: tracks/notus-is/"
echo ""
