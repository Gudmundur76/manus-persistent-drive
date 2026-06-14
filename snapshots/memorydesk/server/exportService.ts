/**
 * exportService.ts
 * Phase 24 — Export / Backup System.
 * Exports all MemoryDesk data to a portable JSON snapshot.
 * Supports full restore via importService.ts.
 */

import { getDb } from "./db";
import {
  memoryRecords,
  agents,
  repositories,
  workflows,
  workflowSteps,
  contextPacks,
  contextPackItems,
  kgNodes,
  kgEdges,
  agentTasks,
  briefingRuns,
  deskConnections,
  workflowTriggers,
} from "../drizzle/schema";

export interface MemoryDeskExport {
  version: "1.0";
  exportedAt: string;
  data: {
    memoryRecords: unknown[];
    agents: unknown[];
    repositories: unknown[];
    workflows: unknown[];
    workflowSteps: unknown[];
    contextPacks: unknown[];
    contextPackItems: unknown[];
    kgNodes: unknown[];
    kgEdges: unknown[];
    agentTasks: unknown[];
    briefingRuns: unknown[];
    deskConnections: unknown[];
    workflowTriggers: unknown[];
  };
  stats: {
    totalRecords: number;
    totalAgents: number;
    totalRepos: number;
    totalNodes: number;
    totalEdges: number;
    totalTasks: number;
  };
}

export async function exportAll(): Promise<MemoryDeskExport> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [
    memRecords,
    agentRows,
    repoRows,
    workflowRows,
    stepRows,
    packRows,
    packItemRows,
    nodeRows,
    edgeRows,
    taskRows,
    briefingRows,
    deskRows,
    triggerRows,
  ] = await Promise.all([
    db.select().from(memoryRecords),
    db.select().from(agents),
    db.select().from(repositories),
    db.select().from(workflows),
    db.select().from(workflowSteps),
    db.select().from(contextPacks),
    db.select().from(contextPackItems),
    db.select().from(kgNodes),
    db.select().from(kgEdges),
    db.select().from(agentTasks),
    db.select().from(briefingRuns),
    db.select().from(deskConnections),
    db.select().from(workflowTriggers),
  ]);

  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    data: {
      memoryRecords: memRecords,
      agents: agentRows,
      repositories: repoRows,
      workflows: workflowRows,
      workflowSteps: stepRows,
      contextPacks: packRows,
      contextPackItems: packItemRows,
      kgNodes: nodeRows,
      kgEdges: edgeRows,
      agentTasks: taskRows,
      briefingRuns: briefingRows,
      deskConnections: deskRows,
      workflowTriggers: triggerRows,
    },
    stats: {
      totalRecords: memRecords.length,
      totalAgents: agentRows.length,
      totalRepos: repoRows.length,
      totalNodes: nodeRows.length,
      totalEdges: edgeRows.length,
      totalTasks: taskRows.length,
    },
  };
}
