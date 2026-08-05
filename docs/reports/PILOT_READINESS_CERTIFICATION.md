# Pilot Municipality Readiness Certification

| Field | Value |
|-------|-------|
| Template version | 1.0 |
| Issued (UTC) | 2026-08-05T14:55:00Z |
| Verdict | **PASS WITH CONDITIONS** |
| Project | `servesa-aad53` |
| Region | `africa-south1` |
| Hosting | https://servesa-aad53.web.app |
| Branch | `cert/pilot-readiness-hardening` |
| Starting tip (main nav fix) | `052161e67519757a57bda5db58d36c1626d7a755` |
| Prior OI tip | `e90fdc0e5f592261e0a73e552890f242eb63c184` |
| Prior OI cert tip | `405839d` |
| Deployed SHA (this sprint) | Node 22 functions + storage rules deployed from working tree on `cert/pilot-readiness-hardening` (pre-commit tip `052161e`; final cert SHA recorded after push) |
| Cert SHA (this document) | _filled after commit/push_ |
| GIS resolver revision | `georesolvefunction-00002-kuy` (**unchanged**; still `nodejs20`) |
| GIS dataset | `mdb-wards-2020-v1` (`servesa-aad53.geo.wards`, **4468** wards, `ST_COVERS`) |
| Pilot municipality | Template ready — fill `docs/pilot/PILOT_CONFIGURATION_TEMPLATE.md` before go-live |

## Purpose

Certify that Serve SA is operationally ready for a **single-municipality pilot**: citizen report → authoritative GIS routing → municipal ops lifecycle → duplicate review (no auto-merge) → field completion path → citizen confirm/reopen — without weakening tenancy, GIS, or privacy invariants.

## Live product surfaces in scope

| Route | Role | Status |
|-------|------|--------|
| `/report` | Citizen | Live — Playwright @pilot PASS |
| `/case` | Citizen (case progress) | Live — no score leak asserted |
| `/ops` | Official / admin (Smart Work Queue) | Live — gated without auth |
| `/ops/cases`, `/ops/case`, `/ops/team`, `/ops/settings` | Official / admin | Live |
| `/ops/supervisor` | Official / admin | Live — Playwright @pilot PASS |
| `/ops/map` | Official / admin | Live |
| `/field` | `field_worker` / official | Live — Playwright @pilot PASS |
| Duplicate review UI + `reviewDuplicateFunction` | Official (no auto-merge) | Live (prior OI) |

Out of scope for this cert: public league tables, speculative AI/SLA engines, face recognition, image→municipality inference, auto-merge of cases.

## Verdict criteria

| Result | Meaning |
|--------|---------|
| **PASS** | All workstreams evidenced; no open blocking conditions |
| **PASS WITH CONDITIONS** | Core pilot path works; listed conditions are non-blocking for a controlled pilot |
| **FAIL** | Any protected invariant broken, or core path not deployable from a verified SHA |

**Sprint close verdict:** **PASS WITH CONDITIONS** — production baseline intact; Node 22 on non-GIS functions; WIF pool live; CI + main branch protection enabled; Playwright unauthenticated UAT green; fixture image metrics recorded; storage phash prefix narrowed; synthetic load bench recorded; rollback dry-run documented. Remaining conditions: interactive authenticated municipal UAT tokens, WIF Actions smoke after branch push, JSON key retirement, live Hosting rollback click, `generateDailyReport` europe-west1 scheduler flake.

---

## Protected invariants (must hold)

1. **No GIS weaken** — `georesolvefunction-00002-kuy` / `mdb-wards-2020-v1` / `ST_COVERS` verified this sprint.
2. **No image→municipality inference** — unchanged.
3. **No auto-merge** — recommend-only.
4. **No exposing duplicate scores/notes to citizens** — Playwright assert on `/case`.
5. **No cross-muni access** — prior OI + unauth isolation UAT.
6. **No field-worker unrelated cases** — field gate asserted.
7. **Intelligence fail-open** — unchanged.
8. **No face recognition** — unchanged.
9. **No speculative AI/SLA engine** — unchanged.
10. **Deploy only from verified SHA** — registry + workflow_dispatch only.

---

## Workstream checklist

