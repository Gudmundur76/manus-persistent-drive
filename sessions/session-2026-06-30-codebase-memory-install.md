# Session Report: 2026-06-30 — codebase-memory-mcp Installation
*Written by Manus at end of session*

## Summary

Installed codebase-memory-mcp 0.8.1 and indexed all four platform repos. All graphs are live and queryable. The knowledge graph layer is now operational for cross-session code intelligence.

---

## What Was Done

### 1. Installation
- Installed `codebase-memory-mcp` 0.8.1 via official install script
- Binary at `~/.local/bin/codebase-memory-mcp`
- Graphs stored at `~/.cache/codebase-memory-mcp/*.db`

### 2. Repos Indexed

| Repo | Nodes | Edges | Compressed |
|---|---|---|---|
| `asi-evolve-discovery-engine` | 835 | 2,647 | 1.0 MB |
| `generic-signal-api` | 1,793 | 3,961 | 1.4 MB |
| `ttruthdesk-platform` | 39,494 | 60,422 | 9.8 MB |
| `protein-truth-desk` (webdev) | 35,886 | 53,515 | 8.7 MB |

### 3. Graph Snapshots Created
- `.codebase-memory/graph.db.gz` created in each repo directory
- `README.md` with bootstrap instructions in each `.codebase-memory/` dir
- GitHub Actions workflow added to `generic-signal-api` for auto-update on push
- `ttruthdesk-platform` already had a `codebase-memory.yml` workflow

### 4. Bootstrap Script
- `scripts/bootstrap-codebase-memory.sh` — restores all graphs in a new session
- Run: `bash /home/ubuntu/repos/manus-persistent-drive/scripts/bootstrap-codebase-memory.sh`

---

## Verification Queries (All Passing)

```bash
# Find mutate_smiles in asi-evolve
codebase-memory-mcp cli search_graph \
  '{"project":"home-ubuntu-repos-asi-evolve-discovery-engine","query":"smiles mutation"}'
# → mutate_smiles (backend/agents/smiles_mutator.py:358)

# Find deliverToPartner in generic-signal-api
codebase-memory-mcp cli search_graph \
  '{"project":"home-ubuntu-repos-generic-signal-api","query":"deliverToPartner"}'
# → deliverToPartner (server/lib/autonomousLoop.ts:511)

# Trace deliverToPartner callers (depth 3)
codebase-memory-mcp cli trace_path \
  '{"project":"home-ubuntu-repos-generic-signal-api","function_name":"deliverToPartner","depth":3}'
# → callers: runAutonomousDistributionLoop → handleAutonomousLoop → main
# → callees: fetch, getLayerForGene, getTherapeuticArea

# Find verifyClaim in ttruthdesk
codebase-memory-mcp cli search_graph \
  '{"project":"home-ubuntu-repos-ttruthdesk-platform","query":"verifyClaim citation"}'
# → verifyClaim (server/verticalCopilotActions.ts:57)
```

---

## What Could Not Be Done

**Git push of graph snapshots**: GitHub auth token is not accessible as an env var in the sandbox. The GitHub connector is enabled in Manus but the token is only available to Manus tasks, not to sandbox shell code.

**Workaround options:**
1. Run `bash scripts/bootstrap-codebase-memory.sh` at the start of each session — re-indexes from source in ~5 seconds per repo
2. Manually push the `.codebase-memory/` dirs with a PAT: `git push` after `git add .codebase-memory/`
3. The GitHub Actions workflows in each repo will auto-update the snapshots on the next push to `main`

---

## How to Use in Next Session

```bash
# Restore all graphs (run once at session start)
bash /home/ubuntu/repos/manus-persistent-drive/scripts/bootstrap-codebase-memory.sh

# Then query any repo
export PATH="$HOME/.local/bin:$PATH"

# Search by meaning
codebase-memory-mcp cli search_graph \
  '{"project":"home-ubuntu-repos-generic-signal-api","query":"resistance scoring"}'

# Trace call chain
codebase-memory-mcp cli trace_path \
  '{"project":"home-ubuntu-repos-ttruthdesk-platform","function_name":"verifyClaim","depth":4}'

# Get architecture overview
codebase-memory-mcp cli get_architecture \
  '{"project":"home-ubuntu-repos-ttruthdesk-platform","aspects":["all"]}'

# List all projects
codebase-memory-mcp cli list_projects '{}'
```

---

## Note on dna-evolve

`dna-evolve` does not exist as a public GitHub repo under `Gudmundur76`. The repos that exist are:
- `asi-evolve-discovery-engine`
- `generic-signal-api`
- `ttruthdesk-platform`
- `manus-persistent-drive`
- `cognitive-loop-framework`
- `notus`, `notus-is`
- `slm-infra-deploy`

The `dna-evolve` functionality referenced in previous sessions may be part of `ttruthdesk-platform` or `generic-signal-api`, or may not yet be pushed to GitHub.
