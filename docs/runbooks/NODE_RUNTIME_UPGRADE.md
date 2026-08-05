# Node Runtime Upgrade Runbook

| Field | Value |
|-------|-------|
| Project | `servesa-aad53` |
| Region | `africa-south1` |
| Target runtime | **nodejs22** (Firebase Gen2 supported) |
| Previous | nodejs20 |
| Sprint status (2026-08-05) | **Non-GIS functions upgraded to nodejs22 in production**. `georesolveFunction` remains **nodejs20** / revision `georesolvefunction-00002-kuy` until a dedicated GIS change window. |

## Why

Node 20 reaches end-of-life **2026-10-31**. Upgrade before that date for all remaining runtimes (including GIS).

## Config surfaces (must stay aligned)

| Location | Field | Value |
|----------|-------|-------|
| `apps/functions/package.json` | `engines.node` | `22` |
| Root `package.json` | `engines.node` | `>=22` |
| `infra/firebase.json` | `functions.runtime` | `nodejs22` |
| `.github/workflows/*.yml` | `node-version` | `22` |

## Completed this sprint

1. Engines + firebase runtime declarations → Node 22
2. CI Node 22
3. Redeployed affected Gen2 functions (create/ops/media/intelligence/…); **GIS revision unchanged**
4. Verified GIS still `nodejs20` / `georesolvefunction-00002-kuy`

## Remaining

- GIS resolver Node 22 cutover under ward GIS runbooks (separate approval).
- Retry `generateDailyReport` europe-west1 scheduler update if flaky.
- Emulator local Node 22 for contributors.

## Rollback

Redeploy prior SHA if needed — **never** swap GIS revision casually. See `PRODUCTION_ROLLBACK_DRILL.md`.

Pilot note: GIS remaining on Node 20 is open condition C4 until **2026-10-31** (`docs/reports/PILOT_READINESS_CERTIFICATION.md`).
