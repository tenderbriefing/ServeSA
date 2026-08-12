# National Municipality Onboarding — Production Certification

**Date:** 2026-08-12  
**Auditor:** Principal release close-out (verify → remediate → retest → certify)  
**Production URL:** https://servesa-aad53.web.app  
**Firebase project:** `servesa-aad53`

## Executive Verdict

**PASS WITH CONDITIONS**

National citizen onboarding is production-stable: required province + municipality, optional ward, auth-gated `/municipality`, no runtime JHB citizen fallback, cross-municipality isolation verified, municipal publishing engine **OFF**, case/GIS path unchanged. europe-west1 Cloud Scheduler IAM has been **remediated and proven** via owner redeploy and WIF Deploy Production. Remaining conditions are non-blocking for national onboarding (authentic publishing document lifecycle still not executed; static municipal catalogue incomplete).

## Git

| Item | Value |
|------|-------|
| Close-out starting SHA | `1f5dd33f9bb8ad0a9375bb0c6c0ba0ddf6e9c6ed` (PR #23 merge tip when close-out began) |
| Prior national merges | PR [#22](https://github.com/tenderbriefing/ServeSA/pull/22) `bc955969…` · PR [#23](https://github.com/tenderbriefing/ServeSA/pull/23) `1f5dd33…` · docs PR [#24](https://github.com/tenderbriefing/ServeSA/pull/24) `fd1a4a1…` |
| Release close-out branch | `cert/national-release-closeout` |
| Final SHA | _(filled after this close-out PR merges)_ |

## National onboarding

- **Province:** required (`Province*`) — live `/auth` + Playwright closeout
- **Municipality:** required; filtered by province (Western Cape → Cape Town etc.; no Johannesburg in WC list)
- **Ward:** optional; GIS remains authoritative for case routing
- Invalid empty submit shows form problem summary; selected WC+CPT accepted as valid municipal identity
- Canonical codes include `JHB`, `CPT`, `DBN` (eThekwini), `TSH`, `BUF`, `POL`, …

## Existing users / context

- Resolver: claims → profile → null (never invents JHB)
- Missing municipality → `CitizenMunicipalityGate` / confirm panel
- Header **Your Municipality** when resolved
- `/ideas/new`, Updates, Ideas share the same gate

## /municipality

- Unauthenticated: **Sign in to view Our Municipality** (live + `@closeout` + `@planning`)
- Authenticated citizen: scoped surface / confirm / honest empty — no anonymous JHB fallback
- Unpublished planning: “Planning information is not available yet”

## JHB fallback audit

| Class | Result |
|-------|--------|
| Runtime citizen fallback `\|\| 'JHB'` | **None** in citizen/ops planning paths (unit + source audit) |
| Dataset / fixtures / tests using `JHB` | Legitimate (canonical metro + fixtures) |
| `Africa/Johannesburg` timeZone on schedulers | Timezone only — not municipality fallback |
| Live WC municipality options | No Johannesburg |

## Cross-municipality isolation

- Local security intent tests: **24 passed** (`infra/tests`)
- Live `@pilot` isolation + JHB vs CPT official ops reachability: **PASS**
- Publishing drafts remain municipality-scoped by contract/rules (engine flag OFF)

## Publishing

- `NEXT_PUBLIC_ENABLE_MUNICIPAL_PUBLISHING_ENGINE` evaluates `"true"===env…` → **OFF** unless explicitly set
- africa-south1 publishing callables deployed and listed
- Official authentic document lifecycle UAT: **NOT EXECUTED** (no authentic PDF/DOCX supplied)
- Flag was **not** enabled during this close-out

## Production deployment

| Surface | Status | Evidence |
|---------|--------|----------|
| Hosting | **SUCCESS** | [run 31593637726](https://github.com/tenderbriefing/ServeSA/actions/runs/31593637726) @ `1f5dd33` · last-modified ~2026-08-12T11:53Z |
| Firestore rules + indexes | **SUCCESS** | run `31592236965` |
| Storage rules | **SUCCESS** | run `31592236965` |
| Functions africa-south1 (incl. publishing) | **SUCCESS** | run `31592236965` update ops |
| europe-west1 scheduled (prior) | **FAILED** then **FIXED** | IAM `cloudscheduler.jobs.update` denied → remediated |
| Full functions via WIF (post-fix) | **SUCCESS** | [run 31595536668](https://github.com/tenderbriefing/ServeSA/actions/runs/31595536668) @ `fd1a4a1` |
| Publishing feature flag | **OFF** | default code path + live bundle |

### europe-west1 Scheduler IAM — root cause & resolution

| Field | Detail |
|-------|--------|
| Jobs | `firebase-schedule-ingestCAPAlertsFunction-europe-west1`, `firebase-schedule-generateDailyReport-europe-west1`, `firebase-schedule-cleanupOldMedia-europe-west1` |
| Region | `europe-west1` |
| Functions | `ingestCAPAlertsFunction`, `generateDailyReport`, `cleanupOldMedia` |
| Failing permission | `cloudscheduler.jobs.update` (HTTP 403) |
| Principal | Deploy SA `github-actions-deploy@servesa-aad53.iam.gserviceaccount.com` (WIF) lacked Scheduler Admin |
| Origin | Deployer identity IAM gap — not Cloud Scheduler service agent / org policy |
| Remediation | Granted `roles/cloudscheduler.admin` to `github-actions-deploy@…` and `github-action-1047463008@…` (least privilege for job upsert) |
| Proof (owner) | `docs/reports/evidence/scheduler_iam_redeploy.txt` — all three Successful update |
| Proof (WIF CI) | `docs/reports/evidence/scheduler_iam_wif_redeploy.txt` + run `31595536668` **Deploy complete** |
| Jobs state | All three **ENABLED** |

## UAT (live production)

**Base URL:** https://servesa-aad53.web.app  
**Credentials:** `docs/reports/evidence/uat_tokens.env` (gitignored — never committed)

| Suite | Passed | Failed | Skipped | Evidence |
|-------|--------|--------|---------|----------|
| Playwright `@pilot` | 14 | 0 | 2 | `national_closeout_playwright_pilot.txt` |
| Playwright `@closeout` (national) | 6 | 0 | 0 | `national_closeout_browser_uat.txt` |
| Playwright `@planning` | 2 | 0 | 0 | `national_closeout_muni_planning_e2e.txt` |
| Official document publishing | — | — | **NOT EXECUTED** | no authentic municipal document |

**Viewports:** 390px + 1440px in closeout/smoke flows  
**Harness:** `signInAndGoto` waits for “Checking your session…” as well as staff claim race

## Local certification (re-run this close-out)

| Suite | Passed | Failed | Skipped |
|-------|--------|--------|---------|
| Web unit | 46 | 0 | 0 |
| Case-contract | 32 | 0 | 0 |
| Functions | 50 | 0 | 0 |
| Infra security | 24 | 0 | 0 |
| Typecheck (web/functions/contract) | PASS | — | — |

## GIS / citizen report regression

- GIS resolver / `ST_COVERS` path unchanged this release
- Report wizard loads on production (`@pilot` + `@closeout`)
- Profile ward remains supplementary only

## Outstanding conditions

1. **Authentic municipal document publishing lifecycle UAT** — NOT EXECUTED. Impact: publishing pilot only (flag OFF). Owner: product/ops to supply verified PDF/DOCX. Production citizen platform: **safe**. Deadline: before enabling publishing flag for any municipality.
2. **Static `southAfricaData` municipal coverage incomplete** — non-blocking; validators reject invalid pairs. Owner: data completeness backlog.
3. **Ward remains free-text** (no official ward catalogue at signup) — intentional; GIS authoritative on report.

## Rollback

1. Revert close-out / national merge commits on `main` if required  
2. Redeploy prior Hosting / Functions via Deploy Production  
3. Citizen reporting continues (GIS unchanged)  
4. Publishing stays OFF by default  

## Final recommendation

**NATIONAL PLATFORM READY WITH CONDITIONS**
