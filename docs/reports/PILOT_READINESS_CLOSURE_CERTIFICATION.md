# Pilot Readiness Closure Certification

| Field | Value |
|-------|-------|
| Template version | 1.0 |
| Issued (UTC) | 2026-08-05T17:25:00Z |
| Verdict | **PASS WITH CONDITIONS** |
| Project | `servesa-aad53` |
| Region | `africa-south1` |
| Hosting | https://servesa-aad53.web.app |
| Closure branch | `cert/closure-wif-uat-fix` |
| Merged to main | PR #3 → `49cbe4b` (WIF retirement + AuthProvider race + UAT wiring) |
| Follow-up UAT form fix SHA | _(this commit — form submit selector)_ |
| First WIF production deploy | run **31020673782** on `d3aeff6` (`auth_mode=wif`, Hosting) |
| GIS revision | `georesolvefunction-00003-xoj` (`nodejs22`) |
| GIS rollback revision | `georesolvefunction-00002-kuy` (retained) |
| GIS dataset | `mdb-wards-2020-v1` (4468 wards, `ST_COVERS`) |

## Purpose

Close remaining conditions from prior **PASS WITH CONDITIONS** on `cert/pilot-readiness-hardening` and certify mainline release readiness with evidence.

## Closure checklist

| # | Condition | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Mainline merge of cert branch | **PASS** | PR #1 (`4bfe713`); tip was `482eb71` (beyond `4af4261`) |
| 2 | Post-merge CI on final main | **PASS** | CI run `31020661073` SUCCESS on `d3aeff6`; PR #3 CI SUCCESS then merge `49cbe4b` |
| 3 | First production WIF deploy | **PASS** | Run `31020673782` SUCCESS; principal `github-actions-deploy@…` |
| 4 | JSON-key retirement after WIF | **PASS WITH CONDITIONS** | Workflows WIF-only in PR #3; GitHub secrets `total_count=0` (`SERVICE_ACCOUNT` deleted); deploy SA has **no** USER_MANAGED keys; residual `firebase-adminsdk` USER_MANAGED key `948e53bf…` not used by Actions — owner may delete |
| 5 | Authenticated Playwright UAT | **PASS** | 14 passed / 2 skipped (intentional unauth leak checks when tokens loaded) / 0 failed — `docs/reports/evidence/playwright_auth_uat.txt` |
| 6 | Live Hosting rollback + restore | **PASS** | `hosting_rollback_drill.json` — restored to approved release in 26s |
| 7 | GIS Node 22 migration | **PASS** | Runtime `nodejs22`, rev `…-00003-xoj`; BQ unique JHB + unresolved smoke; unit tests 8/8 |
| 8 | Final smoke + traceability | **PASS WITH CONDITIONS** | Routes 200; Hosting tip `ed6f7a56cfdc0c8a` (CLI deploy of UAT AuthProvider); WIF tip was `3af9a65002876d20` on `d3aeff6` |

## Playwright (@pilot)

| Metric | Value |
|--------|-------|
| Total | 16 |
| Passed | 14 |
| Failed | 0 |
| Skipped | 2 (unauthenticated leak checks skipped when auth tokens present — by design) |
| Browser | Chromium (Playwright channel chrome) |

Role results: citizen, official, supervisor, field, CPT isolation, suspended gate — **PASS**.

## Protected GIS invariants

| Invariant | Status |
|-----------|--------|
| `ST_COVERS` | Preserved in source + BQ smoke |
| `mdb-wards-2020-v1` | Confirmed on unique match |
| Ward count 4468 | Confirmed |
| Unique JHB CBD → ward `79800060` / muni `JHB` | PASS |
| Ocean point → 0 covers | PASS (unresolved path) |
| Rollback rev `…-00002-kuy` | Listed and retained |

## Remaining conditions (narrow)

| ID | Condition | Blocking? | Owner |
|----|-----------|-----------|-------|
| R1 | Delete residual `firebase-adminsdk-fbsvc@…` USER_MANAGED key `948e53bf…` if confirmed unused outside Actions | No | Platform owner |
| R2 | Real-municipality interactive acceptance | External | Pilot sponsor |
| R3 | Push/merge form-submit Playwright helper fix + this cert to `main` if not yet on tip | No if PR follows | Release eng |
| R4 | Optional WIF Hosting redeploy of final cert tip (CLI Hosting already serves UAT fix) | Recommended | Platform |

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Engineering / Release | | 2026-08-05 | Evidence-backed closure |
| Pilot lead | | | |
| Municipal sponsor | | | |

## Related

- `docs/reports/PILOT_READINESS_CERTIFICATION.md`
- `docs/reports/DEPLOYMENT_REGISTRY.md`
- `docs/pilot/AUTHENTICATED_BROWSER_UAT.md`
- Evidence under `docs/reports/evidence/`
