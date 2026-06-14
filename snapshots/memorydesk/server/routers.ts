import { TRPCError } from "@trpc/server";
import { ionosChat, ionosListModels, ionosTestConnection } from "./ionosProvider";
import { addNode, addEdge, findRelated, searchNodes, getSubgraph, listNodes, listEdges, deleteNode } from "./graphMemory";
import { dispatchAgentTask } from "./agentDispatcher";
import { auditRepo } from "./githubAudit";
import { exportAll } from "./exportService";
import { runBriefingJob } from "./briefingJob";
import { bulkImportMemory, parsePhaseLogToRecords } from "./memoryImport";
import { semanticSearch, backfillEmbeddings, ensureEmbedding } from "./vectorSearch";
import { pingDeskConnection, pingAllDeskConnections } from "./deskConnector";
import { runWorkflow } from "./workflowTriggerEngine";
import { getDb } from "./db";
import { deskConnections, workflowTriggers, briefingRuns, memoryRecords as memoryRecordsTable, kgNodes, kgEdges, agentTasks, agents } from "../drizzle/schema";
import { eq, desc, inArray, sql, count, gte } from "drizzle-orm";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  addContextPackItem,
  clearChatHistory,
  createContextPack,
  createMemoryRecord,
  deleteContextPack,
  deleteMemoryRecord,
  getContextPackWithItems,
  getDashboardSummary,
  getMemoryRecord,
  getRepository,
  getWorkflowWithSteps,
  listAgents,
  listChatMessages,
  listContextPacks,
  listMemoryRecords,
  listRepositories,
  listWorkflows,
  removeContextPackItem,
  resetWorkflowSteps,
  saveChatMessage,
  updateAgent,
  updateContextPackMarkdown,
  updateMemoryRecord,
  updateRepository,
  updateWorkflowStatus,
  updateWorkflowStep,
} from "./db";
import { ENV } from "./_core/env";

// ─── In-memory LLM provider state (Phase 19) ────────────────────────────────
type LLMProvider = "builtin" | "ionos";
let activeLLMProvider: LLMProvider = "builtin";

