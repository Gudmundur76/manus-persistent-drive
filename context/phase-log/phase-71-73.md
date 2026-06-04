# Phase 71–73 — Redis Rate Limiting, Live Coordinator Polling, and Coordinator Key Rotation

**Date:** 2026-06-04
**Status:** complete
**Project repository final checkpoint:** `7e47510f13f5eba3ae09df7db5d1d24025129dfd`
**Implementation commit:** `382012c68689796ff180557a7865f47dacead33f`
**Todo update commit:** `7e47510f13f5eba3ae09df7db5d1d24025129dfd`
**Tests:** 412/412 passing in the cloned GitHub branch
**TypeScript:** `pnpm run check` clean
**Build:** `pnpm run build` successful
**Live site:** https://protein-desk-5r5rzpyg.manus.space/ loaded successfully in Chromium after push

## Scope completed

| Phase | Outcome | Primary files |
|---|---|---|
| 71 | Replaced the local-only API-key validation throttle with a Redis-capable limiter that uses Upstash REST when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are configured, while keeping a deterministic local fallback for development/tests. | `server/apiKeyRateLimiter.ts`, `server/apiKeyService.ts`, `server/apiKeyService.test.ts`, `server/_core/env.ts` |
| 72 | Added explicit 30-second polling to the coordinator dashboard query so queue depth and active-task counts refresh without a full page reload. | `client/src/pages/CoordinatorDashboard.tsx` |
| 73 | Added an owner/admin coordinator-key rotation mutation and Admin UI button. The new key is shown once, the previous key has a 10-minute grace period for in-flight workers, and every coordinator-auth path uses the shared validator. | `server/coordApiKeyService.ts`, `server/coordApi.ts`, `server/agentIngestionEndpoint.ts`, `server/batchAuditRouter.ts`, `server/manusOrchestrator.ts`, `server/orchestratorTickJob.ts`, `server/routers.ts`, `client/src/pages/Admin.tsx` |

## Security invariants preserved or restored

| Invariant | Status |
|---|---|
| `JWT_SECRET` throws at startup if missing | Restored in `server/_core/env.ts`; Vitest now injects a test-only secret in `vitest.config.ts`. |
| Session cookie uses `SameSite=Lax` and `httpOnly=true` | Restored in `server/_core/cookies.ts`; logout cookie test updated. |
| Coordinator API key comparison uses `crypto.timingSafeEqual`, not direct string equality | Centralized in `server/coordApiKeyService.ts`; direct comparison grep returned no coordinator-key comparison candidates. |
| External `fetch()` calls touched by this work include timeouts | Upstash REST call uses `AbortSignal.timeout(10_000)` and orchestrator coordinator calls retain `AbortSignal.timeout(10_000)`. |
| Static `ENV` object pattern | Preserved; tests mock modules rather than mutating runtime configuration. |

## Notes

The user supplied checkpoint `b98a0483`, but the cloned GitHub `main` branch resolved to `c9fb6c8` before edits. Several Phase 70 invariants described in persistent memory were absent from that branch, so the session restored the missing JWT and cookie invariants before final verification. The current pushed project head is `7e47510`.
