# Development Discipline: The Law of the Build

**Applies to:** All three projects — Meta-Development System, ttruthdesk-platform, and cognitive-loop-framework  
**Status:** Non-negotiable. No exceptions. No drift.  
**Effective from:** First commit.

---

## The Prime Directive

> **We are not building a skeleton. We are building a production-grade system from the first line of code. Every file that is committed is complete, tested, and lint-clean. There is no "we will fix it later." Later does not exist.**

---

## Part 1: The Code Law

These rules are enforced on every file, in every session, without exception.

### Function Rules
| Rule | Limit | Violation Response |
| :--- | :--- | :--- |
| Maximum lines per function | 20 lines | Stop. Decompose immediately. |
| Maximum parameters per function | 3 | Stop. Use an options object or decompose. |
| Maximum nesting depth | 2 levels | Stop. Flatten with early returns. |
| Single responsibility | 1 purpose | Stop. Extract to a new function. |

### File Rules
| Rule | Limit | Violation Response |
| :--- | :--- | :--- |
| Maximum lines per file | 200 lines | Stop. Split by responsibility before continuing. |
| Maximum functions per file | 10 | Stop. Split the file. |
| One export focus per file | 1 primary purpose | Stop. Separate concerns. |

### Module Rules
- Maximum 3 levels of directory nesting. Flat is better than nested.
- No circular dependencies. Ever.
- Each module has a single, clear public interface.

### Anti-Patterns: These Are Banned
The following patterns will never appear in this codebase. If found, they are removed in the same session they are discovered.

- Global state
- Magic numbers or strings — use named constants
- Comments explaining *what* the code does — rename the function instead
- Dead code — delete it, git remembers
- Copy-paste duplication — extract to a shared function
- God objects or god files — split by responsibility
- Mixing refactoring commits with feature commits
- Large pull requests — small, focused changes only

---

## Part 2: The TDD Law

**Every piece of functionality is written test-first. No exceptions.**

The workflow is a strict four-phase cycle. A todo is not complete until all four phases have passed.

### Phase 1 — RED: Write the Test First
Write the test before writing any implementation code. Run the test suite. The new test **must fail**. If it does not fail, the test is invalid and must be rewritten. A test that passes before the implementation exists proves nothing.

### Phase 2 — GREEN: Write the Minimum Implementation
Write the minimum code required to make the failing test pass. Not the elegant code. Not the complete code. The minimum code. Run the test suite. All tests must pass.

### Phase 3 — VALIDATE: The Quality Gate
Run the full quality check in sequence. All three must pass before moving on.
```bash
# TypeScript projects
pnpm lint && pnpm typecheck && pnpm test --coverage

# Python projects
ruff check . && mypy . && pytest --cov --cov-fail-under=80
```
If any of these fail, the todo is **blocked**. It is not complete. It does not move forward.

### Phase 4 — COMPLETE: Commit and Log
Only after all three quality gates pass does the todo move to `completed.md`. The session state is checkpointed. The compounding log in `manus-persistent-drive` is updated.

### Blocking Conditions
A todo is **never** marked complete if:
- Tests were not written first
- Tests did not fail in the RED phase
- Any test is currently failing
- The linter has errors
- The type checker has errors
- Coverage has dropped below the threshold

---

## Part 3: The Sprint Law

Each sprint is a bounded unit of work governed by the Meta-Development System.

### Sprint Structure
Every sprint contains exactly three files in its directory inside `manus-persistent-drive/tracks/`:

1. **`loop_prompt.md`** — The Ralph Wiggum loop prompt with the exact Completion Promise string.
2. **`acceptance_criteria.md`** — The checklist of what must be true for the sprint to be complete.
3. **`post_sprint_log.md`** — Filled in after the sprint completes, recording what was learned.

### The Completion Promise
Every sprint has a single, precise Completion Promise — a string that the agent outputs when all acceptance criteria are met. The Ralph Wiggum loop runs until this string is produced or the maximum iteration count is reached.

Example:
```
<promise>SPRINT 1 COMPLETE — INDEXER LIVE, ALL TESTS GREEN, LINT CLEAN</promise>
```

