# Deployment Registry — Serve SA

| Field | Value |
|-------|-------|
| Updated (UTC) | 2026-08-05T17:25:00Z |
| Verdict | **PASS WITH CONDITIONS** (Pilot readiness closure) |
| Project | servesa-aad53 |
| Branch | `main` / `cert/closure-wif-uat-fix` |
| Starting SHA (prior main) | `052161e67519757a57bda5db58d36c1626d7a755` |
| WIF deployed SHA | `d3aeff65228955ec3d80d00effc828c80598277d` |
| Hosting version | `ed6f7a56cfdc0c8a` (https://servesa-aad53.web.app) |
| Functions region | africa-south1 (Gen2) |
| GIS dataset | mdb-wards-2020-v1 (4468 wards, ST_COVERS) |
| GIS resolver revision | **georesolvefunction-00004-yoh** (nodejs22) |
| GIS rollback revision | georesolvefunction-00002-kuy |
| Auth mode | WIF only (`github-actions-deploy@servesa-aad53.iam.gserviceaccount.com`) |
| JSON key | Retired (GitHub `SERVICE_ACCOUNT` deleted; Actions key deleted) |
| Cert | docs/reports/PILOT_READINESS_CLOSURE_CERTIFICATION.md |

## Registry entries

| Date (UTC) | Release | Branch | Deployed SHA | GIS rev | Notes |
|------------|---------|--------|--------------|---------|-------|
| 2026-08-05 | **Pilot readiness closure** | main / closure | `d3aeff6` (+ Hosting UAT fixes) | `georesolvefunction-00004-yoh` | WIF Hosting 31020673782; JSON key retired; Playwright 14/2; Hosting rollback drill; GIS Node 22 |
| 2026-08-05 | Pilot readiness hardening | cert/pilot-readiness-hardening | `4af4261` / merge `4bfe713` | `…-00002-kuy` then upgraded | Prior PWC tip |
| 2026-08-05 | Operational Intelligence | main | `e90fdc0` | `…-00002-kuy` | Prior |
| 2026-08-05 | Municipality Ops MVP | main | `8b70884` | unchanged | Prior |
| 2026-08-05 | Geospatial Routing | main | `062323d` | `…-00002-kuy` | Prior |

## Deploy rule

Production deploys **only** via WIF `workflow_dispatch` from a verified SHA. No JSON-key fallback.
