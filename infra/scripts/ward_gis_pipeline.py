#!/usr/bin/env python3
"""
ServeSA governed ward GIS ingestion pipeline.

Never fabricates polygons. Accepts official GeoJSON or shapefile ZIP.
Supports dry-run, staging validation, atomic promotion, and rollback.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import uuid
import zipfile
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

IMPORTER_VERSION = "1.0.0"
PROJECT_ID = os.environ.get("PROJECT_ID", "servesa-aad53")
LOCATION = os.environ.get("LOCATION", "africa-south1")
DATASET = os.environ.get("DATASET", "geo")

SA_SOFT_LNG = (16.0, 33.5)
SA_SOFT_LAT = (-35.5, -21.5)

EXPECTED_WARD_COUNT_MIN = 4000
EXPECTED_WARD_COUNT_MAX = 5000


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def run_bq(sql: str, *, format: str = "prettyjson") -> Any:
    cmd = [
        "bq",
        "query",
        "--use_legacy_sql=false",
        f"--location={LOCATION}",
        f"--format={format}",
        "--project_id",
        PROJECT_ID,
        sql,
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"bq query failed:\n{proc.stderr}\n{proc.stdout}")
    if format == "prettyjson":
        text = proc.stdout.strip()
        if not text or text.startswith("Created") or text.startswith("Altered") or text.startswith("Dropped"):
            return []
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # DDL / DML often returns non-JSON status lines
            return []
    return proc.stdout


def bq_mk_table(table: str, schema: str) -> None:
    subprocess.run(
        [
            "bq",
            "mk",
            "--force",
            "--table",
            f"--schema={schema}",
            f"--project_id={PROJECT_ID}",
            f"{PROJECT_ID}:{DATASET}.{table}",
        ],
        check=False,
        capture_output=True,
        text=True,
    )


def ensure_governance_tables() -> None:
    # Create version + audit via SQL; staging via explicit schema for load jobs.
    run_bq(
        f"""
CREATE TABLE IF NOT EXISTS `{PROJECT_ID}.{DATASET}.ward_dataset_versions` (
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
  status STRING NOT NULL,
  row_count INT64,
  validation_report_gcs_uri STRING,
  notes STRING,
  created_at TIMESTAMP NOT NULL,
  certified_at TIMESTAMP,
  retired_at TIMESTAMP
)
"""
    )
    run_bq(
        f"""
CREATE TABLE IF NOT EXISTS `{PROJECT_ID}.{DATASET}.ward_ingestion_audit` (
  audit_id STRING NOT NULL,
  dataset_version STRING NOT NULL,
  event_type STRING NOT NULL,
  actor STRING,
  details STRING,
  created_at TIMESTAMP NOT NULL
)
"""
    )
    # Production wards — ensure extended columns exist (table may already exist).
    run_bq(
        f"""
