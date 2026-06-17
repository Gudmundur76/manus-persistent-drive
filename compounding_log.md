
---

## Session: Phase C19 — In-Place Hero Citation Search (2026-06-16)

**Repos touched:** citation-desk (Manus + mirror), manus-persistent-drive
**Manus checkpoint:** `8b259ceb`
**Mirror commits:** `54806f7` (C19 feature), `d10a794` (CI fix)

### What was built

**Phase C19 — HeroSearch component:**
- Replaced static `ApiDemo` in the CitationHome.tsx hero right column with a live two-state `HeroSearch` component
- Idle state: dark terminal panel with static demo response, search bar, and 3 clickable example queries
- Active state: SSE streaming with 3-stage progress indicator (decompose → evidence → answer), colour-coded verdict panel, source cards with external DOI links, cancel/reset controls
- Added `GET /api/citation-search/stream` SSE proxy route in `externalProxy.ts` — pipes upstream SSE stream with brand rewrite and `req.close()` cancel support
- Quality gate: 0 TS errors, 35/35 tests passing

**CI fix:**
- Mirror repo was missing 4 page files (Loop.tsx, Sources.tsx, Compare.tsx, Contact.tsx)
- Added all 4 to mirror — CI Quality job now fully green

**Backend verification:**
- Confirmed `GET https://ttruthdesk.claims/api/citation-search/stream` is live and streaming
- Test query: "does creatine improve performance" — returned Supported, 0.90 confidence, 3 sources (OpenAlex, CrossRef, Europe PMC)

### Product definition updated

citation.is now has two distinct capabilities:
1. **Verification API** — structured verdict + provenance for AI agents and developers
2. **Live search** — Perplexity-style streamed answers for any user, no API key required

Both draw from the same ttruthdesk.claims backend and 4,165-claim corpus.

### Memory repo sync

- `CURRENT_STATE.md` rewritten — now reflects Phase C19, updated product definition, Sprint 28 backend state, SSE endpoint shape
- `compounding_log.md` updated (this entry)
- Phases C10–C18 retroactively documented in CURRENT_STATE.md

### Current corpus stats
- totalClaims: 4,165
- verifiedClaims: 856 (20.5%)
- sourceDocuments: 291

### Next actions
- Verify citation search end-to-end in production at citation.is
- Update /developers page to lead with MCP + API capabilities
- Consider api.citation.is subdomain routing
