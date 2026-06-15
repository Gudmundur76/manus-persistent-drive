# Sprint 26 Post-Sprint Log

**Sprint:** 26
**Date:** 2026-06-15
**Status:** COMPLETE
**Quality Gate:** 2,835 tests passing | 0 typecheck errors | 0 lint warnings

---

## Goal

Wire the questionDecomposer to the full 29-source registry router so every decomposed claim is dispatched to the correct adapter by domain. Expose domain routing in the verify-claim response for Perplexity/OpenAI/Anthropic partnership pitch.

---

## Files Built / Modified

### New Files

| File | Lines | Description |
|------|-------|-------------|
| `server/domainClassifier.ts` | 147 | Maps an AtomicClaim to the correct source adapter(s) from 29 approved sources. Exports: `classifyClaim()`, `classifyClaims()`, `getPrimaryRoute()`, `getAllSourceIds()`. |
| `server/domainRules.ts` | 198 | 15 domain signal rules + fallback routes. Extracted from domainClassifier.ts to keep files under 200 lines. |
| `server/domainClassifier.test.ts` | 190 | 35 Vitest tests covering all 15 domain rules, fallback, result shape, batch classification, and utility functions. |

### Modified Files

| File | Change |
|------|--------|
| `server/questionRouter.ts` | Added `classifyClaim` import + `domainClassification` field in `processQuestion()` result. Added `questionToDeclarative` import. |
| `server/verifyClaimRoute.ts` | Added `classifyClaims` + `getPrimaryRoute` imports. Wired domain routing into NL path. Added `domainRouting` field in response. Bumped `apiVersion` to `1.3`. |

---

## Domain Rules Built (15 + fallback)

| Domain | Primary Source | Trigger Keywords |
|--------|---------------|-----------------|
| `structural_biology` | `rcsb_pdb` | protein structure, cryo-EM, active site, PDB ID |
| `protein_biochemistry` | `uniprot` | protein, enzyme, receptor, kinase, amino acid |
| `clinical_trial` | `clinicaltrials_gov` | randomized controlled, RCT, phase III, efficacy |
| `pharmacology` | `openfda` | drug, adverse event, FDA approved, contraindication |
| `genomics_genetics` | `clinvar` | mutation, variant, SNP, pathogenic, genome |
| `food_safety` | `efsa_openfoodtox` | ADI, food additive, EFSA, pesticide residue |
| `chemistry` | `pubchem` | molecule, compound, molecular weight, IUPAC |
| `preprint` | `biorxiv` | preprint, bioRxiv, medRxiv, not peer-reviewed |
| `financial_regulatory` | `edgar_sec` | SEC filing, 10-K, earnings, revenue |
| `legal` | `court_listener` | court ruling, lawsuit, EU directive, GDPR |
| `internet_standards` | `ietf_rfc` | RFC 7231, IETF, HTTP, TLS, OAuth |
| `cybersecurity_standards` | `nist` | NIST, CVE, CVSS, cybersecurity framework |
| `economics_macro` | `world_bank` | GDP, inflation, unemployment, OECD |
| `public_health` | `who` | mortality, pandemic, vaccination, WHO |
| `climate` | `ipcc` | climate change, CO2 emissions, IPCC, net zero |
| `unknown` (fallback) | `pubmed` | anything else → pubmed + semantic_scholar + openalex |

---

## API Response Change (apiVersion 1.3)

The `POST /api/public/verify-claim` response now includes a `domainRouting` field:

```json
{
  "domainRouting": [
    {
      "claim": "The BRCA1 mutation increases breast cancer risk.",
      "domain": "genomics_genetics",
      "primarySource": "clinvar",
      "confidence": 0.92
    }
  ],
  "apiVersion": "1.3"
}
```

This field is populated only in the natural-language path (when the claim is decomposed into atomic claims). It is empty (`[]`) for structured PDB/accession claims.

---

## Test Summary

- **New tests:** 35 (domainClassifier.test.ts)
- **Total tests:** 2,835 (up from 2,800)
- **Test files:** 245

---

## Quality Gate

```
typecheck: PASS (0 errors)
lint:      PASS (0 warnings)
test:      PASS (2,835/2,835)
```

---

## Sprint 27 Preview

- Build live source adapters for the top 5 non-PubMed sources: `clinvar`, `clinicaltrials_gov`, `openfda`, `rcsb_pdb`, `world_bank`
- Each adapter: `lookupEvidence(claim: AtomicClaim): Promise<EvidenceResult>`
- Wire adapters into `verifyClaimRoute.ts` so claims are actually dispatched to the correct source (not just classified)
- Target: 2,900+ tests
