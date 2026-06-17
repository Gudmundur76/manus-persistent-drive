# Source Coverage Roadmap — citation.is / ttruthdesk-platform

*Written: 2026-06-17 | Status: AUTHORITATIVE PLAN*

---

## Acceptance Criterion for New Sources

Every source added must meet this principle:

> **Authoritative, structured, primary-source evidence that can be used to verify or refute a factual claim, accessible via a queryable REST API.**

Secondary aggregators, news sources, blogs, and anything that synthesises rather than originates evidence does not qualify. The source must be the definitive record for its domain — the thing that other systems cite, not the thing that cites others.

---

## Current State (as of Sprint 28 / 2026-06-17)

**42 adapters registered and imported in `server/verticalAdapters/index.ts`.**

All 42 adapter files exist, call `registerVertical()` on load, and are imported in `index.ts`. The registry is fully populated. The gap is not missing adapters — it is that `citationSearchRoute.ts` does not exist in the repo and the live endpoint only dispatches to 6 of them.

### Complete Adapter Inventory

| domainKey | Display Name | Primary Source |
|---|---|---|
| structural_biology | RCSB PDB | Protein Data Bank — experimental 3D structures |
| uniprot | UniProt | Protein identity, function, sequences |
| salmon_biotech | Salmon Biotech | Internal vertical |
| protein_supplement | Protein Supplement | Internal vertical |
| creatine_ergogenics | Creatine & Ergogenics | Internal vertical |
| gut_microbiome | Gut Microbiome | Internal vertical |
| collagen_peptides | Collagen & Peptides | Internal vertical |
| plant_based_protein | Plant-Based Protein | Internal vertical |
| sports_nutrition_rct | Sports Nutrition RCTs | Internal vertical |
| clinical_trials | ClinicalTrials.gov | US clinical trial registry |
| cochrane | Cochrane Library | Systematic reviews — gold standard |
| clinvar | ClinVar (NCBI) | Genetic variants — pathogenicity |
| europe_pmc | Europe PMC | Open access life sciences literature |
| openfda_labels | OpenFDA Drug Labels | FDA drug labelling and indications |
| chembl | ChEMBL | Drug/compound bioactivity |
| pubchem | PubChem | Chemical compounds |
| crossref | CrossRef | 130M+ DOIs — universal citation registry |
| openalex | OpenAlex | 250M+ scholarly works |
| semantic_scholar | Semantic Scholar | 200M+ papers — semantic search |
| opencitations | OpenCitations | Open citation graph + bibliographic metadata |
| crossref_retraction | CrossRef Retraction | DOI retraction detection |
| biorxiv | bioRxiv / medRxiv | Biology and medicine preprints |
| arxiv | arXiv | CS, physics, maths preprints |
| ipcc | IPCC | Assessment Reports — climate science |
| noaa | NOAA | Climate observations, sea level, temperature |
| owid | Our World in Data | Long-run global trends |
| fred | FRED | Federal Reserve economic data (250K+ series) |
| imf | IMF DataMapper | GDP, inflation, fiscal data (190+ countries) |
| oecd | OECD iLibrary | Economic statistics |
| eurostat | Eurostat | EU official statistics |
| world_bank | World Bank | Development indicators |
| edgar_sec | SEC EDGAR | Financial filings |
| eur_lex | EUR-Lex | EU law and regulations |
| court_listener | CourtListener | US case law |
| ietf_rfc | IETF RFC | Internet standards |
| nist | NIST | Measurement and cybersecurity standards |
| who | WHO GHO | Global health indicators |
| wikidata | Wikidata | Structured knowledge graph |
| generic_source | Generic Source | URL/DOI fallback |
| unknown | Unknown | No-op fallback |
| imf | IMF | (see above) |
| opencitations | OpenCitations | (see above) |

**Known gap:** `openfda` (adverse events — FDA FAERS) is declared as a `SourceId` in `domainClassifier.ts` but has no adapter file. Only `openfda_labels` (drug labels) is implemented. Sprint 30 fixes this.

---

## Sprint Roadmap

### Sprint 29 — Wire All 42 Existing Adapters (READY TO BUILD)

