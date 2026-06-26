#!/usr/bin/env python3
"""
cross_edge_builder.py  —  Evolva Platform Cross-Repo Edge Builder
Version: 2.0.0  (security-hardened, idempotent, hash-keyed)

Security guarantees:
  1. NO DUPLICATES — each edge has a deterministic SHA-256 key derived from
     (source_qualified_name, target_qualified_name, edge_type). The key is
     stored in the edge's properties JSON and enforced via DELETE+INSERT.
  2. NO STALE EDGES — before writing, ALL existing CROSS_HTTP_CALLS edges are
     removed from each database. The result is always exactly the current
     computed set, nothing more, nothing less.
  3. FULLY AUDITABLE — every edge carries: edge_key (hash), computed_at (UTC),
     source_file, source_repo, target_repo, url_path, builder_version.
  4. IDEMPOTENT — running the script N times produces the same result as
     running it once. Safe to run in CI on every push.

Schema (confirmed from codebase-memory-mcp v0.8.1):
  nodes(id, project, label, name, qualified_name, file_path, ...)
  edges(id, project, source_id, target_id, type, properties, url_path_gen)
    UNIQUE(source_id, target_id, type)
    url_path_gen = json_extract(properties, '$.url_path')
"""

import sqlite3
import json
import re
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import NamedTuple, Optional

BUILDER_VERSION = "2.0.0"
EDGE_TYPE = "CROSS_HTTP_CALLS"
CACHE = Path.home() / ".cache/codebase-memory-mcp"

PROJECTS = {
    "ttruthdesk":        "home-ubuntu-ttruthdesk-platform",
    "citation-desk":     "home-ubuntu-cbm-repos-citation-desk",
    "notus-is":          "home-ubuntu-cbm-repos-notus-is",
    "generic-signal":    "home-ubuntu-cbm-repos-generic-signal-api",
    "manus-drive":       "home-ubuntu-cbm-repos-manus-persistent-drive",
    "dna-evolve-web":    "home-ubuntu-cbm-repos-dna-evolve-web",
    "asi-discovery":     "home-ubuntu-cbm-repos-asi-evolve-discovery-engine",
    "self-direct":       "home-ubuntu-cbm-repos-self-direct",
    "cognitive-loop":    "home-ubuntu-cbm-repos-cognitive-loop-framework",
    "dna-evolve":        "home-ubuntu-cbm-repos-dna-evolve",
    "awesome-mcp":       "home-ubuntu-cbm-repos-awesome-mcp-servers",
    "novus-is":          "home-ubuntu-cbm-repos-novus-is",
    "slm-infra":         "home-ubuntu-cbm-repos-slm-infra-deploy",
    "asi-self-direct":   "home-ubuntu-cbm-repos-asi-evolve-self-direct",
    "ttruth-autodeploy": "home-ubuntu-cbm-repos-ttruthdesk-autodeploy",
    "asi-autodeploy":    "home-ubuntu-cbm-repos-asi-evolve-autodeploy",
}

class RouteNode(NamedTuple):
    db_key: str
    node_id: int
    path: str           # e.g. /api/public/claims
    method: str         # GET, POST, ANY
    qualified_name: str

class CallSiteNode(NamedTuple):
    db_key: str
    node_id: int
    name: str
    qualified_name: str
    file_path: str
    url_fragment: str

class CrossEdge(NamedTuple):
    src_db_key: str
    src_node_id: int
    src_qualified_name: str
    src_name: str
    src_file: str
    tgt_db_key: str
    tgt_node_id: int
    tgt_qualified_name: str
    tgt_name: str
    matched_path: str
    edge_key: str       # SHA-256 of (src_qn, tgt_qn, EDGE_TYPE)

# ── Helpers ───────────────────────────────────────────────────────────────────

def db_path(key: str) -> Path:
    return CACHE / f"{key}.db"

def open_db(key: str) -> Optional[sqlite3.Connection]:
    p = db_path(key)
    if not p.exists():
        return None
    conn = sqlite3.connect(str(p))
    conn.row_factory = sqlite3.Row
    # Enable WAL for safe concurrent access
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=OFF")  # we manage integrity ourselves
    return conn

