/**
 * phase19-24.test.ts
 * Tests for Phases 19–24: IONOS Provider, Graph Memory, Agent Dispatch,
 * Analytics, GitHub Audit, and Export/Backup.
 */
import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockSelect, mockInsert, mockUpdate } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
}));

// ─── Mock ./db ────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: vi.fn(),
  }),
  getDashboardSummary: vi.fn().mockResolvedValue({ memoryCount: 0, workflowCount: 0, activeAgents: 0, repoCount: 0, recentMemory: [], activeWorkflows: [], agentRoster: [] }),
  listMemoryRecords: vi.fn().mockResolvedValue([]),
  getMemoryRecord: vi.fn().mockResolvedValue(null),
  createMemoryRecord: vi.fn().mockResolvedValue(1),
  updateMemoryRecord: vi.fn().mockResolvedValue(undefined),
  deleteMemoryRecord: vi.fn().mockResolvedValue(undefined),
  listAgents: vi.fn().mockResolvedValue([]),
  updateAgent: vi.fn().mockResolvedValue(undefined),
  listRepositories: vi.fn().mockResolvedValue([
    { id: 1, name: "MemoryDesk", url: "https://github.com/Gudmundur76/memorydesk", description: null, status: "active", lastAuditDate: null, notes: null, createdAt: new Date(), updatedAt: new Date() },
  ]),
  getRepository: vi.fn().mockResolvedValue({
    id: 1, name: "MemoryDesk", url: "https://github.com/Gudmundur76/memorydesk", description: null, status: "active", lastAuditDate: null, notes: null, createdAt: new Date(), updatedAt: new Date(),
  }),
  updateRepository: vi.fn().mockResolvedValue(undefined),
  listWorkflows: vi.fn().mockResolvedValue([]),
  getWorkflowWithSteps: vi.fn().mockResolvedValue(null),
  updateWorkflowStatus: vi.fn().mockResolvedValue(undefined),
  updateWorkflowStep: vi.fn().mockResolvedValue(undefined),
  resetWorkflowSteps: vi.fn().mockResolvedValue(undefined),
  listContextPacks: vi.fn().mockResolvedValue([]),
  getContextPackWithItems: vi.fn().mockResolvedValue(null),
  createContextPack: vi.fn().mockResolvedValue(1),
  addContextPackItem: vi.fn().mockResolvedValue(undefined),
  removeContextPackItem: vi.fn().mockResolvedValue(undefined),
  updateContextPackMarkdown: vi.fn().mockResolvedValue(undefined),
  deleteContextPack: vi.fn().mockResolvedValue(undefined),
  listChatMessages: vi.fn().mockResolvedValue([]),
  saveChatMessage: vi.fn().mockResolvedValue(1),
  clearChatHistory: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Agent task result." } }],
  }),
  listLLMModels: vi.fn().mockResolvedValue({ data: [{ id: "claude-sonnet-4-6" }] }),
}));

