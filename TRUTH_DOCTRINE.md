# The Truth Doctrine
## Authoritative Platform Blueprint for truthdesk.claims / citation.is

**Version:** 2.0 — Citation-First Restatement  
**Date:** June 2026  
**Status:** Supersedes all previous reference documents, roadmaps, and phase logs  
**Repository:** github.com/Gudmundur76/ttruthdesk-platform  
**Memory Repo:** github.com/Gudmundur76/manus-persistent-drive

---

## Preamble

This document is the governing definition of what this platform is, what it is building toward, and how every development decision should be evaluated. It replaces the previous development reference document generated at Phase 98 and incorporates the strategic reorientation established through the citation research session of June 2026.

The platform began as a system for the validation of verifiable truth. That framing was correct as a starting point. The deeper understanding reached through the citation research is that **truth validation and citation integrity are the same problem viewed from different angles**. The more precise and more powerful formulation is this: the platform is building a **citation-native knowledge engine** — a system that computes the epistemic relationship between a claim and the evidence asserted to support it.

This is not a narrowing of ambition. It is a sharpening of it. Citation integrity is the substrate beneath all verifiable truth. Every claim that matters in science, law, regulation, medicine, and AI-generated content is either supported, contested, implied, or beyond current evidence. The platform's job is to determine which — and to make that determination legible, structured, and machine-readable.

---

## Part 1 — The Core Intellectual Foundation

### 1.1 What a Citation Actually Is

A citation is commonly understood as a pointer — a reference that connects one piece of writing to another. This understanding is insufficient and is the root cause of every failure mode the platform exists to address.

A citation is an **assertion**. When a regulatory document writes "protein X inhibits pathway Y (Smith et al., 2019)," it is not merely acknowledging Smith et al. It is claiming that Smith et al. provides evidence sufficient to support the assertion being made. The citation is doing epistemic work: it is transferring the authority of the cited source to the current claim.

The distinction between citation as pointer and citation as assertion is the foundation of everything that follows. A pointer can be verified by checking whether the source exists. An assertion requires reading the source and determining whether it actually supports what is being claimed. The entire citation integrity problem — across science, law, and AI — flows from the gap between these two things.

In computing terms, the current citation system is a **binary untyped pointer**. It has two states: cited or not cited. There is no type system, no null pointer, no confidence interval, no way to say "this address exists but the data at that address does not support the claim being made." This is a fundamental design flaw in the data structure of human knowledge. Every other mature computing system has moved beyond binary pointers to typed, graded, nullable references. The citation system has not. **This platform is building that upgrade.**

### 1.2 The Four Epistemic States

The graded citation model replaces the binary cited/not-cited system with four states that accurately represent the actual landscape of evidence:

| Citation State | Computing Analogue | Epistemic Meaning | Platform Verdict |
|---|---|---|---|
| **Verified** | Strong typed reference | Source directly and accurately supports the claim as stated | Supported |
| **Contested** | Weak reference with confidence interval | Source exists and is relevant, but evidence is disputed, qualified, or inconsistent | Partially Supported / Contradicted |
| **Implied but untested** | Inferred reference from graph topology | No source directly addresses the claim, but the knowledge graph contains connected evidence that implies it may be true | Frontier Engine output |
| **Beyond current evidence** | Typed null — no valid target | No source addresses the claim and the knowledge graph contains no implied connections. The claim exists at the boundary of what has been tested | Insufficient Evidence + shape of gap |

The fourth state — beyond current evidence — is the one that does not exist in any current tool and is the most important. Without it, there is no way to distinguish between "no citation because the claim is established consensus" and "no citation because no evidence exists." Both look identical in a reference list. Claims at the frontier of knowledge are indistinguishable from claims at its centre. The platform's ability to represent and communicate the **shape of ignorance** around a claim is its deepest competitive advantage.

### 1.3 The Distortion Stack

The citation system does not fail in isolation. It fails through a compounding stack of distortion mechanisms that operate at every layer between primary research and the knowledge that reaches AI models and the public:

