# CURRENT_STATE.md — Meta-Development Command Centre

> **Read this file at the start of every session. It tells you exactly where you are, what you must do next, and what you must not touch.**

---

## Active Status

| Field | Value |
| :--- | :--- |
| **Date Updated** | 2026-06-14 |
| **Active Track** | `ttruthdesk-platform` + `cognitive-loop-framework` |
| **Active Sprint** | `sprint-6-third-pass-audit-fixes` |
| **Sprint Status** | DONE ✅ |
| **Completion Promise** | `THIRD-PASS AUDIT FIXES — 2693 + 60 TESTS, TSC 0 ERRORS, COMMIT 637005f` |

---

## What Was Just Done (This Session)

**Sprint 6 completed on ttruthdesk-platform (2026-06-14). cognitive-loop-framework unchanged (60/60 still passing).**

### Sprint 6 — ttruthdesk-platform (commit `637005f`)

**Phase 131 — Third-Pass Audit Fixes:**

- **`server/externalPublicRouter.ts`** (new file, 7 tests) — 5 alias routes `/api/external/public/*` → `/api/public/*` (claims/:id, stats, verticals, leaderboard, contradictions). Registered in `_core/index.ts`.
- **`/api/public/claims.json`** — added `try/catch` with `503 claims_registry_unavailable` fallback.
- **`/mcp` GET endpoint** — SSE keep-alive confirmed correct behaviour; no code change needed.
- **`generate-micron.ts`** — RSS `<link>` and `<guid>` fixed from `truthdesk.claims` → `citation.is`.
- **`drizzle/0047_sprint6_data_quality.sql`** — 5-step UPDATE migration strips leaked prompt patterns from all claim rationales; targeted NULL for claim 300023.
- **`salmonBiotech.ts`** — `ORGANISM_PATTERNS` expanded from 2 → 6 patterns covering fish, marine invertebrates, aquaculture species, Latin binomials/trinomials.
- **`_core/index.ts` OpenAPI schemas** — `Claim` + `VerifyClaimResponse` verdict enums updated from legacy `[supported/refuted/inconclusive]` → canonical 6-verdict enum.
- **`todo.md`** — all Third-Pass Audit Fix items marked `[x]`.
- 2693/2693 tests passing (+7 new), TSC 0 errors.

---

## What Was Done Before (Sprint 5)

**Sprint 5 completed on both tracks (2026-06-14).**

### Sprint 5 — ttruthdesk-platform (commit `924d340`)

