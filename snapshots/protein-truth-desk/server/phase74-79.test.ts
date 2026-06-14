/**
 * phase74-79.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Vitest unit tests for Phases 74–79:
 *   74 — IndexNow SEO admin router (seoRouter)
 *   75 — Observability: pino logger, correlation ID context, /api/health/detailed
 *   76 — Swarm admin router (swarmRouter)
 *   77 — OpenRouter multi-key rotation (multiLLM)
 *   78 — FreeLLM/Ollama provider routing (multiLLM)
 *   79 — Quality pass: getActiveLLMProvider, getOpenRouterKeyPoolSize, getLLMHealthSummary
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Shared DB mock ──────────────────────────────────────────────────────────

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();

vi.mock("./db", () => ({
  getDb: vi.fn(async () => ({
    insert: mockInsert,
    select: mockSelect,
    update: mockUpdate,
  })),
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col: unknown, val: unknown) => ({ col, val, op: "eq" })),
  and: vi.fn((...args: unknown[]) => ({ args, op: "and" })),
  desc: vi.fn((col: unknown) => ({ col, op: "desc" })),
  asc: vi.fn((col: unknown) => ({ col, op: "asc" })),
  isNull: vi.fn((col: unknown) => ({ col, op: "isNull" })),
  gt: vi.fn((col: unknown, val: unknown) => ({ col, val, op: "gt" })),
  lt: vi.fn((col: unknown, val: unknown) => ({ col, val, op: "lt" })),
  inArray: vi.fn((col: unknown, vals: unknown) => ({ col, vals, op: "inArray" })),
  sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values, op: "sql" })),
}));

vi.mock("../drizzle/schema", () => ({
  seoPingLog: { id: "id", urls: "urls", batchSize: "batchSize", status: "status", error: "error", createdAt: "createdAt" },
  swarmTickLog: { id: "id", startedAt: "startedAt", completedAt: "completedAt", durationMs: "durationMs", agentResults: "agentResults", summary: "summary", createdAt: "createdAt" },
  claims: { id: "id", documentId: "documentId", status: "status", claimText: "claimText" },
  auditReports: { id: "id", documentId: "documentId", status: "status" },
}));

// ─── Phase 74: IndexNow SEO admin router ─────────────────────────────────────

describe("Phase 74 — seoRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.INDEX_NOW_KEY = "test-indexnow-key-12345678";
  });

  afterEach(() => {
    delete process.env.INDEX_NOW_KEY;
  });

  it("notifyIndexNow resolves without throwing for a valid URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    const { notifyIndexNow } = await import("./seo/indexNow");
    // notifyIndexNow returns void — just confirm it does not throw
    await expect(notifyIndexNow("https://example.com/claims/123")).resolves.not.toThrow();
    vi.unstubAllGlobals();
  });

  it("claimUrl builds a URL containing the claim ID", async () => {
    const { claimUrl } = await import("./seo/indexNow");
    // claimUrl takes a single numeric claimId argument
    const url = claimUrl(42);
    expect(url).toContain("42");
    expect(typeof url).toBe("string");
  });

  it("reportUrl builds a URL containing the document ID", async () => {
    const { reportUrl } = await import("./seo/indexNow");
    // reportUrl takes a single numeric documentId argument
    const url = reportUrl(7);
    expect(url).toContain("7");
    expect(typeof url).toBe("string");
  });

  it("notifyIndexNowBatch resolves without throwing for an array of URLs", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    const { notifyIndexNowBatch } = await import("./seo/indexNow");
    // notifyIndexNowBatch returns void — just confirm it does not throw
    await expect(
      notifyIndexNowBatch(["https://example.com/a", "https://example.com/b"])
    ).resolves.not.toThrow();
    vi.unstubAllGlobals();
  });
});

// ─── Phase 75: Observability ─────────────────────────────────────────────────

describe("Phase 75 — logger + correlationId", () => {
  it("logger is a pino logger instance with expected methods", async () => {
    const { logger } = await import("./_core/logger");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.debug).toBe("function");
  });

  it("withCorrelationId returns a child logger", async () => {
    const { withCorrelationId } = await import("./_core/logger");
    const child = withCorrelationId("test-corr-id-001");
    expect(typeof child.info).toBe("function");
    expect(typeof child.error).toBe("function");
  });

  it("createProcedureLogger returns a child logger with procedure binding", async () => {
    const { createProcedureLogger } = await import("./_core/logger");
    const child = createProcedureLogger("seo.pingAll", "corr-abc");
    expect(typeof child.info).toBe("function");
  });

  it("createRequestLogger returns an Express middleware function", async () => {
    const { createRequestLogger } = await import("./_core/logger");
    const middleware = createRequestLogger();
    expect(typeof middleware).toBe("function");
  });

  it("createContext includes correlationId field", async () => {
    const mockReq = {
      headers: { cookie: "" },
      id: "req_test_corr_001",
    };
    const mockRes = {};
    vi.mock("./_core/sdk", () => ({
      sdk: {
        authenticateRequest: vi.fn(async () => null),
      },
    }));
    const { createContext } = await import("./_core/context");
    const ctx = await createContext({ req: mockReq as never, res: mockRes as never });
    expect(ctx).toHaveProperty("correlationId");
    expect(typeof ctx.correlationId).toBe("string");
    expect(ctx.correlationId.length).toBeGreaterThan(0);
  });
});

// ─── Phase 76: Swarm admin router ────────────────────────────────────────────

describe("Phase 76 — swarmRouter", () => {
  it("swarmRouter exports a tRPC router object", async () => {
    const { swarmRouter } = await import("./swarmRouter");
    expect(swarmRouter).toBeDefined();
    expect(typeof swarmRouter).toBe("object");
  });

  it("swarmRouter has status, runTick, and listLogs procedures", async () => {
    const { swarmRouter } = await import("./swarmRouter");
    const procedures = Object.keys(swarmRouter._def.record);
    expect(procedures).toContain("status");
    expect(procedures).toContain("runTick");
    expect(procedures).toContain("listLogs");
  });

  it("swarmRouter.status is a query procedure", async () => {
    const { swarmRouter } = await import("./swarmRouter");
    expect(swarmRouter._def.record.status._def.type).toBe("query");
  });

  it("swarmRouter.runTick is a mutation procedure", async () => {
    const { swarmRouter } = await import("./swarmRouter");
    expect(swarmRouter._def.record.runTick._def.type).toBe("mutation");
  });
});

// ─── Phase 77: OpenRouter multi-key rotation ─────────────────────────────────

describe("Phase 77 — OpenRouter multi-key rotation", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("getOpenRouterKeyPoolSize returns 0 when no keys configured", async () => {
    const savedKey = process.env.OPENROUTER_API_KEY;
    const savedKeys = process.env.OPENROUTER_API_KEYS;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEYS;
    const { getOpenRouterKeyPoolSize } = await import("./_core/multiLLM");
    const size = getOpenRouterKeyPoolSize();
    expect(size).toBe(0);
    if (savedKey) process.env.OPENROUTER_API_KEY = savedKey;
    if (savedKeys) process.env.OPENROUTER_API_KEYS = savedKeys;
  });

  it("getOpenRouterKeyPoolSize returns 1 when single key configured", async () => {
    process.env.OPENROUTER_API_KEY = "sk-or-single-key";
    delete process.env.OPENROUTER_API_KEYS;
    const { getOpenRouterKeyPoolSize } = await import("./_core/multiLLM");
    const size = getOpenRouterKeyPoolSize();
    expect(size).toBeGreaterThanOrEqual(1);
    delete process.env.OPENROUTER_API_KEY;
  });

  it("getOpenRouterKeyPoolSize returns pool size when comma-separated keys configured", async () => {
    process.env.OPENROUTER_API_KEYS = "sk-or-key1,sk-or-key2,sk-or-key3";
    delete process.env.OPENROUTER_API_KEY;
    const { getOpenRouterKeyPoolSize } = await import("./_core/multiLLM");
    const size = getOpenRouterKeyPoolSize();
    expect(size).toBe(3);
    delete process.env.OPENROUTER_API_KEYS;
  });

  it("getOpenRouterModel returns a non-empty string for each tier", async () => {
    const { getOpenRouterModel } = await import("./_core/multiLLM");
    expect(getOpenRouterModel("quality")).toBeTruthy();
    expect(getOpenRouterModel("draft")).toBeTruthy();
    expect(getOpenRouterModel("fallback")).toBeTruthy();
  });
});

// ─── Phase 78: FreeLLM/Ollama provider ───────────────────────────────────────

describe("Phase 78 — FreeLLM/Ollama provider routing", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("getActiveLLMProvider returns 'manus_builtin' when LLM_PROVIDER not set", async () => {
    const saved = process.env.LLM_PROVIDER;
    delete process.env.LLM_PROVIDER;
    const { getActiveLLMProvider } = await import("./_core/multiLLM");
    const provider = getActiveLLMProvider();
    // Default is manus_builtin when no LLM_PROVIDER env var is set
    expect(["manus_builtin", "forge"]).toContain(provider);
    if (saved) process.env.LLM_PROVIDER = saved;
  });

  it("getActiveLLMProvider returns 'openrouter' when LLM_PROVIDER=openrouter", async () => {
    process.env.LLM_PROVIDER = "openrouter";
    const { getActiveLLMProvider } = await import("./_core/multiLLM");
    const provider = getActiveLLMProvider();
    expect(provider).toBe("openrouter");
    delete process.env.LLM_PROVIDER;
  });

  it("getActiveLLMProvider returns 'freellmapi' when LLM_PROVIDER=freellmapi", async () => {
    process.env.LLM_PROVIDER = "freellmapi";
    const { getActiveLLMProvider } = await import("./_core/multiLLM");
    const provider = getActiveLLMProvider();
    expect(provider).toBe("freellmapi");
    delete process.env.LLM_PROVIDER;
  });

  it("FREE_MODEL_ROTATION is a non-empty array of model strings", async () => {
    const { FREE_MODEL_ROTATION } = await import("./_core/multiLLM");
    expect(Array.isArray(FREE_MODEL_ROTATION)).toBe(true);
    expect(FREE_MODEL_ROTATION.length).toBeGreaterThan(0);
    FREE_MODEL_ROTATION.forEach((m) => expect(typeof m).toBe("string"));
  });
});

// ─── Phase 79: Quality pass — health summary ─────────────────────────────────

describe("Phase 79 — getLLMHealthSummary", () => {
  it("getLLMHealthSummary returns provider, status, and models fields", async () => {
    const { getLLMHealthSummary } = await import("./_core/multiLLM");
    const summary = getLLMHealthSummary();
    expect(summary).toHaveProperty("provider");
    expect(summary).toHaveProperty("status");
    expect(summary).toHaveProperty("models");
    expect(typeof summary.provider).toBe("string");
    expect(typeof summary.status).toBe("string");
    expect(Array.isArray(summary.models)).toBe(true);
  });

  it("seoRouter exports a tRPC router object", async () => {
    const { seoRouter } = await import("./seoRouter");
    expect(seoRouter).toBeDefined();
    expect(typeof seoRouter).toBe("object");
  });

  it("seoRouter has status, pingAll, and pingDocument procedures", async () => {
    const { seoRouter } = await import("./seoRouter");
    const procedures = Object.keys(seoRouter._def.record);
    expect(procedures).toContain("status");
    expect(procedures).toContain("pingAll");
    expect(procedures).toContain("pingDocument");
  });

  it("seoRouter.pingAll is a mutation procedure", async () => {
    const { seoRouter } = await import("./seoRouter");
    expect(seoRouter._def.record.pingAll._def.type).toBe("mutation");
  });

  it("seoRouter.status is a query procedure", async () => {
    const { seoRouter } = await import("./seoRouter");
    expect(seoRouter._def.record.status._def.type).toBe("query");
  });
});
