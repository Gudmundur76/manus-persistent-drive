# CURRENT_STATE.md — Meta-Development Command Centre

> **Read this file at the start of every session. It tells you exactly where you are, what you must do next, and what you must not touch.**

---

## Active Status

| Field | Value |
| :--- | :--- |
| **Date Updated** | 2026-06-14 |
| **Active Track** | `cognitive-loop-framework` |
| **Active Sprint** | `sprint-4-loop-wiring` |
| **Sprint Status** | READY TO START |
| **Completion Promise** | `SPRINT 4 COMPLETE — LOOP CLOSED, SELF-HEALING VERIFIED` |

---

## What Was Just Done (This Session)

Sprint 3 of the cognitive-loop-framework was completed. The following was built:

- Built `CorpusGenerator` — extracts 5 Q&A pair types (explain/locate/diagnose/relate/repair) from AST nodes
- Built `finetunePipeline.py` — Unsloth + TRL fine-tuning for Qwen2.5-Coder-1.5B with dry-run mode
- Built `Modelfile` — Ollama deployment config with L2 Self-Prompt system prompt
- Built `SelfPromptEngine` — TypeScript interface to Ollama with OpenAI fallback, all 5 reasoning modes
- 12 new tests added — 28/28 passing, 0 failures
- Committed all changes to the local repository

Completion Promise met: `SLM DEPLOYED — INFERENCE VERIFIED`

---

## What Must Be Done Next

**Current sprint: `cognitive-loop-framework / sprint-4-loop-wiring`**

Wire the L2 Self-Prompt Layer to the SLM. Connect the Meta-Agent to the Manus API for autonomous repair task dispatch. Close the self-building loop.

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
| sprint-4-loop-wiring | Wire L2 Self-Prompt to SLM, Meta-Agent to Manus API | READY TO START ← NEXT |

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
