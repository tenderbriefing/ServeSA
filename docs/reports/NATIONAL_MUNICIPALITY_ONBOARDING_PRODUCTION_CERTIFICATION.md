# National Municipality Onboarding — Production Certification

**Date:** 2026-08-12  
**Branch:** `feat/national-municipality-onboarding`

## Executive Verdict

**PASS WITH CONDITIONS**

National citizen municipality onboarding is implemented and merged-ready: required province/municipality at signup, optional ward, shared municipality gate, no JHB citizen/ops fallback, truthful unpublished planning empty state. Live multi-municipality production UAT and official document publishing lifecycle remain outstanding where credentials/documents are unavailable.

## Git

| Item | Value |
|------|-------|
| Starting SHA | `4c1c2c89c28d48c3007a22afd106d757c86b600f` |
| Feature branch | `feat/national-municipality-onboarding` |

*(Merge SHA / final SHA filled after merge)*

## National onboarding

- **Province:** required at email signup; validated against SA dataset
- **Municipality:** required; filtered by province; canonical code persisted
- **Ward:** optional free-text; no fabricated ward catalogue; blank accepted
- Invalid province/municipality combinations rejected client-side via `isValidMunicipalitySelection`

## Existing users

- Valid municipality → proceeds
- Missing municipality → `CitizenMunicipalityGate` → `ConfirmMunicipalityPanel`
- Google signup without municipality → confirm gate on municipality-dependent routes
- No automatic JHB assignment

## Municipality context

- Citizen resolver: claims → profile → null
- Staff ops: JWT municipality claim required (no JHB fallback)
- Display: “Your Municipality” + display name

## /municipality

- Auth-gated
- Published content for citizen municipality only
- Unpublished: “Planning information is not available yet”
- Unresolved: confirmation panel

## Updates and Ideas

- Scoped via same citizen municipality resolver
- Wrapped in `CitizenMunicipalityGate` (auth + municipality)

## GIS

**Preserved.** Profile ward is supplementary only. Case routing remains authoritative GIS (`ST_COVERS`). No change to georesolution.

## Security

- Cross-municipality isolation intent tests pass
- Publishing security intent tests pass
- Citizen profile writes still cannot set roles
- Ops publishing requires municipality claim

## Publishing

- Architecture national: empty allow-list = all municipalities when engine flag ON
- Engine flag remains **OFF** by default
- No permanent `ALLOWLIST=JHB` in code
- New publishing Functions may still need production deploy (separate from this web finalisation)

## Tests (local)

| Suite | Passed | Failed | Skipped |
|-------|--------|--------|---------|
| Web unit | 42 | 0 | 0 |
| Case-contract | 32 | 0 | 0 |
| Functions | 50 | 0 | 0 |
| Infra security | 12 | 0 | 0 |
| Typecheck / lint / builds | PASS | — | — |
| Live Firebase UAT | — | — | NOT EXECUTED |
| Official document publishing UAT | — | — | NOT EXECUTED |

## Rollback

1. Revert merge commit on `main`
2. Redeploy previous Hosting revision
3. Citizen reporting continues (GIS unchanged)

## Known conditions

**Blocking for full production pilot sign-off:** live multi-muni UAT; publishing Functions deploy if not yet live; authentic municipal document for publishing lifecycle.

**Non-blocking:** incomplete local municipality coverage in static dataset (duplicate codes historically present); ward free-text without official ward catalogue.

## Final recommendation

**NATIONAL PLATFORM READY WITH CONDITIONS**
