# Protein Truth Desk — Integration Protocol

**Version:** 5.0 (Phase 79 complete, 2026-06-06)
**Drive repo:** https://github.com/Gudmundur76/manus-persistent-drive
**Project repo:** https://github.com/Gudmundur76/protein-truth-desk
**Live site:** https://protein-desk-5r5rzpyg.manus.space/
**GitHub commit:** `7598de6` (Phase 74-79 complete)
**Webdev checkpoint:** latest (Phase 79 — 438 tests, 0 TypeScript errors, 0 ESLint errors)

---

## Why This File Exists

Manus sandbox sessions are ephemeral. Every new session starts with a clean filesystem,
and the GitHub repo is the source of truth for the codebase. This repository is the
**persistent memory layer** that bridges sessions — it stores project state, schema
snapshots, service implementations, test files, KG summaries, and session history so
that any new agent session (main task or parallel sub-task) can bootstrap itself to the
correct context in under 60 seconds.

**The rule is simple: every session starts with `node scripts/manus-session.mjs start`
and ends with `node scripts/manus-session.mjs end "message"`.**

### Quick Bootstrap for a New Chat Session

Paste this as the first message in a new Manus session:

```
Project: Protein Truth Desk — scientific claim verification platform

Live site: https://protein-desk-5r5rzpyg.manus.space/
Source repo: https://github.com/Gudmundur76/protein-truth-desk
Memory repo (phase log + snapshots): https://github.com/Gudmundur76/manus-persistent-drive

Start by cloning both repos, reading manus-persistent-drive/TRUTH_DESK_INTEGRATION.md
and manus-persistent-drive/context/phase-log/, then reading protein-truth-desk/todo.md.

Current GitHub commit: 7598de6 (protein-truth-desk main)
Phase: 79 complete. 438 Vitest tests passing, 0 TypeScript errors, 0 ESLint errors.

Next tasks (Phase 80+):
- Reduce ESLint warnings from 91 to < 20 (fix no-explicit-any, prefer-const, unused-vars)
- Remove all `as any` in non-test production files (target: 0)
- Add Vitest coverage thresholds (lines: 80, functions: 80, branches: 70)
- Add `pnpm test:ci` script that exits non-zero on coverage drop
- Add Quality Dashboard page (/admin/quality) — test pass rate, coverage %, stub count, any usage

Security invariants that must not be reverted:
- JWT_SECRET throws at startup if missing (server/_core/env.ts)
- Session cookie: SameSite=Lax, httpOnly=true (server/_core/cookies.ts)
- All /api/admin/* routes use requireOwnerOrAdmin middleware
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
│   ├── bootstrap.sh          ← Legacy bash bootstrap (use manus-session.mjs instead)
│   └── sync.sh               ← Legacy bash sync (use manus-session.mjs instead)
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
│   ├── protein-truth-desk/   ← Protein Truth Desk snapshot (schema, server, tests, pages)
│   └── memorydesk/           ← MemoryDesk snapshot (schema, server, todo)
├── memory/
│   ├── knowledge_graph/
│   │   └── graph_memory.py   ← Python KG read/write wrapper
│   └── vector/
│       └── ruvector_memory.py ← RuVector semantic search wrapper
└── skills/
    └── all_skills_backup.tar.gz ← Manus skills backup
```

---

## Session Lifecycle

### Start of Session
```bash
# 1. Clone or pull both repos
gh repo clone Gudmundur76/protein-truth-desk /home/ubuntu/protein-truth-desk 2>/dev/null \
  || git -C /home/ubuntu/protein-truth-desk pull --rebase origin main

gh repo clone Gudmundur76/manus-persistent-drive /home/ubuntu/manus-persistent-drive 2>/dev/null \
  || git -C /home/ubuntu/manus-persistent-drive pull --rebase origin main

# 2. Run session integrity check
cd /home/ubuntu/protein-truth-desk
node scripts/session-integrity.mjs

# 3. Register session and print context
node scripts/manus-session.mjs start
```

