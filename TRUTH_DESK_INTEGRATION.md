# Truth Desk — Manus Coordination Layer Integration

This document describes how [Truth Desk](https://github.com/Gudmundur76/protein-truth-desk) uses `manus-persistent-drive` as a persistent context substrate for its Manus task swarm.

---

## Architecture Overview

Truth Desk runs a swarm of 50+ parallel Manus tasks that process scientific papers across multiple research verticals. These tasks coordinate through Truth Desk's database-backed **Coordination Layer**, which mirrors the knowledge graph and vector memory patterns from this repository.

```
┌─────────────────────────────────────────────────────────────┐
│                     Truth Desk Server                        │
│                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌─────────────────┐ │
│  │  coord_tasks │   │  coord_queue │   │  coord_context  │ │
│  │  (registry)  │   │  (work items)│   │  (KG + memory)  │ │
│  └──────────────┘   └──────────────┘   └─────────────────┘ │
│           ↑                ↑                    ↑            │
│           └────────────────┴────────────────────┘           │
│                    /api/coord/* REST API                     │
│                    (x-coord-key auth)                        │
└─────────────────────────────────────────────────────────────┘
         ↑                                    ↑
         │ task.create                        │ heartbeat/complete
         │ task.detail                        │ queue dequeue
    ┌────┴──────────┐               ┌─────────┴──────────┐
    │  Manus API    │               │  Manus Agent Tasks  │
    │  (v2)         │               │  (50+ parallel)     │
    └───────────────┘               └────────────────────┘
```

---

## How `manus-persistent-drive` Patterns Are Used

### Knowledge Graph (`memory/knowledge_graph/graph_memory.py`)

Truth Desk's `coord_context` table implements the same node/edge pattern as `graph_memory.py`, but stored in MySQL instead of JSON files.

**Equivalent endpoints:**

| `graph_memory.py` method | Truth Desk REST endpoint |
|---|---|
| `add_node(id, label, properties)` | `POST /api/coord/memory/graph/node` |
| `add_edge(source, target, relation)` | `POST /api/coord/memory/graph/edge` |
| `export_graph()` | `GET /api/coord/memory/graph` |
| `search_nodes(query)` | `GET /api/coord/context?namespace=graph` |

**Node storage format in `coord_context`:**
```json
{
  "namespace": "graph",
  "key": "node:protein:whey_protein",
  "value": {
    "id": "protein:whey_protein",
    "label": "WheyProtein",
    "properties": { "type": "protein", "source": "dairy" }
  }
}
```

**Edge storage format:**
```json
{
  "namespace": "graph",
  "key": "edge:whey_protein:supports:muscle_synthesis",
  "value": {
    "source": "protein:whey_protein",
    "target": "claim:muscle_synthesis",
    "relation": "supports",
    "weight": 0.87
  }
}
```

### Vector Memory (`memory/vector/ruvector_memory.py`)

Semantic search over the knowledge graph is handled by Truth Desk's existing vector infrastructure. The `coord_context` namespace `"vector"` stores embedding metadata, while the actual vectors are stored in the `graph_entities` table.

---

## REST API Reference

**Base URL:** `https://<your-truth-desk-domain>/api/coord`  
**Auth:** `X-Coord-Key: <COORD_API_KEY>`

### Work Queue

```
POST /queue/enqueue          — add items to the work queue
POST /queue/dequeue          — claim the next item for a task
POST /queue/complete         — mark an item as processed
POST /queue/fail             — mark an item as failed (with retry flag)
GET  /queue/stats            — queue depth by vertical and status
```

### Task Registry

```
POST /tasks/register         — announce a new task
POST /tasks/heartbeat        — update last-seen timestamp + phase
POST /tasks/complete         — mark task as done
POST /tasks/fail             — mark task as failed with error message
GET  /tasks                  — list all running/pending tasks
```

### Context Store (Knowledge Graph)

```
GET    /context              — list all keys in a namespace
GET    /context/:key         — read a value
PUT    /context/:key         — write a value (with optional TTL)
DELETE /context/:key         — delete a value
GET    /memory/graph         — export full KG as {nodes, edges} JSON
POST   /memory/graph/node    — add a node
POST   /memory/graph/edge    — add an edge
```

---

## Agent Prompt Pattern

When Truth Desk spawns a Manus task for a vertical, it uses `buildVerticalAgentPrompt()` from `server/manusOrchestrator.ts` to generate a self-contained prompt that teaches the agent how to:

1. Register itself in the task registry
2. Dequeue and process work items in a loop
3. Send heartbeats every 2 minutes
4. Write discoveries to the context/KG store
5. Mark itself complete when the queue is empty

See `server/manusOrchestrator.ts` for the full implementation.

---

## Configuration

Add these environment variables to Truth Desk:

```env
# Manus API key (from https://manus.ai → Settings → API)
MANUS_API_KEY=your_manus_api_key_here

# Shared secret for /api/coord/* endpoints
# Agents include this in X-Coord-Key header
COORD_API_KEY=generate_a_random_32_char_secret
```

---

## Data Flow: Paper Processing

```
PMC Feed Job
    ↓ enqueues PMIDs
coord_queue (vertical="protein_supplement", status="pending")
    ↓ Manus agent dequeues
Manus Agent Task
    ↓ fetches abstract, extracts claims
    ↓ writes to coord_context (KG nodes/edges)
    ↓ marks queue item complete
Truth Desk DB
    ↓ claim verification pipeline
    ↓ wiki compilation
Public Registry
```

---

## Files Modified in Truth Desk (Phase 41)

| File | Change |
|---|---|
| `drizzle/schema.ts` | Added `coord_tasks`, `coord_queue`, `coord_context` tables |
| `server/coordApi.ts` | Full REST API for coordination layer |
| `server/manusOrchestrator.ts` | Manus v2 API client + orchestrator |
| `server/verticalFeedConfig.ts` | Added 6 new verticals |
| `client/src/pages/CoordinatorDashboard.tsx` | Admin dashboard |
| `server/coordLayer.test.ts` | 18 Vitest tests |

---

*Last updated: Phase 41 — June 2026*
