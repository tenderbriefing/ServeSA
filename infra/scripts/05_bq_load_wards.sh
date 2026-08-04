#!/bin/bash

# ServeSA Phase-1: BigQuery Ward Data Loader
# This script loads real ward GeoJSON data into BigQuery
#
# DEPRECATED for production: use infra/scripts/bq_wards_ingest.sh instead.
# This script fabricates sample GeoJSON when files are missing — that is forbidden
# for production georesolution certification.

set -e

PROJECT_ID="${PROJECT_ID:-servesa-aad53}"
REGION="${REGION:-africa-south1}"
DATASET_NAME="${DATASET_NAME:-geo}"
WARD_DATA_DIR="${WARD_DATA_DIR:-./data/wards}"

if [[ "${ALLOW_SAMPLE_POLYGONS:-0}" != "1" && "${1:-}" != "--allow-sample-polygons" ]]; then
  echo "Refusing to run: missing files would be replaced with fabricated polygons."
  echo "Use: SOURCE_FILE=... ./infra/scripts/bq_wards_ingest.sh"
  exit 2
fi

echo "🗺️ Loading ward data into BigQuery for ServeSA..."echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Dataset: $DATASET_NAME"
echo "Data directory: $WARD_DATA_DIR"

# Set the project
gcloud config set project "$PROJECT_ID"

# Create data directory if it doesn't exist
mkdir -p "$WARD_DATA_DIR"

# Function to download ward data if not present
download_ward_data() {
  local province="$1"
  local filename="$WARD_DATA_DIR/${province}_wards.geojson"
  
  if [ ! -f "$filename" ]; then
    echo "📥 Downloading ward data for $province..."
    
    # Note: In a real implementation, you would download from the official source
    # For Phase-1, we'll create sample data
    cat > "$filename" << EOF
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "WARD_ID": "${province}_001",
        "WARD_NAME": "Ward 1 - ${province} Central",
        "MUNICIPALITY_ID": "${province}_MUNI_001",
        "MUNICIPALITY_NAME": "City of ${province}",
        "PROVINCE": "${province}",
        "AREA_KM2": 2.5,
        "POPULATION": 15000
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[28.0, -26.2], [28.1, -26.2], [28.1, -26.3], [28.0, -26.3], [28.0, -26.2]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "WARD_ID": "${province}_002",
        "WARD_NAME": "Ward 2 - ${province} Suburb",
        "MUNICIPALITY_ID": "${province}_MUNI_001",
        "MUNICIPALITY_NAME": "City of ${province}",
        "PROVINCE": "${province}",
        "AREA_KM2": 3.2,
        "POPULATION": 18000
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[28.1, -26.0], [28.2, -26.0], [28.2, -26.1], [28.1, -26.1], [28.1, -26.0]]]
      }
    }
  ]
}
EOF
    echo "✅ Created sample ward data for $province"
  else
    echo "✅ Ward data for $province already exists"
  fi
}

# Download ward data for major provinces
echo "📥 Preparing ward data..."
download_ward_data "Gauteng"
download_ward_data "Western_Cape"
download_ward_data "KwaZulu_Natal"
download_ward_data "Eastern_Cape"
download_ward_data "Free_State"
download_ward_data "Mpumalanga"
download_ward_data "Limpopo"
download_ward_data "North_West"
download_ward_data "Northern_Cape"

