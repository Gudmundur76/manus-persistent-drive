# Session Report: Architecture Audit, Strategy Discussion, and Ingestion Expansion
**Date:** 2026-06-13  
**Session type:** Deep audit + strategic discussion + active development  
**Repos touched:** ttruthdesk-platform, citation-desk, manus-persistent-drive  
**Commits pushed:** ttruthdesk-platform `afd6f4e` (4 adapters), `0a113c0` (20 adapters); citation-desk `4a683553`, `0361b355`, `6178ea60`, `809442f2`

---

## 1. Strategic Decisions Made This Session

### 1.1 The Engine Is the Company — citation.is Is One Surface

The most important clarification made this session: **ttruthdesk-platform is the company. citation.is is one public interface on top of it.** The same verification engine can power:
- citation.is — developer-facing MCP primitive and REST API
- laxey.is / TruthFrames — vertical product for salmon biotech supply chain
- Future vertical mini-sites (structural-biology.citation.is, gut-microbiome.citation.is, etc.)
- Enterprise tenants with bring-your-own-source corpora

None of these are different products. They are different routes on the same engine. The backend does not change.

### 1.2 Positioning: Verification Primitive, Not Data Product

**Locked positioning (permanent constraint):**
- citation.is is NOT a data product — it is software infrastructure
- citation.is is NOT a claims database — it is the verification primitive
- The data is the moat, not the offer
- Lead with the function call, not the corpus size
- **Locked headline:** "citation.is is the verification primitive for AI agents — and it's the only one that gets sharper the more it's used."
- Public sources free / bring-your-own-source paid — architecture, not pricing

### 1.3 Ingestion Sources Are the Critical Path

The engine is substantially built (Phase 108, 1,140 tests, 0 TS errors). The one real gap is source coverage breadth. The decision was made to expand from 9 approved sources to 30 approved sources in this session, making the engine domain-agnostic.

### 1.4 The Dream State and Source Verification Agent

Two architectural concepts confirmed as the next meaningful build phases:
1. **Source Verification Agent (Phase 109):** A dedicated agent that watches sources for updates (new IPCC report, retracted paper, revised WHO guideline), traces every claim grounded in that source, and re-evaluates them. Prevents the corpus from becoming a liability as it grows.
2. **Dream State (partially built):** The `server/dream/` directory contains five components running five sequential cycles. This is the consolidation and stress-testing layer — it finds latent patterns, generates topology hypotheses, recalibrates confidence, and simulates contradictions when the system is not under load.

### 1.5 Question-Answering Interface (Phase 110)

The engine can answer questions directly — not just verify claims. A question-to-claim conversion step (single LLM call) at the front of the pipeline enables demand-triggered loop activation. Every question that hits a coverage gap becomes a research task. The corpus grows in the direction of actual demand. This is the "Perplexity at primary-source standards" thesis.

### 1.6 Knowledge Staleness Safeguards Are Required Before Scale

Three failure modes identified:
- **Simple staleness** — handled by re-evaluation engine (existing)
- **Supersession** — new source definitively invalidates old claim; needs a supersession signal (not yet built)
- **Version drift** — source is updated, engine holds old version; needs source version tracking (not yet built)

These must be built before the corpus grows significantly. A larger corpus without these safeguards is a liability.

---

## 2. Current State of ttruthdesk-platform

### 2.1 Build Status
- **Phase:** 108 complete
- **Tests:** 1,140/1,140 passing (69 test files)
- **TypeScript:** 0 errors
- **Schema tables:** 26+ (Drizzle ORM, MySQL/TiDB)

### 2.2 Autonomous Loop — Five Layers, All Built

| Layer | File | Cadence |
|---|---|---|
| Friction Engine | `server/frictionEngine.ts` | Per-submission (preflight scan) |
| Self-Prompt Engine | `server/selfPromptEngine.ts` | Every 2 hours |
| Frontier Engine | `server/frontierEngine.ts` | Every 6 hours |
| Re-evaluation Engine | `server/reEvaluationEngine.ts` | Every 6 hours |
| Dream Engine | `server/dream/dreamEngine.ts` | Scheduled low-priority |

### 2.3 Dream Engine Components (Partially Built — More Complete Than Expected)
- `dreamEngine.ts` — orchestrates five sequential cycles, persists to `dream_sessions` table
- `latentPatternDetector.ts` — finds latent structure in existing knowledge
- `graphConsolidator.ts` — consolidates and deduplicates graph edges
- `topologyHypothesisGenerator.ts` — generates hypotheses about graph structure
- `contradictionSimulator.ts` — stress-tests claim pairs
- `confidenceRecalibrator.ts` — adjusts confidence scores based on graph evidence

