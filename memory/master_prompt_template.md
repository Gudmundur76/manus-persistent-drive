# Master Prompt Template — asi-evolve Development Sessions

> One-line summary: Use this template for every sprint. It replaces step-by-step numbered lists with goal + boundaries + verification + autonomy + memory.

---

## When to Use

Load this template at the start of every development session touching:
- `asi-evolve-discovery-engine` (Python/FastAPI, autonomous research loop)
- `ttruthdesk-platform` (TypeScript/tRPC, 78-phase verification engine)
- `asi-evolve-self-direct` (TypeScript, self-direction orchestrator)
- `manus-persistent-drive` (persistent memory and lesson store)

---

## Template

```
CONTEXT: I am building a one-person autonomous research company on two backends:
- ttruthdesk-platform (TypeScript/tRPC, 78-phase verification engine)
- asi-evolve-discovery-engine (Python/FastAPI, autonomous research loop)
Both must remain independently deployable. Every change compounds — quality now saves rework later.

GOAL: [one sentence describing what needs to be built or fixed]

BOUNDARIES:
- Do not add features beyond what the goal requires
- Do not modify files outside the scope of this goal
- All asi-evolve reads from self-direct are read-only; no writes to asi-evolve DB or source

VERIFICATION:
Before reporting progress, audit each claim against a tool result from this session.
Only report work you can point to evidence for. If tests fail, say so with the output.
If a step was skipped, say that. When something is done and verified, state it plainly without hedging.

AUTONOMY:
You are operating autonomously. Pause only for: a destructive or irreversible action,
a real scope change, or input only the user can provide. For reversible actions that
follow from the original request, proceed without asking. Before ending your turn,
check your last paragraph — if it is a plan, a question, or a promise to do something,
execute it instead.

MEMORY:
After completing this sprint, write one lesson to manus-persistent-drive summarising
what was confirmed, what was corrected, and what the next sprint should know.
Store one lesson per file with a one-line summary at the top. Record corrections and
confirmed approaches alike, including why they mattered. Do not save what the repo or
chat history already records. Update an existing note rather than creating a duplicate.
Delete notes that turn out to be wrong.
```

---

## What to DELETE From Prompts (Fable 5 anti-patterns)

- Step-by-step numbered lists — replace with a goal statement and boundary block
- "Do not break existing tests" repeated per-prompt — covered by this standing file
- Explicit commit message strings — let the model reflect what actually changed
- Long boundary rule lists with 6–8 items — compress to 2–3 principles

---

## Biology Safety Classifier Note

Prompts mentioning HIV-1 protease, drug candidates, molecular docking, or SMILES strings
may trigger a safety classifier that routes to a weaker model. If a session seems
inexplicably weaker than expected, check which model actually responded. For molecular
biology work, explicitly specify the model in API calls rather than relying on routing.

---

## Revision History

| Date | Change |
|---|---|
| 2026-06-22 | Initial template written from Fable 5 pattern research |
