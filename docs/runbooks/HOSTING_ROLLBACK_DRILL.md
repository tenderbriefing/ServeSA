# Runbook: Live Hosting rollback drill

## Purpose

Execute a **controlled production Hosting rollback and restore** without touching Functions, Firestore rules, Storage, indexes, media, or GIS.

## Preconditions

- Current live release ID recorded
- Prior FINALIZED release identified and compatible (same app surface)
- Operator can call Firebase Hosting Admin API / Console
- Drill window agreed; on-call watching error rates

## Procedure

1. **Record current**

```bash
# Releases (quota project required)
curl -s -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "x-goog-user-project: servesa-aad53" \
  "https://firebasehosting.googleapis.com/v1beta1/projects/servesa-aad53/sites/servesa-aad53/releases?pageSize=5"
```

Record: release name, version ID, `releaseTime`, route HTTP status for `/report` `/ops` `/ops/map` `/ops/supervisor` `/field` `/case`.

2. **Identify previous approved release** (prior FINALIZED version).

3. **Confirm compatibility** — prior release still serves the pilot surfaces (may be older UI; must not 5xx).

4. **Roll back** by cloning prior version to live channel:

```bash
firebase hosting:clone \
  servesa-aad53:<PRIOR_VERSION_ID> \
  servesa-aad53:live \
  --project servesa-aad53
```

Or Console → Hosting → Releases → Rollback.

5. **Verify routes** (expect <500; document status codes).

6. **Restore current approved version** the same way (clone current version back to live).

7. **Re-verify routes**.

8. **Confirm unchanged**: GIS revision, Function revisions, rules, indexes (spot-check `georesolveFunction` revision).

9. Record recovery time (rollback → restore complete) and release IDs in evidence + certification report.

## Pass criteria

- Live drill executed (not dry-run only)
- Production restored to approved release (not left on rollback)
- No Functions/GIS/rules/index/media mutation
- Evidence file under `docs/reports/evidence/`

## Related

- `docs/runbooks/PRODUCTION_ROLLBACK_DRILL.md`
- `docs/reports/DEPLOYMENT_REGISTRY.md`
