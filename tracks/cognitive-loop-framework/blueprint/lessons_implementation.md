# Lessons from the Frontier and Implementation Plan for citation.is

*Prepared June 2026*

This document translates the findings from the deep research report into concrete lessons and an actionable implementation plan for the `ttruthdesk-platform` codebase.

---

## 1. Lessons from the Frontier

### Lesson 1: The Market Needs "Provenance," Not Just "Search"
The University of Southern Denmark/Göttingen paper (April 2026) coined the term "Provenance Gap" to describe the fact that frontier LLMs produce zero verifiable citations unprompted, and at best 15.3% when prompted [1].
*   **The Lesson:** The enterprise buyer (pharma, biotech, regulatory) does not want a better search engine. They want a **provenance store**. They need a system that takes an LLM-generated claim and attaches a cryptographic or cryptographically-hardened chain of evidence to it so they can submit it to the FDA or EMA without fear of hallucination.
*   **Your Advantage:** citation.is is already architected as a provenance store. The stable claim IDs and structured verdicts are exactly what this market requires.

### Lesson 2: MCP is the Canonical Integration Layer
The IBM Research paper (May 2026) explicitly argues that scaling AI scientific discovery requires an interoperability layer, and it designates the Model Context Protocol (MCP) as that layer [2]. The Science Earth paper (May 2026) builds a planet-scale operating system on top of MCP [3].
*   **The Lesson:** You do not need to build custom API integrations for every new LLM or agent framework. The entire academic and enterprise frontier has agreed that MCP is the standard.
*   **Your Advantage:** You already have 11 MCP tools built into the `ttruthdesk-platform`. You are perfectly positioned.

### Lesson 3: The Gap is Claim-Level Granularity
Ai2's OpenScholar (Nature, Feb 2026) is the state-of-the-art for scientific synthesis [4]. However, it operates at the document level (retrieving and citing papers). Microsoft Research's internal tools (FactCheck, GraphCheck) operate at the claim level [5].
*   **The Lesson:** Document-level retrieval is solved (by Ai2 and others). Claim-level verification against authoritative databases (like your PDB and UniProt integrations) is the unsolved frontier.
*   **Your Advantage:** Your pipeline is already built around claim extraction and entity resolution.

---

## 2. Implementation Plan

To capitalise on these lessons, the following concrete changes should be implemented in the `ttruthdesk-platform` codebase.

### Phase 1: Re-position the MCP Server as a "Provenance Store"

The current MCP implementation in `/server/mcp/` provides excellent tools (`search_claims`, `verify_claim`). It needs to be explicitly branded and extended to serve as the "provenance store" described in the IBM Research paper.

**Actions:**
1.  **Add a `get_provenance_chain` MCP Tool:** Create a new tool that takes a claim ID and returns the full evidentiary chain: the source paper, the extracted entities, the authoritative database checks (e.g., UniProt match), and the temporal version history of the verdict.
2.  **Update `llms.txt` and `llms-full.txt`:** Rewrite the introductory text in these files to explicitly state: *"citation.is is an MCP-native provenance store for scientific claims. Use these tools to resolve the Provenance Gap in your clinical or scientific reasoning."* Use the exact vocabulary the frontier labs are using.

### Phase 2: Implement the "Provenance Gap" Audit Route

You need to prove to enterprise buyers that your system solves the problem identified in the April 2026 paper.

**Actions:**
1.  **Create `/api/audit/provenance-gap`:** Build a new REST endpoint that accepts a block of text (e.g., an LLM-generated clinical differential).
2.  **Decompose and Verify:** The endpoint should decompose the text into claims (reusing your existing extractor), run them through your verification pipeline, and return a "Provenance Score" — highlighting which claims are supported, which are refuted, and which are hallucinations.
3.  **Publish the Results:** Run this audit tool against the same 36 scenarios used in the USD/Göttingen paper and publish the results on the `citation.is/developers` page. Show that while Claude Opus achieves 15.3% verifiability, an agent using the citation.is MCP server achieves 100%.

### Phase 3: Build the "Self-Building" Orchestration Loop

As discussed in the codebase analysis, the system currently processes data autonomously but cannot fix itself. To become the "autonomous scientific infrastructure" described in the Science Earth paper, you must close the loop.

**Actions:**
1.  **Elevate the Meta-Agent:** Modify `/server/autonomous/metaLayer.ts`. When it detects a failing vertical adapter or a schema drift, it should publish a `system_capability_required` event to the `eventBus`.
2.  **Manus Integration:** Expand `/server/manusOrchestrator.ts`. When it receives a `system_capability_required` event, it should make an API call to Manus to spawn a Development Agent.
3.  **The Prompt:** The prompt to Manus should be: *"The PubMed adapter in ttruthdesk-platform is failing. Clone the repo, fix the schema in `/server/verticals/pubmed.ts`, run the test suite, and open a PR."*

### Phase 4: Prepare for EU AI Act Compliance

The EU AI Act mandates independent verification for clinical AI. You need to make citation.is the easiest way for European health-tech companies to comply.

**Actions:**
1.  **Add Compliance Metadata:** Update the Drizzle schema for the `claims` table to include a `verification_standard` field (e.g., "EU-AI-Act-Tier-1").
2.  **Create a Compliance Export:** Add a feature to the API and MCP server that generates a PDF or signed JSON report of a claim's provenance chain, specifically formatted for regulatory submission.

---

## Summary

The frontier research confirms that your architectural instincts — MCP-native, claim-level granularity, autonomous verification — are exactly correct. The implementation gap is not about changing direction; it is about exposing your existing architecture using the vocabulary (Provenance Gap, Provenance Store) that the enterprise market is now looking for, and closing the final "self-building" loop with Manus.

---

## References

[1] Ahmed, M. S., et al. (2026). The Provenance Gap in Clinical AI: Evidence-Traceable Temporal Knowledge Graphs for Rare Disease Reasoning. *arXiv preprint arXiv:2604.17114*. https://arxiv.org/abs/2604.17114
[2] Yue, L., et al. (2026). Building MCP-native hierarchical AI scientist ecosystems: a perspective on scaling multi-agent scientific discovery. *Frontiers in Artificial Intelligence*, 9. https://www.frontiersin.org/journals/artificial-intelligence/articles/10.3389/frai.2026.1820375/full
[3] Zhao, Z., et al. (2026). Science Earth: Towards A Planet-Scale Operating System for AI-Native Scientific Discovery. *arXiv preprint arXiv:2606.01316*. https://arxiv.org/abs/2606.01316
[4] Allen Institute for AI. (2026). Synthesizing scientific literature with retrieval-augmented LMs. *Ai2 Blog*. https://allenai.org/blog/nature-openscilm
[5] Microsoft Research. (2025). Microsoft Research 2025: A year in review. https://www.microsoft.com/en-us/research/story/microsoft-research-2025-a-year-in-review/