- **Phase 121 verified complete** — `epistemicProvenance.ts` fully implemented: `getDistortionChain()`, `getSemanticNeighbours()`, `buildProvenanceResult()`, HTTP route registered in `_core/index.ts`, `get_provenance` MCP tool (#11 of 12) in `mcpServer.ts`. 27 tests passing.
- **MIGRATION_RUNBOOK.md** added — step-by-step guide for applying `0046_sprint1_sprint2_tables.sql` to production.
- **OPENAIRE_REGISTRATION.md** added — step-by-step guide for registering ttruthdesk.claims on OpenAIRE and BASE (CC BY 4.0).
- **todo-sprint-117-121.md** — all Phase 121 items marked `[x]`.
- 2686/2686 tests passing, TSC 0 errors, ESLint 0 warnings.

### Sprint 5 — cognitive-loop-framework (commit `c4220ba`)

- **`src/loop/loopOrchestrator.ts` created** — the missing five-layer cognitive loop coordinator.
  - `LoopOrchestrator` class with `run()`, convergence logic, `LoopInput`, `LoopResult`, `LayerResult`, `LayerName`, `OrchestratorConfig` types exported.
  - L1 Friction → L2 Truth → L3 Self-Prompt → L4 Frontier → L5 Meta layers implemented.
  - Delegates to `MemoryLayer`, `SelfPromptEngine`, `MetaAgent`.
- **tree-sitter native build fixed** — downgraded to `tree-sitter@0.21.1` + `tree-sitter-typescript@0.21.2` which ship prebuilt linux-x64 binaries (no compiler required).
- **`src/memory/index.ts`** — `namespace` parameter made optional (`default='default'`).
- **`tsconfig.json`** — `module=ESNext`, `moduleResolution=bundler`, `types=[node]` — fixes `import.meta` and Node globals.
- 60/60 tests passing (6 test files), TSC 0 errors.

---

## What Was Done Before (Sprint 4)

### Sprint 2 — Phase 115: Citation Graph Scoring (commit `5915def`)

**compositeTruthEngine.ts:**
- Added `citationCount` log10 boost (clamped 0–0.25): `min(log10(n)/8, 0.25)` added to composite score
- Added `selfCitationFraction` penalty: `−0.05 * fraction` applied when fraction > 0
- Updated retraction penalty from −0.15 → −0.30 (Phase 115 spec)
- Both new fields added to `CompositeTruthInput` interface and `ComputeCompositeTruth` function

**analysisPipeline.ts:**
- Stage 3.5 now extracts `citationCount` and `selfCitationFraction` from OC enrichment result
- Passes both fields into `computeCompositeTruth()`
- Calls `setCitationGraphEnriched(claim.id)` after successful OC enrichment

**db.ts:** Added `setCitationGraphEnriched(claimId)` helper — sets `citationGraphEnriched=true` on claims table

**drizzle/schema.ts:** Added `citationGraphEnriched` boolean column to claims table

**drizzle/0046_sprint1_sprint2_tables.sql:** Migration SQL for `rate_limit_buckets`, `dream_staging_queue`, `claim_embeddings`, `citationGraphEnriched` column, `system_capability_required` event type

**env.ts:** Added `TRAINING_CORPUS_ENABLED` and `TRAINING_CORPUS_PATH` to env schema

- 17 new tests — 2638/2638 passing (229 files)
- TypeScript: 0 errors
- Committed and pushed to GitHub: `feat(phase-115): citation graph scoring in verdict pipeline [sprint-2]`

---

## What Must Be Done Next

**ttruthdesk-platform Sprint 2 is COMPLETE.** 2638 tests passing.

**Sprint 3 is COMPLETE.** 2667 tests passing (commit `c9aad11`).

### Sprint 3 — What Was Done
- **Phase 116**: `selfCitationFraction` now populated in `OcEnrichmentResult` via `opencitations.ts` evidenceRaw. 5 new tests.
- **Phase 117**: `GET /api/v2/claims/:id/contradictions` added to `apiV2Router.ts`. Calls `scanLocalContradictions(claimId)`. 5 new tests.
- **Phase 114**: Confirmed already complete — `streamVerifyRoute.ts` with 29 tests was pre-existing.

**Sprint 5 COMPLETE** (ttruthdesk commit `924d340`, cognitive-loop commit `c4220ba`) — 2686 + 60 tests, 0 TS errors.

**Sprint 6 COMPLETE** (ttruthdesk commit `637005f`) — 2693 tests, 0 TS errors.

**Next action — Sprint 7:**
1. Apply `drizzle/0047_sprint6_data_quality.sql` to production DB (leaked prompt cleanup)
2. Apply `drizzle/0046_sprint1_sprint2_tables.sql` to production DB — see MIGRATION_RUNBOOK.md
3. Register ttruthdesk as open dataset on OpenAIRE/BASE (CC BY 4.0) — see OPENAIRE_REGISTRATION.md
4. Phase 132+ — next unchecked items in todo.md
5. cognitive-loop-framework Sprint 6 — ClaimsCorpusGenerator, CorpusWatcher, IncrementalTrainer

---

## Track Overview

### Track A: ttruthdesk-platform
The production scientific truth registry at citation.is.

| Sprint | Focus | Status |
| :--- | :--- | :--- |
| sprint-0-critical-fixes | Fix rate limiter, verdict flip, dream gate, embeddings | DONE ✅ |
| sprint-1-cron-migration | Training flywheel, reactive cascades, self-build loop | DONE ✅ |
| sprint-2-phase-115 | Drizzle migrations, TRAINING_CORPUS_ENABLED, Phase 115 citation graph scoring | DONE ✅ |
| sprint-3-streaming-api | Phase 114 SSE streaming, Phase 116 self-citation fraction, Phase 117 contradiction API | DONE ✅ |
| sprint-4-history-provenance-batch | Phase 118 claim history API, Phase 119 provenance chain API, Phase 120 batch verify | DONE ✅ |
| sprint-5-phase121-loop-orchestrator | Phase 121 epistemic provenance verified; migration runbook; OpenAIRE registration doc | DONE ✅ |
| sprint-6-third-pass-audit-fixes | External routes, claims.json error handling, RSS domain, NCBI patterns, OpenAPI verdicts | DONE ✅ |

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
| sprint-5-loop-orchestrator | LoopOrchestrator (5-layer loop), tree-sitter fix, tsconfig fix, 60/60 tests | DONE ✅ |
| sprint-6-autonomous-training | ClaimsCorpusGenerator, CorpusWatcher, IncrementalTrainer | PLANNED |

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
