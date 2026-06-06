# MemoryDesk TODO

## Phase 1 — Schema & Infrastructure
- [x] Design and write full Drizzle schema (memory_records, workflows, workflow_steps, agents, repos, context_packs, context_pack_items, chat_messages)
- [x] Generate migration SQL and apply via webdev_execute_sql
- [x] Seed initial agents (architect, repo auditor, product strategist, release manager, memory curator, Icelandic reviewer)
- [x] Seed initial repositories (CoreEngine, ProteinDesk, NationsDesk, IcelandDesk, StudyDesk, MemoryDesk)
- [x] Seed initial workflows (session briefing, repo audit, product strategy review, release readiness check)

## Phase 2 — Server / tRPC Routers
- [x] Owner-only middleware (ownerProcedure)
- [x] Memory router: list, create, update, delete, search, tag operations
- [x] Workflow router: list, create, run, update step status
- [x] Agent router: list, create, update activation status
- [x] Repository router: list, create, update, link notes
- [x] Context pack router: list, create, add items, export as markdown
- [x] Chat router: send message, stream LLM reply, save to history
- [x] Dashboard router: session briefing summary query

## Phase 3 — Frontend Design System
- [x] Global CSS variables: deep navy/slate palette, gold accent, refined typography (Inter + JetBrains Mono)
- [x] AppLayout sidebar navigation for MemoryDesk
- [x] Sidebar with all 7 navigation sections
- [x] Smooth page transitions and micro-interactions

## Phase 4 — Dashboard Page
- [x] Session briefing panel (active projects, recent decisions, agent roster status)
- [x] Quick stats cards (memory count, active workflows, active agents, repos)
- [x] Recent memory feed and quick actions

## Phase 5 — Memory Store Page
- [x] Memory record list with tag chips and type badges
- [x] Create/edit memory record modal (title, content, type, tags)
- [x] Full-text and tag search
- [x] Pin/unpin records

## Phase 6 — Workflow Engine Page
- [x] Workflow list with status indicators
- [x] Workflow detail with step-by-step execution view
- [x] Run/complete/reset workflow controls
- [x] Step status tracking (pending, running, done, failed)

## Phase 7 — Agent Roster Page
- [x] Agent cards with role, description, activation toggle
- [x] All 6 named agents pre-seeded and displayed
- [x] Edit agent description modal

## Phase 8 — Context Pack Builder Page
- [x] Context pack list
- [x] Builder: select memory records for pack
- [x] Export context pack as structured markdown for agent handoff
- [x] Preview assembled briefing document

## Phase 9 — Repository Registry Page
- [x] Repository list with status badges and last audit date
- [x] All 6 named repos pre-seeded
- [x] Edit repo status, audit date, linked notes

## Phase 10 — AI Memory Assistant (Chat)
- [x] Chat interface with message history
- [x] LLM integration via invokeLLM with memory context injection
- [x] Chat history persisted in database

## Phase 11 — Search
- [x] Full-text search across memory records
- [x] Tag-based filter across memory records

## Phase 12 — Polish & Tests
- [x] Vitest tests passing (auth.logout)
- [x] Loading skeletons on all data pages
- [x] Empty states on all list pages
- [x] Error boundary handling
- [x] Additional router vitest tests (20 tests passing across 2 test files)
- [x] Save checkpoint

## Bug Fixes

- [x] Fix Manus OAuth sign-in not completing on desktop browsers (added trust proxy + hardened state decoding)
- [x] Verify auth works on both desktop and mobile

## Phase 13 — Scheduled Session Briefing
- [x] briefing_runs table: id, status, workflowId, output (text), triggeredBy (cron/manual), createdAt
- [x] Migration + schema update
- [x] server/briefingJob.ts — runs session briefing workflow, injects recent memory, writes output to briefing_runs
- [x] POST /api/scheduled/session-briefing — Heartbeat handler: authenticate isCron, run briefingJob, save result
- [x] cortex.briefing.runManual — owner mutation: trigger briefing manually, return run id
- [x] cortex.briefing.listRuns — owner query: list recent briefing runs with output
- [x] cortex.briefing.registerCron / pauseCron / deleteCron — owner mutations for heartbeat management
- [x] Dashboard page — Briefing Runs panel: latest briefing output + manual trigger button

## Phase 14 — Memory Import from Persistent Drive
- [x] server/importService.ts — parse manus-persistent-drive JSON phase log + session files into memory records
- [x] cortex.import.fromDriveJson — owner mutation: accepts raw JSON string, parses, bulk-inserts memory records (deduplicate by title)
- [x] cortex.import.fromGithub — owner mutation: fetches raw file from GitHub URL, parses, bulk-inserts
- [x] Import page (client/src/pages/Import.tsx) — paste JSON or enter GitHub raw URL, preview parsed records, confirm import
- [x] Register /import route in App.tsx + sidebar nav item

## Phase 15 — Semantic Vector Search
- [x] memory_embeddings table: id, memoryId, embedding (text/JSON), model, createdAt
- [x] Migration + schema update
- [x] server/embeddingService.ts — generate embeddings via invokeLLM embedding endpoint, cosine similarity search
- [x] cortex.memory.semanticSearch — owner query: embed query string, return top-N memory records by cosine similarity
- [x] Chat router — replace keyword injection with semantic search: embed user message, inject top-5 semantically similar records
- [x] Memory page — semantic search toggle (keyword vs semantic)

