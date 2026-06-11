# Citations Master Reference Document — Key Findings

## Source
- File: `/home/ubuntu/upload/Citations__Master_Reference_Document.pdf`
- Pages reviewed so far: 1-10 of 12

## Core thesis
A citation is not merely a pointer to a source. It is an **assertion** that a cited source supports a specific claim. The central architectural problem in knowledge systems is that current citation systems treat references as binary pointers rather than typed, graded relationships between a claim and evidence.

## Citation as a computing primitive
The document frames citation as a missing typed reference system. Present systems largely support only a binary state: cited or not cited. The proposed model introduces four graded citation states:

| Citation state | Epistemic meaning | Computing analogue | Truth Desk mapping |
| --- | --- | --- | --- |
| Verified | Claim directly supported by primary evidence | Strong typed reference | Supported |
| Contested | Evidence exists but is qualified or disputed | Weak reference with confidence interval | Partially Supported / Contradicted |
| Implied but untested | Evidence implies the claim but it has not been directly tested | Inferred reference from graph topology | Frontier output |
| Beyond current evidence | No evidence exists; honest boundary of knowledge | Typed null / no valid target | Insufficient Evidence plus explicit gap shape |

The document argues that the missing primitive is the equivalent of a **typed null** for citation systems: a structured way to represent that no supporting evidence currently exists for a claim.

## Known/unknown framework
The four citation states are mapped onto a known/unknown framework:

| Quadrant | Citation status | Meaning |
| --- | --- | --- |
| Known known | Verified | Directly supported by evidence |
| Known known, disputed | Contested | Evidence exists but remains qualified or disputed |
| Unknown known | Implied but untested | Evidence implies the claim but it is not directly tested |
| Unknown unknown | Beyond current evidence | Honest representation of the current evidence boundary |

## Why the unknown unknown matters
The document treats the unknown unknown citation as strategically decisive. It argues that frontier knowledge claims are currently indistinguishable from ordinary unsupported claims because citation systems lack a formal way to represent the boundary of evidence. This becomes especially important for LLMs, which otherwise fill such gaps with confident synthesis rather than grounded support.

## Documented failure modes
The document identifies five major citation failure modes:

1. **Fabrication** — nonexistent citations, now substantially increased in AI-generated work.
2. **Misrepresentation** — real papers cited in ways that overstate or distort what they found.
3. **Amplification and distortion** — citation chains can turn weak or speculative findings into apparent consensus through repetition.
4. **Error propagation through retraction** — retracted findings continue spreading through indirect citation networks long after retraction.
5. **Unknown unknown problem** — no native mechanism exists to cite the absence or boundary of evidence.

Examples noted in the document include hallucinated citations in 2025 papers, AI tendency to use more confident language when hallucinating, and the Greenberg-effect style citation topology where network structure creates false authority.

## Internet and LLM training failure stack
The document describes an end-to-end distortion stack in which each layer compounds the previous one:

| Layer | Distortion mechanism | Effect |
| --- | --- | --- |
| Primary research | Publication bias, null result suppression | Literature overrepresents successful findings |
| Peer-reviewed citation | Amplification, bias, invention | Weak findings gain authority |
| Press releases | Overclaiming, omitted caveats | Qualified findings sound definitive |
| Science journalism | Telephone-game retellings | Effect sizes inflate, nuance disappears |
| Web content | Weak retraction infrastructure, poor filtering | Distorted claims persist and multiply |
| LLM training corpus | Common Crawl ingests the above layers | Distorted versions become training ground truth |
| LLM output | Confident synthesis of distorted data | Fluent but wrong answers |

The document states that a standard three-stage AI pipeline amplifies corpus distortion by a factor of **2.18x** and identifies four AI-governance failure modes: confident rediscovery, ghost evidence accumulation, replication laundering, and confidence miscalibration.

## Market landscape
The document positions current tools in tiers:

| Tier | Question answered | Position relative to Truth Desk |
| --- | --- | --- |
| Citation existence tools (e.g. CiteTrue/CiteIy/Recite) | Does the citation exist? | Not the target market |
| Citation classification tools (e.g. Scite.ai) | How is the citation being used? | Adjacent / possible partner |
| Truth Desk target tier | Does this claim correctly represent what the evidence says? | Presented as unoccupied |

It highlights that no current tool asks whether a specific claim accurately represents what its cited source actually found.

## Domain focus
The document frames three core domains:

| Domain | Why it matters |
| --- | --- |
| Life sciences and pharma | High regulatory pressure and large manual substantiation burden |
| Legal | Existing tools verify citation validity, not whether a brief accurately represents the case |
| AI governance | Enterprises need to audit whether LLM outputs accurately represent cited sources |

Academic publishing is also framed as an acute crisis area because of large-scale hallucinated citations and publisher pressure for automated integrity checks.

## Mapping to the current build
The document explicitly argues that the citation-first shift is **additive** rather than destructive. It says the following can remain:
- Existing ingestion pipelines
- Existing verdict engine
- Knowledge graph structure
- Frontier Engine
- Dream State Engine
- Heartbeat jobs, public API, and current endpoints

It identifies these additive upgrades:
1. A dedicated `citations` table linking claim, source document, passage, relationship type, and confidence score.
2. Passage extraction during ingestion so verdicts can point to the exact supporting or contradicting passage.
3. API schema extensions adding passage, location, and relationship type without breaking existing consumers.
4. Citation-level confidence alongside existing claim-level confidence.

## Type system implementation
The document proposes an explicit citation type system:
- `CitationType.VERIFIED`
- `CitationType.CONTESTED`
- `CitationType.IMPLIED`
- `CitationType.BEYOND_EVIDENCE`

It stresses that operations must preserve epistemic type information and not collapse a `BEYOND_EVIDENCE` state into an ordinary confidence score.

## Strategic position
The document’s strategic summary is that Truth Desk should be understood not as a citation checker but as the **corrective infrastructure for the LLM knowledge stack**: a typed, graded, null-safe citation layer that current citation architectures lack.

## Partnership opportunity
The document frames Scite.ai as a potential partner rather than a direct competitor. Their 1.6 billion citation statements and publisher licensing agreements (Wiley, SAGE, BMJ, 40+ publishers) could feed the Truth Desk verdict engine as a signal layer. The proposed positioning is: Truth Desk provides the deeper domain-specific verdict layer (against PDB, UniProt, FDA, ClinicalTrials.gov) on top of Scite.ai's citation classification infrastructure.

## Key references cited in the document

| Source | Key finding | Relevance |
| --- | --- | --- |
| Greenberg, BMJ 2009 | 220,553 citation paths built unfounded scientific consensus through amplification and invention | Core citation distortion mechanism |
| Zhao et al., arXiv 2026 | 146,932 hallucinated citations in papers published in 2025 | Scale of fabrication problem |
| Lee, arXiv April 2026 | LLMs trained on positive-result literature inherit distorted model of science | Publication bias → LLM miscalibration |
| Chauhan, arXiv June 2026 | Null result gap 0.35–0.60; AI pipeline amplifies distortion 2.18x | Quantified LLM knowledge failure |
| Baack, ACM FAccT 2024 | Common Crawl contains substantial low-quality, unreliable content with no quality filtering | LLM training data problem |
| Fanelli, 2012 | 88.6% of published papers report positive results | Publication bias scale |
| Chalmers & Glasziou, 2009 | 85% of research investment avoidably wasted | Cost of the file drawer |
| Scite.ai | 1.6B citation statements, Novo Nordisk client, MCP integration | Closest competitor, potential partner |
| VeriCite, ACM 2025 | Post-generation RAG citation validation — reduces fabrication, not misrepresentation | Current frontier, still insufficient |

## Closing statement from the document
> *This document consolidates all citation-related research and strategic discussion from the June 2026 session. Use it as the primary reference for build decisions, investor conversations, and product positioning.*