### Sprint Rules
- A sprint is not complete until the Completion Promise is produced.
- If the loop reaches maximum iterations without the Completion Promise, the sprint is **blocked**. The blocker is documented. The sprint does not advance.
- No new features are added to a sprint after it begins. Scope is frozen at sprint start.
- No sprint begins until the previous sprint's `post_sprint_log.md` is committed to `manus-persistent-drive`.

---

## Part 4: The Session Law

Every Manus session follows this exact ritual. No session begins without it.

### Session Start (Mandatory)
```bash
# 1. Pull the latest state of the command centre
cd /home/ubuntu/manus-persistent-drive && git pull

# 2. Read the single entry point — this tells you everything
cat CURRENT_STATE.md

# 3. Read the active sprint's loop prompt
cat tracks/<active-track>/sprints/<active-sprint>/loop_prompt.md
```

### Session End (Mandatory)
```bash
# 1. Run the full quality gate on the project worked on
pnpm lint && pnpm typecheck && pnpm test --coverage

# 2. Commit the project changes with a phase-tagged message
git commit -m "log(sprint-N): [what was built] — [X] tests passing"

# 3. Append to the compounding log
echo "## Session: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> /home/ubuntu/manus-persistent-drive/memory/compounding_log.md

# 4. Sync the command centre
cd /home/ubuntu/manus-persistent-drive && git add -A && git commit -m "sync: session end — sprint N" && git push
```

### Session Rules
- A session that ends without syncing the command centre is treated as incomplete.
- The `CURRENT_STATE.md` is updated at the end of every session to reflect the current sprint status.
- If a session is interrupted, the next session begins by reading `CURRENT_STATE.md` and the compounding log. It does not begin from memory.

---

## Part 5: The Drift Prevention Law

Drift is the gradual divergence of a build from its blueprint. It is the primary cause of skeleton projects and abandoned codebases. These rules prevent it.

### The Five Drift Vectors and Their Controls

| Drift Vector | How It Happens | Control |
| :--- | :--- | :--- |
| **Context loss** | A new session starts without reading the command centre | Mandatory session start ritual |
| **Scope creep** | A feature is added to a sprint mid-execution | Sprint scope is frozen at start |
| **Cross-project contamination** | A session reads the wrong track's context | Track isolation in `manus-persistent-drive` |
| **Blueprint deviation** | A developer makes an architectural decision that contradicts the blueprint | Blueprint is immutable during a sprint |
| **Quality debt** | A todo is marked complete without passing all quality gates | Blocking conditions are enforced |

### The Immutability Rule
The `blueprint/` directory in `manus-persistent-drive` is **read-only during active sprints**. If a fundamental architectural change is required, the current sprint is stopped, the change is proposed, reviewed, and committed to the blueprint, and a new sprint is initiated. The blueprint is never modified silently.

---

## Part 6: The Commit Law

Every commit tells a story. A developer reading the git log must be able to understand the entire build history without reading a single line of code.

### Commit Message Format
```
<type>(sprint-N): <what was built> — <X> tests passing

Types: feat | fix | test | refactor | docs | chore
```

### Examples
```
feat(sprint-1): tree-sitter AST parser for TypeScript — 47 tests passing
fix(sprint-1): handle empty file edge case in SCIP exporter — 52 tests passing
test(sprint-1): add coverage for graph node deduplication — 55 tests passing
docs(sprint-0): add CURRENT_STATE.md to command centre
chore(sprint-0): rename data/ to snapshots/ in persistent drive
```

### Commit Rules
- Every commit passes the full quality gate before it is made.
- No commit mixes a refactor with a feature.
- No commit contains commented-out code.
- No commit reduces test coverage below the current threshold.

---

## Summary: The Non-Negotiables

These are the ten rules that govern the entire build. They are not guidelines. They are law.

1. **Test first.** Always. No exceptions.
2. **No file exceeds 200 lines.** Split immediately when the limit is reached.
3. **No function exceeds 20 lines.** Decompose immediately.
4. **No todo is complete until lint, typecheck, and coverage all pass.**
5. **No sprint advances until the previous sprint's log is committed.**
6. **No session begins without reading `CURRENT_STATE.md`.**
7. **No session ends without syncing the command centre.**
8. **No blueprint is modified during an active sprint.**
9. **No cross-track context mixing.** Each session works on one track.
10. **No skeleton code.** Every committed file is complete and production-ready.
