#!/bin/bash

# ServeSA Phase-1: BigQuery GIS Dataset Creation
# This script creates the BigQuery GIS dataset and tables for geospatial data

set -e

PROJECT_ID="${PROJECT_ID:-servesa-aad53}"
REGION="${REGION:-africa-south1}"
DATASET_NAME="${DATASET_NAME:-geo}"

echo "🗺️ Creating BigQuery GIS dataset for ServeSA..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Dataset: $DATASET_NAME"

# Set the project
gcloud config set project "$PROJECT_ID"

# Create the geo dataset
echo "📊 Creating BigQuery dataset: $DATASET_NAME"
bq mk \
  --dataset \
  --location="$REGION" \
  --description="ServeSA geospatial data for ward resolution and analytics" \
  --labels=environment=production,project=servesa,phase=1 \
  "$PROJECT_ID:$DATASET_NAME" || echo "Dataset $DATASET_NAME already exists"

# Create wards table
echo "🏛️ Creating wards table..."
bq query \
  --use_legacy_sql=false \
  --location="$REGION" \
  --destination_table="$PROJECT_ID.$DATASET_NAME.wards" \
  --replace \
  --label=environment:production \
  --label=project:servesa \
  --label=phase:1 \
  "
  CREATE OR REPLACE TABLE \`$PROJECT_ID.$DATASET_NAME.wards\` (
    ward_id STRING NOT NULL,
    ward_name STRING NOT NULL,
    municipality_id STRING NOT NULL,
    municipality_name STRING NOT NULL,
    province STRING NOT NULL,
    geometry GEOGRAPHY NOT NULL,
    centroid GEOGRAPHY,
    area_km2 FLOAT64,
    population INT64,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
  )
  PARTITION BY DATE(created_at)
  CLUSTER BY municipality_id, province
  OPTIONS(
    description='South African ward boundaries with geospatial data',
    labels=[('environment', 'production'), ('project', 'servesa'), ('phase', '1')]
  )
  "

# Create municipalities table
echo "🏙️ Creating municipalities table..."
bq query \
  --use_legacy_sql=false \
  --location="$REGION" \
  --destination_table="$PROJECT_ID.$DATASET_NAME.municipalities" \
  --replace \
  --label=environment:production \
  --label=project:servesa \
  --label=phase:1 \
  "
  CREATE OR REPLACE TABLE \`$PROJECT_ID.$DATASET_NAME.municipalities\` (
    municipality_id STRING NOT NULL,
    municipality_name STRING NOT NULL,
    municipality_type STRING NOT NULL,
    province STRING NOT NULL,
    geometry GEOGRAPHY,
    centroid GEOGRAPHY,
    area_km2 FLOAT64,
    population INT64,
    contact_email STRING,
    contact_phone STRING,
    website STRING,
    sla_config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
  )
  PARTITION BY DATE(created_at)
  CLUSTER BY province, municipality_type
  OPTIONS(
    description='South African municipalities with contact and SLA information',
    labels=[('environment', 'production'), ('project', 'servesa'), ('phase', '1')]
  )
  "

# Create case_analytics table for de-identified aggregates
echo "📈 Creating case_analytics table..."
bq query \
  --use_legacy_sql=false \
  --location="$REGION" \
  --destination_table="$PROJECT_ID.$DATASET_NAME.case_analytics" \
  --replace \
  --label=environment:production \
  --label=project:servesa \
  --label=phase:1 \
  "
  CREATE OR REPLACE TABLE \`$PROJECT_ID.$DATASET_NAME.case_analytics\` (
    date DATE NOT NULL,
    municipality_id STRING NOT NULL,
    ward_id STRING,
    category STRING NOT NULL,
    priority STRING NOT NULL,
    status STRING NOT NULL,
    case_count INT64 NOT NULL,
    avg_response_time_hours FLOAT64,
    sla_breach_count INT64,
    total_count INT64,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
  )
  PARTITION BY date
  CLUSTER BY municipality_id, category, priority
  OPTIONS(
    description='De-identified case analytics for public reporting',
    labels=[('environment', 'production'), ('project', 'servesa'), ('phase', '1')]
  )
  "

# Create views for easier querying
echo "👁️ Creating views..."

# Ward lookup view
bq query \
  --use_legacy_sql=false \
  --location="$REGION" \
  --destination_table="$PROJECT_ID.$DATASET_NAME.v_ward_lookup" \
  --replace \
  "
  CREATE OR REPLACE VIEW \`$PROJECT_ID.$DATASET_NAME.v_ward_lookup\` AS
  SELECT 
    ward_id,
    ward_name,
    municipality_id,
    municipality_name,
    province,
    ST_CENTROID(geometry) as centroid,
    ST_AREA(geometry) / 1000000 as area_km2,
    population
  FROM \`$PROJECT_ID.$DATASET_NAME.wards\`
  WHERE geometry IS NOT NULL
  "

# Municipality summary view
bq query \
  --use_legacy_sql=false \
  --location="$REGION" \
  --destination_table="$PROJECT_ID.$DATASET_NAME.v_municipality_summary" \
  --replace \
  "
  CREATE OR REPLACE VIEW \`$PROJECT_ID.$DATASET_NAME.v_municipality_summary\` AS
  SELECT 
    m.municipality_id,
    m.municipality_name,
    m.municipality_type,
    m.province,
    m.contact_email,
    m.contact_phone,
    m.website,
    COUNT(w.ward_id) as ward_count,
    SUM(w.population) as total_population,
    AVG(w.area_km2) as avg_ward_area_km2
  FROM \`$PROJECT_ID.$DATASET_NAME.municipalities\` m
  LEFT JOIN \`$PROJECT_ID.$DATASET_NAME.wards\` w
    ON m.municipality_id = w.municipality_id
  GROUP BY 
    m.municipality_id,
    m.municipality_name,
    m.municipality_type,
    m.province,
    m.contact_email,
    m.contact_phone,
    m.website
  "

# Public analytics view (de-identified)
bq query \
  --use_legacy_sql=false \
  --location="$REGION" \
  --destination_table="$PROJECT_ID.$DATASET_NAME.v_public_analytics" \
  --replace \
  "
  CREATE OR REPLACE VIEW \`$PROJECT_ID.$DATASET_NAME.v_public_analytics\` AS
  SELECT 
    date,
    municipality_name,
    province,
    category,
    priority,
    status,
    case_count,
    avg_response_time_hours,
    sla_breach_count,
    total_count,
    ROUND(sla_breach_count / NULLIF(total_count, 0) * 100, 2) as sla_breach_percentage
  FROM \`$PROJECT_ID.$DATASET_NAME.case_analytics\` ca
  JOIN \`$PROJECT_ID.$DATASET_NAME.municipalities\` m
    ON ca.municipality_id = m.municipality_id
  WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
  "

# Create sample data for testing
echo "📝 Creating sample data..."

# Sample municipalities
bq query \
  --use_legacy_sql=false \
  --location="$REGION" \
  "
  INSERT INTO \`$PROJECT_ID.$DATASET_NAME.municipalities\` 
  (municipality_id, municipality_name, municipality_type, province, contact_email, contact_phone, website, sla_config)
  VALUES
  ('JHB001', 'City of Johannesburg', 'Metropolitan', 'Gauteng', 'info@joburg.org.za', '+27 11 375 5555', 'https://www.joburg.org.za', '{\"emergency\": 1, \"high\": 24, \"medium\": 72, \"low\": 168}'),
  ('CPT001', 'City of Cape Town', 'Metropolitan', 'Western Cape', 'info@capetown.gov.za', '+27 21 400 1111', 'https://www.capetown.gov.za', '{\"emergency\": 1, \"high\": 24, \"medium\": 72, \"low\": 168}'),
  ('DBN001', 'eThekwini Municipality', 'Metropolitan', 'KwaZulu-Natal', 'info@durban.gov.za', '+27 31 311 1111', 'https://www.durban.gov.za', '{\"emergency\": 1, \"high\": 24, \"medium\": 72, \"low\": 168}'),
  ('PTA001', 'City of Tshwane', 'Metropolitan', 'Gauteng', 'info@tshwane.gov.za', '+27 12 358 9999', 'https://www.tshwane.gov.za', '{\"emergency\": 1, \"high\": 24, \"medium\": 72, \"low\": 168}'),
  ('PE001', 'Nelson Mandela Bay', 'Metropolitan', 'Eastern Cape', 'info@mandelametro.gov.za', '+27 41 501 9111', 'https://www.mandelametro.gov.za', '{\"emergency\": 1, \"high\": 24, \"medium\": 72, \"low\": 168}')
  " || echo "Sample municipalities already exist"

# Sample wards (with simplified geometries)
bq query \
  --use_legacy_sql=false \
  --location="$REGION" \
  "
  INSERT INTO \`$PROJECT_ID.$DATASET_NAME.wards\` 
  (ward_id, ward_name, municipality_id, municipality_name, province, geometry, centroid, area_km2, population)
  VALUES
  ('JHB001_W001', 'Ward 1 - Johannesburg Central', 'JHB001', 'City of Johannesburg', 'Gauteng', ST_GEOGFROMTEXT('POLYGON((28.0 -26.2, 28.1 -26.2, 28.1 -26.3, 28.0 -26.3, 28.0 -26.2))'), ST_GEOGFROMTEXT('POINT(28.05 -26.25)'), 2.5, 15000),
  ('JHB001_W002', 'Ward 2 - Sandton', 'JHB001', 'City of Johannesburg', 'Gauteng', ST_GEOGFROMTEXT('POLYGON((28.1 -26.0, 28.2 -26.0, 28.2 -26.1, 28.1 -26.1, 28.1 -26.0))'), ST_GEOGFROMTEXT('POINT(28.15 -26.05)'), 3.2, 18000),
  ('CPT001_W001', 'Ward 1 - Cape Town Central', 'CPT001', 'City of Cape Town', 'Western Cape', ST_GEOGFROMTEXT('POLYGON((18.4 -33.9, 18.5 -33.9, 18.5 -34.0, 18.4 -34.0, 18.4 -33.9))'), ST_GEOGFROMTEXT('POINT(18.45 -33.95)'), 1.8, 12000),
  ('CPT001_W002', 'Ward 2 - Sea Point', 'CPT001', 'City of Cape Town', 'Western Cape', ST_GEOGFROMTEXT('POLYGON((18.3 -33.9, 18.4 -33.9, 18.4 -34.0, 18.3 -34.0, 18.3 -33.9))'), ST_GEOGFROMTEXT('POINT(18.35 -33.95)'), 2.1, 14000),
  ('DBN001_W001', 'Ward 1 - Durban Central', 'DBN001', 'eThekwini Municipality', 'KwaZulu-Natal', ST_GEOGFROMTEXT('POLYGON((31.0 -29.8, 31.1 -29.8, 31.1 -29.9, 31.0 -29.9, 31.0 -29.8))'), ST_GEOGFROMTEXT('POINT(31.05 -29.85)'), 2.8, 16000)
  " || echo "Sample wards already exist"

# Sample analytics data
bq query \
  --use_legacy_sql=false \
  --location="$REGION" \
  "
  INSERT INTO \`$PROJECT_ID.$DATASET_NAME.case_analytics\` 
  (date, municipality_id, ward_id, category, priority, status, case_count, avg_response_time_hours, sla_breach_count, total_count)
  VALUES
  (CURRENT_DATE(), 'JHB001', 'JHB001_W001', 'water', 'high', 'resolved', 5, 18.5, 1, 5),
  (CURRENT_DATE(), 'JHB001', 'JHB001_W002', 'electricity', 'medium', 'in_progress', 3, 48.0, 0, 3),
  (CURRENT_DATE(), 'CPT001', 'CPT001_W001', 'roads', 'low', 'acknowledged', 2, 72.0, 0, 2),
  (CURRENT_DATE(), 'DBN001', 'DBN001_W001', 'waste', 'high', 'resolved', 4, 22.0, 1, 4),
  (DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY), 'JHB001', 'JHB001_W001', 'water', 'medium', 'resolved', 3, 60.0, 0, 3)
  " || echo "Sample analytics already exist"

echo "✅ BigQuery GIS dataset setup completed successfully!"
echo ""
echo "Dataset: $PROJECT_ID.$DATASET_NAME"
echo "Tables created:"
echo "- wards"
echo "- municipalities"
echo "- case_analytics"
echo ""
echo "Views created:"
echo "- v_ward_lookup"
echo "- v_municipality_summary"
echo "- v_public_analytics"
echo ""
echo "Next steps:"
echo "1. Run: ./infra/scripts/05_bq_load_wards.sh (to load real ward data)"
echo "2. Run: ./infra/scripts/06_oidc_github.sh"
echo "3. Deploy Cloud Functions with georesolve functionality"
