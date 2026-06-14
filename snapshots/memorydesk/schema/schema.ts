import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

// ─── Users ──────────────────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Memory Records ──────────────────────────────────────────────────────────

export const memoryRecords = mysqlTable("memory_records", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  type: mysqlEnum("type", ["decision", "insight", "repo_summary", "note", "workflow_output"]).default("note").notNull(),
  tags: json("tags").$type<string[]>(),
  repoId: int("repoId"),
  isPinned: boolean("isPinned").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MemoryRecord = typeof memoryRecords.$inferSelect;
export type InsertMemoryRecord = typeof memoryRecords.$inferInsert;

// ─── Agents ──────────────────────────────────────────────────────────────────

export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull().unique(),
  role: varchar("role", { length: 128 }).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  lastActivated: timestamp("lastActivated"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

// ─── Repositories ────────────────────────────────────────────────────────────

export const repositories = mysqlTable("repositories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull().unique(),
  description: text("description"),
  status: mysqlEnum("status", ["active", "archived", "in_review", "planned"]).default("active").notNull(),
  url: varchar("url", { length: 512 }),
  lastAuditDate: timestamp("lastAuditDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Repository = typeof repositories.$inferSelect;
export type InsertRepository = typeof repositories.$inferInsert;

// ─── Workflows ───────────────────────────────────────────────────────────────

export const workflows = mysqlTable("workflows", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["idle", "running", "completed", "failed", "paused"]).default("idle").notNull(),
  lastRunAt: timestamp("lastRunAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;

// ─── Workflow Steps ───────────────────────────────────────────────────────────

export const workflowSteps = mysqlTable("workflow_steps", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflowId").notNull(),
  stepOrder: int("stepOrder").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed", "skipped"]).default("pending").notNull(),
  output: text("output"),
  agentRole: varchar("agentRole", { length: 128 }),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkflowStep = typeof workflowSteps.$inferSelect;
export type InsertWorkflowStep = typeof workflowSteps.$inferInsert;

// ─── Context Packs ────────────────────────────────────────────────────────────

export const contextPacks = mysqlTable("context_packs", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  targetAgent: varchar("targetAgent", { length: 128 }),
  exportedMarkdown: text("exportedMarkdown"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContextPack = typeof contextPacks.$inferSelect;
export type InsertContextPack = typeof contextPacks.$inferInsert;

// ─── Context Pack Items ───────────────────────────────────────────────────────

export const contextPackItems = mysqlTable("context_pack_items", {
  id: int("id").autoincrement().primaryKey(),
  packId: int("packId").notNull(),
  sourceType: mysqlEnum("sourceType", ["memory_record", "repo_summary", "workflow_output"]).notNull(),
  sourceId: int("sourceId").notNull(),
  note: text("note"),
  itemOrder: int("itemOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContextPackItem = typeof contextPackItems.$inferSelect;
export type InsertContextPackItem = typeof contextPackItems.$inferInsert;

// ─── Chat Messages ────────────────────────────────────────────────────────────

export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  relatedMemoryIds: json("relatedMemoryIds").$type<number[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// ─── Briefing Runs (Phase 13) ─────────────────────────────────────────────────

export const briefingRuns = mysqlTable("briefing_runs", {
  id: int("id").autoincrement().primaryKey(),
  status: mysqlEnum("status", ["running", "completed", "failed"]).default("running").notNull(),
  workflowId: int("workflowId"),
  output: text("output"),
  triggeredBy: mysqlEnum("triggeredBy", ["cron", "manual"]).default("manual").notNull(),
  cronTaskUid: varchar("cronTaskUid", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BriefingRun = typeof briefingRuns.$inferSelect;
export type InsertBriefingRun = typeof briefingRuns.$inferInsert;

// ─── Memory Embeddings (Phase 15) ────────────────────────────────────────────

export const memoryEmbeddings = mysqlTable("memory_embeddings", {
  id: int("id").autoincrement().primaryKey(),
  memoryId: int("memoryId").notNull(),
  embedding: json("embedding").$type<number[]>().notNull(),
  model: varchar("model", { length: 128 }).default("text-embedding-3-small").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MemoryEmbedding = typeof memoryEmbeddings.$inferSelect;
export type InsertMemoryEmbedding = typeof memoryEmbeddings.$inferInsert;

// ─── Desk Connections (Phase 16) ─────────────────────────────────────────────

export const deskConnections = mysqlTable("desk_connections", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  baseUrl: varchar("baseUrl", { length: 512 }).notNull(),
  apiKey: varchar("apiKey", { length: 256 }),
  status: mysqlEnum("status", ["active", "unreachable", "unknown"]).default("unknown").notNull(),
  lastPingedAt: timestamp("lastPingedAt"),
  lastClaimCount: int("lastClaimCount"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DeskConnection = typeof deskConnections.$inferSelect;
export type InsertDeskConnection = typeof deskConnections.$inferInsert;

// ─── Workflow Triggers (Phase 17) ────────────────────────────────────────────

export const workflowTriggers = mysqlTable("workflow_triggers", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflowId").notNull(),
  eventType: mysqlEnum("eventType", ["memory_created", "memory_tagged", "manual"]).notNull(),
  filterTags: json("filterTags").$type<string[]>(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WorkflowTrigger = typeof workflowTriggers.$inferSelect;
export type InsertWorkflowTrigger = typeof workflowTriggers.$inferInsert;

// ─── KG Nodes (Phase 20 — Ruvector Graph Memory) ─────────────────────────────
export const kgNodes = mysqlTable("kg_nodes", {
  id: int("id").autoincrement().primaryKey(),
  label: varchar("label", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["entity", "concept", "decision", "event", "person", "project"]).default("entity").notNull(),
  properties: json("properties").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type KgNode = typeof kgNodes.$inferSelect;
export type InsertKgNode = typeof kgNodes.$inferInsert;

// ─── KG Edges (Phase 20 — Ruvector Graph Memory) ─────────────────────────────
export const kgEdges = mysqlTable("kg_edges", {
  id: int("id").autoincrement().primaryKey(),
  fromId: int("fromId").notNull(),
  toId: int("toId").notNull(),
  relation: varchar("relation", { length: 128 }).notNull(),
  weight: int("weight").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type KgEdge = typeof kgEdges.$inferSelect;
export type InsertKgEdge = typeof kgEdges.$inferInsert;

// ─── Agent Tasks (Phase 21 — Agent Task Dispatch) ─────────────────────────────
export const agentTasks = mysqlTable("agent_tasks", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "running", "done", "failed", "cancelled"]).default("pending").notNull(),
  result: text("result"),
  dispatchedAt: timestamp("dispatchedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});
export type AgentTask = typeof agentTasks.$inferSelect;
export type InsertAgentTask = typeof agentTasks.$inferInsert;
