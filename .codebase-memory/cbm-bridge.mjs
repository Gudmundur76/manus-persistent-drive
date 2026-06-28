#!/usr/bin/env node
/**
 * cbm-bridge.mjs — HTTP-to-MCP bridge for codebase-memory-mcp
 *
 * Handles session lifecycle automatically. Each SSE connection gets an isolated
 * stdio process for the codebase-memory-mcp binary (14 structural tools).
 *
 * Additionally exposes 7 CTC (Cue-Tag-Content / MRAgent) tools directly from
 * the SQLite CTC graph built by ctc_indexer.py.
 *
 * Total tools: 21 (14 structural + 7 CTC)
 */

import http from 'http';
import { spawn } from 'child_process';
import { URL } from 'url';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { createRequire } from 'module';

const PORT = process.env.MCP_PORT || 8811;
const MCP_BINARY = process.env.MCP_BINARY || 'codebase-memory-mcp';
const CTC_TOOLS_PATH = join(homedir(), 'manus-persistent-drive', '.codebase-memory', 'ctc_bridge_tools.mjs');

// ── Load CTC tools (optional — graceful degradation if not built yet) ─────────

let CTC_TOOLS = [];
let ctcHandlers = {};

async function loadCtcTools() {
  if (!existsSync(CTC_TOOLS_PATH)) {
    console.log('[bridge] CTC tools not found — running without MRAgent layer');
    return;
  }
  try {
    const mod = await import(CTC_TOOLS_PATH);
    CTC_TOOLS = mod.CTC_TOOLS || [];
    for (const tool of CTC_TOOLS) {
      ctcHandlers[tool.name] = tool;
    }
    console.log(`[bridge] Loaded ${CTC_TOOLS.length} CTC tools from MRAgent layer`);
  } catch (e) {
    console.error('[bridge] Failed to load CTC tools:', e.message);
  }
}

// ── Session management ────────────────────────────────────────────────────────

const sessions = new Map();

function mcpRequest(method, params = {}) {
  return {
    jsonrpc: '2.0',
    id: randomUUID(),
    method,
    params,
  };
}

function createSession(sessionId) {
  const child = spawn(MCP_BINARY, [], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.env.MCP_CWD || '/home/ubuntu',
  });

  let buffer = '';
  const pending = new Map();

  child.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        const pendingReq = pending.get(msg.id);
        if (pendingReq) {
          clearTimeout(pendingReq.timer);
          pending.delete(msg.id);
          pendingReq.resolve(msg);
        }
      } catch {
        // ignore non-JSON lines
      }
    }
  });

  child.stderr.on('data', (d) => {
    console.error(`[mcp ${sessionId.slice(0, 8)}]`, d.toString().trim());
  });

  child.on('exit', (code) => {
    console.log(`[mcp ${sessionId.slice(0, 8)}] exited with code ${code}`);
    sessions.delete(sessionId);
  });

  const session = {
    id: sessionId,
    child,
    pending,
    request: (method, params) => {
      return new Promise((resolve, reject) => {
        const req = mcpRequest(method, params);
        pending.set(req.id, {
          resolve,
          reject,
          timer: setTimeout(() => {
            pending.delete(req.id);
            reject(new Error(`Timeout: ${method}`));
          }, 30000),
        });
        child.stdin.write(JSON.stringify(req) + '\n');
      });
    },
  };

  // Initialize the MCP connection
  session.request('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'evolva-bridge', version: '2.0.0' },
  }).then(() => {
    child.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    }) + '\n');
  }).catch((e) => {
    console.error(`[mcp ${sessionId.slice(0, 8)}] init error:`, e.message);
  });

  sessions.set(sessionId, session);
  return session;
}

// ── CTC tool dispatch ─────────────────────────────────────────────────────────

async function dispatchCtcTool(toolName, toolArgs) {
  const tool = ctcHandlers[toolName];
  if (!tool) {
    return {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32601, message: `CTC tool not found: ${toolName}` },
    };
  }

  try {
    let result;
    if (tool.async) {
      result = await tool.handler(toolArgs);
    } else {
      result = tool.handler(toolArgs);
    }
    return {
      jsonrpc: '2.0',
      id: null,
      result: {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      },
    };
  } catch (e) {
    return {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32603, message: e.message },
    };
  }
}

