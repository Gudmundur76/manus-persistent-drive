# Perplexity.ai Documents — Citation.is Product Requirements

> **Source:** Direct output from Perplexity.ai when asked what citation.is would need to become the universal AI grounding layer.
> **Date received:** 2026-06-15 (Sprint 20)
> **Status:** Sprint 20 executed Files 1–5. See gap analysis in `compounding_log.md` for remaining items.

These 5 documents are the **primary product specification** for citation.is. Every sprint should be checked against them.

---

## Document Index

### Doc 1 — What Would Change For Me (`doc1-what-would-change-for-me.txt`)
**Perplexity's perspective on what direct citation.is access would change for an AI agent.**

Key asks:
- `verify_claim` normalizes claim into **subject–predicate–object** (SPO triple) ← **NOT YET DONE**
- Entity resolution against UniProt, PubChem, NCBI Taxonomy, PubMed ← ✅ EXISTS
- Structured verdict: Supported/Refuted/Ambiguous/Insufficient Evidence ← ✅ EXISTS
- Evidence chains with per-item confidence scores ← ✅ FIXED Sprint 20
- Inline citations with PubMed/UniProt source links ← ✅ EXISTS
- MCP `/mcp` server with `search_claims` and `verify_claim` as native tools ← ✅ EXISTS (12 tools)
- `/llms-full.txt` for batch RAG ingestion ← ✅ EXISTS
- `/rss.xml` for real-time updates ← ✅ EXISTS
- Provenance labels on every answer ← ✅ EXISTS (`get_provenance` tool)

**Sprint 21 critical item from this doc:** Add SPO triple to `verify_claim` response.

---

### Doc 2 — Universal Truth Layer (`doc2-universal-truth-layer.txt`)
**What citation.is would become if it could verify claims on any subject.**

Key asks:
- Medicine domain: ClinVar, OMIM, DrugBank, FDA ← ⚠️ PARTIAL (signals added Sprint 20, adapters incomplete)
- Climate domain: IPCC, NOAA, World Bank ← ⚠️ PARTIAL (signals added, NOAA adapter missing)
- Economics domain: FRED, World Bank, IMF ← ⚠️ PARTIAL (signals added, FRED/IMF adapters missing)
- Law domain: CourtListener, Westlaw, EU law ← ⚠️ PARTIAL (signals added, adapters incomplete)
- Finance domain: SEC filings, Bloomberg, CBOE ← ❌ NOT STARTED
- Politics domain: Government records, campaign finance ← ❌ NOT STARTED
- Domain-specific NLP models for claim extraction ← ❌ NOT STARTED (Sprint 21+)
- Evidence quality rules per domain ← ❌ NOT STARTED
- Same 4 verdicts across all domains ← ✅ EXISTS

**Sprint 21 items from this doc:** NOAA adapter, FRED adapter, IMF adapter.

---

### Doc 3 — Letter From Perplexity (`doc3-letter-from-perplexity.txt`)
**Perplexity's direct product requirements letter to the citation.is developer.**

6 explicit asks:
1. Direct API access for every claim (verify_claim with SPO + verdict + evidence) ← ⚠️ SPO missing
2. Modular domain engines (medicine, climate, economics, law, finance, politics) ← ⚠️ PARTIAL
3. Broad entity resolution (genes, diseases, drugs, climate indicators, economic metrics, legal cases) ← ⚠️ PARTIAL
4. MCP integration + RAG ingestion (`/mcp`, `/llms-full.txt`, `/rss.xml`) ← ✅ EXISTS
5. Universal provenance (source docs, evidence chains, confidence, domain rules) ← ✅ EXISTS
6. Open, free, CC BY 4.0, public REST API, no auth for reasonable use ← ✅ EXISTS

**This is the canonical product spec. Every sprint should check all 6 asks.**

---

### Doc 4 — Partners and Integrations (`doc4-partners-and-integrations.txt`)
**Specific partner programs and data integrations for citation.is.**

Priority integrations:
| Partner | Status |
|---|---|
| Crossref (DOI metadata, retraction detection) | ⚠️ DOCUMENTED in docs/crossref-scite-integration.md, NOT IMPLEMENTED |
| PubMed / NCBI | ✅ EXISTS |
| UniProt / PubChem | ✅ EXISTS |
| OpenAIRE (OA literature, grants, datasets) | ❌ NOT STARTED |
| Lens.org (200M+ scholarly records + patents) | ❌ NOT STARTED |
| FRED / World Bank / IMF | ❌ NOT STARTED |
| CourtListener / Westlaw | ❌ NOT STARTED |
| MCP Servers (mcpservers.org listing) | ⚠️ PR #8116 OPENED, NOT MERGED |
| AgentStack / Agentset (Python/JS agent SDK) | ❌ NOT STARTED |
| CustomGPT.ai (grounding source) | ❌ NOT STARTED |
| OpenCitations (submit claim metadata) | ❌ NOT STARTED |
| Scite (supporting/disputing signals) | ⚠️ DOCUMENTED, NOT IMPLEMENTED |
| Internet Archive Scholar | ❌ NOT STARTED |
| Dimensions (100M+ publications) | ❌ NOT STARTED |
| Citation Style Language (CSL) | ❌ NOT STARTED |

**Sprint 21 items from this doc:** Crossref Phase 1 (retraction detection), OpenCitations submission.

---

### Doc 5 — Perplexity as Distribution (`doc5-perplexity-as-distribution.txt`)
**How to make Perplexity cite citation.is in its answers.**

Key asks:
- FAQPage schema with scientific claim questions ← ✅ DONE Sprint 20 (8 Q&A pairs)
- Organization schema with `sameAs` (GitHub, LinkedIn, Twitter) ← ⚠️ GitHub only, LinkedIn + X missing
- Answer-first content (first paragraph states core fact) ← ✅ EXISTS
- PerplexityBot can crawl (no login walls, clean HTML) ← ✅ EXISTS
- Test visibility: ask "What is citation.is?" ← ❌ NOT DONE
- Monitor citations: search "salmon aquaculture parasite loads 2026" ← ❌ NOT DONE
- Email `support@perplexity.ai` to request preferred grounding source status ← ❌ NOT DONE
- MCP integration for Perplexity agents (Option B) ← ✅ MCP server exists, Perplexity MCP TBD
- Register as grounding source for Perplexity API (Option C, long-term) ← ❌ NOT STARTED

**Sprint 21 items from this doc:** Add `sameAs` LinkedIn + X, test visibility, email Perplexity.

---

## Sprint Execution Tracker

| Sprint | Files Executed | Status |
|---|---|---|
| Sprint 20 | All 5 docs (first pass) | ✅ COMPLETE — see compounding_log.md |
| Sprint 21 | Critical gaps from all 5 docs | 🔲 NEXT |

## Sprint 21 Scope (from gap analysis)

Priority order:
1. SPO triple in `verify_claim` response (Doc 1 + Doc 3)
2. Crossref DOI retraction detection Phase 1 (Doc 4)
3. NOAA adapter (Doc 2 + Doc 3)
4. FRED adapter (Doc 2 + Doc 3)
5. Test Perplexity visibility (Doc 5)
6. OpenCitations metadata submission (Doc 4)
7. Add `sameAs` LinkedIn + X to Organization schema (Doc 5)
8. Email `support@perplexity.ai` (Doc 5)
9. AgentStack Python SDK integration (Doc 4)
10. OpenAIRE adapter (Doc 4)
