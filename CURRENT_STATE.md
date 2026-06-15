# citation.is & ttruthdesk.claims — Coordinated Product Status

*Last updated: Sprint 11 complete — 2026-06-15*

## 1. Executive Summary

The platform is operating as a **single coordinated product build**. 
The backend (`ttruthdesk-platform`) and framework (`cognitive-loop-framework`) are healthy, fully tested, and stable. 
The active build surface is the frontend (`citation-desk`). Sprint 11 is complete: the MCP server is polished, the `@citation-is/mcp-server` npm package is built and tracked in the repo, and the `/developers/mcp` integration hub is live.

**Overall Product Status:** GREEN. The MCP endpoint is fully operational. Any AI system supporting MCP can now integrate citation.is with a single config line. The product is positioned as the scientific grounding layer for enterprise AI clients.

## 2. Component Status

### 2.1 Primary Build: `citation-desk` (Frontend)
- **Role:** Public product surface, developer documentation, and MCP discovery layer.
- **Current State:** Green (Tests: 35/35 passing, TSC: clean).
- **Recent Work (Sprint 11):** Added `/developers/mcp` page — dedicated MCP integration hub with one-click setup for Claude Desktop, Cursor, HTTP direct, Python (LangChain), and TypeScript (LlamaIndex). Full tools reference, verdict schema, rate limits table, and discovery endpoints documented.
- **Next Action:** Sprint 12 (Live Routing & Autonomous Ingestion).

### 2.2 Platform Backend: `ttruthdesk-platform`
- **Role:** Core engine, API provider, autonomous ingestion loop, and live query router.
- **Current State:** Green (Tests: 2708/2708 passing, TSC: clean).
- **Recent Work (Sprint 11):** Updated `/.well-known/mcp.json` card to citation.is branding. Added `packages/mcp-server/` — the `@citation-is/mcp-server` npm package source (TypeScript, MCP SDK, 3 tools, full README).
- **Next Action:** Active surface for Sprint 12 (live routing layer).

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

### Sprint 12: Live Routing & Autonomous Ingestion (Immediate Next)
- **Goal:** Close the "registry miss" gap.
- **Scope:** When an AI query misses the registry, route it live to PubMed/UniProt, verify it in real-time, return the answer, and asynchronously write the new verified claim back to the registry.
- **Why:** The system never says "I don't know." Every enterprise query expands the knowledge graph automatically.

### Sprint 13: SLM Distillation
- **Goal:** Produce specialist models from verified claims.
- **Scope:** Trigger automated SLM training runs when a domain reaches sufficient claim density.
- **Why:** Moves the product from a data API to a provider of transparent, auditable specialist reasoning engines.

## 4. Operational Rules

1. **One Build:** We treat this as a single coordinated product.
2. **AI Co-development:** We formally ask enterprise AI systems (Perplexity, Claude) what they need before building, and we build exactly what they specify.
3. **Always Green:** We do not leave the session until the active repo passes `pnpm check` and `vitest`.
