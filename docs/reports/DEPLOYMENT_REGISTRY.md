# Deployment Registry — Serve SA

| Field | Value |
|-------|-------|
| Updated (UTC) | 2026-08-05T17:20:00Z |
| Verdict | **PASS** (Pilot Readiness Closure) |
| Project | servesa-aad53 |
| Branch | `main` |
| Hosting | https://servesa-aad53.web.app |
| Functions region | africa-south1 (Gen2) |
| GIS dataset | mdb-wards-2020-v1 (4468 wards, ST_COVERS) |
| GIS resolver revision | **georesolvefunction-00004-yoh** (nodejs22) |
| GIS rollback revision | georesolvefunction-00002-kuy (retained) |
| WIF prod deploy run | 31020673782 (`auth_mode=wif`, SHA `d3aeff6`) |
| Post-merge CI | 31019970247 on `4bfe713` |
| Cert | docs/reports/PILOT_READINESS_CLOSURE_CERTIFICATION.md |

## Registry entries

| Date (UTC) | Release | Branch | Starting SHA | Deployed SHA | GIS rev | Notes / cert |
|------------|---------|--------|--------------|--------------|---------|--------------|
| 2026-08-05 | **Pilot readiness closure** | main | `052161e` | WIF Hosting `d3aeff6` + later Hosting auth-persist tips; GIS `…-00004-yoh` | `georesolvefunction-00004-yoh` | WIF-only deploy; JSON key retired; Playwright auth UAT; Hosting rollback drill |
| 2026-08-05 | Pilot readiness hardening | `cert/pilot-readiness-hardening` | `052161e` | `eff734b` / tip `4af4261` | `…-00002-kuy` | Prior PASS WITH CONDITIONS |
| 2026-08-05 | Operational Intelligence | main | `2316f2d` | `e90fdc0` | `…-00002-kuy` | Cert tip `405839d` |

## Deploy rule

Production deploys **only** via GitHub WIF (`workflow_dispatch`) from a verified SHA. JSON-key fallback removed.
