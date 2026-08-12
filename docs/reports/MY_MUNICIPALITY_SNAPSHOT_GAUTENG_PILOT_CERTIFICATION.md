# My Municipality Snapshot — Gauteng Pilot Certification

**Date:** 2026-08-12  
**Branch:** `feat/my-municipality-snapshot`  
**Product:** My Municipality (`/municipality`) — municipality-level snapshot only  
**Activation scope:** Gauteng allow-list (`JHB`, `TSH`, `EKU`, `WTS`, `SED`, `MTS`)  
**Publishing engine flag:** **OFF** (default)

## Product decisions implemented

- Citizen brand: **My Municipality** (not IDP product; IDP is a source type)
- Hierarchy: identity → Municipality Snapshot → budget → where money goes → priorities → major projects → official sources
- **No ward planning** on this surface (no ward filter, no “Your community”, no ward budgets)
- Ward remains optional on national onboarding / profile; GIS unchanged
- Non-allowlisted / unpublished municipalities: honest “Municipal information coming soon” — **never JHB fallback**
- Default `MUNICIPAL_PLANNING_ALLOWLIST` = Gauteng codes (not `*`)
- Major projects selected via deterministic `selectMajorMunicipalProjects` (prefer municipality-wide/regional)

## Certification results (17-point)

| # | Item | Result |
|---|------|--------|
| 1 | Pilot municipality | **Intended:** City of Johannesburg (`JHB`) or another Gauteng metro once authentic docs are supplied. **No live published snapshot certified in this PR.** |
| 2 | Official documents used | **NOT EXECUTED** — no authentic IDP / Approved Budget / SDBIP PDF/DOCX in repository or uploaded for this close-out |
| 3 | Financial year | **NOT EXECUTED** (no published budget lines from official docs) |
| 4 | Budget accuracy | **NOT EXECUTED** — blocked on authentic documents + human verification |
| 5 | Allocation accuracy | **NOT EXECUTED** |
| 6 | Planning priority accuracy | **NOT EXECUTED** |
| 7 | Major project accuracy | **NOT EXECUTED** |
| 8 | Source provenance | **Architecture PASS** — citizen UI shows official sources list; page-level provenance remains in ops/audit. Live provenance against real docs **NOT EXECUTED** |
| 9 | Human review result | **NOT EXECUTED** — publishing lifecycle not run on authentic docs |
| 10 | Publishing security | **PASS (intent + rules)** — infra publishing/planning security **24/0/0**; engine flag OFF; citizens cannot upload/approve/publish |
| 11 | Municipality isolation | **PASS** — resolver claims→profile→null; allow-list gates non-Gauteng; no JHB fallback; summary does not use ward |
| 12 | Mobile UAT (390px) | **PARTIAL** — unit/e2e auth-gate + planning specs updated; full authenticated mobile snapshot with published content **NOT EXECUTED** (no published Gauteng snapshot) |
| 13 | Desktop UAT (1440px) | **PARTIAL** — same as mobile |
| 14 | Automated test results | Web unit **48/0/0**; case-contract **33/0/0**; functions **50/0/0**; infra security **24/0/0**; typecheck web+functions **PASS** |
| 15 | Production publishing state | Publishing engine remains **OFF**; My Municipality allow-list defaults to **Gauteng only** (requires Hosting deploy of this build to take effect in production) |
| 16 | Remaining conditions | (a) Obtain authentic Gauteng IDP + Approved Budget (+ SDBIP if useful); (b) run upload→extract→review→approve→publish for one metro; (c) manual accuracy sample vs source PDFs; (d) deploy Hosting with Gauteng allow-list; (e) authenticated multi-muni UAT (JHB published vs CPT not-allowlisted / empty) |
| 17 | Final GO / NO-GO | **NO-GO for controlled municipal content launch** until authentic documents complete human-verified publication. **Engineering/product surface is ready for Gauteng-scoped activation.** |

## Final recommendation

**MY MUNICIPALITY SNAPSHOT — ENGINEERING READY; CONTENT PILOT NOT READY**

Do not enable national publishing. Do not publish a municipality snapshot until official documents are verified end-to-end for that municipality.
