/**
 * server/seoRouter.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin tRPC procedures for IndexNow SEO ping control.
 *
 * Procedures:
 *   seo.status        — returns indexNowKey config status + recent ping log
 *   seo.pingAll       — pings all published claim/report/wiki URLs in batches
 *   seo.pingDocument  — pings all claim URLs for a specific document
 */
import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { seoPingLog, claims, auditReports } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import {
  notifyIndexNow,
  notifyIndexNowBatch,
  claimUrl,
  reportUrl,
  wikiUrl,
} from "./seo/indexNow";

// ─── Admin guard ──────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
  }
  return next({ ctx });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function writePingLog(
  urls: string[],
  status: "ok" | "error" | "skipped",
  error?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(seoPingLog).values({
    urls: urls as unknown as Record<string, unknown>,
    batchSize: urls.length,
    status,
    error: error ?? null,
  });
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const seoRouter = router({
  /** Returns IndexNow configuration status and the 20 most recent ping log entries */
  status: adminProcedure.query(async () => {
    const db = await getDb();

    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    const configured = Boolean(process.env.INDEX_NOW_KEY);
    const recentPings = await db
      .select()
      .from(seoPingLog)
      .orderBy(desc(seoPingLog.createdAt))
      .limit(20);

    return {
      configured,
      keyPrefix: configured ? (process.env.INDEX_NOW_KEY ?? "").slice(0, 8) + "…" : null,
      recentPings,
    };
  }),

  /** Pings all published claim URLs + report URLs in batches of 100 */
  pingAll: adminProcedure.mutation(async () => {
    if (!process.env.INDEX_NOW_KEY) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "INDEX_NOW_KEY is not configured",
      });
    }

    const db = await getDb();


    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    // Collect all claim IDs
    const allClaims = await db
      .select({ id: claims.id })
      .from(claims);
    const claimUrls = allClaims.map((c) => claimUrl(c.id));

    // Collect all report document IDs
    const allReports = await db
      .select({ documentId: auditReports.documentId })
      .from(auditReports);
    const reportUrls = allReports.map((r) => reportUrl(r.documentId));

    const allUrls = [...claimUrls, ...reportUrls];

    if (allUrls.length === 0) {
      await writePingLog([], "skipped", "No URLs to ping");
      return { pinged: 0, status: "skipped" };
    }

    try {
      await notifyIndexNowBatch(allUrls);
      await writePingLog(allUrls, "ok");
      return { pinged: allUrls.length, status: "ok" };
    } catch (err) {
      const msg = String(err);
      await writePingLog(allUrls, "error", msg);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg });
    }
  }),

  /** Pings all claim URLs for a specific document */
  pingDocument: adminProcedure
    .input(z.object({ documentId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      if (!process.env.INDEX_NOW_KEY) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "INDEX_NOW_KEY is not configured",
        });
      }

      const db = await getDb();


      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const docClaims = await db
        .select({ id: claims.id })
        .from(claims)
        .where(eq(claims.documentId, input.documentId));

      const urls = [
        reportUrl(input.documentId),
        ...docClaims.map((c) => claimUrl(c.id)),
      ];

      try {
        await notifyIndexNowBatch(urls);
        await writePingLog(urls, "ok");
        return { pinged: urls.length, status: "ok" };
      } catch (err) {
        const msg = String(err);
        await writePingLog(urls, "error", msg);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg });
      }
    }),

  /** Pings a wiki entity URL directly */
  pingWiki: adminProcedure
    .input(
      z.object({
        entityType: z.string().min(1),
        entitySlug: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      if (!process.env.INDEX_NOW_KEY) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "INDEX_NOW_KEY is not configured",
        });
      }
      const url = wikiUrl(input.entityType, input.entitySlug);
      try {
        await notifyIndexNow(url);
        await writePingLog([url], "ok");
        return { pinged: 1, url, status: "ok" };
      } catch (err) {
        const msg = String(err);
        await writePingLog([url], "error", msg);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg });
      }
    }),
});
