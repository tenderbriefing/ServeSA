# Pilot Municipality Readiness Certification

| Field | Value |
|-------|-------|
| Template version | 1.1 |
| Issued (UTC) | 2026-08-05T17:25:00Z |
| Verdict | **PASS WITH CONDITIONS** |
| Project | `servesa-aad53` |
| Region | `africa-south1` |
| Hosting | https://servesa-aad53.web.app |
| Branch | `main` (closure via `cert/closure-wif-uat-fix`) |
| Starting tip (prior PWC) | `4af4261` on `cert/pilot-readiness-hardening` |
| Mainline merge | PR #1 → `4bfe713`; Hosting fix PR #2 → `d3aeff6` |
| WIF deployed SHA | `d3aeff65228955ec3d80d00effc828c80598277d` |
| Hosting version | `ed6f7a56cfdc0c8a` |
| GIS resolver revision | `georesolvefunction-00004-yoh` (`nodejs22`) |
| GIS rollback | `georesolvefunction-00002-kuy` |
| GIS dataset | `mdb-wards-2020-v1` (4468 wards, `ST_COVERS`) |

## Purpose

Certify Serve SA for single-municipality pilot after closing prior **PASS WITH CONDITIONS** items.

## Closed conditions (closure sprint)

| Prior condition | Result |
|-----------------|--------|
| Mainline integration | PASS — merged to `main` |
| Post-merge CI | PASS — `verify` on exact SHA |
| First WIF production deploy | PASS — run `31020673782` |
| JSON-key retirement | PASS — secret + Actions key removed; workflows WIF-only |
| Authenticated Playwright UAT | PASS — 14 passed; 2 skipped by design (unauth checks when tokens set) |
| Live Hosting rollback | PASS — rolled back + restored; 26s |
| GIS Node 22 | PASS — `…-00004-yoh`; semantics preserved |
| Traceability | PASS — registry + workflow SHA + Hosting version |

## Remaining conditions

| ID | Condition | Blocking for limited pilot? |
|----|-----------|------------------------------|
| R1 | Residual 2025 USER_MANAGED key on adminsdk (non-Actions) | No |
| R2 | `generateDailyReport` europe-west1 scheduler flake | No |
| R3 | Fill pilot municipality template before go-live | Yes for named pilot launch |

## Related

- Closure report — `docs/reports/PILOT_READINESS_CLOSURE_CERTIFICATION.md`
- Registry — `docs/reports/DEPLOYMENT_REGISTRY.md`
- Auth UAT — `docs/pilot/AUTHENTICATED_BROWSER_UAT.md`
