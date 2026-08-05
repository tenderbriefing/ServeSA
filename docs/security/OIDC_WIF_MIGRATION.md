# OIDC / Workload Identity Federation migration (security improvement)

## Status

**In progress — script and workflows ready; GCP pool/provider/SA not assumed live until operator runs the setup script and sets GitHub variables.**

| Layer | State |
|-------|--------|
| `infra/scripts/06_oidc_github.sh` | Rewritten: pool `github-actions-pool`, provider `github-oidc`, SA `github-actions-deploy@…`, least privilege, no JSON keys |
| `.github/workflows/deploy-production.yml` | WIF preferred; deprecated JSON-key fallback; `workflow_dispatch` only; Node 22 |
| `.github/workflows/verify-wif.yml` | WIF smoke auth (metadata only) |
| `.github/workflows/verify-service-account.yml` | Dual-path: WIF preferred, JSON fallback |
| `.github/workflows/ci.yml` | Lint / type-check / tests on Node 22 (no deploy) |
| GitHub variables `WORKLOAD_IDENTITY_PROVIDER` / `DEPLOY_SERVICE_ACCOUNT` | Operator must set after script run |
| Secret `SERVICE_ACCOUNT` | Still valid as **deprecated** fallback / PR hosting preview |

## Why migrate

- Eliminates long-lived JSON private keys in GitHub secrets
- Credentials are short-lived and audience-bound to this repository
- Reduces blast radius if a secret is leaked
- Aligns with Google Cloud and GitHub hardening guidance

## Target binding (canonical)

| Item | Value |
|------|--------|
| Project | `servesa-aad53` |
| Pool | `github-actions-pool` |
| Provider | `github-oidc` |
| Issuer | `https://token.actions.githubusercontent.com` |
| Attribute condition | `assertion.repository=='tenderbriefing/ServeSA'` |
| Deploy SA | `github-actions-deploy@servesa-aad53.iam.gserviceaccount.com` |
| WIF principal | `principalSet://iam.googleapis.com/.../attribute.repository/tenderbriefing/ServeSA` |

Workflow auth:

```yaml
- uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: ${{ vars.WORKLOAD_IDENTITY_PROVIDER }}
    service_account: ${{ vars.DEPLOY_SERVICE_ACCOUNT }}
```

Permissions on deploy/verify jobs: `contents: read`, `id-token: write`.

## Operator steps (parent)

1. Authenticated `gcloud` with permission to create WI pools and IAM bindings on `servesa-aad53`.
2. Run:

```bash
bash infra/scripts/06_oidc_github.sh
```

3. Copy printed `WORKLOAD_IDENTITY_PROVIDER` and `DEPLOY_SERVICE_ACCOUNT` into GitHub Actions **variables** (not committed).
4. Confirm org/repo allows OIDC for Actions.
5. Run workflow **Verify WIF**.
6. After PASS, use **Deploy Production** (still manual `workflow_dispatch`).
7. Later: delete JSON key versions and remove `SERVICE_ACCOUNT` when PR hosting no longer needs it.

## Rollback

See `docs/runbooks/WIF_ROLLBACK.md`.

## Related docs

- `docs/architecture/ADR_GITHUB_WIF.md`
- `docs/runbooks/NODE_RUNTIME_UPGRADE.md`
- `docs/runbooks/WIF_ROLLBACK.md`
