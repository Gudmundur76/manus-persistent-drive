# Phases 117–121 — Backend Specification
**Repository:** `ttruthdesk-platform`
**Written:** 2026-06-13
**Methodology:** Ralph Wiggum TDD loop · CodeRabbit gate · persistent drive logging

---

## Phase 117 — Verbatim Evidence Passages in MCP `verify_claim`

### Problem
The `verify_claim` MCP tool currently returns `evidence[].excerpt: null` for every result. An agent consuming the tool receives PubMed IDs and URLs but no actual text. The agent must then make a second round-trip to PubMed to fetch the abstract, which defeats the purpose of having a verification API. The `sourcePassage` column already exists in the `claims` table (added in Phase 109) but is never populated.

### What gets built
A `PubMedAbstractFetcher` service (`server/pubmedAbstractFetcher.ts`) that:
- Accepts a list of PMIDs and fetches their abstracts from the NCBI E-utilities API (`efetch.fcgi?db=pubmed&rettype=abstract&retmode=xml`)
- Parses the XML response and extracts `AbstractText` per PMID
- Caches results in a new `pubmedAbstracts` table (`pmid`, `abstractText`, `fetchedAt`, `title`, `authors`, `publicationDate`) to avoid re-fetching on every call
- Returns `{ pmid, abstractText, title, publicationDate }` per entry

The `buildVerifyResult` function in `mcpServer.ts` is updated to call `PubMedAbstractFetcher.fetchBatch(pmids)` and populate `evidence[].excerpt` with the relevant abstract sentence(s) that most closely match the claim text (using a simple substring/keyword overlap — no LLM call required at this stage).

The `verifyClaimRoute.ts` is updated to persist the best-matching passage into `claims.sourcePassage` and `claims.passageConfidence` after each verification.

### Schema migration
New table: `pubmed_abstracts (pmid VARCHAR(32) PK, abstract_text TEXT, title TEXT, authors TEXT, publication_date VARCHAR(32), fetched_at TIMESTAMP)`

### Gate
- 0 TS errors · 0 ESLint warnings
- New Vitest tests: `pubmedAbstractFetcher.test.ts` (mock NCBI responses, cache hit/miss, batch dedup, empty PMID list)
- Integration test: `mcp.test.ts` updated — `verify_claim` now asserts `evidence[0].excerpt` is a non-empty string
- All 1,350+ existing tests still pass

---

## Phase 118 — Temporal Claim Versioning (`valid_from` / `valid_until` / `verify_at_date`)

### Problem
The `claims` table has no temporal validity window. A claim verified against a 2019 paper is treated identically to one verified against a 2024 paper. Agents cannot ask "was this claim valid as of 2022?" and the system cannot automatically flag claims that were valid when ingested but may have been superseded by newer evidence. The `supersededClaims` table exists but is not wired into the MCP surface.

### What gets built
**Schema additions** to the `claims` table:
- `validFrom TIMESTAMP` — the earliest date the claim is considered valid (defaults to `createdAt`)
- `validUntil TIMESTAMP NULL` — the date the claim was superseded or retracted (null = still valid)
- `temporalConfidence FLOAT` — a 0–1 score reflecting how time-sensitive the claim is (e.g., structural biology claims are stable; drug trial claims decay faster)

**New MCP tool: `verify_claim_at_date`** — accepts `{ claim: string, date: string (ISO-8601), domain?: string }` and returns the best verdict that was valid on that date. Implementation: query `claims` where `validFrom <= date AND (validUntil IS NULL OR validUntil >= date)` ordered by `compositeScore DESC`, then run the standard `buildVerifyResult` on the top match.

**`reEvaluationEngine.ts` extension** — when a new claim is ingested that contradicts an existing claim with `validUntil IS NULL`, set `validUntil = NOW()` on the older claim and set `supersededBy` in `supersededClaims`.

