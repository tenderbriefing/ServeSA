# Enterprise Production Certification — Serve SA

| Field | Value |
|-------|-------|
| Template version | 1.0 |
| Issued (UTC) | 2026-08-07T11:18:17Z |
| Verdict | **PASS WITH CONDITIONS** |
| Project | `servesa-aad53` |
| Region | `africa-south1` |
| Hosting | https://servesa-aad53.web.app |
| Branch (audit tip) | `main` @ `46ce2f9` |
| Live Hosting SHA (WIF) | `1e88620db1e1fa6d9607464117eb712481c669f8` (run `31078956476`) |
| Hosting version (live) | `3113534c8b407296` FINALIZED `2026-08-06T06:57:23Z` |
| Fix branch (this cert) | `fix/report-null-optional-fields` |
| GIS revision (live) | **`georesolvefunction-00004-yoh`** (`nodejs22`) |
| GIS rollback | `georesolvefunction-00002-kuy` (retained) |
| GIS dataset | `mdb-wards-2020-v1` (4468 wards, `ST_COVERS`) |

## Executive verdict

Production surfaces for citizen case creation (callable path), GIS, media, tracking, municipal ops, field list, isolation, WIF deploy posture, and Hosting security headers were verified with **live evidence**. One **production-critical UI defect** was found and fixed in-branch: report submit failed when optional string fields were JSON `null` (`Expected string, received null`). Until that fix is merged and redeployed to Hosting (+ Functions for shared contract defense-in-depth), the authenticated **browser** homepage→submit journey remains blocked on some payloads even though the callable API path succeeds.

**Verdict: PASS WITH CONDITIONS** — not upgraded to PASS while the null-optional fix is not yet live on Hosting.

## Internal deployment inventory

| Surface | Evidence |
|---------|----------|
| Git `main` tip | `46ce2f9` (docs registry merge); Hosting content from `1e88620` |
| WIF Deploy Production | Run `31078956476` SUCCESS; `auth_mode=wif`; SHA `1e88620` |
| Hosting live version | `3113534c8b407296` (API list via smartprocure account) |
| Functions (sample) | `createCaseFunction` `createcasefunction-00006-nek` nodejs22; `uploadMediaFunction` `…-00005-hak`; `georesolveFunction` `…-00004-yoh`; `updateCaseStatusFunction` `…-00003-rex`; `processMediaUploadFunction` `…-00002-len` |
| Firestore / Storage rules | Validated via Firebase MCP (`OK: No errors detected`) for `infra/firestore.rules` and `infra/storage.rules` |
| Scheduler | `europe-west1`: cleanupOldMedia (24h), generateDailyReport (06:00), ingestCAPAlerts (15m) — ENABLED |
| GitHub Actions secrets | `total_count=0` (JSON key path retired) |
| Deploy SA keys | `github-actions-deploy@…` — **SYSTEM_MANAGED only** (2) |
| Residual key | `firebase-adminsdk-fbsvc@…` **USER_MANAGED** `948e53bf…` still present (prior condition R1) |
| Monitoring / alerts | Prior pilot baselines retained; no new alert wiring claimed this sprint |

## Production verification matrix