### 2.4 Analysis Pipeline — 8 Stages
1. Claim extraction (LLM)
2. Vertical adapter lookup (source-specific)
3. Completeness check
4. Verdict engine
5. Misrepresentation classifier (fires for Contradicted/Partially Supported only)
6. Citation chain analysis (PubMed elink, hop-by-hop distortion scoring)
7. Composite truth signal (8-state label)
8. Passage extraction (background, non-fatal)

### 2.5 Composite Truth Labels (8 States)
`verified_faithful` | `verified_distorted` | `contradicted` | `contradicted_amplified` | `partially_supported` | `contested` | `insufficient_evidence` | `out_of_scope`

**Note:** citation.is public API currently exposes 4 states. The engine computes 8. This gap undersells what is running.

### 2.6 Scheduled Cron Jobs (All Registered)
| Job | Cadence |
|---|---|
| Autonomous loop tick | Every 2 hours |
| Frontier engine | Every 6 hours |
| Re-evaluation engine | Every 6 hours |
| PMC feed (8 verticals, MeSH queries) | Nightly 01:00 UTC |
| Quality pass (premium LLM re-process) | Nightly 02:00 UTC |
| Discovery loop (PubMed, bioRxiv, PDB) | Daily 08:00 UTC |
| Swarm tick (meta-agent health) | Daily 03:00 UTC |
| Contradiction scan | Weekly Monday |
| Wiki engine lint | Weekly Sunday |
| PubMed deCODE | Weekly Monday |

### 2.7 Source Registry — 30 Approved Sources (After This Session)

**Original (9):** RCSB PDB, PubMed, UniProt, ClinicalTrials.gov, OpenFDA, EFSA OpenFoodTox, CrossRef, OpenAlex, Semantic Scholar

**Added this session (21):** WHO GHO, Cochrane Library, bioRxiv/medRxiv, Europe PMC, ClinVar, ChEMBL, PubChem, OpenFDA Drug Labels, SEC EDGAR, EUR-Lex, CourtListener, IETF RFC Editor, World Bank, Our World in Data, OECD, Eurostat, IPCC, arXiv, Wikidata, NIST, Generic URL/DOI fallback

### 2.8 SIA Integration Status
- `sia/tasks/citation_integrity_task.py` — defined
- `sia/evaluate.py` — scores four metrics: verdict accuracy, passage recall, misrepresentation recall, chain distortion detection
- Phases 111–114 planned for SIA harness improvement loop
- CodeRabbit `.coderabbit.yaml` — NOT YET configured for ttruthdesk-platform (gap)

---

## 3. Current State of citation-desk

### 3.1 Build Status
- **Tests:** 35/35 passing (5 test files, 1 skipped)
- **TypeScript:** 0 errors
- **Deployment:** Live at citationapp-b3hingka.manus.space / citation.is

### 3.2 Architecture
citation-desk is a **pure proxy and brand layer** over ttruthdesk-platform. It does not have its own database or business logic. All data comes from ttruthdesk.claims via `externalProxy.ts`.

**Key proxy routes:**
- `GET /.well-known/mcp.json` — intercepts upstream, rewrites brand in-flight, 5-min in-memory cache
- `GET /mcp` — pipes SSE stream from upstream with brand rewriting per chunk
- `POST /mcp` — JSON-RPC handler with full brand rewriting
- `GET /api/external/trpc/:procedure` — proxies tRPC GET calls
- `POST /api/external/trpc/:procedure` — proxies tRPC mutations
- `GET /api/external/public/*` — proxies public REST endpoints
- `POST /api/public/verify-claim` — proxies verify endpoint
- `GET /openapi.json` — serves static citation.is-branded OpenAPI spec

### 3.3 Brand Rewrite Layer
`rewriteBrand()` replaces all occurrences of:
- `ttruthdesk.claims` → `citation.is`
- `"Truth Desk"` → `"citation.is"`
- `"Arctic Media LLC"` → `"citation.is"`
- `provider.name` → `"citation.is"`
- Claim record URLs: `/claim/` → `/claims/`

### 3.4 MCP Card (4 Canonical Tools Exposed)
`verify_claim` | `search_claims` | `get_evidence` | `get_platform_summary`

Upstream exposes 7+ tools. The proxy filters to 4 and renames as needed (e.g., `list_claims` → `search_claims`).

### 3.5 Verdict Vocabulary (Normalised)
`Supported` | `Refuted` | `Ambiguous` | `Insufficient Evidence`

Proxy maps upstream variants: `inconclusive → Ambiguous`, `Contradicted → Refuted`, `Partially Supported → Ambiguous`, `Out of Scope → Insufficient Evidence`.

**Note:** The engine computes 8 composite truth states. The public API exposes 4. Exposing the full 8-state label is a planned improvement.

