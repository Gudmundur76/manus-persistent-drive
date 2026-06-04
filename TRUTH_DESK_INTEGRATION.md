# Protein Truth Desk — Persistent Memory Integration Protocol

**Version:** 4.0 (Phase 70 second-pass security hardening, 2026-06-04)
**Drive repo:** https://github.com/Gudmundur76/manus-persistent-drive
**Project repo:** https://github.com/Gudmundur76/protein-truth-desk
**Live site:** https://protein-desk-5r5rzpyg.manus.space/
**Webdev checkpoint:** `b98a0483` (canonical — all P0/P1 security fixes genuinely complete)

---

## Why This File Exists

Manus sandbox sessions are ephemeral. Every new session starts with a clean filesystem,
and the webdev checkpoint (`b98a0483`) is the only place the full deployed codebase lives.
This repository is the **persistent memory layer** that bridges sessions — it stores project
state, schema snapshots, service implementations, test files, KG summaries, and session
history so that any new agent session (main task or parallel sub-task) can bootstrap itself
to the correct context in under 60 seconds.

**The rule is simple: every session starts with `bootstrap.sh` and ends with `sync.sh`.**

### Quick Bootstrap for a New Chat Session

Paste this as the first message in a new Manus session:

```
Project: Protein Truth Desk — scientific claim verification platform

Live site: https://protein-desk-5r5rzpyg.manus.space/
Source repo: https://github.com/Gudmundur76/protein-truth-desk
Memory repo (phase log + snapshots): https://github.com/Gudmundur76/manus-persistent-drive

Start by cloning both repos, reading manus-persistent-drive/TRUTH_DESK_INTEGRATION.md
and manus-persistent-drive/context/phase-log/, then reading protein-truth-desk/todo.md.

Current checkpoint: b98a0483 (webdev project protein-truth-desk)
Phase: 70 complete. All P0/P1 security fixes done. 659 Vitest tests passing.

Next tasks (Phase 71-73):
1. Redis-backed rate limiter — replace in-memory validateApiKey rate limiter with
   Upstash Redis so the limit holds across Cloud Run cold starts
2. CoordinatorDashboard live polling — add 30-second setInterval refetch to
   CoordinatorDashboard.tsx so queue depth and active task counts update without reload
3. COORD_API_KEY rotation UI — one-click key rotation button in the Admin panel

Security invariants that must not be reverted:
- JWT_SECRET throws at startup if missing (server/_core/env.ts)
- Session cookie: SameSite=Lax, httpOnly=true (server/_core/cookies.ts)
- All /api/admin/* routes use requireOwnerOrAdmin middleware (server/_core/index.ts +
  server/backfillWikiRoute.ts accepts it as parameter)
- All /api/scheduled/* routes check x-heartbeat-secret header
- coordApi.ts uses crypto.timingSafeEqual for key comparison, never string ===
- All external fetch() calls include AbortSignal.timeout(10_000)
- ENV is a static object — mock via vi.mock("./_core/env") in tests, never mutate process.env
- db.ts LIKE queries use Drizzle like() + or() helpers, never raw sql template interpolation
```

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

## Project State as of Phase 70

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

Phases 1–70 are complete. The webdev checkpoint `b98a0483` contains the full deployed
application. All files are full implementations (no stubs remain).

**Phase 70 second-pass security hardening (2026-06-04):**
- P0-2: `JWT_SECRET` now throws at startup if missing; `vitest.config.ts` provides test-only value
- P0-4: `db.ts` LIKE query replaced with Drizzle `like()` + `or()` helpers
- P0-1: `backfillWikiRoute.ts` refactored to accept `requireOwnerOrAdmin` as parameter;
  all 6 `/api/admin/*` routes now use the shared middleware

**Phase 41 revision (2026-06-04):**
- Header name standardised to `x-coord-key` across `coordApi.ts` and `agentIngestionEndpoint.ts`
- `AbortSignal.timeout(10_000)` added to both fetch calls in `manusOrchestrator.ts`
- `crypto.timingSafeEqual` replaces string `!==` in `coordApi.ts` auth middleware
- `ENV.appUrl` added (reads `VITE_APP_URL`, falls back to `localhost:3000`)
- `/api/coord/ingest` added to `buildVerticalAgentPrompt` workflow instructions
- `runOrchestratorTick` now caps retries at `MAX_RETRIES = 3`
- `manusOrchestrator.test.ts` created — 25 unit tests covering all exported functions

