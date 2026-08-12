# National Municipality Onboarding — Production Certification

**Date:** 2026-08-12  
**Branch:** `feat/national-municipality-finalisation`

## Executive Verdict

**PASS WITH CONDITIONS**

National citizen municipality context is finalised on `main` via PR #22 and this finalisation follow-up: required province/municipality at signup, optional ward, shared municipality gate (including `/ideas/new`), header “Your Municipality” context, no JHB citizen fallback, truthful unpublished planning empty state, CompleteProfileModal aligned with required municipality validation, UserSchema includes `province`.

Live multi-municipality authenticated UAT and authentic document publishing lifecycle remain conditions where production evidence is pending after deploy.

## Git

| Item | Value |
|------|-------|
| Starting SHA (pre-finalisation) | `bc955969bf837247b26e467fb12f73b271e5d466` (PR #22 merge) |
| Prior national PR | #22 — `feat/national-municipality-onboarding` |
| Feature branch | `feat/national-municipality-finalisation` |

*(Feature / merge / final SHA filled after merge)*

## National onboarding

- **Province:** required at email signup; validated against SA dataset
- **Municipality:** required; filtered by province; canonical code persisted
- **Ward:** optional free-text; no fabricated ward catalogue; blank accepted
- Invalid province/municipality combinations rejected via `isValidMunicipalitySelection`
- Canonical codes: `JHB`, `CPT`, `DBN` (eThekwini), `TSH`, `BUF`, `POL`, …

## Existing users

- Valid municipality → proceeds
- Missing municipality → `CitizenMunicipalityGate` → `ConfirmMunicipalityPanel`
- Google signup without municipality → confirm gate on municipality-dependent routes
- No automatic JHB assignment
- `/ideas/new` uses the same shared gate (not a competing redirect-only flow)

## Municipality context

- Citizen resolver: claims → profile → null
- Staff ops: JWT municipality claim required (no JHB fallback)
- Display: “Your Municipality” + display name (header + municipality page)

## /municipality

- Auth-gated
- Published content for citizen municipality only
- Unpublished: “Planning information is not available yet”
- Unresolved: confirmation panel

## Updates and Ideas

- Scoped via same citizen municipality resolver
- Wrapped in `CitizenMunicipalityGate` (list + new idea)

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
- Publishing Functions deploy tracked separately in production deployment section

## Tests (local)

| Suite | Passed | Failed | Skipped |
|-------|--------|--------|---------|
| Web unit | 46 | 0 | 0 |
| Case-contract | 32 | 0 | 0 |
| Functions | 50 | 0 | 0 |
| Infra security | 12 | 0 | 0 |
| Typecheck / lint / builds | PASS | — | — |
| Live Firebase UAT | — | — | NOT EXECUTED (pre-deploy) |
| Official document publishing UAT | — | — | NOT EXECUTED |

## Rollback

1. Revert merge commit on `main`
2. Redeploy previous Hosting / Functions revisions via Deploy Production workflow
3. Citizen reporting continues (GIS unchanged)
4. Publishing flag remains OFF by default — disable Hosting env if enabled

## Known conditions

**Blocking for full production pilot sign-off:** live multi-muni authenticated UAT after Hosting deploy; authentic municipal document for publishing lifecycle.

**Non-blocking:** incomplete local municipality coverage in static dataset; ward free-text without official ward catalogue; eThekwini canonical code is `DBN` (not `ETH`).

## Final recommendation

**NATIONAL PLATFORM READY WITH CONDITIONS**
