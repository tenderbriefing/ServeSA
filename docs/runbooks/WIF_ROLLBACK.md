# Runbook: Workload Identity Federation (WIF) rollback

## When to use

WIF auth fails in production deploy or verify workflows and you must restore the previous JSON-key path immediately.

## Principles

1. Restore deploy capability without broadening IAM (`roles/owner` / `roles/editor` forbidden).
2. Do not skip SHA recording on production deploys.
3. Do not change GIS resolver behaviour as part of auth rollback.

## Fast rollback (workflow dual-path)

Production deploy already falls back when WIF vars are empty.

1. GitHub → **Settings → Secrets and variables → Actions → Variables**
2. Clear or delete:
   - `WORKLOAD_IDENTITY_PROVIDER`
   - `DEPLOY_SERVICE_ACCOUNT`
3. Confirm secret `SERVICE_ACCOUNT` (JSON key) still exists and is valid.
4. Re-run **Verify SERVICE_ACCOUNT** (`verify-service-account.yml`) — expect `auth_mode=credentials_json_deprecated`.
5. Re-run **Deploy Production** via `workflow_dispatch` if a deploy is required.

Do **not** print or commit the JSON key.

## GCP-side rollback (optional)

If the new SA or pool is misconfigured but JSON-key SA still works:

1. Leave `github-actions-pool` / `github-oidc` in place (safe idle).
2. Optionally disable the WIF deploy SA without deleting it:

```bash
gcloud iam service-accounts disable \
  github-actions-deploy@servesa-aad53.iam.gserviceaccount.com \
  --project=servesa-aad53
```

3. To re-enable later:

```bash
gcloud iam service-accounts enable \
  github-actions-deploy@servesa-aad53.iam.gserviceaccount.com \
  --project=servesa-aad53
```

## Re-enter WIF path

1. Re-run `bash infra/scripts/06_oidc_github.sh` (idempotent).
2. Set GitHub variables from script output (`WORKLOAD_IDENTITY_PROVIDER`, `DEPLOY_SERVICE_ACCOUNT`).
3. Run **Verify WIF** until `verification=PASS`.
4. Deploy via WIF; then plan removal of `SERVICE_ACCOUNT` JSON key versions (after PR hosting no longer requires JSON).

## Do not

- Force-push
- Create new JSON keys unless explicitly approved as temporary emergency
- Grant `roles/owner` or `roles/editor` to the deploy SA
- Touch ward GIS / georesolve as part of auth rollback

## Related

- `docs/architecture/ADR_GITHUB_WIF.md`
- `docs/security/OIDC_WIF_MIGRATION.md`
- `infra/scripts/06_oidc_github.sh`
