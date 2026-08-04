# OIDC / Workload Identity Federation migration (security improvement)

## Status

Production enablement currently authenticates GitHub Actions with the long-lived JSON key stored in repository secret `SERVICE_ACCOUNT` (`${{ secrets.SERVICE_ACCOUNT }}`).

This is acceptable for the current certified deployment path, but **keyless authentication via GitHub OIDC + Google Cloud Workload Identity Federation (WIF)** is the preferred end state.

## Why migrate

- Eliminates long-lived JSON private keys in GitHub secrets
- Credentials are short-lived and audience-bound to this repository
- Reduces blast radius if a secret is leaked
- Aligns with Google Cloud and GitHub hardening guidance

## Current binding

- Secret name: `SERVICE_ACCOUNT` (must remain a **secret**, never `vars.SERVICE_ACCOUNT`)
- Workflows: `.github/workflows/verify-service-account.yml`, `.github/workflows/deploy-production.yml`, `.github/workflows/firebase-hosting-pull-request.yml`
- Auth action: `google-github-actions/auth@v2` with `credentials_json`
- Credential files are created only under the runner temp directory, with `cleanup_credentials: true` and an `always()` cleanup step; shell tracing is disabled (`set +x`)

## Target pattern

Use repository script `infra/scripts/06_oidc_github.sh` (or equivalent) to create:

1. Workload Identity Pool + OIDC provider for `token.actions.githubusercontent.com`
2. Attribute condition locked to `tenderbriefing/ServeSA`
3. Bind `roles/iam.workloadIdentityUser` on the deploy service account
4. Replace workflow auth with:

```yaml
- uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/POOL/providers/PROVIDER
    service_account: github-action-XXXX@servesa-aad53.iam.gserviceaccount.com
```

Then delete the JSON key versions and remove `SERVICE_ACCOUNT` from GitHub secrets.

## Non-blocking note

OIDC/WIF migration does **not** block the current production certification unless repository policy mandates keyless auth. Track as a follow-up hardening item after case-creation receives a defensible PASS.
