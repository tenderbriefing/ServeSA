#!/bin/bash

# ServeSA Phase-1: Secrets Bootstrap
# This script creates secrets in Secret Manager for sensitive configuration

set -e

PROJECT_ID="${PROJECT_ID:-servesa-aad53}"
REGION="${REGION:-africa-south1}"

echo "🔐 Setting up Secret Manager for ServeSA..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"

# Set the project
gcloud config set project "$PROJECT_ID"

# Create secrets
echo "🗝️ Creating secrets..."

# Gmail API credentials
echo "📧 Creating Gmail API secret..."
echo "Please provide your Gmail API service account key JSON content:"
read -p "Gmail API Key (or press Enter to skip): " GMAIL_API_KEY

if [ -n "$GMAIL_API_KEY" ]; then
  echo "$GMAIL_API_KEY" | gcloud secrets create servesa-gmail-api-key \
    --data-file=- \
    --replication-policy="automatic" \
    --quiet || echo "Secret servesa-gmail-api-key already exists"
else
  echo "Skipping Gmail API key creation"
fi

# Google Maps API key
echo "🗺️ Creating Google Maps API secret..."
read -p "Google Maps API Key (or press Enter to skip): " MAPS_API_KEY

if [ -n "$MAPS_API_KEY" ]; then
  echo "$MAPS_API_KEY" | gcloud secrets create servesa-maps-api-key \
    --data-file=- \
    --replication-policy="automatic" \
    --quiet || echo "Secret servesa-maps-api-key already exists"
else
  echo "Skipping Google Maps API key creation"
fi

# reCAPTCHA Enterprise key
echo "🤖 Creating reCAPTCHA Enterprise secret..."
read -p "reCAPTCHA Enterprise Site Key (or press Enter to skip): " RECAPTCHA_SITE_KEY

if [ -n "$RECAPTCHA_SITE_KEY" ]; then
  echo "$RECAPTCHA_SITE_KEY" | gcloud secrets create servesa-recaptcha-site-key \
    --data-file=- \
    --replication-policy="automatic" \
    --quiet || echo "Secret servesa-recaptcha-site-key already exists"
else
  echo "Skipping reCAPTCHA Enterprise key creation"
fi

# reCAPTCHA Enterprise secret key
read -p "reCAPTCHA Enterprise Secret Key (or press Enter to skip): " RECAPTCHA_SECRET_KEY

if [ -n "$RECAPTCHA_SECRET_KEY" ]; then
  echo "$RECAPTCHA_SECRET_KEY" | gcloud secrets create servesa-recaptcha-secret-key \
    --data-file=- \
    --replication-policy="automatic" \
    --quiet || echo "Secret servesa-recaptcha-secret-key already exists"
else
  echo "Skipping reCAPTCHA Enterprise secret key creation"
fi

# Firebase Admin SDK key
echo "🔥 Creating Firebase Admin SDK secret..."
read -p "Firebase Admin SDK Key (or press Enter to skip): " FIREBASE_ADMIN_KEY

if [ -n "$FIREBASE_ADMIN_KEY" ]; then
  echo "$FIREBASE_ADMIN_KEY" | gcloud secrets create servesa-firebase-admin-key \
    --data-file=- \
    --replication-policy="automatic" \
    --quiet || echo "Secret servesa-firebase-admin-key already exists"
else
  echo "Skipping Firebase Admin SDK key creation"
fi

# JWT signing key
echo "🔑 Creating JWT signing key..."
JWT_SECRET=$(openssl rand -base64 32)
echo "$JWT_SECRET" | gcloud secrets create servesa-jwt-secret \
  --data-file=- \
  --replication-policy="automatic" \
  --quiet || echo "Secret servesa-jwt-secret already exists"

# Database connection string (for future use)
echo "🗄️ Creating database connection secret..."
read -p "Database Connection String (or press Enter to skip): " DB_CONNECTION_STRING

if [ -n "$DB_CONNECTION_STRING" ]; then
  echo "$DB_CONNECTION_STRING" | gcloud secrets create servesa-db-connection \
    --data-file=- \
    --replication-policy="automatic" \
    --quiet || echo "Secret servesa-db-connection already exists"
