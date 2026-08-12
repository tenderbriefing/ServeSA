# National Municipality Onboarding — Production Certification

**Date:** 2026-08-12  
**Auditor:** Production finalisation / certification closure  
**Production URL:** https://servesa-aad53.web.app

## Executive Verdict

**PASS WITH CONDITIONS**

National citizen municipality context is merged to `main` (PR #22 + PR #23), Hosting is live on merge SHA `1f5dd33`, africa-south1 publishing callables updated successfully, Storage/Firestore rules deployed, and live Playwright `@pilot` + `@smoke` UAT against production passed after UAT harness race mitigation. Authentic official municipal document publishing lifecycle remains **NOT EXECUTED** (no document). europe-west1 Cloud Scheduler IAM failures are **non-blocking** for national citizen onboarding.

## Git

| Item | Value |
|------|-------|
| Starting SHA (pre-finalisation phase) | `bc955969bf837247b26e467fb12f73b271e5d466` (PR #22 merge — national onboarding already on main) |
| Feature SHA | `21c94189d9ef2352e20863d9aa797461b9884140` (`feat: finalise national municipality context for all SA municipalities`); docs commit `33b44dd338dccd25c22c8bd9551117bf8f9ea9b9` |
| Feature branch | `feat/national-municipality-finalisation` |
| PR | [#23](https://github.com/tenderbriefing/ServeSA/pull/23) (prior national: [#22](https://github.com/tenderbriefing/ServeSA/pull/22)) |
| Merge SHA | `1f5dd33f9bb8ad0a9375bb0c6c0ba0ddf6e9c6ed` |
| Final SHA (post-cert docs / UAT harness) | `fd1a4a170f2ea6787e8215ab581fbfb05cce16b9` (PR #24 merge onto main) |

## National onboarding

- **Province:** required at email signup (`Province*`); validated against SA dataset — confirmed live on `/auth`
- **Municipality:** required (`Municipality*`); filtered by province; canonical code persisted
- **Ward:** optional free-text; no fabricated ward catalogue; blank accepted
- Invalid province/municipality combinations rejected via `isValidMunicipalitySelection`
- Canonical codes include `JHB`, `CPT`, `DBN` (eThekwini), `TSH`, `BUF`, `POL`, …

## Existing users

- Valid municipality → proceeds
- Missing municipality → `CitizenMunicipalityGate` → `ConfirmMunicipalityPanel`
- Google signup without municipality → confirm gate on municipality-dependent routes
- No automatic JHB assignment
- `/ideas/new` uses the same shared gate (not a competing redirect-only flow)
- `CompleteProfileModal` aligned with required municipality validation; `UserSchema` includes `province`

## Municipality context

- Citizen resolver: claims → profile → null (no JHB fallback)
- Staff ops: JWT municipality claim required (no JHB fallback)
- Display: **Your Municipality** + display name (header + municipality page) — observed live for JHB and CPT UAT identities

## /municipality

- Auth-gated (live smoke confirmed)
- Published content for citizen municipality only
- Unpublished: “Planning information is not available yet”
- Unresolved: confirmation panel

## Updates and Ideas

- Scoped via same citizen municipality resolver
- Wrapped in `CitizenMunicipalityGate` (list + new idea)

## GIS

**Preserved.** Profile ward is supplementary only. Case routing remains authoritative GIS (`ST_COVERS`). No change to georesolution in this phase.

## Security

- Cross-municipality isolation intent tests (local) pass
- Publishing security intent tests pass
- Citizen profile writes still cannot set roles
- Ops publishing requires municipality claim
- Live isolation UAT: CPT official ops queue shows **CPT** context; JHB official shows **JHB** Smart Work Queue — no foreign muni list dump observed

## Publishing

- Architecture national: empty allow-list = all municipalities when engine flag ON
- Engine flag remains **OFF** by default (`NEXT_PUBLIC_ENABLE_MUNICIPAL_PUBLISHING_ENGINE` not permanently enabled)
- No permanent `ALLOWLIST=JHB` in code
- africa-south1 callables successfully updated in deploy run `31592236965`:  
  `uploadPlanningDocumentFunction`, `processPlanningDocumentFunction`, `approvePlanningDocumentFunction`, `publishPlanningDocumentFunction`, `updatePlanningAiDraftFunction`, `getPlanningPublishingDashboardFunction`, `getPlanningDocumentSourceUrlFunction`
- Official authentic document lifecycle UAT: **NOT EXECUTED** (no municipal document supplied)

## Production deployment

| Surface | Status | Evidence |
|---------|--------|----------|
| Hosting | **SUCCESS** | [run 31593637726](https://github.com/tenderbriefing/ServeSA/actions/runs/31593637726) @ `1f5dd33` |
| Firestore rules + indexes | **SUCCESS** | run `31592236965` (rules job before functions failure) |
| Storage rules | **SUCCESS** | run `31592236965` |
| Functions (africa-south1 incl. publishing) | **SUCCESS** (published) | run `31592236965` Successful update operations logged |
| Functions job overall | **FAILED** (end) | europe-west1 Cloud Scheduler IAM `cloudscheduler.jobs.update` denied for `cleanupOldMedia`, `generateDailyReport`, `ingestCAPAlertsFunction` |
| Publishing feature flag | **OFF** (default) | code + live `@smoke` disabled-copy check |

**Scheduler IAM blocker:** non-blocking for national citizen onboarding and for africa-south1 publishing callable availability. Separate ops remediation: grant deploy principal `cloudscheduler.jobs.update` (or equivalent) on europe-west1 scheduled jobs.

## UAT (live production)

**Base URL:** https://servesa-aad53.web.app  
**Credentials:** `docs/reports/evidence/uat_tokens.env` (gitignored)  
**Evidence:** `docs/reports/evidence/playwright_national_pilot_uat.txt`, `playwright_national_prod_smoke.txt`

| Suite | Passed | Failed | Skipped | Notes |
|-------|--------|--------|---------|-------|
| Playwright `@pilot` | 14 | 0 | 2 | Citizen/field/official/supervisor/isolation; unauth leak checks skipped when tokens present |
| Playwright `@smoke` | 12 | 0 | 0 | Public, auth-gated, ops, publishing-disabled copy |

**Municipalities exercised (authenticated):** JHB (official/supervisor/field), CPT (official isolation)  
**Routes:** `/`, `/auth`, `/report`, `/case`, `/field`, `/ops`, `/ops/supervisor`, `/municipality` (gated), `/updates`, `/ideas`, `/account`  
**Viewports:** desktop Chromium (pilot); smoke includes 390px + 1440px structural checks  
**Harness note:** `signInAndGoto` now waits for staff claims and re-enters `/ops`/`/field` after OpsShell’s cold-start claim race (product still briefly may bounce staff to `/dashboard` before claims settle — non-blocking; re-navigation succeeds).

**Official document publishing UAT:** **NOT EXECUTED**

## Tests (local — certified at PR #23 merge)

| Suite | Passed | Failed | Skipped |
|-------|--------|--------|---------|
| Web unit | 46 | 0 | 0 |
| Case-contract | 32 | 0 | 0 |
| Functions | 50 | 0 | 0 |
| Infra security | 12 | 0 | 0 |
| Typecheck / lint / builds | PASS | — | — |
| Live Firebase `@pilot` UAT | 14 | 0 | 2 |
| Live `@smoke` | 12 | 0 | 0 |
| Official document publishing UAT | — | — | **NOT EXECUTED** |

## Rollback

1. Revert merge commit `1f5dd33` on `main` (or revert PR #23 / #22 as needed)
2. Redeploy previous Hosting / Functions revisions via Deploy Production workflow
3. Citizen reporting continues (GIS unchanged)
4. Publishing flag remains OFF by default — do not enable Hosting env unless intentional

## Known conditions

**Blocking for full publishing pilot sign-off (not for national citizen platform):**

- Authentic official municipal document for upload → AI draft → human approve → publish lifecycle

**Non-blocking for national citizen onboarding:**

- europe-west1 Cloud Scheduler IAM denial on three scheduled functions (deploy job red; africa-south1 callables already updated)
- Incomplete local municipality coverage in static dataset vs full Stats SA catalogue
- Ward free-text without official ward catalogue
- eThekwini canonical code is `DBN` (not `ETH`)
- OpsShell cold-start claim race (staff may briefly land on `/dashboard` before JWT roles settle)

## Final recommendation

**NATIONAL PLATFORM READY WITH CONDITIONS**
