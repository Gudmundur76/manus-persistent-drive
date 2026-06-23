# Sprint 1 — Foundation + ASI-Evolve + Citation + Wukong

**Date:** 2026-06-23
**Manus checkpoint:** `f366efa6`
**Tests:** 12/12 passing | TypeScript: 0 errors

---

## What Was Built

### Phase 1 — Core Discovery Engine
- Database schema: 6 tables (corpus, cycles, candidates, convergence_candidates, loop_state, citation_records)
- 44 HIV protease inhibitor seeds from ChEMBL/PDB/BindingDB loaded into corpus
- Chemistry module: Morgan fingerprints, Tanimoto similarity, ADMET descriptors
- ML ensemble predictor: 10-model Random Forest, pIC50 from Morgan fingerprints
- 4-track molecule generator (A: ChEMBL top actives, B: PDB co-crystals, C: BindingDB, D: Diverse scaffolds)
- Citation gate: 8-stage PubMed/PDB/UniProt/ChEMBL/BindingDB/AlphaFold/OpenAlex/CrossRef verification
- Convergence detector: cross-track Tanimoto clustering
- Heartbeat scheduler: every 4 hours, job ID `hiv-discovery-loop`
- 7 tRPC procedures: stats, loopStatus, candidates, cycles, trackDistribution, bestCandidates, triggerCycle
- Frontend: Home (live stats), Dashboard (loop status, track distribution), Findings (candidate library, CSV export)

### Phase 2 — ASI-Evolve Exact Port
- Experiment database with UCB1/greedy/random strategy sampling
- Cognition store seeded from 11 public databases
- Researcher agent (LLM generates candidate molecules)
- Engineer agent (applies SEARCH/REPLACE diffs)
- Analyzer agent (evaluates step output, computes eval_score)
- Manager agent (LLM optimizes Researcher/Analyzer prompts)
- 4-stage orchestrator: Learn → Design → Experiment → Analyze
- 3 new DB tables: evolve_runs, evolve_nodes, evolve_cognition

### Phase 3 — 10 Public Database Sources
- PubChem (115M+ compounds), ChEMBL, RCSB PDB, UniProt, AlphaFold DB
- Europe PMC, OpenAlex, Semantic Scholar, ClinicalTrials.gov, CrossRef
- All wired into cognition seeder as sources 1–10

### Phase 4 — ASI-Evolve Fidelity
- LLM-based text embeddings (replacing TF-IDF)
- MAP-Elites island sampler with 4 feature dimensions and migration
- Manager agent with LLM-generated prompt optimization
- SEARCH/REPLACE diff engine (<<<<<<< SEARCH / >>>>>>> REPLACE blocks)
- researcher_diff prompt for incremental evolution
- BestSnapshotManager persisting best-scoring outputs to DB

### Phase 5 — Run State Persistence
- run-state.ts: TypeScript port of evolve_core/run_state.py
- managedPrompts + islandSampler state serialized to evolve_runs DB columns
- IslandSampler.getSerializableState() / restoreState() methods
- BestSnapshotManager.initFromBestScore() for DB restore
- Loop resumes from exact state after server restart

### Phase 5b — citation.manus.space Integration
- citation-client.ts: full adapter (verifyClaim, submitDocument, searchClaims, listClaimsByVertical)
- Verifier wires verifyClaim() into citation gate — verdict stored on evolve_nodes
- Score modifier: Supported +0.5, Contradicted -0.3 to eval_score
- Cognition seeder pulls 200 structural_biology claims on startup (source 11)
- Incremental refresh using updatedSince cursor
- 4 new tRPC procedures: citationVerifyClaim, citationSearchClaims, citationLatestClaims, citationVerifyCandidate
- Frontend: citation verdict badges on Dashboard best candidate and Findings candidate cards
- DB: citation_verdict, citation_doc_id, citation_confidence columns on evolve_nodes

### Phase 6 — Wukong Quantum Hardware
- wukong_vqe.py: Python subprocess using pyqpanda3 QCloudService
- Authenticated against Origin Quantum Cloud with WUKONG_API_TOKEN
- Available backends confirmed: WK_C180_2 (real hardware), full_amplitude (free simulator)
- Active backend: full_amplitude (free, exact quantum state)
- WK_C180_2 ready: set WUKONG_BACKEND=WK_C180_2 when QPU credits purchased
- callWukongApi() returns {score, backendUsed} — provenance set accurately
- QUANTUM_SIM / QUANTUM_DUAL / CLASSICAL labels now reflect actual backend used

---

## Key Decisions Made

1. **ASI-Evolve over custom ML**: Chose to port the exact ASI-Evolve architecture rather than build a custom ML pipeline, because ASI-Evolve has proven frontier-level results in drug discovery.
2. **citation.manus.space as external truth**: All candidate claims are verified against the ttruthdesk backend — the system cannot self-certify its own outputs.
3. **full_amplitude over WK_C180_2**: Free quantum simulator produces exact results; real hardware adds noise without scientific benefit at this scale. Upgrade path is ready.
4. **Run state persistence**: Critical for a 30-day autonomous loop — the system must survive server restarts without losing the UCB1 learning state.

---

## Blockers Encountered

- pyqpanda3 has dependency conflicts with Python 3.12 (matplotlib circular import). Resolved by using the REST API approach via subprocess with JSON output.
- Origin Quantum Cloud WK_C180_2 requires purchased QPU credits. Resolved by using full_amplitude (free) as default.
- citation.manus.space documents.create endpoint requires authentication. Resolved by using the public verify-claim endpoint instead.

---

## Next Sprint Priorities

1. SwissADME ADMET integration (API key needed)
2. Day-30 report template scaffold
3. Monitor UCB1 learning after 7 days of runtime
4. Consider adding a public-facing "live discovery feed" page showing real-time ASI-Evolve steps
