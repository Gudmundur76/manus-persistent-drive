# citation.is & ttruthdesk.claims — Coordinated Product Status

*Last updated: Sprint 12 complete — 2026-06-15*

## 1. Executive Summary

The platform is operating as a **single coordinated product build**. 
The backend (`ttruthdesk-platform`) and framework (`cognitive-loop-framework`) are healthy, fully tested, and stable. 
The active build surface is the frontend (`citation-desk`). Sprint 12 is complete: the live routing flow is fully wired — `loopTriggered` correctly reflects PubMed activity, `claimId` is surfaced from the upstream response, and the `/developers/mcp` page now documents the full three-step flow.

**Overall Product Status:** GREEN. The system never returns an empty result. Every enterprise query that misses the registry is routed live to PubMed/UniProt/PDB, verified, returned, and written back to the registry asynchronously. The knowledge graph compounds with every query.

## 2. Component Status

### 2.1 Primary Build: `citation-desk` (Frontend)
- **Role:** Public product surface, developer documentation, and MCP discovery layer.
- **Current State:** Green (Tests: 35/35 passing, TSC: clean).
- **Recent Work (Sprint 12):** Added Live Routing & Autonomous Ingestion section to `/developers/mcp` page. Documents the three-step flow (registry lookup → live routing → autonomous ingest), `loopTriggered` flag, and `claimId` surfacing.
- **Next Action:** Sprint 13 (SLM Distillation Pipeline).

### 2.2 Platform Backend: `ttruthdesk-platform`
- **Role:** Core engine, API provider, autonomous ingestion loop, and live query router.
- **Current State:** Green (Tests: 2712/2712 passing, TSC: clean).
- **Recent Work (Sprint 12):** Fixed `loopTriggered` flag in MCP `verify_claim` — now correctly set `true` when PubMed results are present. Added `claimId` surfacing from upstream response. Added `findClaimByText` to `db.ts`. Added 4 new live routing tests.
- **Next Action:** Active surface for Sprint 13 (SLM distillation trigger).

### 2.3 Framework / R&D: `cognitive-loop-framework`
- **Role:** Autonomous verification logic and SLM distillation pipelines.
- **Current State:** Green (Tests: 68/68 passing).
- **Next Action:** Active surface for Sprint 13 (SLM training).

## 3. Strategic Roadmap: The Enterprise AI Infrastructure Sequence

Based on direct specification from Perplexity.ai and strategic alignment, the development sequence is now locked into the following path:

### Sprint 11: The MCP Server ✅ COMPLETE
- Built `@citation-is/mcp-server` npm package (TypeScript, MCP SDK, `search_claims`, `verify_claim`, `get_claim`)
- Updated `/.well-known/mcp.json` to citation.is branding
- Added `/developers/mcp` integration hub with all enterprise configs
- Both repos green: citation-desk 35/35, ttruthdesk-platform 2708/2708

### Sprint 12: Live Routing & Autonomous Ingestion ✅ COMPLETE
- Fixed `loopTriggered` flag — now correctly `true` when PubMed results are present
- Added `claimId` surfacing from upstream response in MCP `verify_claim`
- Added `findClaimByText` to `db.ts` for fast registry lookup
- Added 4 new live routing tests (2712/2712 passing)
- Updated `/developers/mcp` page with Live Routing section documenting the full three-step flow

### Sprint 13: SLM Distillation (Immediate Next)
- **Goal:** Produce specialist models from verified claims.
- **Scope:** Audit `cognitive-loop-framework` SLM training component. Define claim density threshold. Wire trigger into autonomous ingest loop. Add `/developers/slm` page.
- **Why:** Moves the product from a data API to a provider of transparent, auditable specialist reasoning engines — exactly what regulated enterprise clients require.

## 4. Operational Rules

1. **One Build:** We treat this as a single coordinated product.
2. **AI Co-development:** We formally ask enterprise AI systems (Perplexity, Claude) what they need before building, and we build exactly what they specify.
3. **Always Green:** We do not leave the session until the active repo passes `pnpm check` and `vitest`.