**Goal:** Build `server/citationSearchRoute.ts` — the properly committed, tested route that wires all 42 adapters into the citation search pipeline via domain classification.

**See:** `sprints/sprint-29-brief.md` for full spec.

**Definition of done:**
- `server/citationSearchRoute.ts` with ≥12 tests
- Route registered at `GET /api/citation-search/stream`
- All 2,855+ tests green, TSC clean, ESLint clean
- Live on `ttruthdesk.claims`, `citation.is` HeroSearch working end-to-end

---

### Sprint 30 — Biomedical Depth (4 new adapters)

**Goal:** Fill the most critical gaps in clinical and pharmacological coverage.

| Adapter | domainKey | Source | API |
|---|---|---|---|
| OpenFDA Adverse Events | `openfda` | FDA FAERS database | `https://api.fda.gov/drug/event.json` |
| NICE Evidence | `nice_evidence` | UK NICE guidelines | `https://api.nice.org.uk/` |
| WHO IRIS | `who_iris` | WHO primary technical reports | OAI-PMH + REST |
| EMBASE via Europe PMC | `embase` | Broader pharmacology than PubMed | Europe PMC API (EMBASE subset) |

**Domain rule updates needed:**
- `pharmacology` → add `openfda` (adverse events) alongside `openfda_labels`
- `clinical_trial` → add `nice_evidence`
- `public_health` → add `who_iris` alongside existing `who`
- `biomedical_general` → add `embase` alongside `europe_pmc`

**Total adapters after Sprint 30:** 46

---

### Sprint 31 — Climate and Environment (3 new adapters)

**Goal:** Extend climate coverage beyond NOAA/IPCC/OWID to include observational satellite data and regulatory environmental records.

| Adapter | domainKey | Source | API |
|---|---|---|---|
| NASA Earthdata | `nasa_earthdata` | Primary satellite and observational climate data | `https://cmr.earthdata.nasa.gov/search/` |
| European Environment Agency | `eea` | EU environmental monitoring — air, water, biodiversity | `https://www.eea.europa.eu/api/` |
| US EPA Science Inventory | `epa_science` | EPA research publications and toxicology data | `https://cfpub.epa.gov/si/si_public_search_results.cfm` |

**Domain rule updates needed:**
- `climate` → add `nasa_earthdata` alongside `noaa`, `ipcc`, `owid`
- New domain `environment` → `eea`, `epa_science`, `owid`

**Total adapters after Sprint 31:** 49

---

### Sprint 32 — Nutrition and Food Safety (2 new adapters)

**Goal:** Complete the nutrition and food safety domain with primary US and international databases.

| Adapter | domainKey | Source | API |
|---|---|---|---|
| USDA FoodData Central | `usda_fooddata` | Primary US nutritional composition database | `https://api.nal.usda.gov/fdc/v1/` |
| CODEX Alimentarius | `codex` | International food safety standards — FAO/WHO | `https://www.fao.org/fao-who-codexalimentarius/codex-texts/` |

**Domain rule updates needed:**
- `food_safety` → add `usda_fooddata` and `codex` alongside `efsa_openfoodtox` and `who`

**Total adapters after Sprint 32:** 51

---

### Sprint 33 — Economics and Law (2 new adapters)

**Goal:** Complete financial stability coverage and add primary US legislative source.

| Adapter | domainKey | Source | API |
|---|---|---|---|
| BIS Statistics | `bis` | Bank for International Settlements — global banking data | `https://stats.bis.org/api/v1/` |
| US Code (Congress.gov) | `us_code` | Primary US federal legislation | `https://api.congress.gov/` |

**Domain rule updates needed:**
- `economics_macro` → add `bis` alongside `fred`, `imf`, `oecd`, `world_bank`
- `legal` → add `us_code` alongside `eur_lex`, `court_listener`

**Total adapters after Sprint 33:** 53

---

### Sprint 34 — Molecular Biology and Chemistry (2 new adapters)

**Goal:** Add predicted protein structures and physical chemistry constants.

