# ServeSA Deployment Registry

Last updated: 2026-08-03T22:01:00Z (SAST 2026-08-04 00:01)

| Environment | Project | Surface | Revision / Version | Source SHA | Notes |
|-------------|---------|---------|--------------------|------------|-------|
| production | servesa-aad53 | Hosting | `26930e9aac293265` (2025-09-01) | **unknown / pre-cert** | Static marketing site; not tip `4b51324` |
| production | servesa-aad53 | Cloud Functions | _(none)_ | — | API enabled; billing blocks deploy |
| production | servesa-aad53 | Firestore rules | `357b282c-2fe4-48a8-a053-302f5a98f7b6` | local tip at publish | Published 2026-08-03 during production certification |
| production | servesa-aad53 | Storage rules | _(not published)_ | — | Storage product not initialised |
| production | servesa-aad53 | BigQuery `geo.wards` | _(missing)_ | — | Dataset absent |
| local tip | — | Source | git `main` | see `git rev-parse HEAD` | Case-creation implementation from `535c54c` |

## Rollback

- Hosting: unchanged during certification; prior versions listed via Hosting API.
- Firestore rules: previous ruleset `4e796f96-8d1c-45c6-b3b9-3cfedbaf5aaf`.
- Functions: N/A.

## Blockers

- Billing disabled on `servesa-aad53`.
- No git `origin` remote in this workspace clone.
