# Runbook: GIS runtime rollback (Node revision)

## Purpose

Roll back `georesolveFunction` to the protected prior revision if a Node 22 (or later) runtime cutover misbehaves — **without** changing ward polygons or SQL semantics.

## Protected rollback target

| Field | Value |
|-------|-------|
| Revision | `georesolvefunction-00002-kuy` |
| Runtime (known-good) | `nodejs20` |
| Dataset | `mdb-wards-2020-v1` |
| Region | `africa-south1` |

## Procedure

1. Confirm incident is GIS-runtime related (errors, wrong status classes, latency) — not a Hosting-only issue.

2. Route 100% traffic to prior Cloud Run revision:

```bash
gcloud run services update-traffic georesolvefunction \
  --region=africa-south1 \
  --project=servesa-aad53 \
  --to-revisions=georesolvefunction-00002-kuy=100
```

3. Smoke unique JHB + unresolved fixtures.

4. If traffic shift is insufficient, redeploy from the git SHA that built `…-00002-kuy` **only if** that SHA is known and still builds; prefer traffic shift to retained revision.

5. Record incident, revision before/after, and smoke in `DEPLOYMENT_REGISTRY.md`.

## Do not

- Reload or replace MDB polygons during runtime rollback
- Switch to nearest-centroid or image→municipality
- Delete revision `…-00002-kuy`

## Related

- `docs/runbooks/GIS_NODE22_MIGRATION.md`
- `docs/runbooks/WARD_GIS_ROLLBACK.md`
