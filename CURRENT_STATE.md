# Current State

*Last updated: Phase 134 / Sprint 40 complete — 2026-06-17*

## 0. Product Definition

**citation.is** is the public verification and search infrastructure for scientific claims.

It does two things:

**1. Verification (API primitive):** Send any scientific claim programmatically and receive a structured verdict — Supported, Refuted, Ambiguous, or Insufficient Evidence — with a confidence score, evidence provenance from peer-reviewed sources (PubMed, OpenAlex, CrossRef, Cochrane, and others), and contradiction flags. This is the infrastructure layer for AI agents, RAG pipelines, and developer tools that need to ground outputs in the scientific record.

**2. Live search (user-facing):** Ask any scientific question in natural language and receive a streamed, sourced answer — decomposed into sub-claims, verified against the literature, and returned with a verdict, confidence score, and direct links to source documents. This is the Perplexity-style surface that makes the same verification engine accessible to anyone without an API key.

Both capabilities draw from the same backend engine (`ttruthdesk.claims`) and the same corpus of 4,165 verified claims across 291 source documents.

**One-line definition:**
> citation.is is the verification and search infrastructure for scientific claims — a structured API for AI agents, and a live search engine for anyone who needs sourced answers from the scientific record.

**What it is not:** A consumer product, a social layer, a content generator, or a replacement for researchers. It is a primitive — a building block that other systems call.

---

## 1. Executive Summary

The platform is operating as a **single coordinated product build**.
The backend (`ttruthdesk-platform`) and frontend (`citation-desk`) are healthy, fully tested, stable, and **live in production**.

Phase C19 complete: in-place hero citation search shipped to citation.is. The homepage now streams live verified answers directly from the hero panel. Manus checkpoint `8b259ceb`. GitHub mirror at `d10a794`. CI fully green.

**Overall Product Status:** GREEN.
- Backend: **3,054 tests passing (Sprint 40)**. TSC clean. 61 adapters. Sprints 32–40 merged to main (`0a908ce`). CI ✅ green.
- Frontend: **35/35 tests passing (Sprint 39 / Phase C20)**. TSC clean. Published at citation.is (`f988892`).
- Live corpus: 4,165 claims, 856 verified, 291 source documents.

**Sprint 40 — Domain-Aware Claim Extraction (CRITICAL FIX):**
Root cause resolved: all papers were being extracted as `structural_biology` regardless of domain, producing 0 claims for neuroscience, economics, energy, etc. Fix: `domainClaimExtractor.ts` (per-domain prompts for all 12 domains), `domainInference.ts` (pattern-based domain classifier), `claimExtractor.ts` (domain-routed), `analysisPipeline.ts` (passes domain, zero-claim guard on notifications), `discoveryLoopJob.ts` (infers domain from paper text). Schema migration: `claimType` ENUM → `varchar(64)`. Backfill endpoint: `POST /api/admin/backfill-domain-claims`.

---

## 2. Component Status

### 2.1 Primary Build: `citation-desk` (Frontend)
- **Role:** Public product surface, developer documentation, live search, and MCP discovery layer.
- **Repo:** `Gudmundur76/citation-desk`
- **Production URL:** https://citation.is (also www.citation.is)
- **Current State:** GREEN — 35/35 tests passing, TSC clean, published.
- **Manus Checkpoint:** `8b259ceb` (Phase C19)
- **Last Mirror Commit:** `d10a794` — fix(CI): add missing page files Loop, Sources, Compare, Contact

**Phase C19 (2026-06-16):**
- Replaced static `ApiDemo` component in hero with live `HeroSearch` component
- Idle state: dark terminal panel with static demo response + search bar + 3 example queries
- Active state: SSE streaming with 3-stage progress (decompose → evidence → answer), colour-coded verdict panel (emerald/amber/red/grey), source cards with DOI links
- Added `GET /api/citation-search/stream` SSE proxy route in `externalProxy.ts` forwarding to `ttruthdesk.claims`
- CI fixed: 4 missing page files (Loop, Sources, Compare, Contact) added to mirror repo

**Phase C18 (2026-06-16):**
- Synced 9 commits from GitHub mirror: DevelopersRag page, /developers/rag route, Sprint 15 updates

