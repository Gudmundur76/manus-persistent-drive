# Phase 121 — SIA Self-Improving Prompt Harness Integration

**Date:** 2026-06-12
**Commit:** 33e5e68 (ttruthdesk-platform main)
**Tests:** 1119/1119 pass | TypeScript: 0 errors

---

## What Was Built

Integrated the [hexo-ai/sia](https://github.com/hexo-ai/sia) SIA-W+H (Weights + Harness) pattern into the `quality-pass-nightly` pipeline. The harness improvement half (H) is implemented; weight updates are not applicable (API-based LLMs, no local fine-tuning).

### New DB Tables (migration 0043)

| Table | Purpose |
|-------|---------|
| `prompt_harness` | Stores the active extraction prompt per component (claim_extractor, verdict_rationale, passage_extractor, misrep_classifier) with generation tracking |
| `quality_pass_feedback` | One row per quality-pass run — upgrade rate, fail rate, verdict distribution, harness generation, feedback proposal reference |

### New Files

| File | Role |
|------|------|
| `server/sia/promptHarnessManager.ts` | `getActivePrompt()`, `seedPromptIfMissing()`, `activatePrompt()`, `runFeedbackAgent()` |
| `server/sia/qualityPassFeedbackCollector.ts` | `collectQualityPassFeedback()` — runs after each quality-pass job |

### Modified Files

| File | Change |
|------|--------|
| `server/qualityPassJob.ts` | Export `QualityPassResult` type; track `processedDocIds[]`; call `collectQualityPassFeedback()` at end of `runQualityPass()` (non-fatal) |
| `drizzle/schema.ts` | Added `promptHarness` + `qualityPassFeedback` table definitions |

---

## How the Loop Works

```
quality-pass-nightly runs
  └── runQualityPass() processes N draft docs
        ├── tracks processedDocIds[]
        └── calls collectQualityPassFeedback(result, processedDocIds)
              ├── seeds prompt_harness generation 1 if missing
              ├── counts verdict distribution from processed claims
              ├── stores quality_pass_feedback row
              ├── if upgradeRate < 0.75 AND processed >= 3:
              │     runFeedbackAgent("claim_extractor", currentPrompt, metrics)
              │       └── LLM proposes revised prompt with reasoning + risk
              ├── if risk == low/medium: activatePrompt() → generation N+1
              └── if risk == high: store as pending_review in sia_improvement_proposals
```

### Safety Constraints

- Only triggers when `upgradeRate < 0.75` (healthy pipeline = no change)
- Requires at least 3 processed documents per run
- High-risk proposals require human review before activation
- Previous prompt always preserved in DB (never deleted)
- Entire feedback loop is non-fatal — failure never blocks the quality-pass result

---

## Seed Prompts (Generation 1)

The four seed prompts are the current production prompts extracted from:
- `claimExtractor.ts` → `claim_extractor`
- `frictionEngine.ts` → `verdict_rationale`
- `passageExtractor.ts` → `passage_extractor`
- `misrepresentationClassifier.ts` → `misrep_classifier`

---

## Next Steps

1. Apply migration 0043 to production DB
2. Monitor `quality_pass_feedback` table after first nightly run
3. Review any `pending_review` proposals in `sia_improvement_proposals`
4. Consider extending the feedback loop to `verdict_rationale` component