| Layer | Distortion Mechanism | Cumulative Effect |
|---|---|---|
| Primary research | Publication bias — 85%+ positive results; null results unpublished | Literature overrepresents success |
| Peer-reviewed citation | Amplification, bias, invention (Greenberg 2009) | Weak findings acquire unfounded authority |
| Press releases | Overclaiming, omission of caveats and limitations | Qualified findings become definitive claims |
| Science journalism | Telephone-game retelling; each pass adds noise, removes nuance | Effect sizes inflated, populations generalised |
| Web content | No retraction infrastructure, no quality filtering | Distorted claims persist and multiply |
| LLM training corpus | Common Crawl ingests all layers above | Model learns the distorted version as ground truth |
| LLM output | Confident synthesis of distorted training data | Confident, fluent, wrong |

The platform intervenes at the level of primary evidence — before the distortion stack operates. By anchoring every verdict to peer-reviewed source text, the platform provides a reference point that is upstream of every distortion layer. This is why the platform is not merely a fact-checker. It is a **counter-distortion infrastructure**.

### 1.4 The Five Failure Modes

The documented failure modes of citation, in order of increasing difficulty to detect and address:

**Fabrication** is the citation that does not exist. Before LLMs this was rare. In 2025 alone, an estimated 146,932 hallucinated citations appeared in academic papers. LLMs reproduce specific hallucinated citations from training data — they are not generating random errors but reproducing learned distortions.

**Misrepresentation** is more prevalent and harder to detect than fabrication. A real paper is cited in a way that does not accurately reflect what it found: citing a weak association as a strong causal effect, applying findings from a specific population as if they are universal, citing a preliminary study as if it were replicated consensus. MIT research in 2025 found that AI models use more confident language when hallucinating than when stating facts — the most confidently stated AI claims are statistically more likely to be wrong.

**Amplification and distortion** operate at the level of citation networks rather than individual citations. The Greenberg BMJ 2009 study constructed the complete citation network for a specific scientific belief and found 242 papers, 675 citations, generating 220,553 citation paths supporting the belief — built not on the weight of evidence but on the topology of the citation network. Three mechanisms drive this: citation bias (papers refuting the belief are systematically under-cited), amplification (the belief is re-cited by papers presenting no new data), and invention ("X may be involved in Y" is cited by later papers as "X causes Y").

**Retraction propagation** means that retracted findings continue to be cited through indirect citation chains long after retraction. The mechanism is straightforward: Paper A is retracted. Papers B, C, and D, which cited A before retraction, are not retracted. Papers E, F, and G cite B, C, and D without knowing the foundational claim in A was invalidated. The error propagates through the network indefinitely.

**The unknown unknown problem** is the most philosophically significant failure mode. It is not a distortion of existing knowledge but an absence of knowledge that is not acknowledged as such. In the current citation system, there is no mechanism for citing an unknown unknown. A paper either cites a source or it does not. There is no standard way to say "this claim exists at the boundary of current evidence, and here is the precise shape of what we do not yet know." The result is that claims at the edge of knowledge are cited the same way as claims at the centre of it — with the same confidence, the same format, and the same apparent authority.

---

## Part 2 — What Has Been Built

### 2.1 Platform Summary

The platform, operating at truthdesk.claims and citation.is, is a citation-native knowledge engine built on a React 19 / Tailwind 4 / Express 4 / tRPC 11 / Drizzle ORM / MySQL stack. It ingests research papers from PubMed, PMC, bioRxiv, and manual upload; extracts verifiable claims using an LLM; routes each claim through a multi-database evidence pipeline; and produces structured audit reports with machine-readable verdicts that map directly onto the four-state graded citation model.

The system runs continuously via a five-layer autonomous loop that discovers new papers, re-verifies stale claims, generates gap-closing hypotheses, monitors its own code quality, and surfaces the shape of evidence boundaries — all without human intervention.

### 2.2 The Verdict Engine as Citation Classifier

The existing verdict engine already implements the graded citation model, though it was not originally framed in those terms. The mapping is direct:

| Verdict Engine Output | Graded Citation State | What It Means |
|---|---|---|
| Supported | Verified | Source directly and accurately supports the claim |
| Partially Supported | Contested | Evidence exists but is qualified or inconsistent |
| Contradicted | Contested (negative) | Evidence exists and actively contradicts the claim |
| Insufficient Evidence | Beyond current evidence | No source addresses the claim at the required specificity |
| Frontier Engine hypothesis | Implied but untested | Knowledge graph implies the claim but no direct test exists |

