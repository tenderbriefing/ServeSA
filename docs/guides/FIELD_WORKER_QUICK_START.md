# Field Worker Quick Start

Live route: https://servesa-aad53.web.app/field  
Project: `servesa-aad53` · Claims: `field_worker` and/or `official` with `municipalityCode`

## Setup

1. Get Auth account + claims for **your** municipality (`setOfficialClaimsFunction` via admin).
2. Sign out/in so the token refreshes.
3. Open `/field` on a phone browser (mobile-first).

## Tabs

| Tab | What you see |
|-----|----------------|
| **Today** | Active assigned / related jobs (not resolved/closed/rejected/citizen_confirmed) |
| **Map** | Navigate links via OpenStreetMap for jobs with coordinates |
| **Completed** | Resolved / closed / citizen_confirmed jobs from your list |

Header shows your `municipalityCode`. Offline banner appears when the network drops.

## On a job

1. **Navigate** — opens OSM (directions or map pin). Does not change case coordinates.
2. **Start work** — online only; server confirms transition toward in-progress. Disabled offline.
3. **Draft note** — bottom sheet; saved in `localStorage` (`servesa.field.draftNote`) while offline.
4. **Propose completion** — online; sends note to officials. You **cannot** close the case, change ward/municipality, or manage users.

Jobs list is cached in `localStorage` (`servesa.field.jobs`) for offline **viewing**. Lifecycle actions wait for the server — no optimistic close.

## Hard limits

- Only jobs for your municipality / assignment scope — not the whole city backlog of unrelated cases.
- No GIS edits; no cross-muni access; no auto-merge involvement.
- Intelligence / scoring is staff-side; you will not see citizen PII you do not need.

## If something fails

- Stay offline-safe: keep draft notes; retry Start / Propose when back online.
- Escalate via your supervisor (`/ops/supervisor`) with `caseId` only when possible.
- Incidents: `docs/runbooks/PILOT_INCIDENT_RESPONSE.md`

## Related

- ADR: `docs/architecture/ADR_FIELD_WORKER_MODE.md`
- Offline notes: `docs/runbooks/FIELD_OFFLINE_SYNC.md`
- Officials: `docs/guides/MUNICIPAL_OFFICIAL_GUIDE.md`
