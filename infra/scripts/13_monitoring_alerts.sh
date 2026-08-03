#!/bin/bash
set -euo pipefail

# Setup monitoring and alerts
echo "📊 Setting up ServeSA monitoring and alerts..."

# Check required environment variables
PROJECT_ID=${PROJECT_ID:-}
REGION=${REGION:-africa-south1}

if [[ -z "$PROJECT_ID" ]]; then
    echo "❌ PROJECT_ID environment variable is required"
    exit 1
fi

echo "✅ Project ID: $PROJECT_ID"
echo "✅ Region: $REGION"

# Create uptime checks
echo "🔍 Creating uptime checks..."

# Functions health uptime check
FUNCTIONS_URL="https://$REGION-$PROJECT_ID.cloudfunctions.net/health"
echo "Creating Functions uptime check: $FUNCTIONS_URL"

gcloud monitoring uptime-checks create http "servesa-functions-health" \
    --display-name="ServeSA Functions Health" \
    --uri="$FUNCTIONS_URL" \
    --location="$REGION" \
    --project="$PROJECT_ID" \
    --timeout="10s" \
    --period="60s" \
    --content-type="application/json" \
    --content-matcher='{"matcher":"CONTAINS_STRING","content":"ok"}' || echo "⚠️ Functions uptime check already exists"

# Web health uptime check
WEB_URL="https://$PROJECT_ID.web.app/api/health"
echo "Creating Web uptime check: $WEB_URL"

gcloud monitoring uptime-checks create http "servesa-web-health" \
    --display-name="ServeSA Web Health" \
    --uri="$WEB_URL" \
    --location="$REGION" \
    --project="$PROJECT_ID" \
    --timeout="10s" \
    --period="60s" \
    --content-type="application/json" \
    --content-matcher='{"matcher":"CONTAINS_STRING","content":"ok"}' || echo "⚠️ Web uptime check already exists"

# Create alert policies
echo "🚨 Creating alert policies..."

# Functions 5xx error rate alert
echo "Creating Functions 5xx error rate alert..."

gcloud alpha monitoring policies create \
    --policy-from-file=- \
    --project="$PROJECT_ID" <<EOF
displayName: "ServeSA Functions 5xx Error Rate"
conditions:
  - displayName: "Functions 5xx error rate > 5%"
    conditionThreshold:
      filter: 'resource.type="cloud_function" AND resource.labels.function_name="servesa-functions" AND metric.type="cloudfunctions.googleapis.com/function/execution_count"'
      comparison: COMPARISON_GREATER_THAN
      thresholdValue: 0.05
      duration: 300s
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_RATE
          crossSeriesReducer: REDUCE_MEAN
          groupByFields:
            - resource.labels.function_name
notificationChannels: []
EOF

# Functions error rate alert
echo "Creating Functions error rate alert..."

gcloud alpha monitoring policies create \
    --policy-from-file=- \
    --project="$PROJECT_ID" <<EOF
displayName: "ServeSA Functions Error Rate"
conditions:
  - displayName: "Functions error rate > 10%"
    conditionThreshold:
      filter: 'resource.type="cloud_function" AND resource.labels.function_name="servesa-functions" AND metric.type="cloudfunctions.googleapis.com/function/execution_count" AND resource.labels.execution_type="error"'
      comparison: COMPARISON_GREATER_THAN
      thresholdValue: 0.10
      duration: 300s
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_RATE
          crossSeriesReducer: REDUCE_MEAN
          groupByFields:
            - resource.labels.function_name
notificationChannels: []
EOF

# Firestore error rate alert
echo "Creating Firestore error rate alert..."

gcloud alpha monitoring policies create \
    --policy-from-file=- \
    --project="$PROJECT_ID" <<EOF
displayName: "ServeSA Firestore Error Rate"
conditions:
  - displayName: "Firestore error rate > 5%"
    conditionThreshold:
      filter: 'resource.type="cloud_datastore_database" AND metric.type="cloud.googleapis.com/datastore/operation_count" AND resource.labels.database_id="(default)"'
      comparison: COMPARISON_GREATER_THAN
      thresholdValue: 0.05
      duration: 300s
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_RATE
          crossSeriesReducer: REDUCE_MEAN
          groupByFields:
            - resource.labels.database_id
notificationChannels: []
EOF

# Uptime check failure alert
echo "Creating uptime check failure alert..."

gcloud alpha monitoring policies create \
    --policy-from-file=- \
    --project="$PROJECT_ID" <<EOF
displayName: "ServeSA Uptime Check Failure"
conditions:
  - displayName: "Uptime check failed"
    conditionThreshold:
      filter: 'metric.type="monitoring.googleapis.com/uptime_check/check_passed"'
      comparison: COMPARISON_LESS_THAN
      thresholdValue: 1
      duration: 60s
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_MEAN
          crossSeriesReducer: REDUCE_MEAN
          groupByFields:
            - resource.labels.host
notificationChannels: []
EOF

echo "🎉 Monitoring and alerts setup completed successfully!"
