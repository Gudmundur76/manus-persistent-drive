# Meta-Agent Design — Session Governance for Protein Truth Desk

**Date:** 2026-06-09  
**Author:** Manus AI (Phase 94)  
**Status:** Approved for implementation

---

## Problem Statement

Between Phases 80 and 93 (13 phases, ~5 days), the `manus-persistent-drive` was never synced. This means:

- The phase log stopped at Phase 80
- Data snapshots are from Phase 79
- No session history exists for Phases 81–93
- Any future session starting from the drive would have a 13-phase blind spot

The root cause is not negligence — it is the absence of a **structural enforcement mechanism**. There was no script that ran automatically, no check that failed visibly, and no gate that blocked progress until the sync was done.

---

## Meta-Agent Mandate

The meta-agent is a **governance layer** that runs at two mandatory points in every session:

1. **Session start** — before any code is written or read
2. **Session end** — before any checkpoint or push

Its job is to enforce three invariants:

| Invariant | Check | Failure action |
|---|---|---|
| Drive is not stale | `manus-persistent-drive` was pushed within the last 24 hours | Block session start; print remediation steps |
| Phase log is current | `logs/phase-log.md` last entry matches the last completed phase in `todo.md` | Auto-append catch-up entry or prompt for one |
| Session is registered | A session JSON exists in `sessions/current/` for this session ID | Auto-create it |

---

## Architecture

The meta-agent is implemented as a single Node.js script: `scripts/meta-agent.mjs`

It has two modes:

### `--mode=start`
Run at the very beginning of every session, before `pnpm context:snapshot`.

1. Clones or pulls `manus-persistent-drive` into `/tmp/manus-persistent-drive`
2. Checks the last commit timestamp — if older than 24 hours, prints a **RED WARNING** but does not block (cannot block session start without breaking the workflow)
3. Reads `logs/phase-log.md` last entry and compares to `todo.md` last completed phase
4. If a gap is detected, prints the missing phases and the command to fix: `pnpm drive:sync`
5. Creates `sessions/current/{SESSION_ID}.json` with session metadata
6. Prints a summary: drive age, phase log currency, session ID

### `--mode=end`
Run at the very end of every session, after checkpoint and GitHub push.

1. Updates `logs/phase-log.md` with the current phase summary (prompts for content if not provided)
2. Copies key snapshot files to `data/protein-truth-desk/`
3. Updates `sessions/current/{SESSION_ID}.json` status to `complete`
4. Moves session file to `sessions/history/`
5. Commits and pushes `manus-persistent-drive` to GitHub
6. Prints confirmation: "Drive synced. Next session will start clean."

---

## Integration Points

### CLAUDE.md (mandatory ritual)

```
# -1. MANDATORY: Run meta-agent session-start check
pnpm meta:start

# 0. MANDATORY: Regenerate context snapshot
pnpm context:snapshot && cat CONTEXT_SNAPSHOT.md

# 1. MANDATORY: Sync feature_list.json from todo.md
pnpm feature:sync
```

### package.json scripts

```json
"meta:start": "node scripts/meta-agent.mjs --mode=start",
"meta:end": "node scripts/meta-agent.mjs --mode=end",
"drive:sync": "node scripts/meta-agent.mjs --mode=end --force"
```

### Pre-commit hook

After `pnpm feature:sync`, add:
```sh
echo "🔒 Meta-agent end-of-session check..."
node scripts/meta-agent.mjs --mode=end --dry-run
```

The `--dry-run` flag checks what would be synced without actually pushing — it prints a warning if the drive is stale but does not block the commit.

### CI check (`.github/workflows/ci.yml`)

A new `Drive Staleness` job that:
1. Clones `manus-persistent-drive`
2. Checks if the last commit is older than 48 hours
3. Fails with a clear message if so (gives a 48-hour grace window to account for weekends)

---

## Why This Works

The previous system relied on memory and intention. This system relies on **structure**:

- `pnpm meta:start` is the first line of CLAUDE.md — it is impossible to miss
- The CI `Drive Staleness` job means a stale drive causes a visible red X on GitHub
- The pre-commit `--dry-run` check means every commit prints the drive status
- The `drive:sync` command gives a one-command remediation path

The meta-agent does not need to be intelligent. It needs to be **present and loud**.

---

## What the Meta-Agent Does NOT Do

- It does not make decisions about what to build
- It does not read or interpret code
- It does not replace `pnpm context:snapshot` or `pnpm feature:sync`
- It does not have access to the LLM

It is a **process enforcer**, not an AI agent. The name "meta-agent" refers to its role governing the agent (Manus), not to it being an AI system itself.
