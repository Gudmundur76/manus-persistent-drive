# Protein Truth Desk — Development Plan & Timeline to Finished Product

**Prepared:** June 11, 2026  
**Author:** Manus AI  
**Project:** [Protein Truth Desk](https://github.com/Gudmundur76/protein-truth-desk)  
**Current State:** Phase 108 complete · 1,119 tests passing · 0 TypeScript errors · Checkpoint `b82351a4`

---

## 1. What Has Been Built

The platform is substantially built. It is not a prototype — it is a functioning, autonomous scientific claim verification system with 91 server modules, 55 database tables, 43 migrations, 47 frontend routes, 41 tRPC routers, 14 live heartbeat cron jobs, and 1,119 passing unit tests. The core engine is production-quality. What remains is the **commercial surface** (public landing, pricing, onboarding, payment capture) and a handful of **depth features** (graph visualisation, score history backfill, contradiction resolution workflow, API key management UI).

### 1.1 Core Engine (Complete)

The multi-stage analysis pipeline is the heart of the product. A document enters at Stage 1 and exits Stage 8 with every scientific claim extracted, validated against primary databases, scored, and indexed into the knowledge graph.

| Stage | What It Does | Status |
|---|---|---|
| 1 — Extract | LLM identifies discrete scientific claims (structural, quantitative, methodological, organism) | ✅ Complete |
| 2 — Entity Resolution | Maps claim entities to PDB IDs, UniProt accessions, PubChem CIDs, PubMed PMIDs | ✅ Complete |
| 3 — Database Validation | Queries RCSB PDB, UniProt, PubChem, PubMed APIs for primary evidence | ✅ Complete |
| 4 — Friction Engine | Applies FrictionEngine to detect hallucination patterns and assign preliminary verdict | ✅ Complete |
| 5 — Completeness Gate | Blocks incomplete verdicts from advancing; enforces evidence threshold | ✅ Complete |
| 6 — Citation Chain Analysis | Traces citation provenance, detects distortion, scores chain integrity | ✅ Complete |
| 7 — Composite Truth Signal | Combines upstream verdict, provenance score, and chain distortion into a single `compositeTruthScore` | ✅ Complete |
| 8 — Graph Edge Population | Creates `semantic_similar` edges between the new claims and existing claims in the knowledge graph | ✅ Complete |

### 1.2 Autonomous Loop (Complete)

The platform runs without human intervention. Fourteen heartbeat cron jobs keep the knowledge graph current, self-improving, and internally consistent.

| Job | Cadence | Purpose |
|---|---|---|
| `pmc-feed-nightly` | Daily 01:00 UTC | Ingests new PubMed Central papers into the corpus |
| `quality-pass-nightly` | Daily 02:00 UTC | Upgrades draft-tier documents to verified via Kimi K2 |
| `inverse-prompt-daily` | Daily 03:00 UTC | Generates graph questions from Supported verdicts |
| `meta-agent-daily` | Daily 04:00 UTC | Code drift detection, stub ledger, pipeline invariant checks |
| `pubmed-decode-weekly` | Monday 06:00 UTC | Deep PubMed decode pass for new evidence |
| `discovery-loop-daily` | Daily 08:00 UTC | Discovers and registers new data sources per vertical |
| `self-prompt-2h` | Every 2 hours | Self-Prompt Engine: publishes scheduled ticks |
| `autonomous-loop-tick` | Every 2 hours | Autonomous loop event bus tick |
| `quality-scorer-6h` | Every 6 hours | Re-scores document quality tiers |
| `frontier-engine` | Every 6 hours | Gap mapping → evidence pursuit → hypothesis generation |
| `re-evaluate-composite-truth` | Every 6 hours | Re-scores claims stale due to new citation edges |
| `swarm-tick-daily` | Daily 03:00 UTC | Swarm intelligence: multi-agent code drift and pattern analysis |
| `wiki-engine-lint-weekly` | Sunday 02:00 UTC | Wiki page lint pass, dead-link detection |
| `contradiction-scan` | Monday 00:00 UTC | Flags claim pairs with opposing composite truth labels |

### 1.3 Knowledge Graph (Complete)

The graph is the platform's long-term moat. Every validated claim is a node. Every citation relationship is a directed edge. Every re-evaluation run deepens the signal.

- **55 database tables** covering claims, documents, audit reports, graph entities, graph relations, citation edges, graph claim edges, contradiction alerts, claim score history, wiki pages, knowledge gaps, frontier log, self-prompt log, dream sessions, and more.
- **Force-directed D3 graph visualisation** at `/graph` — nodes coloured by composite truth label, edges weighted by similarity score.
- **Co-occurrence graph** at `/cooccurrence` — entity co-occurrence matrix across the corpus.
- **Claim provenance** at `/provenance/:claimId` — full citation chain with distortion scores.
- **Composite truth timeline** on each claim page — sparkline of `compositeTruthScore` across re-evaluation runs.

### 1.4 Admin Intelligence Layer (Complete)

The admin layer is a full operational dashboard for the platform owner. It is not a simple CRUD interface — it is a live intelligence surface.

| Dashboard | Route | Purpose |
|---|---|---|
| Main Admin | `/admin` | Health report, meta-agent status, all sub-dashboards |
| Analytics | `/admin/analytics` | Corpus growth, verdict distribution, vertical coverage |
| Frontier Engine | `/admin/frontier` | Knowledge gap map, evidence pursuit log |
| Autonomous Loop | `/admin/loop` | Event bus, loop run history, manual triggers |
| Self-Prompt | `/admin/self-prompt` | Self-prompt cycle log, pending cycles |
| Inverse Prompt | `/admin/inverse-prompt` | Graph question generation log |
| Overrides | `/admin/overrides` | Manual verdict override audit trail |
| Contradiction Alerts | `/admin/contradictions` | Claim pairs with opposing labels, severity badges |
| Cron Dashboard | `/admin/crons` | All 14 heartbeat jobs, run history, Run Now buttons |
| Verticals | `/admin/verticals` | Configure research verticals, MeSH terms, source whitelist |
| Discovery Panel | `/admin/discovery` | Source discovery, probe, and registration |
| Deployment Dashboard | `/admin/deployments` | Micron deployment status |
| Embed Generator | `/admin/embed` | iFrame widget and SDK configuration |
| Admin Harness | `/admin/harness` | Meta-agent swarm harness, full system health |

### 1.5 Public-Facing Product (Partially Complete)

The public surface is functional but not commercially polished. A visitor can read the registry, explore the graph, browse verticals, read individual claim pages, and access the API docs. What they cannot yet do is sign up, pay, or be guided through an onboarding flow.

| Page | Route | Status |
|---|---|---|
| Public Claims Registry | `/registry` | ✅ Complete |
| Knowledge Graph | `/graph` | ✅ Complete |
| Verticals Index | `/verticals` | ✅ Complete |
| Vertical Detail | `/verticals/:domainKey` | ✅ Complete |
| Claim Detail | `/claim/:id` | ✅ Complete |
| Public Audit Report | `/reports/:id` | ✅ Complete |
| Wiki | `/wiki` | ✅ Complete |
| Trust & Methodology | `/trust` | ✅ Complete |
| API Documentation | `/docs/api` | ✅ Complete |
| Evidence Timeline | `/timeline` | ✅ Complete |
| Search | `/search` | ✅ Complete |
| Chat (AI) | `/chat` | ✅ Complete |
| Leaderboard | `/leaderboard` | ✅ Complete |
| **Public Landing Page** | `/` | ❌ Missing — redirects to `/dashboard` |
| **Pricing Page** | `/pricing` | ❌ Missing — no route exists |
| **Onboarding Flow** | `/welcome` | ❌ Missing |
| **Payment Capture** | `/checkout` | ❌ PayPal backend exists, no frontend |

### 1.6 Business Model (Backend Ready, Frontend Missing)

The commercial infrastructure is built on the server side but has no user-facing surface. `paypalCheckout.ts` defines three tiers and implements the full PayPal Orders v2 API flow. The `userSubscriptions` table exists in the database. The `checkAuditLimitPayPal` enforcement function is written. None of this is wired to a tRPC router or a frontend page.

| Plan | Price | Audits | Status |
|---|---|---|---|
| Starter | $1,500 | 5 full-depth audits | Backend ready, no frontend |
| Diligence | $5,000 | 25 audits | Backend ready, no frontend |
| Platform Pilot | $15,000 | Unlimited | Backend ready, no frontend |

---

## 2. What Remains to Finish the Product

The remaining work falls into four categories: **Commercial Surface** (required to generate revenue), **Depth Features** (required for the product to feel complete), **Quality & Hardening** (required for production confidence), and **Micron Expansion** (the long-term moat strategy).

### 2.1 Commercial Surface — Required for Revenue

These are the minimum features needed to convert a visitor into a paying customer. Without them, the product cannot generate revenue regardless of how sophisticated the engine is.

**Phase 109 — Public Landing Page** (3–4 days)  
Replace the current redirect-to-dashboard `Home.tsx` with a proper public landing page. The page must communicate the product's value proposition in one sentence, show the three pricing tiers, include a "Start Free Audit" CTA, and link to the Registry, Trust, and API docs. JSON-LD structured data must be present for AI search engine discovery. The e2e test suite already specifies what this page must contain (hero heading, CTA, navigation links, JSON-LD).

**Phase 110 — Pricing Page** (`/pricing`)  (2–3 days)  
A dedicated pricing page at `/pricing` showing the three tiers (Starter $1,500, Diligence $5,000, Platform Pilot $15,000) with a feature comparison table, a FAQ section, and a "Request Audit" form for the Starter tier. The e2e spec already tests for this route and expects pricing tiers or an audit request form to be present.

**Phase 111 — PayPal Checkout Frontend** (3–4 days)  
Wire the existing `paypalCheckout.ts` server functions to tRPC procedures (`payment.createOrder`, `payment.captureOrder`, `payment.getSubscription`) and build a checkout flow: plan selection → PayPal redirect → capture → subscription activation → redirect to dashboard with active plan badge. The `userSubscriptions` table and `checkAuditLimitPayPal` enforcement are already in place.

**Phase 112 — Onboarding Flow** (2–3 days)  
After a user authenticates for the first time (via magic link), redirect them to a three-step onboarding: (1) choose a vertical, (2) submit their first document, (3) view the audit report. This reduces time-to-value from "sign in and stare at an empty dashboard" to "sign in and see a real result within 2 minutes."

### 2.2 Depth Features — Required for Product Completeness

These features are either already partially built or are the natural next step from completed phases.

**Phase 113 — Score History Backfill Job** (1–2 days)  
A one-time scheduled job that backfills `claim_score_history` from existing `claims.compositeTruthScore` values so the Composite Truth Timeline sparkline is populated for all claims verified before Phase 108 was deployed. Without this, the sparkline is empty for all existing claims.

**Phase 114 — Contradiction Resolution Workflow** (2–3 days)  
When a contradiction alert is raised, automatically notify the original document submitter via the owner notification system. Add a "Resolve" workflow to `ContradictionViewer.tsx` that lets a reviewer add resolution notes, mark the alert resolved, and optionally trigger a re-evaluation of both claims. The `ContradictionViewer.tsx` page already has a resolution notes textarea — it just needs to be wired to the `contradictions.updateStatus` tRPC procedure.

**Phase 115 — API Key Management UI** (1–2 days)  
The `apiKeys` table exists in the schema and `ApiKeys.tsx` page exists in the frontend. The page needs to be fully wired to tRPC procedures for create, list, revoke, and rotate. This is a prerequisite for the Platform Pilot tier, which includes API access.

**Phase 116 — Graph Visualisation Admin Page** (2–3 days)  
Build an interactive `/admin/graph` page using the existing `ForceGraph2D` component (already used in `/graph`) to render the `claim_graph_edges` table — nodes coloured by composite truth label, edges weighted by `edgeWeight`. This gives operators a visual inspection surface for the knowledge graph topology and contradiction clusters.

**Phase 117 — Micron Deployment Pipeline** (3–4 days)  
The `micronDeployments` table and `generate-micron.ts` script exist. Build the full pipeline: admin triggers a micron generation for a vertical → system generates a static HTML mini-site with the top 20 verified claims → deploys to a subdomain → registers in `micronDeployments`. This is the "free publication" marketing channel described in the business strategy.

### 2.3 Quality & Hardening — Required for Production Confidence

**Phase 118 — E2E Test Suite Completion** (2–3 days)  
The Playwright e2e spec at `e2e/app.spec.ts` tests 10 critical flows. Currently the `/pricing` route does not exist, so tests 7 and 8 fail. Once the pricing page is built, run the full e2e suite in CI and fix any remaining failures. Add e2e tests for the checkout flow and onboarding.

**Phase 119 — PayPal Credentials & Live Mode** (1 day)  
Configure `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, and `PAYPAL_MODE=live` via `webdev_request_secrets`. Test the full checkout flow end-to-end with a real PayPal sandbox account. Switch to live mode after KYC verification.

**Phase 120 — Rate Limiting & Abuse Prevention** (1–2 days)  
The public submission endpoint already has IP-based rate limiting (10 req/IP/hour). Extend this to the tRPC layer for unauthenticated procedures. Add a `publicSubmissions` quota check to the checkout flow so free-tier users cannot bypass the audit limit.

**Phase 121 — SEO & AI Discoverability Audit** (1–2 days)  
Run a full SEO audit against the public pages. Verify JSON-LD is present and correct on the landing page, registry, claim pages, and public reports. Submit the sitemap to Google Search Console. Verify the `/robots.txt` and `sitemap.xml` are correct.

### 2.4 Micron Expansion — Long-Term Moat

The micron strategy is the platform's compounding moat. Each micron is a lightweight, static mini-site for a specific vertical (e.g., `structural-biology.truthdesk.io`, `nutrition.truthdesk.io`) that publishes the top verified claims for that domain. Microns serve three purposes: they market the main product to domain-specific audiences, they generate backlinks and AI search citations, and they validate the platform's coverage of each vertical.

**Phase 122+ — Vertical Microns** (1–2 days per vertical)  
Generate and deploy microns for each of the six live verticals: Structural Biology, UniProt, ClinicalTrials.gov, Nutrition & Food Science, Biotech, and Sports Science. Each micron is a static HTML page with JSON-LD, a claim table, and a "Verify your document" CTA linking back to the main platform.

---

## 3. Timeline to Finished Product

"Finished product" is defined as: a public landing page, a working pricing page, a functional checkout flow, an onboarding sequence, all depth features complete, and the e2e test suite passing. This is the minimum viable commercial product (MVCP).

The timeline below assumes one focused development session per phase (typically 2–4 hours of agent work per phase).

| Week | Phases | Deliverable |
|---|---|---|
| **Week 1** (Jun 12–18) | 109, 110, 111 | Public landing page live · Pricing page live · PayPal checkout wired |
| **Week 2** (Jun 19–25) | 112, 113, 114 | Onboarding flow · Score history backfill · Contradiction resolution |
| **Week 3** (Jun 26 – Jul 2) | 115, 116, 117 | API key management · Graph admin page · Micron pipeline |
| **Week 4** (Jul 3–9) | 118, 119, 120, 121 | E2E suite passing · PayPal live mode · Rate limiting · SEO audit |
| **Week 5+** (Jul 10+) | 122+ | Vertical microns deployed · Ongoing corpus growth |

The platform reaches **MVCP** at the end of Week 4. At that point, a visitor can land on the homepage, understand the product, choose a plan, pay, submit a document, and receive a full audit report — all without any manual intervention from the owner.

---

## 4. What "Finished" Looks Like

A finished Protein Truth Desk has the following user journey working end-to-end without any manual steps:

1. A researcher finds the platform via an AI search engine (ChatGPT, Perplexity, Google AI) citing a public claim page or micron.
2. They visit the landing page, read the value proposition, and click "Start Free Audit."
3. They authenticate via magic link.
4. The onboarding flow guides them to submit their first document.
5. The 8-stage pipeline runs autonomously and produces a full audit report within 2–5 minutes.
6. They see the report, are impressed, and click "Upgrade to Diligence" to submit 25 documents.
7. They complete payment via PayPal and are redirected to their dashboard with an active plan badge.
8. Every 6 hours, the re-evaluation loop re-scores their claims as new evidence arrives.
9. Every Monday, the contradiction scan checks whether any of their claims conflict with newly validated claims from other documents.
10. The knowledge graph grows. The microns publish new verified claims. The platform markets itself.

The autonomous loop means the platform compounds in value every day without any owner action. The micron strategy means the platform markets itself to domain-specific audiences. The PayPal checkout means the platform generates revenue without any sales calls.

---

## 5. Recommended Phase Order

The following table summarises the remaining phases in recommended execution order, with effort estimates and priority ratings.

| Phase | Title | Effort | Priority | Dependency |
|---|---|---|---|---|
| 109 | Public Landing Page | 3–4 days | P0 — Blocks all commercial activity | None |
| 110 | Pricing Page | 2–3 days | P0 — Required for conversion | 109 |
| 111 | PayPal Checkout Frontend | 3–4 days | P0 — Required for revenue | 110 |
| 112 | Onboarding Flow | 2–3 days | P1 — Reduces time-to-value | 111 |
| 113 | Score History Backfill | 1–2 days | P1 — Completes Phase 108 | None |
| 114 | Contradiction Resolution Workflow | 2–3 days | P1 — Closes the detection loop | 107 |
| 115 | API Key Management UI | 1–2 days | P1 — Required for Platform Pilot tier | None |
| 116 | Graph Visualisation Admin Page | 2–3 days | P2 — Operator tooling | 104 |
| 117 | Micron Deployment Pipeline | 3–4 days | P2 — Marketing channel | None |
| 118 | E2E Test Suite Completion | 2–3 days | P1 — Production confidence | 109, 110 |
| 119 | PayPal Live Mode | 1 day | P0 — Required for real revenue | 111 |
| 120 | Rate Limiting & Abuse Prevention | 1–2 days | P1 — Security hardening | None |
| 121 | SEO & AI Discoverability Audit | 1–2 days | P2 — Growth channel | 109 |
| 122+ | Vertical Microns | 1–2 days each | P2 — Compounding moat | 117 |

---

## 6. Current Strengths and Risks

**Strengths.** The engine is genuinely differentiated. No other platform validates scientific claims against primary databases (PDB, UniProt, PubChem, PubMed) with a multi-stage pipeline, a citation chain distortion score, a composite truth signal, an autonomous re-evaluation loop, and a contradiction detection engine. The knowledge graph compounds in value with every document submitted. The 14 heartbeat cron jobs mean the platform self-improves without any owner action. The 1,119 passing tests give high confidence in the engine's correctness.

**Risks.** The primary risk is the gap between the engine's sophistication and the commercial surface's completeness. The platform cannot currently convert a visitor into a paying customer. This is the most important gap to close. A secondary risk is the 43-router TypeScript type inference limit — the `appRouter` is at capacity, and any new top-level router must be merged into an existing one. This is a manageable architectural constraint but requires discipline. A third risk is the PayPal integration: the backend is written but untested against a real PayPal sandbox, and the live mode requires KYC verification which has a variable timeline.

---

*This document reflects the state of the project as of Phase 108 (June 11, 2026). It should be updated after each completed phase.*
