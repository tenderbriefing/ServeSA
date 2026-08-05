# Authenticated browser UAT (Playwright)

## Purpose

Run role-based Chromium UAT against production Hosting with **synthetic** Firebase Auth identities.

## Identities

Provisioned by:

```bash
export GOOGLE_CLOUD_PROJECT=servesa-aad53
npm run pilot:uat-identities
# → docs/reports/evidence/uat_tokens.env (gitignored)
# → docs/reports/evidence/uat_identities_meta.json (safe metadata)
```

| Role | Email (synthetic) | Claims |
|------|-------------------|--------|
| Citizen | `uat.citizen.pilot@servesa.test` | (none) |
| Official | `uat.official.jhb.pilot@servesa.test` | official / JHB |
| Admin | `uat.admin.jhb.pilot@servesa.test` | official+admin / JHB |
| Supervisor | `uat.supervisor.jhb.pilot@servesa.test` | official+moderator / JHB |
| Field | `uat.field.jhb.pilot@servesa.test` | field_worker / JHB |
| Other muni | `uat.official.cpt.pilot@servesa.test` | official / CPT |
| Suspended | `uat.suspended.pilot@servesa.test` | disabled account |

## Auth bootstrap

Playwright injects `window.__PILOT_UAT_ID_TOKEN` (password payload or custom JWT).  
`AuthProvider` signs in via `signInWithEmailAndPassword` or `signInWithCustomToken`.

## Run

```bash
set -a
source docs/reports/evidence/uat_tokens.env
set +a
npx playwright test --grep @pilot
# or full suite:
npm run test:e2e
```

## Rules

- Never commit `uat_tokens.env`
- Never mark skipped auth tests as passed
- Target: zero skips for required pilot roles when tokens are loaded
- Production base URL default: `https://servesa-aad53.web.app`

## Related

- `docs/pilot/PILOT_UAT_SCRIPT.md`
- `apps/web/tests/e2e/`
- `tools/pilot/provision_uat_identities.js`
