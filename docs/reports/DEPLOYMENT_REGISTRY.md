# Deployment Registry — Serve SA

| Field | Value |
|-------|-------|
| Updated (UTC) | 2026-08-09T04:41:24Z |
| Verdict | **PASS WITH CONDITIONS** (civic engagement + Our Municipality live; verified IDP content still pending) |
| Project | servesa-aad53 |
| Branch | `main` |
| Deployed SHA | `1de69f76b7d083f94011e2c527747782ec191d03` |
| Merge path | PR #16 (temporary review-requirement bypass; protection restored: 1 review + verify + enforce_admins) |
| WIF Deploy Production runs | [`31294948245`](https://github.com/tenderbriefing/ServeSA/actions/runs/31294948245) **SUCCESS** (`auth_mode=wif`; hosting + functions + rules + indexes) |
| Hosting URL | https://servesa-aad53.web.app |
| Deploy scope | Hosting + Functions + Firestore rules/indexes + Storage rules |
| GIS resolver revision | Unchanged by intent (no GIS logic change in PR #16) |
| UI verification | `/` `/municipality` `/updates` `/ideas` `/ops/planning` HTTP **200**; `/municipality` contains “Our Municipality” / “What your municipality plans” |
| Cert | docs/reports/MUNICIPAL_PLANNING_CERTIFICATION.md · docs/reports/COMMUNITY_ENGAGEMENT_UPGRADE_CERTIFICATION.md |

## Registry entries

| Date (UTC) | Release | Branch | Starting SHA | Deployed SHA | GIS rev | Notes / cert |
|------------|---------|--------|--------------|--------------|---------|--------------|
| 2026-08-09 | **Civic engagement + Our Municipality (non-staged)** | main (PR #16) | `ab6092d` | `1de69f76b7d083f94011e2c527747782ec191d03` via WIF `31294948245` | unchanged (no GIS change) | Updates/Ideas/Insights + Visual IDP ON by default; empty states until verified publish; certs updated |
| 2026-08-07 | **Enterprise null-optional fix** | main (PR #8) | `46ce2f9` | `501f6d2` Hosting `c3219133853c6d65` via WIF `31174840032`; functions africa-south1 via `31174159162` | `georesolvefunction-00005-woq` | Live UI Case `CASE-MSIVK442-H8WDTG`; cert `ENTERPRISE_PRODUCTION_CERTIFICATION.md` **PASS** |
| 2026-08-06 | **UI/UX transformation** | main (PR #5+#6) | `c4613b5` | `1e88620` Hosting `3113534c8b407296` via WIF run `31078956476` | `georesolvefunction-00003-xoj` (then live `…-00004-yoh`) | Civic design system; language/US-flag UI removed; cert `UI_UX_TRANSFORMATION_CERTIFICATION.md` |
| 2026-08-05 | **Pilot readiness closure** | main / `cert/closure-wif-uat-fix` | `d3aeff6` | WIF Hosting `d3aeff6`; GIS `…-00003-xoj`; Hosting UAT tip `ed6f7a56…` | `georesolvefunction-00003-xoj` | WIF-only workflows; Playwright 14/2/0; rollback drill restored; JSON secret deleted |
| 2026-08-05 | WIF Hosting build fix | `fix/wif-hosting-build` | — | `d3aeff6` | prior `…-00002-kuy` then Node22 cutover | PR #2 |
| 2026-08-05 | Pilot readiness hardening | `cert/pilot-readiness-hardening` | `052161e` | functions Node22 selective; Hosting later via WIF | `georesolvefunction-00002-kuy` then migrated | PR #1 tip `482eb71` |
| 2026-08-05 | Operational Intelligence + Field Productivity | main | `2316f2d` | `e90fdc0` | `georesolvefunction-00002-kuy` | Cert tip `405839d` |

## Deploy rule

Production deploys **only** from a verified SHA recorded in this registry after review. Prefer GitHub WIF `workflow_dispatch`. Do not use JSON keys. GIS resolver must not change unless a GIS incident runbook authorises it.

## Known deploy gap

Historically, full `Deploy Production` with `deploy_functions=true` could fail after africa-south1 updates when Firebase upserts europe-west1 Cloud Scheduler jobs (`cloudscheduler.jobs.update` denied). Run `31294948245` completed successfully with functions + hosting + rules/indexes; continue monitoring scheduler IAM on future full deploys.

## Rollback targets

| Surface | Target |
|---------|--------|
| Hosting | Prior FINALIZED versions from earlier registry rows, or redeploy prior SHA via WIF |
| Feature hide | `NEXT_PUBLIC_ENABLE_MUNICIPAL_PLANNING=false` and/or `NEXT_PUBLIC_ENABLE_COMMUNITY=false` + Hosting redeploy |
| GIS | Traffic to prior GIS revision per `GIS_RUNTIME_ROLLBACK.md` (unchanged this release) |
| WIF | See `WIF_ROLLBACK.md` (emergency re-key only) |
