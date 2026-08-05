# Unresolved case reconciliation runbook

## Purpose

Re-run authoritative GIS resolution for existing cases with `routingPending=true` after a certified ward dataset is promoted.

## Safety

- Default **dry-run**
- Bounded batches (max 100)
- Skips `routingManualOverride=true`
- Idempotent routing events keyed by `routing_reconcile_<datasetVersion>`
- No high-frequency scheduler by default

## Callable (admin/ops)

Function: `reconcileUnresolvedRoutingFunction`

```json
{ "limit": 25, "dryRun": true }
```

Requires auth token roles including `admin` or `ops`.

## CLI (ops workstation)

```bash
# Emulator / scripted Admin SDK entry point can wrap:
# apps/functions/src/routing/reconcileUnresolved.ts
```

## Outcomes

| Outcome | Meaning |
|---------|---------|
| resolved | Unique ST_COVERS match; routingPending cleared on apply |
| unresolved | No polygon |
| ambiguous | Multiple covers |
| skipped | Manual override / already resolved / missing coords |
| failed | Infra error for that case |

## After apply

Spot-check case docs for `georesolution.datasetVersion`, append-only `routing_resolution` events, and absence of contact PII in events.
