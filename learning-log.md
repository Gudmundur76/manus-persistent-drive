
---

## 2026-06-09 — Ralph Wiggum Loop: Test Coverage Sprint

### Final Suite State
- **131 test files, 1,849 tests, 0 failures**
- Pushed to: https://github.com/Gudmundur76/ttruthdesk-platform (commit 081bd94)

### Fixes Applied
1. **coordApi.test.ts** — 3 tests fixed to match actual route response shapes
2. **server/routers.test.ts** — 104 new tRPC procedure tests created from scratch
3. **server/db.coverage.test.ts** — Extended from 23 → 76 tests; all 51 remaining exports covered

### Null-Guard Behavior Catalog (db.ts)
| Behavior | Functions |
|---|---|
| Throws `Error("DB unavailable")` | createDocument, insertClaims, upsertAuditReport, createAuditRequest, upsertAutoIngestedPaper, upsertGraphEntity, upsertGraphRelation, savePredictionModel |
| Returns `null` | getMonitoringJobByTaskUid, getAutoIngestedPaperByPmid, getGraphEntityByTypeAndName, getClaimById, getClaimWithDocument, getLatestAuthorReliabilityPrediction, getPredictionById, insertWebhookAlert |
| Returns `undefined` | upsertEmailUser, findValidMagicLinkToken |
| Returns `0` | getRecentAuditRequestsByEmail, countRecentMagicLinkRequests |
| Returns `[]` | getAllActiveMonitoringJobs, getAllAutoIngestedPapers, getPublicAutoIngestedPapers, getCompletedPublicPapers, getRecentVerifiedClaims, getRelationsBySourceEntity, getRelationsByTargetEntity, getEntitiesWithMultipleClaims, getPredictionsByClaimId, getPredictionsForReview, getAllCompletedDocuments, getVerifiedClaimsForSitemap, getWebhookAlertsByUser, getActiveWebhookAlerts |
| Returns structured default | getEntityClaimSummary, getCalibrationStats, getGlobalPlatformStats, getPaginatedPublicClaims |

### Next Session Priorities
1. Integration tests with real DB (MySQL test container)
2. E2E pipeline tests: document submit → claim extraction → verdict
3. Frontend React component tests
4. Coordinator queue load/stress tests
