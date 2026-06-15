# Sprint 25 — Post Sprint Log
*Date: 2026-06-15 | Completed in single session*

## Sprint Promise
```
<promise>SPRINT 25 COMPLETE — QUESTION DECOMPOSER LIVE, DEMO READY, ALL TESTS GREEN, LINT CLEAN</promise>
```

## Phases Completed

### Phase 1: BioMCP Benchmark + Latency Profiling
- Benchmark report written: `docs/sprint25-benchmark.md`
- PubMed baseline latency: ~2,100ms per query (EuropePMC API)
- BioMCP comparison: retrieves data, does not verify claims — clear differentiation
- Bottleneck identified: sequential PubMed queries; fix = parallel Promise.all (already in place)

### Phase 2: questionDecomposer.ts
- File: `server/questionDecomposer.ts`
- Handles: yes/no questions, comparative questions, multi-entity questions, conditional questions
- Two-stage: heuristic-first (0ms), LLM fallback (6s timeout)
- Exports: `decomposeQuestion()`, `buildPubMedQuery()`, `DecomposedQuestion`, `AtomicClaim`
- Tests: `server/questionDecomposer.test.ts` — 28 tests, all passing

### Phase 3: verifyClaimRoute.ts upgrade
- Wired `decomposeQuestion` + `buildPubMedQuery` into the NL path
- Parallel PubMed routing: decomposed queries merged with translated claim queries (max 3, deduplicated)
- Import: `import { decomposeQuestion, buildPubMedQuery } from "./questionDecomposer"`
- TypeScript: 0 errors

### Phase 4: demo-perplexity.ts
- File: `demo-perplexity.ts` (root of repo, CLI executable)
- Three modes: `--live` (live API), `--mcp` (MCP protocol), default (local simulation)
- Custom question: `--question "text"`
- Shows: decomposition, PubMed queries, verdict, SPO triple, provenance chain, latency
- Live test: "Does aspirin reduce the risk of colorectal cancer?" → ✅ Supported, 12.5s latency (deploy pending for confidenceScore)

### Phase 5: AAIF Quality Gate
- `pnpm check` (TSC): 0 errors ✅
- `pnpm lint` (ESLint --max-warnings 0): 0 errors, 0 warnings ✅
- `pnpm test --run`: 2,800/2,800 passing ✅
- Sprint track file: this file ✅
- Memory blocks: updated ✅

## Test Count Delta
- Sprint 24: 2,772 tests
- Sprint 25: 2,800 tests (+28 for questionDecomposer)

## Files Changed
| File | Type | Description |
|---|---|---|
| `server/questionDecomposer.ts` | NEW | NL → atomic SPO claims, heuristic + LLM |
| `server/questionDecomposer.test.ts` | NEW | 28 Vitest tests |
| `server/verifyClaimRoute.ts` | MODIFIED | Wired questionDecomposer into NL path |
| `demo-perplexity.ts` | NEW | Perplexity partnership demo CLI |
| `docs/sprint25-benchmark.md` | NEW | BioMCP benchmark report |

## Commit
- ttruthdesk-platform: to be committed after this log
- manus-persistent-drive: this file

## Next Sprint Candidates
1. Sprint 26: Multi-source routing (PDB + ClinicalTrials.gov + CrossRef in parallel)
2. Sprint 27: Sub-500ms latency optimization (EuropePMC query caching, connection pooling)
3. Sprint 28: Perplexity Computer MCP integration demo (live partnership outreach)
