# Pilot Readiness Closure Certification

| Field | Value |
|-------|-------|
| Template version | 1.0 |
| Issued (UTC) | 2026-08-05T17:20:00Z |
| Verdict | **PASS** |
| Project | `servesa-aad53` |
| Region | `africa-south1` |
| Hosting | https://servesa-aad53.web.app |
| Starting cert branch tip | `4af4261ded3a67002b1ea0d002460254dea38a19` |
| Pre-merge main SHA | `052161e67519757a57bda5db58d36c1626d7a755` |
| Merge | PR #1 merge commit `4bfe713` (+ follow-up PR #2 `d3aeff6`) |
| Final main tip (this cert body) | recorded at push — see registry |
| Firebase project | servesa-aad53 |

## Executive verdict

**PASS** — prior pilot-readiness conditions closed with evidence:

1. Cert branch merged to `main` (PR #1).
2. Post-merge CI green on merge SHA `4bfe713` (run `31019970247`).
3. First production WIF deploy succeeded (run `31020673782`, `auth_mode=wif`, Hosting version `3af9a65002876d20`).
4. JSON-key path retired (workflows WIF-only; GitHub secret `SERVICE_ACCOUNT` deleted; Actions SA key `a4ecd48b…` deleted).
5. Authenticated Playwright UAT: **14 passed / 0 failed / 2 skipped** with tokens (skips are mutually exclusive unauth leak checks); unauth pair **2/2 passed** without tokens.
6. Live Hosting rollback drill + restore (26s recovery; left on approved release).
7. GIS Function on **Node 22** revision `georesolvefunction-00004-yoh`; prior `georesolvefunction-00002-kuy` retained.
8. GIS smoke: unique JHB `polygon_match` / `mdb-wards-2020-v1` / `st_covers`; unresolved outside SA; case `CASE-MSGCRN8Z-RN7CD2` `routingPending=false`.

## Protected invariants (held)

- Dataset `mdb-wards-2020-v1`; predicate `ST_COVERS`; no nearest-centroid; no image→muni
- No auto-merge; intelligence fail-open; municipal/field isolation; privacy-safe timeline
- Rollback target `georesolvefunction-00002-kuy` intact

## Evidence index

| Item | Path / ID |
|------|-----------|
| WS1 baseline | `docs/reports/evidence/closure_ws1_baseline.json` |
| Post-merge CI | https://github.com/tenderbriefing/ServeSA/actions/runs/31019970247 |
| WIF verify | https://github.com/tenderbriefing/ServeSA/actions/runs/31019990102 |
| WIF prod deploy | https://github.com/tenderbriefing/ServeSA/actions/runs/31020673782 |
| Hosting rollback | `docs/reports/evidence/hosting_rollback_drill.json` |
| Playwright auth | `docs/reports/evidence/playwright_auth_uat.txt` |
| Playwright unauth | `docs/reports/evidence/playwright_unauth_checks.txt` |
| GIS Node 22 smoke | `docs/reports/evidence/gis_node22_smoke.json` |
| UAT identities meta | `docs/reports/evidence/uat_identities_meta.json` |

## Remaining external / owner-only (non-blocking)

- Pilot municipality sponsor fill of `docs/pilot/PILOT_CONFIGURATION_TEMPLATE.md` before go-live
- Residual npm audit transitive advisories (tracked)
- One residual USER_MANAGED key on `firebase-adminsdk` from 2025-08-30 (pre-sprint; not the retired Actions key)

## Sign-off

| Role | Result |
|------|--------|
| Release / Certification Authority | **PASS** |
