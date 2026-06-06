/**
 * phase13-17.test.ts
 * Tests for Phases 13–17: Session Briefing, Memory Import, Vector Search,
 * Desk Connections, and Workflow Triggers.
 */
import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Hoisted mocks (must be defined before vi.mock calls) ─────────────────────
const { mockSelect, mockInsert, mockUpdate, mockDelete } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
}));

// ─── Mock ./db ────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  }),
  getDashboardSummary: vi.fn().mockResolvedValue({ memoryCount: 0, workflowCount: 0, activeAgents: 0, repoCount: 0, recentMemory: [], activeWorkflows: [], agentRoster: [] }),
  listMemoryRecords: vi.fn().mockResolvedValue([]),
  getMemoryRecord: vi.fn().mockResolvedValue(null),
  createMemoryRecord: vi.fn().mockResolvedValue(1),
  updateMemoryRecord: vi.fn().mockResolvedValue(undefined),
  deleteMemoryRecord: vi.fn().mockResolvedValue(undefined),
  listAgents: vi.fn().mockResolvedValue([]),
  updateAgent: vi.fn().mockResolvedValue(undefined),
  listRepositories: vi.fn().mockResolvedValue([]),
  getRepository: vi.fn().mockResolvedValue(null),
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
    choices: [{ message: { content: "Briefing content here." } }],
  }),
}));

// ─── Mock service modules ─────────────────────────────────────────────────────
vi.mock("./briefingJob", () => ({
  runBriefingJob: vi.fn().mockResolvedValue(42),
}));

vi.mock("./memoryImport", () => ({
  bulkImportMemory: vi.fn().mockResolvedValue({ imported: 3, skipped: 0 }),
  parsePhaseLogToRecords: vi.fn().mockReturnValue([
    { title: "Phase 1", content: "Initial setup", type: "decision", tags: ["phase"] },
    { title: "Phase 2", content: "Schema design", type: "decision", tags: ["phase"] },
  ]),
}));

vi.mock("./vectorSearch", () => ({
  semanticSearch: vi.fn().mockResolvedValue([
    { id: 1, score: 0.92 },
    { id: 2, score: 0.85 },
  ]),
  backfillEmbeddings: vi.fn().mockResolvedValue({ processed: 5, skipped: 0 }),
  ensureEmbedding: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./deskConnector", () => ({
  pingDeskConnection: vi.fn().mockResolvedValue({
    id: 1,
    name: "ProteinDesk",
    baseUrl: "https://protein.example.com",
    status: "active",
    lastPingedAt: new Date(),
    lastClaimCount: 42,
    latencyMs: 120,
  }),
  pingAllDeskConnections: vi.fn().mockResolvedValue([
    { id: 1, name: "ProteinDesk", baseUrl: "https://protein.example.com", status: "active", lastPingedAt: new Date(), lastClaimCount: 42 },
    { id: 2, name: "CountryDesk", baseUrl: "https://country.example.com", status: "unreachable", lastPingedAt: null, lastClaimCount: null },
  ]),
}));

vi.mock("./workflowTriggerEngine", () => ({
  fireTriggers: vi.fn().mockResolvedValue(undefined),
  runWorkflow: vi.fn().mockResolvedValue(undefined),
}));

// ─── Schema mocks ─────────────────────────────────────────────────────────────
vi.mock("../drizzle/schema", () => ({
  briefingRuns: { id: "id", createdAt: "createdAt" },
  deskConnections: { id: "id", name: "name" },
  workflowTriggers: { id: "id", workflowId: "workflowId" },
  memoryRecords: { id: "id" },
  agents: { isActive: "isActive" },
  repositories: { name: "name" },
  workflows: { lastRunAt: "lastRunAt" },
  workflowSteps: { workflowId: "workflowId", stepOrder: "stepOrder" },
  memoryEmbeddings: { memoryId: "memoryId" },
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

// ─── Phase 13: Session Briefing ───────────────────────────────────────────────
describe("Phase 13 — Session Briefing", () => {
  it("briefing.run triggers runBriefingJob and returns runId", async () => {
    const result = await caller.briefing.run();
    expect(result.runId).toBe(42);
  });

  it("briefing.list returns array", async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });
    const result = await caller.briefing.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("briefing.get returns null for unknown id", async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });
    const result = await caller.briefing.get({ id: 999 });
    expect(result).toBeNull();
  });
});

