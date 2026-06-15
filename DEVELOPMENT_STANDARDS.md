# ttruthdesk.claims — Development Standards & Discipline Law

*Effective: Sprint 25 | Date: 15 June 2026*

This document is the single authoritative source of truth for how software is built in the `ttruthdesk-platform` ecosystem. It supersedes all previous discipline documents. 

The goal of this project is not to write code. The goal is to build a **stateless verification oracle for AI outputs** that is reliable enough for enterprise compliance officers to stake their reputations on. That requires world-class discipline.

---

## 1. The Core Philosophy: Verification of Verifiable Truth

We are not building a generic search engine. We are building a verification layer that sits between AI output and the user.

- **Truth is external:** The system does not decide what is true. It routes claims to authoritative primary sources and returns their verdict. The platform currently integrates a 29-source multi-domain verification network, including:
  - **Biomedical / Life Sciences:** PubMed, Europe PMC, RCSB PDB, UniProt, ClinicalTrials.gov, ClinVar, Cochrane, bioRxiv, OpenFDA, PubChem, ChEMBL
  - **Research / Academic:** arXiv, OpenAlex, Semantic Scholar, CrossRef, OpenCitations
  - **Regulatory / Legal:** SEC EDGAR, EUR-Lex, CourtListener, IETF RFC, NIST, EFSA OpenFoodTox
  - **Economics / Statistics:** World Bank, Eurostat, OECD, OWID, WHO
  - **Climate:** IPCC
  - **General:** Wikidata
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

## 4. Sprint 26 Build Plan: Multi-Domain Source Routing

**Context:** Sprint 25 successfully built `questionDecomposer.ts`, allowing natural language questions to be broken down into atomic SPO triples. However, currently all decomposed claims are hardcoded to route only to PubMed/EuropePMC. The platform already possesses 29 approved source adapters and 43 vertical implementations. To truly act as a general scientific and regulatory verification oracle, the system must intelligently route each decomposed claim to the correct primary source based on its domain.

**Goal:** Wire the `questionDecomposer` output to the full 29-source registry router so every decomposed claim is dispatched to the correct adapter by domain.

### Phase 1: AAIF Pre-Sprint Validation
- **Action:** Read memory blocks, verify MCP live, check production stats, and audit the current source router state.

### Phase 2: Update Development Standards
- **Action:** Reflect the full 29-source inventory in `DEVELOPMENT_STANDARDS.md` and document the Sprint 26 build plan (Completed).

### Phase 3: Build Domain Classifier (`domainClassifier.ts`)
- **Action:** Build a classifier that takes an atomic SPO triple and maps it to the correct source adapter(s) from the 29 approved sources.
- **Logic:** Use keyword heuristics, regex patterns, and LLM fallback to identify domain signals (e.g., "protein" -> RCSB PDB, "GDP" -> World Bank, "trial" -> ClinicalTrials.gov).

### Phase 4: Upgrade Question Router (`questionRouter.ts`)
- **Action:** Wire `domainClassifier` into the routing pipeline.
- **Logic:** Ensure that instead of defaulting to PubMed, the router queries the specific adapter returned by the classifier.

### Phase 5: Upgrade Verify Claim Route (`verifyClaimRoute.ts`)
- **Action:** Update the verification pipeline to handle multi-source verdict aggregation.
- **Logic:** If a question decomposes into multiple claims across different domains, aggregate the results into a cohesive final verdict with provenance from multiple distinct sources.

### Phase 6: Ralph Loop & Quality Gate
- **Action:** Write comprehensive Vitest tests for `domainClassifier.ts` and the upgraded router components.
- **Quality Gate:** Ensure all tests pass, achieving 100% green on `pnpm ci` (typecheck, lint, test).

### Phase 7: AAIF Discipline & Finalization
- **Action:** Write Sprint 26 track files (`post_sprint_log.md`).
- **Action:** Update Letta memory blocks.
- **Action:** Commit and push all repositories.