The strategic restatement is that every verdict is now understood as a **citation classification**, not merely a truth judgment. The question the platform answers is not simply "is this claim true?" but "what is the epistemic status of the support asserted for this claim?"

### 2.3 The Knowledge Graph as Citation Infrastructure

The knowledge graph — built from `graphEntities` and `graphRelations` tables, growing automatically as papers are ingested — is the infrastructure that makes the implied and beyond-evidence states computable. Without a structured knowledge graph, it is impossible to determine whether a claim is implied by adjacent evidence or genuinely beyond the current evidence boundary. The graph is what separates the platform from tools that can only check existence or classify individual citation statements.

### 2.4 The Frontier Engine as Unknown-Unknown Detector

The Frontier Engine (`frontierLayer.ts`), which generates new testable hypotheses by identifying gaps and implied connections in the knowledge graph, is the mechanism for surfacing unknown knowns: claims that are implied by the existing evidence but have not yet been directly tested. This is a capability that no existing citation tool possesses. The Dream State Engine, which runs contradiction simulations and stress-tests the knowledge graph, is the closest existing mechanism for probing unknown unknowns — identifying the questions that the current evidence cannot answer and characterising the shape of that ignorance.

### 2.5 The Autonomous Loop as Continuous Citation Monitor

The five-layer autonomous loop (Friction, Self-Prompt, Frontier, Truth, Meta) is not merely a maintenance system. It is a **continuous citation integrity monitor**. Every cycle, it checks whether previously verified claims remain supported as new evidence arrives, flags claims whose support has been weakened by new contradicting papers, surfaces new implied connections, and updates the evidence boundary for every tracked claim. This is the infrastructure for a living citation record rather than a static verification snapshot.

---

## Part 3 — The Competitive Position

### 3.1 The Current Tool Landscape

The existing citation tool market operates in two tiers, with a significant gap between them and the problem they collectively fail to solve:

| Tool | Core Capability | Failure Mode Addressed | Domain Depth |
|---|---|---|---|
| CiteTrue, Citely, Recite | Checks whether a citation exists | Fabrication only | None |
| Scite.ai | Classifies citations as supporting, contrasting, or mentioning | Amplification (partially) | None |
| Semantic Scholar, Undermind | Citation graph analysis and paper discovery | None (discovery tools) | None |
| Westlaw KeyCite | Checks whether a case is still good law | Retraction equivalent | Legal only |

The gap that no tool in this table addresses is the one that matters most: **whether a specific claim — in a marketing document, a regulatory submission, an LLM output, or a legal brief — accurately represents what its cited source actually found.** This is the platform's territory.

### 3.2 The New Category

The competitive position is not in the tier occupied by CiteTrue or Citely (fabrication detection) or even in the tier occupied by Scite (citation context classification). The competitive position is in a new tier: **claim integrity against a structured knowledge graph, with explicit representation of the boundary of knowledge.**

This is a new product category. The buyers for this capability are distinct from the buyers for existing citation tools. They are not students checking bibliographies. They are:

- Regulatory affairs teams at pharmaceutical companies verifying that health claims in submissions accurately represent the cited evidence
- Medical affairs teams monitoring how research assets are being cited across the literature
- Legal professionals reviewing whether a brief accurately represents what a case held
- AI governance teams auditing whether LLM outputs accurately represent their cited sources
- Research compliance officers checking manuscript integrity before submission
- Academic publishers implementing automated integrity checks at submission

Each of these buyers needs not just "does this citation exist" but "does this citation accurately support this specific claim, and what is the epistemic status of that support."

---

## Part 4 — The Revised Product Vision

### 4.1 Mission Statement

**The platform is building the citation integrity layer for scientific and legal knowledge in the age of AI.** It provides the infrastructure to determine, for any claim in any document, whether the evidence asserted to support it actually does so — and if not, what the evidence actually shows and where the boundary of current knowledge lies.

### 4.2 The Three-Layer Architecture

The platform operates across three layers that correspond to the three levels at which citation integrity can be evaluated:

