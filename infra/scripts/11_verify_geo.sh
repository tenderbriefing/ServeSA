#!/bin/bash
set -euo pipefail

# Verify geo data configuration
echo "🔍 Verifying ServeSA geo data configuration..."

# Check required environment variables
PROJECT_ID=${PROJECT_ID:-}
REGION=${REGION:-africa-south1}

if [[ -z "$PROJECT_ID" ]]; then
    echo "❌ PROJECT_ID environment variable is required"
    exit 1
fi

echo "✅ Project ID: $PROJECT_ID"
echo "✅ Region: $REGION"

# Check if geo.wards table exists and has data
echo "🔍 Checking BigQuery geo.wards table..."
WARD_COUNT=$(bq query --use_legacy_sql=false --format=csv --head=0 "SELECT COUNT(*) as count FROM \`$PROJECT_ID.geo.wards\`" | tail -n 1)

if [[ -z "$WARD_COUNT" ]] || [[ "$WARD_COUNT" -eq 0 ]]; then
    echo "❌ geo.wards table is empty or does not exist"
    exit 1
fi

echo "✅ geo.wards table has $WARD_COUNT rows"

# Test ST_CONTAINS query with sample coordinates
echo "🔍 Testing georesolve functionality..."
SAMPLE_QUERY=$(cat <<EOF
SELECT 
    w.ward_name,
    w.municipality_name,
    w.province_name
FROM \`$PROJECT_ID.geo.wards\` w
WHERE ST_CONTAINS(w.geometry, ST_GEOGPOINT(28.0473, -26.2041))  -- Johannesburg coordinates
LIMIT 1
EOF
)

SAMPLE_RESULT=$(bq query --use_legacy_sql=false --format=csv --head=0 "$SAMPLE_QUERY" | tail -n 1)

if [[ -z "$SAMPLE_RESULT" ]]; then
    echo "❌ ST_CONTAINS query failed - no ward found for sample coordinates"
    exit 1
fi

echo "✅ Sample georesolve query successful: $SAMPLE_RESULT"

# Check if municipalities table exists
echo "🔍 Checking municipalities table..."
MUNI_COUNT=$(bq query --use_legacy_sql=false --format=csv --head=0 "SELECT COUNT(*) as count FROM \`$PROJECT_ID.geo.municipalities\`" | tail -n 1)

if [[ -z "$MUNI_COUNT" ]] || [[ "$MUNI_COUNT" -eq 0 ]]; then
    echo "❌ geo.municipalities table is empty or does not exist"
    exit 1
fi

echo "✅ geo.municipalities table has $MUNI_COUNT rows"

echo "🎉 Geo data verification completed successfully!"
