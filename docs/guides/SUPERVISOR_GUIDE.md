# Supervisor Guide

Live route: https://servesa-aad53.web.app/ops/supervisor  
Supersedes the short `docs/guides/SUPERVISOR_OPERATIONS_GUIDE.md` (kept as pointer).

## Purpose

Actionable **operations board** for a single municipality — counts that open filtered work lists. Not a public performance ranking product.

## Access

Sign in as an official (or admin) with `municipalityCode`. Open **Supervisor** in the ops shell (`/ops/supervisor`).

## Board metrics → queues

| Metric | Typical href / bucket |
|--------|------------------------|
| Unacknowledged | `/ops?bucket=needs_ack` |
| Unassigned | `/ops/cases` |
| In progress | `/ops?bucket=in_progress` |
| Duplicate reviews | `/ops?bucket=duplicate_review` |
| Routing triage | `/ops?bucket=triage` |
| Reopened | `/ops?bucket=reopened` |
| Ready for closure | `/ops?bucket=ready_closure` |
| High priority | `/ops?bucket=high_priority` |

Click a card → work the Smart Work Queue / cases list. Clear duplicate reviews via case detail (link / dismiss / flag) — **never** rely on auto-merge.

## Workload

The board’s workload list shows **open cases by assignee UID** for internal balancing. Do **not** publish rankings externally or to citizens.

## Map

Use `/ops/map` for spatial triage. Payloads are municipality-bounded and omit contact PII. Navigation may hand off to OSM.

## Field coordination

Field workers on `/field` can start work and propose completion. Supervisors / officials complete resolve → close. If a field worker sees unrelated jobs, treat as tenancy incident (`docs/runbooks/PILOT_INCIDENT_RESPONSE.md`).

## Invariants (supervisor checklist)

- No cross-muni browsing.
- No citizen-visible duplicate scores or internal notes.
- GIS remains authoritative; triage means “needs routing,” not “guess on the map.”
- Success is cycle-time and backlog health (`docs/pilot/PILOT_SUCCESS_METRICS.md`), not public league tables.

## Related

- Official desk guide: `docs/guides/MUNICIPAL_OFFICIAL_GUIDE.md`
- Duplicate runbook: `docs/runbooks/DUPLICATE_REVIEW.md`
- Ops ADR: `docs/architecture/ADR_MUNICIPALITY_OPERATIONS.md`
- Map ADR: `docs/architecture/ADR_OPERATIONS_MAP.md`
