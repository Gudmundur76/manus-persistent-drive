# Sprint Lesson — Molecular Discovery Bridge (2026-06-22)

## What Was Built

The ASI-Evolve HIV Protease Discovery Engine is now wired to ttruthdesk / citation.is.
Every new best candidate found by the optimization loop is automatically emitted to
citation.is and receives a permanent, indexed, citable URL.

---

## Three-Repo Change Summary

### asi-evolve-discovery-engine (commit 33c642a)

**Files:** `backend/agents/cognition_store.py`, `backend/api/candidates.py`,
`backend/agents/loop_scheduler.py`, `backend/config.py`

1. `CycleRecord` extended with quantum provenance fields:
   `pic50_vqe`, `quantum_hardware`, `provenance_status`, `confidence`, `citation_ids`.
2. `CognitionStore` extended with `citation_registry: Dict[int, str]` for O(1) URL lookup.
3. `GET /api/candidates/top` now returns all quantum fields + `quantum_enabled` flag.
4. `POST /api/candidates/{cycle_id}/citation-id` — write-back endpoint for permanent URLs.
5. `emit_best_candidate_to_citation_is()` — async helper, called by loop_scheduler Step 7.
6. `loop_scheduler.run_single_cycle()` Step 7: fire-and-forget emission on `is_best_so_far`.
7. `config.py`: `citation_is_url` default updated to `protein-truth-desk.manus.space`,
   `citation_is_vertical` updated to `molecular_discovery`.

### ttruthdesk-platform (commit 0cf280b)

**Files:** `server/verticalAdapters/molecularDiscovery.ts`,
`server/verticalAdapters/index.ts`, `server/_core/env.ts`

1. `molecularDiscovery.ts` — new `VerticalAdapter` (domainKey: `molecular_discovery`):
   - Fetches top-N candidates from `GET /api/candidates/top` with 60 s TTL cache.
   - QUANTUM_DUAL tier: `confidenceScore` 0.95+ (two independent quantum backends).
   - QUANTUM_SIM tier: `confidenceScore` 0.80 (local VQE simulation).
   - CLASSICAL tier: `confidenceScore` 0.70 (ML-only prediction).
   - `emitMolecularCitationRecord()` exported for external callers.
   - Claim matching by SMILES, strategy keywords, lesson tokens, domain context.
2. `index.ts`: adapter registered after `hivProtease`.
3. `env.ts`: `asiEvolveUrl` added (`ASI_EVOLVE_URL` env var,
   default `hivprotease-eq9ltmms.manus.space`).

### manus-persistent-drive

This file.

---

## Data Flow (End-to-End)

```
asi-evolve loop_scheduler.run_single_cycle()
  → Step 7: record.is_best_so_far == True
    → emit_best_candidate_to_citation_is()
      → POST protein-truth-desk.manus.space/api/public/verify-claim
        { claim: "HIV-1 protease inhibitor (SMILES: ...) ...", vertical: "molecular_discovery" }
        → ttruthdesk analysisPipeline
          → molecularDiscovery.lookupEvidence()
            → GET hivprotease-eq9ltmms.manus.space/api/candidates/top
            → match candidate → confidenceScore 0.95 (QUANTUM_DUAL)
          → verdict: Supported
          → claimId: 42
        → response: { claimId: 42 }
      → permanent_url = "https://protein-truth-desk.manus.space/claim/42"
    → POST hivprotease-eq9ltmms.manus.space/api/candidates/{cycle_id}/citation-id
      { citation_url: "https://protein-truth-desk.manus.space/claim/42" }
      → CycleRecord.citation_ids.append(url)
      → CognitionStore.citation_registry[cycle_id] = url
      → store.save(store_path)
```

---

## Lessons Learned

1. **The missing link was not code, it was a vertical adapter.** The `/api/candidates/top`
   endpoint existed. The `POST /api/public/verify-claim` endpoint existed. The gap was a
   `VerticalAdapter` that connected them. Always audit the adapter registry before writing
   new ingestion code.

2. **Quantum provenance fields must travel with the candidate from the first cycle.**
   Adding them retroactively to `CycleRecord` required both schema migration and
   `from_dict` deserialization updates. Define the full provenance schema upfront.

3. **Fire-and-forget emission must be non-fatal.** The discovery loop must never stall
   because citation.is is temporarily unreachable. The `try/except` wrapper in Step 7
   is not optional — it is the architectural contract.

4. **`citation_is_vertical` must match the adapter `domainKey` exactly.**
   The previous value `hiv_protease` would have routed claims to the literature adapter,
   not the molecular discovery adapter. The vertical name is the routing key.

5. **ENV defaults should point to the actual deployed URL, not a placeholder.**
   `citation.manus.space` was a placeholder that would silently fail. The default now
   points to `protein-truth-desk.manus.space` which is the live deployment.

---

## Next Sprint Candidates

- Add `provenance_status = "QUANTUM_DUAL"` population in `quantum_predictor.py` when
  two hardware backends agree within 0.05 pIC50.
- Add a `/api/candidates/citation-summary` endpoint returning all emitted citation URLs
  for the dashboard.
- Wire `emitMolecularCitationRecord()` as a direct call from the ttruthdesk
  `analysisPipeline` post-verdict hook (currently the loop_scheduler calls it; the
  pipeline should also be able to trigger it for non-loop ingestion paths).
- Set `ASI_EVOLVE_URL` as a ttruthdesk secret in Manus Project Settings so it survives
  redeployment without hardcoding.
