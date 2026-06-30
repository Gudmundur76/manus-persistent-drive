#!/usr/bin/env bash
# =============================================================================
# bootstrap.sh — Fully self-contained session initialiser (v2 — 2026-06-30)
#
# PURPOSE: Run this at the START of every Manus session. One command does all:
#   0. Reads GitHub PAT from ~/Documents/Access.txt
#   1. Clones / updates manus-persistent-drive
#   2. Clones / updates ttruthdesk-platform (with push auth)
#   3. Installs codebase-memory-mcp binary if missing
#   4. Restores the knowledge graph from committed snapshot
#   5. Prints CURRENT_STATE.md summary + last compounding log entries
#   6. Prints session-end sync reminder
#
# ONE-COMMAND USAGE (fresh sandbox — paste this):
#   bash <(curl -fsSL https://raw.githubusercontent.com/Gudmundur76/manus-persistent-drive/main/scripts/bootstrap.sh)
#
# LOCAL USAGE (drive already cloned):
#   bash ~/repos/manus-persistent-drive/scripts/bootstrap.sh
#
# TRACK-AWARE LEGACY MODE (still supported):
#   bash ~/repos/manus-persistent-drive/scripts/bootstrap.sh <track_name>
# =============================================================================
set -euo pipefail

DRIVE_REPO="https://github.com/Gudmundur76/manus-persistent-drive.git"
PLATFORM_REPO="https://github.com/Gudmundur76/ttruthdesk-platform.git"
DRIVE_DIR="$HOME/repos/manus-persistent-drive"
PLATFORM_DIR="$HOME/repos/ttruthdesk-platform"
PAT_FILE="$HOME/Documents/Access.txt"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# ── Legacy track-aware mode (pass-through) ───────────────────────────────────
TRACK="${1:-}"
LEGACY_TASK_TYPES="main pipeline audit research parallel"
if [ -n "$TRACK" ] && ! echo "$LEGACY_TASK_TYPES" | grep -qw "$TRACK"; then
  # Track-aware mode — delegate to drive if already cloned
  if [ -d "$DRIVE_DIR/.git" ]; then
    cd "$DRIVE_DIR"
    git pull origin main --quiet 2>&1 || true
    echo "╔══════════════════════════════════════════════════════╗"
    echo "║   META-DEVELOPMENT COMMAND CENTRE — SESSION BOOT    ║"
    echo "╚══════════════════════════════════════════════════════╝"
    echo "  Track: $TRACK"
    echo ""
    echo "════ CURRENT_STATE.md ══════════════════════════════════"
    cat CURRENT_STATE.md
    echo ""
    echo "════ RECENT MEMORY (last 40 lines) ════════════════════"
    [ -f memory/compounding_log.md ] && tail -n 40 memory/compounding_log.md || true
    echo "✅ Bootstrap complete (track mode). Track: $TRACK"
    exit 0
  fi
fi

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║         MANUS PERSISTENT DRIVE — SESSION BOOTSTRAP v2           ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo "  Started : $TIMESTAMP"
echo ""

# ── Step 0: Read GitHub PAT ───────────────────────────────────────────────────
echo "▶ Step 0: GitHub PAT..."
GH_PAT=""
if [ -f "$PAT_FILE" ]; then
  GH_PAT=$(grep -i "GitHub PAT" "$PAT_FILE" 2>/dev/null | awk '{print $NF}' | tr -d '[:space:]' || true)
fi
if [ -n "$GH_PAT" ]; then
  echo "  ✓ PAT loaded from $PAT_FILE"
else
  echo "  ⚠ No PAT found in $PAT_FILE — will use gh CLI auth"
fi

auth_url() {
  local url="$1"
  if [ -n "$GH_PAT" ]; then
    echo "${url/https:\/\//https:\/\/${GH_PAT}@}"
  else
    echo "$url"
  fi
}

# ── Step 1: Clone or update persistent drive ─────────────────────────────────
echo ""
echo "▶ Step 1: Persistent drive..."
mkdir -p "$HOME/repos"
if [ -d "$DRIVE_DIR/.git" ]; then
  cd "$DRIVE_DIR"
  git remote set-url origin "$(auth_url $DRIVE_REPO)" 2>/dev/null || true
  git pull origin main --quiet 2>&1 || echo "  ⚠ Pull failed (offline?). Using cached state."
  echo "  ✓ Drive at: $(git log --oneline -1 2>/dev/null || echo 'unknown')"
else
  git clone "$(auth_url $DRIVE_REPO)" "$DRIVE_DIR" --quiet
  echo "  ✓ Cloned to $DRIVE_DIR"
