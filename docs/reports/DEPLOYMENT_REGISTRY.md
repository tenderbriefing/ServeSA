# Deployment Registry — Serve SA

| Field | Value |
|-------|-------|
| Updated (UTC) | 2026-08-05T15:00:00Z |
| Verdict | **PASS WITH CONDITIONS** (Pilot Municipality Readiness + Production Hardening) |
| Project | servesa-aad53 |
| Branch | `cert/pilot-readiness-hardening` |
| Starting SHA | `052161e67519757a57bda5db58d36c1626d7a755` |
| Deployed SHA (functions Node 22 selective) | `eff734bbe6a2710638fb4da4a554d277ad31126c` (cert tip; functions built/deployed from this branch with engines.node=22; Hosting not redeployed this sprint) |
| Hosting | https://servesa-aad53.web.app (`/report`, `/ops`, `/ops/map`, `/ops/supervisor`, `/field`, `/case`) — Hosting tip still prior release unless redeployed |
| Functions region | africa-south1 (Gen2) |
| GIS dataset | mdb-wards-2020-v1 (4468 wards, ST_COVERS) |
| GIS resolver revision | **georesolvefunction-00002-kuy** (nodejs20 — **unchanged**) |
| createCase | createcasefunction-00006-nek (nodejs22) |
| uploadMedia | uploadmediafunction-00005-hak (nodejs22) |
| runImageIntelligence | runimageintelligencefunction-00003-vet (nodejs22) |
| reviewDuplicate | reviewduplicatefunction-00002-gox (nodejs22) |
| listSmartWorkQueue | listsmartworkqueuefunction-00002-vam (nodejs22) |
| Cert | docs/reports/PILOT_READINESS_CERTIFICATION.md |
| Rollback tip | Hosting prior; functions prior revisions; GIS stay `…-00002-kuy` |

## Registry entries

| Date (UTC) | Release | Branch | Starting SHA | Deployed SHA | GIS rev | Notes / cert |
|------------|---------|--------|--------------|--------------|---------|--------------|
| 2026-08-05 | **Pilot readiness hardening** | `cert/pilot-readiness-hardening` | `052161e` | `eff734b` | `georesolvefunction-00002-kuy` (**unchanged**) | Node 22 selective (excl. GIS); WIF pool live; Playwright 11 pass / 5 skip; storage qa/phash-fixtures; smoke 30/30 |
| 2026-08-05 | Operational Intelligence + Field Productivity | main | `2316f2d` | `e90fdc0` | `georesolvefunction-00002-kuy` | Cert tip `405839d` |
| 2026-08-05 | Municipality Ops MVP | main | — | `8b70884` / cert `2316f2d` | unchanged | `/ops` lifecycle |
| 2026-08-05 | Geospatial Routing | main | — | `062323d` | `georesolvefunction-00002-kuy` | mdb-wards-2020-v1 |

## Deploy rule

Production deploys **only** from a verified SHA recorded in this registry after review. Do not deploy speculative or unreviewed tips. GIS resolver must not change unless a GIS incident runbook authorises it.

## Known residual from Node 22 selective deploy

- `generateDailyReport(europe-west1)` scheduler update failed (Cloud Scheduler request). Non-pilot-critical scheduled report. Retry with `--force` or scheduler IAM when convenient.
- Artifact cleanup policy warning for europe-west1 (billing hygiene).
