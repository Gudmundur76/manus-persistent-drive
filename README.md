# manus-persistent-drive

**Persistent memory substrate for Manus agent sessions.**

This repository serves as the cross-session memory layer for the
[Protein Truth Desk](https://github.com/Gudmundur76/protein-truth-desk) project
and any parallel Manus tasks that work on it. Because Manus sandbox environments
reset between sessions, this repo is the single source of truth for project state,
KG data, session history, and service snapshots.

---

## Quick Start (New Session)

```bash
# 1. Clone this repo (if not already present)
gh repo clone Gudmundur76/manus-persistent-drive /home/ubuntu/manus-persistent-drive

# 2. Bootstrap — loads context, registers session, clones project repo
bash /home/ubuntu/manus-persistent-drive/scripts/bootstrap.sh my_session_id main

# 3. ... do your work ...

# 4. Sync — exports state, updates KG summary, pushes to GitHub
bash /home/ubuntu/manus-persistent-drive/scripts/sync.sh my_session_id "what I did"
```

---

## What Is Stored Here

| Path | Contents |
|---|---|
| `scripts/bootstrap.sh` | Session-start loader: pull, register, print context |
| `scripts/sync.sh` | Session-end exporter: export state, push to GitHub |
| `context/phase-log/phase_log.md` | Chronological log of every session |
| `context/kg/kg_summary.json` | Latest KG entity/claim/document counts |
| `context/task-registry/registry.json` | All sessions (active + complete) |
| `data/protein-truth-desk/schema/schema.ts` | Latest Drizzle schema (26 tables) |
| `data/protein-truth-desk/todo/todo.md` | Full todo list (389 items through Phase 65) |
| `data/protein-truth-desk/services/` | Full Phase 61-65 service implementations |
| `data/protein-truth-desk/pages/` | Full Phase 61-65 client page implementations |
| `data/protein-truth-desk/tests/` | All Phase 61-65 Vitest test files |
| `memory/knowledge_graph/graph_memory.py` | Python KG read/write wrapper (Phase 41) |
| `memory/vector/ruvector_memory.py` | RuVector semantic search wrapper (Phase 41) |
| `skills/all_skills_backup.tar.gz` | Manus skills backup |

---

## Project State

**Phases complete:** 1-65
**Webdev checkpoint:** 91c44bbb (canonical - all full implementations)
**GitHub repo:** https://github.com/Gudmundur76/protein-truth-desk
(Phases 1-38 full, 39-60 stubs, 61-65 full)
**TypeScript:** 0 errors after pnpm install

See TRUTH_DESK_INTEGRATION.md for the full protocol.

---

## Parallel Task Protocol

When the main agent spawns a parallel sub-task via the Manus API, the sub-task must:

1. Clone this repo and run bootstrap.sh with taskType=parallel
2. Read context/task-registry/registry.json to see what other tasks are running
3. Read context/kg/kg_summary.json for current KG state
4. Write discoveries back via POST /api/coord/memory/graph
5. Run sync.sh before terminating

---

*Last updated: Phase 65 catch-up - 2026-06-04*
