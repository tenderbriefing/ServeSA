# Case Creation End-to-End Certification

**Date:** 2026-08-03  
**Workstream:** Citizen `/report` ↔ `createCase` contract alignment  
**Author:** Principal Software Architect / Release Engineer (automated)

---

## 1. Executive verdict

**PASS WITH CONDITIONS**

The citizen case-creation journey now shares one canonical Zod contract, rejects `0,0`, maps all visible UI categories to supported backend enums, creates cases idempotently with server-side SLA and georesolution metadata, uploads media only after a durable `caseId`, treats duplicate assessment as advisory, and owns notifications in a retry-safe `onCreate` ledger.

Conditions:
- No live production smoke test was executed against Firebase/BigQuery in this session.
- Firestore/Storage emulator rule suites are represented by mirrored intent tests (not full `@firebase/rules-unit-testing` emulator run).
- Pre-existing functions TypeScript errors outside the case-creation path remain (`agent.ts`, `getCaseAnalytics.ts`, etc.); case-creation modules type-clean under filter.
- Public Firebase web API keys appear in client bundles (expected for Firebase web apps); no private keys/service-account material found.

---

## 2. Starting SHA

`14d94569394eadbd18f4a7533d722e203ded517c`

(Repository had no `.git` history; baseline commit created for release discipline.)

## 3. Final SHA

`20089c0a6c85627377fd3afd831460508f116a6a`

Implementation commit: `535c54cab48baa57e9270ec7579920a32b3d9402`

## 4. Branch

`main`

---

## 5. Files created

- `packages/case-contract/**` — shared Zod schema, category map, geo, phone, SLA
- `apps/functions/src/notifications/caseCreatedOrchestrator.ts`
- `apps/functions/src/telemetry/caseEvents.ts`
- `apps/functions/src/__tests__/createCase.contract.test.ts`
- `apps/functions/src/__tests__/slaCalculator.test.ts`
- `apps/functions/jest.config.js`
- `apps/web/src/components/Report/LocationStep.tsx`
- `apps/web/src/lib/report/draft.ts`
- `apps/web/src/lib/telemetry/report.ts`
- `apps/web/src/app/case/[id]/page.tsx`
- `apps/web/tailwind.config.js`
- `apps/web/postcss.config.js`
- `infra/tests/security.rules.test.ts`
- `tools/migrations/normalize_case_categories.ts` (dry-run by default)
- `docs/reports/CASE_CREATION_END_TO_END_CERTIFICATION.md` (this file)

## 6. Files modified

- `apps/web/src/app/report/page.tsx` — full 4-step production wizard
- `apps/web/src/lib/api/cases.ts` — canonical payload + `uploadMediaFunction`
- `apps/web/src/lib/api/georesolve.ts` — `georesolveFunction`
- `apps/functions/src/cases/createCase.ts` — hardened create path
- `apps/functions/src/cases/media.ts` — scoped private uploads + ownership
- `apps/functions/src/cases/dedupe.ts` — advisory assessment only (no auto-merge)
- `apps/functions/src/routing/georesolve.ts` — safe unresolved + timeouts
- `apps/functions/src/utils/slaCalculator.ts` — shared SLA policy
- `apps/functions/src/index.ts` — auth context, callables, notification ownership
- `infra/firestore.rules` / `infra/storage.rules`
- `package.json` workspaces include `packages/*`
- Build unblockers: dashboard `where`/`reporterUid`, auth profile helpers, Next `src/app` resolution, Tailwind tokens

---

## 7. Frontend-to-backend contract

Canonical package: `@servesa/case-contract`

```ts
CreateCaseInput = {
  title, description,
  category: water|electricity|roads|waste|internet|emergency, // UI IDs accepted then normalised
  subcategory?, priority: emergency|high|medium|low,
  latitude, longitude, locationSource: device_gps|map_pin|address_search,
  address?, reporter: { name, email?, phone? },
  consent: { dataProcessing: true, communications? },
  clientRequestId: uuid
}
```

Response:

```ts
CreateCaseResponse = {
  caseId, reference, shareUrl, status: "submitted",
  municipality?, ward?, slaTarget, targetHours,
  georesolutionStatus, mediaUploadPath?, routingPending?,
  duplicateAssessment?
}
```

---

## 8. Category mapping implemented

Single module `packages/case-contract/src/categories.ts`:

| UI ID | Canonical | Subcategory |
|-------|-----------|-------------|
| water-sewage | water | sewage |
| electricity | electricity | — |
| roads-infrastructure | roads | infrastructure |
| waste-management | waste | management |
| digital-services | internet | digital-services |
| emergency-services | emergency | services |

Unknown IDs fail with a user-friendly Zod message; backend logs `case_creation_failed`.

---

## 9. Location acquisition behaviour

- GPS only after explicit “Use my current location”
- Handles denied / timeout / unavailable / insecure context / unsupported
- Map pin confirmation with SA bounds validation
- Address search does **not** invent coordinates
- Valid pin persisted across wizard steps via draft state
- Lat/lng shown only with `?debug`
- **Never submits 0,0** — client + server reject

