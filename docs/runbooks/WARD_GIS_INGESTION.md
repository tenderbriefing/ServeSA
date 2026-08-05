# Ward GIS ingestion runbook

## Prerequisites

- `gcloud` / `bq` authenticated to `servesa-aad53`
- Python 3 with `pyshp` and `shapely`
- Source file: official GeoJSON FeatureCollection or shapefile ZIP
- Raw source uploaded to private `gs://servesa-aad53-gis-sources/...` (not public)

## Dry run (local validation only)

```bash
python3 infra/scripts/ward_gis_pipeline.py \
  --source-file path/to/wards.zip \
  --dataset-version mdb-wards-YYYY-vN \
  --publisher "Municipal Demarcation Board" \
  --dataset-title "MDB Wards YYYY" \
  --boundary-cycle "YYYY-LGE" \
  --source-url "https://..." \
  --source-gcs-uri "gs://servesa-aad53-gis-sources/..." \
  --licence "..." \
  --dry-run \
  --report-out docs/reports/gis/ward_validation_dryrun.json
```

## Stage + validate + promote

```bash
python3 infra/scripts/ward_gis_pipeline.py \
  --source-file path/to/wards.zip \
  --dataset-version mdb-wards-YYYY-vN \
  --publisher "Municipal Demarcation Board" \
  --dataset-title "MDB Wards YYYY" \
  --boundary-cycle "YYYY-LGE" \
  --source-url "https://..." \
  --source-gcs-uri "gs://servesa-aad53-gis-sources/..." \
  --licence "..." \
  --promote \
  --report-out docs/reports/gis/ward_validation.json
```

## Quality gates (must pass)

- Row count in 4000–5000 for national wards
- No missing ward/municipality/province ids
- All geometries parse via `SAFE.ST_GEOGFROMGEOJSON`
- Nine provinces; bbox within SA soft bounds
- No excessive duplicate centroids

## Tables

- `geo.ward_dataset_versions`
- `geo.wards_staging`
- `geo.wards` (active certified)
- `geo.wards_next` / `geo.wards_previous` (swap/rollback)
- `geo.ward_ingestion_audit`
