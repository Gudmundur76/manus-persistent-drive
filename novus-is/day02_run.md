# novus.is — Day 2 Run Log

**Date:** 2026-06-22  
**Day:** 2  
**Cycles:** 5  

## Summary

| Metric | Value |
|---|---|
| Total candidates generated | 773 |
| Passed ensemble consensus | 713 (std ≤ 0.3 pIC50) |
| Submitted to citation.manus.space | 100 (top 5 per track per cycle) |
| Added to corpus | 0 |
| Corpus total | 44 |
| Best Track C pIC50 | 9.11 |
| Best Track B pIC50 | 8.77 |
| Mean confidence | 0.93 |

## Observation

Day 2 added 0 new records. This is expected and correct behaviour. The corpus diversity filter and citation confidence threshold (≥ 0.85) are working as intended — the engine is not adding duplicates or low-confidence candidates. The ensemble is generating structurally similar candidates to day 1 (same scaffold families), which is why none pass the novelty gate.

The diversity filter will naturally push toward novel scaffolds as the corpus grows. Track D (Diverse Scaffolds) is the primary source of novelty — it seeds from BindingDB with low Tanimoto similarity to approved drugs.

## Next Milestone

Day 7: Cross-track convergence analysis activates. Molecules appearing in 2+ tracks with Tanimoto ≥ 0.7 will be flagged as convergence candidates.

## Commit

novus-is GitHub: `day02/cycle0005: Daily run complete` — committed and pushed.
