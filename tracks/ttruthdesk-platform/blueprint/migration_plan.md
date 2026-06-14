# Development Plan: Migrating ttruthdesk-platform to a Self-Building Event-Driven Architecture

This document outlines the precise, phased development plan to migrate the `ttruthdesk-platform` from a cron-heavy hybrid architecture to a fully event-driven, self-building system.

## The Strategic Objective

The platform currently possesses a sophisticated reactive core (`eventBus.ts` with Reactive Drain v2) and advanced orchestration (`manusOrchestrator.ts`). However, it relies on 15 legacy cron jobs (`/api/scheduled/*`) to trigger major actions, and it relies on human developers to fix adapters or build new capabilities when the Meta-Agent or Frontier Engine detects a gap.

This migration achieves two goals:
1. **Event-Driven Purity:** Replace polling and batch cron jobs with reactive event cascades.
2. **Self-Building Autonomy:** Connect the Meta-Agent's flaw detection and the Frontier Engine's gap detection directly to Manus to autonomously generate and deploy code fixes.

---

## Phase 1: Replacing Polling Jobs with Webhooks

The first phase eliminates the need to constantly poll external databases for new papers or source version changes.

### 1.1 Ingestion Webhook Bridge
Currently, `pubmedIngestJob` and `pmcFeedJob` poll NCBI APIs. 

**Implementation Steps:**
1. Set up an external RSS-to-Webhook service (e.g., Zapier, Make, or a lightweight Cloudflare Worker) to monitor the PubMed/PMC RSS feeds for the specific MeSH queries defined in `server/verticalFeedConfig.ts`.
2. Configure the webhook to POST to the existing `/api/webhook/hostinger` endpoint (or create a dedicated `/api/webhook/ingest` endpoint).
3. The endpoint handler must parse the payload and call `publishEvent("paper_discovered", { pmid: "...", source: "webhook" })`.
4. Remove `/api/scheduled/pubmed-ingest` and `/api/scheduled/pmc-feed` from `server/_core/index.ts`.

### 1.2 Source Version Webhook
Currently, `sourceVersionAgent` polls UniProt/PDB daily to check for schema or data changes.

**Implementation Steps:**
1. If the upstream sources support webhooks for major updates or retractions, subscribe to them.
2. If not, extract the `sourceVersionAgent` logic into a lightweight external serverless function that pushes a webhook payload to the platform *only* when a hash change is detected.
3. The receiving endpoint calls `publishEvent("source_version_changed", { source: "...", changeType: "major" })`.
4. Remove `/api/scheduled/source-version-agent`.

---

## Phase 2: Converting Batch Jobs to Event Cascades

The second phase converts heavy, full-graph weekly batch jobs into targeted, immediate, local-neighbourhood checks triggered by existing events.

### 2.1 Localised Contradiction Scanning
Currently, `contradictionDetector` runs weekly and scans the entire graph.

**Implementation Steps:**
1. Modify `server/autonomousLoop/layers/selfPromptLayer.ts`.
2. When handling a `verdict_complete` or `gap_closed` event, inject a call to a new function: `scanLocalContradictions(claimId)`.
3. `scanLocalContradictions` should traverse only the immediate `semantic_similar` edges of the specific `claimId` to detect opposing verdicts.
4. Remove `/api/scheduled/contradiction-scan`.

### 2.2 Reactive Wiki Linting
Currently, `wikiEngineLintJobHandler` runs weekly to detect stale pages and contradictions.

**Implementation Steps:**
1. Define a new `LoopEventType`: `wiki_page_updated`.
2. Update `server/wikiCompiler.ts` to call `publishEvent("wiki_page_updated", { slug: "..." })` whenever a page is compiled.
3. Create a reactive listener in the loop (likely in L0 or L2) that catches `wiki_page_updated` and runs the linting logic *only* on that specific page.
4. Remove `/api/scheduled/wiki-engine-lint`.

### 2.3 Reactive Quality Scoring
Currently, `quality-scorer` and `re-evaluate` run every 6 hours to find claims with changed citation edges.

**Implementation Steps:**
1. Whenever a new citation edge is written to `graph_claim_edges` (e.g., during `analysisPipeline`), immediately call `publishEvent("source_data_changed", { claimId: "..." })`.
2. The `eventBus` already maps `source_data_changed` to L1 (Truth). Ensure the L1 handler triggers the re-scoring logic for that specific claim.
3. Remove `/api/scheduled/quality-scorer` and `/api/scheduled/re-evaluate`.

---

## Phase 3: The Self-Building Orchestration Loop

This is the critical phase that closes the loop between the platform's awareness (Meta-Agent) and execution (Manus).

### 3.1 Define the `system_capability_required` Event
Add a new event type to `server/autonomousLoop/eventBus.ts`:
```typescript
export type LoopEventType = 
  // ... existing events
  | "system_capability_required";

export const EVENT_ENTRY_LAYERS: Record<LoopEventType, number> = {
  // ...
  system_capability_required: 4, // Handled by Meta-Agent layer
};
```

### 3.2 Meta-Agent Trigger
Modify `server/metaAgent/codeGuardian.ts` (or `pipelineGuardian.ts`).
When a critical invariant fails (e.g., an adapter is throwing 500s because a target API schema changed), publish the event:
```typescript
await publishEvent("system_capability_required", {
  type: "adapter_fix",
  target: "pubmed",
  errorLog: "Schema validation failed on field 'abstractText'",
});
```

### 3.3 Frontier Engine Trigger
Modify `server/frontier/frontierEngine.ts`.
When the gap mapper identifies a high-priority knowledge gap that requires a new vertical adapter, publish the event:
```typescript
await publishEvent("system_capability_required", {
  type: "new_vertical_adapter",
  target: "climate_science",
  context: "High density of unverified claims relating to atmospheric carbon",
});
```

### 3.4 Manus Orchestrator Expansion
Currently, `server/manusOrchestrator.ts` spawns data-processing agents. Expand it to spawn **Development Agents**.

**Implementation Steps:**
1. Create a listener for `system_capability_required` in the orchestration layer.
2. When triggered, use the `spawnVerticalTask` function (or a new `spawnDevTask` variant) to call the Manus API.
3. **The Prompt Construction:**
   ```typescript
   const prompt = `You are a Development Agent for the Truth Desk platform.
   The system has detected a critical failure: ${event.payload.errorLog}.
   Target component: ${event.payload.target}.
   
   Instructions:
   1. Clone the repository: https://github.com/Gudmundur76/ttruthdesk-platform
   2. Locate the failing adapter in server/verticalAdapters/.
   3. Fix the schema parsing logic to address the error.
   4. Run the test suite to ensure no regressions.
   5. Open a Pull Request with the fix.`;
   ```
4. The system is now capable of detecting its own flaws, writing the prompt to fix them, and dispatching Manus to execute the code changes.

---

## Summary of Retained Cron Jobs

After this migration, the only cron jobs remaining in `server/_core/index.ts` should be those that govern the slow, macro-level "breathing" of the system:

1. `/api/scheduled/frontier-engine` (Every 6 hours) - Macro gap detection.
2. `/api/scheduled/meta-agent` (Daily) - Daily health sweeps and drift detection.
3. `/api/scheduled/inverse-prompt` (Daily) - Creative question generation.
4. `/api/scheduled/autonomous-loop-tick` (Every 2 hours) - The ultimate safety net.

This achieves the strategic objective: a system that reacts instantly to new data, and autonomously builds its own code when it detects a capability gap.
