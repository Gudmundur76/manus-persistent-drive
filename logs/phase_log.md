
## Phase 106 — Heartbeat Job Registration + Graph Edge Population
**Date:** 2026-06-11
**Status:** COMPLETE — 1069/1069 tests passing, TypeScript: 0 errors, checkpoint: b82351a4

### Deliverables
1. **Heartbeat cron registered** — `re-evaluate-composite-truth` on Manus platform (task_uid: `XYxgKr9QgnAZBhAvuCbnQR`, cron: `0 0 */6 * * *`, path: `/api/scheduled/re-evaluate`, next run: 18:00 UTC). 10 total jobs now registered.
2. **heartbeatRegistrar.ts** — canonical registry of all 9 project-level cron jobs with `getRegisteredJob()` and `requireJobTaskUid()` helpers. Single source of truth for all task_uids, cron expressions, and paths.
3. **Stage 8 graph edge population** wired into `analysisPipeline.ts` — after Stage 7 composite truth scoring, calls `findClaimsByTextSimilarity(text, {limit:3, minScore:0.6})` and `insertGraphClaimEdge` for each match. Non-fatal fire-and-forget. Graph now grows with every document submission.
4. **AdminCrons.tsx** updated — `re-evaluate-composite-truth` added to `CRON_DESCRIPTIONS` so the cron health dashboard shows the correct description.
5. **19 new unit tests** in `heartbeatRegistrar.test.ts` — shape validation, uniqueness, path prefix, 6-field cron, getRegisteredJob, requireJobTaskUid error paths.

### Architecture Impact
The autonomous loop is now fully self-compounding:
- PMC feed ingests papers → pipeline runs 8 stages → Stage 8 writes semantic_similar edges
- re-evaluate-composite-truth fires every 6h → discovers stale claims via new edges → re-scores → writes updated labels
- AdminCrons dashboard shows all 10 jobs with run history and Run Now buttons

## Phase 108 — Claim Confidence Timeline (2026-06-11)
- Added `claim_score_history` table (Drizzle schema + migration applied)
- Added `getClaimScoreHistory` and `insertClaimScoreSnapshot` DB helpers to db.ts
- Wired snapshot writes into `reEvaluationEngine.ts` → `reScoreClaim` now persists every score change
- Added `claims.getScoreHistory` tRPC procedure (merged into existing claims router to avoid 43-router TypeScript type limit)
- Built `SparklineChart.tsx` — pure SVG, zero deps, colour-coded by composite truth label, hover tooltip
- Added `CompositeTruthTimeline` component to `ClaimPage.tsx` — shows score history below the existing confidence trend sparkline
- 19 new tests (score history, snapshot insertion, sparkline data logic, label colour mapping)
- **Total: 1119/1119 tests passing. TypeScript: 0 errors. Checkpoint: b82351a4**