// ── tools/list augmentation ───────────────────────────────────────────────────

function augmentToolsList(mcpResponse) {
  if (!mcpResponse?.result?.tools || CTC_TOOLS.length === 0) return mcpResponse;

  const ctcToolDefs = CTC_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  }));

  return {
    ...mcpResponse,
    result: {
      ...mcpResponse.result,
      tools: [...mcpResponse.result.tools, ...ctcToolDefs],
    },
  };
}

// ── HTTP server ───────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── SSE endpoint ──────────────────────────────────────────────────────────
  if (url.pathname === '/sse') {
    const sessionId = randomUUID();
    const session = createSession(sessionId);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    res.write(`event: endpoint\ndata: /message?sessionId=${sessionId}\n\n`);

    const keepalive = setInterval(() => {
      res.write(':keepalive\n\n');
    }, 15000);

    req.on('close', () => {
      clearInterval(keepalive);
      session.child.kill();
      sessions.delete(sessionId);
      console.log(`[sse] Session ${sessionId.slice(0, 8)} closed`);
    });

    return;
  }

  // ── Message endpoint ──────────────────────────────────────────────────────
  if (url.pathname === '/message') {
    const sessionId = url.searchParams.get('sessionId');
    if (!sessionId || !sessions.has(sessionId)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Session not found. Connect to /sse first.' }));
      return;
    }

    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const msg = JSON.parse(body);
        const session = sessions.get(sessionId);

        // Notifications — fire and forget
        if (!msg.id) {
          session.child.stdin.write(JSON.stringify(msg) + '\n');
          res.writeHead(202);
          res.end();
          return;
        }

        // tools/call — check if it's a CTC tool
        if (msg.method === 'tools/call') {
          const toolName = msg.params?.name || '';
          if (ctcHandlers[toolName]) {
            const ctcResult = await dispatchCtcTool(toolName, msg.params?.arguments || {});
            ctcResult.id = msg.id;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(ctcResult));
            return;
          }
        }

        // tools/list — augment with CTC tools
        if (msg.method === 'tools/list') {
          const mcpResult = await session.request(msg.method, msg.params);
          const augmented = augmentToolsList(mcpResult);
          augmented.id = msg.id;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(augmented));
          return;
        }

        // All other methods — forward to codebase-memory-mcp
        const result = await session.request(msg.method, msg.params);
        result.id = msg.id;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));

      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // ── Health check ──────────────────────────────────────────────────────────
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      sessions: sessions.size,
      uptime: Math.round(process.uptime()),
      ctc_tools: CTC_TOOLS.length,
      structural_tools: 14,
      total_tools: 14 + CTC_TOOLS.length,
    }));
    return;
  }

  // ── CTC status ────────────────────────────────────────────────────────────
  if (url.pathname === '/ctc/status') {
    const ctcDbPath = join(homedir(), '.codebase-memory', 'ctc_graph.db');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ctc_db_exists: existsSync(ctcDbPath),
      ctc_db_path: ctcDbPath,
      ctc_tools_loaded: CTC_TOOLS.length,
      tool_names: CTC_TOOLS.map((t) => t.name),
    }));
    return;
  }

  res.writeHead(404);
  res.end('Not found. Use /sse, /message?sessionId=<id>, /health, or /ctc/status');
});

// ── Boot ──────────────────────────────────────────────────────────────────────

loadCtcTools().then(() => {
  server.listen(PORT, () => {
    console.log(`[bridge] codebase-memory-mcp HTTP bridge on port ${PORT}`);
    console.log(`[bridge] SSE: http://localhost:${PORT}/sse`);
    console.log(`[bridge] Health: http://localhost:${PORT}/health`);
    console.log(`[bridge] Tools: 14 structural + ${CTC_TOOLS.length} CTC = ${14 + CTC_TOOLS.length} total`);
  });
});
