# Citation Layer Build Blueprint
**Created:** 2026-06-10  
**Author:** Manus AI  
**Source documents:** The Citation Problem (Computing), The Citation (History), Citations Master Reference Document  
**Target repo:** https://github.com/Gudmundur76/ttruthdesk-platform  
**Discipline:** Ralph Wiggum — tests first, no phase advance until fully built, every commit through Husky gate  

---

## What This Build Is About

The platform already generates verdicts at the claim level. What it does not do is expose **why** a verdict is what it is at the citation level — the specific passage in the specific source document that supports or contradicts the claim, with a typed relationship and a confidence score on that relationship.

This is the gap the three source documents identify as unoccupied in the market. CiteTrue and Recite check existence. Scite.ai classifies context. No tool verifies claim-to-passage fidelity at the sentence level with a typed, null-safe, graded citation system.

The citation layer adds exactly this. It is **purely additive** — no existing tables are modified, no existing API contracts break, no existing tests change.

---

## The Four Citation Types (from Master Reference Document, Part 7)

These are first-class types in the system. They carry epistemic information and must never be collapsed or aggregated incorrectly:

| Type | Meaning | Aggregation rule |
|---|---|---|
| `VERIFIED` | Strong reference, high confidence passage match | Can contribute to confidence score |
| `CONTESTED` | Weak reference, confidence interval overlapping contradiction | Contributes with penalty |
| `IMPLIED` | Inferred reference, no direct passage, graph topology implies connection | Contributes at reduced weight |
| `BEYOND_EVIDENCE` | Typed null — structured reason for absence, shape of the gap | MUST NOT be aggregated as a weak positive |

The `BEYOND_EVIDENCE` type is the critical design constraint. It is not a missing value — it is a typed statement that the claim makes an assertion the cited source does not address. It must be preserved as a distinct type through all downstream operations.

---

## Current State of the Platform (as of Phase 95)

- **1908 tests, 134 test files, 0 failures** (commit f367906)
- **Schema:** 42 tables, 1366 lines in drizzle/schema.ts
- **Claims table:** stores verdict, rationale, pdbEvidenceRaw, pdbEvidenceUrl, confidenceScore, verdictMethod, sourceCompletenessScore — all at the document/abstract level
- **No `citations` table exists** — the gap is confirmed
- **No `CitationType` enum exists** — the gap is confirmed
- **analysisPipeline.ts:** 450 lines, handles claim extraction → verdict → wiki → SEO → self-prompt → inverse-prompt
- **verdictEngine.ts:** pure functions, no side effects, no LLM calls — deterministic
- **The pipeline hook point:** after `updateClaimVerdict()` in analysisPipeline.ts, before `compileDocumentToWiki()`

---

## Strict Build Phases — No Extras, No Sideways

### Phase 96-A: Schema + Types (Foundation)
**What:** Add `citations` table and `CitationType` enum. Nothing else.  
**Files changed:**
- `drizzle/schema.ts` — add `citations` table (7 fields: id, claimId, documentId, passageText, passageSection, citationType enum, citationConfidence)
- `drizzle/relations.ts` — add citations relation to claims
- Run `pnpm drizzle-kit generate` → apply migration SQL via webdev_execute_sql

**Completion criteria:**
- Migration applied to DB without errors
- `pnpm tsc --noEmit` passes
- At least 8 new tests in `server/citations.test.ts` covering: table shape, CitationType enum values, BEYOND_EVIDENCE cannot be null-coalesced to a number, insert/select round-trip (mock DB)
- All 1908 existing tests still pass
- Commit through Husky gate: `feat(schema): add citations table and CitationType enum`

---

### Phase 96-B: DB Helpers
**What:** Add `insertCitation`, `getCitationsByClaimId`, `getCitationsByDocumentId` to `server/db.ts`.  
**Files changed:**
- `server/db.ts` — 3 new helper functions

**Completion criteria:**
- At least 12 new tests in `server/db.citations.test.ts` covering: insert, select by claim, select by document, empty result, BEYOND_EVIDENCE round-trip
- All existing tests still pass
- Commit through Husky gate: `feat(db): add citation DB helpers`

---

### Phase 96-C: Passage Extractor Service
**What:** New service `server/citationPassageExtractor.ts` — given a claim and the full-text of its source document, makes one LLM call to extract the specific supporting/contradicting passage, classify the citation type, and return a confidence score.  
**Files changed:**
- `server/citationPassageExtractor.ts` — new file (~80 lines)
- `server/citationPassageExtractor.test.ts` — new test file

