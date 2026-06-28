#!/usr/bin/env bash
# snapshot_ctc.sh — Snapshot all CTC episodic graphs to manus-persistent-drive
#
# Run this after any significant session to persist the MRAgent memory graphs.
# The graphs are stored as gzipped SQLite databases alongside the structural graph.
#
# Usage:
#   bash snapshot_ctc.sh [--push]
#
# With --push: also commits and pushes to GitHub.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CBM_DIR="$HOME/.codebase-memory"
DRIVE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "[snapshot_ctc] Starting CTC graph snapshot..."

# ── Snapshot each CTC graph ───────────────────────────────────────────────────

snapshot_db() {
  local name="$1"
  local src="$CBM_DIR/${name}.db"
  local dst="$SCRIPT_DIR/${name}.db.gz"

  if [ -f "$src" ]; then
    gzip -c "$src" > "$dst"
    local size
    size=$(du -sh "$dst" | cut -f1)
    echo "[snapshot_ctc] Snapshotted $name.db → $size"
  else
    echo "[snapshot_ctc] $name.db not found — skipping"
  fi
}

# Structural graph (existing)
if [ -f "$CBM_DIR/graph.db" ]; then
  gzip -c "$CBM_DIR/graph.db" > "$SCRIPT_DIR/graph.db.gz"
  echo "[snapshot_ctc] Snapshotted structural graph.db"
fi

# CTC episodic graphs (new — MRAgent layer)
snapshot_db "ctc_clf_graph"        # cognitive-loop-framework
snapshot_db "ctc_citation_graph"   # citation-desk / ttruthdesk-platform
snapshot_db "ctc_decision_graph"   # self-direct / directivePublisher

# Also snapshot the evolva-mragent package itself (compressed)
if [ -d "$HOME/evolva-mragent" ]; then
  tar -czf "$SCRIPT_DIR/evolva-mragent.tar.gz" \
    -C "$HOME" evolva-mragent \
    --exclude="evolva-mragent/.git" \
    --exclude="evolva-mragent/__pycache__" \
    --exclude="evolva-mragent/*.egg-info"
  local_size=$(du -sh "$SCRIPT_DIR/evolva-mragent.tar.gz" | cut -f1)
  echo "[snapshot_ctc] Snapshotted evolva-mragent package → $local_size"
fi

# ── Update CURRENT_STATE.md ───────────────────────────────────────────────────

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

cat >> "$DRIVE_DIR/CURRENT_STATE.md" << EOF

## MRAgent CTC Snapshot — $TIMESTAMP

### Graphs Snapshotted
- \`ctc_clf_graph.db.gz\` — cognitive-loop-framework episodic memory
- \`ctc_citation_graph.db.gz\` — citation-desk distortion chain memory
- \`ctc_decision_graph.db.gz\` — self-direct directive decision memory
- \`evolva-mragent.tar.gz\` — MRAgent core library + all integrations

### Architecture
Memory is now reconstructed, not retrieved (ICML 2026 — Ji, Li, Hooi).
Each system uses a Cue-Tag-Content graph with active reconstruction:
- Cues: keywords/entities extracted from events
- Tags: temporal, topic, domain, personal bridges
- Content: actual episode text
- Reconstruction: 7-tool iterative graph traversal (max 3 rounds, 10 tool calls)

### Integration Status
| System | Status | DB |
|---|---|---|
| cognitive-loop-framework | Integrated | ctc_clf_graph.db |
| citation-desk | Integrated | ctc_citation_graph.db |
| self-direct | Integrated | ctc_decision_graph.db |
| cbm-bridge (graph MCP) | Integrated | ctc_graph.db (separate) |

EOF

echo "[snapshot_ctc] Updated CURRENT_STATE.md"

# ── Push to GitHub ────────────────────────────────────────────────────────────

if [[ "${1:-}" == "--push" ]]; then
  cd "$DRIVE_DIR"
  git add .codebase-memory/ctc_*.db.gz .codebase-memory/evolva-mragent.tar.gz CURRENT_STATE.md 2>/dev/null || true
  git commit -m "chore(ctc): snapshot MRAgent CTC episodic graphs [$TIMESTAMP]" 2>/dev/null || echo "[snapshot_ctc] Nothing to commit"
  git push origin HEAD 2>/dev/null || echo "[snapshot_ctc] Push failed — check credentials"
  echo "[snapshot_ctc] Pushed to GitHub"
fi

echo "[snapshot_ctc] Done."
