# Runbook: GitHub WIF production deployment

## Purpose

Deploy Serve SA production (`servesa-aad53`) using GitHub OIDC → GCP Workload Identity Federation — **no JSON key**.

## Preconditions

| Check | Expected |
|-------|----------|
| GitHub variables | `WORKLOAD_IDENTITY_PROVIDER`, `DEPLOY_SERVICE_ACCOUNT` set |
| WIF pool/provider | `github-actions-pool` / `github-oidc` **ACTIVE** |
| Attribute condition | `assertion.repository=='tenderbriefing/ServeSA'` |
| Deploy SA | `github-actions-deploy@servesa-aad53.iam.gserviceaccount.com` (no Owner/Editor) |
| Verify WIF | Latest `verify-wif.yml` run `verification=PASS` |
| SHA | Deploy only a verified tip recorded/about to be recorded in `DEPLOYMENT_REGISTRY.md` |
| Branch | Prefer `main` after merge; never force-push |

## Procedure

1. Confirm target SHA on `main`:

```bash
git fetch origin && git rev-parse origin/main
```

2. Run **Verify WIF** (`workflow_dispatch`) if last verify is stale.

3. Run **Deploy Production** (`workflow_dispatch`) with the smallest safe surface needed:
   - Hosting-only for frontend/UAT wiring
   - Functions selective for runtime migrations
   - Rules when rules changed

4. Confirm workflow logs (metadata only):
   - `auth_mode=wif`
   - `deploy_sa=github-actions-deploy@servesa-aad53.iam.gserviceaccount.com`
   - `deployed_sha=<exact SHA>`
   - No `credentials_json_deprecated` warning

5. Record Hosting release + Function revisions + SHA in `docs/reports/DEPLOYMENT_REGISTRY.md`.

6. Smoke critical routes: `/report`, `/ops`, `/field`, `/case`.

## Do not

- Auto-deploy on push
- Print tokens or credential files
- Deploy unreviewed tips
- Include GIS semantic changes in a WIF-only auth proof
- Fall back to JSON key while WIF vars are set

## Related

- `docs/architecture/ADR_GITHUB_WIF.md`
- `docs/security/OIDC_WIF_MIGRATION.md`
- `docs/runbooks/WIF_ROLLBACK.md`
- `.github/workflows/deploy-production.yml`
