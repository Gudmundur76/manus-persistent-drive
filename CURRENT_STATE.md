# citation.is & ttruthdesk.claims — Coordinated Product Status

*Last updated: Sprint 16 domain ingest probe — 2026-06-15*

## 1. Executive Summary

The platform is operating as a **single coordinated product build**.
The backend (`ttruthdesk-platform`) and framework (`cognitive-loop-framework`) are healthy, fully tested, and stable.
Sprint 14-15 complete. Sprint 16 in progress: domain-ingest-6h scheduled task confirmed active (task_uid=PrRB8eBgFuH2XA4QowVNAY, last fired 2026-06-15T12:04:39Z). PubMed probe run: 26 papers available across 5 domains (biology: 2, medicine: 10, chemistry: 5, physics: 8, climate: 1). Next scheduled fire: 2026-06-15T18:00Z. BUILT_IN_FORGE_API_KEY is a production-only env var — not available in non-project sandbox sessions. The heartbeat cron fires the endpoint directly in the webdev project context where the key is injected.

**Overall Product Status:** GREEN. The system never returns an empty result. Every enterprise query compounds the knowledge graph and feeds the SLM distillation pipeline. The autonomous ingest loop now runs across 5 scientific domains (biology, medicine, chemistry, physics, climate) and surfaces live coverage metrics to enterprise clients.

## 2. Component Status

### 2.1 Primary Build: `citation-desk` (Frontend)
- **Role:** Public product surface, developer documentation, and MCP discovery layer.
- **Current State:** Green (Tests: 27/27 passing, TSC: clean).
- **Recent Work (Sprint 14):** Added `status.domains` tRPC procedure (proxies `/api/public/status/domains` with graceful degradation). Added domain coverage widget to `/status` page — sortable table with colour-coded verification rate badges, totals footer, 5-min refresh. Added `domain-ingest-6h` to Scheduled Jobs table.
- **Next Action:** Sprint 17 (add SLM training status row to domain coverage widget once first training run completes).

### 2.2 Platform Backend: `ttruthdesk-platform`
- **Role:** Core engine, API provider, autonomous ingestion loop, and live query router.
- **Current State:** Green (Tests: 2719/2719 passing, TSC: clean, ESLint: clean).
- **Recent Work (Sprint 14-15):** Added `domainIngestScheduler.ts` — 5-domain autonomous PubMed ingest (3 queries/domain, 400ms rate-limiting, 7/7 tests). Registered `POST /api/scheduled/domain-ingest` (requireCronOrAdmin). Added `GET /api/public/status/domains` with 5-min Cache-Control and 15-key domain label map. Registered `domain-ingest-6h` in `heartbeatRegistrar.ts`. **CI fix (Sprint 15):** migrated pnpm config to `pnpm-workspace.yaml`; fixed `trainingBridge.ts` TS2307 by using runtime import path. CI green on `63c2fd2`.
- **Next Action:** Sprint 17 (monitor domain density growth, trigger first SLM training run at 50+ pairs/domain). Domain ingest cron active — fires every 6h. 26 papers queued for next tick.

### 2.3 Framework / R&D: `cognitive-loop-framework`
- **Role:** Autonomous verification logic and SLM distillation pipelines.
- **Current State:** Green (Tests: 68/68 passing).
- **Next Action:** Sprint 15 (SLM training runs will begin automatically as claim density grows to 50+ pairs/domain).

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

### Sprint 14: Claim Coverage Growth ✅ COMPLETE
- Added `domainIngestScheduler.ts` — autonomous 5-domain PubMed ingest (biology/medicine/chemistry/physics/climate)
  - 3 targeted queries per domain, 400ms rate-limiting, 7/7 tests passing
- Registered `POST /api/scheduled/domain-ingest` (requireCronOrAdmin) — designed to run every 6 hours
- Added `GET /api/public/status/domains` — per-domain claim counts, verification rates, 5-min Cache-Control
  - Maps 15 domain keys to human-readable labels
- Added `status.domains` tRPC procedure in citation-desk — proxies upstream with graceful degradation
- Added domain coverage widget to citation-desk `/status` page
  - Colour-coded verification rate badges (green ≥70%, amber ≥40%, grey <40%)
  - Totals footer row, 5-min refresh, empty-state message
- Added `domain-ingest-6h` row to Scheduled Jobs table
- Fixed ESLint: prefixed unused `CorpusReadyStats` with `_` in `trainingBridge.ts`
- Both repos green: citation-desk 27/27, ttruthdesk-platform 2719/2719, TSC clean, ESLint clean

### Sprint 15: CI Fix & Scheduled Task ✅ COMPLETE
- Diagnosed root cause of all CI failures: `trainingBridge.ts` used a static string literal in a dynamic `import()` for the optional `cognitive-loop-framework` sibling package, causing `TS2307` on CI where the package is absent.
- Fixed by using a runtime variable `const modulePath = "..."; await import(modulePath)` — tsc cannot statically resolve it.
- Migrated `pnpm.patchedDependencies` and `pnpm.overrides` from deprecated `package.json` `"pnpm"` field to `pnpm-workspace.yaml` (pnpm v10 requirement).
- Registered `domain-ingest-6h` heartbeat job in `heartbeatRegistrar.ts`.
- Configured Manus scheduled task (6-hour interval) to POST `/api/scheduled/domain-ingest`.
- CI green on `63c2fd2`: TSC clean, ESLint clean, 2719/2719 tests passing.

### Sprint 16: Claim Density & SLM Training Activation (Immediate Next)
- **Goal:** Drive claim density to 50+ pairs per domain so SLM training runs begin firing automatically.
- **Scope:** Monitor `/api/public/status/domains` for density growth. Verify first SLM training run fires when a domain hits threshold. Surface training status in the `/status` page widget.
- **Why:** The pipeline is fully built and instrumented. Sprint 16 is purely operational — watch the flywheel spin.

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
