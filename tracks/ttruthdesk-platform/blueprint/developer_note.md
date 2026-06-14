# Developer Note: Four Critical Failures and How to Fix Them

*Prepared June 2026 — Based on direct codebase inspection of `ttruthdesk-platform`*

This note is written directly to the developer. It is not a strategic document. It is a precise, code-level account of four structural failures found in the codebase, with exact file locations, the nature of each failure, and a concrete fix for each one. These are not opinions — they are findings from reading the code.

---

## Failure 1: Your Rate Limiter Will Not Survive Production

### Where It Is

**File 1:** `server/answerRoute.ts`, lines 44–80
**File 2:** `server/apiV2Router.ts`, lines 61–80
**File 3:** `server/apiKeyService.ts`, lines 119–144

### What the Code Does

All three files implement rate limiting using an in-memory `Map`:

```typescript
// answerRoute.ts — line 47
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// apiV2Router.ts — line 61
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// apiKeyService.ts — line 119
const _rateLimitMap = new Map<string, number[]>();
```

### Why This Fails

An in-memory `Map` is process-local. This means:

1. **Every deployment wipes all limits.** If you deploy a fix at 2am, every IP that was rate-limited gets a clean slate.
2. **Horizontal scaling is impossible.** The moment you run two instances of the server — for load balancing, zero-downtime deploys, or any redundancy — each instance has its own map. A user can bypass your rate limit entirely by simply routing requests to the second instance.
3. **A process crash resets all limits.** If the server crashes and restarts, all rate limit state is gone.

The limits themselves are also inconsistent across the three files:
- `answerRoute.ts`: 10 requests per hour per IP
- `apiV2Router.ts`: 60 requests per minute per IP
- `apiKeyService.ts`: 20 validation attempts per minute per IP

There is no unified rate limit policy. Different endpoints enforce different limits with no coordination.

### The Fix

You do not need Redis for this. You already have a MySQL database. The cleanest fix that requires no new infrastructure is a **database-backed rate limit table**.

**Step 1 — Add a migration.** Add the following table to your Drizzle schema:

```typescript
// drizzle/schema.ts — add this table
export const rateLimitBuckets = mysqlTable(
  "rate_limit_buckets",
  {
    key: varchar("key", { length: 256 }).primaryKey(), // e.g. "ip:1.2.3.4:answer"
    count: int("count").notNull().default(0),
    windowStart: bigint("window_start", { mode: "number" }).notNull(),
    windowMs: int("window_ms").notNull(),
    maxRequests: int("max_requests").notNull(),
  },
  t => ({
    windowIdx: index("rl_window_idx").on(t.windowStart),
  })
);
```

**Step 2 — Create a shared rate limit utility.** Replace all three in-memory implementations with a single shared function in `server/_core/rateLimit.ts`:

```typescript
// server/_core/rateLimit.ts
import { getDb } from "../db";
import { rateLimitBuckets } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const db = await getDb();
  if (!db) return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowMs };

  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const resetAt = windowStart + windowMs;
  const bucketKey = `${key}:${windowStart}`;

  const [existing] = await db
    .select()
    .from(rateLimitBuckets)
    .where(eq(rateLimitBuckets.key, bucketKey))
    .limit(1);

  if (!existing) {
    await db.insert(rateLimitBuckets).values({
      key: bucketKey,
      count: 1,
      windowStart,
      windowMs,
      maxRequests,
    }).onDuplicateKeyUpdate({ set: { count: sql`count + 1` } });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (existing.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt };
  }

  await db
    .update(rateLimitBuckets)
    .set({ count: sql`count + 1` })
    .where(eq(rateLimitBuckets.key, bucketKey));

  return { allowed: true, remaining: maxRequests - existing.count - 1, resetAt };
}
```

**Step 3 — Replace all three in-memory maps.** Delete the `rateLimitMap` declarations and the `checkAnonRateLimit` / `checkRateLimit` functions in all three files. Call `checkRateLimit(ip, max, windowMs)` from `_core/rateLimit.ts` instead.

