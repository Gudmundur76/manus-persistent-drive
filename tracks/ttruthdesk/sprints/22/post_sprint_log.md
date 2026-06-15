# Sprint 22 — Post-Sprint Log

**Date:** May 2026
**Status:** COMPLETE — all tests green

## What Shipped

- RSS/JSON feed at `/api/public/claims.json` with RFC 5988 headers
- IMF (International Monetary Fund) data adapter
- Vertical domain routing fix — species-specific queries now route correctly
- Graph data endpoint at `/api/public/graph.json`

## Test Count

- ttruthdesk-platform: 2,740 passing

## Acceptance Criteria

- [x] `/api/public/claims.json` returns valid RSS-compatible JSON
- [x] IMF adapter returns macroeconomic data for fiscal claims
- [x] Vertical routing correctly handles organism-specific queries
- [x] `/api/public/graph.json` returns 200 with valid graph structure
