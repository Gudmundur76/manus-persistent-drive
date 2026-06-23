# Sprint Lesson — Quantum Provenance + WuKong Integration
**Date:** 2026-06-23
**Sprints covered:** QUANTUM_DUAL tier, provenance honesty, quantum jobs admin, heartbeat, spec endpoint
**Platform:** ttruthdesk-platform (TypeScript/tRPC)

---

## What was confirmed

1. **OriginQ Cloud API key works.** The key `321ed3d8f9e3ede83b5df3e95e18f48878d5988714e049219b56b6e92c399eb769636246693935505876544d4c465456` authenticates successfully against `https://qcloud.originqc.com.cn`. Available backends: `WK_C180_2` (online), `PQPUMESH8` (online), `full_amplitude`, `partial_amplitude`, `single_amplitude`.

2. **WuKong hardware jobs submit and queue correctly.** A real VQE circuit (H2 Hamiltonian, RPHI+CZ native gates) submitted to `WK_C180_2` transitions `WAITING → COMPUTING → QUEUING`. The job ID format is a 32-char hex string (e.g. `6E0FF6304954EF3AD969DB75A559F0DC`). Job submission takes ~3 seconds. Queue wait time is variable (minutes to hours on a shared quantum computer).

3. **pyqpanda3 SDK is Python-only.** There is no public REST API for OriginQ Cloud. The correct integration pattern is a Python subprocess (`vqeScorer.py`) called from Node.js with `--mode submit` (non-blocking) and `--mode poll` (status check). Do not attempt synchronous blocking calls.

4. **Jiuzhang 4.0 is real and peer-reviewed.** Published in *Nature* 2026-05-13, DOI `10.1038/s41586-026-10523-6`. 3,050 photons, 8,176 modes, 10⁵⁴ speedup vs El Capitan. Access is research-partnership-level only (USTC/Jiuzhang Quantum Technology Co. Ltd.) — not self-serve API. The `similarity_search` field in `asi-evolve` is not yet backed by real Jiuzhang hardware.

5. **The `QUANTUM_DUAL` tier activates only on `provenance_status === "quantum-hardware"`.** The `QUANTUM_READY` tier (priority 0.75) is the correct intermediate state when `asi-evolve` provides scores but no hardware job has been confirmed. This distinction is enforced in `deriveTrustTier()` in `gapMapper.ts`.

6. **`ttruthdesk` is a verification layer, not a quantum executor.** The correct architecture: `asi-evolve` calls quantum hardware → returns scores in `pic50_vqe` and `similarity_search` → `ttruthdesk` consumes and stamps provenance. The `vqeScorer.py` fallback in `ttruthdesk` is an enrichment step for when `asi-evolve` returns null VQE scores, not the primary path.

7. **Heartbeat scheduling requires deployment first.** Per `references/periodic-updates.md`, the platform heartbeat scheduler POSTs to the production URL. The `/api/scheduled/quantum-vqe-poll` callback is registered and ready; the actual 5-minute cron schedule must be created via `createHeartbeatJob()` after the site is deployed.

---

## What was corrected

1. **Initial framing overstated hardware integration.** The first document claimed `ttruthdesk` "uses quantum hardware" — corrected to "certifies quantum-hardware-scored provenance". The `provenance_status` field (`quantum-architecture` vs `quantum-hardware`) now makes this distinction machine-readable and auditable.

2. **Synchronous VQE subprocess was wrong.** The first `vqeScorer.py` implementation blocked waiting for hardware results. Corrected to async submit/poll with `quantum_vqe_jobs` table as the state store.

3. **`QUANTUM_DUAL` was activating on architecture, not hardware.** The original `deriveTrustTier()` did not check `provenance_status`. Corrected: `QUANTUM_DUAL` now requires `provenance_status === "quantum-hardware"` as a gate condition.

---

## What the next sprint should know

1. **The `quantum_vqe_jobs` table is live and the poller is wired.** The next sprint can build the heartbeat schedule creation UI (a tRPC mutation that calls `createHeartbeatJob` with `cron: "0 */5 * * * *"` and `path: "/api/scheduled/quantum-vqe-poll"`). This requires the site to be deployed first.

2. **WuKong backend `WK_C180_2` is the correct target.** `WK_C180` is offline. Always check `service.available_backends()` before submitting — backend availability changes.

3. **The `ORIGINQ_API_KEY` is stored as a project secret in `ttruthdesk`.** It is accessible via `ENV.originqApiKey` in server code. The Python subprocess reads it from the `ORIGINQ_API_KEY` environment variable passed via `child_process.spawn`.

4. **The spec endpoint is live at `/spec/quantum-dual/v1` and `/spec/quantum-dual/v1.json`.** It serves `application/ld+json` with 24h cache. The next sprint can add this URL to the `/.well-known/api-catalog` endpoint and the `llms.txt` file for AI discoverability.

5. **2 pre-existing test failures in `domainIngestScheduler.test.ts`.** Both timeout at 5000ms due to network calls in the sandbox. These are not regressions. They should be fixed by mocking the external domain ingest HTTP call in the test setup.

6. **`asi-evolve` integration gap.** The `ORIGINQ_API_KEY` belongs in `asi-evolve`'s environment for the primary VQE scoring path. The `ttruthdesk` fallback enrichment is a secondary path. The next sprint should wire the key into `asi-evolve`'s VQE scoring function and confirm that `pic50_vqe` in the `/api/candidates/top` response is populated by a real hardware call.

---

## Files changed in these sprints

| File | Change |
|---|---|
| `server/verticalAdapters/molecularDiscovery.ts` | Added `provenance_status`, `deriveProvenanceStatus`, `QUANTUM_READY` tier, VQE submit wiring |
| `server/frontier/gapMapper.ts` | Added `QUANTUM_DUAL`, `QUANTUM_READY`, `QUANTUM_SINGLE` tiers; `deriveTrustTier` updated |
| `server/frontier/gapRanker.ts` | Added `quantum_provenance` case with 0.75 multiplier |
| `server/dream/contradictionSimulator.ts` | Added `routeQuantumDualContradiction` |
| `server/analysisPipeline.ts` | Wired frontier gap trigger and dream layer routing after citation edge write |
| `server/citationChainAnalyzer.ts` | Added `provenance_status` to `insertCitationEdge` parameter type |
| `server/quantum/vqeScorer.py` | New: async submit/poll Python script for WuKong VQE |
| `server/quantum/quantumVqePoller.ts` | New: Node.js heartbeat poller for pending WuKong jobs |
| `server/quantumDualSpecRoute.ts` | New: JSON-LD spec endpoint at `/spec/quantum-dual/v1` |
| `server/routers.ts` | Added `quantumJobs.list` and `quantumJobs.triggerPoll` tRPC procedures |
| `server/_core/index.ts` | Registered `/api/scheduled/quantum-vqe-poll` and `registerQuantumDualSpecRoute` |
| `server/_core/env.ts` | Added `originqApiKey` to ENV |
| `drizzle/schema.ts` | Added `quantum_vqe_jobs` table and `quantum_provenance` to `gapType` enum |
| `client/src/pages/QuantumJobs.tsx` | New: admin page with live WuKong job queue table |
| `client/src/pages/ClaimProvenance.tsx` | Added `QuantumProvenanceBadge` and `QuantumProvenancePanel` |
| `client/src/App.tsx` | Added `/admin/quantum-jobs` route |
| `client/src/components/DashboardLayout.tsx` | Added Quantum Jobs nav item |
| `server/molecularDiscovery.test.ts` | 5 integration tests for quantum provenance pipeline |