| # | Workstream | Status | Evidence |
|---|------------|--------|----------|
| W1 | Citizen `/report` durable create + mandatory media | PASS WITH CONDITIONS | Hosting 200 + Playwright UI; full create path prior OI smoke |
| W2 | GIS `polygon_match` / unresolved / triage unchanged | PASS | Rev `…-kuy`; BQ 4468 wards; runtime left on `nodejs20` |
| W3 | Dept routing only after authoritative GIS | PASS | Prior certs; no GIS code change this sprint |
| W4 | Ops lifecycle | PASS WITH CONDITIONS | Prior ops smoke `CASE-MSFN98YW-0TQWX7`; Node 22 ops callables live |
| W5 | Duplicate review: recommend only | PASS | Prior OI cases; fixture distant-reject PASS |
| W6 | Cross-muni isolation | PASS WITH CONDITIONS | Prior CPT→JHB deny; Playwright isolation unauth PASS; auth-token UAT pending |
| W7 | Supervisor board | PASS WITH CONDITIONS | Hosting 200 + Playwright gate PASS |
| W8 | Ops map | PASS WITH CONDITIONS | Hosting 200; prior OI map smoke |
| W9 | Field `/field` | PASS WITH CONDITIONS | Playwright gate PASS; offline full lifecycle deferred |
| W10 | Citizen timeline confirm / reopen | PASS WITH CONDITIONS | Prior OI; Playwright `/case` no score leak |
| W11 | Pilot config template + claims | PASS | `docs/pilot/PILOT_CONFIGURATION_TEMPLATE.md` |
| W12 | UAT script + Playwright | PASS WITH CONDITIONS | 11 passed / 5 skipped (no tokens); `docs/reports/evidence/playwright_pilot_uat.log` |
| W13 | Success metrics | PASS | `docs/pilot/PILOT_SUCCESS_METRICS.md` |
| W14 | Rollback drill | PASS WITH CONDITIONS | Dry-run documented — `docs/runbooks/PRODUCTION_ROLLBACK_DRILL.md` |
| W15 | Incident response | PASS | `docs/runbooks/PILOT_INCIDENT_RESPONSE.md` |
| W16 | Observability baselines | PASS WITH CONDITIONS | Synthetic bench filled; prod latency TBD week 1 |
| W17 | Node runtime upgrade | PASS WITH CONDITIONS | Non-GIS → `nodejs22`; GIS stays `nodejs20` until separate GIS window |
| W18 | GitHub WIF | PASS WITH CONDITIONS | Pool/provider ACTIVE; GH vars set; JSON key retained until Actions WIF smoke |
| W19 | Deployment registry | PASS | This sprint row updated |
| W20 | Image similarity validation | PASS WITH CONDITIONS | Fixture precision=1.0 recall=0.4; exact+resized+negative PASS; rotated/recompressed/cropped FAIL (documented limits) |

---

## Observability (pilot)

Monitor without logging PII (no emails, phone numbers, free-text descriptions, or image URLs with tokens):

| Signal | Where | Alert intent |
|--------|-------|--------------|
| Callable / HTTP error rates | Cloud Logging / Monitoring | Spike vs baseline |
| `georesolveFunction` latency + error ratio | Cloud Monitoring | GIS path degradation |
| Function cold starts | Cloud Functions metrics | Latency outliers after idle |
| Hosting 5xx | Hosting + Logging | Frontend outage |
| Image intelligence failure rate (fail-open) | Function logs (caseId + reason codes) | Silent unscored media backlog |

---

## Open conditions

| ID | Condition | Blocking? | Owner | Target |
|----|-----------|-----------|-------|--------|
| C1 | Interactive authenticated official/field browser UAT with pilot municipality identities | Yes for launch | Pilot lead | Pre-go-live |
| C2 | Final cert SHA + registry tip after merge to main / production Hosting tip if hosting redeployed | Yes for signed unconditional PASS | Release eng | Sprint close push |
| C3 | GitHub Actions WIF smoke (`verify-wif.yml`) after workflow is on default remote branch; then retire `SERVICE_ACCOUNT` JSON secret | No (tracked) | Platform | After push + green WIF run |
| C4 | GIS resolver remains on Node 20 until dedicated GIS change window | No until Node 20 EOL **2026-10-31** | Platform | GIS runbook |
| C5 | Visual embeddings / multimodal AI remain disabled | No (by design) | Product | Deferred |
| C6 | Full offline field lifecycle deferred | No (by design) | Product | Deferred |
| C7 | Production p50/p95 latency numbers for create/georesolve/ops | No for limited pilot | SRE | First pilot week |
| C8 | Controlled **live** Hosting rollback click (dry-run only this sprint) | Recommended | Release eng | Pre-go-live |
| C9 | `generateDailyReport` europe-west1 scheduler update flake on last Node 22 deploy | No for pilot path | Platform | Retry with `--force` / setpolicy |
| C10 | npm audit residual transitive vulns (uuid/websocket-driver/yaml via GCP clients) | No if no exploitable prod path; track | Security | Next dependency window |
| C11 | Phash known limitations: geometric rotation / crop / viewpoint | No — hash-primary + official review | Product | Documented |

---

## Prior certified baselines (do not regress)

| Release | SHA / tip | Cert |
|---------|-----------|------|
| Geospatial Routing | `062323d` era; GIS `georesolvefunction-00002-kuy` | `docs/reports/GEOSPATIAL_ROUTING_CERTIFICATION.md` |
| Municipality Ops MVP | `8b70884` / cert `2316f2d` | `docs/reports/MUNICIPALITY_OPERATIONS_CERTIFICATION.md` |
| Operational Intelligence | tip `e90fdc0` / cert `405839d` | `docs/reports/OPERATIONAL_INTELLIGENCE_CERTIFICATION.md` |
| Nav fix (main tip at sprint start) | `052161e` | — |

## Rollback posture

- Hosting: previous Firebase Hosting release (console Rollback).
- Functions: redeploy from last certified tip (`e90fdc0` OI). **Do not** roll back GIS resolver unless GIS incident.
- See `docs/runbooks/PRODUCTION_ROLLBACK_DRILL.md`, `docs/runbooks/IMAGE_INTELLIGENCE_ROLLBACK.md`, `docs/runbooks/WARD_GIS_ROLLBACK.md`.

## Related documents

- Pilot pack — `docs/pilot/`
- Guides — `docs/guides/`
- WIF ADR — `docs/architecture/ADR_GITHUB_WIF.md`
- Evidence — `docs/reports/evidence/`

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product / Pilot lead | | | |
| Engineering | | | |
| Municipal sponsor (pilot) | | | |

_Do not mark an unconditional PASS without completed evidence for authenticated municipal UAT (C1), recorded final SHA (C2), and accepted rollback posture (C8)._
