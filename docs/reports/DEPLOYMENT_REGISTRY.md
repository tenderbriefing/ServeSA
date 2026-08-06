# Deployment Registry — Serve SA

| Field | Value |
|-------|-------|
| Updated (UTC) | 2026-08-06T06:57:28Z |
| Verdict | **PASS** (UI/UX transformation live on Hosting) |
| Project | servesa-aad53 |
| Branch | `main` |
| Deployed SHA | `1e88620db1e1fa6d9607464117eb712481c669f8` |
| Merge path | PR #5 then PR #6 (temporary review-requirement bypass; protection restored) |
| WIF Deploy Production run | `31078956476` |
| Hosting URL | https://servesa-aad53.web.app |
| Hosting version | `3113534c8b407296` (FINALIZED; live release `1785999446957000`) |
| Deploy scope | Hosting + Firestore/Storage rules (functions skipped; no function code diffs) |
| GIS resolver revision | **georesolvefunction-00003-xoj** (`nodejs22`) — unchanged |
| GIS rollback revision | **georesolvefunction-00002-kuy** (retained) |
| UI verification | Routes `/` `/report` `/auth` `/ops` `/case` `/dashboard` `/help` `/notifications` → 200; language selector / US flag absent |
| Cert | docs/reports/UI_UX_TRANSFORMATION_CERTIFICATION.md |
| Prior closure cert | docs/reports/PILOT_READINESS_CLOSURE_CERTIFICATION.md |

## Registry entries

| Date (UTC) | Release | Branch | Starting SHA | Deployed SHA | GIS rev | Notes / cert |
|------------|---------|--------|--------------|--------------|---------|--------------|
| 2026-08-06 | **UI/UX transformation** | main (PR #5+#6) | `c4613b5` | `1e88620` Hosting `3113534c8b407296` via WIF run `31078956476` | `georesolvefunction-00003-xoj` (unchanged) | Civic design system; language/US-flag UI removed; cert `UI_UX_TRANSFORMATION_CERTIFICATION.md` |
| 2026-08-05 | **Pilot readiness closure** | main / `cert/closure-wif-uat-fix` | `d3aeff6` | WIF Hosting `d3aeff6`; GIS `…-00003-xoj`; Hosting UAT tip `ed6f7a56…` | `georesolvefunction-00003-xoj` | WIF-only workflows; Playwright 14/2/0; rollback drill restored; JSON secret deleted |
| 2026-08-05 | WIF Hosting build fix | `fix/wif-hosting-build` | — | `d3aeff6` | prior `…-00002-kuy` then Node22 cutover | PR #2 |
| 2026-08-05 | Pilot readiness hardening | `cert/pilot-readiness-hardening` | `052161e` | functions Node22 selective; Hosting later via WIF | `georesolvefunction-00002-kuy` then migrated | PR #1 tip `482eb71` |
| 2026-08-05 | Operational Intelligence + Field Productivity | main | `2316f2d` | `e90fdc0` | `georesolvefunction-00002-kuy` | Cert tip `405839d` |

## Deploy rule

Production deploys **only** from a verified SHA recorded in this registry after review. Prefer GitHub WIF `workflow_dispatch`. Do not use JSON keys. GIS resolver must not change unless a GIS incident runbook authorises it.

## Rollback targets

| Surface | Target |
|---------|--------|
| Hosting | Prior FINALIZED version `ed6f7a56cfdc0c8a` (pre-UI/UX tip) or drill restore `3af9a65002876d20` |
| GIS | Traffic to `georesolvefunction-00002-kuy` per `GIS_RUNTIME_ROLLBACK.md` |
| WIF | See `WIF_ROLLBACK.md` (emergency re-key only) |
