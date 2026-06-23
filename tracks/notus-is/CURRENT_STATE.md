# notus.is — Current State

**Last updated:** 2026-06-23
**Session:** Sprint 1 — Foundation + ASI-Evolve + Citation + Wukong
**Status:** GREEN — All 6 phases complete. Loop running.

---

## Immediate Next Action

The discovery loop is running autonomously every 4 hours. No immediate code action required.

**Next sprint priorities (in order):**
1. SwissADME ADMET integration (needs API key from swissadme.ch)
2. Day-30 report template (PDF/markdown export scaffold — can be built now, data populates over 30 days)
3. Monitor first 7 days of ASI-Evolve cognition accumulation — check if UCB1 is learning

---

## Phase Completion Status

| Phase | Status | Description |
|---|---|---|
| Phase 1 — Core Engine | ✅ Complete | Discovery loop, 4 tracks, ML ensemble, citation gate, Heartbeat |
| Phase 2 — ASI-Evolve Port | ✅ Complete | Experiment DB, Cognition store, Researcher/Analyzer/Manager agents |
| Phase 3 — 10 Public Databases | ✅ Complete | PubChem, ChEMBL, PDB, UniProt, AlphaFold, Europe PMC, OpenAlex, Semantic Scholar, ClinicalTrials, CrossRef |
| Phase 4 — ASI-Evolve Fidelity | ✅ Complete | LLM embeddings, MAP-Elites, Manager agent, SEARCH/REPLACE diffs, BestSnapshotManager |
| Phase 5 — Run State Persistence | ✅ Complete | managedPrompts + islandSampler state → evolve_runs DB columns |
| Phase 5b — Citation Integration | ✅ Complete | verifyClaim wired into verifier, cognition seeding, score modifier, frontend badges |
| Phase 6 — Wukong Quantum | ✅ Complete | pyqpanda3 subprocess, full_amplitude active, WK_C180_2 ready |

---

## Key Technical Facts

- **Manus checkpoint:** `f366efa6`
- **Tests:** 12/12 passing
- **TypeScript errors:** 0
- **Loop frequency:** Every 4 hours (Heartbeat job `hiv-discovery-loop`)
- **Eval score formula:** `0.6×pIC50_top10 + 0.3×verification_rate + 0.1×admet_pass_rate`
- **Citation modifier:** Supported +0.5, Contradicted -0.3
- **Quantum backend:** `full_amplitude` (free), `WK_C180_2` ready (needs QPU credits)

---

## Open Items

| Item | Blocker |
|---|---|
| Day-30 report generation | Needs 30 days of runtime data |
| SwissADME ADMET | Needs registered API key from swissadme.ch |
| WK_C180_2 real hardware | Needs QPU credits purchased at qcloud.originqc.com.cn |

---

## Credentials in Use

| Service | Secret name | Notes |
|---|---|---|
| Origin Quantum Cloud | `WUKONG_API_TOKEN` | Set in Manus project secrets |
| citation.manus.space | Public API | No auth required for verify-claim |
| Manus DB | `DATABASE_URL` | Auto-injected |

---

## Bootstrap Instructions for Next Session

1. Read this file first.
2. Read `memory/compounding_log.md` (last 3 entries).
3. Read `blueprint/architecture.md` for full system context.
4. Check Manus project at https://hivprotease-eq9ltmms.manus.space
5. Run `pnpm test` to confirm 12/12 still passing before any changes.
6. Check `todo.md` in the notus-is project for any remaining items.
