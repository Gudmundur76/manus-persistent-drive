import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, agents, chatMessages, contextPackItems, contextPacks, memoryRecords, repositories, users, workflowSteps, workflows } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── Memory Records ───────────────────────────────────────────────────────────

export async function listMemoryRecords(opts?: { search?: string; tag?: string; type?: string }) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(memoryRecords);
  const conditions = [];
  if (opts?.search) {
    conditions.push(or(like(memoryRecords.title, `%${opts.search}%`), like(memoryRecords.content, `%${opts.search}%`)));
  }
  if (opts?.type) {
    conditions.push(eq(memoryRecords.type, opts.type as any));
  }
  if (opts?.tag) {
    conditions.push(sql`JSON_CONTAINS(${memoryRecords.tags}, ${JSON.stringify(opts.tag)})`);
  }
  if (conditions.length > 0) {
    return db.select().from(memoryRecords).where(and(...conditions)).orderBy(desc(memoryRecords.isPinned), desc(memoryRecords.updatedAt));
  }
  return db.select().from(memoryRecords).orderBy(desc(memoryRecords.isPinned), desc(memoryRecords.updatedAt));
}

export async function getMemoryRecord(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(memoryRecords).where(eq(memoryRecords.id, id)).limit(1);
  return result[0];
}

export async function createMemoryRecord(data: { title: string; content: string; type: string; tags?: string[]; repoId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(memoryRecords).values({
    title: data.title,
    content: data.content,
    type: data.type as any,
    tags: data.tags ?? [],
    repoId: data.repoId,
  });
  return result.insertId;
}

export async function updateMemoryRecord(id: number, data: Partial<{ title: string; content: string; type: string; tags: string[]; isPinned: boolean; repoId: number | null }>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(memoryRecords).set(data as any).where(eq(memoryRecords.id, id));
}

export async function deleteMemoryRecord(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(memoryRecords).where(eq(memoryRecords.id, id));
}

// ─── Agents ───────────────────────────────────────────────────────────────────

export async function listAgents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agents).orderBy(agents.name);
}

export async function updateAgent(id: number, data: Partial<{ description: string; isActive: boolean }>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const updateData: any = { ...data };
  if (data.isActive) updateData.lastActivated = new Date();
  await db.update(agents).set(updateData).where(eq(agents.id, id));
}

// ─── Repositories ─────────────────────────────────────────────────────────────

export async function listRepositories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(repositories).orderBy(repositories.name);
}

export async function getRepository(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(repositories).where(eq(repositories.id, id)).limit(1);
  return result[0];
}

export async function updateRepository(id: number, data: Partial<{ description: string; status: string; url: string; notes: string; lastAuditDate: Date }>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(repositories).set(data as any).where(eq(repositories.id, id));
}

// ─── Workflows ────────────────────────────────────────────────────────────────

export async function listWorkflows() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workflows).orderBy(workflows.name);
}

export async function getWorkflowWithSteps(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [wf] = await db.select().from(workflows).where(eq(workflows.id, id)).limit(1);
  if (!wf) return undefined;
  const steps = await db.select().from(workflowSteps).where(eq(workflowSteps.workflowId, id)).orderBy(workflowSteps.stepOrder);
  return { ...wf, steps };
}

export async function updateWorkflowStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const updateData: any = { status };
  if (status === "running") updateData.lastRunAt = new Date();
  await db.update(workflows).set(updateData).where(eq(workflows.id, id));
}

export async function updateWorkflowStep(id: number, data: Partial<{ status: string; output: string }>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const updateData: any = { ...data };
  if (data.status === "completed" || data.status === "failed") updateData.completedAt = new Date();
  await db.update(workflowSteps).set(updateData).where(eq(workflowSteps.id, id));
}

export async function resetWorkflowSteps(workflowId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(workflowSteps).set({ status: "pending", output: null, completedAt: null }).where(eq(workflowSteps.workflowId, workflowId));
}

// ─── Context Packs ────────────────────────────────────────────────────────────

export async function listContextPacks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contextPacks).orderBy(desc(contextPacks.updatedAt));
}

export async function getContextPackWithItems(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [pack] = await db.select().from(contextPacks).where(eq(contextPacks.id, id)).limit(1);
  if (!pack) return undefined;
  const items = await db.select().from(contextPackItems).where(eq(contextPackItems.packId, id)).orderBy(contextPackItems.itemOrder);
  return { ...pack, items };
}

export async function createContextPack(data: { title: string; description?: string; targetAgent?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(contextPacks).values(data);
  return result.insertId;
}

export async function addContextPackItem(data: { packId: number; sourceType: string; sourceId: number; note?: string; itemOrder?: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(contextPackItems).values(data as any);
}

export async function removeContextPackItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(contextPackItems).where(eq(contextPackItems.id, id));
}

export async function updateContextPackMarkdown(id: number, markdown: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(contextPacks).set({ exportedMarkdown: markdown }).where(eq(contextPacks.id, id));
}

export async function deleteContextPack(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(contextPackItems).where(eq(contextPackItems.packId, id));
  await db.delete(contextPacks).where(eq(contextPacks.id, id));
}

// ─── Chat Messages ────────────────────────────────────────────────────────────

export async function listChatMessages(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages).orderBy(chatMessages.createdAt).limit(limit);
}

export async function saveChatMessage(data: { role: string; content: string; relatedMemoryIds?: number[] }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(chatMessages).values(data as any);
}

export async function clearChatHistory() {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(chatMessages);
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardSummary() {
  const db = await getDb();
  if (!db) return { memoryCount: 0, activeWorkflows: 0, activeAgents: 0, repoCount: 0, recentMemory: [], activeAgentList: [] };

  const [memoryCountResult] = await db.select({ count: sql<number>`COUNT(*)` }).from(memoryRecords);
  const [activeWorkflowsResult] = await db.select({ count: sql<number>`COUNT(*)` }).from(workflows).where(eq(workflows.status, "running"));
  const [activeAgentsResult] = await db.select({ count: sql<number>`COUNT(*)` }).from(agents).where(eq(agents.isActive, true));
  const [repoCountResult] = await db.select({ count: sql<number>`COUNT(*)` }).from(repositories);

  const recentMemory = await db.select().from(memoryRecords).orderBy(desc(memoryRecords.updatedAt)).limit(5);
  const activeAgentList = await db.select().from(agents).where(eq(agents.isActive, true)).orderBy(agents.name);

  return {
    memoryCount: Number(memoryCountResult?.count ?? 0),
    activeWorkflows: Number(activeWorkflowsResult?.count ?? 0),
    activeAgents: Number(activeAgentsResult?.count ?? 0),
    repoCount: Number(repoCountResult?.count ?? 0),
    recentMemory,
    activeAgentList,
  };
}
