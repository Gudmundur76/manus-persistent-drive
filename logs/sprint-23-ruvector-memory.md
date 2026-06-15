# Sprint 23 — RuVector Native Graph Memory Substrate

**Date:** 2026-06-15
**Repo:** cognitive-loop-framework
**Commit:** `85aa0fc`
**Tests:** 121/121 green (25 new)

---

## What Was Built

### New Files

| File | Purpose |
|---|---|
| `src/memory/ruVectorClient.ts` | Typed wrapper around `@ruvector/graph-node` native Rust binding. Replaces the old CLI-exec stub in `ruvectorStore.ts`. Exposes: `upsertNode`, `batchUpsertNodes`, `createEdge`, `batchInsert`, `createHyperedge`, `searchHyperedges`, `query` (Cypher), `kHopNeighbors`, `stats`, `subscribe`. |
| `src/indexer/astIndexer.ts` | Bridges Tree-sitter `ASTExtractor` → `RuVectorClient`. Converts `CodeNode`/`CodeEdge` to `JsNode`/`JsEdge` and writes them in a single atomic `batchInsert`. Also supports `indexCoModification` (hyperedge for co-changed files). |
| `tests/memory/ruVectorClient.test.ts` | 20 tests covering all node/edge/hyperedge/stats/open operations. |
| `tests/indexer/astIndexer.test.ts` | 15 tests covering `indexFile`, `indexFiles`, `indexCoModification`, and graph state verification. |

### Upgraded Files

| File | What Changed |
|---|---|
| `src/memory/compoundingLog.ts` | `querySimilar()` is now `async`. Uses `RuVectorClient.searchHyperedges()` when a client is injected; falls back to TF-IDF cosine. `append()` fire-and-forgets a graph node + hyperedge write to RuVector. |
| `src/loop/cognitiveLoopServer.ts` | `ServerConfig.ruVector?: RuVectorClientConfig` added. `RuVectorClient` and `ASTIndexer` instantiated in constructor. `/cognitive/verdict` uses hybrid search. New `POST /cognitive/graph` endpoint (Cypher, k-hop, stats). Version bumped to `0.2.0`. |
| `tests/memory/compoundingLog.test.ts` | `querySimilar` tests made `async` to match the new signature. |

---

## Architecture Decision

The `@ruvector/graph-node` native binding was used directly (in-process) rather than via the CLI. This was discovered during the audit: `db.stats()` is async and returns `{ totalNodes, totalEdges, avgDegree }` — not `node_count` as the TypeScript types suggested. All tests were written against the actual runtime behaviour.

The `RuVectorClient` is injected as an optional dependency into both `CompoundingLog` and `CognitiveLoopServer`. When omitted (e.g., in tests that do not need graph persistence), the system falls back to TF-IDF similarity — zero breaking changes to existing callers.

---

## Test Results

| Suite | Tests | Result |
|---|---|---|
| `ruVectorClient.test.ts` | 20 | ✅ All pass |
| `astIndexer.test.ts` | 15 | ✅ All pass |
| `compoundingLog.test.ts` | 28 | ✅ All pass |
| `cognitiveLoopServer.test.ts` | 18 | ✅ All pass |
| All other suites | 40 | ✅ All pass |
| **Total** | **121** | **✅ 100% green** |

---

## Next Sprint Candidates

1. **Dream State** — scheduled `ASTIndexer.indexFiles(allSrcFiles)` run at low-activity periods to build a full codebase graph
2. **Frontier Layer (L3)** — `kHopNeighbors` used to compute blast radius before applying a patch
3. **Production embeddings** — swap `mockEmbedding` in `ASTIndexer` for OpenAI `text-embedding-3-small` or a local Ollama GGUF model
4. **Graph persistence** — pass `storagePath` to `RuVectorClient` in production `cortex.yaml` so the graph survives container restarts
