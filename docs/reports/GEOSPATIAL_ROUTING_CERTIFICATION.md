# Geospatial Routing Certification — Serve SA

| Field | Value |
|-------|-------|
| Issued (UTC) | 2026-08-05T05:05:00Z |
| Verdict | **PASS WITH CONDITIONS** |
| Project | `servesa-aad53` |
| Starting SHA | `9559297ef1c0724e3b7d053d0425cd87ca1f27de` |
| Final / deployed SHA | `01b9e4c` (tip includes index fix after `d709073` function source) |
| Branch | `main` |

## Executive summary

Authoritative Municipal Demarcation Board **Wards 2020** polygons (4 468 wards) were ingested through a governed BigQuery pipeline with provenance, staging validation, and atomic promotion. Production `createCase` now resolves unique point-in-polygon matches to official ward/municipality identifiers via `ST_COVERS`, keeps `routingPending=true` on no-match/ambiguous/infra failure, and preserves case creation. Deduplication composite indexes are **READY**. OIDC/WIF and explicit ArcGIS `licenseInfo` text remain non-blocking conditions.

## Authoritative dataset

| Field | Value |
|-------|-------|
| Publisher | Municipal Demarcation Board |
| Title | MDB Wards 2020 (`SA_Wards2020`) |
| Cycle | 2020-LGE (2021 local elections) |
| ArcGIS item | `e0223a825ea2481fa72220ad3204276b` |
| SHA-256 | `5206e877d08b428bb3136b1a41dd4fe54cd8b49a97f457764bbdd3b664b3c036` |
| GCS (private) | `gs://servesa-aad53-gis-sources/mdb/wards_2020/MDB_Wards_2020_shapefile.zip` |
| dataset_version | `mdb-wards-2020-v1` |
| Active rows | **4468** |
| Provinces / municipalities | 9 / 213 |
| Licence status | ArcGIS `licenseInfo` empty; public MDB Spatial Knowledge Hub publication; **MDB attribution required** |
| Provenance | `docs/reports/gis/WARD_DATASET_PROVENANCE.md` |
| Validation | `docs/reports/gis/ward_validation_mdb_wards_2020.json` |

Rejected for active routing: HDX COD-AB admin4 (2016-cycle / 4392 wards).

## Geometry / quality gates

- Local accept 4468 / reject 0; 4 geometries repaired via deterministic `make_valid`
- BQ: null/empty geom 0; duplicate centroids 0; bbox within SA soft bounds
- PIP sample: JHB CBD → ward `79800060` / muni `JHB` / Gauteng
- Ocean-in-bbox point → 0 covers

## Resolver

- Semantics: **`ST_COVERS`** (boundary included). Multi-cover → `ambiguous`, no arbitrary pick.
- Nearest-centroid **removed** from authoritative assignment.
- Fail-open via `georesolveSafe`.

## Production smoke (synthetic, no real PII)

| Check | Result | Evidence |
|-------|--------|----------|
| `/report` | 200 | Hosting |
| Unique PIP create | `polygon_match`, `routingPending=false` | `CASE-MSFMCCIU-JN1FTG` ward `79800060` |
| Dataset version persisted | `mdb-wards-2020-v1` | case `georesolution` |
| Idempotent retry | same caseId | same clientRequestId |
| No-match | `unresolved`, pending true | `CASE-MSFMCXRF-1QNS4Z` |
| Near-dup create + index query | ok | `CASE-MSFMDO7V-RV41BM`; category/status/createdAt query returned rows |
| Citizen ack / official alert | sent | case notifications ledger |
| Events append-only, no contact PII | ok | `case_created` + `routing_resolution` |
| Storage list unauth | 403 | Firebase Storage |
| GIS raw public | 403 | `servesa-aad53-gis-sources` |
| Reconciliation dry-run | 4 processed (3 would resolve, 1 unresolved) | Admin SDK dry-run |
| Ambiguous live point | not observed in smoke | covered by unit tests |
| Media upload | not re-run this sprint | prior cert `CASE-MSF5QQ1Y-A2M1NY` still valid baseline |

## Deployed functions (africa-south1 Gen2)

| Function | Revision | State |
|----------|----------|-------|
| createCaseFunction | `createcasefunction-00003-qem` | ACTIVE |
| georesolveFunction | `georesolvefunction-00002-kuy` | ACTIVE |
| reconcileUnresolvedRoutingFunction | `reconcileunresolvedroutingfunction-00001-hit` | ACTIVE |

Rollback target (prior createCase): `createcasefunction-00002-wif`.

## Firestore indexes

All required composites **READY**, including `cases(routingPending, createdAt)` and dedupe `cases(category, status, createdAt)` + `case_media(caseId, contentHash)`.

## Security / IAM

- Runtime compute SA has `bigquery.jobUser` + `bigquery.dataViewer` (not Owner/Editor).
- Deploy firebase-adminsdk: no Owner/Editor.
- Citizen cannot create cases or forge routing fields (Admin SDK + tightened official update rule).
- Raw GIS bucket private (public-access-prevention; HTTP 403).
- OIDC/WIF migration still outstanding — see `docs/security/OIDC_WIF_MIGRATION.md`.

## Tests

- Jest: georesolve, reconcile, createCase contract — pass
- Python local ingest unit tests — pass
- Ordinary CI does not call live production GIS

## Remaining conditions

1. **OIDC/WIF** for GitHub `SERVICE_ACCOUNT` — non-blocking hardening.
2. **ArcGIS `licenseInfo` empty** — operators should retain MDB attribution; legal confirmation of reuse terms recommended.
3. **Ambiguous boundary live smoke** — unit-tested; rare in production; no fabricated dual polygons used.

## Related paths

- ADR: `docs/architecture/ADR_WARD_GIS_SOURCING.md`
- Runbooks: `docs/runbooks/WARD_GIS_INGESTION.md`, `WARD_GIS_ROLLBACK.md`, `UNRESOLVED_CASE_RECONCILIATION.md`
- Case creation cert: `docs/reports/CASE_CREATION_PRODUCTION_CERTIFICATION.md`
- Registry: `docs/reports/DEPLOYMENT_REGISTRY.md`
