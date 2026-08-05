# Operational Intelligence Certification

**Verdict: PASS WITH CONDITIONS**  
**Release:** Serve SA Operational Intelligence and Field Productivity Release  
**Date (UTC):** 2026-08-05  
**Project:** `servesa-aad53`  
**Starting SHA (verified):** `2316f2d4704e154d10af4ecf277f8833dc4c907f`  
**GIS resolver revision (unchanged):** `georesolvefunction-00002-kuy`  
**Dataset:** `mdb-wards-2020-v1` (4468 wards, ST_COVERS)

## Scope delivered

| Capability | Status |
|---|---|
| Mandatory image on `/report` | Deployed (UI + media.required contract) |
| Server content hash + phash pipeline | Deployed (hash-primary; phash when Storage readable) |
| Multi-signal scoring policy 1.0.0 | Unit tested + smoke |
| No auto-merge; official link/dismiss | Smoke verified |
| Smart Work Queue `/ops` | Deployed + callable smoke |
| Supervisor board `/ops/supervisor` | Deployed + callable smoke |
| Operations map `/ops/map` | Deployed + callable smoke (15 features JHB) |
| Field mode `/field` | Deployed (offline drafts; lifecycle online-only) |
| Citizen timeline + confirm/reopen | Smoke: citizen_confirmed + reopen → acknowledged |
| Incident link model | Smoke linked cases preserved |

## Production revisions (africa-south1)

| Function | Revision (at cert) |
|---|---|
| createCaseFunction | createcasefunction-00005-goh |
| uploadMediaFunction | uploadmediafunction-00003-hip (+ scoring redeploy pending/complete) |
| georesolveFunction | georesolvefunction-00002-kuy (**unchanged**) |
| reviewDuplicateFunction | reviewduplicatefunction-00001-xal |
| listSmartWorkQueueFunction | listsmartworkqueuefunction-00001-nof |
| listMapCasesFunction | listmapcasesfunction-00001-mih |

Hosting: https://servesa-aad53.web.app — `/report` `/ops` `/ops/map` `/ops/supervisor` `/field` `/case` → HTTP 200

## Smoke references (synthetic)

| Role | Case ID |
|---|---|
| Primary linked | CASE-MSFZ5GAE-H8KDCP |
| Linked support | CASE-MSFZ5H52-79EE5V |
| Distant exact-hash | CASE-MSFZ5HB9-FZ9EKM |
| Prior ops baseline | CASE-MSFN98YW-0TQWX7 |

Exact content hash used in smoke (synthetic 1×1 JPEG):  
`8aeb0dbcd3509f5c6ce42888d6bd03bfa0b7a15c4892abbe85172c2372febaa0`

## Evidence notes

- Image intelligence completed with stored SHA-256 when local ADC lacked `storage.objects.get` (Cloud Functions runtime retains bucket access).
- Exact nearby duplicate → high_confidence recommendation; official link audited; no auto-merge.
- Cross-municipality link denied (CPT → JHB).
- Citizen confirm exercised to `citizen_confirmed`; reopen exercised to `acknowledged`.
- Scoring unit tests: 5/5 passed.
- Functions + web production build succeeded before deploy.

## Conditions (non-blocking)

1. Advanced visual embeddings / multimodal AI **disabled** (deterministic hash path only).
2. Full offline field lifecycle deferred — drafts + cached jobs only.
3. Local ADC cannot download Storage objects for phash smoke; production Functions SA path remains the runtime path.
4. Interactive official browser UAT and pilot municipality acceptance outstanding.
5. OIDC/WIF outstanding (carried from prior certs).
6. Node 20 runtime deprecation warning from Firebase CLI (upgrade before 2026-10-31).

## Protected constraints verified

- GIS resolver not redeployed / not weakened.
- Department routing still gated on authoritative GIS (unchanged createCase path).
- Image intelligence does not write GIS fields.
- Cases never auto-merged.

## Rollback

- Hosting: previous Hosting release prior to this deploy.
- Functions: redeploy from SHA `2316f2d` tip for createCase/uploadMedia; delete new OI callables if required.
- Do not roll back `georesolvefunction-00002-kuy` unless GIS incident.
- See `docs/runbooks/IMAGE_INTELLIGENCE_ROLLBACK.md`.