### Pending Work (Phase 71–73)

1. **Phase 71 — Redis-backed rate limiter** — swap in-memory `validateApiKey` rate limiter
   (`server/apiKeyService.ts`) for Upstash Redis so the 20 req/min limit holds across
   Cloud Run instances (currently resets on every cold start)
2. **Phase 72 — CoordinatorDashboard live polling** — add 30-second `setInterval` refetch
   (or tRPC subscription) to `client/src/pages/CoordinatorDashboard.tsx` so queue depth
   and active task counts update without a page reload
3. **Phase 73 — `COORD_API_KEY` rotation UI** — one-click "Rotate key" button in the Admin
   panel that generates a new `COORD_API_KEY`, updates the env secret, and re-registers
   all active coord tasks with the new key

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
# Manus API key (falls back to ASIONE env var if not set)
MANUS_API_KEY=your_manus_api_key_here

# Shared secret for /api/coord/* endpoints (timing-safe comparison in auth middleware)
COORD_API_KEY=generate_a_random_32_char_secret

# Public URL of the Truth Desk app (used by orchestrator for self-calls)
VITE_APP_URL=https://your-truth-desk-domain.manus.space
```

### Security invariants (must not be reverted)

| Invariant | File | Phase fixed |
|---|---|---|
| Session cookie `SameSite=Lax`, `httpOnly=true` | `server/_core/cookies.ts` | P1-9 (Phase 70) |
| `JWT_SECRET` throws at startup if missing | `server/_core/env.ts` | P0-2 (Phase 70 second pass) |
| All 6 `/api/admin/*` routes use `requireOwnerOrAdmin` | `server/_core/index.ts` + `server/backfillWikiRoute.ts` | P0-1 (Phase 70 second pass) |
| All `/api/scheduled/*` routes check `x-heartbeat-secret` | `server/_core/index.ts` | P0-3 (Phase 70) |
| Coord API auth: `crypto.timingSafeEqual`, never `!==` | `server/coordApi.ts` | Phase 41 revision |
| Rate limiter on `validateApiKey`: 20 req/min per IP | `server/apiKeyService.ts` | P1-3 (Phase 70) |
| All external `fetch()` calls: `AbortSignal.timeout(10_000)` | multiple server files | P1-16 (Phase 70) |
| `db.ts` LIKE queries use `like()` + `or()` helpers | `server/db.ts` | P0-4 (Phase 70 second pass) |
| `ENV` is a static object — mock via `vi.mock("./_core/env")` in tests | `server/_core/env.ts` | Phase 70 |
| `vitest.config.ts` provides `JWT_SECRET` test value | `vitest.config.ts` | Phase 70 second pass |

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

*Last updated: Phase 70 second-pass security hardening + Phase 41 revision — 2026-06-04*
*Checkpoint: b98a0483 | Tests: 659 passing (41 files) | TypeScript: 0 errors | ESLint: 0 warnings*

## Phase 71–73 Sync — 2026-06-04

**Project head:** `7e47510f13f5eba3ae09df7db5d1d24025129dfd` on `Gudmundur76/protein-truth-desk` `main`.

**Completed:** Phase 71 added a Redis-capable API key rate limiter using Upstash Redis REST configuration with a local fallback when Redis is not configured. Phase 72 added explicit 30-second polling to `CoordinatorDashboard.tsx`. Phase 73 added owner/admin `COORD_API_KEY` rotation from the Admin panel, backed by persistent coordinator-context metadata and shared timing-safe validation across coordinator REST, agent ingestion, batch audit bearer auth, and orchestrator key handoff paths.

**Verification:** Vitest passed (`412/412` in the cloned GitHub branch), `pnpm run check` was clean, `pnpm run build` succeeded, and the live public site loaded successfully at `https://protein-desk-5r5rzpyg.manus.space/` after push. The cloned branch initially lacked some Phase 70 memory invariants, so this session restored `JWT_SECRET` startup enforcement and session cookie `SameSite=Lax`/`httpOnly=true` before final verification.

**Detailed log:** `context/phase-log/phase-71-73.md`.
