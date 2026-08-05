# Ward GIS rollback runbook

## When to use

Promote introduced corrupt geometry, wrong cycle, or incomplete national coverage.

## Procedure

1. Confirm previous snapshot exists:

```bash
bq query --use_legacy_sql=false --location=africa-south1 \
  'SELECT COUNT(*) c FROM `servesa-aad53.geo.wards_previous`'
```

2. Rollback production table from snapshot:

```bash
python3 infra/scripts/ward_gis_pipeline.py \
  --source-file /dev/null \
  --dataset-version rollback \
  --publisher n/a \
  --dataset-title n/a \
  --boundary-cycle n/a \
  --rollback
```

Or explicit SQL:

```sql
CREATE OR REPLACE TABLE `servesa-aad53.geo.wards_next` AS
SELECT * FROM `servesa-aad53.geo.wards_previous`;

-- Then drop/recreate clustered wards from wards_next (see pipeline promote).
```

3. Mark dataset versions:

```sql
UPDATE `servesa-aad53.geo.ward_dataset_versions`
SET status='retired', retired_at=CURRENT_TIMESTAMP()
WHERE status='certified';

UPDATE `servesa-aad53.geo.ward_dataset_versions`
SET status='certified'
WHERE dataset_version='<previous_version>';
```

4. Verify PIP smoke (known coordinate) and that `createCase` still fail-opens if empty.

5. Record audit event and update `docs/reports/DEPLOYMENT_REGISTRY.md`.

## Emergency empty fail-safe

If no known-good snapshot exists, do **not** invent polygons. Clear active rows and keep unresolved routing:

```sql
UPDATE `servesa-aad53.geo.wards` SET active=FALSE WHERE TRUE;
```
