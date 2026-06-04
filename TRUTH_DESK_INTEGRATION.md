# Protein Truth Desk — Persistent Memory Integration Protocol

**Version:** 2.0 (Phase 65 catch-up, 2026-06-04)
**Drive repo:** https://github.com/Gudmundur76/manus-persistent-drive
**Project repo:** https://github.com/Gudmundur76/protein-truth-desk
**Webdev checkpoint:** `91c44bbb` (canonical — contains all full implementations)

---

## Why This File Exists

Manus sandbox sessions are ephemeral. Every new session starts with a clean filesystem,
and the webdev checkpoint (`91c44bbb`) is the only place the full deployed codebase lives.
This repository is the **persistent memory layer** that bridges sessions — it stores project
state, schema snapshots, service implementations, test files, KG summaries, and session
history so that any new agent session (main task or parallel sub-task) can bootstrap itself
to the correct context in under 60 seconds.

**The rule is simple: every session starts with `bootstrap.sh` and ends with `sync.sh`.**

---

## Repository Structure

```
manus-persistent-drive/
├── scripts/
│   ├── bootstrap.sh          ← Run at session START
│   └── sync.sh               ← Run at session END
├── sessions/
│   ├── current/              ← Active session JSON files
│   └── history/              ← Completed session JSON files
├── context/
│   ├── phase-log/
│   │   └── phase_log.md      ← Chronological log of all sessions and phases
│   ├── kg/
│   │   └── kg_summary.json   ← Latest KG entity/claim/document counts
│   └── task-registry/
│       └── registry.json     ← All sessions (active + complete)
├── data/
│   └── protein-truth-desk/
│       ├── schema/
│       │   └── schema.ts     ← Latest drizzle schema (26 tables as of Phase 65)
│       ├── todo/
│       │   └── todo.md       ← Full todo list (389 items, all complete through Phase 65)
│       ├── services/         ← Full implementations of key Phase 61-65 services
│       ├── pages/            ← Full implementations of key Phase 61-65 client pages
│       └── tests/            ← All Phase 61-65 Vitest test files
├── memory/
│   ├── knowledge_graph/
│   │   └── graph_memory.py   ← Python KG read/write wrapper (Phase 41)
│   └── vector/
│       └── ruvector_memory.py ← RuVector semantic search wrapper (Phase 41)
└── skills/
    └── all_skills_backup.tar.gz ← Manus skills backup
```

---

## Session Protocol

### Starting a New Session

Every Manus agent session — whether the main task or a parallel sub-task — **must** begin with:

```bash
# If the drive is not yet cloned:
gh repo clone Gudmundur76/manus-persistent-drive /home/ubuntu/manus-persistent-drive

# Bootstrap (pulls latest state, registers session, prints context summary):
bash /home/ubuntu/manus-persistent-drive/scripts/bootstrap.sh SESSION_ID TASK_TYPE
```

Where `TASK_TYPE` is one of: `main | pipeline | audit | research | parallel`.

The bootstrap script will:
1. Pull the latest state from GitHub
2. Register the session in `context/task-registry/registry.json`
3. Print the phase log tail, todo counts, KG summary, and active parallel tasks
4. Clone or update the `protein-truth-desk` repo at `/home/ubuntu/protein-truth-desk-full`

### Ending a Session

Every session **must** end with:

```bash
bash /home/ubuntu/manus-persistent-drive/scripts/sync.sh SESSION_ID "brief description of work done"
```

The sync script will:
1. Export `todo.md`, `schema.ts`, and all non-stub service files
2. Append an entry to `context/phase-log/phase_log.md`
3. Update `context/kg/kg_summary.json`
4. Mark the session complete in the task registry
5. Commit and push everything to GitHub

---

## Project State as of Phase 65

### Database Schema (26 tables)

| Table | Phase | Purpose |
|---|---|---|
| `users` | 1 | Auth and roles |
| `documents` | 1 | PubMed/source documents |
| `claims` | 1 | Extracted protein claims |
| `graph_entities` | 10 | Named entities (proteins, compounds, etc.) |
| `graph_edges` | 10 | Entity relationships |
| `audit_reports` | 20 | Quality audit results per document |
| `coord_tasks` | 41 | Coordination layer task registry |
| `coord_queue` | 41 | Work queue for parallel pipeline runs |
| `coord_context` | 41 | Shared KV context store for agents |
| `notification_settings` | 50 | Per-user notification preferences |
| `vertical_alerts` | 50 | Per-user vertical domain alert subscriptions |
| `notification_log` | 50 | Sent notification history |
| `claim_provenance_steps` | 61 | Step-by-step audit trail per claim |
| `entity_cooccurrences` | 63 | Entity pair co-occurrence counts per document |
| `confidence_history` | 64 | Time-series confidence scores per claim |
| `api_keys` | 65 | API key management (hash, scopes, expiry) |

### Phases Complete

Phases 1–65 are complete. The webdev checkpoint `91c44bbb` contains the full deployed
application. The GitHub repo (`protein-truth-desk`) contains:

- **Phases 1–38**: Full implementations
- **Phases 39–60**: Stub files (full implementations only in checkpoint `91c44bbb`)
- **Phases 61–65**: Full implementations

