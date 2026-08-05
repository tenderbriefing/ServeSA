# Municipal Admin Guide

Serve SA pilot — Firebase project `servesa-aad53` · Ops: https://servesa-aad53.web.app/ops

## Who this is for

Municipal **administrators** who provision staff, departments, and category routing for one municipality. Not a public analytics portal.

## Before you start

1. Complete `docs/pilot/PILOT_CONFIGURATION_TEMPLATE.md` with your official GIS `municipalityCode` (e.g. `JHB`).
2. Ensure your Auth user has admin (or bootstrap) claims — see `docs/runbooks/MUNICIPALITY_ONBOARDING.md`.
3. Sign out and sign in after any claims change.

## Day-zero setup

1. Open **Settings** (`/ops/settings`).
2. Create **departments** matching your organogram (`water`, `roads`, etc.).
3. Map each citizen **category** → department. Unmapped work lands in **triage** — do not invent wards or municipalities.
4. Ask Serve SA eng (or use `setOfficialClaimsFunction`) to attach `roles` + `municipalityCode` (+ optional `departmentId`) for each official and field worker.
5. Confirm each user can open `/ops` or `/field` and only sees **your** municipality.

## Ongoing admin tasks

| Task | Where |
|------|-------|
| Adjust category routing | `/ops/settings` |
| Review triage backlog | `/ops` bucket triage / `/ops/supervisor` |
| Watch workload (internal) | `/ops/supervisor`, `/ops/team` — **no public rankings** |
| Duplicate policy questions | `docs/runbooks/DUPLICATE_REVIEW.md` |
| Incidents | `docs/runbooks/PILOT_INCIDENT_RESPONSE.md` |

## Hard rules

- GIS (`ST_COVERS`, MDB wards) is authoritative — staff never “fix” municipality from a photo.
- Cases are **never auto-merged**; officials link or dismiss duplicates.
- Internal notes stay internal; citizens see public updates and safe timeline only.
- Do not share reporter contact details in email threads or group chats when a `caseId` suffices.
- Deployments are engineering-owned from a **verified SHA** only.

## Related guides

- Officials: `docs/guides/MUNICIPAL_OFFICIAL_GUIDE.md`
- Supervisors: `docs/guides/SUPERVISOR_GUIDE.md`
- Field: `docs/guides/FIELD_WORKER_QUICK_START.md`
- Launch: `docs/pilot/PILOT_LAUNCH_CHECKLIST.md`
