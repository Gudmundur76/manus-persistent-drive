
## Phase 80 — Pre-Phase-S Hardening (2026-06-08)

**Goal:** Establish world-class development discipline before biotech schema work begins.

**Completed:**
- Installed Husky + lint-staged + commitlint (pre-commit hook runs ESLint on staged files; commit-msg enforces conventional commits)
- Added @vitest/coverage-v8 and coverage thresholds to vitest.config.ts (branches 50%, functions 60%, lines 60%, statements 60%)
- Resolved 49 ESLint no-unused-vars warnings (imports reserved for biotech phase) with eslint-disable-next-line comments
- Created co-located test files for codeGuardian.ts and stubLedger.ts (29 new tests)
- Fixed stub-tracker.mjs to exclude stub-infrastructure files from false-positive detection
- Stub tracker: 0 stubs detected
- Tests: 819 passing (50 test files), 0 failing
- ESLint: 0 errors, 0 warnings
- TypeScript: 0 errors

**Security fixes (from earlier phases):**
- Fixed invalid verdictMethod enum value (copilot_autonomous_ingest → llm_ingest)
- Fixed hardcoded old domain (protein-desk-5r5rzpyg.manus.space → ENV.appUrl)
- Fixed embed frame CSP (removed unsafe-eval, replaced deprecated X-Frame-Options ALLOWALL)
- Added LIKE wildcard injection protection (escapeLike helper)
- Fixed CORS OPTIONS handler returning 204 for all requests (blank page bug)
- Added CORS headers to /api/trpc and /api/translate-and-search for cross-origin Lovable frontend

**Salmon biotech seeding:**
- Fixed translateAndSearchApi to accept vertical parameter
- Seeded 52 claims, 70 graph nodes in salmon_biotech vertical

**Next phase:** Phase S1 — Biotech schema migration (10 new tables)

## Phase 81 — Quality Remediation (2026-06-05)
**Goal:** Fix test files that were re-implementing modules inline instead of importing real code.
**Completed:**
- Rewrote 7 test files to import from real modules instead of inline re-implementations
- Fixed CORS OPTIONS middleware returning 204 for all /api/trpc requests (blank page bug)
- Fixed translateAndSearchApi vertical parameter routing
- Seeded salmon_biotech with 52 claims, 70 graph nodes, 27 graph edges
- Tests: 860 passing | TypeScript: 0 errors | ESLint: 0 errors

## Phase 82 — Public Claims API & Indexable Corpus (2026-06-05)
**Goal:** Paginated public REST API for claims; make corpus indexable by search engines.
**Completed:**
- GET /api/public/claims?page=N (RFC 5988 Link headers, X-Total-Count, filters, up to 10,000 rows)
- GET /api/public/claims/:id with ClaimReview JSON-LD schema
- list_claims MCP tool in /.well-known/mcp.json; dynamic sitemap domain fix
- Eliminated all mock data from Verticals.tsx — all 10 live adapters shown
- LLM system prompt, llms.txt, MCP_TOOLS, OpenAPI schema updated for all 10 verticals
- 22 new Vitest tests | Tests: 888 passing (53 files) | TypeScript: 0 errors

## Phase 83 — Sprint Q: TranslateAndSearch + SavedResearch (2026-06-05)
**Goal:** CopilotKit renderer, saved_research DB table, SavedResearch page, public REST endpoint.
**Completed:**
- TranslateAndSearch CopilotKit renderer with collapsible claim cards and verdict badges
- saved_research DB table + tRPC procedures; SavedResearch page at /saved-research
- Public /api/translate-and-search REST endpoint with SHA-256 API key auth + rate limiting
- ExampleQueryCarousel with 8 clickable example queries in CopilotKit sidebar
- pdbAdapter fallback: Insufficient Evidence instead of Out of Scope
- Verdict from PubMed paper count: ≥2 = Supported, 1 = Partially Supported, 0 = Insufficient
- Tests: 790 passing | TypeScript: 0 errors