### Pending Work (Phase 66+)

1. **Wire API key auth into the v2 REST layer** — add `Authorization: Bearer <key>` middleware to `apiV2Router.ts`
2. **Trigger confidence recording automatically** — call `recordConfidence` at end of each document pipeline run
3. **Restore Phase 39–60 full implementations from checkpoint** — replace stubs with real code from `91c44bbb`
4. **Activate the coordination layer** — set `MANUS_API_KEY` and test orchestrator spawning sub-tasks

---

## Coordination Layer (Phase 41)

Truth Desk runs a swarm of parallel Manus tasks that process scientific papers across
multiple research verticals. These tasks coordinate through the database-backed
**Coordination Layer**.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Truth Desk Server                        │
│  ┌──────────────┐   ┌──────────────┐   ┌─────────────────┐ │
│  │  coord_tasks │   │  coord_queue │   │  coord_context  │ │
│  │  (registry)  │   │  (work items)│   │  (KG + memory)  │ │
│  └──────────────┘   └──────────────┘   └─────────────────┘ │
│                    /api/coord/* REST API                     │
│                    (x-coord-key auth)                        │
└─────────────────────────────────────────────────────────────┘
         ↑                                    ↑
    ┌────┴──────────┐               ┌─────────┴──────────┐
    │  Manus API    │               │  Manus Agent Tasks  │
    │  (v2)         │               │  (parallel)         │
    └───────────────┘               └────────────────────┘
```

### REST API Reference

**Base URL:** `https://<your-truth-desk-domain>/api/coord`
**Auth:** `X-Coord-Key: <COORD_API_KEY>`

| Endpoint | Method | Purpose |
|---|---|---|
| `/tasks/register` | POST | Announce a new parallel task |
| `/tasks/heartbeat` | POST | Update last-seen timestamp + phase |
| `/tasks/complete` | POST | Mark task as done |
| `/tasks/fail` | POST | Mark task as failed with error |
| `/tasks` | GET | List all running/pending tasks |
| `/queue/enqueue` | POST | Add items to the work queue |
| `/queue/dequeue` | POST | Claim the next item for a task |
| `/queue/complete` | POST | Mark an item as processed |
| `/queue/fail` | POST | Mark an item as failed (with retry flag) |
| `/queue/stats` | GET | Queue depth by vertical and status |
| `/context` | GET | List all keys in a namespace |
| `/context/:key` | GET/PUT/DELETE | Read/write/delete a value |
| `/memory/graph` | GET | Export full KG as {nodes, edges} JSON |
| `/memory/graph/node` | POST | Add a KG node |
| `/memory/graph/edge` | POST | Add a KG edge |

### Configuration

```env
# Manus API key (from https://manus.ai → Settings → API)
MANUS_API_KEY=your_manus_api_key_here

# Shared secret for /api/coord/* endpoints
COORD_API_KEY=generate_a_random_32_char_secret
```

---

## Knowledge Graph Patterns (Phase 41)

### `memory/knowledge_graph/graph_memory.py`

Truth Desk's `coord_context` table implements the same node/edge pattern as `graph_memory.py`,
but stored in MySQL instead of JSON files.

| `graph_memory.py` method | Truth Desk REST endpoint |
|---|---|
| `add_node(id, label, properties)` | `POST /api/coord/memory/graph/node` |
| `add_edge(source, target, relation)` | `POST /api/coord/memory/graph/edge` |
| `export_graph()` | `GET /api/coord/memory/graph` |
| `search_nodes(query)` | `GET /api/coord/context?namespace=graph` |

### `memory/vector/ruvector_memory.py`

Semantic search over the KG is handled by Truth Desk's vector infrastructure. The
`coord_context` namespace `"vector"` stores embedding metadata, while actual vectors
are stored in the `graph_entities` table.

---

## LLM Strategy

| Stage | Model Tier | Purpose |
|---|---|---|
| Initial seeding / bulk extraction | Free tier (`FREE_MODEL_ROTATION`) | Cost-effective volume processing |
| Quality scoring / contradiction detection | Quality tier (OpenRouter best available) | Accuracy-critical decisions |
| Claim verification / audit | Quality tier | Final truth validation |

The `FREE_MODEL_ROTATION` pool (in `server/_core/multiLLM.ts`):
- `meta-llama/llama-3.3-70b-instruct:free`
- `google/gemma-3-27b-it:free`
- `mistralai/mistral-7b-instruct:free`

---

## Key Files for New Sessions

Read these files in order to get full context at the start of any session:

1. `context/phase-log/phase_log.md` — what happened in previous sessions
2. `data/protein-truth-desk/todo/todo.md` — full feature list and completion status
3. `data/protein-truth-desk/schema/schema.ts` — current database schema
4. `context/kg/kg_summary.json` — KG state
5. `context/task-registry/registry.json` — active parallel tasks

Then clone the project repo and install dependencies:

```bash
gh repo clone Gudmundur76/protein-truth-desk /home/ubuntu/protein-truth-desk-full
cd /home/ubuntu/protein-truth-desk-full && pnpm install
npx tsc --noEmit  # should report 0 errors
```

---

*Last updated: Phase 65 catch-up — 2026-06-04*
