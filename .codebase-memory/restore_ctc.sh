#!/usr/bin/env bash
# restore_ctc.sh — Restore all CTC episodic graphs from manus-persistent-drive
#
# Run this at the start of a new sandbox session to restore the MRAgent memory.
# Should be called AFTER restore_graph.sh (which restores the structural graph).
#
# Usage:
#   bash restore_ctc.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CBM_DIR="$HOME/.codebase-memory"

echo "[restore_ctc] Restoring CTC episodic graphs..."

mkdir -p "$CBM_DIR"

# ── Restore each CTC graph ────────────────────────────────────────────────────

restore_db() {
  local name="$1"
  local src="$SCRIPT_DIR/${name}.db.gz"
  local dst="$CBM_DIR/${name}.db"

  if [ -f "$src" ]; then
    gunzip -c "$src" > "$dst"
    local size
    size=$(du -sh "$dst" | cut -f1)
    echo "[restore_ctc] Restored $name.db ← $size"
  else
    echo "[restore_ctc] $name.db.gz not found — skipping (will be created on first ingest)"
  fi
}

restore_db "ctc_clf_graph"        # cognitive-loop-framework
restore_db "ctc_citation_graph"   # citation-desk
restore_db "ctc_decision_graph"   # self-direct

# ── Restore evolva-mragent package ───────────────────────────────────────────

if [ -f "$SCRIPT_DIR/evolva-mragent.tar.gz" ]; then
  if [ ! -d "$HOME/evolva-mragent" ]; then
    tar -xzf "$SCRIPT_DIR/evolva-mragent.tar.gz" -C "$HOME"
    echo "[restore_ctc] Extracted evolva-mragent package"
  else
    echo "[restore_ctc] evolva-mragent already present — skipping extraction"
  fi

  # Install in editable mode if not already installed
  if ! python3 -c "import evolva_mragent" 2>/dev/null; then
    pip3 install -e "$HOME/evolva-mragent" -q
    echo "[restore_ctc] Installed evolva-mragent package"
  else
    echo "[restore_ctc] evolva-mragent already installed"
  fi
fi

echo "[restore_ctc] CTC restore complete."
echo ""
echo "Available CTC graphs:"
for db in "$CBM_DIR"/ctc_*.db; do
  if [ -f "$db" ]; then
    size=$(du -sh "$db" | cut -f1)
    name=$(basename "$db")
    echo "  $name ($size)"
  fi
done
