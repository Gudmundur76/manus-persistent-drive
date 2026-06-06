/**
 * server/_core/logger.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Pino structured logger with correlation ID support.
 *
 * Usage:
 *   import { logger, createRequestLogger, withCorrelationId } from "./_core/logger";
 *
 *   // In Express middleware:
 *   app.use(createRequestLogger());
 *
 *   // In tRPC middleware:
 *   const child = withCorrelationId(correlationId);
 *   child.info({ procedure: "claims.list" }, "tRPC call");
 *
 *   // Direct logging:
 *   logger.info({ userId: "123" }, "User logged in");
 *   logger.error({ err }, "Pipeline failed");
 */

import pino from "pino";
import pinoHttp from "pino-http";
import { ENV } from "./env";

// ─── Root logger ──────────────────────────────────────────────────────────────

export const logger = pino({
  level: ENV.isProduction ? "info" : "debug",
  // Pretty-print in development; JSON in production for log aggregators
  transport: ENV.isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss.l",
          ignore: "pid,hostname",
        },
      },
  base: {
    service: "protein-truth-desk",
    env: ENV.isProduction ? "production" : "development",
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
});

// ─── HTTP request logger middleware ──────────────────────────────────────────

/**
 * Express middleware that logs every HTTP request with method, url, status,
 * response time, and a unique correlation ID injected into req.id.
 */
export function createRequestLogger() {
  return pinoHttp({
    logger,
    // Generate a correlation ID for every request
    genReqId: (req) => {
      const existing = req.headers["x-correlation-id"];
      if (typeof existing === "string" && existing.length > 0) return existing;
      return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    },
    // Attach correlation ID to response headers
    customSuccessMessage: (req, res) =>
      `${req.method} ${req.url} → ${res.statusCode}`,
    customErrorMessage: (req, res, err) =>
      `${req.method} ${req.url} → ${res.statusCode} [${err.message}]`,
    // Skip health check spam
    autoLogging: {
      ignore: (req) =>
        req.url === "/api/health" ||
        req.url === "/api/health/detailed" ||
        (req.url?.startsWith("/api/trpc/auth.me") ?? false),
    },
    // Redact sensitive headers
    redact: {
      paths: ["req.headers.authorization", "req.headers.cookie"],
      censor: "[REDACTED]",
    },
  });
}

// ─── Correlation ID child logger ──────────────────────────────────────────────

/**
 * Creates a child logger bound to a specific correlation ID.
 * Use inside tRPC procedures to trace a single request end-to-end.
 */
export function withCorrelationId(correlationId: string): pino.Logger {
  return logger.child({ correlationId });
}

/**
 * Creates a child logger for a specific tRPC procedure call.
 * Includes the procedure path and correlation ID.
 */
export function createProcedureLogger(
  procedure: string,
  correlationId?: string
): pino.Logger {
  return logger.child({
    procedure,
    ...(correlationId ? { correlationId } : {}),
  });
}