**Layer 1 — Claim-to-source verification.** Does the cited source exist? Does the cited source actually contain the finding being claimed? Does the cited source support the specific claim as stated, or does it support a weaker, qualified, or different version of it? This is the layer where fabrication and misrepresentation are detected.

**Layer 2 — Citation network analysis.** Has the claim been amplified through the citation network without new evidence being added? Does the claim depend on a retracted source, directly or through an indirect chain? Has the claim achieved the appearance of consensus through topology rather than through the weight of evidence? This is the layer where distortion and retraction propagation are detected.

**Layer 3 — Evidence boundary mapping.** What is the shape of the evidence space around this claim? Is the claim at the centre of well-established evidence, at the edge of contested territory, implied by adjacent findings, or genuinely beyond the current evidence boundary? This is the layer where the unknown-unknown problem is addressed.

### 4.3 The Long-Term Product

The long-term product is a **reference layer for substantiated knowledge** — infrastructure that any document, AI system, or publishing workflow can query to determine the citation integrity status of any claim. In the same way that Westlaw KeyCite tells a lawyer whether a case is still good law, the platform tells any knowledge worker whether a claim is still good science, good evidence, or good fact.

The platform is not a consumer product. It is infrastructure. The consumer-facing interfaces (truthdesk.claims, citation.is) are the proof of concept and the market entry point. The long-term value is in the API, the knowledge graph, and the citation integrity engine as a service that other products and workflows consume.

### 4.4 Domain Expansion Strategy

The graded citation framework is domain-agnostic. The same underlying capability — fetch the source, find the relevant passage, compare it to the claim being made, return a structured verdict with epistemic status — applies across every domain where citations are used to assert truth.

The expansion sequence follows regulatory and legal risk:

**Life sciences and pharma** is the founding domain and the highest near-term value. The FDA, EMA, and EFSA are all tightening substantiation requirements for health claims. The specific workflow is verifying that regulatory submissions, marketing materials, and medical affairs documents accurately represent the cited evidence.

**Legal** is the largest adjacent domain. The specific problem — whether a brief accurately represents what a case held — is documented, consequential, and unaddressed by any existing tool. Courts are already issuing standing orders requiring AI certification of legal research.

**AI governance** is the fastest-growing domain. Every enterprise deploying LLMs for research, compliance, or decision support needs to audit whether LLM outputs accurately represent their cited sources. This is becoming a regulatory requirement under the EU AI Act and is increasingly a board-level risk management question.

**Academic publishing** is the domain with the most immediate crisis. 146,932 hallucinated citations in 2025 alone. Major publishers requiring AI disclosure. Journal editors looking for automated integrity checks. The existing tools address only fabrication, not misrepresentation.

---

## Part 5 — The Revised Development Roadmap

### 5.1 Governing Principle for All Future Development

Every feature, every phase, every architectural decision should be evaluated against a single question: **does this make the platform a better citation integrity engine?** Features that do not serve citation integrity are deferred. Features that deepen the platform's ability to classify citation states, trace citation chains, represent evidence boundaries, or expose the structure of support are prioritised.

### 5.2 Next Phases (99 onwards)

**Phase 99 — Citation State Architecture.** Introduce `citationState` as a first-class field across the `claims`, `auditReports`, and `graphRelations` tables. Values: `verified`, `contested`, `implied`, `beyond_evidence`. Every verdict produced by the platform should map to one of these four states. Update the verdict engine, the audit report UI, and the public API to expose citation state as a primary output alongside the existing verdict.

**Phase 100 — Claim-to-Passage Alignment.** Every verdict should point not just to a paper but to the specific passage within that paper that is being relied upon. Implement passage-level extraction and storage in the evidence pipeline. The audit report should show the exact source text alongside the claim being evaluated, making the support relationship explicit and auditable.

**Phase 101 — Misrepresentation Detection.** Extend the verdict engine to detect and classify misrepresentation patterns: strength overclaiming (weak association cited as causal effect), scope overclaiming (specific population findings cited as universal), recency overclaiming (preliminary study cited as replicated consensus), and abstract-only citation (abstract cited without reading the limitations section). Each pattern should produce a specific sub-verdict within the contested state.

