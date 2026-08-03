#!/bin/bash

# ServeSA Phase-1: GitHub OIDC Setup
# This script sets up Workload Identity Federation for GitHub Actions

set -e

PROJECT_ID="${PROJECT_ID:-servesa-aad53}"
REGION="${REGION:-africa-south1}"
POOL_NAME="${POOL_NAME:-servesa-github-pool}"
PROVIDER_NAME="${PROVIDER_NAME:-servesa-github-provider}"
SERVICE_ACCOUNT="${SERVICE_ACCOUNT:-servesa-functions@$PROJECT_ID.iam.gserviceaccount.com}"

echo "🔐 Setting up GitHub OIDC for ServeSA..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Pool: $POOL_NAME"
echo "Provider: $PROVIDER_NAME"
echo "Service Account: $SERVICE_ACCOUNT"

# Set the project
gcloud config set project "$PROJECT_ID"

# Enable IAM API if not already enabled
echo "📡 Enabling IAM API..."
gcloud services enable iam.googleapis.com

# Create Workload Identity Pool
echo "🏊 Creating Workload Identity Pool..."
gcloud iam workload-identity-pools create "$POOL_NAME" \
  --location="global" \
  --display-name="ServeSA GitHub Actions Pool" \
  --description="Workload Identity Pool for ServeSA GitHub Actions" \
  --quiet || echo "Pool $POOL_NAME already exists"

# Get the pool ID
POOL_ID=$(gcloud iam workload-identity-pools describe "$POOL_NAME" \
  --location="global" \
  --format="value(name)")

echo "Pool ID: $POOL_ID"

# Create Workload Identity Provider
echo "🔑 Creating Workload Identity Provider..."
gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_NAME" \
  --workload-identity-pool="$POOL_NAME" \
  --location="global" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='your-org/servesa'" \
  --quiet || echo "Provider $PROVIDER_NAME already exists"

# Get the provider resource name
PROVIDER_RESOURCE_NAME=$(gcloud iam workload-identity-pools providers describe "$PROVIDER_NAME" \
  --workload-identity-pool="$POOL_NAME" \
  --location="global" \
  --format="value(name)")

echo "Provider Resource Name: $PROVIDER_RESOURCE_NAME"

# Allow the provider to impersonate the service account
echo "🔗 Allowing provider to impersonate service account..."
gcloud iam service-accounts add-iam-policy-binding "$SERVICE_ACCOUNT" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/$POOL_ID/attribute.repository/your-org/servesa" \
  --quiet || echo "IAM binding already exists"

# Create additional service accounts for different environments
echo "👥 Creating environment-specific service accounts..."

# Development service account
gcloud iam service-accounts create servesa-dev \
  --display-name="ServeSA Development" \
  --description="Service account for ServeSA development environment" \
  --quiet || echo "Service account servesa-dev already exists"

# Production service account
gcloud iam service-accounts create servesa-prod \
  --display-name="ServeSA Production" \
  --description="Service account for ServeSA production environment" \
  --quiet || echo "Service account servesa-prod already exists"

# Assign roles to development service account
echo "🔑 Assigning roles to development service account..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:servesa-dev@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:servesa-dev@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:servesa-dev@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudfunctions.developer"

# Assign roles to production service account
echo "🔑 Assigning roles to production service account..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:servesa-prod@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:servesa-prod@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:servesa-prod@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudfunctions.developer"

# Allow GitHub Actions to impersonate environment-specific service accounts
echo "🔗 Setting up environment-specific impersonation..."

# Development environment
gcloud iam service-accounts add-iam-policy-binding "servesa-dev@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/$POOL_ID/attribute.repository/your-org/servesa" \
  --quiet || echo "Development IAM binding already exists"

# Production environment
gcloud iam service-accounts add-iam-policy-binding "servesa-prod@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/$POOL_ID/attribute.repository/your-org/servesa" \
  --quiet || echo "Production IAM binding already exists"

# Create Cloud Build trigger configuration
echo "🏗️ Creating Cloud Build configuration..."
mkdir -p infra/cloudbuild

