# Runbook: JSON key retirement (post-WIF)

## Purpose

Remove the long-lived GitHub `SERVICE_ACCOUNT` JSON-key dependency **only after** a successful production deploy authenticated via WIF.

## Hard gate

Do **not** delete or disable the JSON key until:

1. `verify-wif.yml` PASS
2. `deploy-production.yml` PASS with `auth_mode=wif` on the intended SHA
3. Production smoke after that deploy PASS
4. Workflows no longer reference `secrets.SERVICE_ACCOUNT` for production deploy

## Steps

1. Confirm last Deploy Production run used WIF (job summary / log: `auth_mode=wif`).
2. Remove JSON fallback from workflows:
   - `.github/workflows/deploy-production.yml` — WIF-only auth
   - `.github/workflows/verify-service-account.yml` — retire or convert to WIF-only verify
3. Merge/push workflow hardening to `main`.
4. Delete GitHub secret `SERVICE_ACCOUNT` (Settings → Secrets) when API/UI access allows.
5. Identify USER_MANAGED keys on the historical deploy SA (often `firebase-adminsdk-…`) and disable/delete obsolete key IDs used solely for Actions:

```bash
gcloud iam service-accounts keys list \
  --iam-account=firebase-adminsdk-fbsvc@servesa-aad53.iam.gserviceaccount.com \
  --project=servesa-aad53
# After confirming which key backed SERVICE_ACCOUNT:
# gcloud iam service-accounts keys delete KEY_ID --iam-account=... --project=servesa-aad53
```

6. Update ADR + OIDC migration docs to mark JSON path **retired**.
7. Keep `docs/runbooks/WIF_ROLLBACK.md` for emergency re-key only (explicit owner approval).

## Owner-only blockers

If GitHub secret deletion requires org owner UI and API lacks permission, record the exact action:

> GitHub → `tenderbriefing/ServeSA` → Settings → Secrets and variables → Actions → `SERVICE_ACCOUNT` → Delete

## Do not

- Delete the key before WIF production deploy succeeds
- Leave a silent JSON fallback in production deploy
- Commit key material

## Related

- `docs/runbooks/WIF_DEPLOYMENT.md`
- `docs/runbooks/WIF_ROLLBACK.md`
- `docs/architecture/ADR_GITHUB_WIF.md`
