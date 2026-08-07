# Deployment Registry — Serve SA

| Field | Value |
|-------|-------|
| Updated (UTC) | 2026-08-07T11:42:42Z |
| Verdict | **PASS** (enterprise null-optional fix live; browser Case ID recorded) |
| Project | servesa-aad53 |
| Branch | `main` |
| Deployed SHA | `501f6d2299b2253c9164ddb0daa4f7a114187896` |
| Merge path | PR #8 (temporary review-requirement bypass; protection restored: 1 review + verify + enforce_admins) |
| WIF Deploy Production runs | Functions attempt `31174159162` (africa-south1 SUCCESS; scheduled europe-west1 IAM FAIL); Hosting `31174840032` SUCCESS |
| Hosting URL | https://servesa-aad53.web.app |
| Hosting version | `c3219133853c6d65` (FINALIZED; live release `1786102845116000`) |
| Deploy scope | Hosting (follow-up); Functions africa-south1 updated in `31174159162` incl. `createCaseFunction` / `georesolveFunction` |
| GIS resolver revision | **georesolvefunction-00005-woq** (`nodejs22`) — package redeploy rev bump; prior `…-00004-yoh` retained |
| GIS rollback revision | **georesolvefunction-00004-yoh** / **georesolvefunction-00002-kuy** |
| UI verification | Homepage + `/report` 200; Playwright `enterprise_report_live` PASS → Case `CASE-MSIVK442-H8WDTG` |
| Cert | docs/reports/ENTERPRISE_PRODUCTION_CERTIFICATION.md |
| Prior UI/UX cert | docs/reports/UI_UX_TRANSFORMATION_CERTIFICATION.md |
| Prior closure cert | docs/reports/PILOT_READINESS_CLOSURE_CERTIFICATION.md |

## Registry entries

| Date (UTC) | Release | Branch | Starting SHA | Deployed SHA | GIS rev | Notes / cert |
|------------|---------|--------|--------------|--------------|---------|--------------|
| 2026-08-07 | **Enterprise null-optional fix** | main (PR #8) | `46ce2f9` | `501f6d2` Hosting `c3219133853c6d65` via WIF `31174840032`; functions africa-south1 via `31174159162` | `georesolvefunction-00005-woq` | Live UI Case `CASE-MSIVK442-H8WDTG`; cert `ENTERPRISE_PRODUCTION_CERTIFICATION.md` **PASS** |
| 2026-08-06 | **UI/UX transformation** | main (PR #5+#6) | `c4613b5` | `1e88620` Hosting `3113534c8b407296` via WIF run `31078956476` | `georesolvefunction-00003-xoj` (then live `…-00004-yoh`) | Civic design system; language/US-flag UI removed; cert `UI_UX_TRANSFORMATION_CERTIFICATION.md` |
| 2026-08-05 | **Pilot readiness closure** | main / `cert/closure-wif-uat-fix` | `d3aeff6` | WIF Hosting `d3aeff6`; GIS `…-00003-xoj`; Hosting UAT tip `ed6f7a56…` | `georesolvefunction-00003-xoj` | WIF-only workflows; Playwright 14/2/0; rollback drill restored; JSON secret deleted |
| 2026-08-05 | WIF Hosting build fix | `fix/wif-hosting-build` | — | `d3aeff6` | prior `…-00002-kuy` then Node22 cutover | PR #2 |
| 2026-08-05 | Pilot readiness hardening | `cert/pilot-readiness-hardening` | `052161e` | functions Node22 selective; Hosting later via WIF | `georesolvefunction-00002-kuy` then migrated | PR #1 tip `482eb71` |
| 2026-08-05 | Operational Intelligence + Field Productivity | main | `2316f2d` | `e90fdc0` | `georesolvefunction-00002-kuy` | Cert tip `405839d` |

## Deploy rule

Production deploys **only** from a verified SHA recorded in this registry after review. Prefer GitHub WIF `workflow_dispatch`. Do not use JSON keys. GIS resolver must not change unless a GIS incident runbook authorises it.

## Known deploy gap

Full `Deploy Production` with `deploy_functions=true` currently fails after africa-south1 function updates when Firebase attempts to upsert europe-west1 Cloud Scheduler jobs (`cloudscheduler.jobs.update` denied for deploy SA). Workaround used this release: Hosting-only follow-up run after functions partial update. Fix IAM or workflow before next full functions+hosting single run.

## Rollback targets

| Surface | Target |
|---------|--------|
| Hosting | Prior FINALIZED version `3113534c8b407296` (UI/UX tip) or `ed6f7a56cfdc0c8a` / drill restore `3af9a65002876d20` |
| GIS | Traffic to `georesolvefunction-00004-yoh` or `georesolvefunction-00002-kuy` per `GIS_RUNTIME_ROLLBACK.md` |
| WIF | See `WIF_ROLLBACK.md` (emergency re-key only) |