fi

# ── Step 2: Clone or update ttruthdesk-platform ──────────────────────────────
echo ""
echo "▶ Step 2: ttruthdesk-platform..."
if [ -d "$PLATFORM_DIR/.git" ]; then
  cd "$PLATFORM_DIR"
  git remote set-url origin "$(auth_url $PLATFORM_REPO)" 2>/dev/null || true
  git pull origin main --quiet 2>&1 || echo "  ⚠ Pull failed. Using cached state."
  echo "  ✓ Platform at: $(git log --oneline -1 2>/dev/null || echo 'unknown')"
else
  git clone "$(auth_url $PLATFORM_REPO)" "$PLATFORM_DIR" --quiet
  echo "  ✓ Cloned to $PLATFORM_DIR"
fi
# Always ensure push auth is set
if [ -n "$GH_PAT" ]; then
  cd "$PLATFORM_DIR"
  git remote set-url origin "$(auth_url $PLATFORM_REPO)"
  echo "  ✓ Push auth configured"
fi

# ── Step 3: Install codebase-memory-mcp ──────────────────────────────────────
echo ""
echo "▶ Step 3: codebase-memory-mcp..."
export PATH="$HOME/.local/bin:$PATH"
if command -v codebase-memory &>/dev/null; then
  echo "  ✓ Already installed"
else
  echo "  Installing..."
  curl -fsSL https://raw.githubusercontent.com/DeusData/codebase-memory-mcp/main/install.sh \
    -o /tmp/cbm-install.sh 2>/dev/null \
    && bash /tmp/cbm-install.sh --skip-config 2>/dev/null \
    && echo "  ✓ Installed" \
    || echo "  ⚠ Auto-install failed — run manually if needed"
fi

# ── Step 4: Restore knowledge graph ──────────────────────────────────────────
echo ""
echo "▶ Step 4: Knowledge graph..."
GRAPH_GZ="$PLATFORM_DIR/.codebase-memory/graph.db.gz"
GRAPH_CACHE="$HOME/.cache/codebase-memory-mcp/graph.db"
if [ -f "$GRAPH_GZ" ]; then
  mkdir -p "$(dirname $GRAPH_CACHE)"
  gunzip -c "$GRAPH_GZ" > "$GRAPH_CACHE"
  echo "  ✓ Graph restored from snapshot"
  if command -v codebase-memory &>/dev/null; then
    codebase-memory index "$PLATFORM_DIR" --quiet 2>/dev/null \
      && echo "  ✓ Index refreshed" \
      || echo "  ⚠ Index refresh failed (non-fatal)"
  fi
else
  echo "  ⚠ No snapshot at $GRAPH_GZ"
fi

# ── Step 5: Print CURRENT_STATE.md summary ───────────────────────────────────
echo ""
echo "▶ Step 5: Current state..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "$DRIVE_DIR/CURRENT_STATE.md" ]; then
  head -65 "$DRIVE_DIR/CURRENT_STATE.md" | sed 's/^/  /'
else
  echo "  ⚠ CURRENT_STATE.md not found"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Step 6: Print last compounding log entries ────────────────────────────────
echo ""
echo "▶ Step 6: Recent compounding log (last 60 lines)..."
echo ""
CLOG="$DRIVE_DIR/compounding_log.md"
[ -f "$CLOG" ] && tail -60 "$CLOG" | sed 's/^/  /' || echo "  ⚠ No compounding log"

# ── Step 7: Latest phase log ─────────────────────────────────────────────────
echo ""
echo "▶ Step 7: Latest phase log..."
LATEST_PHASE=$(ls -t "$DRIVE_DIR/context/phase-log/"*.md 2>/dev/null | grep -v phase_log | head -1 || true)
if [ -n "$LATEST_PHASE" ]; then
  echo "  File: $(basename $LATEST_PHASE)"
  head -25 "$LATEST_PHASE" | sed 's/^/  /'
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                    BOOTSTRAP COMPLETE ✓                         ║"
echo "║                                                                  ║"
echo "║  Repos ready:                                                    ║"
echo "║    ~/repos/ttruthdesk-platform   (main codebase)                ║"
echo "║    ~/repos/manus-persistent-drive  (memory)                     ║"
echo "║                                                                  ║"
echo "║  AT SESSION END — run the sync:                                  ║"
echo "║    bash ~/repos/manus-persistent-drive/scripts/sync.sh          ║"
echo "║         \"<one-line summary of what was done>\"                    ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