**Phase 102 — Citation Chain Analysis.** Implement citation network traversal for tracked claims. For any claim, the system should be able to show how many papers cite it, whether those papers add new evidence or merely re-cite, and whether the claim has been amplified (cited by papers presenting no new data) or invented (cited in a stronger form than the original stated). Surface this as a citation health score alongside the primary verdict.

**Phase 103 — Retraction Propagation Tracking.** Integrate retraction databases (Retraction Watch, PubMed retraction flags, CrossRef retraction metadata) into the ingestion pipeline. For every paper in the knowledge graph, maintain retraction status. For every claim, compute whether its support chain depends on a retracted source — directly or through an indirect citation chain. Surface retraction inheritance as a distinct risk flag in the audit report.

**Phase 104 — Evidence Boundary Visualisation.** Build a dedicated UI view for the beyond-current-evidence state that communicates not just the absence of support but the shape of that absence: what adjacent evidence exists, what the nearest tested claims are, what the implied connections suggest, and what a direct test of the claim would require. This is the operationalisation of the unknown-unknown insight.

**Phase 105 — Legal Domain Entry.** Extend the vertical adapter registry to include case law. Integrate Harvard Caselaw Access Project and CourtListener as evidence sources. Implement a legal claim adapter that handles the specific citation integrity problem in legal drafting: whether a brief accurately represents what a case held. This is the first non-scientific domain.

**Phase 106 — AI Governance Audit API.** Build a dedicated API endpoint for AI governance use cases: given an LLM output with citations, return a structured citation integrity report for every cited claim. This is the enterprise product entry point for AI governance teams and compliance functions.

**Phase 107 — Streaming Chat and Multi-Turn Conversation.** Upgrade the `chat.query` procedure to stream token-by-token responses and maintain conversation history across turns. The chat interface is the primary discovery surface for the citation integrity engine and should feel responsive and contextual.

**Phase 108 — Pharma and Regulatory Affairs Product.** Package the citation integrity engine as a purpose-built product for regulatory affairs and medical affairs teams: batch verification of regulatory submission claims, monitoring alerts when supporting papers are retracted or contradicted, and exportable audit trails in formats accepted by FDA/EMA submission workflows.

**Phase 109 — Prediction Calibration and Confidence Scoring.** Implement a calibration layer that tracks the accuracy of the platform's verdicts over time as new evidence arrives. A platform that claims to assess citation integrity must itself be epistemically honest about the confidence of its own assessments. Calibrated confidence scores should accompany every verdict.

**Phase 110 — Citation.is as Public Reference Layer.** Reposition citation.is as the public-facing interface for the citation integrity layer: a place where any claim from any document can be submitted and receive a structured citation integrity report. The domain name is the product name. The product is the graded citation.

### 5.3 What Is Explicitly Deprioritised

The following categories of work are deprioritised until the citation integrity architecture (Phases 99–106) is in place:

- Generic content expansion without citation state modeling
- Consumer-facing features that do not deepen citation integrity capability
- New verticals that do not have a clear citation integrity use case
- Infrastructure work that does not serve the evidence pipeline or knowledge graph

---

## Part 6 — Technical Architecture Reference

### 6.1 Current Stack

| Component | Technology |
|---|---|
| Frontend | React 19, Tailwind 4, shadcn/ui, Wouter routing |
| Backend | Express 4, tRPC 11, TypeScript |
| Database | MySQL/TiDB via Drizzle ORM |
| Auth | Magic-link email, JWT session cookies |
| Autonomous loop | 5-layer event-driven architecture (eventBus.ts, loopOrchestrator.ts) |
| Scheduled jobs | 12 Manus Heartbeat jobs |
| Public API | REST endpoints under /api/public/ |
| Knowledge graph | graphEntities + graphRelations tables, force-directed visualisation |
| Evidence sources | PubMed, PMC, bioRxiv, RCSB PDB, UniProt, OpenFDA, ClinicalTrials.gov, Europe PMC |
| Deployment | citation.is (published), dev preview at manus.computer |

### 6.2 Citation State Data Model (Target)

The following schema extension implements citation state as a first-class field across the platform:

