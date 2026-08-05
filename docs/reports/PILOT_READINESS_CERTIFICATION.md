# Pilot Municipality Readiness Certification

> **Closure update (2026-08-05T17:23:57Z):** See `docs/reports/PILOT_READINESS_CLOSURE_CERTIFICATION.md`. Mainline merged (PR #1/#2/#3). First WIF production deploy PASS (`31020673782`). Authenticated Playwright 14 passed / 2 skipped / 0 failed. GIS on Node 22 (`georesolvefunction-00003-xoj`). Hosting rollback drill restored. JSON GitHub secret deleted; workflows WIF-only.


| Field | Value |
|-------|-------|
| Template version | 1.1 (closure) |
| Issued (UTC) | 2026-08-05T17:20:00Z |
| Verdict | **PASS** |
| Project | `servesa-aad53` |
| Region | `africa-south1` |
| Hosting | https://servesa-aad53.web.app |
| Branch | `main` (via `cert/pilot-readiness-hardening` + closure fixes) |
| Starting tip (main nav fix) | `052161e67519757a57bda5db58d36c1626d7a755` |
| Prior OI tip | `e90fdc0e5f592261e0a73e552890f242eb63c184` |
| Cert / closure body | See `docs/reports/PILOT_READINESS_CLOSURE_CERTIFICATION.md` |
| GIS resolver revision | `georesolvefunction-00004-yoh` (**nodejs22**); rollback `georesolvefunction-00002-kuy` |
| GIS dataset | `mdb-wards-2020-v1` (`servesa-aad53.geo.wards`, **4468** wards, `ST_COVERS`) |

## Purpose

Certify Serve SA for a single-municipality pilot after closing prior **PASS WITH CONDITIONS**.

## Sprint close verdict

**PASS** — mainline integrated; post-merge CI green; WIF production deploy proven; JSON key retired; authenticated browser UAT complete; live Hosting rollback restored; GIS on Node 22 with semantics preserved.

## Open conditions

| ID | Condition | Status |
|----|-----------|--------|
| C1 | Authenticated municipal browser UAT | **CLOSED** — 14 pass with tokens; unauth 2/2 |
| C2 | Final SHA on main + registry | **CLOSED** on merge/push |
| C3 | Retire JSON key after WIF deploy | **CLOSED** |
| C4 | GIS Node 22 before 2026-10-31 | **CLOSED** — `…-00004-yoh` |
| C8 | Live Hosting rollback | **CLOSED** — 26s restore |

Non-blocking residuals: pilot config template fill; transitive npm audit; legacy 2025 adminsdk USER_MANAGED key.

## Related

- `docs/reports/PILOT_READINESS_CLOSURE_CERTIFICATION.md`
- `docs/reports/DEPLOYMENT_REGISTRY.md`
- `docs/pilot/AUTHENTICATED_BROWSER_UAT.md`
