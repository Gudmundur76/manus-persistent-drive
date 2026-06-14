/**
 * graphMemory.ts
 * Phase 20 — Ruvector-style Knowledge Graph memory layer.
 * Stores entities, concepts, decisions, and events as nodes,
 * and their relationships as weighted directed edges.
 * Provides addNode, addEdge, findRelated, searchNodes, getSubgraph.
 */

import { eq, like, or, and, inArray } from "drizzle-orm";
import { getDb } from "./db";
import { kgNodes, kgEdges, type InsertKgNode, type InsertKgEdge, type KgNode, type KgEdge } from "../drizzle/schema";

// ─── Node operations ──────────────────────────────────────────────────────────

export async function addNode(data: Omit<InsertKgNode, "id" | "createdAt">): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(kgNodes).values(data);
  return (result as { insertId: number }).insertId;
}

export async function getNode(id: number): Promise<KgNode | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(kgNodes).where(eq(kgNodes.id, id));
  return rows[0] ?? null;
}

export async function listNodes(): Promise<KgNode[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(kgNodes);
}

export async function deleteNode(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  // Remove all edges involving this node first
  await db.delete(kgEdges).where(eq(kgEdges.fromId, id));
  await db.delete(kgEdges).where(eq(kgEdges.toId, id));
  await db.delete(kgNodes).where(eq(kgNodes.id, id));
}

// ─── Edge operations ──────────────────────────────────────────────────────────

export async function addEdge(data: Omit<InsertKgEdge, "id" | "createdAt">): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(kgEdges).values(data);
  return (result as { insertId: number }).insertId;
}

export async function listEdges(): Promise<KgEdge[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(kgEdges);
}

// ─── Graph traversal ──────────────────────────────────────────────────────────

/**
 * Find all nodes related to a given node up to a specified depth.
 * Returns an array of { node, relation, direction, depth } objects.
 */
export async function findRelated(
  nodeId: number,
  maxDepth = 2
): Promise<Array<{ node: KgNode; relation: string; direction: "out" | "in"; depth: number }>> {
  const db = await getDb();
  if (!db) return [];
  const visited = new Set<number>([nodeId]);
  const results: Array<{ node: KgNode; relation: string; direction: "out" | "in"; depth: number }> = [];

  let frontier = [nodeId];
  for (let depth = 1; depth <= maxDepth && frontier.length > 0; depth++) {
    // Outgoing edges
    const outEdges = await db.select().from(kgEdges).where(inArray(kgEdges.fromId, frontier));
    const inEdges = await db.select().from(kgEdges).where(inArray(kgEdges.toId, frontier));

    const nextFrontier: number[] = [];
    for (const edge of outEdges) {
      if (!visited.has(edge.toId)) {
        visited.add(edge.toId);
        nextFrontier.push(edge.toId);
        const node = await getNode(edge.toId);
        if (node) results.push({ node, relation: edge.relation, direction: "out", depth });
      }
    }
    for (const edge of inEdges) {
      if (!visited.has(edge.fromId)) {
        visited.add(edge.fromId);
        nextFrontier.push(edge.fromId);
        const node = await getNode(edge.fromId);
        if (node) results.push({ node, relation: edge.relation, direction: "in", depth });
      }
    }
    frontier = nextFrontier;
  }

  return results;
}

/**
 * Search nodes by label (substring match).
 */
export async function searchNodes(query: string): Promise<KgNode[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(kgNodes)
    .where(like(kgNodes.label, `%${query}%`));
}

/**
 * Get the full subgraph: all nodes and edges.
 * For large graphs, consider pagination — this is fine for personal KGs.
 */
export async function getSubgraph(): Promise<{ nodes: KgNode[]; edges: KgEdge[] }> {
  const db = await getDb();
  if (!db) return { nodes: [], edges: [] };
  const [nodes, edges] = await Promise.all([
    db.select().from(kgNodes),
    db.select().from(kgEdges),
  ]);
  return { nodes, edges };
}