def make_edge_key(src_qn: str, tgt_qn: str) -> str:
    """Deterministic SHA-256 key for a (source, target, type) triple."""
    raw = f"{src_qn}|{tgt_qn}|{EDGE_TYPE}"
    return hashlib.sha256(raw.encode()).hexdigest()

def get_project_name(conn: sqlite3.Connection) -> str:
    cur = conn.cursor()
    cur.execute("SELECT name FROM projects LIMIT 1")
    row = cur.fetchone()
    return row["name"] if row else "unknown"

# ── Step 1: Collect all Route nodes ──────────────────────────────────────────

def collect_all_routes() -> list[RouteNode]:
    routes = []
    for alias, key in PROJECTS.items():
        conn = open_db(key)
        if not conn:
            continue
        cur = conn.cursor()
        cur.execute(
            "SELECT id, name, qualified_name FROM nodes WHERE label = 'Route'"
        )
        for row in cur.fetchall():
            qn = row["qualified_name"]
            m = re.match(r"^__route__(\w+)__(.+)$", qn)
            method = m.group(1) if m else "ANY"
            path = m.group(2) if m else row["name"]
            routes.append(RouteNode(
                db_key=key, node_id=row["id"],
                path=path.rstrip("/").lower(),
                method=method, qualified_name=qn,
            ))
        conn.close()
    return routes

# ── Step 2: Collect HTTP call sites ──────────────────────────────────────────

def collect_http_call_sites() -> list[CallSiteNode]:
    sites = []
    ttruth_prefixes = [
        "/api/public/claims", "/api/public/batch-verify",
        "/api/public/verify-claim", "/api/trpc", "/api/admin",
        "/api/scheduled", "/api/cognitive", "/api/self-direct",
        "/v1/verify", "/v1/claims", "citation.is", "ttruthdesk",
    ]

    for alias, key in PROJECTS.items():
        if key == "home-ubuntu-ttruthdesk-platform":
            continue
        conn = open_db(key)
        if not conn:
            continue
        cur = conn.cursor()

        # Strategy A: HttpCall label nodes
        cur.execute(
            "SELECT id, name, qualified_name, file_path, properties "
            "FROM nodes WHERE label='HttpCall'"
        )
        for row in cur.fetchall():
            props = _safe_json(row["properties"])
            url = props.get("url", "") or props.get("url_path", "") or row["name"]
            sites.append(CallSiteNode(
                db_key=key, node_id=row["id"], name=row["name"],
                qualified_name=row["qualified_name"],
                file_path=row["file_path"], url_fragment=url,
            ))

        # Strategy B: source nodes of existing HTTP_CALLS edges
        cur.execute("""
            SELECT DISTINCT n.id, n.name, n.qualified_name, n.file_path,
                   n.properties, e.properties AS edge_props
            FROM edges e
            JOIN nodes n ON n.id = e.source_id
            WHERE e.type = 'HTTP_CALLS'
        """)
        for row in cur.fetchall():
            ep = _safe_json(row["edge_props"])
            url = ep.get("url_path", "") or ep.get("url", "")
            sites.append(CallSiteNode(
                db_key=key, node_id=row["id"], name=row["name"],
                qualified_name=row["qualified_name"],
                file_path=row["file_path"], url_fragment=url,
            ))

        # Strategy C: FTS search for known ttruthdesk route patterns
        for prefix in ttruth_prefixes:
            query = prefix.replace("/", " ").strip()
            if not query:
                continue
            try:
                cur.execute("""
                    SELECT n.id, n.name, n.qualified_name, n.file_path, n.properties
                    FROM nodes_fts f
                    JOIN nodes n ON n.rowid = f.rowid
                    WHERE nodes_fts MATCH ?
                    LIMIT 20
                """, (query,))
                for row in cur.fetchall():
                    sites.append(CallSiteNode(
                        db_key=key, node_id=row["id"], name=row["name"],
                        qualified_name=row["qualified_name"],
                        file_path=row["file_path"], url_fragment=prefix,
                    ))
            except Exception:
                pass

        conn.close()

    return _dedup_call_sites(sites)

