# Sprint 38 — Tier 1 Public Database Adapter Expansion

**Date**: 2026-06-23  
**Commit**: `0548f0a` on `Gudmundur76/ttruthdesk-platform`  
**Status**: COMPLETE — pushed, CI quality gate passed

---

## What Was Built

Seven production-quality vertical adapters added to `server/verticalAdapters/`:

| Adapter | domainKey | API | Notes |
|---|---|---|---|
| `rcsb_pdb.ts` | `rcsb_pdb` | RCSB PDB REST + Search v2 | Experimental 3D structures; X-ray/cryo-EM/NMR scoring |
| `clinicaltrials_results.ts` | `clinicaltrials_results` | ClinicalTrials.gov API v2 | Posted outcome data; NCT ID direct + keyword search |
| `retraction_watch.ts` | `retraction_watch` | Retraction Watch API | Negative signal adapter; retraction = 0.05 confidence |
| `openfda_maude.ts` | `openfda_maude` | OpenFDA device/event.json | Adverse event counts; high death ratio = low confidence |
| `ncbi_gene.ts` | `ncbi_gene` | NCBI Entrez E-utilities | esearch → esummary two-step; human gene default |
| `dbsnp.ts` | `dbsnp` | NCBI Variation API v0 + esearch | rsID direct lookup + keyword fallback |
| `omim.ts` | `omim` | OMIM API | Graceful fallback if `OMIM_API_KEY` not set |

All 7 registered in `server/verticalAdapters/index.ts` under `// Sprint 38` block.

---

## What Was Confirmed

- **TypeScript**: 0 errors before and after (`npx tsc --noEmit`)
- **Tests**: 3606 passing, 3 skipped — no regressions (baseline unchanged)
- **ESLint**: 0 warnings, 0 errors — quality gate passed on push
- **Pre-push hook**: Full TS + ESLint gate ran clean on `git push`
- **Commit**: `0548f0a` — 8 files changed, 884 insertions

---

## What Was Corrected During Sprint

**ESLint complexity violations** blocked the first push attempt. Five adapters exceeded the `complexity: 20` rule:
- `rcsb_pdb.ts` — extracted `scoreXray()` and `fetchPdbEntry()` helper functions
- `clinicaltrials_results.ts` — extracted `scoreStudy()`, `fetchStudyDetail()`, `searchStudies()`
- `dbsnp.ts` — extracted `extractRsFields()` and `scoreRsVariant()` helpers
- `ncbi_gene.ts` — extracted `esearch()`, `esummary()`, `scoreGeneRecord()` helpers
- `omim.ts` — extracted `fetchOmimEntry()`, `searchOmim()`, `scoreOmimEntry()` helpers

**TypeScript Set iteration** — `[...new Set(arr)]` fails on `--target es5`. Fixed with `Array.from(new Set(arr))` in `dbsnp.ts`.

**`let` vs `const`** — `mimNumber` in `omim.ts` was declared `let` but never reassigned. Fixed to `const`.

---

## Adapter Design Patterns Established

1. **Complexity budget**: Keep `lookupEvidence()` under 20 cyclomatic complexity. Extract scoring, fetch, and search into named module-level functions.
2. **AbortController pattern**: Every fetch uses `AbortController` with 10–12s timeout. Inner fetches (second API call) use a fresh controller.
3. **Negative signal adapters**: Retraction Watch and MAUDE return low `confidenceScore` (0.05–0.30) when evidence is found — the `found: true` signals the engine that evidence exists, while the low score propagates the negative signal.
4. **Graceful key absence**: OMIM returns `found: false, confidenceScore: 0.3, confidenceFlags: ['OMIM_API_KEY not configured']` when no key is set. This is the pattern for any future adapter requiring an API key.
5. **Two-step E-utilities**: NCBI Gene and dbSNP both use esearch → esummary/variation API. Always add `&tool=citation-engine&email=citation-engine@citation.is` to NCBI requests per their policy.

---

## Next Sprint Should Know

- **OMIM_API_KEY**: Not yet set in production. OMIM adapter will return `found: false` until set. Free academic key available at https://omim.org/api. Set via `OMIM_API_KEY` env var.
- **Retraction Watch API**: The public API at `https://api.retractionwatch.com` may require registration for production use. Monitor for 401/403 responses in logs.
- **dbSNP Variation API**: `https://api.ncbi.nlm.nih.gov/variation/v0/refsnp/{id}` is rate-limited at 3 req/s without API key. If high traffic, add NCBI API key via `NCBI_API_KEY` env var and append `&api_key=KEY` to all NCBI requests.
- **Adapter count**: Registry now has 57 adapters total (50 pre-sprint + 7 new). The `listVerticals()` function returns all registered adapters.
- **Sprint 39 candidates**: UniProt isoforms adapter, PubMed full-text adapter (via Europe PMC OA), or ClinVar pathogenicity scoring improvement.

---

## Files Modified

```
server/verticalAdapters/rcsb_pdb.ts              (new)
server/verticalAdapters/clinicaltrials_results.ts (new)
server/verticalAdapters/retraction_watch.ts       (new)
server/verticalAdapters/openfda_maude.ts          (new)
server/verticalAdapters/ncbi_gene.ts              (new)
server/verticalAdapters/dbsnp.ts                  (new)
server/verticalAdapters/omim.ts                   (new)
server/verticalAdapters/index.ts                  (modified — Sprint 38 block added)
```