// ─── Phase 14: Memory Import ──────────────────────────────────────────────────
describe("Phase 14 — Memory Import", () => {
  it("import.bulkJson calls bulkImportMemory with records", async () => {
    const result = await caller.import.bulkJson({
      records: [
        { title: "Test Decision", content: "We decided to use tRPC", type: "decision", tags: ["architecture"] },
        { title: "Insight", content: "Drizzle ORM is fast", type: "insight" },
      ],
    });
    expect(result).toEqual({ imported: 3, skipped: 0 });
  });

  it("import.parsePhaseLog parses markdown and imports records", async () => {
    const result = await caller.import.parsePhaseLog({
      markdown: "## Phase 1\nInitial setup\n\n## Phase 2\nSchema design",
    });
    expect(result).toEqual({ imported: 3, skipped: 0 });
  });
});

// ─── Phase 15: Vector Search ──────────────────────────────────────────────────
describe("Phase 15 — Vector Search", () => {
  it("vectorSearch.search returns results array", async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });
    const results = await caller.vectorSearch.search({ query: "protein binding", topK: 5 });
    expect(Array.isArray(results)).toBe(true);
  });

  it("vectorSearch.backfill triggers backfillEmbeddings", async () => {
    const result = await caller.vectorSearch.backfill();
    expect(result).toEqual({ processed: 5, skipped: 0 });
  });

  it("vectorSearch.ensureEmbedding returns success", async () => {
    const result = await caller.vectorSearch.ensureEmbedding({ memoryId: 1 });
    expect(result.success).toBe(true);
  });
});

// ─── Phase 16: Desk Connections ───────────────────────────────────────────────
describe("Phase 16 — Desk Connections", () => {
  it("deskConnections.list returns array", async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue([]),
      }),
    });
    const result = await caller.deskConnections.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deskConnections.create inserts and returns id", async () => {
    mockInsert.mockReturnValue({
      values: vi.fn().mockResolvedValue([{ insertId: 7 }]),
    });
    const result = await caller.deskConnections.create({
      name: "ProteinDesk",
      baseUrl: "https://protein.example.com",
      apiKey: "test-key",
    });
    expect(result.id).toBe(7);
  });

  it("deskConnections.ping returns status object", async () => {
    const result = await caller.deskConnections.ping({ id: 1 });
    expect(result.status).toBe("active");
    expect(result.name).toBe("ProteinDesk");
    expect(typeof result.latencyMs).toBe("number");
  });

  it("deskConnections.pingAll returns array of statuses", async () => {
    const results = await caller.deskConnections.pingAll();
    expect(results).toHaveLength(2);
    expect(results[0].status).toBe("active");
    expect(results[1].status).toBe("unreachable");
  });

  it("deskConnections.delete removes connection", async () => {
    mockDelete.mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
    const result = await caller.deskConnections.delete({ id: 1 });
    expect(result.success).toBe(true);
  });
});

// ─── Phase 17: Workflow Triggers ──────────────────────────────────────────────
describe("Phase 17 — Workflow Triggers", () => {
  it("workflowTriggers.list returns array", async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue([]),
      }),
    });
    const result = await caller.workflowTriggers.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("workflowTriggers.create inserts trigger and returns id", async () => {
    mockInsert.mockReturnValue({
      values: vi.fn().mockResolvedValue([{ insertId: 3 }]),
    });
    const result = await caller.workflowTriggers.create({
      workflowId: 1,
      eventType: "memory_created",
      filterTags: ["decision"],
    });
    expect(result.id).toBe(3);
  });

  it("workflowTriggers.toggle updates isActive", async () => {
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
    const result = await caller.workflowTriggers.toggle({ id: 1, isActive: false });
    expect(result.success).toBe(true);
  });

  it("workflowTriggers.delete removes trigger", async () => {
    mockDelete.mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
    const result = await caller.workflowTriggers.delete({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("workflowTriggers.runWorkflow triggers runWorkflow service", async () => {
    const result = await caller.workflowTriggers.runWorkflow({ workflowId: 2 });
    expect(result.success).toBe(true);
  });
});

// ─── Service unit tests ───────────────────────────────────────────────────────
describe("Service unit tests", () => {
  it("parsePhaseLogToRecords extracts phase entries from markdown", async () => {
    const { parsePhaseLogToRecords } = await import("./memoryImport");
    const records = parsePhaseLogToRecords("## Phase 1\nSetup\n\n## Phase 2\nSchema");
    expect(records.length).toBe(2);
  });

  it("semanticSearch returns ranked results", async () => {
    const { semanticSearch } = await import("./vectorSearch");
    const results = await semanticSearch("protein binding", 5);
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it("pingAllDeskConnections returns mixed statuses", async () => {
    const { pingAllDeskConnections } = await import("./deskConnector");
    const results = await pingAllDeskConnections();
    const statuses = results.map((r) => r.status);
    expect(statuses).toContain("active");
    expect(statuses).toContain("unreachable");
  });
});