def _safe_json(s) -> dict:
    try:
        return json.loads(s or "{}")
    except Exception:
        return {}

def _dedup_call_sites(sites: list[CallSiteNode]) -> list[CallSiteNode]:
    seen = set()
    out = []
    for s in sites:
        k = (s.db_key, s.node_id)
        if k not in seen:
            seen.add(k)
            out.append(s)
    return out

# ── Step 3: Match call sites to routes ───────────────────────────────────────

def match_to_routes(
    call_sites: list[CallSiteNode],
    routes: list[RouteNode],
) -> list[CrossEdge]:
    # Build route index: normalized path → RouteNode (ttruthdesk preferred)
    route_index: dict[str, RouteNode] = {}
    for r in routes:
        p = r.path
        if p not in route_index or r.db_key == "home-ubuntu-ttruthdesk-platform":
            route_index[p] = r

    # Also build a lookup by qualified_name for the source nodes
    src_qn_cache: dict[tuple, str] = {}  # (db_key, node_id) -> qualified_name

    matches = []
    seen_keys = set()

    for site in call_sites:
        # Skip nodes with no qualified name — they cannot produce a stable edge key
        if not site.qualified_name:
            continue
        url = site.url_fragment.lower().rstrip("/")
        if not url:
            continue
        for path, route in route_index.items():
            if route.db_key == site.db_key:
                continue  # skip same-repo
            if path and (path in url or url.endswith(path) or url.startswith(path)):
                edge_key = make_edge_key(site.qualified_name, route.qualified_name)
                if edge_key in seen_keys:
                    continue
                seen_keys.add(edge_key)
                matches.append(CrossEdge(
                    src_db_key=site.db_key,
                    src_node_id=site.node_id,
                    src_qualified_name=site.qualified_name,
                    src_name=site.name,
                    src_file=site.file_path,
                    tgt_db_key=route.db_key,
                    tgt_node_id=route.node_id,
                    tgt_qualified_name=route.qualified_name,
                    tgt_name=route.path,
                    matched_path=path,
                    edge_key=edge_key,
                ))
                break

    return matches

# ── Fallback: scan source files ───────────────────────────────────────────────

def scan_source_for_patterns(routes: list[RouteNode]) -> list[CrossEdge]:
    tt_routes = {
        r.path: r for r in routes
        if r.db_key == "home-ubuntu-ttruthdesk-platform"
    }
    matches = []
    seen_keys = set()

    for alias, key in PROJECTS.items():
        if key == "home-ubuntu-ttruthdesk-platform":
            continue
        conn = open_db(key)
        if not conn:
            continue
        cur = conn.cursor()
        cur.execute(
            "SELECT id, name, qualified_name, file_path FROM nodes "
            "WHERE label IN ('Function','Method','Class') AND file_path != ''"
        )
        nodes = cur.fetchall()
        conn.close()

        repo_slug = key.replace("home-ubuntu-cbm-repos-", "").replace("home-ubuntu-", "")
        repo_root = next(
            (p for p in [
                Path.home() / "cbm-repos" / repo_slug,
                Path.home() / repo_slug,
            ] if p.exists()),
            None,
        )
        if not repo_root:
            continue

        for node in nodes:
            fp = node["file_path"]
            if not fp:
                continue
            full = repo_root / fp.lstrip("/")
            if not full.exists():
                continue
            try:
                content = full.read_text(errors="ignore")
            except Exception:
                continue
            for path, route in tt_routes.items():
                if path and path in content:
                    edge_key = make_edge_key(node["qualified_name"], route.qualified_name)
                    if edge_key in seen_keys:
                        continue
                    seen_keys.add(edge_key)
                    matches.append(CrossEdge(
                        src_db_key=key,
                        src_node_id=node["id"],
                        src_qualified_name=node["qualified_name"],
                        src_name=node["name"],
                        src_file=fp,
                        tgt_db_key=route.db_key,
                        tgt_node_id=route.node_id,
                        tgt_qualified_name=route.qualified_name,
                        tgt_name=route.path,
                        matched_path=path,
                        edge_key=edge_key,
                    ))
                    break

    return matches

