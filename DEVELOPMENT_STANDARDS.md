# ttruthdesk.claims — Development Standards & Discipline Law

*Effective: Sprint 25 | Date: 15 June 2026*

This document is the single authoritative source of truth for how software is built in the `ttruthdesk-platform` ecosystem. It supersedes all previous discipline documents. 

The goal of this project is not to write code. The goal is to build a **stateless verification oracle for AI outputs** that is reliable enough for enterprise compliance officers to stake their reputations on. That requires world-class discipline.

---

## 1. The Core Philosophy: Verification of Verifiable Truth

We are not building a generic search engine. We are building a verification layer that sits between AI output and the user.

- **Truth is external:** The system does not decide what is true. It routes claims to authoritative primary sources (PubMed, PDB, ClinicalTrials.gov, CrossRef) and returns their verdict.
- **Provenance is mandatory:** Every verified claim must return a direct citation chain — paper title, PMID, and the exact supporting sentence.
- **Narrow focus:** We prefer a narrow, highly accurate verification against a single source (e.g., protein data) over broad, ungrounded guesses.
- **Stateless by default:** The system must verify against live sources. The corpus is a cache and a training substrate, not the source of truth.

---

## 2. The Toolchain: AAIF & Internal Tools

We use the [Agentic AI Foundation (AAIF)](https://aaif.io/) toolchain and strict internal protocols to ensure zero drift and maximum observability.

### 2.1 The AAIF Pre-Sprint Validation (Mandatory)
Before any code is written in a new sprint, the agent MUST run the following sequence to ensure it has the correct state and the infrastructure is healthy.

1. **Read Memory:** `python3 /home/ubuntu/manus-persistent-drive/scripts/memory.py read sprint_state`
2. **Verify MCP Live:** Call `ttruthdesk.claims/api/mcp` to confirm the production server is responding.
3. **Check Stats:** Call `ttruthdesk.claims/api/public/stats` to verify corpus health.
4. **Start agentgateway:** Route all local MCP traffic through `agentgateway -f infra/agentgateway/config.yaml` for observability.

### 2.2 Manus Persistent Drive (`manus-persistent-drive`)
The persistent drive is the project's long-term memory. It is not a backup; it is the command centre.
- **No session begins** without reading `CURRENT_STATE.md` and the active sprint's `loop_prompt.md`.
- **No session ends** without committing and pushing changes to the persistent drive.
- **Sprint Track Files:** Every sprint must have `loop_prompt.md`, `acceptance_criteria.md`, and `post_sprint_log.md` in `tracks/ttruthdesk/sprints/<sprint>/`.

### 2.3 The Ralph Wiggum Loop (TDD)
We build using a strict, self-referential Test-Driven Development loop:
1. Write the failing test first.
2. Write the minimum code to pass the test.
3. Refactor.
4. Run the full quality gate (`pnpm ci`).

---

## 3. The Strict Build Discipline

Drift is the enemy of production software. These rules prevent it.

1. **The Quality Gate is Law:** No commit is made until `pnpm ci` (which runs `typecheck`, `lint`, and `test:run`) passes with zero errors and zero warnings.
2. **File Size Limits:** No file exceeds 200 lines. Split immediately.
3. **Function Size Limits:** No function exceeds 20 lines. Decompose immediately.
4. **No Skeleton Code:** Every committed file must be complete and production-ready. No `TODO` comments left behind.
5. **Atomic Commits:** Commit messages must follow the format: `<type>(sprint-N): <what was built> — <X> tests passing`. Do not mix features and refactors.
6. **Phase-Based Development:** Each phase of the sprint plan must be fully completed and verified before advancing to the next.

---

## 4. Sprint 25 Build Plan: The Stateless Oracle Entry Point

**Context:** Perplexity.ai has confirmed that a stateless verification oracle with sentence-level provenance is highly desirable for their enterprise workflows. However, our current entry point requires a structured claim. To integrate with Perplexity Computer, we must accept natural language questions, decompose them into atomic claims, and verify them in real-time (sub-500ms target).

**Goal:** Build the Natural Language Decomposition Layer and benchmark latency against BioMCP.

### Phase 1: BioMCP Benchmark & Latency Profiling
- **Action:** Install and test the `biomcp-python` package.
- **Action:** Profile the latency of our current `verifyClaimRoute.ts` PubMed query.
- **Deliverable:** A benchmark report comparing our latency and entity resolution against BioMCP, identifying the exact bottleneck preventing sub-500ms responses.

### Phase 2: Natural Language Decomposition (SPO Extraction)
- **Action:** Build `questionDecomposer.ts`.
- **Logic:** Accept a natural language string. Use the existing LLM pipeline (via free tier APIs for seeding/testing) to extract atomic Subject-Predicate-Object (SPO) triples.
- **Quality Gate:** Must accurately handle complex sentences (e.g., "Does aspirin reduce cardiovascular risk in patients over 70?") and return discrete verifiable claims.

### Phase 3: Parallel Multi-Source Routing
- **Action:** Upgrade `verifyClaimRoute.ts` to accept an array of decomposed claims.
- **Logic:** Route each claim concurrently to the appropriate primary source adapter (PubMed, PDB, etc.) to minimize total request latency.
- **Quality Gate:** Total roundtrip time for a multi-claim question must be aggressively optimized.

### Phase 4: Integration Demo Preparation
- **Action:** Create a self-contained script (`demo-perplexity.ts`) that simulates a Perplexity Computer workflow: Natural Language Question → Decomposition → Parallel Verification → Verdict + Provenance.
- **Deliverable:** A working, sub-2-second demo ready to be shown to Perplexity's Head of Developer Platform.

### Phase 5: AAIF Discipline & Quality Gate
- **Action:** Run `pnpm ci` on `ttruthdesk-platform`.
- **Action:** Write Sprint 25 track files (`post_sprint_log.md`).
- **Action:** Update `CURRENT_STATE.md` and Letta memory blocks.
- **Action:** Commit and push all repositories.
