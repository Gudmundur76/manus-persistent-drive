# Current State

*Last updated: Phase C19 complete — 2026-06-16*

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
- Backend: 2,855 tests passing (Sprint 28). TSC clean.
- Frontend: 35/35 tests passing (Phase C19). TSC clean. Published at citation.is.
- Live corpus: 4,165 claims, 856 verified, 291 source documents.

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
- **Current State:** GREEN — 2,855 tests passing (Sprint 28). TSC clean.
- **Last Known Commit:** `6653bf9` (Sprint 28 — citation search route deployed)

**Sprint 28 (latest):**
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

### Next: Phase C20 / Sprint 29
- Verify citation search end-to-end in production at citation.is
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
| `Gudmundur76/citation-desk` | Frontend codebase | Phase C19 — d10a794 |
| `Gudmundur76/ttruthdesk-platform` | Backend codebase | Sprint 28 — 6653bf9 |
| `Gudmundur76/manus-persistent-drive` | Session state, phase log, memory | This update — 2026-06-16 |
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
