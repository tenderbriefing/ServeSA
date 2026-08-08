# ADR: Municipal Planning (Visual IDP Summary)

- Status: Accepted
- Date: 2026-08-08
- Branch: `feat/municipal-planning-idp` (from `feat/community-engagement-upgrade`)

## Context

Citizens should understand municipal plans without knowing IDP jargon: what is planned, what it costs, where, when, progress, and how to participate. ServeSA already has Municipal Updates, Community Ideas, and authoritative GIS. This ADR adds a verified planning transparency layer without weakening Report → GIS → Ops → Field.

## Decisions

1. **Citizen route:** `/municipality` (“Our Municipality”). Auto-scope by claims/profile `municipalityCode` (same soft resolution as Updates/Ideas). Never invent missing values; use “Not published yet” / “Data awaiting verification”.
2. **Collections (Admin SDK writes only):** `municipal_plans`, `municipal_plan_documents`, `municipal_priorities`, `municipal_projects`, `municipal_budget_lines`, `municipal_plan_reviews`. Distinct from Updates’ embedded `project` tracking.
3. **Publication:** `draft → awaiting_review → verified → published → archived`. Citizens read **published** only. No raw AI auto-publish.
4. **SoT:** Budgets, dates, %, status, ward, expenditure come from verified official documents. AI may assist summarisation/classification only and must be labelled as ServeSA summary — never presented as original municipal wording.
5. **Ward section:** Uses optional `wardId` from profile/claims when present; only shows ward-specific projects when `wardMappingAvailable` and `wardIds` are set on published documents. Does not promise ward data otherwise.
6. **GIS:** Unchanged. Planning does not invent municipalities or call nearest-centroid assignment. Case routing remains `georesolveSafe`.
7. **Participation:** CTAs deep-link to existing Community Ideas (`/ideas/new`). No competing ideas system.
8. **Updates:** Project detail relates published Municipal Updates by `relatedUpdateIds` / type filters — does not duplicate Updates.
9. **Feature flag:** `municipal_planning` ON by default (`NEXT_PUBLIC_ENABLE_MUNICIPAL_PLANNING=false` to hide). Optional allow-list (`*` = all).
10. **Ops:** `/ops/planning` for review/correct/approve/verify/unpublish. Claims municipality isolation (C3).
11. **Pilot:** City of Johannesburg (`JHB`). No fake demo numbers in production paths; fixtures for tests/dev only.
12. **Future layers:** PROMISED / BUDGETED / SPENT / DELIVERED / CITIZEN_EXPERIENCE as metadata enums only — no speculative accountability scoring.

## Consequences

- New Firestore indexes and rules for planning collections.
- OpsShell gains **Planning**; citizen Header/Footer gain **Our Municipality** when flag+allow-list match.
- Contract package `@servesa/case-contract` exports `municipalPlanning` schemas.
- Community engagement ADR civic-intent count remains Report / Updates / Ideas (+ Track); Municipality is an additional transparency surface, not a fifth “engagement” social intent.