**Step 4 — Add a cleanup job.** Add a scheduled endpoint that runs daily to prune expired buckets:

```typescript
// In your scheduled endpoints section
app.post("/api/scheduled/prune-rate-limits", requireCronOrAdmin, async (_req, res) => {
  const db = await getDb();
  const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
  await db.delete(rateLimitBuckets).where(lt(rateLimitBuckets.windowStart, cutoff));
  res.json({ ok: true });
});
```

---

## Failure 2: Verdict Flips Are Silent

### Where It Is

**File:** `server/reEvaluationEngine.ts`, lines 195–245
**File:** `server/webhookDeliveryService.ts` (built but not wired)
**Schema:** `drizzle/schema.ts`, lines 540–558 (`webhookAlerts` table — fully built)

### What the Code Does

The `reEvaluationEngine` correctly tracks when a claim's verdict changes. It returns a result object with `previousLabel` and `newLabel`:

```typescript
// reEvaluationEngine.ts — lines 241–243
return {
  claimId: claim.claimId,
  documentId: claim.documentId,
  status: "updated",
  previousLabel: claim.compositeTruthLabel,  // e.g. "verified_faithful"
  newLabel: result.label,                     // e.g. "contradicted"
  previousScore: claim.compositeTruthScore,
  newScore: result.score,
};
```

The `webhookDeliveryService` is fully built with a `deliverWebhook(webhookId, url, secret, eventType, payload)` function. The `webhookAlerts` table has `url`, `secret`, `eventTypes`, and `active` columns — everything needed.

**The gap:** The caller of `runReEvaluationLoop` in `server/_core/index.ts` (lines 1594–1609) receives the result, logs a summary string, and returns it to the HTTP response. It never inspects the individual claim results for verdict flips, and it never calls `deliverWebhook`.

### Why This Fails

When a claim flips from `verified_faithful` to `contradicted`, the following happens:
1. The database is updated correctly.
2. `claimScoreHistory` gets a new row.
3. The HTTP response returns a summary count.
4. **Nothing else happens.** No webhook fires. No downstream consumer is notified.

Any MCP client, RAG pipeline, or enterprise integration that cached the previous verdict will continue serving stale, potentially false information indefinitely.

### The Fix

**Step 1 — Add a `verdict_changed` event type to the eventBus.** In `server/autonomousLoop/eventBus.ts`, add:

```typescript
// eventBus.ts — add to the EventType union
| "verdict_changed"
```

**Step 2 — Wire the verdict flip in `reEvaluationEngine.ts`.** After the `updateClaimVerdict` call (around line 206), add the following block:

```typescript
// reEvaluationEngine.ts — add after updateClaimVerdict call
// Fire webhook and event if the verdict label has changed
if (
  result.label !== claim.compositeTruthLabel &&
  result.label !== null &&
  claim.compositeTruthLabel !== null
) {
  // Publish to internal event bus for downstream processing
  await publishEvent("verdict_changed", {
    claimId: claim.claimId,
    documentId: claim.documentId,
    previousLabel: claim.compositeTruthLabel,
    newLabel: result.label,
    previousScore: claim.compositeTruthScore,
    newScore: result.score,
    changedAt: new Date().toISOString(),
  }).catch(() => {});

  // Fire registered webhooks for this event type
  const db = await getDb();
  if (db) {
    const hooks = await db
      .select()
      .from(webhookAlerts)
      .where(
        and(
          eq(webhookAlerts.active, true),
          // Check if "verdict_changed" is in the registered eventTypes JSON array
          sql`JSON_CONTAINS(${webhookAlerts.eventTypes}, '"verdict_changed"')`
        )
      );

    for (const hook of hooks) {
      await deliverWebhook(
        hook.id,
        hook.url,
        hook.secret,
        "verdict_changed",
        {
          claimId: claim.claimId,
          previousLabel: claim.compositeTruthLabel,
          newLabel: result.label,
          previousScore: claim.compositeTruthScore,
          newScore: result.score,
        }
      ).catch(() => {}); // Non-fatal — webhook failure must not block re-evaluation
    }
  }
}
```