// Owner-only middleware
const ownerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.openId !== ENV.ownerOpenId && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Owner-only access" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Dashboard ────────────────────────────────────────────────────────────
  dashboard: router({
    summary: ownerProcedure.query(async () => {
      return getDashboardSummary();
    }),
  }),

  // ─── Memory Records ───────────────────────────────────────────────────────
  memory: router({
    list: ownerProcedure
      .input(z.object({ search: z.string().optional(), tag: z.string().optional(), type: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return listMemoryRecords(input ?? {});
      }),

    get: ownerProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const record = await getMemoryRecord(input.id);
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });
      return record;
    }),

    create: ownerProcedure
      .input(z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        type: z.enum(["decision", "insight", "repo_summary", "note", "workflow_output"]),
        tags: z.array(z.string()).optional(),
        repoId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createMemoryRecord(input);
        return { id };
      }),

    update: ownerProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        type: z.enum(["decision", "insight", "repo_summary", "note", "workflow_output"]).optional(),
        tags: z.array(z.string()).optional(),
        isPinned: z.boolean().optional(),
        repoId: z.number().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateMemoryRecord(id, data);
        return { success: true };
      }),

    delete: ownerProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteMemoryRecord(input.id);
      return { success: true };
    }),
  }),

  // ─── Agents ───────────────────────────────────────────────────────────────
  agents: router({
    list: ownerProcedure.query(async () => {
      return listAgents();
    }),

    update: ownerProcedure
      .input(z.object({
        id: z.number(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateAgent(id, data);
        return { success: true };
      }),
  }),

  // ─── Repositories ─────────────────────────────────────────────────────────
  repos: router({
    list: ownerProcedure.query(async () => {
      return listRepositories();
    }),

    get: ownerProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const repo = await getRepository(input.id);
      if (!repo) throw new TRPCError({ code: "NOT_FOUND" });
      return repo;
    }),

    update: ownerProcedure
      .input(z.object({
        id: z.number(),
        description: z.string().optional(),
        status: z.enum(["active", "archived", "in_review", "planned"]).optional(),
        url: z.string().optional(),
        notes: z.string().optional(),
        lastAuditDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateRepository(id, data);
        return { success: true };
      }),

    // Phase 23 — GitHub Live Audit
    audit: ownerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const repo = await getRepository(input.id);
        if (!repo) throw new TRPCError({ code: "NOT_FOUND" });
        const slug = repo.url ?? repo.name;
        const stats = await auditRepo(slug);
        if (!stats) throw new TRPCError({ code: "BAD_REQUEST", message: "Could not fetch GitHub stats. Check the repo URL or GITHUB_TOKEN." });
        // Update lastAuditDate and notes with summary
        const summary = [
          `Stars: ${stats.stars} | Forks: ${stats.forks}`,
          `Open Issues: ${stats.openIssues} | Open PRs: ${stats.openPRs}`,
          `Language: ${stats.language ?? "N/A"} | Branch: ${stats.defaultBranch}`,
          `Last commit: ${stats.lastCommitSha ?? "N/A"} (${stats.lastCommitDate ? new Date(stats.lastCommitDate).toLocaleDateString() : "N/A"})`,
          `Contributors: ${stats.contributors ?? "N/A"} | Private: ${stats.isPrivate} | Archived: ${stats.isArchived}`,
          `Topics: ${stats.topics.join(", ") || "none"}`,
          `Audited: ${new Date(stats.auditedAt).toLocaleString()}`,
        ].join("\n");
        await updateRepository(input.id, { notes: summary, lastAuditDate: new Date() });
        return { stats, summary };
      }),

    auditAll: ownerProcedure.mutation(async () => {
      const repos = await listRepositories();
      const results = await Promise.allSettled(
        repos.map(async (repo) => {
          const slug = repo.url ?? repo.name;
          const stats = await auditRepo(slug);
          if (stats) {
            const summary = `Stars: ${stats.stars} | Open Issues: ${stats.openIssues} | Open PRs: ${stats.openPRs} | Last commit: ${stats.lastCommitSha ?? "N/A"} | Audited: ${new Date(stats.auditedAt).toLocaleString()}`;
            await updateRepository(repo.id, { notes: summary, lastAuditDate: new Date() });
          }
          return { id: repo.id, name: repo.name, ok: !!stats };
        })
      );
      const summary = results.map((r) => r.status === "fulfilled" ? r.value : { id: -1, name: "unknown", ok: false });
      return { results: summary };
    }),
  }),

  // ─── Workflows ────────────────────────────────────────────────────────────
  workflows: router({
    list: ownerProcedure.query(async () => {
      return listWorkflows();
    }),

    get: ownerProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const wf = await getWorkflowWithSteps(input.id);
      if (!wf) throw new TRPCError({ code: "NOT_FOUND" });
      return wf;
    }),

    run: ownerProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await resetWorkflowSteps(input.id);
      await updateWorkflowStatus(input.id, "running");
      return { success: true };
    }),

    complete: ownerProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await updateWorkflowStatus(input.id, "completed");
      return { success: true };
    }),

    reset: ownerProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await resetWorkflowSteps(input.id);
      await updateWorkflowStatus(input.id, "idle");
      return { success: true };
    }),

    updateStep: ownerProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "running", "completed", "failed", "skipped"]).optional(),
        output: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateWorkflowStep(id, data);
        return { success: true };
      }),
  }),

  // ─── Context Packs ────────────────────────────────────────────────────────
  contextPacks: router({
    list: ownerProcedure.query(async () => {
      return listContextPacks();
    }),

    get: ownerProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const pack = await getContextPackWithItems(input.id);
      if (!pack) throw new TRPCError({ code: "NOT_FOUND" });
      return pack;
    }),

    create: ownerProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        targetAgent: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createContextPack(input);
        return { id };
      }),

    addItem: ownerProcedure
      .input(z.object({
        packId: z.number(),
        sourceType: z.enum(["memory_record", "repo_summary", "workflow_output"]),
        sourceId: z.number(),
        note: z.string().optional(),
        itemOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await addContextPackItem(input);
        return { success: true };
      }),

    removeItem: ownerProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await removeContextPackItem(input.id);
      return { success: true };
    }),

    export: ownerProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const pack = await getContextPackWithItems(input.id);
      if (!pack) throw new TRPCError({ code: "NOT_FOUND" });

      // Build markdown from items
      const memoryIds = pack.items.filter((i) => i.sourceType === "memory_record").map((i) => i.sourceId);
      const memoryItems = await Promise.all(memoryIds.map((id) => getMemoryRecord(id)));

      let md = `# Context Pack: ${pack.title}\n\n`;
      if (pack.description) md += `> ${pack.description}\n\n`;
      if (pack.targetAgent) md += `**Target Agent:** ${pack.targetAgent}\n\n`;
      md += `---\n\n`;

      for (const item of pack.items) {
        if (item.sourceType === "memory_record") {
          const mem = memoryItems.find((m) => m?.id === item.sourceId);
          if (mem) {
            md += `## ${mem.title}\n\n`;
            md += `**Type:** ${mem.type} | **Tags:** ${(mem.tags as string[] ?? []).join(", ")}\n\n`;
            md += `${mem.content}\n\n`;
            if (item.note) md += `> Note: ${item.note}\n\n`;
            md += `---\n\n`;
          }
        }
      }

      await updateContextPackMarkdown(input.id, md);
      return { markdown: md };
    }),

    delete: ownerProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteContextPack(input.id);
      return { success: true };
    }),
  }),

  // ─── Session Briefing (Phase 13) ──────────────────────────────────────────
  briefing: router({
    run: ownerProcedure.mutation(async () => {
      const runId = await runBriefingJob("manual");
      return { runId };
    }),
    list: ownerProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(briefingRuns).orderBy(desc(briefingRuns.createdAt)).limit(20);
    }),
    get: ownerProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [run] = await db.select().from(briefingRuns).where(eq(briefingRuns.id, input.id)).limit(1);
      return run ?? null;
    }),
  }),

  // ─── Memory Import (Phase 14) ─────────────────────────────────────────────
  import: router({
    bulkJson: ownerProcedure
      .input(z.object({ records: z.array(z.object({
        title: z.string(),
        content: z.string(),
        type: z.enum(["decision", "insight", "repo_summary", "note", "workflow_output"]),
        tags: z.array(z.string()).optional(),
        repoId: z.number().optional(),
      })) }))
      .mutation(async ({ input }) => bulkImportMemory(input.records)),
    parsePhaseLog: ownerProcedure
      .input(z.object({ markdown: z.string() }))
      .mutation(async ({ input }) => {
        const records = parsePhaseLogToRecords(input.markdown);
        return bulkImportMemory(records);
      }),
  }),

  // ─── Vector Search (Phase 15) ─────────────────────────────────────────────
  vectorSearch: router({
    search: ownerProcedure
      .input(z.object({ query: z.string().min(1), topK: z.number().min(1).max(20).default(5) }))
      .query(async ({ input }) => {
        const results = await semanticSearch(input.query, input.topK);
        if (results.length === 0) return [];
        const db = await getDb();
        if (!db) return [];
        const ids = results.map((r) => r.id);
        const records = await db.select().from(memoryRecordsTable).where(inArray(memoryRecordsTable.id, ids));
        return results
          .map((r) => ({ score: r.score, record: records.find((rec) => rec.id === r.id) ?? null }))
          .filter((r) => r.record !== null);
      }),
    backfill: ownerProcedure.mutation(async () => backfillEmbeddings()),
    ensureEmbedding: ownerProcedure
      .input(z.object({ memoryId: z.number() }))
      .mutation(async ({ input }) => { await ensureEmbedding(input.memoryId); return { success: true }; }),
  }),

  // ─── Desk Connections (Phase 16) ──────────────────────────────────────────
  deskConnections: router({
    list: ownerProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(deskConnections).orderBy(deskConnections.name);
    }),
    create: ownerProcedure
      .input(z.object({ name: z.string().min(1), baseUrl: z.string().url(), apiKey: z.string().optional() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [result] = await db.insert(deskConnections).values(input);
        return { id: (result as any).insertId as number };
      }),
    ping: ownerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => pingDeskConnection(input.id)),
    pingAll: ownerProcedure.mutation(async () => pingAllDeskConnections()),
    delete: ownerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.delete(deskConnections).where(eq(deskConnections.id, input.id));
        return { success: true };
      }),
  }),

  // ─── Workflow Triggers (Phase 17) ─────────────────────────────────────────
  workflowTriggers: router({
    list: ownerProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(workflowTriggers).orderBy(workflowTriggers.workflowId);
    }),
    create: ownerProcedure
      .input(z.object({
        workflowId: z.number(),
        eventType: z.enum(["memory_created", "memory_tagged", "manual"]),
        filterTags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [result] = await db.insert(workflowTriggers).values({ ...input, filterTags: input.filterTags ?? [], isActive: true });
        return { id: (result as any).insertId as number };
      }),
    toggle: ownerProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(workflowTriggers).set({ isActive: input.isActive }).where(eq(workflowTriggers.id, input.id));
        return { success: true };
      }),
    delete: ownerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.delete(workflowTriggers).where(eq(workflowTriggers.id, input.id));
        return { success: true };
      }),
    runWorkflow: ownerProcedure
      .input(z.object({ workflowId: z.number() }))
      .mutation(async ({ input }) => { await runWorkflow(input.workflowId); return { success: true }; }),
  }),

  // ─── AI Chat ──────────────────────────────────────────────────────────────
  chat: router({
    history: ownerProcedure.query(async () => {
      return listChatMessages(100);
    }),

    send: ownerProcedure
      .input(z.object({ message: z.string().min(1) }))
      .mutation(async ({ input }) => {
        // Save user message
        await saveChatMessage({ role: "user", content: input.message });

        // Get recent memory for context
        const recentMemory = await listMemoryRecords({});
        const memoryContext = recentMemory.slice(0, 10).map((m) => `- [${m.type}] ${m.title}: ${m.content.slice(0, 200)}`).join("\n");

        // Get chat history for context
        const history = await listChatMessages(20);
        const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
          {
            role: "system",
            content: `You are the MemoryDesk AI assistant — a sophisticated, precise, and helpful intelligence layer for a personal AI-powered command center. You help the owner query their memory store, generate summaries, identify patterns, and manage knowledge.

Current memory context (most recent records):
${memoryContext}

Guidelines:
- Be concise, precise, and insightful
- Reference specific memory records when relevant
- Suggest tags, types, or connections when appropriate
- When asked to create or update records, describe what you would add clearly
- Maintain a professional, thoughtful tone`,
          },
          ...history.slice(-10).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
          { role: "user", content: input.message },
        ];

        let assistantContent: string;
        if (activeLLMProvider === "ionos") {
          const ionosResp = await ionosChat({ messages });
          const raw = ionosResp.choices?.[0]?.message?.content;
          assistantContent = typeof raw === "string" ? raw : "I was unable to generate a response.";
        } else {
          const response = await invokeLLM({ messages });
          const rawContent = response.choices?.[0]?.message?.content;
          assistantContent = typeof rawContent === "string" ? rawContent : "I was unable to generate a response.";
        }

        await saveChatMessage({ role: "assistant", content: assistantContent });
        return { reply: assistantContent };
      }),

    clear: ownerProcedure.mutation(async () => {
      await clearChatHistory();
      return { success: true };
    }),
  }),

  // ─── Settings (Phase 19) ─────────────────────────────────────────────────────
  settings: router({
    getLLMProvider: ownerProcedure.query(() => {
      const providers: Array<{ id: LLMProvider; name: string; configured: boolean }> = [
        { id: "builtin", name: "Manus Built-in (default)", configured: true },
        { id: "ionos", name: "IONOS AI Model Hub", configured: !!ENV.ionosApiKey },
      ];
      return { active: activeLLMProvider, providers };
    }),

    setLLMProvider: ownerProcedure
      .input(z.object({ provider: z.enum(["builtin", "ionos"]) }))
      .mutation(({ input }) => {
        activeLLMProvider = input.provider;
        return { active: activeLLMProvider };
      }),

    testLLMProvider: ownerProcedure
      .input(z.object({ provider: z.enum(["builtin", "ionos"]) }))
      .mutation(async ({ input }) => {
        if (input.provider === "ionos") {
          return ionosTestConnection();
        }
        // Built-in: quick ping via invokeLLM
        try {
          const start = Date.now();
          const resp = await invokeLLM({ messages: [{ role: "user", content: "ping" }] });
          const latencyMs = Date.now() - start;
          return { ok: true as const, model: "builtin", latencyMs };
        } catch (err) {
          return { ok: false as const, error: String(err) };
        }
      }),

    listIONOSModels: ownerProcedure.query(async () => {
      return ionosListModels();
    }),
  }),

  // ─── Graph Memory (Phase 20) ───────────────────────────────────────────────────
  graph: router({
    getSubgraph: ownerProcedure.query(async () => {
      return getSubgraph();
    }),

    listNodes: ownerProcedure.query(async () => {
      return listNodes();
    }),

    searchNodes: ownerProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ input }) => {
        return searchNodes(input.query);
      }),

    addNode: ownerProcedure
      .input(z.object({
        label: z.string().min(1).max(255),
        type: z.enum(["entity", "concept", "decision", "event", "person", "project"]).optional(),
        properties: z.record(z.string(), z.unknown()).optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await addNode({ label: input.label, type: input.type ?? "entity", properties: input.properties });
        return { id };
      }),

    addEdge: ownerProcedure
      .input(z.object({
        fromId: z.number(),
        toId: z.number(),
        relation: z.string().min(1).max(128),
        weight: z.number().int().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await addEdge({ fromId: input.fromId, toId: input.toId, relation: input.relation, weight: input.weight ?? 1 });
        return { id };
      }),

    findRelated: ownerProcedure
      .input(z.object({ nodeId: z.number(), depth: z.number().int().min(1).max(4).optional() }))
      .query(async ({ input }) => {
        return findRelated(input.nodeId, input.depth ?? 2);
      }),

    deleteNode: ownerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteNode(input.id);
        return { success: true };
      }),
  }),

  // ─── Agent Tasks (Phase 21) ───────────────────────────────────────────────────
  agentTasks: router({
    list: ownerProcedure
      .input(z.object({ agentId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const rows = await db.select().from(agentTasks)
          .orderBy(desc(agentTasks.dispatchedAt));
        if (input?.agentId) return rows.filter((r) => r.agentId === input.agentId);
        return rows;
      }),

    get: ownerProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        const rows = await db.select().from(agentTasks).where(eq(agentTasks.id, input.id));
        return rows[0] ?? null;
      }),

    dispatch: ownerProcedure
      .input(z.object({
        agentId: z.number(),
        title: z.string().min(1).max(255),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        // Fetch agent info
        const agentRows = await db.select().from(agents).where(eq(agents.id, input.agentId));
        const agent = agentRows[0];
        if (!agent) throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });

        // Create task record as pending
        const [insertResult] = await db.insert(agentTasks).values({
          agentId: input.agentId,
          title: input.title,
          description: input.description,
          status: "running",
        });
        const taskId = (insertResult as { insertId: number }).insertId;

        // Dispatch asynchronously — update status on completion
        dispatchAgentTask({
          agentName: agent.name,
          agentRole: agent.role,
          title: input.title,
          description: input.description,
        }).then(async (result) => {
          const finalStatus = result.ok ? "done" : "failed";
          await db.update(agentTasks)
            .set({ status: finalStatus, result: result.output ?? result.error, completedAt: new Date() })
            .where(eq(agentTasks.id, taskId));
        }).catch(async (err) => {
          await db.update(agentTasks)
            .set({ status: "failed", result: String(err), completedAt: new Date() })
            .where(eq(agentTasks.id, taskId));
        });

        return { taskId, status: "running" as const };
      }),

    cancel: ownerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        await db.update(agentTasks)
          .set({ status: "cancelled", completedAt: new Date() })
          .where(eq(agentTasks.id, input.id));
        return { success: true };
      }),
  }),

  // ─── Backup / Export (Phase 24) ──────────────────────────────────────────────
  backup: router({
    export: ownerProcedure.query(async () => {
      return exportAll();
    }),
  }),

  // ─── Analytics (Phase 22) ───────────────────────────────────────────────────
  analytics: router({
    summary: ownerProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { byType: [], totalRecords: 0, totalAgentTasks: 0, totalNodes: 0 };

      // Count by type
      const byTypeRows = await db
        .select({ type: memoryRecordsTable.type, count: count() })
        .from(memoryRecordsTable)
        .groupBy(memoryRecordsTable.type);

      const totalRecords = byTypeRows.reduce((s, r) => s + Number(r.count), 0);

      const [taskCountRow] = await db.select({ count: count() }).from(agentTasks);
      const [nodeCountRow] = await db.select({ count: count() }).from(kgNodes);

      return {
        byType: byTypeRows.map((r) => ({ type: r.type, count: Number(r.count) })),
        totalRecords,
        totalAgentTasks: Number(taskCountRow?.count ?? 0),
        totalNodes: Number(nodeCountRow?.count ?? 0),
      };
    }),

    growthSeries: ownerProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];

      const since = new Date();
      since.setDate(since.getDate() - 30);

      // Group by date using DATE() function
      const rows = await db
        .select({
          day: sql<string>`DATE(${memoryRecordsTable.createdAt})`,
          count: count(),
        })
        .from(memoryRecordsTable)
        .where(gte(memoryRecordsTable.createdAt, since))
        .groupBy(sql`DATE(${memoryRecordsTable.createdAt})`)
        .orderBy(sql`DATE(${memoryRecordsTable.createdAt})`);

      return rows.map((r) => ({ day: r.day, count: Number(r.count) }));
    }),

    tagCloud: ownerProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];

      const records = await db.select({ tags: memoryRecordsTable.tags }).from(memoryRecordsTable);
      const freq: Record<string, number> = {};
      for (const row of records) {
        const tags = Array.isArray(row.tags) ? row.tags as string[] : [];
        for (const tag of tags) {
          if (tag) freq[tag] = (freq[tag] ?? 0) + 1;
        }
      }
      return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .map(([tag, count]) => ({ tag, count }));
    }),
  }),
});

export type AppRouter = typeof appRouter;
