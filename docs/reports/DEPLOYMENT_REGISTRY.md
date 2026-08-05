# Deployment Registry — Serve SA

| Field | Value |
|-------|-------|
| Updated (UTC) | 2026-08-05T05:05:00Z |
| Verdict | PASS WITH CONDITIONS (GIS routing certified; OIDC/WIF outstanding) |
| Project | servesa-aad53 |
| Branch | main |
| Deployed SHA | `01b9e4c` (functions source `d709073` + index fix) |
| Hosting | https://servesa-aad53.web.app (`/report` live) |
| Functions region | africa-south1 (Gen2); schedulers europe-west1 |
| createCase | ACTIVE `createcasefunction-00003-qem` |
| georesolve | ACTIVE `georesolvefunction-00002-kuy` |
| reconcileUnresolvedRouting | ACTIVE `reconcileunresolvedroutingfunction-00001-hit` |
| Rollback createCase | `createcasefunction-00002-wif` |
| Storage bucket | servesa-aad53.firebasestorage.app (AFRICA-SOUTH1) |
| GIS raw bucket | gs://servesa-aad53-gis-sources (private) |
| BQ dataset | servesa-aad53.geo |
| BQ active wards | 4468 (`mdb-wards-2020-v1`, cycle 2020-LGE) |
| BQ tables | wards, wards_staging, wards_next, wards_previous, ward_dataset_versions, ward_ingestion_audit |
| Firestore indexes | READY (incl. routingPending+createdAt; dedupe composites) |
| SERVICE_ACCOUNT CI | PASS (prior); OIDC/WIF deferred |
| Smoke resolved | CASE-MSFMCCIU-JN1FTG |
| Smoke unresolved | CASE-MSFMCXRF-1QNS4Z |
| Cert reports | docs/reports/GEOSPATIAL_ROUTING_CERTIFICATION.md ; docs/reports/CASE_CREATION_PRODUCTION_CERTIFICATION.md |
