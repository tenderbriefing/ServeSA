#!/bin/bash

# ServeSA Phase-1: IAM Bootstrap
# This script creates service accounts and sets up IAM roles

set -e

PROJECT_ID="${PROJECT_ID:-servesa-aad53}"
REGION="${REGION:-africa-south1}"

echo "🔐 Setting up IAM for ServeSA..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"

# Set the project
gcloud config set project "$PROJECT_ID"

# Create service accounts
echo "👤 Creating service accounts..."

# Functions service account
gcloud iam service-accounts create servesa-functions \
  --display-name="ServeSA Cloud Functions" \
  --description="Service account for ServeSA Cloud Functions" \
  --quiet || echo "Service account servesa-functions already exists"

# Web service account
gcloud iam service-accounts create servesa-web \
  --display-name="ServeSA Web Application" \
  --description="Service account for ServeSA web application" \
  --quiet || echo "Service account servesa-web already exists"

# BigQuery service account
gcloud iam service-accounts create servesa-bigquery \
  --display-name="ServeSA BigQuery" \
  --description="Service account for ServeSA BigQuery operations" \
  --quiet || echo "Service account servesa-bigquery already exists"

# Assign IAM roles to functions service account
echo "🔑 Assigning IAM roles to servesa-functions..."

# Firestore roles
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:servesa-functions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

# Storage roles
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:servesa-functions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:servesa-functions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectCreator"

# BigQuery roles
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:servesa-functions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/bigquery.dataViewer"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:servesa-functions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/bigquery.jobUser"

# Secret Manager roles
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:servesa-functions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Pub/Sub roles
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:servesa-functions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/pubsub.publisher"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:servesa-functions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/pubsub.subscriber"

# Cloud Tasks roles
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:servesa-functions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudtasks.taskRunner"

# Assign IAM roles to web service account
echo "🔑 Assigning IAM roles to servesa-web..."

# Firestore roles (read-only for web)
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:servesa-web@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.viewer"

# Storage roles (read-only for web)
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:servesa-web@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"

# Assign IAM roles to BigQuery service account
echo "🔑 Assigning IAM roles to servesa-bigquery..."

# BigQuery admin roles
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:servesa-bigquery@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/bigquery.admin"

# Storage roles for BigQuery
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:servesa-bigquery@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"

# Create custom roles for POPIA compliance
echo "🛡️ Creating custom POPIA-compliant roles..."

# Create POPIA Data Controller role
gcloud iam roles create servesaDataController \
  --project="$PROJECT_ID" \
  --title="ServeSA Data Controller" \
  --description="Role for data controllers managing personal information" \
  --permissions="datastore.entities.get,datastore.entities.list,datastore.entities.update,datastore.entities.delete,secretmanager.secrets.get,secretmanager.versions.access" \
  --stage="GA" || echo "Role servesaDataController already exists"

# Create POPIA Data Processor role
gcloud iam roles create servesaDataProcessor \
  --project="$PROJECT_ID" \
  --title="ServeSA Data Processor" \
  --description="Role for data processors handling personal information" \
  --permissions="datastore.entities.get,datastore.entities.list,datastore.entities.create,secretmanager.versions.access" \
  --stage="GA" || echo "Role servesaDataProcessor already exists"

# Assign custom roles
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:servesa-functions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="projects/$PROJECT_ID/roles/servesaDataProcessor"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:servesa-web@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="projects/$PROJECT_ID/roles/servesaDataController"

echo "✅ IAM setup completed successfully!"
echo ""
echo "Service accounts created:"
echo "- servesa-functions@$PROJECT_ID.iam.gserviceaccount.com"
echo "- servesa-web@$PROJECT_ID.iam.gserviceaccount.com"
echo "- servesa-bigquery@$PROJECT_ID.iam.gserviceaccount.com"
echo ""
echo "Next steps:"
echo "1. Run: ./infra/scripts/03_secrets_bootstrap.sh"
echo "2. Run: ./infra/scripts/04_bq_create_geo.sh"
echo "3. Run: ./infra/scripts/05_bq_load_wards.sh"
