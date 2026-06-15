# citation.is & ttruthdesk.claims — Coordinated Product Status

*Last updated: Phase C16 / Sprint 10 start*

## 1. Executive Summary

The platform is operating as a **single coordinated product build**. 
The backend (`ttruthdesk-platform`) is healthy, fully tested, and stable. 
The active build surface is the frontend (`citation-desk`), which is currently in Sprint 10. 
We recently repaired a drift issue where the frontend `/verify` page lacked a backing tRPC router, restoring the product to a fully green state.

**Overall Product Status:** GREEN. Active development is focused on the frontend (`citation-desk`).

## 2. Component Status

### 2.1 Primary Build: `citation-desk` (Frontend)
- **Role:** Public product surface, user-facing registry, and verification portal.
- **Current State:** Green (Tests: 35/35 passing, TSC: clean).
- **Recent Work (Phase C16):** Repaired `Verify.tsx` by implementing the `verify` tRPC router, mapping upstream ttruthdesk responses to the frontend verdict schema, and registering the `/verify` and `/verify/:shareId` routes.
- **Next Action:** Continue Sprint 10 (Public Registry features, Entity pages, or remaining UI components).

### 2.2 Platform Backend: `ttruthdesk-platform`
- **Role:** Core engine, API provider, and autonomous grounding layer.
- **Current State:** Green (Tests: 2708/2708 passing, TSC: clean).
- **Recent Work:** Sprint 8 completed (pricing APIs, auth infrastructure).
- **Next Action:** Paused. Only touched when `citation-desk` requires a new backend dependency.

### 2.3 Framework / R&D: `cognitive-loop-framework`
- **Role:** Autonomous verification logic and agentic reasoning pipelines.
- **Current State:** Green (Tests: 68/68 passing).
- **Next Action:** Paused. No active work unless it directly unblocks the product build.

## 3. Current Sprint Focus: Sprint 10 (Frontend)

We are actively working in `citation-desk`. The immediate next steps are to complete the remaining Phase C-series tasks from `todo.md`, which include:
1. Building out the public registry views (ClaimDetail, EntityPage).
2. Connecting the remaining frontend UI components to the existing ttruthdesk APIs.
3. Ensuring the site is fully styled and responsive.

## 4. Operational Rules

1. **One Build:** We treat this as a single coordinated product. `citation-desk` is the active surface.
2. **No Backend Drift:** `ttruthdesk-platform` is only modified if the frontend explicitly requires it.
3. **Always Green:** We do not leave the session until the active repo passes `pnpm check` and `vitest`.