cat > infra/cloudbuild/cloudbuild.yaml << EOF
steps:
  # Build and test web application
  - name: 'gcr.io/cloud-builders/npm'
    args: ['install']
    dir: 'apps/web'
    
  - name: 'gcr.io/cloud-builders/npm'
    args: ['run', 'build']
    dir: 'apps/web'
    
  - name: 'gcr.io/cloud-builders/npm'
    args: ['run', 'test']
    dir: 'apps/web'
    
  # Build and test functions
  - name: 'gcr.io/cloud-builders/npm'
    args: ['install']
    dir: 'apps/functions'
    
  - name: 'gcr.io/cloud-builders/npm'
    args: ['run', 'build']
    dir: 'apps/functions'
    
  - name: 'gcr.io/cloud-builders/npm'
    args: ['run', 'test']
    dir: 'apps/functions'
    
  # Deploy functions
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    args:
      - gcloud
      - functions
      - deploy
      - servesa-api
      - --gen2
      - --runtime=nodejs20
      - --region=$REGION
      - --source=apps/functions
      - --entry-point=api
      - --trigger-http
      - --allow-unauthenticated
      - --service-account=$SERVICE_ACCOUNT
      - --set-env-vars=PROJECT_ID=$PROJECT_ID,REGION=$REGION
      
  # Deploy web application (if using Cloud Run)
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    args:
      - gcloud
      - run
      - deploy
      - servesa-web
      - --image=gcr.io/\$PROJECT_ID/servesa-web
      - --region=$REGION
      - --platform=managed
      - --allow-unauthenticated
      - --service-account=$SERVICE_ACCOUNT
      - --set-env-vars=PROJECT_ID=$PROJECT_ID,REGION=$REGION

images:
  - 'gcr.io/\$PROJECT_ID/servesa-web'

options:
  logging: CLOUD_LOGGING_ONLY
  machineType: 'E2_HIGHCPU_8'
EOF

# Create GitHub Actions workflow
echo "🔄 Creating GitHub Actions workflow..."
mkdir -p infra/github/workflows

cat > infra/github/workflows/deploy.yml << EOF
name: Deploy ServeSA

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  PROJECT_ID: $PROJECT_ID
  REGION: $REGION
  POOL_ID: $POOL_ID
  PROVIDER_ID: $PROVIDER_RESOURCE_NAME

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: |
          npm install
          cd apps/web && npm install
          cd ../functions && npm install
          
      - name: Run tests
        run: |
          npm run test
          cd apps/web && npm run test
          cd ../functions && npm run test
          
      - name: Build applications
        run: |
          npm run build
          cd apps/web && npm run build
          cd ../functions && npm run build

  deploy-dev:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: development
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Google Auth
        id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: \${{ env.PROVIDER_ID }}
          service_account: servesa-dev@\${{ env.PROJECT_ID }}.iam.gserviceaccount.com
          
      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v2
        
      - name: Deploy to Development
        run: |
          gcloud config set project \${{ env.PROJECT_ID }}
          
          # Deploy functions
          cd apps/functions
          gcloud functions deploy servesa-api-dev \\
            --gen2 \\
            --runtime=nodejs20 \\
            --region=\${{ env.REGION }} \\
            --source=. \\
            --entry-point=api \\
            --trigger-http \\
            --allow-unauthenticated \\
            --service-account=servesa-dev@\${{ env.PROJECT_ID }}.iam.gserviceaccount.com \\
            --set-env-vars=PROJECT_ID=\${{ env.PROJECT_ID }},REGION=\${{ env.REGION }},ENVIRONMENT=development
          
          # Deploy web app
          cd ../web
          gcloud run deploy servesa-web-dev \\
            --image=gcr.io/\${{ env.PROJECT_ID }}/servesa-web-dev \\
            --region=\${{ env.REGION }} \\
            --platform=managed \\
            --allow-unauthenticated \\
            --service-account=servesa-dev@\${{ env.PROJECT_ID }}.iam.gserviceaccount.com \\
            --set-env-vars=PROJECT_ID=\${{ env.PROJECT_ID }},REGION=\${{ env.REGION }},ENVIRONMENT=development

  deploy-prod:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Google Auth
        id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: \${{ env.PROVIDER_ID }}
          service_account: servesa-prod@\${{ env.PROJECT_ID }}.iam.gserviceaccount.com
          
      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v2
        
      - name: Deploy to Production
        run: |
          gcloud config set project \${{ env.PROJECT_ID }}
          
          # Deploy functions
          cd apps/functions
          gcloud functions deploy servesa-api \\
            --gen2 \\
            --runtime=nodejs20 \\
            --region=\${{ env.REGION }} \\
            --source=. \\
            --entry-point=api \\
            --trigger-http \\
            --allow-unauthenticated \\
            --service-account=servesa-prod@\${{ env.PROJECT_ID }}.iam.gserviceaccount.com \\
            --set-env-vars=PROJECT_ID=\${{ env.PROJECT_ID }},REGION=\${{ env.REGION }},ENVIRONMENT=production
          
          # Deploy web app
          cd ../web
          gcloud run deploy servesa-web \\
            --image=gcr.io/\${{ env.PROJECT_ID }}/servesa-web \\
            --region=\${{ env.REGION }} \\
            --platform=managed \\
            --allow-unauthenticated \\
            --service-account=servesa-prod@\${{ env.PROJECT_ID }}.iam.gserviceaccount.com \\
            --set-env-vars=PROJECT_ID=\${{ env.PROJECT_ID }},REGION=\${{ env.REGION }},ENVIRONMENT=production
