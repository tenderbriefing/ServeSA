-- ServeSA ward GIS governance schema (BigQuery, africa-south1)
-- Idempotent DDL for versioned, audited ward polygon ingestion.

CREATE TABLE IF NOT EXISTS `servesa-aad53.geo.ward_dataset_versions` (
  dataset_version STRING NOT NULL,
  publisher STRING NOT NULL,
  dataset_title STRING NOT NULL,
  source_url STRING,
  source_gcs_uri STRING,
  source_sha256 STRING NOT NULL,
  licence STRING,
  boundary_cycle STRING NOT NULL,
  effective_from DATE,
  effective_to DATE,
  retrieval_timestamp TIMESTAMP NOT NULL,
  importer_version STRING NOT NULL,
  status STRING NOT NULL, -- staged | validated | certified | retired | rejected
  row_count INT64,
  validation_report_gcs_uri STRING,
  notes STRING,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  certified_at TIMESTAMP,
  retired_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `servesa-aad53.geo.ward_ingestion_audit` (
  audit_id STRING NOT NULL,
  dataset_version STRING NOT NULL,
  event_type STRING NOT NULL, -- dry_run | stage_load | validate | promote | rollback | reject
  actor STRING,
  details STRING,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP()
);

CREATE TABLE IF NOT EXISTS `servesa-aad53.geo.wards_staging` (
  dataset_version STRING NOT NULL,
  ward_id STRING NOT NULL,
  ward_number STRING,
  ward_label STRING,
  ward_name STRING,
  municipality_id STRING NOT NULL,
  municipality_name STRING NOT NULL,
  district_code STRING,
  district_name STRING,
  province STRING NOT NULL,
  boundary_cycle STRING NOT NULL,
  geometry_geojson STRING NOT NULL,
  area_km2 FLOAT64,
  source_ward_id STRING,
  geometry_repaired BOOL,
  source STRING,
  published_at DATE
);

-- Production table: recreate-compatible wide schema (0 rows at first migration).
-- Prefer ALTER when table already exists with data.