```typescript
// drizzle/schema.ts additions for Phase 99

export const citationStateEnum = mysqlEnum('citation_state', [
  'verified',
  'contested', 
  'implied',
  'beyond_evidence'
]);

// Add to claims table
citationState: citationStateEnum('citation_state'),
citationStateReason: text('citation_state_reason'),
sourcePassage: text('source_passage'),        // Phase 100
sourcePassageStart: int('source_passage_start'),
sourcePassageEnd: int('source_passage_end'),

// Add to auditReports table  
citationChainScore: decimal('citation_chain_score', { precision: 5, scale: 4 }),
retractionRisk: boolean('retraction_risk').default(false),
misrepresentationPattern: varchar('misrepresentation_pattern', { length: 64 }),
```

### 6.3 Verdict-to-Citation-State Mapping

```typescript
// server/citationStateMapper.ts (Phase 99)
export function verdictToCitationState(verdict: VerdictLabel): CitationState {
  switch (verdict) {
    case 'Supported':           return 'verified';
    case 'Partially Supported': return 'contested';
    case 'Contradicted':        return 'contested';
    case 'Insufficient Evidence': return 'beyond_evidence';
    // Frontier Engine hypotheses map to 'implied' via separate pathway
  }
}
```

### 6.4 Key Development Commands

```bash
# Development
pnpm dev                          # Start dev server
pnpm test                         # Run Vitest suite (973 tests)
pnpm tsc --noEmit                 # TypeScript check
pnpm build                        # Production build

# Database
pnpm drizzle-kit generate         # Generate migration SQL
# Then: webdev_execute_sql with the generated SQL

# Memory repo
pnpm drive:sync                   # Sync to manus-persistent-drive
```

### 6.5 Adding a New Evidence Source

1. Create `server/verticalAdapters/{sourceName}Adapter.ts` implementing `EvidenceAdapter` interface
2. Register in `server/verticalAdapters/registry.ts`
3. Add ingestion heartbeat job if continuous monitoring is needed
4. Add schema tables for source-specific metadata if required
5. Update `server/db.ts` with query helpers
6. Write Vitest tests covering the adapter's `fetchEvidence` and `mapToEvidenceResult` methods

---

## Part 7 — Strategic Principles

**Citation integrity is the substrate.** Truth validation is one expression of citation integrity. The platform does not verify truth in the abstract. It verifies whether the evidence asserted to support a claim actually does so. This is a more precise, more defensible, and more commercially valuable framing.

**The unknown unknown is the moat.** Every existing tool can check whether a citation exists. Some can classify whether a citation is supporting or contrasting. None can represent the boundary of knowledge — the shape of what has not been tested, the structure of what is not known. This capability, built on the knowledge graph and the Frontier Engine, is the platform's deepest competitive advantage and the hardest to replicate.

**The platform is infrastructure, not a consumer product.** The consumer interfaces are the proof of concept and the market entry point. The long-term value is the citation integrity engine as a service — an API that any document workflow, AI system, or publishing process can query.

**Domain depth before domain breadth.** The platform's value comes from deep evidence coverage within a domain, not from shallow coverage across many domains. Life sciences is the founding domain and must be deeply covered before legal and AI governance are fully developed. The vertical adapter architecture supports this: each domain gets its own adapter, its own evidence sources, and its own claim-type handling.

**Epistemic honesty is a product feature.** The platform must be calibrated. A system that assesses citation integrity must itself be honest about the confidence of its own assessments. Calibrated confidence scores, explicit uncertainty representation, and the beyond-evidence state are not limitations — they are the product's core value proposition. The honest answer is always more valuable than the confident wrong answer.

**The distortion stack is the problem; the platform is the counter-infrastructure.** The web, the press release machine, and the LLM training pipeline all amplify and distort scientific claims. The platform anchors every verdict to primary evidence, upstream of every distortion layer. This is why the platform's value increases as AI-generated content proliferates: the more the distortion stack operates, the more valuable a system that can return to primary evidence becomes.

---

## Document History

| Version | Date | Summary |
|---|---|---|
| 1.0 | June 2026 (Phase 98) | Initial development reference — claim verification framing |
| 2.0 | June 2026 | Citation-first restatement — supersedes v1.0 entirely |

*This document is the authoritative platform blueprint. All development decisions, phase planning, and product positioning should be evaluated against the principles and architecture defined here. When in doubt, return to Section 1.1: a citation is an assertion, not a pointer. The platform's job is to evaluate that assertion.*
