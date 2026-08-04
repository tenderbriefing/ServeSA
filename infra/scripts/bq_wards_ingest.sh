#!/usr/bin/env bash
# Governed BigQuery wards ingestion for ServeSA.
# Does NOT fabricate ward polygons. Loads only validated GeoJSON FeatureCollections.
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-servesa-aad53}"
LOCATION="${LOCATION:-africa-south1}"
DATASET="${DATASET:-geo}"
TABLE="${TABLE:-wards}"
SOURCE_FILE="${SOURCE_FILE:-}"
DRY_RUN="${DRY_RUN:-0}"
VALIDATE_ONLY="${VALIDATE_ONLY:-0}"

usage() {
  cat <<'EOF'
Usage:
  SOURCE_FILE=path/to/wards.geojson ./infra/scripts/bq_wards_ingest.sh
  DRY_RUN=1 SOURCE_FILE=... ./infra/scripts/bq_wards_ingest.sh
  VALIDATE_ONLY=1 SOURCE_FILE=... ./infra/scripts/bq_wards_ingest.sh

Accepted source format:
  GeoJSON FeatureCollection. Each feature MUST include:
    geometry: Polygon or MultiPolygon (WGS84, coordinates as [lng, lat])
    properties:
      ward_id | WARD_ID (string, required)
      ward_name | WARD_NAME (string, required)
      municipality_id | MUNICIPALITY_ID (string, required)
      municipality_name | MUNICIPALITY_NAME (string, required)
      province | PROVINCE (string, required)
      area_km2 | AREA_KM2 (optional number)
      population | POPULATION (optional integer)
      source | SOURCE (optional string)
      source_version | SOURCE_VERSION (optional string)
      published_at | PUBLISHED_AT (optional ISO date)

Authoritative national ward boundaries are typically published by the
Municipal Demarcation Board (MDB) / Stats SA. Do not invent polygons.
EOF
}

if [[ -z "${SOURCE_FILE}" ]]; then
  usage
  exit 2
fi

if [[ ! -f "${SOURCE_FILE}" ]]; then
  echo "ERROR: SOURCE_FILE not found: ${SOURCE_FILE}" >&2
  exit 1
fi

python3 - <<'PY' "${SOURCE_FILE}"
import json, sys
path = sys.argv[1]
with open(path, encoding='utf-8') as f:
    data = json.load(f)
if data.get('type') != 'FeatureCollection':
    raise SystemExit('INVALID: root type must be FeatureCollection')
features = data.get('features') or []
if not features:
    raise SystemExit('INVALID: FeatureCollection has zero features')
required_props = ('ward_id', 'ward_name', 'municipality_id', 'municipality_name', 'province')
errors = []
for i, feat in enumerate(features):
    if feat.get('type') != 'Feature':
        errors.append(f'feature[{i}]: not a Feature')
        continue
    geom = feat.get('geometry') or {}
    gtype = geom.get('type')
    if gtype not in ('Polygon', 'MultiPolygon'):
        errors.append(f'feature[{i}]: geometry.type must be Polygon|MultiPolygon, got {gtype!r}')
    coords = geom.get('coordinates')
    if not coords:
        errors.append(f'feature[{i}]: empty coordinates')
    else:
        # Spot-check first ring first point looks like lng,lat (lng in [-180,180], lat in [-90,90])
        try:
            ring = coords[0][0] if gtype == 'MultiPolygon' else coords[0]
            lng, lat = ring[0][0], ring[0][1]
            if not (-180 <= float(lng) <= 180 and -90 <= float(lat) <= 90):
                errors.append(f'feature[{i}]: coordinate out of range (expected [lng,lat])')
            # SA soft check — warn only
            if not (16 <= float(lng) <= 33 and -35 <= float(lat) <= -22):
                print(f'WARN feature[{i}]: first vertex outside SA soft bounds lng={lng} lat={lat}')
        except Exception as e:
            errors.append(f'feature[{i}]: cannot inspect coordinates: {e}')
    props = feat.get('properties') or {}
    # normalise keys
    norm = {str(k).lower(): v for k, v in props.items()}
    for key in required_props:
        if norm.get(key) in (None, ''):
            alt = key.upper()
            if props.get(alt) in (None, ''):
                errors.append(f'feature[{i}]: missing property {key}')
if errors:
    print('VALIDATION FAILED:')
    for e in errors[:50]:
        print(' -', e)
    if len(errors) > 50:
        print(f' ... and {len(errors)-50} more')
    raise SystemExit(1)
print(f'VALIDATION OK: {len(features)} features')
PY

if [[ "${VALIDATE_ONLY}" == "1" ]]; then
  echo "VALIDATE_ONLY=1 — skipping load"
  exit 0