**Step 3 — Add the required imports to `reEvaluationEngine.ts`:**

```typescript
import { deliverWebhook } from "./webhookDeliveryService";
import { webhookAlerts } from "../drizzle/schema";
import { and, sql } from "drizzle-orm";
import { publishEvent } from "./autonomousLoop/eventBus";
```

**Step 4 — Update the `webhookAlerts` registration UI** to expose `verdict_changed` as a selectable event type alongside the existing `contradiction_alert` type.

---

## Failure 3: The Embedding Layer Does Not Exist

### Where It Is

**Schema:** `drizzle/schema.ts` — no vector or embedding columns anywhere
**Planned feature:** `server/embedRoutes.ts` (embed widget, not vector embeddings)
**Development plan:** Phase 124 — `find_similar` MCP tool and API route

### What the Code Does

The development plan proposes to expose a `find_similar` MCP tool and a `GET /api/public/similar/:claimId` route. These features require vector embeddings for each claim.

**The gap:** I ran a full grep across the schema for `vector`, `embed`, `pgvector`, and `halfvec`. There are zero results. There is no embedding column on the `claims` table, no separate embeddings table, and no `pgvector` extension referenced anywhere in the codebase.

### Why This Fails

Without embeddings:
1. `find_similar` cannot work at all — there is nothing to compare.
2. The wiki compiler's planned clustering (Phase 125) has no signal to cluster on.
3. The 3,900+ existing claims will need a backfill job before any similarity feature is usable.

### The Fix

**Step 1 — Enable pgvector on your MySQL/TiDB instance.** If you are on TiDB Cloud, vector search is available. If you are on standard MySQL, you will need to either switch to PostgreSQL with pgvector or use a separate vector store (e.g., Qdrant, Pinecone, or Weaviate).

Given your existing MySQL stack, the cleanest approach is a **separate `claim_embeddings` table** that can be populated asynchronously without blocking the main pipeline:

```typescript
// drizzle/schema.ts — add this table
export const claimEmbeddings = mysqlTable(
  "claim_embeddings",
  {
    claimId: int("claimId").primaryKey(),
    model: varchar("model", { length: 64 }).notNull().default("text-embedding-3-small"),
    // Store as JSON array of floats — 1536 dimensions for text-embedding-3-small
    // For production, use a proper vector store; this is the migration-safe interim approach
    embedding: json("embedding").notNull(),
    generatedAt: timestamp("generatedAt").defaultNow().notNull(),
    tokenCount: int("tokenCount"),
  },
  t => ({
    claimIdx: index("ce_claim_idx").on(t.claimId),
    generatedIdx: index("ce_generated_idx").on(t.generatedAt),
  })
);
```

**Step 2 — Create an embedding generator utility** at `server/embeddingService.ts`:

```typescript
// server/embeddingService.ts
import { invokeMultiLLM } from "./_core/multiLLM";
import { getDb } from "./db";
import { claimEmbeddings, claims } from "../drizzle/schema";
import { isNull, lt } from "drizzle-orm";

export async function generateEmbeddingForClaim(
  claimId: number,
  claimText: string
): Promise<number[]> {
  // Use your existing multiLLM abstraction with an embedding model
  const response = await invokeMultiLLM({
    model: "text-embedding-3-small",
    input: claimText,
    type: "embedding",
  });
  return response.embedding;
}

export async function backfillMissingEmbeddings(batchSize = 100): Promise<{
  processed: number;
  errors: number;
}> {
  const db = await getDb();
  if (!db) return { processed: 0, errors: 0 };

  // Find claims that have no embedding yet
  const unembedded = await db
    .select({ id: claims.id, claimText: claims.claimText })
    .from(claims)
    .leftJoin(claimEmbeddings, eq(claims.id, claimEmbeddings.claimId))
    .where(isNull(claimEmbeddings.claimId))
    .limit(batchSize);

  let processed = 0;
  let errors = 0;

  for (const claim of unembedded) {
    try {
      const embedding = await generateEmbeddingForClaim(claim.id, claim.claimText);
      await db.insert(claimEmbeddings).values({
        claimId: claim.id,
        embedding,
        tokenCount: Math.ceil(claim.claimText.length / 4),
      }).onDuplicateKeyUpdate({ set: { embedding, generatedAt: new Date() } });
      processed++;
    } catch {
      errors++;
    }
  }

  return { processed, errors };
}
```

