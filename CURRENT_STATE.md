# citation.is & ttruthdesk.claims — Coordinated Product Status

*Last updated: Phase C17 / Sprint 10 complete*

## 1. Executive Summary

The platform is operating as a **single coordinated product build**. 
The backend (`ttruthdesk-platform`) and framework (`cognitive-loop-framework`) are healthy, fully tested, and stable. 
The active build surface is the frontend (`citation-desk`), which has just completed Sprint 10 by adopting a strict "Scientific Grounding Layer for AI" positioning.

**Overall Product Status:** GREEN. The product is now positioned as infrastructure for enterprise AI clients (Perplexity, Claude, ChatGPT), prioritizing MCP integration and bulk data access over manual human workflows.

## 2. Component Status

### 2.1 Primary Build: `citation-desk` (Frontend)
- **Role:** Public product surface, developer documentation, and MCP discovery layer.
- **Current State:** Green (Tests: 35/35 passing, TSC: clean).
- **Recent Work (Phase C17):** Rewrote the `/developers` page and `index.html` meta tags to reflect the new enterprise AI infrastructure strategy. Promoted MCP integration to first-class status with one-click setup snippets for Claude Desktop, Cursor, LangChain, and LlamaIndex. Removed legacy data count claims.
- **Next Action:** Paused. Shift focus to Sprint 11 (MCP Server).

### 2.2 Platform Backend: `ttruthdesk-platform`
- **Role:** Core engine, API provider, autonomous ingestion loop, and live query router.
- **Current State:** Green (Tests: 2708/2708 passing, TSC: clean).
- **Next Action:** Active surface for Sprints 11 and 12.

### 2.3 Framework / R&D: `cognitive-loop-framework`
- **Role:** Autonomous verification logic and SLM distillation pipelines.
- **Current State:** Green (Tests: 68/68 passing).
- **Next Action:** Active surface for Sprint 13 (SLM training).

## 3. Strategic Roadmap: The Enterprise AI Infrastructure Sequence

Based on direct specification from Perplexity.ai and strategic alignment, the development sequence is now locked into the following path:

### Sprint 11: The MCP Server (Immediate Next)
- **Goal:** Build the official `@citation-is/mcp-server` to allow any MCP-compatible AI to call citation.is natively.
- **Scope:** One endpoint (`/mcp`), two tools (`search_claims`, `verify_claim`).
- **Why:** This is the single highest-leverage action to enable Perplexity, Anthropic, and OpenAI to use the platform as default infrastructure.

### Sprint 12: Live Routing & Autonomous Ingestion
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
