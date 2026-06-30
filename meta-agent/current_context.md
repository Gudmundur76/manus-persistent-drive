╔══════════════════════════════════════════════════════════╗
║         EVOLVA META-AGENT — SESSION CONTEXT BRIEF        ║
╚══════════════════════════════════════════════════════════╝

Phase:        Phase 141–142 — 2026-06-30
Status:       GREEN
Generated:    2026-06-30 21:33 UTC

Session Task: Build evolva-mragent memory server

## Executive Summary
The platform is operating as a **single coordinated product build**.
The backend (`ttruthdesk-platform`) and frontend (`citation-desk`) are healthy, fully tested, stable, and **live in production**.

Phase C19 complete: in-place hero citation search shipped to citation.is. The homepage now streams live verified answers directly from the hero panel. Manus checkpoint `8b259ceb`. GitHub mirror at `d10a794`. CI fully green.

**Overall Product Status:** GREEN.
- Backend: **3,616/3,618 tests passing (Phase 149)**. TSC clean. 61 adapters + structural_biology vertical agent. Phase 149 (structural biol

## Recent Sessions
  [session-2026-06-30-sprint3-drug-discovery.md]
  # Session Report: 2026-06-30 — Drug Discovery Sprint 3
*Written by Manus at end of session*

## Session Summary

This session completed the drug disco
  [session-2026-06-30-codebase-memory-install.md]
  # Session Report: 2026-06-30 — codebase-memory-mcp Installation
*Written by Manus at end of session*

## Summary

Installed codebase-memory-mcp 0.8.1 
  [meta-agent-bootstrap-2026-06-30.md]
  # Meta-Agent Bootstrap Response — 2026-06-30

Both analyses are done. Here's the summary:

HUGGINGFACE TRACTION ANALYSIS:

Your HuggingFace presence u

## Commands
  End session:  python3 /home/ubuntu/meta-agent/session_end.py --what '...' --phase '...'
  Query graph:  python3 /home/ubuntu/meta-agent/query.py 'What does X do?'
  Deep query:   python3 /home/ubuntu/meta-agent/deep_query.py 'Research X'  (async, 5-15min)

══════════════════════════════════════════════════════════

---
## Full CURRENT_STATE.md

# Current State

*Last updated: Phase 141–142 — 2026-06-30*

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
- Backend: **3,616/3,618 tests passing (Phase 149)**. TSC clean. 61 adapters + structural_biology vertical agent. Phase 149 (structural biology agent + ingest fixes) committed locally (`2a7c6a6`) — awaiting PAT push.
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
- **Current State:** GREEN — 4,272 
