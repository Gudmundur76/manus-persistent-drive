# Protein Truth Desk — Agent Context File

**READ THIS FIRST.** This file tells any new agent session exactly what to do before writing
a single line of code.

---

## Step 0: Session Integrity Check (MANDATORY — run before anything else)

```bash
# Pull or clone the persistent drive
if [ ! -d /home/ubuntu/manus-persistent-drive ]; then
  gh repo clone Gudmundur76/manus-persistent-drive /home/ubuntu/manus-persistent-drive
else
  cd /home/ubuntu/manus-persistent-drive && git pull
fi

# Pull or clone the project repo
if [ ! -d /home/ubuntu/protein-truth-desk ]; then
  gh repo clone Gudmundur76/protein-truth-desk /home/ubuntu/protein-truth-desk
else
  cd /home/ubuntu/protein-truth-desk && git pull
fi

# Run the integrity gate — must show 0 FAILURES before proceeding
cd /home/ubuntu/protein-truth-desk
node scripts/session-integrity.mjs
```

**If the integrity check shows FAILURES, fix them before writing code.**

---

## Step 1: Bootstrap from Persistent Memory

```bash
cd /home/ubuntu/protein-truth-desk
node scripts/manus-session.mjs start
```

This will print:
- Current TODO progress (done/pending counts)
- Number of stub files remaining
- Last 5 sessions and what they accomplished
- Recent phase log

---

## Step 2: Read the Phase Log

```bash
cat /home/ubuntu/manus-persistent-drive/context/phase-log/phase_log.md
```

The phase log tells you what has been built, what is in progress, and what is planned next.
**Never start a phase that is already marked `done`.**

---

## Step 3: Check the Current State

```bash
# TypeScript must be clean before starting work
pnpm check

# All tests must pass before starting work
pnpm test

# Check stub count (correct script name is stub-tracker.mjs, NOT check-stubs.mjs)
node scripts/stub-tracker.mjs
```

If tests are failing or TypeScript has errors, **fix them before doing anything else.**
Do not add new features on top of broken tests.

---

## Step 4: Work

Follow the plan in `todo.md`. Each phase is a section in todo.md. Work top-to-bottom.

**Non-negotiable rules:**
1. Every new function must have a Vitest test
2. No `as any` in non-test, non-stub files — use proper types
3. Functions must stay under 80 lines
4. Commit after every phase (not every 5 phases)
5. Use Conventional Commits: `feat(scope): description`

---

## Step 5: End the Session

```bash
# Log the phase you completed
node scripts/manus-session.mjs log-phase 80 "description" done

# Sync state to both repos and end session
node scripts/manus-session.mjs end "feat(scope): description"
```

---

## Project Overview

**What it is:** A scientific claim verification platform for protein/nutrition research.
Ingests PubMed papers, extracts claims, scores them for quality, and provides a public API.
Routes claims through vertical-specific adapters (PDB, UniProt, OpenFDA, Europe PMC).

**Tech stack:** React 19 + Tailwind 4 + Express 4 + tRPC 11 + Drizzle ORM + MySQL/TiDB

**Key files:**
- `drizzle/schema.ts` — 29 tables (claims, documents, entities, KG, provenance, API keys, wiki, seo, swarm, etc.)
- `server/routers.ts` — all tRPC procedures (split into feature sections)
- `server/db.ts` — Drizzle DB helpers
- `todo.md` — full phase log with 600+ items
- `client/src/App.tsx` — all routes

**Current phase:** 79 (Final Quality Pass complete)
**Stub files:** 0 (all replaced in Phase 68 — run `node scripts/stub-tracker.mjs` to verify)

---

## Quality Thresholds (enforced)

| Metric | Current | Target (Phase 82) |
|---|---|---|
| Test pass rate | 438/438 (100%) | 100% always |
| Coverage (lines) | ~65% | 80% |
| Stub files | 0 | 0 always |
| `as any` in prod code | ~29 | 0 |
| ESLint warnings | 91 | < 20 |
| Functions > 80 lines | ~10 | < 5 |

---

## Persistent Memory Repos

| Repo | Purpose |
|---|---|
| `Gudmundur76/protein-truth-desk` | Full project codebase |
| `Gudmundur76/manus-persistent-drive` | Session state, phase log, KG snapshots, context |
| `Gudmundur76/memorydesk` | MemoryDesk — cross-project AI memory layer |

All three must be pushed at the end of every session.
