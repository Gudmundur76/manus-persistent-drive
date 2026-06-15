#!/usr/bin/env python3
"""
Test the citation.is MCP server via agentgateway proxy.
Usage: python3 test_mcp_agentgateway.py [--direct]
  --direct: test https://ttruthdesk.claims/api/mcp directly (JSON-RPC)
  default:  test http://localhost:3000/mcp via agentgateway (SSE proxy)
"""
import requests, json, sys

DIRECT = "--direct" in sys.argv
BASE = "https://ttruthdesk.claims/api/mcp" if DIRECT else "http://localhost:3000/mcp"
HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
    "mcp-protocol-version": "2024-11-05"
}

print(f"Testing: {BASE}")
print("-" * 60)

if DIRECT:
    # Direct JSON-RPC — no session needed
    r = requests.post(BASE, headers=HEADERS, json={
        "jsonrpc": "2.0", "method": "tools/list", "params": {}, "id": 1
    }, timeout=20)
    print(f"tools/list: {r.status_code}")
    tools = r.json().get("result", {}).get("tools", [])
    print(f"Tools: {len(tools)}")
    for t in tools:
        print(f"  ✓ {t['name']}")

    # Test verify_claim
    r2 = requests.post(BASE, headers=HEADERS, json={
        "jsonrpc": "2.0", "method": "tools/call",
        "params": {"name": "verify_claim", "arguments": {
            "claim_text": "Lysozyme is an antimicrobial enzyme found in human tears",
            "include_evidence": True
        }}, "id": 2
    }, timeout=30)
    print(f"\nverify_claim: {r2.status_code}")
    content = r2.json().get("result", {}).get("content", [{}])[0].get("text", "{}")
    data = json.loads(content)
    print(f"  verdict: {data.get('verdict')}")
    print(f"  confidence: {data.get('confidence')}")
    evidence = data.get("evidence", [])
    print(f"  evidence items: {len(evidence)}")
    if evidence:
        print(f"  first item confidence: {evidence[0].get('confidence', 'MISSING')}")
    contradictions = data.get("contradictions")
    print(f"  contradictions field: {'present' if contradictions is not None else 'MISSING'}")
    spo = data.get("spo")
    print(f"  SPO triple: {'present' if spo else 'MISSING ← Sprint 21 gap'}")
else:
    # Via agentgateway SSE proxy — needs session init
    r = requests.post(BASE, headers=HEADERS, json={
        "jsonrpc": "2.0", "method": "initialize",
        "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "sprint21", "version": "1.0"}},
        "id": 1
    }, timeout=20)
    print(f"initialize: {r.status_code}")
    session_id = r.headers.get("mcp-session-id")
    print(f"session_id: {session_id}")

    if session_id and r.status_code == 200:
        h2 = {**HEADERS, "mcp-session-id": session_id}
        r2 = requests.post(BASE, headers=h2, json={"jsonrpc": "2.0", "method": "tools/list", "params": {}, "id": 2}, timeout=20)
        print(f"tools/list: {r2.status_code}")
        tools = r2.json().get("result", {}).get("tools", [])
        print(f"Tools via agentgateway: {len(tools)}")
        for t in tools:
            print(f"  ✓ {t['name']}")
    else:
        print("ERROR: Could not establish agentgateway session")
        print(f"Response body: {r.text[:300]}")
