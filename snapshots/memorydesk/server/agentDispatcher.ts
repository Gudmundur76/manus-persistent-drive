/**
 * agentDispatcher.ts
 * Phase 21 — Agent Task Dispatch.
 * Dispatches tasks to Manus agents via the ASIONE coordApi (ASI:One ecosystem).
 * Falls back to invokeLLM if ASIONE is not configured.
 */

import { invokeLLM } from "./_core/llm";
import { ENV } from "./_core/env";

export interface DispatchResult {
  ok: boolean;
  taskId?: string;
  output?: string;
  error?: string;
  provider: "asione" | "builtin_llm";
}

/**
 * Dispatch a task to an agent.
 * If ASIONE env var is set, attempts to call the ASI:One coordApi.
 * Otherwise falls back to invokeLLM with an agent-persona system prompt.
 */
export async function dispatchAgentTask(opts: {
  agentName: string;
  agentRole: string;
  title: string;
  description?: string;
}): Promise<DispatchResult> {
  const { agentName, agentRole, title, description } = opts;

  // ── Try ASIONE coordApi ────────────────────────────────────────────────────
  if (ENV.asioneCoordApi) {
    try {
      const body = {
        task: {
          title,
          description: description ?? title,
          agent: agentName,
          role: agentRole,
        },
      };

      const res = await fetch(`https://api.asi.one/v1/coord/dispatch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ENV.asioneCoordApi}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });

      if (res.ok) {
        const data = (await res.json()) as { taskId?: string; output?: string };
        return {
          ok: true,
          taskId: data.taskId,
          output: data.output ?? `Task dispatched to ${agentName} via ASI:One.`,
          provider: "asione",
        };
      }

      const errText = await res.text().catch(() => "unknown error");
      console.warn(`[agentDispatcher] ASIONE dispatch failed (${res.status}): ${errText}. Falling back to built-in LLM.`);
    } catch (err) {
      console.warn("[agentDispatcher] ASIONE request error:", err, "— falling back to built-in LLM.");
    }
  }

  // ── Fallback: invokeLLM with agent persona ─────────────────────────────────
  try {
    const systemPrompt = [
      `You are ${agentName}, a specialized AI agent with the role: ${agentRole}.`,
      "You have been dispatched a task. Respond with a clear, structured result.",
      "Be concise and actionable. Format your response in markdown.",
    ].join(" ");

    const userMessage = description
      ? `Task: ${title}\n\nDetails:\n${description}`
      : `Task: ${title}`;

    const resp = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const output = (resp as { choices?: Array<{ message?: { content?: string } }> })
      ?.choices?.[0]?.message?.content ?? "Task completed.";

    return {
      ok: true,
      output,
      provider: "builtin_llm",
    };
  } catch (err) {
    return {
      ok: false,
      error: String(err),
      provider: "builtin_llm",
    };
  }
}