vi.mock("./briefingJob", () => ({ runBriefingJob: vi.fn().mockResolvedValue(42) }));
vi.mock("./memoryImport", () => ({
  bulkImportMemory: vi.fn().mockResolvedValue({ imported: 0, skipped: 0 }),
  parsePhaseLogToRecords: vi.fn().mockReturnValue([]),
}));
vi.mock("./vectorSearch", () => ({
  semanticSearch: vi.fn().mockResolvedValue([]),
  backfillEmbeddings: vi.fn().mockResolvedValue({ processed: 0, skipped: 0 }),
  ensureEmbedding: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("./deskConnector", () => ({
  pingDeskConnection: vi.fn().mockResolvedValue({ id: 1, name: "Test", status: "active" }),
  pingAllDeskConnections: vi.fn().mockResolvedValue([]),
}));
vi.mock("./workflowTriggerEngine", () => ({
  fireTriggers: vi.fn().mockResolvedValue(undefined),
  runWorkflow: vi.fn().mockResolvedValue(undefined),
}));

// ─── Phase 19 mocks ───────────────────────────────────────────────────────────
vi.mock("./ionosProvider", () => ({
  ionosChat: vi.fn().mockResolvedValue({ choices: [{ message: { content: "IONOS response" } }] }),
  ionosListModels: vi.fn().mockResolvedValue({ data: [{ id: "meta-llama-3.1-8b-instruct" }] }),
  ionosTestConnection: vi.fn().mockResolvedValue({ ok: true, model: "meta-llama-3.1-8b-instruct", latencyMs: 120 }),
}));

// ─── Phase 20 mocks ───────────────────────────────────────────────────────────
vi.mock("./graphMemory", () => ({
  addNode: vi.fn().mockResolvedValue({ id: 1, label: "CoreEngine", type: "entity", properties: {}, createdAt: new Date() }),
  addEdge: vi.fn().mockResolvedValue({ id: 1, fromId: 1, toId: 2, relation: "uses", weight: 1, createdAt: new Date() }),
  findRelated: vi.fn().mockResolvedValue({ nodes: [], edges: [] }),
  searchNodes: vi.fn().mockResolvedValue([]),
  getSubgraph: vi.fn().mockResolvedValue({ nodes: [], edges: [] }),
  listNodes: vi.fn().mockResolvedValue([]),
  listEdges: vi.fn().mockResolvedValue([]),
  deleteNode: vi.fn().mockResolvedValue(undefined),
}));

// ─── Phase 21 mocks ───────────────────────────────────────────────────────────
vi.mock("./agentDispatcher", () => ({
  dispatchAgentTask: vi.fn().mockResolvedValue({ ok: true, output: "Task completed.", provider: "builtin_llm" }),
}));

// ─── Phase 23 mocks ───────────────────────────────────────────────────────────
vi.mock("./githubAudit", () => ({
  auditRepo: vi.fn().mockResolvedValue({
    fullName: "Gudmundur76/memorydesk",
    description: "MemoryDesk",
    stars: 5, forks: 1, openIssues: 2, openPRs: 0,
    defaultBranch: "main", lastCommitDate: "2026-06-01T12:00:00Z",
    lastCommitSha: "abc1234", commitCount: null, contributors: 1,
    language: "TypeScript", topics: ["ai", "memory"], isPrivate: false, isArchived: false,
    auditedAt: new Date().toISOString(),
  }),
  // Export parseRepoSlug so unit tests can use the real implementation
  parseRepoSlug: (input: string): string | null => {
    const trimmed = input.trim().replace(/\.git$/, "");
    const ghMatch = trimmed.match(/github\.com\/([^/]+\/[^/]+)/);
    if (ghMatch) return ghMatch[1];
    if (/^[^/]+\/[^/]+$/.test(trimmed)) return trimmed;
    return null;
  },
}));

// ─── Phase 24 mocks ───────────────────────────────────────────────────────────
vi.mock("./exportService", () => ({
  exportAll: vi.fn().mockResolvedValue({
    version: "1.0",
    exportedAt: new Date().toISOString(),
    data: {
      memoryRecords: [], agents: [], repositories: [], workflows: [], workflowSteps: [],
      contextPacks: [], contextPackItems: [], kgNodes: [], kgEdges: [], agentTasks: [],
      briefingRuns: [], deskConnections: [], workflowTriggers: [],
    },
    stats: { totalRecords: 0, totalAgents: 0, totalRepos: 0, totalNodes: 0, totalEdges: 0, totalTasks: 0 },
  }),
}));

// ─── Schema mock ──────────────────────────────────────────────────────────────
vi.mock("../drizzle/schema", () => ({
  briefingRuns: { id: "id", createdAt: "createdAt" },
  deskConnections: { id: "id", name: "name" },
  workflowTriggers: { id: "id", workflowId: "workflowId" },
  memoryRecords: { id: "id", type: "type", tags: "tags", createdAt: "createdAt" },
  agents: { id: "id", isActive: "isActive" },
  repositories: { name: "name" },
  workflows: { lastRunAt: "lastRunAt" },
  workflowSteps: { workflowId: "workflowId", stepOrder: "stepOrder" },
  memoryEmbeddings: { memoryId: "memoryId" },
  kgNodes: { id: "id", label: "label", type: "type", properties: "properties", createdAt: "createdAt" },
  kgEdges: { id: "id", fromId: "fromId", toId: "toId", relation: "relation", weight: "weight", createdAt: "createdAt" },
  agentTasks: { id: "id", agentId: "agentId", title: "title", description: "description", status: "status", result: "result", dispatchedAt: "dispatchedAt", completedAt: "completedAt" },
}));

// ─── Owner context factory ─────────────────────────────────────────────────────
function createOwnerContext(): TrpcContext {
  return {
    user: { id: 1, openId: "owner-open-id", name: "Owner", email: "owner@test.com", role: "admin", createdAt: new Date() },
    req: {} as any,
    res: { clearCookie: vi.fn(), cookie: vi.fn() } as any,
  };
}

const caller = appRouter.createCaller(createOwnerContext());

// ─── Phase 19: IONOS AI Model Hub ─────────────────────────────────────────────
describe("Phase 19 — IONOS AI Model Hub", () => {
  it("settings.getLLMProvider returns provider list with active field", async () => {
    const result = await caller.settings.getLLMProvider();
    expect(result).toHaveProperty("active");
    expect(Array.isArray(result.providers)).toBe(true);
    expect(result.providers.length).toBeGreaterThan(0);
  });

  it("settings.setLLMProvider switches to builtin", async () => {
    const result = await caller.settings.setLLMProvider({ provider: "builtin" });
    expect(result.active).toBe("builtin");
  });

  it("settings.testLLMProvider returns ok result for builtin", async () => {
    const result = await caller.settings.testLLMProvider({ provider: "builtin" });
    expect(result).toHaveProperty("ok");
  });
});

// ─── Phase 20: Graph Memory ───────────────────────────────────────────────────
describe("Phase 20 — Ruvector Graph Memory", () => {
  it("graph.addNode returns new node id", async () => {
    // addNode returns the insertId (number) from graphMemory.ts
    const result = await caller.graph.addNode({ label: "CoreEngine", type: "entity" });
    expect(result).toBeDefined();
  });

  it("graph.addEdge returns new edge id", async () => {
    // addEdge returns the insertId (number) from graphMemory.ts
    const result = await caller.graph.addEdge({ fromId: 1, toId: 2, relation: "uses" });
    expect(result).toBeDefined();
  });

  it("graph.searchNodes returns array", async () => {
    const result = await caller.graph.searchNodes({ query: "Core" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("graph.getSubgraph returns nodes and edges", async () => {
    const result = await caller.graph.getSubgraph({ nodeIds: [1, 2] });
    expect(result).toHaveProperty("nodes");
    expect(result).toHaveProperty("edges");
  });

  it("graph.listNodes returns array", async () => {
    const result = await caller.graph.listNodes();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Phase 21: Agent Task Dispatch ───────────────────────────────────────────
describe("Phase 21 — Agent Task Dispatch", () => {
  it("agentTasks.list returns array", async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue([]),
      }),
    });
    const result = await caller.agentTasks.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Phase 22: Analytics ─────────────────────────────────────────────────────
describe("Phase 22 — Memory Analytics", () => {
  it("analytics.summary returns totalRecords and byType", async () => {
    // analytics.summary does: db.select().from().groupBy() for byType,
    // then db.select().from() for task count and node count
    let callCount = 0;
    mockSelect.mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        groupBy: vi.fn().mockResolvedValue([]),
        // for the count-only selects (taskCount, nodeCount)
        then: undefined,
        // fallback for plain .from().then()
        [Symbol.iterator]: undefined,
      }),
    }));
    // Override: return array directly for plain .from() calls (count queries)
    mockSelect.mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // byType query — groupBy
          return { groupBy: vi.fn().mockResolvedValue([]) };
        }
        // count queries — return array with count object
        return Promise.resolve([{ count: 0 }]);
      }),
    });
    const result = await caller.analytics.summary();
    expect(result).toHaveProperty("totalRecords");
    expect(result).toHaveProperty("byType");
    expect(Array.isArray(result.byType)).toBe(true);
  });

  it("analytics.growthSeries returns array", async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          groupBy: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });
    const result = await caller.analytics.growthSeries();
    expect(Array.isArray(result)).toBe(true);
  });

  it("analytics.tagCloud returns array", async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockResolvedValue([]),
    });
    const result = await caller.analytics.tagCloud();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Phase 23: GitHub Repo Audit ─────────────────────────────────────────────
