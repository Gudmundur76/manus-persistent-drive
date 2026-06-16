# Sprint 29 Brief: Full-Adapter Citation Search Engine

*Written: 2026-06-16 | Status: READY TO BUILD*

---

## Product Vision: What citation.is becomes after Sprint 29

### The core shift

Right now citation.is is a verification registry with a search bar. After Sprint 29 it becomes something qualitatively different.

Every query runs a live, parallel investigation across the entire scientific and regulatory record — not a lookup, not a cache hit, not a pre-indexed corpus. The system decomposes a question, classifies what kind of claim it is, and simultaneously dispatches to every relevant authoritative source in parallel. The answer comes back sourced, verdicted, and citable within seconds. Every answer grows the corpus, so the platform gets smarter with every query.

### What citation.is will be

**The scientific grounding layer for the internet.**

Not a search engine in the Google sense — it does not index web pages. Not a fact-checker in the Snopes sense — it does not have human editors. Not a RAG pipeline — it does not retrieve and summarise. It is something that does not quite exist yet: a live, structured, multi-source verification primitive that answers the question *"is this claim supported by the scientific and regulatory record?"* with evidence, confidence, and provenance.

The closest analogy is what DNS did for domain names or what CrossRef did for DOIs. Those systems did not create new knowledge — they created a reliable, machine-readable resolution layer on top of existing knowledge. citation.is does the same for scientific claims.

### The 42-adapter picture

With all adapters wired, the coverage becomes extraordinary:

A question about a drug's side effects simultaneously queries OpenFDA adverse event reports, OpenFDA drug labels, ChEMBL bioactivity data, PubMed clinical literature, and Cochrane systematic reviews — five independent authoritative sources, in parallel, in under 10 seconds.

A question about climate change simultaneously queries NOAA observational records, IPCC assessment reports, Our World in Data long-run trends, and World Bank development indicators.

A question about a protein's structure queries RCSB PDB (the definitive structural database), UniProt (protein identity and function), and PubMed (the literature describing it).

A question about a legal standard queries EUR-Lex, CourtListener, and IETF RFC depending on whether it is EU law, US case law, or internet standards.

No single system currently does this across all these domains with a unified verdict and confidence score. Perplexity searches the web. PubMed searches one database. Cochrane covers systematic reviews only. citation.is covers all of them simultaneously and returns a structured, machine-readable answer.

### The compounding flywheel

Every query calls `triggerAutonomousIngest()` in the background. The corpus grows with every search. A query about creatine today adds 3–5 new verified claims. A query about aspirin adds 3–5 more. Over time the corpus becomes a dense, self-reinforcing knowledge graph where each new query is answered faster and with higher confidence because prior queries have already built the evidence base.

**Search → verify → ingest → corpus grows → next search is better.**

### The potential

**For AI systems:** Every LLM, agent, and RAG pipeline that needs to ground outputs in the scientific record has one endpoint to call. No API key required for basic use. The MCP server makes it accessible to any MCP-compatible agent (Claude, Cursor, Windsurf, Goose) with zero integration work.

**For developers:** A structured, typed API returning verdicts, confidence scores, source metadata, and contradiction flags. The primitive that gets embedded in medical apps, research tools, science journalism platforms, and regulatory compliance systems.

**For the scientific record:** Every claim that passes through citation.is gets a structured verdict linked to its sources. Over time this builds a machine-readable layer on top of the scientific literature — a ClaimReview graph that any system can query.

**For Perplexity, Claude, ChatGPT:** These systems already cite sources but cannot verify claims. citation.is is the missing verification layer. When Perplexity says "studies suggest creatine improves performance," citation.is can say "Supported, 0.91 confidence, 3 peer-reviewed sources, no contradictions found."

### The finish line

citation.is is finished when:

1. Any scientific claim can be verified in real time against the full breadth of authoritative sources ← **Sprint 29 delivers this**
2. The corpus grows autonomously with every query ← already built (`triggerAutonomousIngest`)
3. The MCP server is listed in the major agent directories ← PR #8116 open
4. The API is stable enough that external developers build on top of it
5. Perplexity, Claude, and other AI systems cite citation.is as a source

---

## Sprint 29 Technical Spec

### Problem

The `/api/citation-search/stream` endpoint is live on `ttruthdesk.claims` but **does not exist in the GitHub repo**. It was built in a session that was not committed. The live endpoint only queries 6 hardcoded adapters (OpenAlex, CrossRef, Europe PMC, Semantic Scholar, Cochrane, PubChem) out of 42 registered adapters. The domain classifier and question decomposer exist but are not wired into the search pipeline.

