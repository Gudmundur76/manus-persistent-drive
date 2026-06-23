#!/usr/bin/env bash
# ============================================================
# notus-is Bootstrap Ritual — run at the START of every session
# ============================================================
# This script loads the persistent memory for the notus-is project.
# Always run this before making any changes to the notus-is codebase.

set -euo pipefail

DRIVE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
TRACK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║         notus.is — Session Bootstrap Ritual          ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Step 1: Pull latest state from GitHub
echo "→ Pulling latest persistent drive state..."
cd "$DRIVE_DIR"
git pull --ff-only origin main 2>/dev/null || echo "  (already up to date or no remote)"

# Step 2: Print CURRENT_STATE.md
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "CURRENT STATE:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat "$TRACK_DIR/CURRENT_STATE.md"

# Step 3: Print last 3 sprint logs
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "RECENT SPRINT LOGS (last 3):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
find "$TRACK_DIR/sprints" -name "session_log.md" | sort -r | head -3 | while read -r log; do
  echo ""
  echo "── $log ──"
  head -40 "$log"
  echo "..."
done

echo ""
echo "✓ Bootstrap complete. You are ready to work on notus.is."
echo "  Manus project: https://hivprotease-eq9ltmms.manus.space"
echo "  Latest checkpoint: f366efa6"
echo "  Run: pnpm test (should show 12/12 passing)"
echo ""
