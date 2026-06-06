/**
 * server/swarmRouter.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin tRPC procedures for swarm tick control and log viewing.
 *
 * Procedures:
 *   swarm.status      — returns swarm configuration + recent tick log
 *   swarm.runTick     — triggers a manual swarm tick immediately
 *   swarm.listLogs    — returns paginated swarm tick log entries
 */
import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { swarmTickLog } from "../drizzle/schema";
import { desc } from "drizzle-orm";
import { runSwarmTick, type SwarmTickResult } from "./swarmTickJob";

// ─── Admin guard ──────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
  }
  return next({ ctx });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function writeTickLog(result: SwarmTickResult): Promise<void> {
  const db = await getDb();

  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  await db.insert(swarmTickLog).values({
    startedAt: new Date(result.startedAt),
    completedAt: new Date(result.completedAt),
    durationMs: result.durationMs,
    agentResults: result.agents as unknown as Record<string, unknown>,
    summary: result.summary as unknown as Record<string, unknown>,
  });
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const swarmRouter = router({
  /** Returns swarm configuration and the 10 most recent tick log entries */
  status: adminProcedure.query(async () => {
    const db = await getDb();

    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    const recentTicks = await db
      .select()
      .from(swarmTickLog)
      .orderBy(desc(swarmTickLog.createdAt))
      .limit(10);

    return {
      agentCount: 5,
      agents: [
        "pmc_harvester",
        "wiki_compiler",
        "quality_auditor",
        "backfill_predictor",
        "monitoring_scanner",
      ],
      recentTicks,
    };
  }),

  /** Triggers a manual swarm tick immediately and writes to log */
  runTick: adminProcedure.mutation(async () => {
    try {
      const result = await runSwarmTick();
      await writeTickLog(result);
      return {
        ok: true,
        durationMs: result.durationMs,
        summary: result.summary,
        agents: result.agents,
      };
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Swarm tick failed: ${String(err)}`,
      });
    }
  }),

  /** Returns paginated swarm tick log entries */
  listLogs: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();

      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const rows = await db
        .select()
        .from(swarmTickLog)
        .orderBy(desc(swarmTickLog.createdAt))
        .limit(input.limit);
      return rows;
    }),
});
