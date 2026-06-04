# Manus Developer Discipline — Gap Analysis & Remediation Plan

**Date:** 2026-06-04  
**Session:** session_quality_audit  
**Project:** Protein Truth Desk (Phases 1–65)  
**Author:** Manus AI (self-audit)

---

## Executive Summary

After 65 phases of development, a systematic audit of the Protein Truth Desk codebase reveals
six structural gaps between how Manus operates as a developer and what a top-tier engineering
team would require. None of these gaps are catastrophic individually, but together they compound
into a pattern of **technical debt accumulation, context loss, and inconsistent quality** that
will slow the project down as it scales.

The gaps fall into two categories: **tooling gaps** (things that can be fixed by adding
configuration files and scripts) and **behavioural gaps** (patterns in how Manus plans and
executes that require process changes). Both are addressable.

---

## Gap 1 — No Automated Quality Gate at Commit Time

**Severity: Critical**

**What was found:**
- No ESLint configuration exists in the project (zero lint rules enforced)
- No pre-commit hook exists (`.husky/` is absent)
- No commitlint configuration (commit messages are inconsistent: some use Conventional Commits
  format, others are free-form paragraphs)
- The only quality check available is `pnpm check` (TypeScript only), which is never called
  automatically

**Impact:** Every commit can introduce lint violations, style inconsistencies, and type-unsafe
patterns without any automated rejection. The 29 occurrences of `as any` / `: any` in
non-stub, non-test server files are a direct consequence — they would have been caught and
rejected by a strict ESLint config.

**What a top developer does:** Every repository has a pre-commit hook that runs (at minimum)
`eslint --fix`, `prettier --check`, and `tsc --noEmit` on staged files before allowing a commit.
Commit messages are validated against Conventional Commits (`feat:`, `fix:`, `chore:`, etc.)
so the changelog is machine-readable.

**Remediation:**
- Install Husky + lint-staged + commitlint (following `ln-742-precommit-setup` skill)
- Add ESLint with `@typescript-eslint/recommended-type-checked` + `no-explicit-any` as error
- Add Prettier as a lint-staged formatter
- Add `commitlint` with `@commitlint/config-conventional`

---

## Gap 2 — No Test Coverage Thresholds

**Severity: High**

**What was found:**
- `vitest.config.ts` has no `coverage` block — coverage is never measured
- 18 of 411 tests are currently **failing** (the `claimProvenanceService.test.ts` `summarize()`
  suite and two DB mock tests) — this was not caught between sessions because there is no CI
- The failing tests were written in Phase 61 but the service implementation diverged during
  the catch-up merge; the tests now test a `summarize()` function signature that does not match
  the actual implementation
- 15 of 78 server files (19.2%) are stubs with no tests at all

**Impact:** The test suite reports "passing" in aggregate even when individual files are broken.
A developer who runs `pnpm test` gets a non-zero exit code but may not notice 18 failures among
393 passes. More importantly, the stubs have zero coverage and will silently fail in production.

**What a top developer does:** Coverage thresholds (`lines: 80`, `functions: 80`,
`branches: 70`) are enforced in CI. Any PR that drops below the threshold is rejected.
Failing tests block merges — they are never allowed to accumulate.

**Remediation:**
- Add `coverage` block to `vitest.config.ts` with thresholds
- Fix the 18 failing `claimProvenanceService` tests (signature mismatch)
- Add a `pnpm test:ci` script that exits non-zero on any failure or coverage drop
- Track stub-to-implementation ratio in the quality dashboard

---

## Gap 3 — Context Loss Between Sessions

**Severity: High**

**What was found:**
- The `manus-persistent-drive` repo was created in Phase 41 but never used until Phase 65
- Sessions between Phase 41 and Phase 65 had no memory of what the previous session built
- The GitHub repo fell 27 phases behind the deployed checkpoint
- The local sandbox was missing 22 server files after a reset, causing a full session to be
  spent on recovery rather than feature development
- The `bootstrap.sh` and `sync.sh` scripts were only written in Phase 65 (this session)

**Impact:** Every session restart is a cold start. The agent re-reads files it has already read,
re-discovers the schema it already knows, and makes decisions without the context of what was
tried and rejected in previous sessions. This is the single largest source of wasted effort.

**What a top developer does:** A persistent memory system is the first thing set up on a
project, not the last. Every session starts by loading context (phase log, todo state, KG
summary) and ends by writing back to it. The GitHub repo is always within one commit of the
deployed state.

**Remediation:**
- Make `bootstrap.sh` and `sync.sh` mandatory — document them in the project README
- Add a `CLAUDE.md` file (or equivalent) to the project root that tells any new agent session
  exactly what to read first
- Automate the sync: add a `pnpm sync:memory` script that calls `sync.sh` with a generated
  session description
- Keep the GitHub repo within 1 phase of the deployed checkpoint (commit after every phase,
  not every 27)

---

## Gap 4 — Functions Too Long, No Decomposition Discipline

**Severity: Medium**

**What was found:**
- 32 functions exceed 50 lines in non-stub, non-test server files
- The worst offenders:
  - `createExportRouter()` — 297 lines (should be split into 5–6 handler functions)
  - `verdictForClaim()` — 206 lines (should be split into evidence scoring + verdict logic)
  - `handleDiscoveryLoop()` — 172 lines (should be split into fetch + parse + store)
  - `registerHandlers()` in `telegramBot.ts` — 163 lines (should be one handler per command)
- The `routers.ts` file grew to ~2,000 lines before being split — this happened because there
  was no enforced line limit per file

**Impact:** Long functions are harder to test (each test must set up the entire function's
context), harder to review, and harder to debug. The 297-line `createExportRouter` is
effectively untestable as a unit — the 27 tests for it are integration-style tests that mock
the entire DB layer.

