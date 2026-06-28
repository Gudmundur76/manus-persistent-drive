/**
 * ctc_bridge_tools.mjs
 * 7 new MRAgent-powered tools for the cbm-bridge.mjs MCP server.
 *
 * These tools expose the Cue-Tag-Content graph layer built by ctc_indexer.py.
 * They run a Python sidecar (ctc_sidecar.py) for queries that require the
 * evolva_mragent library, and serve simple lookups directly from the SQLite DB.
 *
 * Integration: imported and registered by cbm-bridge.mjs
 */

import { execFile, spawn } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import Database from "better-sqlite3";

const execFileAsync = promisify(execFile);

const CTC_DB_PATH = join(homedir(), ".codebase-memory", "ctc_graph.db");
const EVOLVA_MRAGENT_PATH = join(homedir(), "evolva-mragent");
const SIDECAR_PATH = join(homedir(), "manus-persistent-drive", ".codebase-memory", "ctc_sidecar.py");
const PYTHON = process.env.PYTHON_BIN || "python3";

// ── SQLite helpers ────────────────────────────────────────────────────────────

let _db = null;

function getDb() {
  if (_db) return _db;
  if (!existsSync(CTC_DB_PATH)) return null;
  try {
    _db = new Database(CTC_DB_PATH, { readonly: true });
    return _db;
  } catch (e) {
    console.error("[ctc] Failed to open CTC DB:", e.message);
    return null;
  }
}

function dbQuery(sql, params = []) {
  const db = getDb();
  if (!db) return [];
  try {
    return db.prepare(sql).all(...params);
  } catch (e) {
    console.error("[ctc] DB query error:", e.message);
    return [];
  }
}

// ── Python sidecar for LLM-powered queries ────────────────────────────────────

async function callSidecar(method, args) {
  const input = JSON.stringify({ method, args });
  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON, [SIDECAR_PATH], {
      env: { ...process.env, PYTHONPATH: EVOLVA_MRAGENT_PATH },
    });
    let stdout = "";
    let stderr = "";
    proc.stdin.write(input + "\n");
    proc.stdin.end();
    proc.stdout.on("data", (d) => (stdout += d));
    proc.stderr.on("data", (d) => (stderr += d));
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Sidecar exited ${code}: ${stderr.slice(0, 500)}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch (e) {
        reject(new Error(`Sidecar JSON parse error: ${stdout.slice(0, 200)}`));
      }
    });
    proc.on("error", reject);
    // 60s timeout
    setTimeout(() => {
      proc.kill();
      reject(new Error("Sidecar timeout (60s)"));
    }, 60000);
  });
}

// ── Tool implementations ──────────────────────────────────────────────────────

/**
 * Tool 1: ctc_edges_by_tag
 * Follow cue→tag→content edges in the CTC graph.
 * Direct SQLite lookup — no LLM required.
 */
export function ctcEdgesByTag({ key, tag }) {
  if (!existsSync(CTC_DB_PATH)) {
    return { error: "CTC graph not built yet. Run ctc_indexer.py first." };
  }

  // Find all event_ids for this key+tag combination
  const rows = dbQuery(
    `SELECT kn.key_id, kn.tag_dict
     FROM key_nodes kn
     WHERE LOWER(kn.key_id) = LOWER(?) OR LOWER(kn.text) = LOWER(?)`,
    [key, key]
  );

  if (!rows.length) {
    return { key, tag, events: [], message: `No cue found for '${key}'` };
  }

  const events = [];
  for (const row of rows) {
    let tagDict;
    try {
      tagDict = JSON.parse(row.tag_dict);
    } catch {
      continue;
    }
    const eventIds = tagDict[tag] || [];
    for (const eid of eventIds) {
      const evRows = dbQuery(
        "SELECT event_id, text, origin, time, domain, repo FROM episode_events WHERE event_id = ?",
        [eid]
      );
      for (const ev of evRows) {
        events.push({
          event_id: ev.event_id,
          text: ev.text,
          origin: ev.origin,
          time: ev.time,
          domain: ev.domain,
          repo: ev.repo,
        });
      }
    }
  }

  return { key, tag, events, count: events.length };
}

/**
 * Tool 2: ctc_query_event_context
 * Get surrounding turns for an event.
 */
