# Pilot Incident Response (PII-safe)

| Field | Value |
|-------|-------|
| Project | `servesa-aad53` |
| Region | `africa-south1` |
| Audience | Pilot municipal admins, Serve SA on-call |
| Channels | Internal ops chat / ticket only |

## Severity

| Sev | Examples | Response |
|-----|----------|----------|
| SEV1 | Cross-muni data exposure; mass case corruption; GIS wrong municipality at scale | Page on-call; freeze deploys; consider rollback |
| SEV2 | CreateCase/ops down; auth lockout; field workers seeing unrelated cases; duplicate auto-merge bug (must not happen) | Acknowledge < 1h; fix/rollback within 4h |
| SEV3 | Single-function errors; UI bug; intel fail-open noise; cold-start latency | Next business day |
| SEV4 | Docs / polish | Backlog |

## First 15 minutes

1. Confirm project `servesa-aad53` / region `africa-south1`.
2. Check Hosting + key functions health (**no PII** in chat logs).
3. Confirm GIS revision still `georesolvefunction-00002-kuy`.
4. If deploy-related: stop further deploys; note last verified SHA from `docs/reports/DEPLOYMENT_REGISTRY.md`.
5. Capture **case IDs / timestamps / error codes only** — not citizen names, phones, emails, or photos.

## PII rules (mandatory)

| Allowed in tickets / shared ops views | Forbidden |
|---------------------------------------|-----------|
| `caseId`, `municipalityCode`, ward codes | Reporter name, email, phone |
| Error codes, HTTP status, latencyMs | Case description free text (prefer redact) |
| Function revision, deploy SHA | Signed media URLs, raw images |
| Aggregate counts / rates | Duplicate score matrices in email |

Citizens must never see internal notes, duplicate scores, or staff chat.

## Playbooks by symptom

### Create / GIS

- Check `createCaseFunction` and `georesolveFunction` error rates + latency.
- Distinguish infra errors from legitimate `unresolved` / `ambiguous`.
- **Do not** invent municipality from images.
- GIS rollback only via `docs/runbooks/WARD_GIS_ROLLBACK.md`.

### Ops / isolation

- Verify caller claims (`roles`, `municipalityCode`).
- Confirmed cross-muni read/write → SEV1.

### Duplicate / merge anomaly

- Confirm no auto-merge path; halt experimental flags.
- `docs/runbooks/DUPLICATE_REVIEW.md` / `CASE_LINK_AND_MERGE.md`.
- Image intel rollback: `IMAGE_INTELLIGENCE_ROLLBACK.md` (fail-open remains).

### Field unrelated cases

- SEV2 — check assignment filters / `field_worker` claims; revoke mis-provisioned claims.

### Auth / deploy (WIF)

- `docs/runbooks/WIF_ROLLBACK.md`. Never paste JSON keys into chat.

## Observability (pilot)

| Signal | Where | PII-safe? |
|--------|-------|-----------|
| Function error rate | Cloud Monitoring | Yes (aggregate) |
| Georesolve latency | Cloud Run / Functions metrics | Yes |
| Cold starts | Functions metrics | Yes |
| Hosting 5xx | Firebase | Yes |
| Unresolved routing count | Ops / aggregate | Yes if no free text |
| Image intel failure count | Logs by code | Yes if message codes only |

See `docs/reports/PERFORMANCE_BASELINE.md`.

## Rollback pointers

- `docs/runbooks/PRODUCTION_ROLLBACK_DRILL.md`
- `docs/runbooks/WIF_ROLLBACK.md`
- `docs/runbooks/IMAGE_INTELLIGENCE_ROLLBACK.md`
- `docs/runbooks/WARD_GIS_ROLLBACK.md` (GIS only if GIS incident)

## Comms template (external)

> We are investigating an operational issue affecting Serve SA pilot services. Case intake and/or municipal operations may be delayed. Personal information is not being shared in status updates. Next update by _HH:MM_.

## Post-incident (48h)

1. Timeline with SHAs (no PII).
2. Root cause + protected-invariant check.
3. Follow-ups: tests, alerts, docs.
4. Sponsor summary: impact counts, not identities.

## Contacts

Fill names in the secure roster / `docs/pilot/PILOT_CONFIGURATION_TEMPLATE.md` — do not commit personal phones to a public repo.