**Step 3 — Add a scheduled backfill endpoint:**

```typescript
// In your scheduled endpoints section
app.post("/api/scheduled/backfill-embeddings", requireCronOrAdmin, async (req, res) => {
  const { backfillMissingEmbeddings } = await import("../embeddingService");
  const batchSize = Math.min(parseInt(String(req.body?.batchSize ?? "100"), 10) || 100, 500);
  const result = await backfillMissingEmbeddings(batchSize);
  res.json({ ok: true, ...result });
});
```

**Step 4 — Wire embedding generation into the ingestion pipeline.** After a claim is written to the database in your ingestion flow, call `generateEmbeddingForClaim` asynchronously (non-blocking):

```typescript
// In your claim ingestion code — fire and forget
generateEmbeddingForClaim(newClaimId, claimText).then(embedding => {
  return db.insert(claimEmbeddings).values({ claimId: newClaimId, embedding });
}).catch(() => {}); // Non-fatal
```

**Step 5 — Do not expose `find_similar` publicly until the backfill reports 95%+ coverage.** Add a coverage check to the Phase 124 acceptance criteria.

---

## Failure 4: The Dream Engine Has No Safety Gate

### Where It Is

**File:** `server/dream/dreamEngine.ts`, lines 260–310
**File:** `server/autonomousLoop/loopOrchestrator.ts`, lines 171–192

### What the Code Does

The Dream Engine generates hypotheses and publishes a `dream_session_complete` event. The `loopOrchestrator` catches this event and publishes `gap_closed` events for up to 5 hypotheses, which then cascade into the standard ingestion pipeline.

```typescript
// loopOrchestrator.ts — lines 171–192
if (event.eventType === "dream_session_complete") {
  const hypotheses = (event.payload.hypotheses as Array<{ entityId?: number; gapId?: number }>) ?? [];
  for (const h of hypotheses.slice(0, 5)) {
    if (h.gapId) {
      await publishEvent("gap_closed", {
        gapId: h.gapId,
        triggeredBy: event.id,
        source: "dream_session",
      });
    }
  }
}
```

### Why This Fails

There is no confidence gate between the Dream Engine's output and the public registry. A hypothesis generated by the Dream Engine — which is an LLM-generated speculation, not a verified claim — enters the same ingestion pipeline that processes peer-reviewed papers. The only difference is the `source: "dream_session"` tag in the event payload, which is not checked anywhere downstream.

If the Dream Engine hallucinates a plausible-sounding but false hypothesis, it will be:
1. Ingested as a new paper/claim
2. Run through the verification pipeline
3. Potentially assigned a "Supported" verdict if the LLM-based verifier is not calibrated for dream-originated content
4. Published to the public registry with a stable claim ID

### The Fix

**Step 1 — Add a `dream_staged` status to the claims table.** Claims originating from dream sessions should enter a staging state, not the live pipeline:

```typescript
// drizzle/schema.ts — update the claims table status enum
status: mysqlEnum("status", [
  "pending",
  "processing",
  "published",
  "superseded",
  "dream_staged",  // ADD THIS — dream-originated claims awaiting human review
  "dream_rejected"
]).notNull().default("pending"),
```

**Step 2 — Modify `loopOrchestrator.ts` to route dream hypotheses to staging:**

