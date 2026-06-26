#!/usr/bin/env python3
"""
cross_edge_builder.py
Builds CROSS_HTTP_CALLS edges across all 16 evolva platform repos
by directly reading and writing the codebase-memory-mcp SQLite databases.

Schema (confirmed from inspection):
  nodes(id, project, label, name, qualified_name, file_path, start_line, end_line, properties)
  edges(id, project, source_id, target_id, type, properties, url_path_gen)
    - UNIQUE(source_id, target_id, type)
    - url_path_gen = json_extract(properties, '$.url_path')

Edge types in use: DEFINES, CALLS, USAGE, CONFIGURES, IMPORTS, CONTAINS_FILE,
  WRITES, SIMILAR_TO, TESTS_FILE, SEMANTICALLY_RELATED, FILE_CHANGES_WITH,
  DEFINES_METHOD, HANDLES, HTTP_CALLS, INHERITS, TESTS, THROWS, RAISES,
  DECORATES, LISTENS_ON, CONTAINS_FOLDER

New edge type we add: CROSS_HTTP_CALLS
"""

import sqlite3
import json
import re
from pathlib import Path
from typing import NamedTuple, Optional

CACHE = Path.home() / ".cache/codebase-memory-mcp"

# All 16 project database keys (as stored in the projects table)
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
    name: str          # e.g. /api/public/claims
    method: str        # GET, POST, ANY, etc.
    qualified_name: str

class CallSiteNode(NamedTuple):
    db_key: str
    node_id: int
    name: str
    qualified_name: str
    file_path: str
    url_fragment: str  # the URL path fragment found in properties or name

def db_path(project_key: str) -> Path:
    return CACHE / f"{project_key}.db"

def open_db(project_key: str) -> sqlite3.Connection:
    p = db_path(project_key)
    if not p.exists():
        return None
    conn = sqlite3.connect(p)
    conn.row_factory = sqlite3.Row
    return conn

# ── Step 1: Index all Route nodes from all databases ─────────────────────────

def collect_all_routes() -> list[RouteNode]:
    routes = []
    for alias, key in PROJECTS.items():
        conn = open_db(key)
        if not conn:
            continue
        cur = conn.cursor()
        # Route nodes: label='Route', qualified_name like __route__METHOD__/path
        cur.execute("""
            SELECT id, name, qualified_name
            FROM nodes
            WHERE label = 'Route'
        """)
        for row in cur.fetchall():
            qn = row['qualified_name']
            # Parse __route__GET__/api/public/claims → method=GET, path=/api/public/claims
            m = re.match(r'^__route__(\w+)__(.+)$', qn)
            method = m.group(1) if m else 'ANY'
            path = m.group(2) if m else row['name']
            routes.append(RouteNode(
                db_key=key,
                node_id=row['id'],
                name=path,
                method=method,
                qualified_name=qn,
            ))
        conn.close()
    return routes

# ── Step 2: Find HTTP call sites in each database ────────────────────────────

def collect_http_call_sites() -> list[CallSiteNode]:
    """
    HTTP_CALLS edges exist in ttruthdesk (49 of them). For other repos we need
    to find nodes whose properties contain URL fragments matching known routes.
    Strategy:
      a) Nodes with label=HttpCall or HTTP_CALLS edges (source nodes)
      b) Nodes in nodes_fts matching known ttruthdesk route patterns
      c) Nodes whose properties JSON contains url_path or url fields
    """
    sites = []
    # Known ttruthdesk route prefixes to search for
    ttruth_prefixes = [
        '/api/public/claims',
        '/api/public/batch-verify',
        '/api/trpc',
        '/api/admin',
        '/api/scheduled',
        '/api/cognitive',
        '/api/self-direct',
        '/v1/verify',
        '/v1/claims',
        'citation.is',
        'ttruthdesk',
    ]

    for alias, key in PROJECTS.items():
        if key == "home-ubuntu-ttruthdesk-platform":
            continue  # skip self-calls
        conn = open_db(key)
        if not conn:
            continue
        cur = conn.cursor()

        # Strategy A: nodes with label HttpCall
        cur.execute("SELECT id, name, qualified_name, file_path, properties FROM nodes WHERE label='HttpCall'")
        for row in cur.fetchall():
            props = {}
            try:
                props = json.loads(row['properties'] or '{}')
            except Exception:
                pass
            url = props.get('url', '') or props.get('url_path', '') or row['name']
            sites.append(CallSiteNode(
                db_key=key, node_id=row['id'], name=row['name'],
                qualified_name=row['qualified_name'], file_path=row['file_path'],
                url_fragment=url,
            ))

        # Strategy B: source nodes of HTTP_CALLS edges
        cur.execute("""
            SELECT DISTINCT n.id, n.name, n.qualified_name, n.file_path, n.properties,
                   e.properties as edge_props
            FROM edges e
            JOIN nodes n ON n.id = e.source_id
            WHERE e.type = 'HTTP_CALLS'
        """)
        for row in cur.fetchall():
            edge_props = {}
            try:
                edge_props = json.loads(row['edge_props'] or '{}')
            except Exception:
                pass
            url = edge_props.get('url_path', '') or edge_props.get('url', '') or ''
            sites.append(CallSiteNode(
                db_key=key, node_id=row['id'], name=row['name'],
                qualified_name=row['qualified_name'], file_path=row['file_path'],
                url_fragment=url,
            ))

        # Strategy C: FTS search for nodes referencing ttruthdesk route patterns
        for prefix in ttruth_prefixes:
            try:
                cur.execute("""
                    SELECT n.id, n.name, n.qualified_name, n.file_path, n.properties
                    FROM nodes_fts f
                    JOIN nodes n ON n.rowid = f.rowid
                    WHERE nodes_fts MATCH ?
                    LIMIT 20
                """, (prefix.replace('/', ' ').strip(),))
                for row in cur.fetchall():
                    props = {}
                    try:
                        props = json.loads(row['properties'] or '{}')
                    except Exception:
                        pass
                    url = props.get('url', '') or props.get('url_path', '') or prefix
                    sites.append(CallSiteNode(
                        db_key=key, node_id=row['id'], name=row['name'],
                        qualified_name=row['qualified_name'], file_path=row['file_path'],
                        url_fragment=url,
                    ))
            except Exception:
                pass

        conn.close()

    # Deduplicate by (db_key, node_id)
    seen = set()
    deduped = []
    for s in sites:
        k = (s.db_key, s.node_id)
        if k not in seen:
            seen.add(k)
            deduped.append(s)
    return deduped