**`staleness detector`** — a new heartbeat job (`server/stalenessDetector.ts`) that runs daily, queries claims where `validFrom < NOW() - 365 days` and `temporalConfidence < 0.5`, and emits a `knowledgeGaps` row for each stale claim so the frontier engine can pursue updated evidence.

### Gate
- Schema migration applied via `webdev_execute_sql`
- `verifyClaimAtDateRoute.test.ts` — 12 tests covering date boundary conditions, null `validUntil`, supersession chain, and the staleness detector's gap emission
- Integration test: new `verify_claim_at_date` tool call in `mcp.test.ts`
- All existing tests pass

---

## Phase 119 — Batch Verification API (`POST /api/v2/verify/batch`)

### Problem
Agents processing documents (papers, reports, datasets) need to verify 10–50 claims in a single session. The current API requires one HTTP round-trip per claim. The `batchAuditRouter.ts` already exists for document-level auditing but does not expose a simple claim-array endpoint. Agents are forced to implement their own concurrency logic, which leads to rate-limit collisions and inconsistent results.

### What gets built
**`POST /api/v2/verify/batch`** — accepts `{ claims: string[], domain?: string, confidenceThreshold?: number, apiKey?: string }` (max 50 claims per request). The handler:
1. Validates input (max 50, each claim ≤ 2,000 chars)
2. Deduplicates claims against the existing `claims` table by text hash — returns cached verdicts immediately without re-running the pipeline
3. Runs the remaining (uncached) claims through `analysisPipeline.ts` with `Promise.allSettled` at concurrency 5
4. Returns `{ results: Array<{ claim, verdict, confidence, evidence, claimId, cached }>, processedAt, totalMs }`

**New MCP tool: `verify_claims_batch`** — thin wrapper over the HTTP endpoint, exposed on the MCP server alongside the existing 5 tools. Accepts `{ claims: string[], domain?: string }`.

**Rate limiting** — batch requests count as `min(claimCount, 10)` against the anonymous rate limit. Bearer-authenticated requests are unlimited.

**Cache layer** — a `claimTextHash` column (SHA-256 of normalised claim text) is added to the `claims` table with a unique index. The batch handler queries this index for O(1) cache lookups.

### Gate
- Schema migration: `ALTER TABLE claims ADD COLUMN claimTextHash VARCHAR(64), ADD UNIQUE INDEX claims_text_hash_idx (claimTextHash)`
- `batchVerifyRoute.test.ts` — 15 tests: dedup cache hit, max-50 enforcement, concurrency, partial failure handling, rate limit counting, empty array, oversized claim rejection
- Integration test: `mcp.test.ts` updated with `verify_claims_batch` tool call
- All existing tests pass

---

## Phase 120 — Bidirectional Agent Feedback (`submit_claim` / `flag_stale` / `report_contradiction`)

### Problem
The system is currently read-only from an agent's perspective. Agents can query verdicts but cannot contribute new claims, flag outdated verdicts, or report contradictions they discover. This means the knowledge base only grows through the autonomous ingestion pipeline — it cannot benefit from the collective intelligence of the agents consuming it. The `publicSubmissions` table exists but has no MCP surface.

### What gets built
**Three new MCP tools:**

1. **`submit_claim`** — accepts `{ claim: string, sourceUrl?: string, domain?: string, submitterNote?: string }`. Inserts a row into `publicSubmissions` with `status: "queued"` and triggers the standard `analysisPipeline` asynchronously. Returns `{ submissionId, estimatedProcessingMs }`. Rate-limited to 5 submissions per hour per API key.

2. **`flag_stale`** — accepts `{ claimId: number, reason: string, evidenceUrl?: string }`. Sets `claims.validUntil = NOW()` and inserts a `knowledgeGaps` row with `gapType: "stale_claim"`. Requires a valid Bearer token (no anonymous access). Returns `{ flagged: true, claimId }`.

