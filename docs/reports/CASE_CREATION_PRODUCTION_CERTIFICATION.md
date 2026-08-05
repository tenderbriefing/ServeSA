# Case Creation Production Certification

**Certification authority:** Principal Software Architect / Production Release Engineer  
**Report path:** `docs/reports/CASE_CREATION_PRODUCTION_CERTIFICATION.md`

---

## 1. Executive verdict

# PASS WITH CONDITIONS

Geospatial Routing Certification Sprint closed the prior GIS polygon and dedupe-index conditions. Authoritative MDB Wards 2020 (4 468 polygons) are loaded in `servesa-aad53.geo.wards` (`mdb-wards-2020-v1`). Production `createCase` returns unique `polygon_match` with `routingPending=false` for in-ward coordinates (smoke `CASE-MSFMCCIU-JN1FTG` → ward `79800060` / JHB), and remains fail-safe unresolved for no-match points (`CASE-MSFMCXRF-1QNS4Z`). Deduplication composites are READY. Case creation, SLA fields, idempotency, media path, and notification ledger remain production-verified.

**Remaining conditions:**
1. OIDC/WIF migration for GitHub `SERVICE_ACCOUNT` — non-blocking (`docs/security/OIDC_WIF_MIGRATION.md`).
2. MDB ArcGIS item `licenseInfo` empty — public MDB publication with required attribution; legal confirmation recommended.
3. SLA breach engine is **intentionally not deployed** (out of scope).

Full geospatial evidence: `docs/reports/GEOSPATIAL_ROUTING_CERTIFICATION.md`.

---

## 2. Certification date

- **UTC:** 2026-08-04T21:10:00Z  
- **SAST:** 2026-08-04 23:10 SAST  

## 3. Final local SHA

`01b9e4c` (Geospatial Routing Certification tip on `main`)

## 4. Deployed SHA

`01b9e4c` / functions source `d709073` — `createcasefunction-00003-qem`, `georesolvefunction-00002-kuy`.

## 5. Billing verification

| Check | Result |
|-------|--------|
| Project ID | `servesa-aad53` |
| Billing linked | Yes |
| Billing enabled | `true` |
| Firebase plan | Blaze |
| Cloud Build / Functions | No longer blocked by billing |

Full billing-account identifier omitted from this public report.

## 6. Firebase plan

**Blaze** (confirmed via project billing enablement + successful Gen2 Functions / Cloud Build usage).

## 7. Deployment service-account verification

| Check | Result |
|-------|--------|
| Secret name | `SERVICE_ACCOUNT` (GitHub Actions **secret**, not `vars`) |
| Workflows reference | `${{ secrets.SERVICE_ACCOUNT }}` in `verify-service-account.yml`, `deploy-production.yml`, `firebase-hosting-pull-request.yml` |
| CI verification run | https://github.com/tenderbriefing/ServeSA/actions/runs/30945674407 — **PASS** |
| Auth success | `auth_success=true` |
| Resolved email | `firebase-adminsdk-fbsvc@servesa-aad53.iam.gserviceaccount.com` |
| Resolved project | `servesa-aad53` |
| Disabled | false / empty |
| Key material | Never printed; CI uses `google-github-actions/auth@v2` with temp credentials + `always()` cleanup |
| `.firebaserc` | default → `servesa-aad53` |

OIDC/WIF migration documented at `docs/security/OIDC_WIF_MIGRATION.md` (non-blocking).

## 8. IAM audit result

Deployment SA (`firebase-adminsdk-fbsvc@…`) roles added for Gen2 deploy (no Owner / permanent Editor on this SA):

- `roles/cloudfunctions.admin`, `roles/run.admin`, `roles/cloudbuild.builds.editor`
- `roles/artifactregistry.writer`, `roles/iam.serviceAccountUser`, `roles/firebaserules.admin`
- `roles/storage.admin`, `roles/eventarc.admin`, `roles/pubsub.admin`
- `roles/firebasehosting.admin`, `roles/firebase.admin`, `roles/datastore.user`
- `roles/bigquery.jobUser`, `roles/bigquery.dataViewer`

Also granted Gen2 agent bindings (`pubsub.publisher` on GCS SA, `iam.serviceAccountTokenCreator` on Pub/Sub SA, `run.invoker` / `eventarc.eventReceiver` on compute SA).

