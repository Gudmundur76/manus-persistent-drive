/**
 * claimProvenanceService.ts — Phase 66 quality sprint (full implementation)
 *
 * Records and queries the step-by-step audit trail for each claim.
 * Uses the claim_provenance_steps table (schema: id, claimId, stepOrder,
 * stepType, actor, description, inputSnapshot, outputSnapshot, durationMs,
 * status, errorMsg, createdAt).
 */

import { eq, asc } from "drizzle-orm";
import { getDb } from "./db";
import { claimProvenanceSteps } from "../drizzle/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProvenanceStep =
  | "extraction"
  | "evidence_lookup"
  | "quality_scoring"
  | "verdict_override"
  | "agent_ingestion"
  | "similarity_check"
  | "confidence_update"
  | "manual_review";

export interface ProvenanceChainEntry {
  id: number;
  claimId: number;
  documentId: number | null;
  step: ProvenanceStep | string;
  actor: string;
  inputSnapshot: Record<string, unknown> | null;
  outputSnapshot: Record<string, unknown> | null;
  durationMs: number | null;
  success: boolean;
  errorMsg: string | null;
  createdAt: Date;
}

export interface RecordStepOptions {
  claimId: number;
  documentId?: number | null;
  step: ProvenanceStep | string;
  actor: string;
  inputSnapshot?: Record<string, unknown> | null;
  outputSnapshot?: Record<string, unknown> | null;
  durationMs?: number | null;
  success?: boolean;
  errorMsg?: string | null;
}

export interface ProvenanceSummary {
  claimId: number;
  totalSteps: number;
  successfulSteps: number;
  failedSteps: number;
  firstSeenAt: Date | null;
  lastModifiedAt: Date | null;
  stepsCompleted: string[];
  stepsMissing: string[];
  actors: string[];
  narrative: string;
}

const CANONICAL_STEPS: ProvenanceStep[] = [
  "extraction",
  "evidence_lookup",
  "quality_scoring",
  "verdict_override",
];

// ─── recordStep ───────────────────────────────────────────────────────────────

export async function recordStep(opts: RecordStepOptions): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const stepOrder = Date.now(); // monotonically increasing per claim

  const result = await db.insert(claimProvenanceSteps).values([{
    claimId: opts.claimId,
    stepOrder,
    stepType: opts.step,
    actor: opts.actor,
    description: opts.errorMsg ?? `${opts.step} by ${opts.actor}`,
    inputSnapshot: opts.inputSnapshot ?? null,
    outputSnapshot: opts.outputSnapshot ?? null,
    durationMs: opts.durationMs ?? null,
    status: (opts.success !== false) ? "success" : "failure",
    errorMsg: opts.errorMsg ?? null,
  }]);

  const header = Array.isArray(result) ? result[0] : result;
  return (header as { insertId?: number }).insertId ?? 0;
}

// ─── getChain ─────────────────────────────────────────────────────────────────

export async function getChain(claimId: number): Promise<ProvenanceChainEntry[]> {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select()
    .from(claimProvenanceSteps)
    .where(eq(claimProvenanceSteps.claimId, claimId))
    .orderBy(asc(claimProvenanceSteps.createdAt));

  return rows.map(normaliseRow);
}

// ─── getDocumentChain ─────────────────────────────────────────────────────────

export async function getDocumentChain(documentId: number): Promise<ProvenanceChainEntry[]> {
  // claim_provenance_steps has no documentId column; return empty
  void documentId;
  return [];
}

// ─── summarize ────────────────────────────────────────────────────────────────

