# notus.is — Architecture Blueprint

## One-Line Definition

> notus.is is a 30-day autonomous HIV-1 protease inhibitor discovery engine that runs four parallel molecular evolution tracks continuously, verifies every candidate against the peer-reviewed literature via citation.manus.space, and produces a peer-reviewable scientific document on Day 30.

## Scientific Objective

Find small-molecule HIV-1 protease inhibitors with **pIC50 ≥ 9.0** (≤ 1 nM IC50).

## Core Architecture

The system is a TypeScript port of [GAIR-NLP/ASI-Evolve](https://github.com/GAIR-NLP/ASI-Evolve) — the same agentic framework that produced frontier-level results in neural architecture search, pretraining data curation, and biomedical drug-target interaction without human intervention.

### Three-Layer Stack

```
Layer 1: Discovery Engine (legacy loop)
  ├── 4-track molecule generator (A: ChEMBL, B: PDB, C: BindingDB, D: Diverse)
  ├── ML ensemble predictor (10-model Random Forest, Morgan fingerprints)
  ├── Quantum VQE predictor (pyqpanda3 → Origin Quantum Cloud WuKong)
  ├── Citation gate (8-stage: PubMed, PDB, UniProt, ChEMBL, BindingDB, AlphaFold, OpenAlex, CrossRef)
  ├── Convergence detector (cross-track Tanimoto clustering)
  └── Heartbeat scheduler (every 4 hours, 6 cycles/day, 180 cycles/30 days)

Layer 2: ASI-Evolve Engine (exact port)
  ├── Experiment database (UCB1/greedy/random sampling)
  ├── Cognition store (seeded from 11 public databases + citation.manus.space)
  ├── Researcher agent (LLM generates candidate molecules + diff patches)
  ├── Engineer agent (applies SEARCH/REPLACE diffs to base code)
  ├── Analyzer agent (evaluates step output, computes eval_score)
  ├── Manager agent (LLM optimizes Researcher/Analyzer prompts)
  ├── IslandSampler (MAP-Elites with 4 feature dimensions, migration)
  ├── BestSnapshotManager (persists best-scoring outputs to DB)
  └── Run state persistence (managedPrompts + islandSampler state → DB)

Layer 3: Verification Layer (citation.manus.space)
  ├── verifyClaim() — POST /api/public/verify-claim (verdict + confidence + evidence)
  ├── searchClaims() — GET /api/public/claims/search
  ├── listClaimsByVertical() — GET /api/public/claims (structural_biology)
  └── Score modifier: Supported +0.5, Contradicted -0.3 to eval_score
```

## Eval Score Function

```
eval_score = (0.6 × mean_pIC50_top10) + (0.3 × verification_rate) + (0.1 × admet_pass_rate)
```

Citation modifier: Supported +0.5, Contradicted -0.3 (applied per node).

## Database Tables

| Table | Purpose |
|---|---|
| `corpus` | 44 HIV protease inhibitor seeds |
| `cycles` | Discovery loop cycle history |
| `candidates` | All evaluated molecules with pIC50, ADMET, citation verdict |
| `convergence_candidates` | Cross-track consensus molecules |
| `loop_state` | Loop running state |
| `citation_records` | Citation gate results |
| `evolve_runs` | ASI-Evolve run state (managed_prompts, island_state, best_score) |
| `evolve_nodes` | Per-step experiment nodes (citation_verdict, citation_confidence) |
| `evolve_cognition` | Cognition store items from 11 public databases |

## Quantum Integration

- **Backend:** pyqpanda3 → Origin Quantum Cloud (qcloud.originqc.com.cn)
- **Active backend:** `full_amplitude` (free, exact quantum state simulation)
- **Real hardware:** `WK_C180_2` (180-qubit Wukong superconducting chip) — ready, needs QPU credits
- **Circuit:** VQE ansatz — Hadamard → RY(SMILES-encoded angles) → CNOT chain → RY → Z-measurement
- **Provenance:** `QUANTUM_SIM` (simulator ran), `QUANTUM_DUAL` (2+ backends), `CLASSICAL` (fallback)

## External Integrations

| Service | Purpose | Status |
|---|---|---|
| citation.manus.space | Claim verification + cognition seeding | Active |
| PubChem | 115M+ compound database | Active |
| ChEMBL | Bioactivity database | Active |
| RCSB PDB | Protein structure database | Active |
| UniProt | Protein sequence/function | Active |
| AlphaFold DB | Predicted protein structures | Active |
| Europe PMC | Literature search | Active |
| OpenAlex | Open academic graph | Active |
| Semantic Scholar | AI-powered literature | Active |
| ClinicalTrials.gov | Trial data | Active |
| CrossRef | DOI metadata | Active |
| Origin Quantum Cloud | Wukong VQE circuits | Active (free tier) |

## Manus Project

- **Project name:** notus-is
- **URL:** https://hivprotease-eq9ltmms.manus.space
- **Dev server:** https://3000-ik6n7w2z18kxlkqh1lnhu-fa4eab3e.us2.manus.computer
- **Latest checkpoint:** `f366efa6`
- **Features:** db, server, user

## Day-30 Output

The system runs for 30 days (180 legacy cycles + ~180 ASI-Evolve steps). The Day-30 output is a peer-reviewable scientific document of the top convergence candidates — molecules that appeared independently in multiple discovery tracks and were verified against the literature.
