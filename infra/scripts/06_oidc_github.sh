#!/usr/bin/env bash
# ServeSA: GitHub Actions OIDC + Workload Identity Federation (keyless deploy)
#
# Creates (idempotent):
#   - Workload Identity Pool:  github-actions-pool
#   - OIDC Provider:           github-oidc
#   - Deploy SA:               github-actions-deploy@PROJECT_ID.iam.gserviceaccount.com
#   - Least-privilege project roles for Firebase deploy
#   - roles/iam.workloadIdentityUser bound to this repository only
#
# Does NOT create JSON service-account keys.
# Does NOT deploy application code.
#
# Usage:
#   bash infra/scripts/06_oidc_github.sh
#   PROJECT_ID=servesa-aad53 bash infra/scripts/06_oidc_github.sh
#
# After success, set GitHub Actions variables (or secrets):
#   WORKLOAD_IDENTITY_PROVIDER=<printed provider resource name>
#   DEPLOY_SERVICE_ACCOUNT=github-actions-deploy@servesa-aad53.iam.gserviceaccount.com

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-servesa-aad53}"
POOL_NAME="${POOL_NAME:-github-actions-pool}"
PROVIDER_NAME="${PROVIDER_NAME:-github-oidc}"
SA_ID="${SA_ID:-github-actions-deploy}"
SA_EMAIL="${SA_ID}@${PROJECT_ID}.iam.gserviceaccount.com"
REPO_SLUG="${REPO_SLUG:-tenderbriefing/ServeSA}"
LOCATION="global"
ISSUER_URI="https://token.actions.githubusercontent.com"

# Attribute mapping: subject + common GitHub claims used for conditions / principalSet
ATTRIBUTE_MAPPING="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner"
ATTRIBUTE_CONDITION="assertion.repository=='${REPO_SLUG}'"

# Least-privilege roles for Firebase Functions + Hosting + Rules deploys.
# Never grant roles/owner or roles/editor.
DEPLOY_ROLES=(
  "roles/cloudfunctions.admin"
  "roles/run.admin"
  "roles/iam.serviceAccountUser"
  "roles/storage.admin"
  "roles/firebasehosting.admin"
  "roles/datastore.user"
  "roles/firebaserules.admin"
  "roles/artifactregistry.writer"
  "roles/cloudbuild.builds.editor"
)

echo "==> ServeSA GitHub WIF / OIDC setup"
echo "    PROJECT_ID=${PROJECT_ID}"
echo "    POOL_NAME=${POOL_NAME}"
echo "    PROVIDER_NAME=${PROVIDER_NAME}"
echo "    SA_EMAIL=${SA_EMAIL}"
echo "    REPO_SLUG=${REPO_SLUG}"
echo "    (no JSON keys will be created)"

gcloud config set project "${PROJECT_ID}" --quiet

echo "==> Enabling required APIs"
gcloud services enable \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  cloudresourcemanager.googleapis.com \
  sts.googleapis.com \
  --project="${PROJECT_ID}" \
  --quiet

echo "==> Workload Identity Pool: ${POOL_NAME}"
if gcloud iam workload-identity-pools describe "${POOL_NAME}" \
  --location="${LOCATION}" \
  --project="${PROJECT_ID}" \
  --format="value(name)" >/dev/null 2>&1; then
  echo "    Pool already exists"
else
  gcloud iam workload-identity-pools create "${POOL_NAME}" \
    --project="${PROJECT_ID}" \
    --location="${LOCATION}" \
    --display-name="GitHub Actions Pool" \
    --description="Workload Identity Pool for ServeSA GitHub Actions (keyless)" \
    --quiet
  echo "    Pool created"
fi

POOL_FULL_NAME=$(gcloud iam workload-identity-pools describe "${POOL_NAME}" \
  --location="${LOCATION}" \
  --project="${PROJECT_ID}" \
  --format="value(name)")