### Goal

Build `server/citationSearchRoute.ts` — a properly implemented, committed, tested route that:

1. Accepts `GET /api/citation-search/stream?q=<query>`
2. Decomposes the query using `questionDecomposer.ts` → `AtomicClaim[]`
3. Classifies each claim using `domainClassifier.ts` → `SourceRoute[]`
4. Queries all relevant adapters in parallel via `Promise.allSettled()`
5. Aggregates results into a unified verdict with confidence score
6. Streams 4 SSE events in the exact shape the frontend expects
7. Calls `triggerAutonomousIngest()` in background to grow the corpus
8. Registers at `GET /api/citation-search/stream` in `index.ts`

### SSE Event Shape (must match citation.is HeroSearch component exactly)

```
event: stage:decompose
data: { stage:1, label:"decompose", question, claims[], primaryClaim }

event: stage:evidence
data: { stage:2, label:"evidence", sourcesFound, totalAdapters, sources[{adapterKey, adapterName, found, sourceUrl, title, year, journal, confidenceScore}] }

event: stage:answer
data: { stage:3, label:"answer", verdict, confidence, answerLength }

event: final
data: { ok, question, primaryClaim, answer, verdict, confidence, sources[] }
```

### Adapter Routing by Domain

| Domain | Primary Adapters |
|---|---|
| Biomedical general | europe_pmc, openalex, semantic_scholar, cochrane |
| Structural biology | rcsb_pdb, uniprot, europe_pmc |
| Clinical trials | clinicaltrials_gov, cochrane, europe_pmc |
| Pharmacology | openfda, openfda_labels, chembl, europe_pmc |
| Genomics | clinvar, europe_pmc, uniprot |
| Chemistry | pubchem, chembl |
| Climate | noaa, ipcc, owid, world_bank |
| Economics | fred, imf, oecd, world_bank, eurostat |
| Law | eur_lex, court_listener, ietf_rfc |
| Academic (general) | crossref, openalex, semantic_scholar, arxiv, biorxiv |
| Unknown/fallback | openalex, semantic_scholar, crossref, europe_pmc |

### Key Files to Read Before Building

- `server/questionDecomposer.ts` — decompose query into AtomicClaim[]
- `server/domainClassifier.ts` — classify claim → SourceRoute[]
- `server/domainRules.ts` — 15 domain rules + fallback
- `server/verticalAdapters/index.ts` — all 42 registered adapters
- `server/verticalAdapters/types.ts` — EvidenceResult, VerticalAdapter types
- `server/streamVerifyRoute.ts` — existing SSE pattern to follow
- `server/autonomousIngest.ts` — triggerAutonomousIngest signature

### Definition of Done

- [ ] `server/citationSearchRoute.ts` created with ≥12 passing tests
- [ ] Route registered in `server/_core/index.ts`
- [ ] `pnpm test` green (all existing 2,855 + new tests)
- [ ] TSC clean, ESLint clean
- [ ] Live endpoint at `ttruthdesk.claims/api/citation-search/stream` returns correct SSE shape
- [ ] `citation.is` homepage HeroSearch works end-to-end in production
- [ ] Memory repo updated with sprint result

### Rate Limiting

20 req/hr per IP (anonymous), shared with existing public endpoints. Use the existing `rateLimiter` middleware pattern from `streamVerifyRoute.ts`.

### Answer Synthesis

The `final` event must include a synthesised `answer` string — not just raw source data. Use `invokeLLM()` with a system prompt like:

```
You are a scientific claim verifier. Given the following evidence from peer-reviewed sources, write a 2-3 sentence answer that states whether the claim is supported, what the evidence shows, and cites the key sources by number.
```

Keep answer under 400 characters for the `stage:answer` event `answerLength` field.

---

## Context for the Backend Agent

The frontend (`citation.is` / `HeroSearch` component in `CitationHome.tsx`) is already built and deployed. It expects exactly the SSE event shape above. The Manus proxy at `/api/citation-search/stream` on citation.is forwards directly to `ttruthdesk.claims/api/citation-search/stream`. The frontend does not need to change — only the backend route needs to be built correctly.

The live endpoint currently running on `ttruthdesk.claims` is uncommitted. Sprint 29 replaces it with the correct implementation.