```typescript
// loopOrchestrator.ts — replace the dream_session_complete handler
if (event.eventType === "dream_session_complete") {
  const hypotheses = (event.payload.hypotheses as Array<{ entityId?: number; gapId?: number; confidenceScore?: number }>) ?? [];

  for (const h of hypotheses.slice(0, 5)) {
    if (h.gapId) {
      // Route to staging, not directly to gap_closed
      // Only promote to gap_closed if confidence is above threshold
      const confidence = h.confidenceScore ?? 0;
      if (confidence >= 0.75) {
        // High-confidence hypothesis: promote to standard pipeline but flag origin
        await publishEvent("gap_closed", {
          gapId: h.gapId,
          triggeredBy: event.id,
          source: "dream_session",
          requiresHumanReview: true, // Flag for admin review queue
        });
      } else {
        // Low-confidence: write to staging table only, do not publish
        await db.insert(dreamStagingQueue).values({
          gapId: h.gapId,
          sessionId: event.payload.sessionId,
          confidenceScore: confidence,
          hypothesis: JSON.stringify(h),
          status: "pending_review",
          createdAt: new Date(),
        });
      }
    }
  }
}
```

**Step 3 — Add a `dream_staging_queue` table** to hold hypotheses awaiting review:

```typescript
// drizzle/schema.ts
export const dreamStagingQueue = mysqlTable(
  "dream_staging_queue",
  {
    id: int("id").autoincrement().primaryKey(),
    gapId: int("gapId"),
    sessionId: int("sessionId").notNull(),
    confidenceScore: float("confidenceScore"),
    hypothesis: json("hypothesis").notNull(),
    status: mysqlEnum("status", ["pending_review", "approved", "rejected"]).notNull().default("pending_review"),
    reviewedBy: int("reviewedBy"),
    reviewedAt: timestamp("reviewedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  }
);
```

**Step 4 — Add an admin review endpoint:**

```typescript
// In your admin routes
app.get("/api/admin/dream-staging", requireAdmin, async (req, res) => {
  const db = await getDb();
  const pending = await db
    .select()
    .from(dreamStagingQueue)
    .where(eq(dreamStagingQueue.status, "pending_review"))
    .orderBy(desc(dreamStagingQueue.confidenceScore))
    .limit(50);
  res.json({ ok: true, items: pending });
});

app.post("/api/admin/dream-staging/:id/approve", requireAdmin, async (req, res) => {
  // Promote the hypothesis to the standard pipeline
  const { id } = req.params;
  const db = await getDb();
  const [item] = await db.select().from(dreamStagingQueue).where(eq(dreamStagingQueue.id, Number(id))).limit(1);
  if (!item) return res.status(404).json({ ok: false });

  await publishEvent("gap_closed", {
    gapId: item.gapId,
    triggeredBy: item.sessionId,
    source: "dream_session_approved",
  });

  await db.update(dreamStagingQueue)
    .set({ status: "approved", reviewedAt: new Date() })
    .where(eq(dreamStagingQueue.id, Number(id)));

  res.json({ ok: true });
});
```

---

## Summary: The Order of Operations

These four fixes are not equal in urgency. The following sequence is recommended:

| Priority | Fix | Why First |
|---|---|---|
| **1 — Do this week** | Rate limiter → database-backed | The system is currently exploitable. Every deployment resets limits. |
| **2 — Do this week** | Verdict flip → wire `deliverWebhook` | The truth engine is lying to downstream consumers by omission. |
| **3 — Do next week** | Dream Engine → add staging gate | The autonomous loop will corrupt the registry the moment it runs at scale. |
| **4 — Do before Phase 124** | Embeddings → add schema and backfill | No embedding feature should be exposed publicly until coverage is confirmed. |

None of these fixes require architectural changes. They are all additive: new table, new function call, new import. The codebase is well-structured enough that each fix is isolated and testable. The test suite at 1,464 tests with zero failures means you have the infrastructure to verify each fix without regression risk.

The system is close to production-ready. These four fixes are the gap between "impressive demo" and "enterprise infrastructure."
