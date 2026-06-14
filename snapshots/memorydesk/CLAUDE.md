# MemoryDesk — Agent Context File

**Project:** MemoryDesk — cross-project AI memory layer for Manus agents
**Repo:** https://github.com/Gudmundur76/memorydesk
**Current phase:** 24 (Export/Backup complete)
**GitHub commit:** `8daa5d7`
**Tests:** 60/60 passing
**TypeScript:** 0 errors

---

## What MemoryDesk Is

MemoryDesk is the persistent memory and coordination layer for the Manus agent ecosystem.
It stores memory records, agents, repositories, workflows, context packs, KG nodes/edges,
and agent task dispatch history. It connects to Protein Truth Desk and other projects via
the ASIONE coordination API.

**Tech stack:** React 19 + Tailwind 4 + Express 4 + tRPC 11 + Drizzle ORM + MySQL/TiDB

---

## Bootstrap

```bash
gh repo clone Gudmundur76/memorydesk /home/ubuntu/memorydesk 2>/dev/null \
  || git -C /home/ubuntu/memorydesk pull --rebase origin main

cd /home/ubuntu/memorydesk
pnpm install
pnpm check
pnpm test
```

---

## Key Files

- `drizzle/schema.ts` — 16 tables (see schema/ in this snapshot)
- `server/routers.ts` — all tRPC procedures (cortex.* namespace)
- `server/graphMemory.ts` — KG node/edge operations (ruvector-style)
- `server/agentDispatcher.ts` — dispatch tasks to Manus agents via ASIONE
- `server/ionosProvider.ts` — IONOS AI Model Hub provider (OpenAI-compatible)
- `server/exportService.ts` — full JSON export/backup of all tables
- `server/githubAudit.ts` — live GitHub repo stats via REST API
- `client/src/pages/Memory.tsx` — memory records + KG graph tab
- `client/src/pages/Analytics.tsx` — donut/sparkline/tag cloud dashboard
- `client/src/pages/Agents.tsx` — agent management + task dispatch panel
- `client/src/pages/Repositories.tsx` — repo management + live audit
- `client/src/pages/Settings.tsx` — LLM provider selection + backup/restore

---

## Database Schema (16 tables)

users, memoryRecords, agents, repositories, workflows, workflowSteps,
contextPacks, contextPackItems, chatMessages, briefingRuns, memoryEmbeddings,
deskConnections, workflowTriggers, kgNodes, kgEdges, agentTasks

---

## Phases Complete (1–24)

| Phase | Description |
|---|---|
| 1–12 | Core schema, memory CRUD, agents, repos, workflows, context packs, chat, briefings |
| 13–18 | Embeddings, desk connections, workflow triggers, multi-LLM routing, OpenRouter |
| 19 | IONOS AI Model Hub provider, Settings page LLM panel |
| 20 | KG graph memory (kg_nodes/kg_edges), force-directed graph tab in Memory page |
| 21 | Agent task dispatch via ASIONE coordApi, Agents page Task Dispatch panel |
| 22 | Memory analytics dashboard (donut/sparkline/tag cloud) |
| 23 | GitHub repo live audit (per-repo + Audit All) |
| 24 | Export/backup system (full JSON download + restore), 60/60 tests |

---

## Next Phases (25+)

- Phase 25: Vitest coverage thresholds (lines: 80, functions: 80)
- Phase 26: Quality Dashboard page (/analytics/quality) — test metrics, stub count, any usage
- Phase 27: Heartbeat cron — nightly GitHub audit + memory embedding refresh
- Phase 28: MemoryDesk ↔ Protein Truth Desk live sync — push verified claims as memory records
