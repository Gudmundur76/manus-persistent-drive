/**
 * ionosProvider.ts
 * Phase 19 — IONOS AI Model Hub sovereign model inference provider.
 * Uses IONOS_API_KEY and IONOS_API_URL environment variables.
 * IONOS exposes an OpenAI-compatible /v1/chat/completions endpoint.
 */

export interface IONOSMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface IONOSChatOptions {
  messages: IONOSMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface IONOSChatResponse {
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  model: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export interface IONOSModel {
  id: string;
  object: string;
  created?: number;
  owned_by?: string;
}

/** Retrieve the IONOS base URL, stripping trailing slash. */
function getBaseUrl(): string {
  const url = process.env.IONOS_API_URL ?? "https://openai.inference.de-txl.ionos.com";
  return url.replace(/\/$/, "");
}

/** Retrieve the IONOS API key. */
function getApiKey(): string {
  return process.env.IONOS_API_KEY ?? "";
}

/**
 * Send a chat completion request to the IONOS AI Model Hub.
 * Returns the raw OpenAI-compatible response object.
 */
export async function ionosChat(opts: IONOSChatOptions): Promise<IONOSChatResponse> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("IONOS_API_KEY is not configured");
  }
  const baseUrl = getBaseUrl();
  const model = opts.model ?? "meta-llama-3.1-8b-instruct";

  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.max_tokens ?? 1024,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`IONOS API error ${res.status}: ${errText}`);
  }

  return res.json() as Promise<IONOSChatResponse>;
}

/**
 * List available models from the IONOS AI Model Hub.
 */
export async function ionosListModels(): Promise<IONOSModel[]> {
  const apiKey = getApiKey();
  if (!apiKey) return [];
  const baseUrl = getBaseUrl();

  try {
    const res = await fetch(`${baseUrl}/v1/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { data?: IONOSModel[] };
    return data.data ?? [];
  } catch {
    return [];
  }
}

/**
 * Test connectivity to the IONOS AI Model Hub.
 * Returns { ok: true, model } on success or { ok: false, error } on failure.
 */
export async function ionosTestConnection(): Promise<
  { ok: true; model: string; latencyMs: number } | { ok: false; error: string }
> {
  const start = Date.now();
  try {
    const result = await ionosChat({
      messages: [{ role: "user", content: "Reply with exactly: IONOS_OK" }],
      max_tokens: 16,
    });
    const latencyMs = Date.now() - start;
    const content = result.choices?.[0]?.message?.content ?? "";
    return { ok: true, model: result.model, latencyMs };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
