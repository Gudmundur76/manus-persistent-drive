
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
