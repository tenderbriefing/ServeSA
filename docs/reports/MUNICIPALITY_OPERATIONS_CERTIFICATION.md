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
