#!/bin/bash
set -euo pipefail

# Verify environment configuration
echo "🔍 Verifying ServeSA environment configuration..."

# Check required environment variables
PROJECT_ID=${PROJECT_ID:-}
REGION=${REGION:-africa-south1}

if [[ -z "$PROJECT_ID" ]]; then
    echo "❌ PROJECT_ID environment variable is required"
    exit 1
fi

echo "✅ Project ID: $PROJECT_ID"
echo "✅ Region: $REGION"

# Verify gcloud configuration
if ! gcloud config get-value project 2>/dev/null | grep -q "$PROJECT_ID"; then
    echo "❌ gcloud project not set to $PROJECT_ID"
    exit 1
fi

# Check enabled APIs
REQUIRED_APIS=(
    "cloudfunctions.googleapis.com"
    "firestore.googleapis.com"
    "firebase.googleapis.com"
    "cloudbuild.googleapis.com"
    "secretmanager.googleapis.com"
    "bigquery.googleapis.com"
    "maps-backend.googleapis.com"
    "recaptchaenterprise.googleapis.com"
)

echo "🔍 Checking enabled APIs..."
for api in "${REQUIRED_APIS[@]}"; do
    if ! gcloud services list --enabled --filter="name:$api" --format="value(name)" | grep -q "$api"; then
        echo "❌ API not enabled: $api"
        exit 1
    fi
done
echo "✅ All required APIs enabled"

# Check runtime service account
RUNTIME_SA="servesa-runtime@$PROJECT_ID.iam.gserviceaccount.com"
if ! gcloud iam service-accounts describe "$RUNTIME_SA" >/dev/null 2>&1; then
    echo "❌ Runtime service account not found: $RUNTIME_SA"
    exit 1
fi
echo "✅ Runtime service account exists"

# Check required IAM roles
REQUIRED_ROLES=(
    "roles/firebase.admin"
    "roles/datastore.user"
    "roles/secretmanager.secretAccessor"
    "roles/bigquery.dataViewer"
    "roles/bigquery.jobUser"
)

echo "🔍 Checking IAM roles..."
for role in "${REQUIRED_ROLES[@]}"; do
    if ! gcloud projects get-iam-policy "$PROJECT_ID" --flatten="bindings[].members" --filter="bindings.members:$RUNTIME_SA" --format="value(bindings.role)" | grep -q "$role"; then
        echo "❌ Missing IAM role: $role"
        exit 1
    fi
done
echo "✅ All required IAM roles assigned"

# Check Secret Manager secrets
REQUIRED_SECRETS=(
    "GMAIL_CLIENT_ID"
    "GMAIL_CLIENT_SECRET"
    "GMAIL_REFRESH_TOKEN"
    "MAPS_BACKEND_KEY"
    "RECAPTCHA_ENTERPRISE_KEY"
)

echo "🔍 Checking Secret Manager secrets..."
for secret in "${REQUIRED_SECRETS[@]}"; do
    if ! gcloud secrets describe "$secret" --project="$PROJECT_ID" >/dev/null 2>&1; then
        echo "❌ Secret not found: $secret"
        exit 1
    fi
done
echo "✅ All required secrets exist"

# Check Firebase Hosting site
if ! firebase hosting:sites:list --project="$PROJECT_ID" | grep -q "servesa"; then
    echo "❌ Firebase Hosting site 'servesa' not found"
    exit 1
fi
echo "✅ Firebase Hosting site exists"

echo "🎉 Environment verification completed successfully!"
