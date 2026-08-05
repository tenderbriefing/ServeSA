# Production Rollback Drill

Controlled drill to prove Serve SA can roll back Hosting / Functions without touching protected GIS.

## Scope

| In scope | Out of scope |
|----------|--------------|
| Hosting previous release | Changing BigQuery ward polygons |
| Redeploy functions from known prior SHA | Redeploying `georesolvefunction` |
| Rules restore from git SHA | Deleting production data |

## Pre-conditions

- Registry tip recorded (`docs/reports/DEPLOYMENT_REGISTRY.md`)
- Prior Hosting release identifiable in Firebase console
- Prior function revisions listed (createCase, uploadMedia, ops callables)
- GIS revision confirmed: `georesolvefunction-00002-kuy`

## Drill steps (evidence table)

| Step | Action | Evidence | Result |
|------|--------|----------|--------|
| 1 | Record current Hosting version + function revisions | `gcloud run services list` / console | |
| 2 | Confirm GIS revision unchanged | `georesolvefunction-00002-kuy` | |
| 3 | Identify rollback SHA (e.g. `052161e` or prior cert tip) | git | |
| 4 | Dry-run: `git show <sha>:apps/functions/package.json` engines | log | |
| 5 | Hosting: document “Rollback” click path in Firebase Hosting releases (do not execute on prod unless authorized) | screenshot/note | |
| 6 | Functions: document selective redeploy command excluding `georesolveFunction` | command text | |
| 7 | Smoke: `/report` `/ops` `/field` `/case` HTTP 200 after any real rollback | curl | |
| 8 | Re-confirm GIS revision still `…-kuy` | gcloud | |

## Selective function rollback command (template)

```bash
# Example — adjust list; NEVER include georesolveFunction unless GIS incident
firebase deploy --only \
  functions:createCaseFunction,\
functions:uploadMediaFunction,\
functions:updateCaseStatusFunction \
  --project servesa-aad53
```

## Drill evidence (this sprint)

| Field | Value |
|-------|-------|
| Date (UTC) | 2026-08-05 |
| Mode | **Documented dry-run** (no destructive prod Hosting rollback executed) |
| Current tip (start) | `052161e` |
| GIS verified | `georesolvefunction-00002-kuy` (nodejs20 preserved) |
| Node 22 functions live | createCase `…-00006-nek`, uploadMedia `…-00005-hak`, ops queue/map/supervisor/field `…-00002-*` |
| Hosting live channel | Last release 2026-08-05 13:13:14 — rollback via Firebase Console → Hosting → Releases → Rollback |
| Smoke 32/32 | `docs/reports/evidence/prod_smoke_30.txt` (0 FAIL) |
| Dry-run commands verified | `git show 052161e:apps/functions/package.json` engines; `gcloud functions describe georesolveFunction` revision |
| Rollback targets | Hosting prior release; functions from `e90fdc0`; **GIS stay** |

| Step | Result |
|------|--------|
| 1 Record current revisions | PASS — smoke evidence |
| 2 Confirm GIS unchanged | PASS — `…-kuy` |
| 3 Identify rollback SHA | PASS — `e90fdc0` / Hosting prior |
| 4 Dry-run engines inspect | PASS |
| 5 Hosting rollback path documented | PASS (not clicked) |
| 6 Selective function redeploy template | PASS (excludes georesolve) |
| 7 Smoke HTTP 200 | PASS |
| 8 Re-confirm GIS | PASS |

**Verdict:** PASS WITH CONDITIONS (dry-run). Live Hosting rollback click remains C8.


## Pass criteria

- Rollback path documented with concrete SHAs/revisions
- GIS exclusion explicit
- Smoke evidence available before and after any real rollback

**Note:** Documented dry-run ≠ executed production rollback. Do not claim an unconditional rollback PASS until a controlled live drill fills the evidence table above (or sponsor explicitly accepts dry-run-only for limited pilot).

## Observability during drill

Watch error rates, georesolve latency, and cold starts (`docs/reports/PERFORMANCE_BASELINE.md`). Logs/tickets: case IDs and codes only — no citizen PII.
