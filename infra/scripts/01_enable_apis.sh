#!/bin/bash

# ServeSA Phase-1: Enable Google Cloud APIs
# This script enables all required APIs for the ServeSA platform

set -e

PROJECT_ID="${PROJECT_ID:-servesa-aad53}"
REGION="${REGION:-africa-south1}"

echo "🚀 Enabling Google Cloud APIs for ServeSA..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"

# Set the project
gcloud config set project "$PROJECT_ID"

# Core APIs
echo "📡 Enabling core APIs..."
gcloud services enable \
  cloudresourcemanager.googleapis.com \
  iam.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  run.googleapis.com

# Firebase APIs
echo "🔥 Enabling Firebase APIs..."
gcloud services enable \
  firebase.googleapis.com \
  firestore.googleapis.com \
  firebasehosting.googleapis.com \
  firebasestorage.googleapis.com \
  firebaseappcheck.googleapis.com \
  identitytoolkit.googleapis.com

# BigQuery APIs
echo "📊 Enabling BigQuery APIs..."
gcloud services enable \
  bigquery.googleapis.com \
  bigqueryconnection.googleapis.com \
  bigquerydatatransfer.googleapis.com \
  bigquerymigration.googleapis.com \
  bigqueryreservation.googleapis.com \
  bigquerystorage.googleapis.com

# Maps & Geospatial APIs
echo "🗺️ Enabling Maps & Geospatial APIs..."
gcloud services enable \
  maps-backend.googleapis.com \
  geocoding-backend.googleapis.com \
  places-backend.googleapis.com \
  static-maps-backend.googleapis.com \
  street-view-backend.googleapis.com

# AI/ML APIs
echo "🤖 Enabling AI/ML APIs..."
gcloud services enable \
  aiplatform.googleapis.com \
  vision.googleapis.com \
  language.googleapis.com \
  speech.googleapis.com \
  translate.googleapis.com

# Communication APIs
echo "📧 Enabling Communication APIs..."
gcloud services enable \
  gmail.googleapis.com \
  gmail-api.googleapis.com \
  pubsub.googleapis.com \
  cloudtasks.googleapis.com \
  cloudscheduler.googleapis.com

# Analytics APIs
echo "📈 Enabling Analytics APIs..."
gcloud services enable \
  analytics.googleapis.com \
  analyticsdata.googleapis.com \
  analyticsadmin.googleapis.com \
  analyticsreporting.googleapis.com

# Security APIs
echo "🔒 Enabling Security APIs..."
gcloud services enable \
  recaptchaenterprise.googleapis.com \
  safebrowsing.googleapis.com \
  websecurityscanner.googleapis.com

# Monitoring & Logging
echo "📋 Enabling Monitoring & Logging APIs..."
gcloud services enable \
  logging.googleapis.com \
  monitoring.googleapis.com \
  errorreporting.googleapis.com \
  trace.googleapis.com \
  profiler.googleapis.com

# Compute APIs
echo "💻 Enabling Compute APIs..."
gcloud services enable \
  compute.googleapis.com \
  cloudfunctions.googleapis.com \
  cloudfunctions.googleapis.com \
  artifactregistry.googleapis.com \
  containerregistry.googleapis.com

echo "✅ All APIs enabled successfully!"
echo ""
echo "Next steps:"
echo "1. Run: ./infra/scripts/02_iam_bootstrap.sh"
echo "2. Run: ./infra/scripts/03_secrets_bootstrap.sh"
echo "3. Run: ./infra/scripts/04_bq_create_geo.sh"
echo ""
echo "Note: Some APIs may take a few minutes to fully activate."
