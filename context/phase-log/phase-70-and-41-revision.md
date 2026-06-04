# Phase 70 — QA P0/P1 Security & Correctness Fixes
**Date:** 2026-06-04
**Status:** complete
**Checkpoint:** `732a6be` (Phase 70) → `a24fd69` (Phase 41 revision) → `c13b2a66` (final P1 fixes)
**Tests:** 659/659 passing (41 files)
**TypeScript:** 0 errors
**ESLint:** 0 warnings

---

## Phase 70 — P0 Fixes (all 20 items)

| ID | Fix | File |
|----|-----|------|
| P0-1 | `requireOwnerOrAdmin` middleware on all `/api/admin/*` routes | `server/_core/index.ts` |
| P0-2 | Throw on missing `JWT_SECRET` instead of defaulting to `""` | `server/_core/env.ts` |
| P0-3 | Shared secret header check on all `/api/scheduled/*` endpoints | `server/_core/index.ts` |
| P0-4 | SQL injection in `db.ts` LIKE query — confirmed FALSE POSITIVE (Drizzle parameterizes) | `server/db.ts` |
| P0-5 | DB singleton init race condition — added initialization lock | `server/db.ts` |
| P0-6 | Concurrency semaphore — verified already present in `agentIngestionEndpoint.ts` | — |
| P0-7 | `pmcFeedJob` batching — verified `Promise.allSettled(batch.map(...))` pattern | — |
| P0-8 | Remove global `ENV.llmProvider` mutation in `qualityPassJob` — pass as parameter | `server/qualityPassJob.ts` |
| P0-9 | Unawaited IIFE in `analysisPipeline` — added `.catch()` | `server/analysisPipeline.ts` |
| P0-10 | `createDocument` return type — verified consistent | — |
| P0-11 | `localStorage.setItem()` in `useMemo` → moved to `useEffect` | `client/src/_core/hooks/useAuth.ts` |
| P0-12 | `navigate("/")` in render → wrapped in `useEffect` | `client/src/pages/AuditReport.tsx` |
| P0-13 | `navigate("/")` in render → wrapped in `useEffect` | `client/src/pages/Dashboard.tsx` |
| P0-14 | Broken admin guard in `Admin.tsx` — removed `|| !!user` clause | `client/src/pages/Admin.tsx` |
| P0-15 | Admin route protection — `requireOwnerOrAdmin` middleware added | `server/_core/index.ts` |
| P0-16 | Meta tag `useEffect` cleanup in `ClaimPage.tsx` — verified present | — |
| P0-17 | Duplicate `isActive`/`active` columns — verified no duplicates in schema | — |
| P0-18 | Foreign key constraints — verified in schema | — |
| P0-19 | `dotenv` v17 — verified working, no downgrade needed | — |
| P0-20 | Remove `**/*.test.ts` from `tsconfig.json` exclude array | `tsconfig.json` |

## Phase 70 — P1 Fixes

| ID | Fix | File |
|----|-----|------|
| P1-3 | In-memory sliding window rate limiter on `validateApiKey` (20 req/min per IP, 60s window) | `server/apiKeyService.ts` |
| P1-8 | Rate limiter implemented; Redis deferred to scale phase | — |
| P1-9 | Session cookie `SameSite=None` → `SameSite=Lax` | `server/_core/cookies.ts` |
| P1-16 | `AbortSignal.timeout(10_000)` on all external `fetch()` calls | `server/routers.ts`, `server/monitoringJob.ts`, `server/discoveryLoopJob.ts`, `server/pdbAdapter.ts` |
| P1-26 | `expiresAt > NOW()` check — already present via Drizzle `gt()` | — |
| P1-34 | `atob()` wrapped in `try/catch` in `Submit.tsx` | `client/src/pages/Submit.tsx` |
| P1-38 | `setTimeout` leak in `MagicLinkDialog` — `clearTimeout` in `useEffect` cleanup | `client/src/components/MagicLinkDialog.tsx` |
| P1-48 | Stub endpoints audit — no stubs found, all handlers return real responses | — |

---

## Phase 41 Revision — Manus Coordination Layer Correctness

**Triggered by:** Post-implementation audit of Phase 41 (Manus Coordination Layer)

| Fix | Detail | File |
|-----|--------|------|
| Header name inconsistency | Standardised to `x-coord-key` everywhere (was `x-coord-api-key` in `agentIngestionEndpoint.ts`) | `server/agentIngestionEndpoint.ts`, `server/coordApi.ts` |
| `AbortSignal.timeout` | Added 10 s timeout to both `fetch()` calls | `server/manusOrchestrator.ts` |
| Timing-safe key comparison | Replaced `!==` with `crypto.timingSafeEqual` in auth middleware | `server/coordApi.ts` |
| `ENV.appUrl` | Added `appUrl` field (reads `VITE_APP_URL`, falls back to `localhost:3000`) | `server/_core/env.ts` |
| Agent prompt | Added `/api/coord/ingest` endpoint + `queueItemId` field to `buildVerticalAgentPrompt` | `server/manusOrchestrator.ts` |
| Retry tracking | `runOrchestratorTick` reads `retryCount`, caps at `MAX_RETRIES = 3` | `server/manusOrchestrator.ts` |
| `manusOrchestrator.test.ts` | Created from scratch — 25 tests (buildVerticalAgentPrompt ×7, spawnVerticalTask ×5, getManusTaskStatus ×3, stopManusTask ×3, runOrchestratorTick ×7); uses `vi.mock("./_core/env")` + `vi.stubGlobal("fetch")` | `server/manusOrchestrator.test.ts` |

---

## Key metrics after all fixes
- **Tests:** 659/659 (41 files)
- **TypeScript:** 0 errors
- **ESLint:** 0 warnings
- **Webdev checkpoint:** `c13b2a66`

## Files changed since Phase 69 sync
```
client/src/_core/hooks/useAuth.ts
client/src/components/MagicLinkDialog.tsx
client/src/pages/Admin.tsx
client/src/pages/AuditReport.tsx
client/src/pages/Dashboard.tsx
client/src/pages/Submit.tsx
server/_core/cookies.ts
server/_core/env.ts
server/_core/index.ts
server/_core/multiLLM.ts
server/_core/sdk.ts
server/agentIngestionEndpoint.ts
server/analysisPipeline.ts
server/apiKeyService.test.ts
server/apiKeyService.ts
server/auth.logout.test.ts
server/claimExtractor.ts
server/coordApi.ts
server/db.ts
server/discoveryLoopJob.ts
server/manusOrchestrator.test.ts  ← NEW
server/manusOrchestrator.ts
server/monitoringJob.ts
server/pdbAdapter.ts
server/qualityPassJob.ts
server/routers.ts
todo.md
tsconfig.json
```
