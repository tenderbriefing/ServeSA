# ADR — GitHub Actions Workload Identity Federation (OIDC)

| Field | Value |
|-------|-------|
| Status | **Accepted** (GCP pool/provider ACTIVE; GitHub variables set; Actions WIF verify SUCCESS) |
| Date | 2026-08-05 |
| Deciders | Serve SA Platform / Security |
| Project | `servesa-aad53` |

## Context

Production GitHub Actions historically authenticated with a long-lived Google Cloud service-account JSON key stored as repository secret `SERVICE_ACCOUNT`. Long-lived keys increase blast radius if leaked and conflict with keyless-auth hardening guidance from Google Cloud and GitHub.

## Decision

1. Use **GitHub OIDC → Google Cloud Workload Identity Federation** as the primary deploy authentication path.
2. Provision via `infra/scripts/06_oidc_github.sh` (idempotent, **no JSON keys**):

| Item | Value |
|------|--------|
| Project | `servesa-aad53` |
| Pool | `github-actions-pool` |
| Provider | `github-oidc` |
| Issuer | `https://token.actions.githubusercontent.com` |
| Attribute mapping | `sub`, `actor`, `repository`, `repository_owner` |
| Attribute condition | `assertion.repository=='tenderbriefing/ServeSA'` |
| Deploy SA | `github-actions-deploy@servesa-aad53.iam.gserviceaccount.com` |
| WIF binding | `roles/iam.workloadIdentityUser` on principalSet `attribute.repository/tenderbriefing/ServeSA` |
| Project roles | Granular least privilege (`cloudfunctions.admin`, `run.admin`, `iam.serviceAccountUser`, `storage.admin`, `firebasehosting.admin`, `datastore.user`, `firebaserules.admin`, plus build/artifact helpers). Never `roles/owner` / `roles/editor`. |

3. Workflows prefer repository **variables**:
   - `WORKLOAD_IDENTITY_PROVIDER` (full provider resource name printed by the script)
   - `DEPLOY_SERVICE_ACCOUNT` (`github-actions-deploy@servesa-aad53.iam.gserviceaccount.com`)
4. Production deploy remains **`workflow_dispatch` only** (no auto-deploy on push to `main`).
5. **Deploy only from a verified SHA**; record every production tip in `docs/reports/DEPLOYMENT_REGISTRY.md`. WIF does not relax review.
6. Temporary dual-path: if WIF vars are unset, fall back to deprecated `secrets.SERVICE_ACCOUNT` with an explicit warning. Remove the JSON key after WIF smoke passes.
7. PR Hosting previews may still need `firebaseServiceAccount` JSON until `FirebaseExtended/action-hosting-deploy` supports pure WIF/ADC.
8. Node runtime for CI/functions is tracked separately (`docs/runbooks/NODE_RUNTIME_UPGRADE.md`) — coordinated on the same hardening track, not a substitute for WIF.

## Non-goals

- Changing Firebase project, region (`africa-south1`), or GIS resolver credentials / behaviour.
- Using WIF to grant human interactive console owner roles.
- Embedding secrets in workflow logs (`set +x`, credential cleanup remain mandatory).

## Consequences

| Positive | Trade-off |
|----------|-----------|
| Short-lived, audience-bound credentials | Operators must run OIDC script once and set GitHub variables |
| Least-privilege deploy SA | Misconfigured attribute condition blocks all deploys |
| Dual-path rollback via clearing WIF vars | JSON key must remain available until WIF proven |

Org/repo settings must allow Actions OIDC (`permissions.id-token: write`).

## Evidence

| Item | Status |
|------|--------|
| ADR accepted | This document |
| Pool/provider live in GCP | **ACTIVE** — `github-actions-pool` / `github-oidc` |
| Attribute condition | `assertion.repository=='tenderbriefing/ServeSA'` |
| Deploy SA | `github-actions-deploy@servesa-aad53.iam.gserviceaccount.com` (no Owner/Editor) |
| GitHub variables | `WORKLOAD_IDENTITY_PROVIDER`, `DEPLOY_SERVICE_ACCOUNT` set |
| Workflows green on WIF | **PASS** — runs 31017777435 / 31017770944 SUCCESS |
| JSON key deleted | **Not yet** — `SERVICE_ACCOUNT` secret retained until WIF smoke PASS |
| Rollback drill practiced | Documented — `docs/runbooks/WIF_ROLLBACK.md` |

## Rollback

See `docs/runbooks/WIF_ROLLBACK.md`. Prefer restoring JSON-key path (clear WIF vars) over weakening IAM attribute conditions or broadening SA roles.

## Related

- `docs/security/OIDC_WIF_MIGRATION.md`
- `docs/runbooks/WIF_ROLLBACK.md`
- `docs/runbooks/NODE_RUNTIME_UPGRADE.md`
- `.github/workflows/deploy-production.yml`, `verify-wif.yml`, `ci.yml`