### 3.6 Warmup Cron
Fires every 5 minutes, pings three upstream endpoints in parallel:
1. `/.well-known/mcp.json` — MCP card (slow cold start, ~11 KB)
2. `POST /mcp` (initialize) — MCP JSON-RPC transport
3. `/api/public/claims?limit=1` — REST API

### 3.7 Contact Form
`/contact` page live. Submissions delivered via `notifyOwner()` to pippinlitli@gmail.com. Fields: name, email, organisation, subject (dropdown), message. No email addresses exposed publicly. No Genspark-specific subject tags.

### 3.8 Pages Live on citation.is
`/` | `/loop` | `/verify` | `/sources` | `/compare` | `/search` | `/verticals` | `/verticals/:id` | `/leaderboard` | `/audit` | `/about` | `/registry` | `/claims/:id` | `/audits/:id` | `/entity/:id` | `/developers` | `/contradictions` | `/methodology` | `/pricing` | `/dashboard` | `/status` | `/contact`

### 3.9 Brand Exposure Audit (Clean)
All internal infrastructure references removed from public-facing pages:
- `ttruthdesk-platform` GitHub link — removed from Methodology
- `ttruthdesk.claims` links — removed from Status, Developers
- `hexo-ai/sia` GitHub link — removed from Status
- `info@citation.is` email — removed from Methodology (replaced with /contact)
- All contact directed to `/contact` form only

---

## 4. Development Protocol (Active Constraints)

### 4.1 Quality Gates (Must Pass Before Any Commit)
```
pnpm check   → 0 TypeScript errors
pnpm test    → all tests passing
pnpm stubs   → stub count (no stubs in production files)
```

### 4.2 Commit Convention
Conventional Commits: `feat:`, `fix:`, `test:`, `refactor:`, `chore:`

### 4.3 Code Standards
- Functions under 80 lines
- No `as any` in production files
- No stubs committed to main
- Tests before implementation (TDD)
- Ralph Wiggum loop: write test → fail → implement → pass → commit

### 4.4 Memory Repo Sync
After every phase: commit to ttruthdesk-platform, then sync session report to manus-persistent-drive.

### 4.5 Manus Sandbox Constraints
- Single Node.js process on Cloud Run
- 1 vCPU, 512 MiB RAM, 180s request timeout, min-instances=0 (cold starts)
- No Python/Go/native binaries beyond npm
- No persistent background workers
- Static assets must be uploaded via `manus-upload-file --webdev`, not stored in `client/public/`

---

## 5. Next Phases

| Phase | Description | Priority |
|---|---|---|
| **109** | Source version tracking + supersession signal — prevents corpus from becoming a liability | Critical |
| **110** | Question-to-claim interface + demand-triggered loop — enables direct Q&A at primary-source standards | High |
| **111** | SIA task directory formalisation + CodeRabbit `.coderabbit.yaml` for ttruthdesk-platform | Medium |
| **112** | Micron deployment — vertical mini-sites (structural-biology.citation.is, etc.) | Medium |
| **113–114** | SIA harness improvement loop | Low |

### Phase 109 Design Notes
The source verification agent needs to:
1. Track a `source_version` and `last_checked_at` per source in the registry
2. Poll each source's canonical "last updated" endpoint on a schedule
3. When a version change is detected, queue all claims grounded in that source for re-evaluation
4. For superseded claims (new source definitively contradicts old verdict), mark as `superseded` not just `contested`
5. Emit a `source_updated` event to the autonomous loop event bus

---

## 6. Open Questions / Decisions Deferred

- **Expose 8-state composite truth label publicly** — currently only 4 states exposed via citation.is API. Exposing the full label would better represent the engine's capability.
- **Generic question-answering interface** — whether to expose as a second MCP tool (`answer_question`) or as a user-facing page on citation.is, or both.
- **CodeRabbit configuration** — `.coderabbit.yaml` not yet added to ttruthdesk-platform. Should be added before next PR.
- **Hexo Labs / SIA relationship** — decision made: do not collaborate. The engine's domain-specific implementation (with hallucination brake via FrictionEngine) is more complete in the verification domain than the generic SIA framework.
- **Microsoft Azure** — noted as preferred cloud provider for biotech models and SLM capabilities (from memory). Not yet actioned.

---

## 7. Repos and Branches

| Repo | URL | Branch | Latest Commit |
|---|---|---|---|
| ttruthdesk-platform | github.com/Gudmundur76/ttruthdesk-platform | main | `0a113c0` |
| citation-desk | github.com/Gudmundur76/citation-desk | main | `809442f2` (checkpoint) |
| manus-persistent-drive | github.com/Gudmundur76/manus-persistent-drive | main | this commit |

All repos are **private** (set to private this session — 20 repos total).

---

*Report written by Manus AI — 2026-06-13*
