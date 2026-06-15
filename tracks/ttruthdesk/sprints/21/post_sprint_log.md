# Sprint 21 — Post-Sprint Log

**Date:** May 2026
**Status:** COMPLETE — all tests green

## What Shipped

- SPO triple extraction (`spoExtractor.ts`) — LLM primary path + heuristic fallback
- Crossref retraction detection adapter (`crossrefRetraction.ts`)
- NOAA + FRED economic data adapters
- `spo` field added to `verify_claim` response
- `contradictions` array added to `verify_claim` response (Sprint 20 spec)

## Test Count

- ttruthdesk-platform: 2,719 passing

## Acceptance Criteria

- [x] `spo` field present in verify_claim response
- [x] Crossref retraction adapter returns `Contradicted` verdict for retracted papers
- [x] NOAA adapter returns climate data for temperature claims
- [x] FRED adapter returns economic data for macroeconomic claims