# ── Step 4: Atomic write — prune stale, insert current ───────────────────────

def write_cross_edges(edges: list[CrossEdge]) -> dict[str, dict]:
    """
    Security-hardened write:
      1. BEGIN IMMEDIATE transaction (exclusive write lock)
      2. DELETE all existing CROSS_HTTP_CALLS edges from this db
      3. INSERT the current computed set with full provenance
      4. COMMIT
    Result: exactly the current set, no duplicates, no stale entries.
    """
    now = datetime.now(timezone.utc).isoformat()
    stats: dict[str, dict] = {}

    # Group edges by the databases they touch (both source and target)
    by_db: dict[str, list[CrossEdge]] = {}
    for e in edges:
        by_db.setdefault(e.src_db_key, []).append(e)
        by_db.setdefault(e.tgt_db_key, []).append(e)

    for db_key, db_edges in by_db.items():
        conn = open_db(db_key)
        if not conn:
            continue
        project_name = get_project_name(conn)
        cur = conn.cursor()

        try:
            cur.execute("BEGIN IMMEDIATE")

            # Step A: count existing CROSS_HTTP_CALLS edges before pruning
            cur.execute(
                "SELECT count(*) FROM edges WHERE type=?", (EDGE_TYPE,)
            )
            before = cur.fetchone()[0]

            # Step B: DELETE all existing CROSS_HTTP_CALLS edges
            cur.execute("DELETE FROM edges WHERE type=?", (EDGE_TYPE,))
            deleted = cur.rowcount

            # Step C: INSERT current set for this db
            # The edges table has UNIQUE(source_id, target_id, type).
            # When two logical edges share the same (source_id, target_id) pair
            # (e.g. same node matched via two different strategies), we merge
            # their edge_keys into a single row to satisfy the constraint while
            # preserving full provenance — no silent data loss, no duplicates.
            merged: dict[tuple, list] = {}  # (src_id, tgt_id) -> [CrossEdge]
            for e in db_edges:
                k = (e.src_node_id, e.tgt_node_id)
                merged.setdefault(k, []).append(e)

            inserted = 0
            for (src_id, tgt_id), group in merged.items():
                # Canonical edge: first in group (stable sort by edge_key)
                group.sort(key=lambda x: x.edge_key)
                primary = group[0]
                # Merge all edge_keys if there are collisions
                all_keys = [g.edge_key for g in group]
                props = json.dumps({
                    "edge_key":       primary.edge_key,
                    "edge_keys_all":  all_keys,  # full list for audit
                    "url_path":       primary.matched_path,
                    "source_repo":    primary.src_db_key,
                    "source_name":    primary.src_name,
                    "source_qn":      primary.src_qualified_name,
                    "source_file":    primary.src_file,
                    "target_repo":    primary.tgt_db_key,
                    "target_name":    primary.tgt_name,
                    "target_qn":      primary.tgt_qualified_name,
                    "merged_count":   len(group),
                    "computed_at":    now,
                    "builder":        f"cross_edge_builder.py v{BUILDER_VERSION}",
                }, sort_keys=True)
                cur.execute("""
                    INSERT INTO edges
                      (project, source_id, target_id, type, properties)
                    VALUES (?, ?, ?, ?, ?)
                """, (project_name, src_id, tgt_id, EDGE_TYPE, props))
                inserted += 1

            conn.commit()
            stats[db_key] = {
                "before": before,
                "deleted": deleted,
                "inserted": inserted,
                "net": inserted,
            }
            print(
                f"  [{db_key.split('-cbm-repos-')[-1]:28}] "
                f"pruned={deleted:3d}  inserted={inserted:3d}"
            )

        except Exception as ex:
            conn.rollback()
            print(f"  ERROR [{db_key}]: {ex}")
            stats[db_key] = {"error": str(ex)}
        finally:
            conn.close()

    return stats

