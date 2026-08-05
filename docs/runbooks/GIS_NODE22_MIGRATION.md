# Runbook: GIS Function Node 22 migration

## Purpose

Migrate **only** `georesolveFunction` runtime from Node 20 → Node 22 with **zero semantic change**.

## Protected invariants

| Item | Must remain |
|------|-------------|
| Dataset | `mdb-wards-2020-v1` |
| Table | `servesa-aad53.geo.wards` |
| Predicate | `ST_COVERS` |
| Match behaviour | unique / ambiguous / unresolved |
| Routing authority | polygon match — no nearest-centroid, no image→muni |
| Region | `africa-south1` |
| Prior revision | **`georesolvefunction-00002-kuy` retained as rollback** |

## Assessment checklist

- [ ] `apps/functions` `engines.node` / `infra/firebase.json` runtime = `nodejs22`
- [ ] BigQuery client compatible
- [ ] Unit tests (`georesolve.test.ts`) PASS
- [ ] Source-load / build PASS
- [ ] No SQL or match-logic diff vs certified revision

## Deploy

```bash
# From verified main SHA — GIS function only
firebase deploy --only functions:georesolveFunction --project servesa-aad53
```

Confirm:

```bash
gcloud functions describe georesolveFunction --v2 \
  --region=africa-south1 --project=servesa-aad53 \
  --format='yaml(buildConfig.runtime,serviceConfig.revision)'
```

Expect `runtime: nodejs22` and a **new** revision; keep `…-00002-kuy` available.

## Smoke (controlled coordinates)

1. Unique JHB point → `polygon_match`, ward + muni correct, `mdb-wards-2020-v1`
2. No-match → `unresolved`
3. Ambiguous fixture if available
4. Case create still fail-open if resolver errors
5. Department routing remains post-GIS

## Rollback

See `docs/runbooks/GIS_RUNTIME_ROLLBACK.md`.

## Related

- `docs/runbooks/WARD_GIS_ROLLBACK.md`
- `docs/runbooks/NODE_RUNTIME_UPGRADE.md`
- `docs/reports/GEOSPATIAL_ROUTING_CERTIFICATION.md`
