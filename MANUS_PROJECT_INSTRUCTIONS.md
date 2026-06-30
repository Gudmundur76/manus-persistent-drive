# Manus Project Instructions — ttruthdesk-platform

> **Paste the content below this line into Settings → Project Instructions in the Manus UI.**
> This file is the source of truth. Update it here, then re-paste.

---

## MANDATORY SESSION-START RITUAL

At the very start of every session, before doing anything else, run:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/Gudmundur76/manus-persistent-drive/main/scripts/bootstrap.sh)
```

If the drive is already cloned (faster):

```bash
bash ~/repos/manus-persistent-drive/scripts/bootstrap.sh
```

This single command will:
- Read the GitHub PAT from `~/Documents/Access.txt`
- Clone / update `manus-persistent-drive` and `ttruthdesk-platform`
- Restore the codebase-memory knowledge graph (39k+ nodes)
- Print `CURRENT_STATE.md` and the last compounding log entries
- Configure git push auth so commits can be pushed without manual steps

**Do not start any work until the bootstrap output is visible.**

---

## PROJECT IDENTITY

- **Project:** ttruthdesk-platform — AI-powered protein supplement claim verification engine
- **Repos:**
  - `https://github.com/Gudmundur76/ttruthdesk-platform` — main codebase
  - `https://github.com/Gudmundur76/manus-persistent-drive` — persistent memory
  - `https://github.com/Gudmundur76/cognitive-loop-framework` — CLF training pipeline
  - `https://github.com/Gudmundur76/slm-infra-deploy` — SLM/LoRA infrastructure
- **Methodology:** Ralph Wiggum TDD loop — write failing test → confirm failure → implement → confirm pass → commit
- **Quality gates:** `pnpm check` (0 TS errors) + `pnpm test` (all passing) + `pnpm stubs` (0 stubs) before every commit

---

## CREDENTIALS

- **GitHub PAT:** stored in `~/Documents/Access.txt` (line: `GitHub PAT: ghp_...`)
- **ENV vars:** `MR_AGENT_ENABLED=true`, `MR_AGENT_URL=http://localhost:8002`, `TRAINING_EXPORT_MIN_CONFIDENCE=0.85`
- **Manus secrets:** `ASIONE` (Iventure API), all others auto-injected by the platform

---

## MEMORY ARCHITECTURE (7 subsystems — all connected as of Phase 142)

| Subsystem | Storage | Purpose |
|---|---|---|
| vectorStore | CTC sidecar | Claim embeddings for similarity search |
| graph_claim_edges | MySQL | Semantic edges (supports/contradicts/cites) |
| contradictionAlerts | MySQL | Real-time + weekly contradiction flags |
| trainingBridge + CLF | cognitive-loop-framework | LoRA training pairs from verified verdicts |
| verificationEventStore | In-memory ring buffer | Telemetry and digest emails |
| coordApi/memoryRouter | MySQL coordContext | KG memory for coordinated agents |
| MRAgent (evolva-mragent) | External HTTP server | Episodic memory, pre-flight context, training export |

All seven subsystems are wired through `runAnalysisPipeline`. The MRAgent hooks are non-blocking — a downed server never interrupts claim verification.

---

## CODEBASE-MEMORY GRAPH

After bootstrap, the knowledge graph is live (39,480 nodes, 60,419 edges). Use it for structural queries instead of reading files:

```bash
export PATH="$HOME/.local/bin:$PATH"
codebase-memory query --project ttruthdesk-platform --query "who calls runAnalysisPipeline"
codebase-memory search --project ttruthdesk-platform --semantic "memory feedback loop"
```

The CI workflow (`.github/workflows/codebase-memory.yml`) re-indexes and commits a compressed snapshot on every push to `main`. The bootstrap script restores it automatically.

---

## DEVELOPMENT STANDARDS

- Functions under 80 lines; cyclomatic complexity ≤ 20
- No `as any` in production files
- No stubs committed to `main`
- Conventional commits: `feat:`, `fix:`, `test:`, `refactor:`, `chore:`
- One concern per commit — atomic commits
- Never commit a failing build

### Ralph Wiggum TDD Loop

1. Write a failing test describing the desired behaviour
2. Run the test — confirm it fails for the right reason
3. Write the minimum implementation to make it pass
4. Run the test — confirm it passes
5. Refactor if needed, keeping tests green
6. Commit

---

## ESCALATION RULES

Stop and report to the user (do not decide unilaterally) when:
- A quality gate fails after three attempts
- A change requires modifying the database schema
- A change requires modifying the API contract between citation-desk and ttruthdesk-platform
- A change affects the MCP tool interface
- A decision involves the product positioning or the Truth Doctrine
- The sprint definition is ambiguous about scope

---

## MANDATORY SESSION-END RITUAL

Before ending any session, run:

```bash
bash ~/repos/manus-persistent-drive/scripts/sync.sh "one-line summary of what was done"
```

This will:
- Export `schema.ts` and `todo.md` from ttruthdesk-platform
- Append a session entry to `compounding_log.md`
- Update `phase_log.md`
- Commit and push the drive to GitHub

**Never end a session without running sync.sh.** If the session is interrupted, the next session will start from stale state.

---

## REPO QUICK REFERENCE

```bash
# ttruthdesk-platform
cd ~/repos/ttruthdesk-platform
pnpm install    # install deps
pnpm check      # TypeScript type check
pnpm test       # run all tests
pnpm stubs      # check for stubs
pnpm dev        # start dev server

# Commit and push
git add -A
git commit -m "feat: ..."
git push origin main   # PAT already configured by bootstrap.sh
```

---

## WHAT THIS ENVIRONMENT IS NOT

- It is not a general-purpose assistant. Do not answer questions unrelated to this project.
- It is not a product advisor. The product vision is defined in `TRUTH_DOCTRINE.md` and is locked.
- It is not a code generator that ships stubs. Every function committed to `main` must be fully implemented and tested.
- It is not a one-shot session tool. It is a persistent environment. Treat every session as a continuation of the last one.
