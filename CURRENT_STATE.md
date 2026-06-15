# citation.is & ttruthdesk.claims — Coordinated Product Status

*Last updated: Sprint 13 complete — 2026-06-15*

## 1. Executive Summary

The platform is operating as a **single coordinated product build**. 
The backend (`ttruthdesk-platform`) and framework (`cognitive-loop-framework`) are healthy, fully tested, and stable. 
Sprint 13 is complete: the SLM distillation pipeline is fully wired. Every verified claim from the autonomous ingest loop now feeds a domain-specific training corpus. When a domain hits 50 pairs, the `IncrementalTrainer` fires automatically. The `/developers/slm` page is live.

**Overall Product Status:** GREEN. The system never returns an empty result. Every enterprise query compounds the knowledge graph and feeds the SLM distillation pipeline. The product is now a self-improving infrastructure — registry, live routing, autonomous ingest, and specialist model distillation all working together.

## 2. Component Status

### 2.1 Primary Build: `citation-desk` (Frontend)
- **Role:** Public product surface, developer documentation, and MCP discovery layer.
- **Current State:** Green (Tests: 35/35 passing, TSC: clean).
- **Recent Work (Sprint 13):** Added `/developers/slm` page — documents 4-stage pipeline (Ingest → Verify → Corpus → Distil), training corpus JSONL format, density threshold config, Ollama download examples, domain status table.
- **Next Action:** Sprint 14 (Claim coverage growth + domain expansion).

### 2.2 Platform Backend: `ttruthdesk-platform`
- **Role:** Core engine, API provider, autonomous ingestion loop, and live query router.
- **Current State:** Green (Tests: 2712/2712 passing, TSC: clean).
- **Recent Work (Sprint 13):** Added `trainingBridge.ts` singleton — holds `ClaimsCorpusGenerator` + `CorpusWatcher`. `emitVerdictEvent()` called fire-and-forget after every `updateClaimVerdict()` in `autonomousIngest.ts`. Maps `IngestVerdictEvent` → full `VerdictEvent`. `CorpusWatcher` auto-triggers `IncrementalTrainer` at 50-pair threshold.
- **Next Action:** Sprint 14 (activate scheduled ingest, domain coverage dashboard).

### 2.3 Framework / R&D: `cognitive-loop-framework`
- **Role:** Autonomous verification logic and SLM distillation pipelines.
- **Current State:** Green (Tests: 68/68 passing).
- **Next Action:** Sprint 14 (SLM training runs will begin automatically as claim density grows).

## 3. Strategic Roadmap: The Enterprise AI Infrastructure Sequence

Based on direct specification from Perplexity.ai and strategic alignment, the development sequence is now locked into the following path:

### Sprint 11: The MCP Server ✅ COMPLETE
- Built `@citation-is/mcp-server` npm package (TypeScript, MCP SDK, `search_claims`, `verify_claim`, `get_claim`)
- Updated `/.well-known/mcp.json` to citation.is branding
- Added `/developers/mcp` integration hub with all enterprise configs
- Both repos green: citation-desk 35/35, ttruthdesk-platform 2708/2708

### AAIF Integration ✅ COMPLETE
- Installed goose v1.37.0 and agentgateway v1.2.1 in sandbox — both wired to citation.is MCP
- Wrote `AGENTS.md` for both `citation-desk` and `ttruthdesk-platform` (structured persistent memory for AI agents)
- Added `infra/agentgateway/config.yaml` to ttruthdesk-platform for enterprise proxy deployments
- Added goose + agentgateway integration tabs to `/developers/mcp` page
- Added AAIF Ecosystem badge in `/developers/mcp` hero linking to aaif.io
- AAIF project proposal prepared for submission on public launch
- MCP Python SDK + langchain-mcp-adapters installed for Python agent integration

### Sprint 12: Live Routing & Autonomous Ingestion ✅ COMPLETE
- Fixed `loopTriggered` flag — now correctly `true` when PubMed results are present
- Added `claimId` surfacing from upstream response in MCP `verify_claim`
- Added `findClaimByText` to `db.ts` for fast registry lookup
- Added 4 new live routing tests (2712/2712 passing)
- Updated `/developers/mcp` page with Live Routing section documenting the full three-step flow

### Sprint 13: SLM Distillation ✅ COMPLETE
- Added `trainingBridge.ts` — singleton that holds `ClaimsCorpusGenerator` + `CorpusWatcher`
- `emitVerdictEvent()` wired into `autonomousIngest.ts` after every `updateClaimVerdict()`
- `CorpusWatcher` auto-triggers `IncrementalTrainer` when domain hits 50-pair threshold
- Added `/developers/slm` page — full pipeline documentation, JSONL format, Ollama examples, domain status table
- Both repos green: citation-desk 35/35, ttruthdesk-platform 2712/2712

### Sprint 14: Claim Coverage Growth (Immediate Next)
- **Goal:** Activate scheduled autonomous ingest and surface domain coverage metrics.
- **Scope:** Schedule the autonomous ingest loop to run on PubMed/UniProt/PDB for top 5 domains. Add `/status/domains` endpoint. Add domain coverage widget to `/status` page. Ask Perplexity what domains to prioritise.
- **Why:** The pipeline is built. Now it needs to run at scale so claim density grows and SLM training runs begin firing automatically.

## 4. Active Developer Tools (Sandbox)

| Tool | Version | Purpose |
|---|---|---|
| goose | v1.37.0 | AAIF agent runtime — wired to citation.is MCP |
| agentgateway | v1.2.1 | Enterprise MCP proxy with observability and retries |
| MCP Python SDK | latest | Python agent integration |
| langchain-mcp-adapters | latest | LangChain/LlamaIndex integration |

## 5. Operational Rules

1. **One Build:** We treat this as a single coordinated product.
2. **AI Co-development:** We formally ask enterprise AI systems (Perplexity, Claude) what they need before building, and we build exactly what they specify.
3. **Always Green:** We do not leave the session until the active repo passes `pnpm check` and `vitest`.