echo "==> OIDC Provider: ${PROVIDER_NAME}"
if gcloud iam workload-identity-pools providers describe "${PROVIDER_NAME}" \
  --workload-identity-pool="${POOL_NAME}" \
  --location="${LOCATION}" \
  --project="${PROJECT_ID}" \
  --format="value(name)" >/dev/null 2>&1; then
  echo "    Provider already exists — updating attribute mapping/condition"
  gcloud iam workload-identity-pools providers update-oidc "${PROVIDER_NAME}" \
    --workload-identity-pool="${POOL_NAME}" \
    --location="${LOCATION}" \
    --project="${PROJECT_ID}" \
    --issuer-uri="${ISSUER_URI}" \
    --attribute-mapping="${ATTRIBUTE_MAPPING}" \
    --attribute-condition="${ATTRIBUTE_CONDITION}" \
    --quiet || true
else
  gcloud iam workload-identity-pools providers create-oidc "${PROVIDER_NAME}" \
    --workload-identity-pool="${POOL_NAME}" \
    --location="${LOCATION}" \
    --project="${PROJECT_ID}" \
    --display-name="GitHub OIDC" \
    --issuer-uri="${ISSUER_URI}" \
    --attribute-mapping="${ATTRIBUTE_MAPPING}" \
    --attribute-condition="${ATTRIBUTE_CONDITION}" \
    --quiet
  echo "    Provider created"
fi

PROVIDER_RESOURCE_NAME=$(gcloud iam workload-identity-pools providers describe "${PROVIDER_NAME}" \
  --workload-identity-pool="${POOL_NAME}" \
  --location="${LOCATION}" \
  --project="${PROJECT_ID}" \
  --format="value(name)")

echo "==> Deploy service account: ${SA_EMAIL}"
if gcloud iam service-accounts describe "${SA_EMAIL}" \
  --project="${PROJECT_ID}" \
  --format="value(email)" >/dev/null 2>&1; then
  echo "    Service account already exists"
else
  gcloud iam service-accounts create "${SA_ID}" \
    --project="${PROJECT_ID}" \
    --display-name="GitHub Actions Deploy" \
    --description="Least-privilege SA for GitHub Actions Firebase/GCP deploys via WIF (no keys)" \
    --quiet
  echo "    Service account created"
fi

echo "==> Binding least-privilege project roles (idempotent)"
for ROLE in "${DEPLOY_ROLES[@]}"; do
  echo "    + ${ROLE}"
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="${ROLE}" \
    --condition=None \
    --quiet >/dev/null || true
done

PRINCIPAL_SET="principalSet://iam.googleapis.com/${POOL_FULL_NAME}/attribute.repository/${REPO_SLUG}"

echo "==> Binding roles/iam.workloadIdentityUser"
echo "    member=${PRINCIPAL_SET}"
gcloud iam service-accounts add-iam-policy-binding "${SA_EMAIL}" \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="${PRINCIPAL_SET}" \
  --quiet >/dev/null || true

# Explicitly refuse / avoid key creation
echo "==> Key policy: no JSON keys created by this script"
echo "    (Do not run gcloud iam service-accounts keys create for this SA.)"

cat <<EOF

================================================================================
WIF / OIDC setup complete (idempotent re-run safe)
================================================================================
PROJECT_ID:                  ${PROJECT_ID}
POOL:                        ${POOL_NAME}
PROVIDER:                    ${PROVIDER_NAME}
ATTRIBUTE_CONDITION:         ${ATTRIBUTE_CONDITION}
DEPLOY_SERVICE_ACCOUNT:      ${SA_EMAIL}
WORKLOAD_IDENTITY_PROVIDER:  ${PROVIDER_RESOURCE_NAME}

Next steps (parent / operator — do NOT commit secrets):
  1. GitHub → Settings → Variables (preferred) or Secrets:
       WORKLOAD_IDENTITY_PROVIDER = ${PROVIDER_RESOURCE_NAME}
       DEPLOY_SERVICE_ACCOUNT     = ${SA_EMAIL}
  2. Ensure org/repo allows OIDC token issuance for Actions (id-token: write).
  3. Run workflow: Verify WIF (.github/workflows/verify-wif.yml)
  4. After WIF smoke PASS, use Deploy Production (WIF preferred path).
  5. Later: disable/delete long-lived SERVICE_ACCOUNT JSON key secret.

Firebase Functions runtime for this repo: nodejs22 (engines + firebase config).
================================================================================
EOF
