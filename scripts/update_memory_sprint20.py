#!/usr/bin/env python3
"""Update agent_memory_blocks.json with Sprint 20 state."""
import json

path = "/home/ubuntu/manus-persistent-drive/memory/agent_memory_blocks.json"
with open(path) as f:
    data = json.load(f)

blocks = data["blocks"]

# Update sprint_state block
blocks["sprint_state"]["value"] = json.dumps({
    "sprint": 20,
    "timestamp": "2026-06-15T15:30:00Z",
    "last_commits": {
        "ttruthdesk_platform": "ced06a8",
        "citation_desk": "518dff9"
    },
    "production": {
        "totalClaims": 4084,
        "verifiedClaims": 97,
        "domains_with_signals": ["medicine", "climate", "economics", "law", "structural_biology", "salmon_biotech"],
        "mcp_tools": 12,
        "mcp_endpoint": "https://ttruthdesk.claims/api/mcp"
    },
    "sprint_20_completed": {
        "file1_verify_claim_pipeline": "DONE_2f23fb7",
        "file1_homepage_fixes": "DONE_f95675a",
        "file2_domain_signals": "DONE_7c26356",
        "file3_entity_resolve": "DONE_8864347",
        "file4_mcp_listing_docs": "DONE_ced06a8",
        "file5_jsonld_perplexitybot": "DONE_518dff9",
        "awesome_mcp_servers_pr": "https://github.com/punkpeye/awesome-mcp-servers/pull/8116"
    },
    "sprint_21_critical_gaps": [
        "SPO triple missing from verify_claim response",
        "Crossref DOI retraction detection (Phase 1 of docs/crossref-scite-integration.md)",
        "NOAA adapter (complete climate domain)",
        "FRED adapter (complete economics domain)",
        "Test Perplexity visibility: ask 'What is citation.is?'",
        "OpenCitations metadata submission",
        "sameAs LinkedIn + X in Organization schema"
    ],
    "aaif_tools": {
        "goose": "v1.37.0",
        "agentgateway": "v1.2.1",
        "mcp_verified": True,
        "last_mcp_call": "post_sprint20_verification_pending"
    },
    "next_sprint": 21
}, indent=2)

# Update sprint_history block
blocks["sprint_history"]["value"] = (
    blocks["sprint_history"]["value"]
    + " Sprint 18: AAIF toolchain wired, AGENTS.md updated, goose+agentgateway reinstalled."
    + " Sprint 19: manually_reviewed filter (bbd553b), RAG integration guide page (5ea50b3)."
    + " Sprint 20: 5 Perplexity documents executed. verify_claim pipeline fixed (per-item confidence scoring, contradictions[], search_claims min_confidence). 60+ domain signals (medicine/climate/economics/law). Entity resolve endpoint. MCP listing docs. Crossref/Scite plan. FAQPage+Organization JSON-LD updated. PerplexityBot static shell updated. PR #8116 to awesome-mcp-servers. 6 commits: 2f23fb7, f95675a, 7c26356, 8864347, ced06a8, 518dff9."
)

# Update corpus_stats block
blocks["corpus_stats"]["value"] = (
    "2026-06-15T15:00Z snapshot (Sprint 20). Total claims: 4084. verifiedClaims: 97. "
    "structural_biology: 2993 claims. salmon_biotech: 1062 claims. "
    "New domains: medicine/climate/economics/law signals added to CLAIM_SIGNALS (60+ signals). "
    "Domain ingest cron active (6h interval). MCP server: 12 tools live. "
    "Entity resolve endpoint: GET /api/v2/entities/resolve?name=&type=. "
    "Corpus growth endpoint: GET /api/public/corpus-growth."
)

# Update aaif_integration block
blocks["aaif_integration"]["value"] = (
    "AAIF tools status (2026-06-15 Sprint 20): AGENTS.md committed to both repos. "
    "agentgateway v1.2.1 installed at /usr/local/bin/agentgateway. "
    "goose v1.37.0 installed at ~/.local/bin/goose. "
    "Letta memory blocks at manus-persistent-drive/memory/agent_memory_blocks.json (git-backed, Letta-compatible schema). "
    "MCP endpoint: https://ttruthdesk.claims/api/mcp (12 tools). "
    "verify_claim now returns contradictions[] field and per-item confidence scores. "
    "search_claims min_confidence filter fixed. /api/public/corpus-growth endpoint added. "
    "awesome-mcp-servers PR #8116 opened. "
    "Sprint 21: run goose verify_claim + agentgateway health check as AAIF pre-sprint protocol."
)

# Update last_updated
data["last_updated"] = "2026-06-15T15:30:00Z"

with open(path, "w") as f:
    json.dump(data, f, indent=2)

print("agent_memory_blocks.json updated successfully")
print(f"sprint_state sprint: {json.loads(blocks['sprint_state']['value'])['sprint']}")
print(f"next_sprint: {json.loads(blocks['sprint_state']['value'])['next_sprint']}")