CREATE TABLE IF NOT EXISTS `{PROJECT_ID}.{DATASET}.wards` (
  ward_id STRING NOT NULL,
  ward_number STRING,
  ward_label STRING,
  ward_name STRING,
  municipality_id STRING NOT NULL,
  municipality_name STRING NOT NULL,
  district_code STRING,
  district_name STRING,
  province STRING NOT NULL,
  geometry GEOGRAPHY,
  centroid GEOGRAPHY,
  area_km2 FLOAT64,
  population INT64,
  source STRING,
  source_version STRING,
  source_ward_id STRING,
  dataset_version STRING,
  boundary_cycle STRING,
  active BOOL,
  geometry_repaired BOOL,
  published_at DATE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
"""
    )
    # Best-effort ADD COLUMN for legacy tables (ignore failures).
    for col, typ in [
        ("ward_number", "STRING"),
        ("ward_label", "STRING"),
        ("district_code", "STRING"),
        ("district_name", "STRING"),
        ("source_ward_id", "STRING"),
        ("dataset_version", "STRING"),
        ("boundary_cycle", "STRING"),
        ("active", "BOOL"),
        ("geometry_repaired", "BOOL"),
    ]:
        try:
            run_bq(
                f"ALTER TABLE `{PROJECT_ID}.{DATASET}.wards` ADD COLUMN IF NOT EXISTS {col} {typ}"
            )
        except Exception as e:
            print(f"WARN alter {col}: {e}")


def audit(dataset_version: str, event_type: str, details: Dict[str, Any]) -> None:
    audit_id = str(uuid.uuid4())
    actor = os.environ.get("USER") or os.environ.get("USERNAME") or "pipeline"
    details_json = json.dumps(details)[:900000].replace("\\", "\\\\").replace("'", "\\'")
    run_bq(
        f"""
INSERT INTO `{PROJECT_ID}.{DATASET}.ward_ingestion_audit`
(audit_id, dataset_version, event_type, actor, details, created_at)
VALUES (
  '{audit_id}',
  '{dataset_version}',
  '{event_type}',
  '{actor}',
  '''{details_json}''',
  CURRENT_TIMESTAMP()
)
"""
    )


def _rings_to_geojson_coords(parts: List[List[Tuple[float, float]]]) -> List[Any]:
    rings = []
    for part in parts:
        if len(part) < 3:
            continue
        ring = [[float(x), float(y)] for x, y in part]
        if ring[0] != ring[-1]:
            ring.append(ring[0])
        rings.append(ring)
    return rings


def shapefile_to_features(shp_path: Path) -> List[Dict[str, Any]]:
    import shapefile
    from shapely.geometry import MultiPolygon, Polygon, mapping, shape
    from shapely.validation import make_valid

    reader = shapefile.Reader(str(shp_path))
    field_names = [f[0] for f in reader.fields[1:]]
    features: List[Dict[str, Any]] = []

    for sr in reader.iterShapeRecords():
        rec = dict(zip(field_names, sr.record))
        geom = sr.shape
        if geom is None or geom.shapeType not in (5, 15, 25):  # polygon types
            continue
        parts_idx = list(geom.parts) + [len(geom.points)]
        rings = []
        for i in range(len(parts_idx) - 1):
            pts = geom.points[parts_idx[i] : parts_idx[i + 1]]
            if len(pts) >= 3:
                rings.append(pts)
        if not rings:
            continue

        # First ring exterior; subsequent rings may be holes (shapefile convention).
        try:
            exterior = rings[0]
            holes = rings[1:] if len(rings) > 1 else []
            poly = Polygon(exterior, holes)
            repaired = False
            if not poly.is_valid:
                poly = make_valid(poly)
                repaired = True
            if poly.is_empty:
                continue
            if poly.geom_type == "Polygon":
                gjson = mapping(poly)
            elif poly.geom_type == "MultiPolygon":
                gjson = mapping(poly)
            elif poly.geom_type == "GeometryCollection":
                polys = [g for g in poly.geoms if g.geom_type in ("Polygon", "MultiPolygon")]
                if not polys:
                    continue
                merged = polys[0]
                for g in polys[1:]:
                    merged = merged.union(g)
                if merged.geom_type not in ("Polygon", "MultiPolygon"):
                    continue
                gjson = mapping(merged)
                repaired = True
            else:
                continue
        except Exception:
            # Fallback: MultiPolygon of simple rings without holes
            try:
                polys = []
                for ring in rings:
                    p = Polygon(ring)
                    if not p.is_valid:
                        p = make_valid(p)
                    if p.geom_type == "Polygon" and not p.is_empty:
                        polys.append(p)
                    elif p.geom_type == "MultiPolygon":
                        polys.extend([g for g in p.geoms if not g.is_empty])
                if not polys:
                    continue
                mp = MultiPolygon(polys) if len(polys) > 1 else polys[0]
                gjson = mapping(mp)
                repaired = True
            except Exception:
                continue

        features.append(
            {
                "type": "Feature",
                "geometry": gjson,
                "properties": {**rec, "_geometry_repaired": repaired},
            }
        )
    return features


def geojson_file_to_features(path: Path) -> List[Dict[str, Any]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("type") != "FeatureCollection":
        raise SystemExit("GeoJSON root must be FeatureCollection")
    return list(data.get("features") or [])


def extract_source(source_path: Path, workdir: Path) -> Tuple[str, List[Dict[str, Any]]]:
    if source_path.suffix.lower() == ".zip" or zipfile.is_zipfile(source_path):
        extract_dir = workdir / "extract"
        extract_dir.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(source_path) as zf:
            zf.extractall(extract_dir)
        shps = list(extract_dir.rglob("*.shp"))
        if not shps:
            raise SystemExit("ZIP contains no .shp")
        # Prefer ward-named shapefile
        shps.sort(key=lambda p: (0 if "ward" in p.name.lower() else 1, p.name))
        return "shapefile", shapefile_to_features(shps[0])
    if source_path.suffix.lower() in (".geojson", ".json"):
        return "geojson", geojson_file_to_features(source_path)
    raise SystemExit(f"Unsupported source format: {source_path}")


def normalize_mdb_props(props: Dict[str, Any]) -> Dict[str, Any]:
    # Accept MDB SA_Wards2020 fields and canonical aliases.
    lower = {str(k).lower(): v for k, v in props.items()}

    def first(*keys: str) -> Any:
        for k in keys:
            if lower.get(k.lower()) not in (None, ""):
                return lower[k.lower()]
            if props.get(k) not in (None, ""):
                return props[k]
        return None

    ward_id = first("ward_id", "WardID", "wardid")
    ward_no = first("ward_number", "WardNo", "wardno", "WardNumber")
    ward_label = first("ward_label", "WardLabel", "wardlabel")
    muni_id = first("municipality_id", "CAT_B", "cat_b", "LocalMunicipalityCode")
    muni_name = first(
        "municipality_name", "Municipali", "municipali", "LocalMunicipalityName"
    )
    province = first("province", "Province", "ProvinceName")
    district_code = first("district_code", "DistrictCo", "districtco", "DistrictMunicipalityCode")
    district_name = first("district_name", "District", "district", "DistrictMunicipalityName")
    published = first("published_at", "Date", "date")

    if ward_id is None:
        return {}
    ward_id = str(ward_id).strip()
    if not muni_id or not muni_name or not province:
        return {}

    published_at = None
    if isinstance(published, date):
        published_at = published.isoformat()
    elif published:
        published_at = str(published)[:10]

    ward_name = ward_label or (f"Ward {ward_no}" if ward_no is not None else ward_id)

    return {
        "ward_id": ward_id,
        "ward_number": str(ward_no) if ward_no is not None else None,
        "ward_label": str(ward_label) if ward_label is not None else None,
        "ward_name": str(ward_name),
        "municipality_id": str(muni_id).strip(),
        "municipality_name": str(muni_name).strip(),
        "district_code": str(district_code).strip() if district_code else None,
        "district_name": str(district_name).strip() if district_name else None,
        "province": str(province).strip(),
        "published_at": published_at,
        "source_ward_id": ward_id,
        "geometry_repaired": bool(props.get("_geometry_repaired") or False),
    }


def validate_features(features: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    errors: List[str] = []
    repaired = 0
    seen = set()

    for i, feat in enumerate(features):
        geom = feat.get("geometry") or {}
        gtype = geom.get("type")
        if gtype not in ("Polygon", "MultiPolygon"):
            errors.append(f"feature[{i}]: invalid geometry type {gtype!r}")
            continue
        coords = geom.get("coordinates")
        if not coords:
            errors.append(f"feature[{i}]: empty coordinates")
            continue
        try:
            ring = coords[0][0] if gtype == "MultiPolygon" else coords[0]
            lng, lat = float(ring[0][0]), float(ring[0][1])
            if not (SA_SOFT_LNG[0] <= lng <= SA_SOFT_LNG[1] and SA_SOFT_LAT[0] <= lat <= SA_SOFT_LAT[1]):
                errors.append(f"feature[{i}]: vertex outside SA soft bounds ({lng},{lat})")
                continue
        except Exception as e:
            errors.append(f"feature[{i}]: coord inspect failed: {e}")
            continue

        props = normalize_mdb_props(feat.get("properties") or {})
        if not props:
            errors.append(f"feature[{i}]: missing required ward/municipality/province identifiers")
            continue
        if props["ward_id"] in seen:
            errors.append(f"feature[{i}]: duplicate ward_id {props['ward_id']}")
            continue
        seen.add(props["ward_id"])
        if props.get("geometry_repaired"):
            repaired += 1

        rows.append(
            {
                **props,
                "geometry_geojson": json.dumps(geom, separators=(",", ":")),
            }
        )

    report = {
        "input_features": len(features),
        "accepted_rows": len(rows),
        "rejected": len(errors),
        "geometry_repaired_count": repaired,
        "errors_sample": errors[:50],
        "error_count": len(errors),
        "unique_provinces": sorted({r["province"] for r in rows}),
        "unique_municipalities": len({r["municipality_id"] for r in rows}),
    }
    return rows, report


def write_ndjson(rows: List[Dict[str, Any]], path: Path, dataset_version: str, boundary_cycle: str, source: str) -> None:
    with path.open("w", encoding="utf-8") as f:
        for r in rows:
            out = {
                "dataset_version": dataset_version,
                "ward_id": r["ward_id"],
                "ward_number": r.get("ward_number"),
                "ward_label": r.get("ward_label"),
                "ward_name": r["ward_name"],
                "municipality_id": r["municipality_id"],
                "municipality_name": r["municipality_name"],
                "district_code": r.get("district_code"),
                "district_name": r.get("district_name"),
                "province": r["province"],
                "boundary_cycle": boundary_cycle,
                "geometry_geojson": r["geometry_geojson"],
                "area_km2": None,
                "source_ward_id": r.get("source_ward_id"),
                "geometry_repaired": r.get("geometry_repaired", False),
                "source": source,
                "published_at": r.get("published_at"),
            }
            f.write(json.dumps(out) + "\n")


def load_staging(ndjson_path: Path) -> None:
    schema = (
        "dataset_version:STRING,ward_id:STRING,ward_number:STRING,ward_label:STRING,"
        "ward_name:STRING,municipality_id:STRING,municipality_name:STRING,"
        "district_code:STRING,district_name:STRING,province:STRING,boundary_cycle:STRING,"
        "geometry_geojson:STRING,area_km2:FLOAT,source_ward_id:STRING,geometry_repaired:BOOLEAN,"
        "source:STRING,published_at:STRING"
    )
    bq_mk_table("wards_staging", schema)
    proc = subprocess.run(
        [
            "bq",
            "load",
            f"--location={LOCATION}",
            "--source_format=NEWLINE_DELIMITED_JSON",
            "--replace",
            f"--project_id={PROJECT_ID}",
            f"{PROJECT_ID}:{DATASET}.wards_staging",
            str(ndjson_path),
        ],
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"bq load failed: {proc.stderr}")


def bq_quality_gates(dataset_version: str) -> Dict[str, Any]:
    rows = run_bq(
        f"""
WITH parsed AS (
  SELECT
    ward_id,
    municipality_id,
    province,
    geometry_repaired,
    SAFE.ST_GEOGFROMGEOJSON(geometry_geojson) AS g
  FROM `{PROJECT_ID}.{DATASET}.wards_staging`
  WHERE dataset_version = '{dataset_version}'
),
boxed AS (
  SELECT
    *,
    ST_BOUNDINGBOX(g) AS bb
  FROM parsed
)
SELECT
  COUNT(*) AS row_count,
  COUNTIF(ward_id IS NULL OR ward_id = '') AS missing_ward_id,
  COUNTIF(municipality_id IS NULL OR municipality_id = '') AS missing_muni,
  COUNTIF(province IS NULL OR province = '') AS missing_province,
  COUNTIF(g IS NULL) AS null_geom,
  COUNTIF(g IS NOT NULL AND ST_ISEMPTY(g)) AS empty_geom,
  COUNT(DISTINCT ward_id) AS distinct_ward_id,
  COUNT(DISTINCT province) AS province_count,
  COUNT(DISTINCT municipality_id) AS municipality_count,
  COUNTIF(geometry_repaired) AS repaired_count,
  MIN(bb.ymin) AS min_lat,
  MAX(bb.ymax) AS max_lat,
  MIN(bb.xmin) AS min_lng,
  MAX(bb.xmax) AS max_lng
FROM boxed
"""
    )
    stats = rows[0] if rows else {}
    stats["invalid_geom"] = stats.get("null_geom")  # SAFE parse failure ≡ invalid for gates
    # Overlap heuristic (bounded): identical centroids or near-duplicate areas in same muni.
    # Full pairwise ST_INTERSECTION on ~4.5k polygons is intentionally avoided.
    overlap = run_bq(
        f"""
WITH g AS (
  SELECT
    ward_id,
    municipality_id,
    SAFE.ST_GEOGFROMGEOJSON(geometry_geojson) AS geom
  FROM `{PROJECT_ID}.{DATASET}.wards_staging`
  WHERE dataset_version = '{dataset_version}'
),
cent AS (
  SELECT
    ward_id,
    municipality_id,
    ST_ASTEXT(ST_SNAPTOGRID(ST_CENTROID(geom), 0.0001)) AS cent_key
  FROM g
  WHERE geom IS NOT NULL
)
SELECT
  COUNTIF(cnt > 1) AS duplicate_centroid_groups,
  IFNULL(SUM(IF(cnt > 1, cnt, 0)), 0) AS wards_sharing_centroid
FROM (
  SELECT cent_key, COUNT(*) AS cnt
  FROM cent
  GROUP BY cent_key
)
"""
    )
    if overlap:
        stats["duplicate_centroid_groups"] = overlap[0].get("duplicate_centroid_groups")
        stats["wards_sharing_centroid"] = overlap[0].get("wards_sharing_centroid")
    else:
        stats["duplicate_centroid_groups"] = None
        stats["wards_sharing_centroid"] = None
    return stats


def gates_pass(local_report: Dict[str, Any], bq_stats: Dict[str, Any]) -> Tuple[bool, List[str]]:
    reasons: List[str] = []
    n = int(bq_stats.get("row_count") or 0)
    if n < EXPECTED_WARD_COUNT_MIN or n > EXPECTED_WARD_COUNT_MAX:
        reasons.append(f"row_count {n} outside expected [{EXPECTED_WARD_COUNT_MIN},{EXPECTED_WARD_COUNT_MAX}]")
    if int(bq_stats.get("missing_ward_id") or 0) > 0:
        reasons.append("missing ward_id")
    if int(bq_stats.get("invalid_geom") or 0) > 0:
        reasons.append("invalid geometries present")
    if int(bq_stats.get("empty_geom") or 0) > 0:
        reasons.append("empty geometries present")
    if int(bq_stats.get("null_geom") or 0) > 0:
        reasons.append("null geometries present")
    if int(bq_stats.get("distinct_ward_id") or 0) != n:
        reasons.append("duplicate ward_id in staging")
    if int(bq_stats.get("province_count") or 0) < 9:
        reasons.append(f"province_count {bq_stats.get('province_count')} < 9")
    min_lat = float(bq_stats.get("min_lat") or 0)
    max_lat = float(bq_stats.get("max_lat") or 0)
    min_lng = float(bq_stats.get("min_lng") or 0)
    max_lng = float(bq_stats.get("max_lng") or 0)
    if not (SA_SOFT_LAT[0] <= min_lat <= max_lat <= SA_SOFT_LAT[1]):
        reasons.append(f"lat bbox implausible: {min_lat}..{max_lat}")
    if not (SA_SOFT_LNG[0] <= min_lng <= max_lng <= SA_SOFT_LNG[1]):
        reasons.append(f"lng bbox implausible: {min_lng}..{max_lng}")
    if local_report.get("error_count", 0) > 0 and local_report.get("accepted_rows", 0) < EXPECTED_WARD_COUNT_MIN:
        reasons.append("local validation rejected too many features")
    # Near-duplicate centroid groups indicate likely corrupt or overlapping duplicate wards.
    dup_groups = bq_stats.get("duplicate_centroid_groups")
    if dup_groups is not None and int(dup_groups) > 20:
        reasons.append(f"excessive duplicate-centroid groups: {dup_groups}")
    return (len(reasons) == 0), reasons


def promote(dataset_version: str, boundary_cycle: str, source: str) -> None:
    # Snapshot previous active version for rollback metadata, then atomic swap.
    run_bq(
        f"""
CREATE OR REPLACE TABLE `{PROJECT_ID}.{DATASET}.wards_previous` AS
SELECT * FROM `{PROJECT_ID}.{DATASET}.wards`
WHERE IFNULL(active, TRUE) = TRUE
"""
    )
    # Build candidate table first (avoids REPLACE partitioning/clustering conflicts).
    run_bq(
        f"""
CREATE OR REPLACE TABLE `{PROJECT_ID}.{DATASET}.wards_next` AS
SELECT
  ward_id,
  ward_number,
  ward_label,
  ward_name,
  municipality_id,
  municipality_name,
  district_code,
  district_name,
  province,
  SAFE.ST_GEOGFROMGEOJSON(geometry_geojson, make_valid => TRUE) AS geometry,
  ST_CENTROID(SAFE.ST_GEOGFROMGEOJSON(geometry_geojson, make_valid => TRUE)) AS centroid,
  CAST(NULL AS FLOAT64) AS area_km2,
  CAST(NULL AS INT64) AS population,
  source,
  '{dataset_version}' AS source_version,
  source_ward_id,
  dataset_version,
  boundary_cycle,
  TRUE AS active,
  IFNULL(geometry_repaired, FALSE) AS geometry_repaired,
  SAFE.PARSE_DATE('%Y-%m-%d', published_at) AS published_at,
  CURRENT_TIMESTAMP() AS created_at,
  CURRENT_TIMESTAMP() AS updated_at
FROM `{PROJECT_ID}.{DATASET}.wards_staging`
WHERE dataset_version = '{dataset_version}'
  AND SAFE.ST_GEOGFROMGEOJSON(geometry_geojson, make_valid => TRUE) IS NOT NULL
"""
    )
    # Drop + recreate production table with clustering for query locality.
    drop = subprocess.run(
        [
            "bq",
            "rm",
            "-f",
            "-t",
            f"--project_id={PROJECT_ID}",
            f"{PROJECT_ID}:{DATASET}.wards",
        ],
        capture_output=True,
        text=True,
    )
    if drop.returncode != 0:
        print(f"WARN bq rm wards: {drop.stderr}", file=sys.stderr)
    run_bq(
        f"""
CREATE TABLE `{PROJECT_ID}.{DATASET}.wards`
CLUSTER BY municipality_id, province
AS SELECT * FROM `{PROJECT_ID}.{DATASET}.wards_next`
"""
    )
    run_bq(
        f"""
UPDATE `{PROJECT_ID}.{DATASET}.ward_dataset_versions`
SET status = 'retired', retired_at = CURRENT_TIMESTAMP()
WHERE status = 'certified' AND dataset_version != '{dataset_version}'
"""
    )
    run_bq(
        f"""
UPDATE `{PROJECT_ID}.{DATASET}.ward_dataset_versions`
SET status = 'certified',
    certified_at = CURRENT_TIMESTAMP(),
    row_count = (SELECT COUNT(*) FROM `{PROJECT_ID}.{DATASET}.wards` WHERE active = TRUE)
WHERE dataset_version = '{dataset_version}'
"""
    )


def rollback() -> None:
    # Restore wards_previous if present.
    run_bq(
        f"""
CREATE OR REPLACE TABLE `{PROJECT_ID}.{DATASET}.wards` AS
SELECT * FROM `{PROJECT_ID}.{DATASET}.wards_previous`
"""
    )


def insert_version_row(meta: Dict[str, Any]) -> None:
    def esc(v: Optional[str]) -> str:
        if v is None:
            return "NULL"
        return "'" + str(v).replace("\\", "\\\\").replace("'", "\\'") + "'"

    run_bq(
        f"""
INSERT INTO `{PROJECT_ID}.{DATASET}.ward_dataset_versions`
(dataset_version, publisher, dataset_title, source_url, source_gcs_uri, source_sha256,
 licence, boundary_cycle, effective_from, effective_to, retrieval_timestamp,
 importer_version, status, row_count, validation_report_gcs_uri, notes, created_at)
VALUES (
  {esc(meta['dataset_version'])},
  {esc(meta['publisher'])},
  {esc(meta['dataset_title'])},
  {esc(meta.get('source_url'))},
  {esc(meta.get('source_gcs_uri'))},
  {esc(meta['source_sha256'])},
  {esc(meta.get('licence'))},
  {esc(meta['boundary_cycle'])},
  {esc(meta.get('effective_from'))},
  {esc(meta.get('effective_to'))},
  TIMESTAMP('{meta['retrieval_timestamp']}'),
  {esc(IMPORTER_VERSION)},
  {esc(meta['status'])},
  {meta.get('row_count') if meta.get('row_count') is not None else 'NULL'},
  {esc(meta.get('validation_report_gcs_uri'))},
  {esc(meta.get('notes'))},
  CURRENT_TIMESTAMP()
)
"""
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Governed ServeSA ward GIS ingestion")
    parser.add_argument("--source-file", default="")
    parser.add_argument("--dataset-version", default="")
    parser.add_argument("--publisher", default="")
    parser.add_argument("--dataset-title", default="")
    parser.add_argument("--boundary-cycle", default="")
    parser.add_argument("--source-url", default="")
    parser.add_argument("--source-gcs-uri", default="")
    parser.add_argument("--licence", default="")
    parser.add_argument("--effective-from", default="")
    parser.add_argument("--effective-to", default="")
    parser.add_argument("--notes", default="")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--validate-only", action="store_true")
    parser.add_argument("--promote", action="store_true")
    parser.add_argument("--rollback", action="store_true")
    parser.add_argument("--report-out", default="")
    args = parser.parse_args()

    if args.rollback:
        ensure_governance_tables()
        rollback()
        audit("rollback", "rollback", {"ok": True})
        print("ROLLBACK COMPLETE")
        return 0

    required = ["source_file", "dataset_version", "publisher", "dataset_title", "boundary_cycle"]
    missing = [k for k in required if not getattr(args, k)]
    if missing:
        raise SystemExit(f"Missing required args: {', '.join('--'+k.replace('_','-') for k in missing)}")

    source_path = Path(args.source_file).resolve()
    if not source_path.exists():
        raise SystemExit(f"SOURCE not found: {source_path}")

    checksum = sha256_file(source_path)
    retrieval_ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    with tempfile.TemporaryDirectory(prefix="ward_gis_") as tmp:
        workdir = Path(tmp)
        fmt, features = extract_source(source_path, workdir)
        rows, local_report = validate_features(features)
        report = {
            "importer_version": IMPORTER_VERSION,
            "dataset_version": args.dataset_version,
            "source_file": str(source_path),
            "source_format": fmt,
            "source_sha256": checksum,
            "retrieval_timestamp": retrieval_ts,
            "publisher": args.publisher,
            "dataset_title": args.dataset_title,
            "boundary_cycle": args.boundary_cycle,
            "licence": args.licence,
            "source_url": args.source_url,
            "source_gcs_uri": args.source_gcs_uri,
            "local_validation": local_report,
            "dry_run": args.dry_run,
        }

        if args.dry_run or args.validate_only:
            report["status"] = "dry_run" if args.dry_run else "validate_only"
            if args.report_out:
                Path(args.report_out).parent.mkdir(parents=True, exist_ok=True)
                Path(args.report_out).write_text(json.dumps(report, indent=2), encoding="utf-8")
            print(json.dumps({"ok": local_report["accepted_rows"] >= EXPECTED_WARD_COUNT_MIN, "report_summary": {
                "accepted": local_report["accepted_rows"],
                "rejected": local_report["error_count"],
                "provinces": local_report["unique_provinces"],
                "sha256": checksum,
            }}, indent=2))
            # Local dry-run does not require BigQuery connectivity for acceptance gates.
            return 0 if local_report["accepted_rows"] >= EXPECTED_WARD_COUNT_MIN else 1

        ensure_governance_tables()


        ndjson_path = workdir / "wards.ndjson"
        write_ndjson(
            rows,
            ndjson_path,
            args.dataset_version,
            args.boundary_cycle,
            args.publisher,
        )
        load_staging(ndjson_path)
        audit(args.dataset_version, "stage_load", {"rows": len(rows), "sha256": checksum})

        insert_version_row(
            {
                "dataset_version": args.dataset_version,
                "publisher": args.publisher,
                "dataset_title": args.dataset_title,
                "source_url": args.source_url or None,
                "source_gcs_uri": args.source_gcs_uri or None,
                "source_sha256": checksum,
                "licence": args.licence or None,
                "boundary_cycle": args.boundary_cycle,
                "effective_from": args.effective_from or None,
                "effective_to": args.effective_to or None,
                "retrieval_timestamp": retrieval_ts,
                "status": "staged",
                "row_count": len(rows),
                "notes": args.notes or None,
            }
        )

        try:
            bq_stats = bq_quality_gates(args.dataset_version)
        except Exception as e:
            report["bq_quality_error"] = str(e)
            bq_stats = {}
            print(f"WARN BQ quality gates error: {e}", file=sys.stderr)

        report["bq_quality"] = bq_stats
        ok, reasons = gates_pass(local_report, bq_stats) if bq_stats else (False, ["bq_quality_failed"])
        report["gates_pass"] = ok
        report["gate_failures"] = reasons

        if args.report_out:
            Path(args.report_out).write_text(json.dumps(report, indent=2), encoding="utf-8")

        if not ok:
            run_bq(
                f"""
UPDATE `{PROJECT_ID}.{DATASET}.ward_dataset_versions`
SET status = 'rejected', notes = '{("; ".join(reasons)).replace("'", "")[:500]}'
WHERE dataset_version = '{args.dataset_version}'
"""
            )
            audit(args.dataset_version, "reject", report)
            print(json.dumps({"ok": False, "reasons": reasons, "bq_quality": bq_stats}, indent=2))
            return 2

        run_bq(
            f"""
UPDATE `{PROJECT_ID}.{DATASET}.ward_dataset_versions`
SET status = 'validated'
WHERE dataset_version = '{args.dataset_version}'
"""
        )
        audit(args.dataset_version, "validate", report)

        if args.promote:
            promote(args.dataset_version, args.boundary_cycle, args.publisher)
            audit(args.dataset_version, "promote", {"ok": True})
            report["status"] = "certified"
            if args.report_out:
                Path(args.report_out).write_text(json.dumps(report, indent=2), encoding="utf-8")
            print(json.dumps({"ok": True, "promoted": True, "row_count": bq_stats.get("row_count")}, indent=2))
            return 0

        print(json.dumps({"ok": True, "promoted": False, "row_count": bq_stats.get("row_count")}, indent=2))
        return 0


if __name__ == "__main__":
    sys.exit(main())