export function ctcQueryEventContext({ event_id }) {
  if (!existsSync(CTC_DB_PATH)) {
    return { error: "CTC graph not built yet." };
  }

  // Get the event itself
  const ev = dbQuery(
    "SELECT event_id, text, origin, time FROM episode_events WHERE event_id = ?",
    [event_id]
  )[0];

  if (!ev) {
    return { event_id, context: [], message: "Event not found" };
  }

  // Parse origin: D<session>:<turn>
  const originMatch = ev.origin.match(/^(D\d+):(\d+)$/);
  if (!originMatch) {
    return { event_id, context: [{ event_id, text: ev.text, origin: ev.origin }] };
  }

  const prefix = originMatch[1];
  const turn = parseInt(originMatch[2]);
  const context = [];

  // Get events from turns -1, 0, +1
  for (let delta = -1; delta <= 1; delta++) {
    const targetTurn = turn + delta;
    const targetOrigin = `${prefix}:${targetTurn}`;
    const surrounding = dbQuery(
      "SELECT event_id, text, origin, time FROM episode_events WHERE origin = ? ORDER BY event_id",
      [targetOrigin]
    );
    for (const s of surrounding) {
      context.push({
        event_id: s.event_id,
        text: s.text,
        origin: s.origin,
        time: s.time,
        is_target: delta === 0,
      });
    }
  }

  return { event_id, context };
}

/**
 * Tool 3: ctc_query_event_keywords
 * Get all cues associated with an event.
 */
export function ctcQueryEventKeywords({ event_id }) {
  if (!existsSync(CTC_DB_PATH)) {
    return { error: "CTC graph not built yet." };
  }

  const rows = dbQuery(
    "SELECT key_id FROM event_to_keys WHERE event_id = ?",
    [event_id]
  );

  const keywords = [];
  for (const row of rows) {
    const kn = dbQuery(
      "SELECT key_id, text, tag_list FROM key_nodes WHERE key_id = ?",
      [row.key_id]
    )[0];
    if (kn) {
      keywords.push({
        key: kn.key_id,
        text: kn.text,
        tags: JSON.parse(kn.tag_list || "[]"),
      });
    }
  }

  return { event_id, keywords, count: keywords.length };
}

/**
 * Tool 4: ctc_query_topic_events
 * Get all events under a topic.
 */
export function ctcQueryTopicEvents({ topic_id }) {
  if (!existsSync(CTC_DB_PATH)) {
    return { error: "CTC graph not built yet." };
  }

  const topic = dbQuery(
    "SELECT topic_id, text, event_list FROM topics WHERE topic_id = ?",
    [topic_id]
  )[0];

  if (!topic) {
    // Try partial match
    const matches = dbQuery(
      "SELECT topic_id, text, event_list FROM topics WHERE topic_id LIKE ? LIMIT 5",
      [`%${topic_id}%`]
    );
    if (!matches.length) {
      return { topic_id, events: [], message: "Topic not found" };
    }
    // Return first match
    const t = matches[0];
    const eventIds = JSON.parse(t.event_list || "[]");
    const events = eventIds.map((eid) => {
      const ev = dbQuery(
        "SELECT event_id, text, origin, time FROM episode_events WHERE event_id = ?",
        [eid]
      )[0];
      return ev || { event_id: eid, text: "(not found)" };
    });
    return { topic_id: t.topic_id, topic_text: t.text, events };
  }

  const eventIds = JSON.parse(topic.event_list || "[]");
  const events = eventIds.map((eid) => {
    const ev = dbQuery(
      "SELECT event_id, text, origin, time FROM episode_events WHERE event_id = ?",
      [eid]
    )[0];
    return ev || { event_id: eid, text: "(not found)" };
  });

  return { topic_id, topic_text: topic.text, events, count: events.length };
}

/**
 * Tool 5: ctc_query_author_contributions
 * List contribution aspects for an author (maps to query_personal_information).
 */
export function ctcQueryAuthorContributions({ author }) {
  if (!existsSync(CTC_DB_PATH)) {
    return { error: "CTC graph not built yet." };
  }

  // Find all unique tags for this person
  const rows = dbQuery(
    "SELECT DISTINCT tag FROM personas WHERE LOWER(person) = LOWER(?)",
    [author]
  );

  const aspects = rows.map((r) => r.tag);
  return { author, aspects, count: aspects.length };
}

/**
 * Tool 6: ctc_temporal_query
 * Get all events in a date range.
 */
