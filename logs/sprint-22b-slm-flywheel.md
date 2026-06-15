# Sprint 22b — SLM Data Flywheel: Complete Build Log

**Date:** 2026-06-15  
**Phase:** Sprint 22b  
**Status:** COMPLETE ✅  
**Test results:** 2772/2772 ttruthdesk · 96/96 cognitive-loop · 15/15 pytest

---

## What Was Built

### 1. `slm-infra-deploy` (new repo — first commit)

| File | Purpose |
|---|---|
| `finetunePipeline.py` | Incremental LoRA fine-tuning (Qwen2.5-Coder-1.5B, CPU mode) |
| `Modelfile` | Ollama `claims-slm` model definition |
| `Dockerfile` | Containerised cognitive-loop service |
| `docker-compose.yml` | Ollama + cognitive-loop wired together |
| `cortex.yaml` | Developer-facing config schema |
| `cortex.py` | CLI entry point (`cortex init` / `cortex run`) |
| `requirements.txt` | All ML + serving dependencies |
| `test_finetunePipeline.py` | 15 pytest tests (15/15 PASS) |

**Key design decisions:**
- `load_corpus` tolerates empty lines and malformed JSON (skips, logs)
- `format_prompt` uses Alpaca-style `### Instruction / ### Input / ### Response`
- `get_delta_records` reads a `trained_count.txt` checkpoint — only trains on new examples
- `write_trained_count` / `read_trained_count` — checkpoint persistence round-trip

### 2. `cognitive-loop-framework` (new files pushed to `master`)

| File | Purpose |
|---|---|
| `src/memory/compoundingLog.ts` | Structured JSONL memory log |
| `src/loop/cognitiveLoopServer.ts` | 5-layer HTTP API |
| `tests/memory/compoundingLog.test.ts` | 16 Vitest tests (16/16 PASS) |
| `tests/loop/cognitiveLoopServer.test.ts` | 12 Vitest tests (12/12 PASS) |

**CompoundingLog API:**
- `append(entry)` → stamps ISO timestamp, appends JSONL line to disk
- `readAll()` → returns all entries in insertion order, skips malformed lines
- `querySimilar(query, topK)` → TF-IDF cosine similarity search
- `getSuccessfulRepairs(trigger?)` → PASS + APPROVED entries, optional trigger filter
- `getFailedRepairs()` → FAIL entries
- `scanContradictions()` → tests with both PASS and FAIL results
- `getStats()` → `{ total, passRate, avgSlmConfidence, pendingReviews }`

**CognitiveLoopServer endpoints:**
- `POST /cognitive/ingest` — L0: ingest verdict event → JSONL corpus
- `POST /cognitive/verdict` — L1: query prior verdicts for a claim
- `POST /cognitive/repair` — L2: build repair context for failing tests
- `GET  /cognitive/status` — flywheel health + log stats
- `GET  /health` — liveness probe
- HMAC-SHA256 webhook signature verification (optional, via `webhookSecret` config)

### 3. `ttruthdesk-platform` (5 files changed, pushed to `main`)

| File | Change |
|---|---|
| `server/verdictWebhookRoute.ts` | New — `buildVerdictPayload` + `fireVerdictWebhook` |
| `server/verdictWebhookRoute.test.ts` | New — 10 Vitest tests (10/10 PASS) |
| `server/verifyClaimRoute.ts` | Step 4b wired — fires webhook after each verification |
| `server/_core/env.ts` | Added `COGNITIVE_LOOP_URL` + `WEBHOOK_SECRET` env vars |
| `CONTEXT_SNAPSHOT.md` | Auto-updated by pre-commit hook |

**Webhook design:**
- `buildVerdictPayload` maps `VerdictResult` + `PubMedResult[]` → `CognitiveIngestEvent`
- Confidence derived from verdict label (all 7 `VerdictLabel` values covered)
- `contextSentence` = first PubMed abstract snippet, falls back to `claimText`
- `provenance` = `rationale + " → " + verdict`
- `fireVerdictWebhook` is fire-and-forget — errors are swallowed, verification never blocked

---

## Flywheel Data Flow (end-to-end)

```
User submits claim
       ↓
ttruthdesk verifyClaimRoute
  → PubMed / PDB / UniProt lookup
  → bestVerdictResult computed
  → Step 4b: fireVerdictWebhook(buildVerdictPayload(...))  ← NEW
       ↓ (non-blocking)
cognitive-loop-framework POST /cognitive/ingest
  → ClaimsCorpusGenerator.appendPair(instruction, input, output)
  → JSONL corpus grows
  → if corpus.length >= trainingThreshold:
       → spawn finetunePipeline.py --corpus ... --output ... --cpu
            → get_delta_records (only new examples)
            → LoRA fine-tune Qwen2.5-Coder-1.5B
            → write adapter weights to output/
            → write_trained_count checkpoint
       → ollama create claims-slm -f Modelfile
  → compoundingLog.append({ trigger: 'verdict_event', ... })
       ↓
claims-slm adapter available in Ollama
  → ttruthdesk SLM layer uses updated model for next claim
```

---

## Test Summary

| Repo | Test Runner | Tests | Result |
|---|---|---|---|
| `ttruthdesk-platform` | Vitest | 2772 | ✅ 2772/2772 PASS |
| `cognitive-loop-framework` | Vitest | 96 | ✅ 96/96 PASS |
| `slm-infra-deploy` | pytest | 15 | ✅ 15/15 PASS |

**TypeScript:** 0 errors  
**ESLint:** 0 errors, 2 warnings (pre-existing)  
**Definition of Done:** SATISFIED

---

## Commits

- `slm-infra-deploy` → `7b928b7` (first commit, `main`)
- `cognitive-loop-framework` → `6dd0a4e` (`master`)
- `ttruthdesk-platform` → `82050e2` (`main`)
- `manus-persistent-drive` → synced via `pnpm drive:sync` (phase132_2026-06-15)