# ── Step 3: Match call sites to routes ───────────────────────────────────────

def match_call_sites_to_routes(
    call_sites: list[CallSiteNode],
    routes: list[RouteNode],
) -> list[tuple]:
    """
    Returns list of (source_db_key, source_node_id, target_db_key, target_node_id,
                     matched_path, source_name, target_name, source_file)
    """
    # Build route index: path_prefix → RouteNode (prefer ttruthdesk)
    route_index: dict[str, RouteNode] = {}
    for r in routes:
        # Normalize: strip trailing slash, lowercase
        path = r.name.rstrip('/').lower()
        if path not in route_index or r.db_key == "home-ubuntu-ttruthdesk-platform":
            route_index[path] = r

    matches = []
    for site in call_sites:
        url = site.url_fragment.lower()
        if not url:
            continue
        # Try to find a matching route
        for path, route in route_index.items():
            if route.db_key == site.db_key:
                continue  # skip same-repo
            # Match if the url contains the route path or vice versa
            if path in url or url.endswith(path) or url.startswith(path):
                matches.append((
                    site.db_key, site.node_id,
                    route.db_key, route.node_id,
                    path,
                    site.name, route.name, site.file_path,
                ))
                break  # one match per call site is enough

    return matches

# ── Step 4: Write CROSS_HTTP_CALLS edges into both databases ─────────────────

def write_cross_edges(matches: list[tuple]) -> dict[str, int]:
    counts: dict[str, int] = {}
    # Group by source db_key
    by_db: dict[str, list] = {}
    for m in matches:
        src_key = m[0]
        tgt_key = m[2]
        for k in [src_key, tgt_key]:
            by_db.setdefault(k, []).append(m)

    for db_key, db_matches in by_db.items():
        conn = open_db(db_key)
        if not conn:
            continue
        cur = conn.cursor()
        # Get the project name stored in this db
        cur.execute("SELECT name FROM projects LIMIT 1")
        row = cur.fetchone()
        project_name = row['name'] if row else db_key

        inserted = 0
        for m in db_matches:
            src_key, src_id, tgt_key, tgt_id, path, src_name, tgt_name, src_file = m
            props = json.dumps({
                "url_path": path,
                "source_repo": src_key,
                "source_name": src_name,
                "target_repo": tgt_key,
                "target_name": tgt_name,
                "source_file": src_file,
                "edge_builder": "cross_edge_builder.py",
            })
            try:
                cur.execute("""
                    INSERT OR IGNORE INTO edges
                      (project, source_id, target_id, type, properties)
                    VALUES (?, ?, ?, 'CROSS_HTTP_CALLS', ?)
                """, (project_name, src_id, tgt_id, props))
                inserted += cur.rowcount
            except Exception as e:
                print(f"  WARN insert failed for {db_key}: {e}")

        conn.commit()
        counts[db_key] = inserted
        print(f"  [{db_key}] inserted {inserted} CROSS_HTTP_CALLS edges")
        conn.close()

    return counts

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=== Evolva Platform Cross-Edge Builder ===\n")

    print("Step 1: Collecting all Route nodes from 16 repos...")
    routes = collect_all_routes()
    print(f"  Found {len(routes)} route nodes across all repos")
    # Show ttruthdesk routes as sample
    tt_routes = [r for r in routes if r.db_key == "home-ubuntu-ttruthdesk-platform"]
    print(f"  ttruthdesk-platform: {len(tt_routes)} routes")
    for r in sorted(tt_routes, key=lambda x: x.name)[:10]:
        print(f"    {r.method:6} {r.name}")
    if len(tt_routes) > 10:
        print(f"    ... and {len(tt_routes)-10} more")

    print("\nStep 2: Collecting HTTP call sites from all client repos...")
    call_sites = collect_http_call_sites()
    print(f"  Found {len(call_sites)} call site candidates")
    by_repo = {}
    for s in call_sites:
        by_repo.setdefault(s.db_key, []).append(s)
    for k, v in sorted(by_repo.items()):
        print(f"  {k}: {len(v)} sites")

    print("\nStep 3: Matching call sites to routes...")
    matches = match_call_sites_to_routes(call_sites, routes)
    print(f"  Matched {len(matches)} cross-repo call site → route pairs")
    for m in matches:
        src_key, src_id, tgt_key, tgt_id, path, src_name, tgt_name, src_file = m
        print(f"  {src_key.split('-cbm-repos-')[-1]:20} {src_name:40} → {path}")

    if not matches:
        print("\n  No matches found. This may mean:")
        print("  - URL fragments in call sites don't match route paths exactly")
        print("  - Call sites use environment variables for base URLs (common)")
        print("  - The citation-client.ts calls use citationFetch() wrapper")
        print("\n  Trying direct source code scan for known patterns...")
        matches = scan_source_for_patterns(routes)
        print(f"  Source scan found {len(matches)} matches")
        for m in matches:
            src_key, src_id, tgt_key, tgt_id, path, src_name, tgt_name, src_file = m
            print(f"  {src_key.split('-cbm-repos-')[-1]:20} {src_name:40} → {path}")

    if matches:
        print(f"\nStep 4: Writing {len(matches)} CROSS_HTTP_CALLS edges to SQLite databases...")
        counts = write_cross_edges(matches)
        total = sum(counts.values())
        print(f"\n  Total edges written: {total}")
        print("\n✓ Cross-edge build complete.")
        print("  Run: python3 cross_edge_builder.py --verify  to confirm edges are queryable")
    else:
        print("\n  No cross-repo edges to write.")

