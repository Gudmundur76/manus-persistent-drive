# CURRENT_STATE.md — Meta-Development Command Centre

> **Read this file at the start of every session. It tells you exactly where you are, what you must do next, and what you must not touch.**

---

## Active Status

| Field | Value |
| :--- | :--- |
| **Date Updated** | 2026-06-14 |
| **Active Track** | `ttruthdesk-platform` |
| **Active Sprint** | `sprint-2-phase-115` |
| **Sprint Status** | DONE ✅ |
| **Completion Promise** | `CITATION GRAPH SCORING IN VERDICT PIPELINE — FLYWHEEL + SCORING COMPLETE` |

---

## What Was Just Done (This Session)

**Sprint 2 (Phase 115 — Citation Graph Scoring) on ttruthdesk-platform completed.**

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

**Next action — Sprint 3:**
1. Phase 114 — Streaming Verification Endpoint: add `GET /api/v2/verify/stream` using Server-Sent Events so citation.is can show live verification progress
2. Phase 116 — OpenCitations Stage 4: add `selfCitationFraction` computation to `openCitationsEnricher.ts` (currently returns null — the field is wired but not populated)
3. Phase 117 — Contradiction Graph API: expose `GET /api/v2/claims/:id/contradictions` using the new `scanLocalContradictions()` function

---

## Track Overview

### Track A: ttruthdesk-platform
The production scientific truth registry at citation.is.

| Sprint | Focus | Status |
| :--- | :--- | :--- |
| sprint-0-critical-fixes | Fix rate limiter, verdict flip, dream gate, embeddings | DONE ✅ |
| sprint-1-cron-migration | Training flywheel, reactive cascades, self-build loop | DONE ✅ |
| sprint-2-phase-115 | Drizzle migrations, TRAINING_CORPUS_ENABLED, Phase 115 citation graph scoring | DONE ✅ |
| sprint-3-streaming-api | Phase 114 SSE streaming, Phase 116 self-citation fraction, Phase 117 contradiction API | NEXT |

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