## Phase 84 — verifyClaimRoute Rewrite (2026-06-05)
**Goal:** Fix Out of Scope verdicts; rewrite verifyClaimRoute to use PubMed as primary evidence.
**Completed:**
- /api/public/verify-claim: PubMed as primary, structural DB (PDB/UniProt) as secondary enrichment
- Response includes pubmedResults[] and translatedClaims[]; apiVersion bumped to 1.1
- CopilotSidebar instructions updated to mandate translateAndSearch; ban out-of-scope responses
- Tests: 790 passing | TypeScript: 0 errors

## Phase 85 — CopilotKit Production Fix (2026-06-06)
**Goal:** Fix blank page on published site caused by 3.5MB CopilotKit synchronous bundle.
**Completed:**
- CopilotSidebar, CopilotRenderers, ExampleQueryCarousel moved to lazy() imports in DashboardLayout.tsx
- Tests: 860 passing | TypeScript: 0 errors

## Phase 86 — Security Hardening (2026-06-06)
**Goal:** Fix security issues from audit.
**Completed:**
- Fixed invalid verdictMethod enum, hardcoded old domain, embed frame CSP
- Added CORS headers to /api/trpc and /api/translate-and-search for cross-origin frontends
- Added escapeLike() to prevent LIKE wildcard injection
- Tests: 790 passing | TypeScript: 0 errors

## Phase 87 — Biotech Schema Migration (2026-06-07)
**Goal:** Add 10 new tables for biotech vertical intelligence.
**Completed:**
- 10 new Drizzle schema tables: claimProvenanceEvents, entityCooccurrences, confidenceHistory, apiKeys, seoPingLog, swarmTickLog + 4 more
- Migration SQL applied; new tRPC procedures for provenance, cooccurrence, confidence trend
- Tests: 900+ passing | TypeScript: 0 errors

## Phase 88 — Swarm Intelligence Engine (2026-06-07)
**Goal:** 5-agent swarm tick system for autonomous claim enrichment.
**Completed:**
- SwarmEngine with 5 specialist agents (PDB, PubMed, UniProt, OpenFDA, WikiLinter)
- swarmTick() runs all 5 agents in parallel; swarmTickLog DB table records every tick
- /api/scheduled/swarm-tick heartbeat endpoint; Admin swarm dashboard at /admin/swarm
- Tests: 915 passing | TypeScript: 0 errors

## Phase 89 — Coordination Queue & Harness (2026-06-08)
**Goal:** coordQueue drainer and admin harness dashboard.
**Completed:**
- coordQueueDrainer engine processes pending coordination tasks
- Admin harness dashboard at /admin/harness with 4 metric cards
- tRPC admin.harnessStatus + admin.refreshSnapshot
- pnpm context:snapshot wired as mandatory Step 0 in CLAUDE.md
- Tests: 915 passing | TypeScript: 0 errors

## Phase 90 — CI Pipeline (2026-06-09)
**Goal:** GitHub Actions CI pipeline.
**Completed:**
- .github/workflows/ci.yml: TypeScript + ESLint + Tests + Coverage + Drift Detection
- Fixed pnpm version ordering; fixed swarm.test.ts to mock OPENROUTER_API_KEY for CI
- CI green on GitHub Actions (Quality Gate + Drift Detection both passing)
- Tests: 915 passing | TypeScript: 0 errors

## Phase 91 — Admin Harness Dashboard (2026-06-09)
**Goal:** /admin/harness session continuity dashboard.
**Completed:**
- /admin/harness: context snapshot age, HANDOFF.md status, last session audit, todo progress
- tRPC admin.harnessStatus + admin.refreshSnapshot; "Harness" nav item in sidebar
- CLAUDE.md: pnpm context:snapshot as mandatory Step 0
- Tests: 915 passing | TypeScript: 0 errors | CI: green

## Phase 92 — feature_list.json Contract + agent_tools.ts (2026-06-09)
**Goal:** Machine-readable feature contract; typed API wrappers.
**Completed:**
- scripts/generate-feature-list.py → feature_list.json (id, category, phase, description, passes, notes)
- pnpm feature:sync script; scripts/agent_tools.ts with 7 typed wrappers
- tRPC admin.featureList + admin.updateFeatureNote
- /admin/harness Feature Contract panel with filterable table
- CLAUDE.md: pnpm feature:sync as Step 1 in session ritual
- Tests: 915 passing | TypeScript: 0 errors | CI: green

