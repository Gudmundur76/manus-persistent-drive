# Sprint 0: Critical Fixes
## Loop Prompt (Ralph Wiggum)

**Track:** ttruthdesk-platform  
**Sprint:** sprint-0-critical-fixes  
**Completion Promise:** `SPRINT 0 COMPLETE — RATE LIMITER PERSISTENT, VERDICT FLIP WIRED, DREAM GATE SAFE, EMBEDDINGS SCHEMA LIVE, ALL TESTS GREEN`

---

## Your Task

You are fixing the four critical structural failures identified in the ttruthdesk-platform codebase. These failures must be resolved before any new features are built. Read the full developer note before touching any code.

**Developer Note:** `tracks/ttruthdesk-platform/blueprint/developer_note.md`

## Acceptance Criteria

- [ ] Fix 1: Rate limiter replaced with persistent DB-backed `rate_limit_buckets` table (not in-memory Map)
- [ ] Fix 2: `webhookDeliveryService` is called in `reEvaluationEngine.ts` when verdict label changes
- [ ] Fix 3: Dream engine hypotheses are staged in `dream_staging_queue` table with confidence gate ≥ 0.75
- [ ] Fix 4: `claim_embeddings` table added to Drizzle schema with backfill utility
- [ ] All four fixes have tests written FIRST (RED phase) before implementation (GREEN phase)
- [ ] Full test suite passes: `pnpm lint && pnpm typecheck && pnpm test --coverage`
- [ ] No existing tests have regressed
- [ ] All changes committed to `ttruthdesk-platform` with phase-tagged commit messages

## Completion Check

When all acceptance criteria are checked, output exactly:

```
SPRINT 0 COMPLETE — RATE LIMITER PERSISTENT, VERDICT FLIP WIRED, DREAM GATE SAFE, EMBEDDINGS SCHEMA LIVE, ALL TESTS GREEN
```