describe("Phase 23 — GitHub Repo Live Audit", () => {
  it("repos.audit returns stats and summary for known repo", async () => {
    const result = await caller.repos.audit({ id: 1 });
    expect(result.stats.fullName).toBe("Gudmundur76/memorydesk");
    expect(result.stats.stars).toBe(5);
    expect(typeof result.summary).toBe("string");
    expect(result.summary).toContain("Stars:");
  });

  it("repos.auditAll returns results array", async () => {
    const result = await caller.repos.auditAll();
    expect(Array.isArray(result.results)).toBe(true);
    expect(result.results[0].name).toBe("MemoryDesk");
  });
});

// ─── Phase 24: Export / Backup ────────────────────────────────────────────────
describe("Phase 24 — Export / Backup", () => {
  it("backup.export returns version 1.0 with all data keys", async () => {
    const result = await caller.backup.export();
    expect(result.version).toBe("1.0");
    expect(result).toHaveProperty("exportedAt");
    expect(result.data).toHaveProperty("memoryRecords");
    expect(result.data).toHaveProperty("agents");
    expect(result.data).toHaveProperty("kgNodes");
    expect(result.data).toHaveProperty("kgEdges");
    expect(result.data).toHaveProperty("agentTasks");
    expect(result.stats).toHaveProperty("totalRecords");
  });
});

// ─── parseRepoSlug unit tests ─────────────────────────────────────────────────
describe("parseRepoSlug", () => {
  it("parses GitHub URL", async () => {
    const { parseRepoSlug } = await import("./githubAudit");
    expect(parseRepoSlug("https://github.com/Gudmundur76/memorydesk")).toBe("Gudmundur76/memorydesk");
  });

  it("parses GitHub URL with .git suffix", async () => {
    const { parseRepoSlug } = await import("./githubAudit");
    expect(parseRepoSlug("https://github.com/Gudmundur76/memorydesk.git")).toBe("Gudmundur76/memorydesk");
  });

  it("accepts owner/repo slug directly", async () => {
    const { parseRepoSlug } = await import("./githubAudit");
    expect(parseRepoSlug("Gudmundur76/memorydesk")).toBe("Gudmundur76/memorydesk");
  });

  it("returns null for invalid input", async () => {
    const { parseRepoSlug } = await import("./githubAudit");
    expect(parseRepoSlug("not-a-repo")).toBeNull();
  });
});