**What a top developer does:** Functions are kept under 40 lines (the "fits on one screen"
rule). Files are kept under 200 lines. Routers are split by feature domain from the start.
A linter rule (`max-lines-per-function: 40`) enforces this automatically.

**Remediation:**
- Add `max-lines-per-function` ESLint rule (warn at 60, error at 100)
- Add `max-lines` ESLint rule (warn at 200, error at 400) per file
- Refactor the top 5 longest functions as part of the next sprint's tech debt phase
- Add a complexity check to the quality dashboard

---

## Gap 5 — Stub Files Are Invisible Technical Debt

**Severity: Medium**

**What was found:**
- 15 of 78 server files (19.2%) are stubs — they export the correct function signatures but
  contain no implementation
- The stubs were created during the Phase 65 catch-up merge to make TypeScript compile, but
  they are now in the GitHub repo and could be deployed
- There is no tracking mechanism to know which stubs exist or when they were created
- The stubs have no tests, so they will silently return `undefined` or empty arrays in production

**Impact:** If the deployed checkpoint (`91c44bbb`) is ever lost or the project is rebuilt from
the GitHub repo, 19.2% of the server functionality will be silently missing. This is a
deployment risk.

**What a top developer does:** Stubs are never committed to `main`. They live on feature
branches and are replaced with real implementations before merging. If a stub must be committed
(e.g., for a forward-reference), it throws `new Error("Not implemented")` rather than
returning empty data, so failures are loud.

**Remediation:**
- Add a `scripts/check-stubs.ts` script that scans for `// Stub:` comments and reports them
- Add this check to the pre-commit hook — warn (not block) on stub commits to `main`
- Replace all 15 stubs with `throw new Error("Not implemented: <function>")` so they fail loudly
- Track stub count in the quality dashboard and set a target of 0 by Phase 70

---

## Gap 6 — No Observability or Error Budget

**Severity: Medium**

**What was found:**
- No structured logging in server files (some use `console.log`, some use nothing)
- No request tracing (no correlation IDs on tRPC calls)
- No error rate tracking (errors are caught and returned as tRPC errors but not aggregated)
- No performance budget (no measurement of how long pipeline steps take)
- The `ln-771-logging-configurator` skill exists but was never applied

**Impact:** When something goes wrong in production (e.g., a pipeline run fails silently, a
claim is scored incorrectly), there is no way to diagnose it without adding `console.log`
statements and redeploying. This is the most common cause of multi-hour debugging sessions.

**What a top developer does:** Every server function logs at entry/exit with a correlation ID.
Errors are caught at the tRPC middleware level and logged with full context. A simple
`/api/health` endpoint reports error rates and p95 latency for the last 100 requests.

**Remediation:**
- Apply `ln-771-logging-configurator` skill to add structured logging (pino or structlog)
- Add a tRPC middleware that logs every procedure call with duration and error status
- Add correlation ID propagation (nanoid on every request, passed through context)
- Add a `GET /api/health/detailed` endpoint that reports recent error rates

---

## Summary Table

| Gap | Severity | Effort | Tooling Fix | Behavioural Fix |
|---|---|---|---|---|
| 1. No quality gate at commit | Critical | 2h | Husky + ESLint + commitlint | Always run `pnpm check` before committing |
| 2. No coverage thresholds | High | 1h | Vitest coverage config + CI script | Fix 18 failing tests first |
| 3. Context loss between sessions | High | 3h | bootstrap.sh + sync.sh + CLAUDE.md | Run bootstrap at session start, sync at end |
| 4. Functions too long | Medium | 4h | ESLint max-lines rules | Decompose during implementation, not after |
| 5. Stubs are invisible debt | Medium | 2h | check-stubs.ts + pre-commit warn | Never commit stubs to main |
| 6. No observability | Medium | 3h | pino logging + tRPC middleware | Log at procedure boundaries |

**Total estimated effort to close all gaps: ~15 hours of focused work**

---

## Implementation Order

The gaps should be closed in this order, because each one enables the next:

1. **Gap 3 first** (context continuity) — ensures future sessions start with full context
2. **Gap 1** (quality gate) — prevents new violations from entering the codebase
3. **Gap 2** (coverage thresholds) — fixes the 18 failing tests and sets a floor
4. **Gap 5** (stubs) — makes the debt visible and loud
5. **Gap 6** (observability) — makes production failures diagnosable
6. **Gap 4** (function length) — refactoring is safer once tests are green and coverage is tracked

---

## What Manus Needs to Build to Fill These Gaps

Beyond configuration files, three pieces of **software** are needed:

### A. Quality Dashboard Page (`/admin/quality`)
A page in the app itself that shows:
- Current test pass rate and coverage percentage
- Stub file count and list
- Functions over 50 lines (top 10)
- `any` usage count
- Last sync timestamp and session history from the persistent drive
- Phase velocity (phases completed per session)

This makes quality metrics visible to the user and creates accountability.

### B. Session Discipline CLI (`scripts/manus-session.ts`)
A single script that replaces the separate `bootstrap.sh` and `sync.sh` with a unified CLI:
```
pnpm session:start [session-id]   # bootstrap + register + print context
pnpm session:end [message]        # export + sync + push
pnpm session:status               # show current session state
```

### C. Stub Replacement Tracker (`scripts/check-stubs.ts`)
A script that:
- Lists all stub files with their creation date and the phase they were created in
- Shows which stubs have been replaced with real implementations
- Outputs a JSON report that the quality dashboard can consume

---

*This document should be re-run at the start of every 10-phase sprint to track progress.*