**Phases C10–C17 (prior sessions):**
- v2 REST proxy endpoints (history, provenance, batch verify)
- Analytics keepalive cron, 7-verdict taxonomy, developer hub, RAG integration guide
- Agent headers middleware (Markdown content negotiation, Link headers, API catalog)
- Registry proxy, claim detail, search, verticals, entity pages

### 2.2 Platform Backend: `ttruthdesk-platform`
- **Role:** Core engine, API provider, autonomous ingestion loop, citation search, and live query router.
- **Repo:** `Gudmundur76/ttruthdesk-platform`
- **Production URL:** https://ttruthdesk.claims (internal engine — to be retired in favour of api.citation.is)
- **Current State:** GREEN — 3,022 tests passing (Sprint 38). TSC clean. CI ✅
- **Last Known Commit:** `2c4a914` (CI hardening — pre-push lint gate + ci:local script)

**CI Hardening (latest — 2026-06-17):**
- `pre-push` Husky hook: TSC + full ESLint on every push (< 15s)
- `scripts/ci-local.sh`: local Quality Gate simulation (`pnpm ci:local` / `pnpm ci:local:fast`)
- Commit: `2c4a914` — merged to main, CI ✅

**Sprint 38 (2026-06-17):**
- E2E integration tests for adapter→classifier→synthesizer chain (22 new tests)
- Branch: `sprint-38-e2e-integration` — merged to main

**Sprint 37 (2026-06-17):**
- IEA, IRENA, USGS adapters (energy + earth_science domains)
- 2 new domain rules, 3 new SourceIds, 30 new tests
- Branch: `sprint-37-energy-engineering` — ready to merge

**Sprint 36 (2026-06-17):**
- Coverage thresholds raised to match actuals (58/70/71/58)
- 18 new tests for world_bank, wikidata, alphafold uncovered paths
- Branch: `sprint-36-coverage-push` — ready to merge

**Sprints 32–35 (2026-06-17):**
- Merged into main: nutrition/food-safety, economics/law, molecular biology, social science adapters
- Main at `a87ef30` — 2,982 tests passing

**Sprint 28 (prior):**
- `GET /api/citation-search/stream` SSE endpoint — live and verified
- Rate limiting, batched NCBI efetch, LRU cache, PDB protein name extraction, input validation

**Sprint 27:**
- questionDecomposer.ts, Perplexity demo CLI, 2,800 tests

**Sprint 26:**
- domainClassifier.ts, contradiction API, claim history/provenance/batch verify

**Sprint 25:**
- SLM distillation pipeline, domain-ingest scheduler, MCP branding

**Sprints 21–24:**
- SPO triple, Crossref retraction, NOAA + FRED adapters, RuVector graph memory, confidenceScore null fix, PubMed relevance fix

### 2.3 Framework / R&D: `cognitive-loop-framework`
- **Role:** Autonomous verification logic and SLM distillation pipelines.
- **Current State:** Green (last known: 68+ tests passing).
- **Next Action:** Monitor domain density growth; trigger first SLM training run at 50+ pairs/domain.

---

## 3. Strategic Roadmap

### Sprints 11–20 ✅ COMPLETE
(MCP server, live routing, SLM distillation, claim coverage growth, CI, domain ingest, AAIF toolchain, RAG page, Perplexity 5-document execution)

### Sprints 21–28 ✅ COMPLETE
(SPO triple, Crossref retraction, NOAA/FRED adapters, RuVector graph memory, confidenceScore fix, PubMed relevance, questionDecomposer, citation search SSE endpoint)

### Phase C10–C19 (citation-desk) ✅ COMPLETE
(v2 proxy, analytics, agent headers, registry, search, claim detail, verticals, developer hub, RAG guide, in-place hero search)

### Sprints 29–39 / Phase C20 ✅ COMPLETE (2026-06-17)
(Citation search SSE, Sprint 32–35 adapter merges, Sprint 36 coverage push, Sprint 37 energy/earth_science adapters, Sprint 38 E2E integration tests, Sprint 39 frontend domain wiring)

### Next: Sprint 40 / Phase C21
- E2E smoke test on staging: full adapter → classifier → synthesizer → SSE stream against live ttruthdesk.claims API
- Update `/developers` page to lead with MCP + API capabilities (remove data count claims)
- Update all meta descriptions to infrastructure framing
- Consider: `api.citation.is` subdomain routing to ttruthdesk.claims
- Consider: notus.is as separate frontend calling same backend

