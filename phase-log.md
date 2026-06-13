
## 2026-06-13 — Architecture Audit + Ingestion Expansion

**Session type:** Deep audit + strategic discussion + active development

**ttruthdesk-platform:**
- Added 24 new source adapters (CrossRef, OpenAlex, Semantic Scholar, WHO, Cochrane, bioRxiv/medRxiv, Europe PMC, ClinVar, ChEMBL, PubChem, OpenFDA Drug Labels, SEC EDGAR, EUR-Lex, CourtListener, IETF RFC, World Bank, Our World in Data, OECD, Eurostat, IPCC, arXiv, Wikidata, NIST, Generic URL/DOI)
- Source registry expanded from 9 to 30 approved sources
- Engine is now domain-agnostic (any scholarly domain, law, finance, government, standards)
- 1,140/1,140 tests passing, 0 TS errors
- Commits: afd6f4e (4 adapters), 0a113c0 (20 adapters)

**citation-desk:**
- Contact form live at /contact — delivers to pippinlitli@gmail.com via notifyOwner()
- Brand rewrite layer: all ttruthdesk.claims references rewritten to citation.is in-flight
- MCP card: 4 canonical tools, citation.is brand, in-memory cache
- MCP SSE stream: properly piped, no timeout
- Warmup cron: pings 3 upstream endpoints every 5 minutes
- All internal infrastructure exposure removed from public pages
- Checkpoints: 4a683553, 0361b355, 6178ea60, 809442f2

**Strategic decisions:**
- ttruthdesk-platform is the company; citation.is is one surface
- Engine is ready; source ingestion is the critical path
- Dream state confirmed as substantially built (5 components in server/dream/)
- Phase 109 (source version tracking + supersession signal) is next critical build
- Phase 110 (question-to-claim interface) is the "Perplexity at primary-source standards" thesis
- All 20 GitHub repos set to private
