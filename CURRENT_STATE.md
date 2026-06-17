# citation.is & ttruthdesk.claims — Coordinated Product Status
*Last updated: Phase 134 complete — 2026-06-17*

## 1. Executive Summary

The platform is operating as a **single coordinated product build**.
The backend (`ttruthdesk-platform`) and frontend (`citation-desk`) are healthy, fully tested, and stable.
Sprint 20 complete: all 5 Perplexity.ai documents executed. 6 commits across 2 repos. PR #8116 opened to punkpeye/awesome-mcp-servers.

**Overall Product Status:** GREEN. 2,761/2,761 tests passing. TSC clean.
The platform now covers 30+ research domains with 4,000+ verified claims. The MCP server exposes 12 tools. The discovery loop ingests claims across medicine, climate, economics, law, and structural biology.

**Phase 134 complete:** Always-on governed agent environment is live. Keep-warm cron (every 5 min), goose ACP server on port 3284 with ttruthdesk MCP registered, and Manus project instructions system prompt written.

## 2. Component Status

### 2.1 Primary Build: `citation-desk` (Frontend)
- **Role:** Public product surface, developer documentation, and MCP discovery layer.
- **Repo:** `Gudmundur76/citation-desk`
- **Current State:** Green (Tests: 27/27 passing, TSC: clean).
- **Recent Work (Sprint 20):**
  - Fixed em-dash encoding bug in "Needs Expert Review" label
  - Changed "97 Supported" stat label to "Supported Claims" (was misleading as percentage)
  - Wired loop animation cards to live `/api/public/corpus-growth` endpoint
  - Updated FAQPage JSON-LD: 8 Q&A pairs, 12 MCP tools, 30+ domains, correct MCP endpoint
  - Updated Organization JSON-LD: `alternateName`, `foundingDate`, `knowsAbout`, `contactPoint`, `sameAs`, `hasOfferCatalog`
  - Updated static shell for PerplexityBot: 4,000+ claims, 30+ domains, Medicine/Climate/Economics/Law verticals
  - Fixed MCP endpoint reference: `/mcp` → `https://ttruthdesk.claims/api/mcp`
- **Last Commit:** `518dff9` — feat(seo): Sprint 20 File 5 — FAQPage + Organization JSON-LD + PerplexityBot optimization
- **Next Action:** Sprint 21 (add SPO triple to verify_claim response; add `sameAs` LinkedIn + X to Organization schema)

### 2.2 Platform Backend: `ttruthdesk-platform`
- **Role:** Core engine, API provider, autonomous ingestion loop, and live query router.
- **Repo:** `Gudmundur76/ttruthdesk-platform`
- **Current State:** Green (Tests: 2719/2719 passing, TSC: clean, ESLint: clean).
- **Recent Work (Sprint 20):**
  - Fixed `verify_claim` confidence scoring: per-item keyword-overlap scoring (was flat 0.1 for all items)
  - Fixed `search_claims`: `min_confidence` filter moved into DB query; `total` now returns filtered count
  - Added `getContradictionsForClaim()` to `db.ts`; `verify_claim` now returns `contradictions[]` field
  - Added `/api/public/corpus-growth` endpoint (wired to `getCorpusGrowthStats()`)
  - Added 60+ domain signals to `CLAIM_SIGNALS` for medicine, climate, economics, law
  - Added `GET /api/v2/entities/resolve?name=&type=` endpoint for entity resolution
  - Added `docs/mcp-listing.md` — mcpservers.org + glama.ai submission details
  - Added `docs/crossref-scite-integration.md` — 4-phase Crossref + Scite integration plan
- **Last Commit:** `ced06a8` — docs(sprint20): File 4 — MCP listing plan + Crossref/Scite integration spec
- **Next Action:** Sprint 21 (implement Crossref DOI retraction detection; add NOAA + FRED adapters; add SPO triple to verify_claim response)

### 2.3 Framework / R&D: `cognitive-loop-framework`
- **Role:** Autonomous verification logic and SLM distillation pipelines.
- **Current State:** Green (Tests: 68/68 passing).
- **Next Action:** Monitor domain density growth; trigger first SLM training run at 50+ pairs/domain.

## 3. Strategic Roadmap

### Sprint 11: MCP Server ✅ COMPLETE
### Sprint 12: Live Routing & Autonomous Ingestion ✅ COMPLETE
### Sprint 13: SLM Distillation ✅ COMPLETE
### Sprint 14: Claim Coverage Growth ✅ COMPLETE
### Sprint 15: CI Fix & Scheduled Task ✅ COMPLETE
### Sprint 16: Domain Ingest Probe ✅ COMPLETE
### Sprint 17: SLM Progress Widget ✅ COMPLETE
### Sprint 18: AAIF Toolchain Integration ✅ COMPLETE
### Sprint 19: manually_reviewed filter + RAG page ✅ COMPLETE