| Adapter | domainKey | Source | API |
|---|---|---|---|
| AlphaFold Database | `alphafold` | 200M+ predicted protein structures (EMBL-EBI) | `https://alphafold.ebi.ac.uk/api/` |
| NIST Chemistry WebBook | `nist_chemistry` | Primary thermodynamic and spectroscopic constants | `https://webbook.nist.gov/cgi/cbook.cgi` |

**Domain rule updates needed:**
- `structural_biology` → add `alphafold` alongside `rcsb_pdb` and `uniprot`
- `chemistry` → add `nist_chemistry` alongside `pubchem` and `chembl`

**Note:** `nist_chemistry` is a separate source from the existing `nist` adapter (which covers cybersecurity and measurement standards).

**Total adapters after Sprint 34:** 55

---

### Sprint 35 — Social Science and Preprints (3 new adapters)

**Goal:** Extend coverage into social science, psychology, and economics preprints.

| Adapter | domainKey | Source | API |
|---|---|---|---|
| Campbell Collaboration | `campbell` | Systematic reviews — education, crime, international development | `https://www.campbellcollaboration.org/api/` |
| APA PsycArticles | `psycarticles` | Psychology and behavioural science literature | APA API (open subset) |
| SSRN | `ssrn` | Economics, law, social science preprints | Elsevier API |

**Domain rule updates needed:**
- New domain `social_science` → `campbell`, `psycarticles`, `semantic_scholar`
- `preprint` → add `ssrn` alongside `biorxiv`, `arxiv`

**Total adapters after Sprint 35:** 58

---

## Final State After Sprint 35

58 adapters covering:

- **Biomedical:** PubMed (Europe PMC), OpenAlex, Semantic Scholar, Cochrane, EMBASE, ClinicalTrials.gov, NICE, WHO, WHO IRIS, ClinVar, OpenFDA (labels + adverse events), ChEMBL, PubChem, bioRxiv, CrossRef, OpenCitations
- **Structural biology:** RCSB PDB, UniProt, AlphaFold
- **Chemistry:** PubChem, ChEMBL, NIST Chemistry WebBook
- **Climate / environment:** NOAA, IPCC, OWID, NASA Earthdata, EEA, EPA
- **Nutrition / food safety:** EFSA OpenFoodTox, USDA FoodData Central, CODEX Alimentarius, WHO
- **Economics / finance:** FRED, IMF, OECD, Eurostat, World Bank, BIS, SEC EDGAR
- **Law / standards:** EUR-Lex, CourtListener, US Code, IETF RFC, NIST
- **Social science:** Campbell Collaboration, APA PsycArticles, SSRN
- **Academic (general):** CrossRef, OpenAlex, Semantic Scholar, OpenCitations, arXiv, Wikidata
- **Internal verticals:** salmon_biotech, protein_supplement, creatine_ergogenics, gut_microbiome, collagen_peptides, plant_based_protein, sports_nutrition_rct

Any scientific, regulatory, legal, or economic claim can be verified against the authoritative primary source for its domain. This is the complete coverage target.

---

## Implementation Notes for Backend Agent

Each new adapter follows the same pattern as existing adapters:

1. Create `server/verticalAdapters/{sourceKey}.ts` implementing `VerticalAdapter`
2. Set `domainKey`, `displayName`, `description`, `claimExtractorPrompt`, `discoverySearchTerms`
3. Implement `lookupEvidence({ claimText, extractedValue })` → `EvidenceResult`
4. Call `registerVertical(new AdapterClass())` at module level
5. Import the new file in `server/verticalAdapters/index.ts`
6. Add the new `sourceId` to `domainClassifier.ts` `SourceId` type
7. Add routing rules to `server/domainRules.ts`
8. Write ≥8 tests in `{sourceKey}.test.ts`

Reference implementation: `server/verticalAdapters/openAlex.ts` (256 lines, clean pattern).

Confidence scoring pattern:
- Base score from source quality (0.60–0.85)
- Bonuses for citation count, peer review, ORCID verification
- Penalties for preprint status, retraction notice
- Clamp to [0.30, 0.95]
- Never throw — return `{ found: false, confidenceScore: 0, ... }` on any error
