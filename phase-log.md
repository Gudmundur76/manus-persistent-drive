
## 2026-06-13 — Architecture Audit + Ingestion Expansion

**Session type:** Deep audit + strategic discussion + active development

**ttruthdesk-platform:**
- Added 24 new source adapters (CrossRef, OpenAlex, Semantic Scholar, WHO, Cochrane, bioRxiv/medRxiv, Europe PMC, ClinVar, ChEMBL, PubChem, OpenFDA Drug Labels, SEC EDGAR, EUR-Lex, CourtListener, IETF RFC, World Bank, Our World in Data, OECD, Eurostat, IPCC, arXiv, Wikidata, NIST, Generic URL/DOI)
- Source registry expanded from 9 to 30 approved sources
- Engine is now domain-agnostic (any scholarly domain, law, finance, government, standards)
- 1,140/1,140 tests passing, 0 TS errors
- Commits: afd6f4e (4 adapters), 0a113c0 (20 adapters)

**citation-desk:**
- Contact form live at /contact — delivers to pippinlitli@gmail.com via notifyOwner()
- Brand rewrite layer: all ttruthdesk.claims references rewritten to citation.is in-flight
- MCP card: 4 canonical tools, citation.is brand, in-memory cache
- MCP SSE stream: properly piped, no timeout
- Warmup cron: pings 3 upstream endpoints every 5 minutes
- All internal infrastructure exposure removed from public pages
- Checkpoints: 4a683553, 0361b355, 6178ea60, 809442f2

**Strategic decisions:**
- ttruthdesk-platform is the company; citation.is is one surface
- Engine is ready; source ingestion is the critical path
- Dream state confirmed as substantially built (5 components in server/dream/)
- Phase 109 (source version tracking + supersession signal) is next critical build
- Phase 110 (question-to-claim interface) is the "Perplexity at primary-source standards" thesis
- All 20 GitHub repos set to private

## 2026-06-13 — Phase 109 + Phase 110 Complete
**Session type:** Active backend development (Ralph Wiggum loop)
**Gate:** 0 TS errors | 71 test files | 1,189 tests passing | pushed to origin/main (447cf2e)

### Phase 109 — Source Version Tracking & Supersession Signal
**New tables:** `source_versions` (id, sourceId, versionHash SHA-256, versionLabel, detectedAt, changeType minor|major|retraction, affectedClaimCount), `superseded_claims` (id, claimId, supersededBy FK, reason, supersededAt)
**New file:** `server/sourceVersionAgent.ts` — polls all 30 approved sources via HEAD/GET probe, computes SHA-256 hash of canonical metadata, classifies change type (retraction > major > minor by keyword), emits `source_version_changed` event for affected claims, graceful degradation on network errors
**DB helpers added:** `getSourceVersion`, `upsertSourceVersion`, `markClaimSuperseded`, `getSupersededClaims`
**Wiring:** `source_version_changed` + `coverage_gap` added to eventBus LoopEventType; `source_version_changed` → L1 Truth Layer; heartbeat cron at 03:30 UTC daily
**Tests:** 25 tests — hash stability, change type classification, supersession marking, re-evaluation routing; eventBus count updated 15→17

### Phase 110 — Question-to-Claim Interface + Demand-Triggered Loop
**New table:** `questions` (id, questionText varchar 1000, derivedClaim, verdict, confidence decimal 3,2, rationale, sources JSON, loopTriggered boolean, processedAt, userId nullable FK, ipHash varchar 64)
**New file:** `server/questionRouter.ts` — `processQuestion()` calls LLM with structured JSON schema, clamps confidence [0,1], emits `coverage_gap` when confidence < 0.6 OR verdict === "insufficient_evidence", graceful degradation on LLM failure; tRPC namespace `questions.answerQuestion`
**New file:** `server/answerRoute.ts` — `POST /api/public/answer`, IP rate limiting 10 req/hr (in-memory Map), API-key bypass, 1000-char cap, 429 with X-RateLimit-Reset header
**Wiring:** `questions: questionRouter` in appRouter; `registerAnswerRoute(app)` in index.ts; `coverage_gap` → L2 Self-Prompt Layer in loopOrchestrator
**Tests:** 24 tests — LLM success/failure paths, loop trigger logic, confidence clamping, rate limiting, schema/wiring assertions
**Exports for testing:** LOOP_TRIGGER_CONFIDENCE (0.6), LOOP_TRIGGER_VERDICT ("insufficient_evidence"), ANON_RATE_LIMIT (10), ANON_WINDOW_MS (3600000), checkAnonRateLimit

### Strategic context
- "Perplexity at primary-source standards" thesis now live in backend
- Every low-confidence question auto-triggers the autonomous loop to pursue the gap
- Source version tracking enables self-healing when papers are retracted/updated
- citation.is frontend (github.com/Gudmundur76/citation-desk) comes when backend is fully ready
- Next: Phase 111 TBD — likely API v2 hardening or ingestion pipeline expansion