**Design rules:**
- One LLM call per claim, structured JSON response (json_schema response_format)
- Returns `{ passageText: string | null, passageSection: string | null, citationType: CitationType, citationConfidence: number }`
- If no passage found → `citationType: BEYOND_EVIDENCE`, `passageText: null`, structured `evidenceBoundary` description
- BEYOND_EVIDENCE is never a fallback for LLM failure — LLM failure throws, does not silently return BEYOND_EVIDENCE

**Completion criteria:**
- At least 15 new tests covering: happy path (VERIFIED), contested passage, implied connection, BEYOND_EVIDENCE with boundary description, LLM failure throws (not silent BEYOND_EVIDENCE), JSON schema validation
- All existing tests still pass
- Commit through Husky gate: `feat(citation): add passage extractor service`

---

### Phase 96-D: Pipeline Integration
**What:** Wire `citationPassageExtractor` into `analysisPipeline.ts`. After each claim verdict is written, call the extractor and write the result to the `citations` table.  
**Files changed:**
- `server/analysisPipeline.ts` — add citation extraction step after `updateClaimVerdict()`
- `server/analysisPipeline.test.ts` — extend existing tests to assert citation rows are written

**Design rules:**
- Citation extraction is non-blocking for the pipeline — if it fails, log the error and continue (do not fail the whole document)
- Citation extraction runs only when full-text is available (not abstract-only documents)
- No change to the verdict itself — citations are additive metadata

**Completion criteria:**
- At least 10 new tests in analysisPipeline.test.ts covering: citation written after verdict, citation skipped for abstract-only, citation failure does not fail pipeline, BEYOND_EVIDENCE written correctly
- All existing tests still pass
- Commit through Husky gate: `feat(pipeline): wire citation extraction into analysis pipeline`

---

### Phase 96-E: API Response Extension
**What:** Extend the public tRPC procedures to return citation data alongside the existing verdict. The API response for a claim now includes: `citations: Array<{ passageText, passageSection, citationType, citationConfidence }>`.  
**Files changed:**
- `server/db.ts` — extend `getClaimWithCitations` helper (or add join to existing claim query)
- `server/routers.ts` — extend `claims.getById` and `claims.search` procedures to include citations
- `shared/types.ts` — add `ClaimWithCitations` type

**Design rules:**
- Additive only — existing consumers of the API get the same fields plus `citations`
- `citations` is always an array (empty array if none, never null)
- BEYOND_EVIDENCE entries include `evidenceBoundary` field describing the shape of the gap

**Completion criteria:**
- At least 10 new tests in `server/routers.test.ts` covering: claim with VERIFIED citation, claim with BEYOND_EVIDENCE citation, empty citations array, citation type preserved in response
- All existing tests still pass
- Commit through Husky gate: `feat(api): extend claim response with citation chain`

---

## Total Scope

| Phase | New files | New tests (minimum) | Existing tests |
|---|---|---|---|
| 96-A Schema | schema.ts, relations.ts, migration | 8 | 1908 unchanged |
| 96-B DB Helpers | db.citations.test.ts | 12 | unchanged |
| 96-C Passage Extractor | citationPassageExtractor.ts + test | 15 | unchanged |
| 96-D Pipeline Integration | analysisPipeline.test.ts extension | 10 | unchanged |
| 96-E API Extension | routers.test.ts extension | 10 | unchanged |
| **Total** | **~6 new files** | **55 minimum new tests** | **1908 + 55 = 1963+** |

---

## What Is NOT in This Build

The following are explicitly out of scope for Phases 96-A through 96-E:

- No UI changes to citation-desk or ttruthdesk.claims admin
- No new ingestion sources or corpus work
- No changes to the verdict engine or confidence scoring
- No Scite.ai integration or external citation database queries
- No batch backfill of existing claims (that is a separate Phase 97 job)
- No citation search endpoint (that is Phase 97)
- No citation analytics or leaderboard changes

---

## Drive Update Protocol

After each sub-phase (A through E) is completed and committed:
1. Update `phase-log.md` with the sub-phase entry
2. Update `registry.json` with the new test count
3. Commit and push to `Gudmundur76/manus-persistent-drive`

---

## Approval Gate

This blueprint is written for user approval before any implementation begins. No code is written until the user approves this plan. If the user requests changes, the blueprint is updated here first, then implementation begins.
