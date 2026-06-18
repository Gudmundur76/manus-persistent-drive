
---

## Session: Phase C19 — In-Place Hero Citation Search (2026-06-16)

**Repos touched:** citation-desk (Manus + mirror), manus-persistent-drive
**Manus checkpoint:** `8b259ceb`
**Mirror commits:** `54806f7` (C19 feature), `d10a794` (CI fix)

### What was built

**Phase C19 — HeroSearch component:**
- Replaced static `ApiDemo` in the CitationHome.tsx hero right column with a live two-state `HeroSearch` component
- Idle state: dark terminal panel with static demo response, search bar, and 3 clickable example queries
- Active state: SSE streaming with 3-stage progress indicator (decompose → evidence → answer), colour-coded verdict panel, source cards with external DOI links, cancel/reset controls
- Added `GET /api/citation-search/stream` SSE proxy route in `externalProxy.ts` — pipes upstream SSE stream with brand rewrite and `req.close()` cancel support
- Quality gate: 0 TS errors, 35/35 tests passing

**CI fix:**
- Mirror repo was missing 4 page files (Loop.tsx, Sources.tsx, Compare.tsx, Contact.tsx)
- Added all 4 to mirror — CI Quality job now fully green

**Backend verification:**
- Confirmed `GET https://ttruthdesk.claims/api/citation-search/stream` is live and streaming
- Test query: "does creatine improve performance" — returned Supported, 0.90 confidence, 3 sources (OpenAlex, CrossRef, Europe PMC)

### Product definition updated

citation.is now has two distinct capabilities:
1. **Verification API** — structured verdict + provenance for AI agents and developers
2. **Live search** — Perplexity-style streamed answers for any user, no API key required

Both draw from the same ttruthdesk.claims backend and 4,165-claim corpus.

### Memory repo sync

- `CURRENT_STATE.md` rewritten — now reflects Phase C19, updated product definition, Sprint 28 backend state, SSE endpoint shape
- `compounding_log.md` updated (this entry)
- Phases C10–C18 retroactively documented in CURRENT_STATE.md

### Current corpus stats
- totalClaims: 4,165
- verifiedClaims: 856 (20.5%)
- sourceDocuments: 291

### Next actions
- Verify citation search end-to-end in production at citation.is
- Update /developers page to lead with MCP + API capabilities
- Consider api.citation.is subdomain routing

---

## Phase 137 — Sprint 41: PDB Protein-Name Lookup Pipeline (2026-06-18)

### Sprint goal
Move ≥400 claims from Insufficient Evidence (IE) to Supported/Contradicted/Ambiguous by building a deterministic protein-name → PDB search → verdict pipeline.

### What was built

**`server/pdbLookupAdapter.ts`** (new file)
- `verifyResolutionByProteinSearch`: searches RCSB PDB by protein name (up to 5 candidates), fetches resolution for each, applies tolerance matching (±0.05 Å = Supported, ±0.20 Å = Partially Supported, else Ambiguous)
- `verifyProteinNameBySearch`: searches PDB by protein name, returns Ambiguous with candidate IDs when found, IE when not found
- 14 Vitest unit tests, all passing

**`server/analysisPipeline.ts`** (patched)
Two new routing branches added before the generic `verdictForClaim` fallback:
1. `resolution` claims with no PDB ID → `verifyResolutionByProteinSearch`
2. `general_molecular` / `protein_name` claims with no PDB ID → `structuralBiology` vertical adapter → `verifyProteinNameBySearch` fallback

**`scripts/sprint41-reverify-ie-claims.mjs`** (new script)
Targeted claim-level re-verify: fetches existing IE claims of target types, runs new routing logic, updates verdict in-place (no re-extraction, no corpus bloat).

### Results

| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| Insufficient Evidence | 4,413 | 3,689 | -724 |
| Ambiguous | 456 | 1,162 | +706 |
| Supported | 513 | 524 | +11 |
| Partially Supported | 133 | 140 | +7 |

Sprint goal (>=400 IE reduction): ACHIEVED

Claims processed: 1,903 / 2,627 target (38% improvement rate)

### Test suite
- 260 test files, 3,095 tests, 0 failures
- TypeScript: 0 errors

### GitHub
Commit: 9c4a392 on Gudmundur76/ttruthdesk-platform

### Next sprint candidates (Sprint 42)
- experimental_method (601 IE) — wire methodologyVerifier adapter
- ligand (493 IE) — wire ligandAdapter using RCSB ligand search
- organism (459 IE) — wire taxonomyAdapter using NCBI Taxonomy API
- Remaining general_molecular (749 still IE) — improve protein name extraction from claimText