3. **`report_contradiction`** — accepts `{ claimIdA: number, claimIdB: number, explanation: string }`. Inserts a `contradictionAlerts` row with `status: "pending_review"` and a `graphClaimEdges` row with `relationType: "contradicts"`. Returns `{ alertId, claimIdA, claimIdB }`.

**`agentIngestionEndpoint.ts` extension** — the existing endpoint already handles `publicSubmissions` inserts; Phase 120 wires the MCP tools to call it internally rather than duplicating logic.

**Abuse prevention** — all three tools require a valid Bearer API key (no anonymous access). The `submit_claim` tool validates claim text against a blocklist of known spam patterns before inserting.

### Gate
- `agentFeedbackTools.test.ts` — 18 tests: submit with/without source URL, rate limit enforcement, flag_stale auth guard, report_contradiction duplicate detection, contradiction alert status
- Integration test: all three new tools appear in `tools/list` response and pass basic call tests
- All existing tests pass

---

## Phase 121 — Epistemic Provenance Chain in MCP (`get_provenance`)

### Problem
The `claimProvenanceService.ts` (327 lines, fully implemented) records every pipeline step for every claim — extraction, evidence lookup, quality scoring, verdict overrides, agent ingestion. This is the most valuable transparency feature in the system. However, it is completely invisible to agents: there is no MCP tool, no HTTP endpoint, and no way for a consuming agent to ask "how was this verdict reached?" The `citationEdges` table (distortion analysis) and `graphClaimEdges` table (semantic relationships) are also dark.

### What gets built
**New MCP tool: `get_provenance`** — accepts `{ claimId: number, includeDistortionChain?: boolean }`. Returns:
```json
{
  "claimId": 42,
  "claim": "Lysozyme has a resolution of 1.5 Å in PDB 1LYZ",
  "verdict": "Supported",
  "provenanceChain": [
    { "step": "extraction", "actor": "autonomous_ingest", "timestamp": "...", "output": "..." },
    { "step": "evidence_lookup", "actor": "pubmed_adapter", "timestamp": "...", "output": "..." },
    { "step": "quality_scoring", "actor": "compositeTruthEngine", "timestamp": "...", "output": "..." }
  ],
  "citationDistortionChain": [
    { "hop": 1, "sourcePmid": "...", "distortionType": "faithful", "distortionScore": 0.05 }
  ],
  "semanticNeighbours": [
    { "claimId": 43, "relationType": "supports", "weight": 0.87 }
  ]
}
```

**`GET /api/public/provenance/:claimId`** — HTTP endpoint for the same data, usable by non-MCP consumers (embed widget, citation-desk frontend).

**`claimProvenanceService.ts` extension** — add `getDistortionChain(claimId)` that queries `citationEdges` where `originalClaimId = claimId` ordered by `hopNumber`, and `getSemanticNeighbours(claimId, limit)` that queries `graphClaimEdges` where `sourceClaimId = claimId OR targetClaimId = claimId` ordered by `weight DESC`.

### Gate
- `provenanceRoute.test.ts` — 14 tests: empty chain (new claim), full chain (ingested claim), distortion chain with multiple hops, semantic neighbours, auth (public endpoint, no key required), 404 for unknown claimId
- Integration test: `get_provenance` tool call in `mcp.test.ts` with mock DB
- All existing tests pass

---

## Discipline Checklist (applies to every phase)

Before committing each phase:

- [ ] Spec written to `manus-persistent-drive` before any code is written
- [ ] `todo-phase-NNN.md` created at project root
- [ ] Tests written first (RED) before implementation (GREEN) — Ralph Wiggum loop
- [ ] `pnpm check` — 0 TS errors
- [ ] `pnpm lint` — 0 ESLint errors, 0 warnings on changed files
- [ ] `pnpm test --run` — all existing + new tests pass
- [ ] `pnpm test:integration` — 35/35 integration tests still GREEN
- [ ] `git commit -m "phase-NNN: <description>"` with conventional commit message
- [ ] `git push origin main`
- [ ] `manus-persistent-drive` phase-log.md updated and pushed