`github-action-1047463008@…` retains deploy-oriented roles from earlier enablement (display name references another repo); not used by `SERVICE_ACCOUNT` secret.

## 9. Storage bucket and region

| Field | Value |
|-------|-------|
| Bucket | `servesa-aad53.firebasestorage.app` |
| Region | `AFRICA-SOUTH1` |
| Public access prevention | enforced |
| Uniform bucket-level access | enabled |
| Unauthenticated listing | HTTP 401 |
| App config bucket | `servesa-aad53.firebasestorage.app` |

## 10. Storage rules result

| Field | Value |
|-------|-------|
| Deployed ruleset | `rulesets/ffaa80b8-1070-4415-9ff0-abd4ff21457a` |
| Release | `firebase.storage/servesa-aad53.firebasestorage.app` |
| Update time | `2026-08-04T19:58:15.960521Z` |

## 11. BigQuery GIS status

| Field | Value |
|-------|-------|
| Dataset | `servesa-aad53.geo` (`africa-south1`) |
| Table | `servesa-aad53.geo.wards` |
| Row count | **0** |
| Ingestion tooling | `infra/scripts/bq_wards_ingest.sh` (validate / dry-run / MERGE; no fabrication) |
| Sample-polygon scripts | `04_bq_create_geo.sh` / `05_bq_load_wards.sh` refuse production unless `ALLOW_SAMPLE_POLYGONS=1` |
| Production georesolution cert | **CLEARED** — see GEOSPATIAL_ROUTING_CERTIFICATION.md |

## 12. Hosting release

| Field | Value |
|-------|--------|
| Site | https://servesa-aad53.web.app |
| Channel | `live` |
| Last release time | `2026-08-04 22:54:27` (local CLI clock) |
| Content | Next.js static export including `/report` (`report.html` + clean URL rewrite) |
| Legacy marketing site | Replaced |

## 13. Backend revisions

Gen2 functions in `africa-south1` (schedulers in `europe-west1` due to Cloud Scheduler location limits):

- `createCaseFunction` revision `createcasefunction-00002-wif` (post idempotency Firestore fix)
- `georesolveFunction`, `onCaseCreated`, `onCaseStatusUpdated`, `uploadMediaFunction`, `processMediaUploadFunction`, `dedupeCaseFunction`, `api`, and supporting callables — **ACTIVE**
- `slaEngineFunction` — **not deployed** (intentional)

Traffic: latest revision 100% (`allTrafficOnLatestRevision=true`).

## 14. Production case reference

Primary smoke: **`CASE-MSF4EWJK-XR0COE`**  
Media-complete smoke: **`CASE-MSF5QQ1Y-A2M1NY`**

## 15. Georesolution result

`unresolved` / `routingPending=true` / confidence `0` — expected with empty `geo.wards`. No fake municipality assigned.

## 16. SLA result

Server-generated SLA on create: `targetHours=72` for water/medium; `slaTarget` ISO timestamp persisted; `slaBreach=false` at creation.

## 17. Idempotency result

**PASS** — identical `clientRequestId` returns the same `caseId`.

## 18. Media result

**PASS** — case `CASE-MSF5QQ1Y-A2M1NY` uploaded `cert.png` with `status=completed` and a Firebase download-token URL under `cases/{caseId}/media/…`.

## 19. Notification result

**PASS** — ledger docs present for smoke case:

- `CASE-MSF4EWJK-XR0COE_citizen_ack`
- `CASE-MSF4EWJK-XR0COE_official_alert`

Atomic `case_created` event recorded under the case.

## 20. Security result

- Firestore rules remain on production ruleset `357b282c-…`
- Storage rules deployed; public listing denied; PAP enforced
- Public share stub at `/case` does not render reporter contact fields
- Municipality isolation not fully live-tested (no ward→muni assignment without polygons)
- Workflows use secrets only; OIDC migration documented

## 21. Remaining blockers

1. Load authoritative ward polygons into `servesa-aad53.geo.wards` via `bq_wards_ingest.sh`
2. Wait for Firestore composite index build; re-run advisory dedupe
3. Optional: migrate GitHub Actions to OIDC/WIF and delete long-lived JSON key
4. Do **not** start SLA breach engine until GIS conditions clear for a full PASS
5. Confirm media success on tip: done (`CASE-MSF5QQ1Y-A2M1NY`)

## 22. Updated certification report path

`docs/reports/CASE_CREATION_PRODUCTION_CERTIFICATION.md`