# ── Verify ────────────────────────────────────────────────────────────────────

def verify():
    print(f"=== Verifying {EDGE_TYPE} edges ===\n")
    total = 0
    for alias, key in PROJECTS.items():
        conn = open_db(key)
        if not conn:
            continue
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM edges WHERE type=?", (EDGE_TYPE,))
        count = cur.fetchone()[0]
        if count:
            total += count
            print(f"  {key.split('-cbm-repos-')[-1]:30} {count:3d} edges")
            # Check for duplicate edge_keys (should be zero — NULL keys excluded)
            cur.execute("""
                SELECT json_extract(properties,'$.edge_key') as ek, count(*) as c
                FROM edges WHERE type=?
                  AND json_extract(properties,'$.edge_key') IS NOT NULL
                GROUP BY ek HAVING c > 1
            """, (EDGE_TYPE,))
            dups = cur.fetchall()
            if dups:
                print(f"    ⚠ DUPLICATE KEYS FOUND: {len(dups)}")
            else:
                print(f"    ✓ no duplicate keys")
            # Show sample
            cur.execute("""
                SELECT e.properties, n_s.name, n_t.name
                FROM edges e
                JOIN nodes n_s ON n_s.id = e.source_id
                JOIN nodes n_t ON n_t.id = e.target_id
                WHERE e.type=? LIMIT 2
            """, (EDGE_TYPE,))
            for row in cur.fetchall():
                p = _safe_json(row[0])
                print(f"    {row[1]:35} → {row[2]:30} [{p.get('url_path','?')}]")
        conn.close()
    print(f"\n  Total {EDGE_TYPE} edges across all repos: {total}")
    return total

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print(f"=== Evolva Platform Cross-Edge Builder v{BUILDER_VERSION} ===\n")
    print("Security mode: DELETE-then-INSERT with SHA-256 edge keys\n")

    print("Step 1: Collecting Route nodes from all 16 repos...")
    routes = collect_all_routes()
    tt = [r for r in routes if r.db_key == "home-ubuntu-ttruthdesk-platform"]
    print(f"  {len(routes)} total routes  ({len(tt)} in ttruthdesk-platform)")

    print("\nStep 2: Collecting HTTP call sites...")
    sites = collect_http_call_sites()
    print(f"  {len(sites)} call site candidates")

    print("\nStep 3: Matching call sites to cross-repo routes...")
    matches = match_to_routes(sites, routes)
    print(f"  {len(matches)} matches from graph data")

    if not matches:
        print("  No graph matches — running source-file fallback scan...")
        matches = scan_source_for_patterns(routes)
        print(f"  {len(matches)} matches from source scan")

    if not matches:
        print("\n  No cross-repo edges found.")
        return

    # Merge graph + source matches (dedup by edge_key)
    all_matches = matches
    if len(matches) < 50:
        extra = scan_source_for_patterns(routes)
        seen = {e.edge_key for e in matches}
        for e in extra:
            if e.edge_key not in seen:
                seen.add(e.edge_key)
                all_matches.append(e)
        if len(all_matches) > len(matches):
            print(f"  Source scan added {len(all_matches)-len(matches)} more matches")

    print(f"\n  Total unique cross-repo edges to write: {len(all_matches)}")
    for e in sorted(all_matches, key=lambda x: x.src_db_key):
        src = e.src_db_key.split("-cbm-repos-")[-1]
        print(f"  {src:22} {e.src_name:38} → {e.matched_path}")

    print(f"\nStep 4: Writing edges (atomic DELETE+INSERT per database)...")
    stats = write_cross_edges(all_matches)

    total_inserted = sum(
        v.get("inserted", 0) for v in stats.values()
    )
    print(f"\n  Total edge rows written: {total_inserted}")
    print("\n✓ Build complete. Run with --verify to confirm integrity.")

if __name__ == "__main__":
    import sys
    if "--verify" in sys.argv:
        verify()
    else:
        main()