# Create a temporary table for loading
echo "📊 Creating temporary loading table..."
bq query \
  --use_legacy_sql=false \
  --location="$REGION" \
  --destination_table="$PROJECT_ID.$DATASET_NAME.wards_temp" \
  --replace \
  "
  CREATE OR REPLACE TABLE \`$PROJECT_ID.$DATASET_NAME.wards_temp\` (
    ward_id STRING,
    ward_name STRING,
    municipality_id STRING,
    municipality_name STRING,
    province STRING,
    geometry GEOGRAPHY,
    area_km2 FLOAT64,
    population INT64
  )
  "

# Load data from each province
for province_file in "$WARD_DATA_DIR"/*_wards.geojson; do
  if [ -f "$province_file" ]; then
    province=$(basename "$province_file" _wards.geojson)
    echo "📤 Loading ward data for $province..."
    
    # Load GeoJSON into BigQuery
    bq load \
      --source_format=NEWLINE_DELIMITED_JSON \
      --autodetect \
      --location="$REGION" \
      "$PROJECT_ID.$DATASET_NAME.wards_temp" \
      "$province_file" \
      geometry:GEOGRAPHY,properties:RECORD
    
    echo "✅ Loaded ward data for $province"
  fi
done

# Transform and insert into main wards table
echo "🔄 Transforming and inserting ward data..."
bq query \
  --use_legacy_sql=false \
  --location="$REGION" \
  "
  INSERT INTO \`$PROJECT_ID.$DATASET_NAME.wards\` 
  (ward_id, ward_name, municipality_id, municipality_name, province, geometry, centroid, area_km2, population)
  SELECT 
    properties.WARD_ID as ward_id,
    properties.WARD_NAME as ward_name,
    properties.MUNICIPALITY_ID as municipality_id,
    properties.MUNICIPALITY_NAME as municipality_name,
    properties.PROVINCE as province,
    geometry,
    ST_CENTROID(geometry) as centroid,
    properties.AREA_KM2 as area_km2,
    properties.POPULATION as population
  FROM \`$PROJECT_ID.$DATASET_NAME.wards_temp\`
  WHERE geometry IS NOT NULL
  "

# Clean up temporary table
echo "🧹 Cleaning up temporary table..."
bq rm -f "$PROJECT_ID.$DATASET_NAME.wards_temp"

# Update municipality table with ward counts
echo "📈 Updating municipality statistics..."
bq query \
  --use_legacy_sql=false \
  --location="$REGION" \
  "
  UPDATE \`$PROJECT_ID.$DATASET_NAME.municipalities\` m
  SET 
    area_km2 = (
      SELECT SUM(w.area_km2) 
      FROM \`$PROJECT_ID.$DATASET_NAME.wards\` w 
      WHERE w.municipality_id = m.municipality_id
    ),
    population = (
      SELECT SUM(w.population) 
      FROM \`$PROJECT_ID.$DATASET_NAME.wards\` w 
      WHERE w.municipality_id = m.municipality_id
    ),
    updated_at = CURRENT_TIMESTAMP()
  WHERE EXISTS (
    SELECT 1 FROM \`$PROJECT_ID.$DATASET_NAME.wards\` w 
    WHERE w.municipality_id = m.municipality_id
  )
  "

# Create indexes for better performance
echo "⚡ Creating performance indexes..."
bq query \
  --use_legacy_sql=false \
  --location="$REGION" \
  "
  CREATE OR REPLACE TABLE \`$PROJECT_ID.$DATASET_NAME.wards\` 
  PARTITION BY DATE(created_at)
  CLUSTER BY municipality_id, province, ward_id
  AS SELECT * FROM \`$PROJECT_ID.$DATASET_NAME.wards\`
  "

# Validate the data
echo "✅ Validating loaded data..."
bq query \
  --use_legacy_sql=false \
  --location="$REGION" \
  --format=table \
  "
  SELECT 
    COUNT(*) as total_wards,
    COUNT(DISTINCT municipality_id) as total_municipalities,
    COUNT(DISTINCT province) as total_provinces,
    AVG(area_km2) as avg_ward_area_km2,
    AVG(population) as avg_ward_population
  FROM \`$PROJECT_ID.$DATASET_NAME.wards\`
  "

# Create a summary report
echo "📋 Creating data summary..."
bq query \
  --use_legacy_sql=false \
  --location="$REGION" \
  --format=table \
  "
  SELECT 
    province,
    COUNT(*) as ward_count,
    COUNT(DISTINCT municipality_id) as municipality_count,
    SUM(population) as total_population,
    AVG(area_km2) as avg_ward_area_km2
  FROM \`$PROJECT_ID.$DATASET_NAME.wards\`
  GROUP BY province
  ORDER BY total_population DESC
  "

echo "✅ Ward data loading completed successfully!"
echo ""
echo "Summary:"
echo "- Ward data loaded from: $WARD_DATA_DIR"
echo "- Dataset: $PROJECT_ID.$DATASET_NAME"
echo "- Table: wards"
echo ""
echo "Next steps:"
echo "1. Run: ./infra/scripts/06_oidc_github.sh"
echo "2. Deploy Cloud Functions with georesolve functionality"
echo "3. Test ward resolution with sample coordinates"
echo ""
echo "Note: This script loaded sample data. For production, replace with real MDB ward GeoJSON files."