| Area | Result | Evidence |
|------|--------|----------|
| Citizen reporting (callable) | **PASS** | Case **`CASE-MSIU81J7-KXEZ5R`**: `polygon_match`, ward `79800060`, muni `JHB`, `routingPending=false`, SLA 72h; idempotent retry same ID; default `0,0` rejected |
| Citizen reporting (browser UI) | **FAIL → fixed in-branch** | Live Playwright hit `Expected string, received null` on submit; root cause optional `null` strings; fix in `case-contract` preprocess + report `buildPayload` / send `parsed.data` |
| Follow-up create latency | **PASS** | `CASE-MSIUC8XF-Q7CLF2` createCase **230ms** warm |
| GIS unique | **PASS** | Callable `{lat,lng}` → `st_covers`, `mdb-wards-2020-v1`, ward `79800060`; BQ `ST_COVERS` same point → 1 row |
| GIS unresolved / ocean | **PASS** | Callable + createCase reject outside SA; BQ ocean covers **0** |
| GIS ambiguous live point | **CONDITIONAL** | Unit tests cover multi-cover; no live ambiguous point observed this run |
| Photo JPEG/PNG/WebP | **PASS** | Upload completed on `CASE-MSIU81J7-KXEZ5R`; EXE rejected (`Unsupported file type`); >10MB rejected; duplicate contentHash idempotent |
| Photo HEIC | **CONDITIONAL** | Allowed in MIME allow-list; no HEIC binary exercised this run |
| Tracking `/case` | **PASS** | Query + path URLs HTTP 200; timeline milestones include create/GIS/media/status; status progressed to `in_progress` |
| My Cases / auth | **PASS** | Playwright @pilot citizen/dashboard gates; unauth Firestore case read denied |
| Municipal ops | **PASS** | Smart queue; ack → assign(`roads`) → `in_progress`; invalid status rejected; illegal back-transition rejected; internal note + public update (`body`); CPT cross-muni **denied** |
| Field `/field` | **PASS (certify)** | `listFieldJobsFunction` returns `{municipalityCode,jobs}`; Playwright field UAT; **no redesign** |
| Notifications | **PASS WITH CONDITIONS** | Timeline/public update ledger events present; email/push provider delivery not end-to-end probed this run |
| Security rules / authz | **PASS** | Storage unauth list **403**; Firestore unauth case read permission-denied; media ownership enforced in upload path; cross-muni denial verified |
| Rate limits / validation | **PASS** | Invalid coords, invalid status, EXE/oversized media rejected |
| Performance (prod) | **MEASURED** | Homepage HTML TTFB ~183–309ms (ZA edge); referenced homepage assets ~**1.01MB**; georesolve unique ~1444ms (incl. cache miss path variance); createCase warm 230ms. **LCP not instrumented in Chrome this run** — recommend only |
| Accessibility | **PASS WITH CONDITIONS** | Skip link + keyboard focus Playwright PASS; mobile menu PASS after hydration wait; practical WCAG 2.1 AA full audit not claimed |
| Mobile ~390px | **PASS** | iPhone viewport + mobile menu Playwright PASS post-hydration harden; no US flag / language controls |
| Observability | **PASS WITH CONDITIONS** | Structured case telemetry events on timeline; no noisy failure storm observed during smoke |
| Disaster recovery | **PASS (documented)** | Hosting rollback targets in registry (`ed6f7a56…`, drill `3af9a650…`); GIS rollback `…-00002-kuy`; WIF runbooks present; prior rollback drill evidence retained |
| Playwright @pilot | **PASS** | **14 passed / 2 skipped / 0 failed** (`playwright_enterprise_pilot.txt`) |
| UI/UX baseline (PR #6) | **PRESERVED** | Language/US-flag absence tests PASS; civic routes 200; no redesign performed |

### Primary Case IDs (this certification)

| Case ID | Role |
|---------|------|
| `CASE-MSIU81J7-KXEZ5R` | Primary citizen create + media + ops lifecycle |
| `CASE-MSIUC8XF-Q7CLF2` | Warm createCase latency follow-up |

## Build gates (fix branch)

| Gate | Result |
|------|--------|
| `npm run typecheck` | PASS (case-contract, web, functions) |
| `@servesa/case-contract` tests | **16/16 PASS** (includes null-optional normalisation) |
| Functions `createCase.contract` + `lifecycle` | PASS |

## Genuine risks

1. **Browser report submit null-optional bug** (critical) — fixed in `fix/report-null-optional-fields`; **not live until Hosting(+Functions) deploy**.
2. Residual `firebase-adminsdk-fbsvc` USER_MANAGED key `948e53bf…` (non-blocking if unused outside Actions — owner confirm/delete).
3. `npm audit --omit=dev` reports multiple highs/criticals in transitive deps (e.g. `websocket-driver`); not proven exploitable on Serve SA attack surface this run — track separately, do not weaken auth/rules for a paper PASS.
4. Ambiguous GIS and HEIC not live-exercised this run (allow-list / unit coverage only).

## Verified tech debt (non-blocking)

- Deployment registry previously listed GIS rev `…-00003-xoj`; live is **`…-00004-yoh`** (corrected in this cert / registry update post-deploy).
- Playwright mobile menu required hydration wait (static export race) — test hardened; product menu works after client hydrate.
- Onboarding modal uses label **Skip** / **Close introduction** (UAT helper updated).
- Performance LCP / cold-start percentiles still TBD for week-1 SRE baseline.

## Remaining manual actions

1. Merge `fix/report-null-optional-fields` via protected PR path.
2. WIF `Deploy Production` (Hosting + Functions + rules as needed) from merged SHA.
3. Re-run `enterprise_report_live` Playwright; record browser Case ID; upgrade verdict to **PASS** only after green live UI submit.
4. Owner: delete residual adminsdk USER_MANAGED key if unused.
5. Optional: HEIC fixture upload; Lighthouse LCP capture on production.

## Evidence index

- `docs/reports/evidence/enterprise_prod_smoke.json`
- `docs/reports/evidence/enterprise_followup_smoke.json`
- `docs/reports/evidence/enterprise_lifecycle_followup.json`
- `docs/reports/evidence/enterprise_perf_ttfb.csv`
- `docs/reports/evidence/enterprise_bundle_assets.csv`
- `docs/reports/evidence/playwright_enterprise_pilot.txt`
- `docs/reports/evidence/playwright_mobile_menu_rerun.txt`
- `docs/reports/evidence/playwright_enterprise_live_report.txt` (pre-fix UI failure)
- `docs/reports/evidence/npm_audit_enterprise.txt`

## Sign-off

| Role | Date | Notes |
|------|------|-------|
| Engineering / Release | 2026-08-07 | Evidence-backed; PASS WITH CONDITIONS pending live UI fix deploy |
| Security | 2026-08-07 | No security weakening; critical UI validation defect found and patched in-branch |
| Pilot lead | | |
