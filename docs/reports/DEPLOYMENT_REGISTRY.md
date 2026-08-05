# Deployment Registry — Serve SA

| Field | Value |
|-------|-------|
| Updated (UTC) | 2026-08-05T17:25:00Z |
| Verdict | **PASS WITH CONDITIONS** (Pilot readiness closure) |
| Project | servesa-aad53 |
| Branch | `main` (closure via PR #3 `cert/closure-wif-uat-fix`) |
| Starting SHA (closure sprint) | `d3aeff65228955ec3d80d00effc828c80598277d` |
| Cert branch tip (pre-merge) | `482eb71` (`cert/pilot-readiness-hardening`) |
| Main after PR #1+#2 | `d3aeff6` |
| Main after PR #3 | `49cbe4b` |
| First WIF Hosting deploy SHA | `d3aeff6` (Actions run `31020673782`) |
| Hosting tip (post UAT AuthProvider) | version `ed6f7a56cfdc0c8a` (CLI; routes 200) |
| Functions region | africa-south1 (Gen2) |
| GIS dataset | mdb-wards-2020-v1 (4468 wards, ST_COVERS) |
| GIS resolver revision | **georesolvefunction-00003-xoj** (`nodejs22`) |
| GIS rollback revision | **georesolvefunction-00002-kuy** (retained) |
| Cert | docs/reports/PILOT_READINESS_CLOSURE_CERTIFICATION.md |

## Registry entries

| Date (UTC) | Release | Branch | Starting SHA | Deployed SHA | GIS rev | Notes / cert |
|------------|---------|--------|--------------|--------------|---------|--------------|
| 2026-08-05 | **Pilot readiness closure** | main / `cert/closure-wif-uat-fix` | `d3aeff6` | WIF Hosting `d3aeff6`; GIS `…-00003-xoj`; Hosting UAT tip `ed6f7a56…` | `georesolvefunction-00003-xoj` | WIF-only workflows; Playwright 14/2/0; rollback drill restored; JSON secret deleted |
| 2026-08-05 | WIF Hosting build fix | `fix/wif-hosting-build` | — | `d3aeff6` | prior `…-00002-kuy` then Node22 cutover | PR #2 |
| 2026-08-05 | Pilot readiness hardening | `cert/pilot-readiness-hardening` | `052161e` | functions Node22 selective; Hosting later via WIF | `georesolvefunction-00002-kuy` then migrated | PR #1 tip `482eb71` |
| 2026-08-05 | Operational Intelligence + Field Productivity | main | `2316f2d` | `e90fdc0` | `georesolvefunction-00002-kuy` | Cert tip `405839d` |

## Deploy rule

Production deploys **only** from a verified SHA recorded in this registry after review. Prefer GitHub WIF `workflow_dispatch`. Do not use JSON keys. GIS resolver must not change unless a GIS incident runbook authorises it.

## Rollback targets

| Surface | Target |
|---------|--------|
| Hosting | Prior FINALIZED version (drill restored `3af9a65002876d20` after temporary rollback) |
| GIS | Traffic to `georesolvefunction-00002-kuy` per `GIS_RUNTIME_ROLLBACK.md` |
| WIF | See `WIF_ROLLBACK.md` (emergency re-key only) |