---

## 4. Active Developer Tools (Sandbox)

| Tool | Version | Purpose | Status |
|---|---|---|---|
| goose | v1.37.0 | AAIF agent runtime — wired to citation.is MCP | INSTALLED |
| agentgateway | v1.2.1 | Enterprise MCP proxy with observability and retries | INSTALLED |
| MCP Python SDK | latest | Python agent integration | INSTALLED |
| langchain-mcp-adapters | latest | LangChain/LlamaIndex integration | INSTALLED |

---

## 5. MCP Server Status

- **Endpoint:** `https://ttruthdesk.claims/mcp` (also `/api/mcp`)
- **Discovery:** `https://ttruthdesk.claims/.well-known/mcp.json`
- **Tools:** 12 (verify_claim, search_claims, get_claim, get_provenance, verify_claims_batch, find_similar, get_entity_claims, get_domain_stats, get_contradictions, list_verticals, get_corpus_stats, entity_resolve)
- **Anonymous rate limit:** 10 req/hr per IP per tool
- **awesome-mcp-servers PR:** https://github.com/punkpeye/awesome-mcp-servers/pull/8116

---

## 6. Citation Search SSE Endpoint

- **Endpoint:** `GET https://ttruthdesk.claims/api/citation-search/stream?q=<query>`
- **Proxy:** `GET https://citation.is/api/citation-search/stream?q=<query>` (same, via Manus proxy)
- **Rate limit:** 20 req/hr per IP (enforced by backend)
- **Auth:** None required
- **SSE event shape:**
  - `stage:decompose` → `{ stage, label, question, claims[], primaryClaim }`
  - `stage:evidence` → `{ stage, label, sourcesFound, totalAdapters, sources[] }`
  - `stage:answer` → `{ stage, label, verdict, confidence, answerLength }`
  - `final` → `{ ok, question, primaryClaim, answer, verdict, confidence, sources[] }`

---

## 7. Persistent Memory Repos

| Repo | Purpose | Last Push |
|---|---|---|
| `Gudmundur76/citation-desk` | Frontend codebase | Sprint 39 — f988892 |
| `Gudmundur76/ttruthdesk-platform` | Backend codebase | CI hardening — 2c4a914 |
| `Gudmundur76/manus-persistent-drive` | Session state, phase log, memory | Phase 134 complete — 2026-06-17 |
| `Gudmundur76/memorydesk` | Cross-project AI memory layer | Not updated this session |

---

## 8. Operational Rules

1. **One Build:** We treat this as a single coordinated product.
2. **AI Co-development:** We formally ask enterprise AI systems (Perplexity, Claude) what they need before building, and we build exactly what they specify.
3. **Always Green:** We do not leave the session until the active repo passes `pnpm check` and `vitest`.
4. **Memory Sync:** Every sprint MUST end with: (a) update CURRENT_STATE.md, (b) append to compounding_log.md, (c) update agent_memory_blocks.json, (d) run goose verification, (e) push manus-persistent-drive.
5. **Ralph Wiggum Loop:** All TDD feature development uses the Ralph loop pattern (write failing test → fix → green → commit).
6. **citation.is is the product name.** ttruthdesk is the internal engine. ttruthdesk.claims domain to be retired in favour of api.citation.is over time.
7. **Out of scope until citation.is is fully shipped:** notus.is merge, Lagasafn, fishing vertical, new SLM runs.

---

## Phase 134 Agent Environment (17 Jun 2026)

| Component | Detail |
|---|---|
| Keep-warm cron | `keep-warm-5min` (task_uid: `nhXNQ4NMg8XW2BctURkjvt`) — every 5 min, `/api/scheduled/keep-warm` |
| Goose ACP server | port 3284, daemon, `http://localhost:3284/health` → `ok` |
| ttruthdesk MCP | HTTP extension at `https://ttruthdesk.claims/api/mcp` |
| Goose config | `~/.config/goose/config.yaml` — openrouter / gpt-4o-mini |
| Startup script | `protein-truth-desk/scripts/start-goose-acp.sh` |
| System prompt | `protein-truth-desk/MANUS_PROJECT_INSTRUCTIONS.md` — paste into Settings → Project Instructions |
| n8n | Removed from stack — Pipedream covers all automation |

