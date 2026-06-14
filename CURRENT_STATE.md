# CURRENT_STATE.md — Meta-Development Command Centre

> **Read this file at the start of every session. It tells you exactly where you are, what you must do next, and what you must not touch.**

---

## Active Status

| Field | Value |
| :--- | :--- |
| **Date Updated** | 2026-06-14 |
| **Active Track** | `ttruthdesk-platform` |
| **Active Sprint** | `sprint-1-cron-migration` |
| **Sprint Status** | DONE ✅ |
| **Completion Promise** | `FLYWHEEL WIRED — VERDICT_COMPLETE TRAINS MODELS` |

---

## What Was Just Done (This Session)

**Sprint 0 gap-close + Sprint 1 (cron-migration) on ttruthdesk-platform completed.**

### Sprint 0 Gap-Close (commit `e62a64a`)
- Removed 3 in-memory rate limit Maps from `answerRoute.ts`, `apiV2Router.ts`, `apiKeyService.ts` — DB is now sole authority
- Moved backfill endpoint from `/api/admin/backfill-embeddings` → `/api/scheduled/backfill-embeddings` with `requireCronOrAdmin` middleware
- Added `resetRateLimitBuckets()` export to `_core/rateLimit.ts` for test cleanup
- TypeScript: 0 errors, 2602/2602 tests passing

### Sprint 1 — Training Flywheel + Reactive Cascades (commit `30d05d5`)

**Work Stream A — Training Flywheel Connection:**
- `trainingCorpusListener.ts`: enriches `verdict_complete` events with full claim data (claimText, entities, provenance) and calls `ClaimsCorpusGenerator` from cognitive-loop-framework
- Wired `notifyTrainingCorpus()` into `loopOrchestrator.ts` — the flywheel is now live

**Work Stream B — Self-Building Loop:**
- Added `system_capability_required` event type (layer 4) to `eventBus.ts` and schema
- Wired trigger in `metaLayer.ts` when health score drops to critical (≤30)
- Added `spawnDevTask()` + `buildDevRepairPrompt()` to `manusOrchestrator.ts`

**Work Stream C — Reactive Event Cascades (Cron Migration):**
- `scanLocalContradictions(claimId)` in `contradictionDetector.ts` — per-claim scan on every `verdict_complete` (replaces weekly full-graph cron)
- `lintWikiPage(slug)` in `wikiEngine.ts` — per-page lint on every `compileDocumentToWiki()` (replaces weekly wiki-engine-lint cron)
- `source_data_changed` event published from `analysisPipeline.ts` after semantic_similar edges (replaces 6-hour quality-scorer cron)

- 19 new tests — 2621/2621 passing (228 files)
- TypeScript: 0 errors, ESLint: 0 errors
- Committed and pushed to GitHub: `feat(training): Sprint 1 — training flywheel, reactive cascades, self-build loop [sprint-1]`

---

## What Must Be Done Next

**ttruthdesk-platform Sprint 1 is COMPLETE.** The flywheel is wired. 2621 tests passing.

**Next action — Sprint 2 (self-building loop):**
1. Generate Drizzle migration SQL for the 3 new schema tables (`rate_limit_buckets`, `dream_staging_queue`, `claim_embeddings`) — these are in schema.ts but migration SQL has not been generated yet
2. Add `TRAINING_CORPUS_ENABLED=true` to the production env config so the flywheel activates on deploy
3. Write end-to-end integration test for `system_capability_required` → `spawnDevTask()` path
4. Begin Phase 123 — the next planned development phase in `todo.md`

---

## Track Overview

### Track A: ttruthdesk-platform
The production scientific truth registry at citation.is.

| Sprint | Focus | Status |
| :--- | :--- | :--- |
| sprint-0-critical-fixes | Fix rate limiter, verdict flip, dream gate, embeddings | DONE ✅ |
| sprint-1-cron-migration | Training flywheel, reactive cascades, self-build loop | DONE ✅ |
| sprint-2-self-building-loop | Drizzle migrations, TRAINING_CORPUS_ENABLED, Phase 123 | NEXT |

**Blueprint:** `tracks/ttruthdesk-platform/blueprint/`

---

### Track B: cognitive-loop-framework
The autonomous cognitive loop framework — a general architecture for self-building, self-improving systems.

| Sprint | Focus | Status |
| :--- | :--- | :--- |
| sprint-0-command-centre | Initialise this command centre and quality infrastructure | DONE |
| sprint-1-codebase-indexer | tree-sitter AST parser → graph nodes and edges | DONE |
| sprint-2-memory-layer | RuVector integration, embedding pipeline | DONE |
| sprint-3-slm-deployment | Fine-tune Qwen2.5-Coder, deploy via Ollama | DONE ✅ |
| sprint-4-loop-wiring | Wire L2 Self-Prompt to SLM, Meta-Agent to Manus API | DONE ✅ |
| sprint-5-autonomous-training | ClaimsCorpusGenerator, CorpusWatcher, IncrementalTrainer | DONE ✅ |

**Blueprint:** `tracks/cognitive-loop-framework/blueprint/`

---

## Governance Rules (Non-Negotiable)

1. A session working on Track A must not read Track B context, and vice versa.
2. The `DEVELOPMENT_DISCIPLINE.md` file governs all code written in both tracks.
3. No sprint advances until the previous sprint's `post_sprint_log.md` is committed.
4. The `tracks/*/blueprint/` directories are immutable during active sprints.
5. This file (`CURRENT_STATE.md`) is updated at the end of every session.

---

## Irreplaceable Records — Do Not Touch

The following files and directories in this repository must never be deleted, moved, or overwritten:

| Path | Why Irreplaceable |
| :--- | :--- |
| `TRUTH_DOCTRINE.md` | The governing philosophy of the entire system |
| `CLAUDE.md` | The mandatory session ritual for ttruthdesk-platform |
| `learning-log.md` | 31 cycles of compounding knowledge |
| `docs/meta-agent-design.md` | The governance architecture design |
| `docs/gap-analysis.md` | The backlog for ttruthdesk-platform |
| `sia-tasks/` | The SIA benchmark and evaluation harness |
| `reset-points/` | Git bundle backups — the only restore path |
| `context/` | Phase logs and task registry |
| `sessions/` | Session history |