fi

if [[ "${DRY_RUN}" == "1" ]]; then
  echo "DRY_RUN=1 — would load ${SOURCE_FILE} into ${PROJECT_ID}.${DATASET}.${TABLE} at ${LOCATION}"
  echo "bq load --source_format=NEWLINE_DELIMITED_JSON --location=${LOCATION} ..."
  exit 0
fi

# Convert FeatureCollection to NDJSON rows for BigQuery GEOGRAPHY load via staging SQL
TMP_DIR="$(mktemp -d)"
cleanup() { rm -rf "${TMP_DIR}"; }
trap cleanup EXIT

python3 - <<'PY' "${SOURCE_FILE}" "${TMP_DIR}/wards.ndjson"
import json, sys
src, out = sys.argv[1], sys.argv[2]
data = json.load(open(src, encoding='utf-8'))
with open(out, 'w', encoding='utf-8') as f:
    for feat in data['features']:
        props = {str(k).lower(): v for k, v in (feat.get('properties') or {}).items()}
        # also accept UPPER
        raw = feat.get('properties') or {}
        def p(*keys):
            for k in keys:
                if props.get(k) not in (None, ''):
                    return props[k]
                if raw.get(k.upper()) not in (None, ''):
                    return raw[k.upper()]
            return None
        row = {
            'ward_id': str(p('ward_id')),
            'ward_name': str(p('ward_name')),
            'municipality_id': str(p('municipality_id')),
            'municipality_name': str(p('municipality_name')),
            'province': str(p('province')),
            'geometry_geojson': json.dumps(feat['geometry']),
            'area_km2': p('area_km2'),
            'population': p('population'),
            'source': p('source') or 'operator_provided',
            'source_version': p('source_version'),
            'published_at': p('published_at'),
        }
        f.write(json.dumps(row) + '\n')
print('wrote', out)
PY

bq mk --force --table \
  --schema 'ward_id:STRING,ward_name:STRING,municipality_id:STRING,municipality_name:STRING,province:STRING,geometry_geojson:STRING,area_km2:FLOAT,population:INTEGER,source:STRING,source_version:STRING,published_at:STRING' \
  "${PROJECT_ID}:${DATASET}.wards_staging" >/dev/null

bq load --location="${LOCATION}" --source_format=NEWLINE_DELIMITED_JSON --replace \
  "${PROJECT_ID}:${DATASET}.wards_staging" "${TMP_DIR}/wards.ndjson"

bq query --use_legacy_sql=false --location="${LOCATION}" \
  --parameter=src::STRING \
  "
  MERGE \`${PROJECT_ID}.${DATASET}.${TABLE}\` T
  USING (
    SELECT
      ward_id,
      ward_name,
      municipality_id,
      municipality_name,
      province,
      ST_GEOGFROMGEOJSON(geometry_geojson) AS geometry,
      ST_CENTROID(ST_GEOGFROMGEOJSON(geometry_geojson)) AS centroid,
      area_km2,
      population,
      source,
      source_version,
      SAFE.PARSE_DATE('%Y-%m-%d', published_at) AS published_at
    FROM \`${PROJECT_ID}.${DATASET}.wards_staging\`
    WHERE ST_ISVALID(ST_GEOGFROMGEOJSON(geometry_geojson))
  ) S
  ON T.ward_id = S.ward_id
  WHEN MATCHED THEN UPDATE SET
    ward_name = S.ward_name,
    municipality_id = S.municipality_id,
    municipality_name = S.municipality_name,
    province = S.province,
    geometry = S.geometry,
    centroid = S.centroid,
    area_km2 = S.area_km2,
    population = S.population,
    source = S.source,
    source_version = S.source_version,
    published_at = S.published_at,
    updated_at = CURRENT_TIMESTAMP()
  WHEN NOT MATCHED THEN INSERT
    (ward_id, ward_name, municipality_id, municipality_name, province, geometry, centroid, area_km2, population, source, source_version, published_at)
    VALUES
    (S.ward_id, S.ward_name, S.municipality_id, S.municipality_name, S.province, S.geometry, S.centroid, S.area_km2, S.population, S.source, S.source_version, S.published_at)
  "

bq query --use_legacy_sql=false --location="${LOCATION}" --format=pretty \
  "SELECT COUNT(*) AS wards,
          COUNTIF(NOT ST_ISVALID(geometry)) AS invalid_geom,
          COUNT(DISTINCT municipality_id) AS municipalities
   FROM \`${PROJECT_ID}.${DATASET}.${TABLE}\`"

bq rm -f -t "${PROJECT_ID}:${DATASET}.wards_staging" >/dev/null || true
echo "INGEST COMPLETE"
