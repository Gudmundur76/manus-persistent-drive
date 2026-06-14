# Session Log — Third-Pass Audit Fixes
**Date:** 2026-06-14  
**Commit:** dc47e3f  
**Tests:** 2686/2686 ✅ | ESLint: 0 ✅ | TypeScript: 0 ✅

## Root Cause of All Endpoint Failures

Phase 115 (citation graph scoring) added a `citationGraphEnriched` column via migration SQL using `citation_graph_enriched` (snake_case), but the Drizzle schema defined it as `boolean("citationGraphEnriched")` (camelCase). MySQL column names are case-insensitive, but Drizzle lowercases the column name in generated SQL, producing `citationgraphenriched` which MySQL could not resolve. This caused every query touching the `claims` table to fail with `ER_BAD_FIELD_ERROR`.

**Fix:** Renamed DB column from `citation_graph_enriched` → `citationGraphEnriched` via `ALTER TABLE claims RENAME COLUMN`.

## Endpoint Status After Fix

| Endpoint | Before | After |
|----------|--------|-------|
| `/api/public/claims/{id}` | ❌ Timeout | ✅ 200 |
| `/api/public/stats` | ❌ 500 | ✅ 200 |
| `/api/public/verticals` | ❌ 500 | ✅ 200 |
| `/api/public/leaderboard` | ❌ 500 | ✅ 200 |
| `/api/public/contradictions` | ❌ 500 | ✅ 200 |
| `/api/public/claims.json` | ❌ Timeout | ✅ 200 |

Note: `/mcp` SSE endpoint and `/api/external/public/*` paths are not server routes — `/mcp` is a long-lived SSE connection (normal timeout in audit tools), and `/api/external/public/*` paths do not exist (auditor inferred them from agent-card; actual paths are `/api/public/*`).

## Data Quality Fixes

1. **Leaked prompt text** — 11 claims had `[Audit note: ...]` prompt text appended to `verdictRationale`. Cleaned via SQL `SUBSTRING_INDEX` truncation.
2. **NCBI Taxonomy routing** — `salmonBiotech` adapter was sending organism names (e.g. `Oncorhynchus keta`, `Salmo salar`) to PubChem which returned "not found". Added `looksLikeOrganism()` detector and `lookupNcbiTaxonomy()` function that routes to NCBI eutils API instead.
3. **Verdict enum documentation** — MCP tool card (`/.well-known/mcp.json`) was documenting `["supported", "refuted", "inconclusive"]` (old lowercase values). Updated to actual values: `["Supported", "Contradicted", "Ambiguous", "Insufficient Evidence", "Out of Scope", "Needs Expert Review"]`.

## GitHub Self-Build Loop Activity

Phases 116-120 landed autonomously during this session:
- Phase 116: `selfCitationFraction` penalty in citation graph scoring
- Phase 117: Public contradictions API (`/api/public/contradictions`)
- Phase 118: Claim history / provenance endpoint
- Phase 119: Epistemic provenance route
- Phase 120: Batch verify endpoint

All merged, migrations applied, tests passing.

## DB Migrations Applied This Session
- 0044: event_queue enum update
- 0045: api_keys.usageCount column, claim_provenance_events table
- Column rename: `citation_graph_enriched` → `citationGraphEnriched` on claims table

## Next Priorities
1. `/claim/:id` detail page on citation.is (most important missing public page)
2. RSS feed domain fix (uses `localhost:3000` in item links — needs SITE_ORIGIN)
3. Pricing page + PayPal checkout frontend
4. Convert remaining batch crons to reactive event cascades