## Phase 16 — Cross-Desk Live Integration
- [x] desk_connections table: id, name, baseUrl, apiKey, lastPingedAt, status (active/unreachable), createdAt
- [x] Migration + schema update
- [x] server/deskConnector.ts — polls /api/health/detailed on connected desks, fetches recent claim counts
- [x] cortex.desks.list / create / ping / delete — owner procedures for managing desk connections
- [x] Dashboard page — Connected Desks panel: live status, claim count, last ping time for each desk

## Phase 17 — Event-Driven Workflow Automation
- [x] workflow_triggers table: id, workflowId, eventType (memory_created/memory_tagged/manual), filterTags (JSON), isActive, createdAt
- [x] Migration + schema update
- [x] server/workflowAutomation.ts — checks triggers on memory record creation, queues matching workflows
- [x] Wire workflowAutomation.checkTriggers() into memory.create mutation (post-insert)
- [x] cortex.workflowTriggers.list / create / toggle / delete — owner procedures
- [x] Workflows page — Automation tab: list triggers, create trigger (event type + tag filter + target workflow)

## Phase 18 — Tests, TypeScript, Checkpoint
- [x] Vitest tests for briefingJob, importService, embeddingService, deskConnector, workflowAutomation
- [x] TypeScript check — 0 errors
- [x] All tests pass
- [x] Save checkpoint
- [x] Push to GitHub

## Phase 19 — IONOS AI Model Hub
- [x] server/ionosProvider.ts — IONOS sovereign model inference: IONOS_API_KEY, IONOS_API_URL env vars, OpenAI-compatible REST call
- [x] Extend multiLLM-style provider routing in routers.ts chat to support "ionos" provider
- [x] cortex.settings.setLLMProvider — owner mutation: switch active LLM provider (builtin/openrouter/freellm/ionos)
- [x] cortex.settings.getLLMProvider — owner query: return current provider + available providers
- [x] Settings page — LLM Provider panel: select provider, show active model, test connection

## Phase 20 — Ruvector Graph Memory
- [x] kg_nodes table: id, label, type (entity/concept/decision), properties (JSON), createdAt
- [x] kg_edges table: id, fromId, toId, relation, weight, createdAt
- [x] Migration + schema update
- [x] server/graphMemory.ts — addNode, addEdge, findRelated(nodeId, depth), searchNodes(query), getSubgraph
- [x] cortex.graph.addNode / addEdge / findRelated / searchNodes / getSubgraph — owner procedures
- [x] Memory page — Graph tab: force-directed graph visualization of KG nodes/edges

## Phase 21 — Agent Task Dispatch
- [x] agent_tasks table: id, agentId, title, description, status (pending/running/done/failed), result (text), dispatchedAt, completedAt
- [x] Migration + schema update
- [x] server/agentDispatcher.ts — dispatch task to Manus agent via ASIONE coordApi, poll for completion, write result
- [x] cortex.agentTasks.dispatch — owner mutation: create task, call agentDispatcher, return taskId
- [x] cortex.agentTasks.list / get / cancel — owner procedures
- [x] Agents page — Task Dispatch panel: dispatch form, task list with status + result

## Phase 22 — Memory Analytics Dashboard
- [x] cortex.analytics.summary — owner query: record counts by type, tag frequency top-10, records per day (last 30 days)
- [x] cortex.analytics.growthSeries — owner query: daily record creation counts for sparkline chart
- [x] cortex.analytics.tagCloud — owner query: all tags with frequency counts
- [x] Analytics page (client/src/pages/Analytics.tsx) — type distribution donut, growth sparkline, tag cloud, top agents by task count
- [x] Register /analytics route in App.tsx + sidebar nav item

## Phase 23 — GitHub Repo Live Audit
- [x] server/githubAudit.ts — fetch repo stats via GitHub API (GITHUB_TOKEN env var): commit count, open issues, open PRs, last commit date, contributors
- [x] cortex.repos.audit — owner mutation: fetch live stats for a repo, update repository record
- [x] cortex.repos.auditAll — owner mutation: audit all repos in parallel, return summary
- [x] Repositories page — Audit button per repo + Audit All button, show live stats panel

## Phase 24 — Export / Backup + Final Quality Pass
- [x] server/exportService.ts — full JSON export: all memory records, agents, repos, workflows, context packs, KG nodes/edges, agent tasks
- [x] server/importService.ts — full JSON restore: idempotent bulk insert from export JSON
- [x] cortex.backup.export — owner query: returns full JSON export object
- [x] cortex.backup.restore — owner mutation: accepts export JSON, restores all tables
- [x] Settings page — Backup panel: Export All button (downloads JSON), Restore from JSON (paste/upload)
- [x] Vitest tests for ionosProvider, graphMemory, agentDispatcher, githubAudit, exportService
- [x] TypeScript check — 0 errors
- [x] All tests pass (60/60)
- [x] Push to GitHub
