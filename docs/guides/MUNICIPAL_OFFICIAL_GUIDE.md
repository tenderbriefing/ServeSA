# Municipal Official Guide

Daily workspace for desk officials — https://servesa-aad53.web.app/ops

## Sign in

Use your municipal account. You must have `official` (or admin) claims and a `municipalityCode`. After claims updates, sign out/in.

## Where to work

| Route | Use |
|-------|-----|
| `/ops` | Smart Work Queue — today’s actionable buckets |
| `/ops/cases` | Search / filter all cases for your municipality |
| `/ops/case?id=…` | Case detail — primary lifecycle action, notes, duplicates |
| `/ops/map` | Spatial triage (no citizen contact PII on map payload) |
| `/ops/supervisor` | Counts → filtered queues (if you supervise) |
| `/ops/team` | Team / department open workload |
| `/ops/settings` | Departments & category maps (usually admin) |
| `/field` | Mobile field mode (if you also do site work) |

## Processing a case

1. **Acknowledge** new work.
2. **Assign** department (and optional official). Blocked while GIS/routing triage is pending — do not guess municipality.
3. **Start work** → **Resolve** (summary required) → **Close**.
4. Prefer **public updates** for citizen-visible progress; use **internal notes** for staff-only context.

## Duplicates

When the amber duplicate panel / queue appears:

- Compare photos, distance, category, time.
- **Link as same incident**, **keep separate / dismiss**, or **flag image reuse** (distant exact hash).
- Never expect the system to auto-merge. See `docs/runbooks/DUPLICATE_REVIEW.md`.

## Visibility boundaries

- You only see cases for **your** municipality.
- Citizens on `/case` do **not** see duplicate scores or internal notes.
- Do not paste reporter emails/phones into public updates.

## Related

- Supervisor board: `docs/guides/SUPERVISOR_GUIDE.md`
- Field: `docs/guides/FIELD_WORKER_QUICK_START.md`
- Legacy short ops guide: `docs/runbooks/MUNICIPAL_USER_GUIDE.md`
