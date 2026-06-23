# Sprint 2 — Python Bridge Layer (Phase-A + Phase-B)
_Date: 2026-06-23_

## What was built

### Phase-A: Python Bridge Layer
- `server/discovery/python-bridge.ts` — spawns `python3 main.py` as a child process (same pattern as `wukong_vqe.py`). Implements `query()`, `quantumScore()`, `healthCheck()`. All three return graceful empty/false results when Python engine is not installed.
- `server/discovery/python-bridge.test.ts` — 6 unit tests with `vi.mock` on `child_process`. Tests: successful JSON parse, ENOENT graceful fallback, log-line stripping, healthCheck success, healthCheck fallback, quantumScore batch.
- 3 tRPC procedures added to `discovery.ts`: `queryPython`, `pythonHealth`, `pythonQuantumScore`

### Phase-B: Unified Source Registry + Cognition Seeding
- `server/discovery/python-adapter.ts` — 65-source unified registry (15 TypeScript-native + 50 Python-only). Exports `getAllSources()`, `getPythonOnlySources()`, `getTypeScriptSources()`, `getSourcesByDomain()`.
- `server/discovery/python-adapter.test.ts` — 4 unit tests for source registry
- `server/discovery/asi-evolve/cognition-seeder.ts` — added `seedFromPythonDiscovery()` function. Called in the Learn phase of the ASI-Evolve orchestrator.
- `server/discovery/asi-evolve/orchestrator.ts` — Learn phase now calls `seedFromPythonDiscovery()` after standard seeding
- `server/discovery/index.ts` — barrel export for the discovery module
- 2 new tRPC procedures: `sourceRegistry`, `pythonAdapterStatus`

## Test results
- 22/22 tests passing (4 test files)
- 0 TypeScript errors

## Checkpoint
- Manus: `9820a368`
- GitHub: pushed to `Gudmundur76/notus-is` main branch

## Decisions made
- Used dynamic `import()` for python-adapter in tRPC procedures to avoid circular dependency issues
- Fixed `SourceRegistry` field names (`adapterType`, `isQuantumEligible`, `isNative`, `sourceUrl`) — not `type`/`hasQuantum`/`rateLimit`
- `__dirname` in python-bridge.ts uses `fileURLToPath(import.meta.url)` (ESM-compatible) — tsx also polyfills it but the explicit approach is safer

## Next session priorities
1. Install the actual Python discovery engine at `~/asi-evolve-discovery-engine/main.py`
2. Set `PYTHON_DISCOVERY_PATH` env var to activate 50 Python-only sources
3. SwissADME ADMET integration (needs API key)
4. Day-30 report template scaffold