export function summarize(chain: ProvenanceChainEntry[]): ProvenanceSummary {
  if (chain.length === 0) {
    return {
      claimId: 0,
      totalSteps: 0,
      successfulSteps: 0,
      failedSteps: 0,
      firstSeenAt: null,
      lastModifiedAt: null,
      stepsCompleted: [],
      stepsMissing: Array.from(CANONICAL_STEPS),
      actors: [],
      narrative: "No provenance data recorded for this claim.",
    };
  }

  const claimId = chain[0].claimId;
  const successfulRows = chain.filter((e) => e.success);
  const failedRows = chain.filter((e) => !e.success);

  const stepsCompleted = Array.from(new Set(successfulRows.map((e) => e.step)));
  const stepsMissing = CANONICAL_STEPS.filter((s) => !stepsCompleted.includes(s));
  const actors = Array.from(new Set(chain.map((e) => e.actor)));

  const sortedByTime = [...chain].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const firstSeenAt = sortedByTime[0].createdAt;
  const lastModifiedAt = sortedByTime[sortedByTime.length - 1].createdAt;

  const narrative = buildNarrative(chain, failedRows.length);

  return {
    claimId,
    totalSteps: chain.length,
    successfulSteps: successfulRows.length,
    failedSteps: failedRows.length,
    firstSeenAt,
    lastModifiedAt,
    stepsCompleted,
    stepsMissing,
    actors,
    narrative,
  };
}

// ─── summarizeChain ───────────────────────────────────────────────────────────

export async function summarizeChain(claimId: number): Promise<ProvenanceSummary | null> {
  const chain = await getChain(claimId);
  if (chain.length === 0) return null;
  return summarize(chain);
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function normaliseRow(row: Record<string, unknown>): ProvenanceChainEntry {
  const status = row.status as string;
  const snap = row.outputSnapshot;
  return {
    id: row.id as number,
    claimId: row.claimId as number,
    documentId: null,
    step: (row.stepType ?? row.step) as string,
    actor: row.actor as string,
    inputSnapshot: snap && typeof snap === "object" ? (snap as Record<string, unknown>) : null,
    outputSnapshot: snap && typeof snap === "object" ? (snap as Record<string, unknown>) : null,
    durationMs: (row.durationMs as number | null) ?? null,
    success: status === "success" || status === undefined || row.success === true || row.success === 1,
    errorMsg: (row.errorMsg as string | null) ?? null,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt as string),
  };
}

function buildNarrative(chain: ProvenanceChainEntry[], failedCount: number): string {
  const parts: string[] = [];

  for (const event of chain) {
    const snap = event.outputSnapshot ?? {};

    if (event.step === "extraction" && event.success) {
      const claimType = (snap.claimType as string | undefined) ?? "";
      if (claimType) {
        parts.push(`Claim was extracted as type "${claimType}" by ${event.actor}.`);
      } else {
        parts.push("Claim was extracted from the source document.");
      }
    }

    if (event.step === "evidence_lookup" && event.success) {
      const verdict = (snap.verdict as string | undefined) ?? "";
      const source =
        (snap.evidenceSource as string | undefined) ??
        (snap.source as string | undefined) ??
        "";
      if (verdict && source) {
        parts.push(`Evidence lookup returned verdict "${verdict}" from ${source}.`);
      } else if (verdict) {
        parts.push(`Evidence lookup returned verdict "${verdict}".`);
      }
    }

    if (event.step === "quality_scoring" && event.success) {
      const score = snap.confidenceScore as number | undefined;
      if (score !== undefined) {
        parts.push(`Quality scoring assigned a confidence of ${Math.round(score * 100)}%.`);
      }
    }

    if (event.step === "verdict_override" && event.success) {
      const newVerdict =
        (snap.overriddenVerdict as string | undefined) ??
        (snap.newVerdict as string | undefined) ??
        "";
      if (newVerdict) {
        parts.push(`Verdict was overridden by ${event.actor} to "${newVerdict}".`);
      } else {
        parts.push(`Verdict was manually overridden by ${event.actor}.`);
      }
    }

    if (event.step === "agent_ingestion" && event.success) {
      parts.push(`Claim was ingested by agent "${event.actor}".`);
    }

    if (event.step === "similarity_check" && event.success) {
      const dups = (snap.duplicatesFound as number | undefined) ?? 0;
      if (dups > 0) {
        parts.push(`Similarity check found ${dups} duplicate claim(s).`);
      }
    }
  }

  if (failedCount > 0) {
    parts.push(`${failedCount} step(s) failed during processing.`);
  }

  return parts.length === 0
    ? "Claim was processed through the standard pipeline."
    : parts.join(" ");
}