### End of Session
```bash
cd /home/ubuntu/protein-truth-desk
# Log the phase you completed
node scripts/manus-session.mjs log-phase <N> "<description>" done
# Sync state to both repos and end session
node scripts/manus-session.mjs end "feat(scope): description"
```

---

## Project State as of Phase 79

**Phases complete:** 1–79
**GitHub commit:** `7598de6` — pushed to main
**Tests:** 438/438 passing (42 test files)
**TypeScript:** 0 errors
**ESLint:** 0 errors, 91 warnings (target: < 20 by Phase 80)
**Stubs:** 0 (all replaced in Phase 68)
**Coverage:** ~65% (target: 80% by Phase 82)

### What Was Built (Phases 74–79)

**Phase 74 — Vertical Adapter Routing + Multi-Source Evidence**
- Fixed analysisPipeline.ts to route claims through vertical adapter registry
- Added UniProt REST API, OpenFDA FAERS, Europe PMC adapters
- 18 new tests (677 total at that point)

**Phase 75 — Website Copy Rewrite (Domain-Agnostic)**
- Rewrote Home.tsx, Pricing.tsx, Trust.tsx, AuditReport.tsx copy
- Reflects multi-database routing, not PDB-only

**Phase 76 — LLM Wiki Knowledge Layer**
- Added wiki_pages, wiki_index, wiki_log tables (migration 0014)
- Built wikiEngine.ts (ingest, update, lint, index, log, search)
- Wiki.tsx + WikiSlugPage.tsx client pages
- Weekly wiki-lint heartbeat job
- 21 new tests (698 total at that point)

**Phase 74 (drive numbering) — IndexNow Admin Control**
- seoRouter.ts: admin tRPC procedures (status, pingAll, pingDocument, listLogs)
- seo_ping_log table

**Phase 75 (drive numbering) — Observability**
- server/_core/logger.ts: pino structured logger
- correlationId field in TrpcContext
- /api/health/detailed endpoint

**Phase 76 (drive numbering) — Swarm Admin Router**
- swarmRouter.ts: admin tRPC procedures
- swarm_tick_log table

**Phase 77 — OpenRouter Multi-Key Rotation**
- multiLLM.ts: round-robin key rotation from OPENROUTER_API_KEYS pool

**Phase 78 — FreeLLM/Ollama Provider**
- multiLLM.ts: FREELM_MODEL env var, LLM_PROVIDER routing

**Phase 79 — Final Quality Pass**
- phase74-79.test.ts: 26 new tests
- Total: 438 tests, TypeScript 0 errors

---

## Database Schema (as of Phase 79)

29 tables in MySQL/TiDB:
users, documents, claims, auditReports, monitoringFeed, auditRequests, monitoringJobs,
autoIngestedPapers, magicLinkTokens, emailUsers, graphEntities, graphRelations,
userSubscriptions, predictionFeatures, predictionModels, webhookAlerts, coordTasks,
coordQueue, coordContext, verticalAlerts, notificationLog, webhookDeliveryLog,
claimProvenanceEvents, entityCooccurrences, confidenceHistory, apiKeys,
seoPingLog, swarmTickLog
(+ wiki fields embedded in documents table via wikiCompiledAt, wikiPagePath columns)

---

## Parallel Task Protocol

When the main agent spawns a parallel sub-task via the Manus API, the sub-task must:

1. Clone this repo and run `node scripts/manus-session.mjs start` with taskType=parallel
2. Read `context/task-registry/registry.json` to see what other tasks are running
3. Read `context/kg/kg_summary.json` for current KG state
4. Write discoveries back via POST /api/coord/memory/graph
5. Run `node scripts/manus-session.mjs end` before terminating

---

## Related Projects

| Project | Repo | Drive snapshot |
|---|---|---|
| Protein Truth Desk | Gudmundur76/protein-truth-desk | data/protein-truth-desk/ |
| MemoryDesk | Gudmundur76/memorydesk | data/memorydesk/ |

*Last updated: Phase 79 complete — 2026-06-06*
