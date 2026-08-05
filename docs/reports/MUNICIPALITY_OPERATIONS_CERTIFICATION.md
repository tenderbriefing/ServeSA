# Municipality Operations Production Certification

| Field | Value |
|-------|-------|
| Issued (UTC) | 2026-08-05T05:30:00Z |
| Verdict | **PASS WITH CONDITIONS** |
| Project | `servesa-aad53` |
| Baseline GIS SHA | `062323df36e1e1d73146183bb3bbe07e72c27eb1` |
| Deployed SHA | `8b7088406357867973fd6429eb3c7be94c0ef6c8` |
| Branch | `main` |

## Executive summary

Municipality Operations MVP is live at `/ops`. Privileged case mutations are server-controlled. Department routing runs only after authoritative GIS municipality resolution. Unresolved/ambiguous/unmapped cases enter triage. Municipal isolation enforced. GIS resolver unchanged (`ST_COVERS`, MDB Wards 2020).

## Smoke evidence

| Check | Result | Evidence |
|-------|--------|----------|
| `/ops` pages load | 200 | hosting |
| `/report` still live | 200 | hosting |
| Create + GIS resolve | `polygon_match` JHB | `CASE-MSFN98YW-0TQWX7` ward `79800060` |
| Category→dept mapping | `roads` assigned, triage false | case `departmentRouting.mapped` |
| Acknowledge→Assign→In Progress→Resolve→Close | ok | Admin SDK ops path |
| Internal note private collection | 1 note | `internal_notes` |
| Public update separate | 1 update | `public_updates` |
| Cross-muni official denied | `permission_denied` | CPT token vs JHB case |
| GIS fields intact | yes | `polygon_match` / dataset version retained |
| Citizen createCase | still works | same smoke create |

## Deployed functions (africa-south1)

- `createCaseFunction` (updated — dept routing after GIS)
- `updateCaseStatusFunction`
- `assignCaseFunction`
- `addInternalNoteFunction`
- `addPublicUpdateFunction`
- `setOfficialClaimsFunction`
- `upsertDepartmentFunction`
- `upsertCategoryDepartmentMapFunction`

## Remaining conditions

1. Interactive browser login session as provisioned official not fully UI-smoked (server workflow + hosting verified).
2. `citizen_confirmed` transition not exercised in this smoke.
3. OIDC/WIF for GitHub deploy credentials still outstanding.
4. Media upload on ops case not re-run (prior media cert still baseline).

## Rollback

- Functions: previous `createcasefunction-00003-qem` / redeploy prior SHA `062323d` functions if needed.
- Hosting: prior Hosting release via Firebase console.
- Rules: restore prior `infra/firestore.rules` from `062323d`.

## Docs

- ADR: `docs/architecture/ADR_MUNICIPALITY_OPERATIONS.md`
- Onboarding: `docs/runbooks/MUNICIPALITY_ONBOARDING.md`
- User guide: `docs/runbooks/MUNICIPAL_USER_GUIDE.md`
- Pilot guides: `docs/guides/MUNICIPAL_ADMIN_GUIDE.md`, `docs/guides/MUNICIPAL_OFFICIAL_GUIDE.md`, `docs/guides/SUPERVISOR_GUIDE.md`


## Addendum — Operational Intelligence (2026-08-05)

- `/ops` is now Smart Work Queue; supervisor board + map + field mode added.
- Duplicate review + citizen_confirmed path exercised in OI smoke.
- See `docs/reports/OPERATIONAL_INTELLIGENCE_CERTIFICATION.md`.

---

## Addendum — Pilot readiness hardening (2026-08-05)

**Branch:** `cert/pilot-readiness-hardening`  
**Starting tip:** `052161e` on main  
**Prior OI tip / cert:** `e90fdc0` / `405839d`  
**Sprint deploy SHA:** _to be filled at close_  
**Master:** `docs/reports/PILOT_READINESS_CERTIFICATION.md`

### Pilot posture for municipality ops

- Single-municipality pilot using live surfaces only (`/ops`, `/ops/supervisor`, `/ops/map`, `/field`, case detail + duplicate review).
- Lifecycle and municipal isolation rules from this cert remain the baseline; OI did not weaken GIS or cross-muni gates.
- Configuration for the pilot municipality (departments, category maps, officials, feature flags) must follow `docs/pilot/PILOT_CONFIGURATION_TEMPLATE.md` before go-live.
- Interactive browser UAT and controlled rollback drill remain **open conditions** (evidence TBD).

### Invariants carried forward

No GIS weaken · no image→municipality inference · no auto-merge · no citizen duplicate scores/notes · no cross-muni access · field workers unrelated-case isolation · intelligence fail-open · no face recognition · no speculative AI/SLA engine · deploy only from verified SHA.