def scan_source_for_patterns(routes: list[RouteNode]) -> list[tuple]:
    """
    Fallback: scan the actual source files in the cloned repos for URL patterns
    that match known ttruthdesk routes. Uses the file_path stored in node records.
    """
    import os
    matches = []
    tt_routes = {r.name: r for r in routes if r.db_key == "home-ubuntu-ttruthdesk-platform"}

    for alias, key in PROJECTS.items():
        if key == "home-ubuntu-ttruthdesk-platform":
            continue
        conn = open_db(key)
        if not conn:
            continue
        cur = conn.cursor()

        # Get all function/method nodes with their source files
        cur.execute("""
            SELECT id, name, qualified_name, file_path, properties
            FROM nodes
            WHERE label IN ('Function','Method','Class')
            AND file_path != ''
        """)
        nodes = cur.fetchall()
        conn.close()

        # Find the repo root on disk
        repo_slug = key.replace("home-ubuntu-cbm-repos-", "").replace("home-ubuntu-", "")
        possible_roots = [
            Path.home() / "cbm-repos" / repo_slug,
            Path.home() / repo_slug,
            Path.home() / "ttruthdesk-platform" if "ttruthdesk" in key else None,
        ]
        repo_root = next((p for p in possible_roots if p and p.exists()), None)
        if not repo_root:
            continue

        for node in nodes:
            fp = node['file_path']
            if not fp:
                continue
            full_path = repo_root / fp.lstrip('/')
            if not full_path.exists():
                continue
            try:
                content = full_path.read_text(errors='ignore')
            except Exception:
                continue
            # Search for ttruthdesk route patterns in the file
            for route_path, route in tt_routes.items():
                if route_path in content:
                    matches.append((
                        key, node['id'],
                        route.db_key, route.node_id,
                        route_path,
                        node['name'], route.name, fp,
                    ))
                    break  # one match per node

    # Deduplicate
    seen = set()
    deduped = []
    for m in matches:
        k = (m[0], m[1], m[2], m[3])
        if k not in seen:
            seen.add(k)
            deduped.append(m)
    return deduped

if __name__ == "__main__":
    import sys
    if "--verify" in sys.argv:
        print("=== Verifying CROSS_HTTP_CALLS edges ===")
        for alias, key in PROJECTS.items():
            conn = open_db(key)
            if not conn:
                continue
            cur = conn.cursor()
            cur.execute("SELECT count(*) FROM edges WHERE type='CROSS_HTTP_CALLS'")
            count = cur.fetchone()[0]
            if count:
                print(f"  {key}: {count} CROSS_HTTP_CALLS edges")
                cur.execute("""
                    SELECT e.properties, n_src.name, n_tgt.name
                    FROM edges e
                    JOIN nodes n_src ON n_src.id = e.source_id
                    JOIN nodes n_tgt ON n_tgt.id = e.target_id
                    WHERE e.type = 'CROSS_HTTP_CALLS'
                    LIMIT 3
                """)
                for row in cur.fetchall():
                    props = json.loads(row[0] or '{}')
                    print(f"    {row[1]} → {row[2]} via {props.get('url_path','?')}")
            conn.close()
    else:
        main()
