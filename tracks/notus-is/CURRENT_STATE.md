# notus.is — Current State

**Last updated:** 2026-06-23
**Session:** Sprint 2 — Python Bridge (Phase-A + Phase-B)
**Status:** GREEN — All 8 phases complete. 22/22 tests. Loop running.

---

## Immediate Next Action

The discovery loop is running autonomously every 4 hours. No immediate code action required.

**Next sprint priorities (in order):**
1. Install the actual Python discovery engine at `~/asi-evolve-discovery-engine/main.py` (set `PYTHON_DISCOVERY_PATH` env var) to activate the 50 Python-only sources
2. SwissADME ADMET integration (needs API key from swissadme.ch)
3. Day-30 report template (PDF/markdown export scaffold — can be built now, data populates over 30 days)
4. Monitor UCB1 learning — check if island sampler is differentiating strategies after 7 days

---

## Phase Completion Status

| Phase | Status | Description |
|---|---|---|
| Phase 1 — Core Engine | ✅ Complete | Discovery loop, 4 tracks, ML ensemble, citation gate, Heartbeat |
| Phase 2 — ASI-Evolve Port | ✅ Complete | Experiment DB, Cognition store, Researcher/Analyzer/Manager agents |
| Phase 3 — 10 Public Databases | ✅ Complete | PubChem, ChEMBL, PDB, UniProt, AlphaFold, Europe PMC, OpenAlex, Semantic Scholar, ClinicalTrials, CrossRef |
| Phase 4 — ASI-Evolve Fidelity | ✅ Complete | LLM embeddings, MAP-Elites, Manager agent, SEARCH/REPLACE diffs, BestSnapshotManager |
| Phase 5 — Run State + Citation | ✅ Complete | managedPrompts + islandSampler persisted, citation.manus.space wired end-to-end |
| Phase 6 — Wukong Quantum | ✅ Complete | pyqpanda3 subprocess, full_amplitude active, WK_C180_2 ready |
| Phase-A — Python Bridge | ✅ Complete | python-bridge.ts, 3 tRPC procedures (queryPython, pythonHealth, pythonQuantumScore) |
| Phase-B — Python Adapter | ✅ Complete | python-adapter.ts (65-source registry), seedFromPythonDiscovery, 2 tRPC procedures |

---

## Key Technical Facts

- **Manus checkpoint:** `9820a368`
- **GitHub:** https://github.com/Gudmundur76/notus-is (public)
- **Tests:** 22/22 passing (4 test files)
- **TypeScript errors:** 0
- **Loop frequency:** Every 4 hours (Heartbeat job `hiv-discovery-loop`)
- **Eval score formula:** `0.6×pIC50_top10 + 0.3×verification_rate + 0.1×admet_pass_rate`
- **Citation modifier:** Supported +0.5, Contradicted -0.3
- **Quantum backend:** `full_amplitude` (free), `WK_C180_2` ready (needs QPU credits)
- **Python engine path:** `PYTHON_DISCOVERY_PATH` env var (not yet installed)

---

## Open Items

| Item | Blocker |
|---|---|
| Day-30 report generation | Needs 30 days of runtime data |
| SwissADME ADMET | Needs registered API key from swissadme.ch |
| WK_C180_2 real hardware | Needs QPU credits at qcloud.originqc.com.cn |
| Python engine installation | Need to install asi-evolve-discovery-engine and set PYTHON_DISCOVERY_PATH |

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
2. Read `sprints/sprint-2-phase-b/session_log.md` for last session context.
3. Read `blueprint/architecture.md` for full system context.
4. Run `pnpm test` in `/home/ubuntu/notus-is` to confirm 22/22 still passing.
5. Check `grep -n "^\- \[ \]" /home/ubuntu/notus-is/todo.md` for open items.
