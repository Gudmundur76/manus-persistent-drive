# Phase 116 — Agent Integration Test Harness

**Status:** In progress
**Methodology:** Ralph Wiggum TDD loop · CodeRabbit compliance · Strict phase discipline
**Date started:** 2026-06-13

---

## Purpose

Phase 116 closes the gap between "unit tested in Vitest" and "verified working end-to-end against the real pipeline." It builds a repeatable, CI-ready integration test harness that any agent or developer can run with `pnpm test:integration` to confirm all public-facing endpoints are healthy before handing the MCP URL to a real agent.

This is a prerequisite for Phase 117 (API key provisioning UI on citation-desk) and for any real-agent testing session.

---

## Scope — What Gets Built

### Directory structure

```
tests/
  integration/
    harness.ts          ← test runner (fetch-based, no supertest)
    fixtures.ts         ← shared test data (claims, DOIs, questions)
    helpers.ts          ← assert helpers, SSE collector, rate-limit reset
    mcp.test.ts         ← 5 MCP tool tests
    stream.test.ts      ← SSE stream 5-stage sequence test
    answer.test.ts      ← POST /api/public/answer tests
    rateLimit.test.ts   ← anonymous rate limiting + auth bypass
    REPORT.md           ← auto-generated pass/fail report (written by harness)
```

### Test coverage matrix

| Endpoint | Test cases |
|---|---|
| `POST /api/mcp` — `verify_claim` | Valid claim → verdict shape; missing claim → INVALID_PARAMS; unknown tool → METHOD_NOT_FOUND |
| `POST /api/mcp` — `search_claims` | Query returns array; empty query → INVALID_PARAMS |
| `POST /api/mcp` — `get_claim` | Valid ID → claim object; unknown ID → NOT_FOUND |
| `POST /api/mcp` — `get_source_version` | Known sourceId → version object |
| `POST /api/mcp` — `ask_question` | Question → verdict + loopTriggered boolean |
| `GET /api/public/verify-claim/stream` | 5 events emitted in order; `final.ok === true` |
| `POST /api/public/answer` | Valid question → verdict; >1000 chars → 400; 11th anon req → 429 |
| Rate limiting | 10 anon requests succeed; 11th returns 429 with X-RateLimit-Reset |
| Auth bypass | Bearer token request is never rate-limited |
| `/.well-known/agent.json` | `mcp_endpoint` field present |

### What is NOT in scope

- Load testing
- Mutation/write operations that would corrupt the DB
- Testing the autonomous loop (requires a running heartbeat)
- Frontend / citation-desk endpoints

---

## Completion Criteria (Ralph Wiggum exit condition)

- [ ] All integration tests pass (`pnpm test:integration` exits 0)
- [ ] `tests/integration/REPORT.md` generated with pass/fail per endpoint
- [ ] 0 TS errors (`tsc --noEmit`)
- [ ] 0 ESLint errors on new files
- [ ] `pnpm test` (Vitest unit suite) still passes — no regressions
- [ ] Committed and pushed to `origin/main`
- [ ] Persistent drive phase log updated

---

## Architecture decisions

**Why `fetch()` not supertest?**
The SSE stream endpoint uses `Connection: keep-alive` and never closes the connection until the client disconnects. Supertest wraps the server in a one-shot request handler that hangs waiting for the connection to close. Direct `fetch()` against the live dev server (already running on port 3000 in the sandbox) avoids this entirely.

**Why a separate `pnpm test:integration` script?**
Integration tests hit the real DB and real network. They must not run in the Vitest unit suite (which mocks everything). A separate npm script with `NODE_ENV=test` and `TEST_BASE_URL=http://localhost:3000` keeps them isolated.

**Auth strategy for tests**
The harness reads `TEST_API_KEY` from env. If not set, it calls `POST /api/trpc/apiKeys.create` with the owner credentials (from `OWNER_OPEN_ID` env) to generate a short-lived test key, then revokes it after the suite completes.

**Rate limit reset between tests**
The in-memory rate limit maps in `answerRoute.ts` and `mcpServer.ts` are keyed by IP. The harness uses a test-only `X-Test-Reset-RateLimit: 1` header (added in Phase 116) that clears the IP's bucket — only honoured when `NODE_ENV === "test"`.

---

## Ralph Wiggum loop protocol

Each iteration of the loop:
1. Run `pnpm test:integration`
2. Classify failures:
   - Code/logic error → fix and continue
   - Access/environment error → STOP and report blocker
3. Fix the minimum code to make the failing test pass
4. Run `pnpm test` (unit suite) to confirm no regressions
5. Repeat until all criteria above are met

Exit condition: `<promise>PHASE 116 COMPLETE — ALL INTEGRATION TESTS GREEN</promise>`

---

## CodeRabbit compliance checklist

- [ ] No function exceeds cyclomatic complexity 20 (or has explicit `eslint-disable-next-line complexity` with justification)
- [ ] All catch blocks use `errData(error)` from `server/logger.ts`
- [ ] No `console.*` in production code paths
- [ ] All new files have JSDoc module-level comment
- [ ] Test file naming: `*.test.ts` under `tests/integration/`
- [ ] `pnpm test:integration` script added to `package.json`