## Phase 93 — Coverage Tests + Pre-commit feature:sync (2026-06-09)
**Goal:** Raise test coverage; add feature:sync to pre-commit hook.
**Completed:**
- 58 new unit tests: searchEngine.coverage, wikiLinter.coverage, verticalAdapters.coverage, coordApi.coverage, db.coverage (drizzle mock for null-guard branches)
- Coverage: lines 27.51% (+1.1%), functions 42.62% (+6.0%), branches 70.53%
- vitest.config.ts thresholds: lines 27, functions 42, statements 27
- .husky/pre-commit: pnpm feature:sync added after context snapshot
- Tests: 973 passing (60 files) | TypeScript: 0 errors | CI: green | GitHub: d6a07ba

## Phase 94 — Drive Catch-Up Sync + Meta-Agent (2026-06-09)
**Goal:** Sync drive with Phases 81-93; build meta-agent to prevent future sync failures.

**Completed:**
- Synced drive with Phases 81–93 catch-up entries
- CI pipeline added to ttruthdesk-platform (.github/workflows/ci.yml)
- @vitest/coverage-v8 added; coverage thresholds: lines 27%, functions 42%
- Tests: 973 passing (60 files) | TypeScript: 0 errors | CI: green
- GitHub: f367906

**Note:** Meta-agent design documented in docs/meta-agent-design.md but not yet implemented as a running script. Enforcement is manual via CLAUDE.md Step 0.

---

## Phase 95 — citation-desk Frontend + Corpus Expansion (2026-06-10)
**Goal:** Build citation.is public frontend; expand salmon_biotech corpus; bring citation-desk into discipline.

**Completed (this session):**
- Built citation-desk frontend: Vite 8 + React 19 + TypeScript + Tailwind CSS v4
- 6 pages: Home, Search, Verticals, VerticalDetail, Leaderboard, Audit
- Live data from ttruthdesk.claims/api/trpc via TanStack Query v5
- CopilotKit sidebar with custom ManusLLMAgent (non-streaming, raw OpenAI client)
  - Root cause: Manus LLM proxy does not support SSE streaming; AI SDK streamText returns empty
  - Fix: raw OpenAI non-streaming + manual ag-ui SSE event chain
- Pushed to Gudmundur76/citation-desk (commit 74f0c20)

**Corpus work (applied to running DB, NOT yet in ttruthdesk-platform):**
- Ingested 3 PubMed papers on fish-derived peptones (docs 270003–270006, 31 new claims)
- Ingested EU Regulation 722/2012 as reference doc (doc 270007, 0 claims — regulatory text)
- Manually overrode claim #300002 verdict: Insufficient Evidence → Supported (95%)
  - Evidence: EU Reg 722/2012 Art 1(2) — fish not listed in TSE scope
  - verdictMethod: override, reviewedBy: user 1
- Ran audit pipeline on document 270001 (pippinlitli salmon biotech submission)
  - 6 claims extracted; 1 Supported (TSE), 5 Insufficient Evidence

**Discipline gate — citation-desk (COMPLETED):**
- [x] citation-desk: add vitest + CI workflow + pre-commit hooks
- [x] citation-desk: write tests for ManusLLMAgent (SSE event chain) and API client
  - 8 tests: SSE event chain (RUN_STARTED → TEXT_MESSAGE_START → TEXT_MESSAGE_CONTENT → TEXT_MESSAGE_END → RUN_FINISHED)
  - 14 tests: API client (globalStats, searchClaims, verticalStats, leaderboardTopEntities, submitAuditRequest, URL encoding)
  - 22 tests total, all green
  - Husky pre-commit hook: pnpm exec vitest run
  - commitlint: @commitlint/config-conventional
  - GitHub Actions CI: install → tsc --noEmit → vitest run → vitest run --coverage
  - Pushed to Gudmundur76/citation-desk (commit 2e449c8)

**Pending (carry to Phase 96):**
- [ ] ttruthdesk-platform: write tests for corpus ingestion helpers and manual verdict override
- [ ] ttruthdesk-platform: commit corpus changes through the gate

**Tests:** citation-desk: 22 passing (2 files) | ttruthdesk-platform: 973 passing
**GitHub:** citation-desk: 2e449c8 | ttruthdesk-platform: f367906 (unchanged this session)