EOF

# Create GitHub repository secrets documentation
echo "📝 Creating GitHub secrets documentation..."
cat > infra/github/SECRETS.md << EOF
# GitHub Repository Secrets

This document lists the secrets that need to be configured in your GitHub repository for ServeSA deployment.

## Required Secrets

### Google Cloud Configuration
- \`GOOGLE_CLOUD_PROJECT\`: Your Google Cloud project ID (e.g., \`servesa-aad53\`)
- \`GOOGLE_CLOUD_REGION\`: Your Google Cloud region (e.g., \`africa-south1\`)

### Workload Identity Federation
The following values are automatically configured by the OIDC setup script:

- \`WORKLOAD_IDENTITY_PROVIDER\`: $PROVIDER_RESOURCE_NAME
- \`WORKLOAD_IDENTITY_POOL_ID\`: $POOL_ID

### Environment-Specific Service Accounts
- \`DEV_SERVICE_ACCOUNT\`: servesa-dev@$PROJECT_ID.iam.gserviceaccount.com
- \`PROD_SERVICE_ACCOUNT\`: servesa-prod@$PROJECT_ID.iam.gserviceaccount.com

## Setup Instructions

1. Go to your GitHub repository settings
2. Navigate to "Secrets and variables" > "Actions"
3. Add the secrets listed above
4. Ensure your repository name matches the attribute condition in the OIDC provider

## Security Notes

- Never commit secrets to the repository
- Use Workload Identity Federation instead of service account keys
- Rotate secrets regularly
- Monitor access logs for unusual activity
EOF

echo "✅ GitHub OIDC setup completed successfully!"
echo ""
echo "Configuration Summary:"
echo "- Workload Identity Pool: $POOL_NAME"
echo "- Provider: $PROVIDER_NAME"
echo "- Pool ID: $POOL_ID"
echo "- Provider Resource Name: $PROVIDER_RESOURCE_NAME"
echo ""
echo "Service Accounts Created:"
echo "- servesa-dev@$PROJECT_ID.iam.gserviceaccount.com"
echo "- servesa-prod@$PROJECT_ID.iam.gserviceaccount.com"
echo ""
echo "Files Created:"
echo "- infra/cloudbuild/cloudbuild.yaml"
echo "- infra/github/workflows/deploy.yml"
echo "- infra/github/SECRETS.md"
echo ""
echo "Next steps:"
echo "1. Update the repository name in the OIDC provider attribute condition"
echo "2. Configure GitHub repository secrets (see infra/github/SECRETS.md)"
echo "3. Push code to trigger the first deployment"
echo "4. Test the deployment pipeline"
echo ""
echo "Note: Update 'your-org/servesa' in the attribute condition to match your actual repository."
