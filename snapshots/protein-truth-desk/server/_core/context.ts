import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  /** Unique correlation ID for end-to-end request tracing (set by pino-http) */
  correlationId: string;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // pino-http sets req.id via genReqId; fall back to a generated ID
  const correlationId =
    (opts.req as unknown as { id?: string }).id ??
    `trpc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

  return {
    req: opts.req,
    res: opts.res,
    user,
    correlationId,
  };
}
