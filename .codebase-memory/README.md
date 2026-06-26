# Evolva Platform — Unified Codebase Graph

This directory contains the unified codebase-memory-mcp knowledge graph for all 16 repositories
in the evolva platform. It is the canonical source of structural intelligence for the platform.

## Contents

| File | Description |
|---|---|
| `evolva-platform-graph.tar.gz` | Unified store — all 16 project databases (117MB → 20MB) |
| `graph.db.gz` | Per-repo snapshot for manus-persistent-drive only |
| `cbm-bridge.mjs` | HTTP-to-MCP SSE bridge (Kimi K2.7 design + notification fix) |

## Indexed Repositories (16 total, ~52k nodes, ~89k edges)

ttruthdesk-platform (38,106 nodes), citation-desk (2,194), notus-is (2,234),
generic-signal-api (1,669), manus-persistent-drive (3,914), dna-evolve-web (1,072),
asi-evolve-discovery-engine (734), self-direct (409), cognitive-loop-framework (406),
dna-evolve (448), awesome-mcp-servers (407), novus-is (369), slm-infra-deploy (140),
asi-evolve-self-direct (104), ttruthdesk-autodeploy (33), asi-evolve-autodeploy (37)

## Bootstrap a New Session

```bash
# Step 1: Install binary (one-time per machine)
curl -fsSL https://raw.githubusercontent.com/DeusData/codebase-memory-mcp/main/install.sh \
  -o /tmp/cbm-install.sh && bash /tmp/cbm-install.sh --skip-config
export PATH="$HOME/.local/bin:$PATH"

# Step 2: Restore the unified store (all 16 repos)
mkdir -p ~/.cache/codebase-memory-mcp
tar -xzf .codebase-memory/evolva-platform-graph.tar.gz \
  -C ~/.cache/codebase-memory-mcp/

# Verify — should return count:16
codebase-memory-mcp cli list_projects '{}' 2>/dev/null | grep -o '"count":[0-9]*'
```

## Start the HTTP Bridge

```bash
export PATH="$HOME/.local/bin:$PATH"
MCP_CWD=/path/to/ttruthdesk-platform \
node .codebase-memory/cbm-bridge.mjs &

curl http://localhost:8811/health
# {"status":"ok","sessions":0,"uptime":...}
```

## Key Cross-Service Call Sites Discovered

The graph captures HTTP call sites in notus-is that call ttruthdesk-platform routes:
- citation-client.ts:searchClaims → GET /api/public/claims/search
- citation-client.ts:listClaimsByVertical → GET /api/public/claims
- candidate-claim.ts:verifyCandidates → verification pipeline
- candidate-claim.ts:buildCandidateClaims → claim construction pipeline

## Auto-update

Each of the 16 repos has .github/workflows/codebase-memory.yml which re-indexes on every push.
