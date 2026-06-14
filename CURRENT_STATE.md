# CURRENT_STATE.md — Meta-Development Command Centre

> **Read this file at the start of every session. It tells you exactly where you are, what you must do next, and what you must not touch.**

---

## Active Status

| Field | Value |
| :--- | :--- |
| **Date Updated** | 2026-06-14 |
| **Active Track** | `cognitive-loop-framework` |
| **Active Sprint** | `sprint-5-autonomous-training-loop` |
| **Sprint Status** | DONE ✅ |
| **Completion Promise** | `DATA FLYWHEEL CLOSED — CLAIMS TRAIN MODELS` |

---

## What Was Just Done (This Session)

**Sprint 5 of the cognitive-loop-framework was completed: the autonomous training loop (data flywheel).**

- Built `ClaimsCorpusGenerator` — converts `verdict_complete` events from ttruthdesk.claims into 5 labelled training pair types: classify, extract, contradict, provenance, score. Appends to rolling JSONL corpus.
- Built `CorpusWatcher` — monitors corpus growth, fires `corpus_ready_for_training` callback when new examples exceed configurable threshold. Resets baseline after each trigger.
- Built `IncrementalTrainer` — runs `finetunePipeline.py --cpu` on new examples only, then refreshes Ollama model weights via `ollama create`. Delta fine-tune, not full retrain.
- 10 new tests added — 60/60 passing, 0 failures across all six sprints
- Committed and pushed to GitHub: `feat(training): autonomous training loop — data flywheel from ttruthdesk.claims`

Completion Promise met: `DATA FLYWHEEL CLOSED — CLAIMS TRAIN MODELS`

**Architecture:** Every claim verified by ttruthdesk.claims → training example → model improves → better verification → better claims. The loop is fully closed.

---

## What Must Be Done Next

**cognitive-loop-framework v0.2.0 is COMPLETE.** All five sprints are done. 60 tests passing.

**Next action:** Wire the training loop into the ttruthdesk-platform `eventBus` so that `verdict_complete` events automatically trigger `ClaimsCorpusGenerator`. This requires the ttruthdesk developer to complete sprint-0-critical-fixes first (the eventBus must be stable before wiring the training loop to it).

---

## Track Overview

### Track A: ttruthdesk-platform
The production scientific truth registry at citation.is.

| Sprint | Focus | Status |
| :--- | :--- | :--- |
| sprint-0-critical-fixes | Fix rate limiter, verdict flip, dream gate, embeddings | AWAITING DEVELOPER |
| sprint-1-cron-migration | Replace polling cron jobs with event-driven webhooks | QUEUED |
| sprint-2-self-building-loop | Wire Meta-Agent to Manus API for autonomous repair | QUEUED |

**Next action:** Developer to implement fixes from `tracks/ttruthdesk-platform/blueprint/developer_note.md`.  
**Blueprint:** `tracks/ttruthdesk-platform/blueprint/`

---

### Track B: cognitive-loop-framework
The new autonomous cognitive loop framework — a general architecture for self-building, self-improving systems.

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