Also fixed Permissions-Policy to `geolocation=(self)`.

---

## 10. Georesolution behaviour

1. Parameterised BigQuery `ST_CONTAINS` (`ST_GEOGPOINT(lng, lat)`)
2. Firestore cache (~1m grid, 24h TTL)
3. Nearest ward within 10 km fallback
4. `georesolveSafe` → `unresolved` + `routingPending` (no invented municipality)
5. Timeout boundary (`GEORESOLVE_TIMEOUT_MS`, default 8s)
6. Records `status`, `method`, `confidence`

---

## 11. SLA calculation evidence

Defaults (hours) from shared `DEFAULT_SLA_HOURS`; municipality `slaConfig` overrides.

Stored on case (UTC Timestamps): `targetHours`, `slaStartedAt`, `slaTarget`, `slaBreach: false`, `slaPolicyVersion`.

Unit tests cover all category×priority defaults + override.

---

## 12. Idempotency design

- Client: stable `clientRequestId` (UUID) + submit lock + disabled button
- Server: `case_idempotency/{clientRequestId_identity}` checked inside transaction
- Retries return prior `CreateCaseResponse`

---

## 13. Media upload flow

1. Create case → receive `caseId` + `mediaUploadPath`
2. `uploadMediaFunction` callable with ownership check
3. Storage path `cases/{caseId}/media/...` (private; signed URLs)
4. MIME/extension/size limits; reject executables
5. Case success UI distinguishes submitted / uploading / failed+retry
6. Storage `onFinalize` only finalises metadata idempotently

---

## 14. Duplicate assessment flow

Runs after durable create (client + `onCreate`). Records candidates/confidence/signals. **Never auto-merges or closes.**

---

## 15. Notification ownership and retry behaviour

| Concern | Owner |
|---------|-------|
| Durable write | `createCase` |
| Citizen ack + official alert + dedupe kickoff | `onCaseCreated` |

Idempotency via `notification_ledger/{caseId}_{type}`. Failures do not roll back the case. Duplicate ack from createCase removed.

---

## 16. Security controls

- Client case creates denied (Admin SDK / Functions only)
- Citizens read own cases (`reporterUid`); officials scoped by `muniCode`
- Reporter contact not written to `case_events`
- Storage: owner-only create; officials by municipality; `canAccessMunicipality` defined
- Share page does not render contact fields
- Rate limit on create (`caseCreationLimiter`)
- Consent policy version + timestamp stored

---

## 17. Test results

| Suite | Result |
|-------|--------|
| `@servesa/case-contract` unit | **15/15 PASS** |
| `@servesa/functions` unit | **5/5 PASS** |
| Security intent tests | **4/4 PASS** |
| Playwright e2e | Updated for wizard; requires local app + optional function stubs (not run live here) |
| Functions full `tsc` | FAIL (pre-existing outside case path) |
| Case-path type filter | **PASS** (no errors in create/geo/media/dedupe/index/orchestrator/sla) |

---

## 18. Build result

`apps/web` `next build`: **PASS** (includes `/report` route, First Load JS reported).

---

## 19. Remaining risks

1. Live BigQuery GIS availability / dataset permissions in target project
2. Email provider still logs rather than sending via production ESP
3. Full rules emulator coverage not yet wired in CI
4. Historical documents may still carry kebab category IDs (migration dry-run provided)
5. Map UX uses coordinate pin controls rather than full Google Maps widget when API unavailable
6. Functions workspace still has legacy unused-locals / typing debt outside this workstream

---

## 20. Production verification status

**Not performed.** No production deploy and no production smoke against `servesa-aad53`.

Repository release scripts (`deploy:prod`) remain manual; automatic production deployment was not authorised.

---

## 21. Rollback instructions

```bash
git revert <final_sha>
# or
git reset --hard 14d94569394eadbd18f4a7533d722e203ded517c
```

Then redeploy previous functions/hosting artifacts. Idempotency + ledger collections are additive; safe to leave.

Dry-run migration only — no destructive data migration was applied.

---

## 22. Recommended next workstream

**SLA breach engine hardening** (scheduled checker, severity escalation, official breach notifications, metric dashboards) — do not expand until case-creation has a production smoke checklist signed off.

---

## Completion evidence checklist

| Requirement | Evidence |
|-------------|----------|
| `/report` never submits 0,0 | Schema + LocationStep + tests |
| UI categories map to canonical | `categories.ts` + contract tests |
| Double-submit safe | clientRequestId + idempotency collection |
| Case + event durable | Firestore transaction |
| SLA server-side | `calculateSlaFields` |
| Defensible municipality routing | polygon → nearest → unresolved |
| Media tied to case | post-create upload + ownership |
| Ack not duplicated | notification ledger |
| Security tested | intent tests + tightened rules |
| Production build passes | `next build` OK |