export function ctcTemporalQuery({ start_date, end_date }) {
  if (!existsSync(CTC_DB_PATH)) {
    return { error: "CTC graph not built yet." };
  }

  const rows = dbQuery(
    `SELECT t.date_str, t.event_id, e.text, e.origin, e.domain, e.repo
     FROM timeline t
     JOIN episode_events e ON t.event_id = e.event_id
     WHERE t.date_str >= ? AND t.date_str <= ?
     ORDER BY t.date_str DESC
     LIMIT 100`,
    [start_date, end_date]
  );

  return {
    start_date,
    end_date,
    events: rows,
    count: rows.length,
  };
}

/**
 * Tool 7: ctc_active_reconstruct
 * Run the full MRAgent active reconstruction loop for a question.
 * Calls the Python sidecar (requires LLM API key).
 */
export async function ctcActiveReconstruct({ question, domain = "codebase" }) {
  if (!existsSync(CTC_DB_PATH)) {
    return { error: "CTC graph not built yet. Run ctc_indexer.py first." };
  }

  try {
    const result = await callSidecar("reconstruct", { question, domain });
    return result;
  } catch (e) {
    return {
      error: e.message,
      question,
      answer: "Reconstruction failed — check sidecar logs.",
      confidence: "low",
    };
  }
}

// ── Tool registry for cbm-bridge.mjs ─────────────────────────────────────────

export const CTC_TOOLS = [
  {
    name: "ctc_edges_by_tag",
    description: "Follow cue→tag→content edges in the CTC memory graph. Primary traversal for semantic queries about the codebase. Returns events linked to a cue via a semantic tag.",
    inputSchema: {
      type: "object",
      properties: {
        key: { type: "string", description: "The cue/keyword to look up (e.g., function name, module, author)" },
        tag: { type: "string", description: "The semantic tag to follow (e.g., BugFix, Feature, Refactor, APIChange, Auth, MCP)" },
      },
      required: ["key", "tag"],
    },
    handler: ctcEdgesByTag,
    async: false,
  },
  {
    name: "ctc_query_event_context",
    description: "Get the surrounding turns (adjacent commits/changes) for a specific event. Use when you need more context around a change.",
    inputSchema: {
      type: "object",
      properties: {
        event_id: { type: "string", description: "The event ID (e.g., D1:3-2)" },
      },
      required: ["event_id"],
    },
    handler: ctcQueryEventContext,
    async: false,
  },
  {
    name: "ctc_query_event_keywords",
    description: "Get all cues (keywords/entities) associated with a specific event. Use to find related concepts from a known event.",
    inputSchema: {
      type: "object",
      properties: {
        event_id: { type: "string", description: "The event ID" },
      },
      required: ["event_id"],
    },
    handler: ctcQueryEventKeywords,
    async: false,
  },
  {
    name: "ctc_query_topic_events",
    description: "Get all events under an architectural topic. Use to explore a theme like 'citation pipeline' or 'auth flow'.",
    inputSchema: {
      type: "object",
      properties: {
        topic_id: { type: "string", description: "The topic ID or partial name" },
      },
      required: ["topic_id"],
    },
    handler: ctcQueryTopicEvents,
    async: false,
  },
  {
    name: "ctc_query_author_contributions",
    description: "List contribution aspects for an author. Returns the semantic categories of their contributions (BugFix, Feature, etc.).",
    inputSchema: {
      type: "object",
      properties: {
        author: { type: "string", description: "Author name or email" },
      },
      required: ["author"],
    },
    handler: ctcQueryAuthorContributions,
    async: false,
  },
  {
    name: "ctc_temporal_query",
    description: "Get all codebase changes in a date range. Returns events ordered by date descending.",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Start date YYYY-MM-DD" },
        end_date: { type: "string", description: "End date YYYY-MM-DD" },
      },
      required: ["start_date", "end_date"],
    },
    handler: ctcTemporalQuery,
    async: false,
  },
  {
    name: "ctc_active_reconstruct",
    description: "Run the full MRAgent active reconstruction loop to answer a natural language question about the codebase. Uses iterative graph traversal with LLM reasoning. Best for complex multi-hop questions.",
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string", description: "Natural language question about the codebase" },
        domain: { type: "string", enum: ["codebase", "citation", "cognitive_loop", "decision"], default: "codebase" },
      },
      required: ["question"],
    },
    handler: ctcActiveReconstruct,
    async: true,
  },
];