### Sprint 20: Perplexity 5-Document Execution ✅ COMPLETE
- File 1: Fixed verify_claim pipeline (confidence scoring, search_claims, contradictions, corpus-growth)
- File 2: Added 60+ domain signals for medicine, climate, economics, law
- File 3: Validated all 6 developer asks; added entity resolve endpoint
- File 4: MCP listing docs + Crossref/Scite integration plan; PR #8116 to awesome-mcp-servers
- File 5: FAQPage + Organization JSON-LD + PerplexityBot optimization

### Sprint 21: Critical Gaps from Gap Analysis (Next)
- **Goal:** Close the 5 critical gaps identified in the Sprint 20 gap analysis.
- **Scope:**
  1. Add SPO triple to `verify_claim` response (Perplexity's #1 ask)
  2. Implement Crossref DOI retraction detection (Phase 1 of crossref-scite-integration.md)
  3. Add NOAA adapter (complete climate domain)
  4. Add FRED adapter (complete economics domain)
  5. Test citation.is visibility in Perplexity ("What is citation.is?")
  6. Submit metadata to OpenCitations
  7. Add `sameAs` LinkedIn + X to Organization schema

## 3b. Phase 134 — Agent Environment (17 Jun 2026)

| Component | Detail |
|---|---|
| Keep-warm cron | `keep-warm-5min` (task_uid: `nhXNQ4NMg8XW2BctURkjvt`) — every 5 min, `/api/scheduled/keep-warm` |
| Goose ACP server | port 3284, daemon, `http://localhost:3284/health` → `ok` |
| ttruthdesk MCP | HTTP extension at `https://ttruthdesk.claims/api/mcp` |
| Goose config | `~/.config/goose/config.yaml` — openrouter / gpt-4o-mini |
| Startup script | `protein-truth-desk/scripts/start-goose-acp.sh` |
| System prompt | `protein-truth-desk/MANUS_PROJECT_INSTRUCTIONS.md` — paste into Settings → Project Instructions |
| n8n | **Removed from stack** — Pipedream covers all automation |

## 4. Active Developer Tools (Sandbox)

| Tool | Version | Purpose | Status |
|---|---|---|---|
| goose | v1.37.0 | AAIF agent runtime — wired to citation.is MCP | INSTALLED |
| agentgateway | v1.2.1 | Enterprise MCP proxy with observability and retries | INSTALLED |
| MCP Python SDK | latest | Python agent integration | INSTALLED |
| langchain-mcp-adapters | latest | LangChain/LlamaIndex integration | INSTALLED |

## 5. MCP Server Status

- **Endpoint:** `https://ttruthdesk.claims/api/mcp`
- **Discovery:** `https://ttruthdesk.claims/.well-known/mcp.json`
- **Tools:** 12 (verify_claim, search_claims, get_claim, get_provenance, verify_claims_batch, find_similar, get_entity_claims, get_domain_stats, get_contradictions, list_verticals, get_corpus_stats, entity_resolve)
- **Anonymous rate limit:** 10 req/hr per IP per tool
- **awesome-mcp-servers PR:** https://github.com/punkpeye/awesome-mcp-servers/pull/8116

## 6. Persistent Memory Repos

| Repo | Purpose | Last Push |
|---|---|---|
| `Gudmundur76/citation-desk` | Frontend codebase | Sprint 20 — 518dff9 |
| `Gudmundur76/ttruthdesk-platform` | Backend codebase | Sprint 20 — ced06a8 |
| `Gudmundur76/manus-persistent-drive` | Session state, phase log, memory | Sprint 19 — 12bba8f (updating now) |
| `Gudmundur76/memorydesk` | Cross-project AI memory layer | Not updated this sprint |

## 7. Operational Rules

1. **One Build:** We treat this as a single coordinated product.
2. **AI Co-development:** We formally ask enterprise AI systems (Perplexity, Claude) what they need before building, and we build exactly what they specify.
3. **Always Green:** We do not leave the session until the active repo passes `pnpm check` and `vitest`.
4. **Memory Sync:** Every sprint MUST end with: (a) update CURRENT_STATE.md, (b) append to compounding_log.md, (c) update agent_memory_blocks.json, (d) run goose verification, (e) push manus-persistent-drive.
5. **Ralph Wiggum Loop:** All TDD feature development uses the Ralph loop pattern (write failing test → fix → green → commit).