else
  echo "Skipping database connection string creation"
fi

# Email configuration
echo "📧 Creating email configuration secret..."
read -p "SMTP Host (or press Enter to skip): " SMTP_HOST
read -p "SMTP Port (or press Enter to skip): " SMTP_PORT
read -p "SMTP Username (or press Enter to skip): " SMTP_USERNAME
read -p "SMTP Password (or press Enter to skip): " SMTP_PASSWORD

if [ -n "$SMTP_HOST" ] && [ -n "$SMTP_PORT" ] && [ -n "$SMTP_USERNAME" ] && [ -n "$SMTP_PASSWORD" ]; then
  cat << EOF | gcloud secrets create servesa-smtp-config \
    --data-file=- \
    --replication-policy="automatic" \
    --quiet || echo "Secret servesa-smtp-config already exists"
{
  "host": "$SMTP_HOST",
  "port": "$SMTP_PORT",
  "username": "$SMTP_USERNAME",
  "password": "$SMTP_PASSWORD"
}
EOF
else
  echo "Skipping SMTP configuration creation"
fi

# Create a default configuration secret
echo "⚙️ Creating default configuration secret..."
cat << EOF | gcloud secrets create servesa-default-config \
  --data-file=- \
  --replication-policy="automatic" \
  --quiet || echo "Secret servesa-default-config already exists"
{
  "projectId": "$PROJECT_ID",
  "region": "$REGION",
  "environment": "production",
  "popiaCompliance": true,
  "dataRetentionDays": 2555,
  "maxFileSizeMB": 10,
  "allowedFileTypes": ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  "slaDefaults": {
    "emergency": 1,
    "high": 24,
    "medium": 72,
    "low": 168
  }
}
EOF

# Grant access to service accounts
echo "🔐 Granting secret access to service accounts..."

# Functions service account
gcloud secrets add-iam-policy-binding servesa-gmail-api-key \
  --member="serviceAccount:servesa-functions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --quiet || echo "IAM policy already set for servesa-gmail-api-key"

gcloud secrets add-iam-policy-binding servesa-maps-api-key \
  --member="serviceAccount:servesa-functions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --quiet || echo "IAM policy already set for servesa-maps-api-key"

gcloud secrets add-iam-policy-binding servesa-recaptcha-secret-key \
  --member="serviceAccount:servesa-functions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --quiet || echo "IAM policy already set for servesa-recaptcha-secret-key"

gcloud secrets add-iam-policy-binding servesa-firebase-admin-key \
  --member="serviceAccount:servesa-functions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --quiet || echo "IAM policy already set for servesa-firebase-admin-key"

gcloud secrets add-iam-policy-binding servesa-jwt-secret \
  --member="serviceAccount:servesa-functions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --quiet || echo "IAM policy already set for servesa-jwt-secret"

gcloud secrets add-iam-policy-binding servesa-default-config \
  --member="serviceAccount:servesa-functions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --quiet || echo "IAM policy already set for servesa-default-config"

# Web service account (limited access)
gcloud secrets add-iam-policy-binding servesa-recaptcha-site-key \
  --member="serviceAccount:servesa-web@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --quiet || echo "IAM policy already set for servesa-recaptcha-site-key"

gcloud secrets add-iam-policy-binding servesa-maps-api-key \
  --member="serviceAccount:servesa-web@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --quiet || echo "IAM policy already set for servesa-maps-api-key"

echo "✅ Secret Manager setup completed successfully!"
echo ""
echo "Secrets created:"
echo "- servesa-gmail-api-key"
echo "- servesa-maps-api-key"
echo "- servesa-recaptcha-site-key"
echo "- servesa-recaptcha-secret-key"
echo "- servesa-firebase-admin-key"
echo "- servesa-jwt-secret"
echo "- servesa-default-config"
echo ""
echo "Next steps:"
echo "1. Run: ./infra/scripts/04_bq_create_geo.sh"
echo "2. Run: ./infra/scripts/05_bq_load_wards.sh"
echo "3. Run: ./infra/scripts/06_oidc_github.sh"
