# CURRENT_STATE.md — Meta-Development Command Centre

> **Read this file at the start of every session. It tells you exactly where you are, what you must do next, and what you must not touch.**

---

## Active Status

| Field | Value |
| :--- | :--- |
| **Date Updated** | 2026-06-14 |
| **Active Track** | `cognitive-loop-framework` |
| **Active Sprint** | `sprint-2-memory-layer` |
| **Sprint Status** | READY TO START |
| **Completion Promise** | `SPRINT 2 COMPLETE — RUVECTOR INTEGRATED, EMBEDDINGS PIPELINE OPERATIONAL` |

---

## What Was Just Done (This Session)

Sprint 1 of the cognitive-loop-framework was completed. The following was built:

- Initialised `cognitive-loop-framework` repository
- Built `ASTExtractor` using `tree-sitter` and `tree-sitter-typescript`
- Built `GraphWriter` to format AST nodes into `ttruthdesk-platform` compatible schema
- Wrote full test suites for both components (`vitest`)
- Resolved native binding compilation issues for tree-sitter
- Committed all changes to the local repository

---

## What Must Be Done Next

**Current sprint: `cognitive-loop-framework / sprint-2-memory-layer`**

Begin integrating RuVector to store the AST nodes and edges, and build the embedding pipeline to generate vector representations of the extracted code nodes.

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
| sprint-2-memory-layer | RuVector integration, embedding pipeline | READY TO START |
| sprint-3-slm-deployment | Fine-tune Qwen2.5-Coder, deploy via Ollama | QUEUED |
| sprint-4-loop-wiring | Wire L2 Self-Prompt to SLM, Meta-Agent to Manus API | QUEUED |

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
