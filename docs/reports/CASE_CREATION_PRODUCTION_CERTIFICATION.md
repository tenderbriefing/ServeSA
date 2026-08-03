# Case Creation Production Certification

**Certification authority:** Principal Software Architect / Production Release Engineer  
**Report path:** `docs/reports/CASE_CREATION_PRODUCTION_CERTIFICATION.md`

---

## 1. Executive verdict

# FAIL

The certified source tip (`4b51324`) is **not** running in production. Live hosting still serves a September 2025 static marketing site. Cloud Functions are **not deployed** (billing disabled prevents Blaze/Cloud Build activation required for Functions deploy). BigQuery dataset `servesa-aad53.geo` **does not exist**. Firebase Storage has **not been initialised** in the project. Therefore a citizen cannot complete the certified `/report` → `createCase` journey against the real deployed runtime.

Local quality gates for the case-creation path **pass**, and **emulator-backed** Firestore + Storage rules tests **pass (18/18)** against the real rules files. Firestore rules from this release **were published** to production.

Per release rules, FAIL is mandatory for: runtime/source mismatch, failed production case creation, and inability to prove live BigQuery ward resolution.

---

## 2. Certification date

- **UTC:** 2026-08-03T22:01:00Z  
- **SAST:** 2026-08-04 00:01 SAST  

## 3. Starting SHA

`14d94569394eadbd18f4a7533d722e203ded517c`

## 4. Final SHA

`204ab27f14edcb0e681564e582d2868cb421b4c4`

## 5. Branch

`main` (local only — **no `origin` remote configured**)

## 6. Production project

`servesa-aad53` (project number `171401876896`)  
Authenticated as `smartprocure.ai@gmail.com`  
Region intent: `africa-south1`

## 7. Live hosting release

| Field | Value |
|-------|-------|
| Site | `servesa-aad53` → https://servesa-aad53.web.app |
| Latest version | `projects/servesa-aad53/sites/servesa-aad53/versions/26930e9aac293265` |
| Status | FINALIZED |
| Create time | `2025-09-01T21:23:02.347390Z` |
| Tool | `cli-firebase` |
| Content | Static Tailwind CDN marketing page — **not** Next.js `/report` from SHA `4b51324` |
| `/report` | Returns the same 2025-09-01 homepage document (no certified wizard) |

## 8. Live Functions / Cloud Run revisions

| Field | Value |
|-------|-------|
| `cloudfunctions.googleapis.com` | Enabled during this session |
| Deployed functions | **0** |
| Cloud Run / Build / Artifact Registry | **Blocked** — billing not enabled |
| Callable `createCaseFunction` | **Absent** |

## 9. Traffic allocation

Hosting: 100% traffic on version `26930e9aac293265` (2025-09-01).  
Functions: N/A (none deployed).

## 10. Image digest

N/A — no containerised Functions/Cloud Run revision exists.

## 11. Firestore rules version

| Field | Value |
|-------|-------|
| Prior release | `rulesets/4e796f96-8d1c-45c6-b3b9-3cfedbaf5aaf` (2025-09-01) |
| **Deployed this session** | `rulesets/357b282c-2fe4-48a8-a053-302f5a98f7b6` |
| Release | `projects/servesa-aad53/releases/cloud.firestore` |
| Update time | `2026-08-03T21:57:28.026773Z` |
| Source | `infra/firestore.rules` (backend-only case writes; municipality-scoped officials) |

## 12. Storage rules version

**Not deployed.** Firebase Storage is not set up on `servesa-aad53` (`Get Started` required in console). Rules file updated and emulator-verified locally: `infra/storage.rules` (uses `firestore.get` / `firestore.exists`).

## 13. BigQuery dataset and table verification

| Check | Result |
|-------|--------|
| Datasets in `servesa-aad53` | **None** |
| `servesa-aad53.geo` | **Not found** |
| `servesa-aad53.geo.wards` | **Not found** |
| ST_CONTAINS production query | **Not executable** |
| Service-account GIS access | N/A — table absent |

## 14. Deployment actions performed

1. Set active account/project to `smartprocure.ai@gmail.com` / `servesa-aad53`.
2. Enabled `cloudfunctions.googleapis.com` (succeeded).
3. Attempted enable of Cloud Build / Run / Artifact Registry → **FAILED_PRECONDITION: billing not enabled**.
4. Published Firestore ruleset `357b282c-…` to `cloud.firestore`.
5. Attempted Storage rules deploy → blocked (Storage not initialised).
6. **Did not** deploy hosting or Functions (would not produce a working certified journey without Functions + billing + BQ geo; hosting alone would still fail case creation).
7. **Did not** enable billing (financial action outside autonomous scope).

## 15. Rollback targets

| Surface | Rollback target |
|---------|-----------------|
| Hosting | Keep `26930e9aac293265` (unchanged) |
| Firestore rules | Previous ruleset `4e796f96-8d1c-45c6-b3b9-3cfedbaf5aaf` |
| Functions | N/A |
| Storage rules | N/A (not deployed) |

Firestore rollback (if needed):

```bash
# Restore prior Firestore ruleset via Rules API release pointing at 4e796f96-...
```

## 16. Test identities

| Identity | Status |
|----------|--------|
| Controlled citizen | **Not used in production** — journey unreachable |
| Controlled official | **Not used** |
| Anonymous browser | Probed public hosting only |
| Admin/owner (`smartprocure.ai@gmail.com`) | Used for project inspection + rules publish |

No synthetic production cases were created (backend absent).

## 17. Citizen journey evidence

**Not completed in production.**

Public probe:

- `GET https://servesa-aad53.web.app/` → 200, static ServeSA marketing HTML (cdn.tailwindcss.com), last-modified 2025-09-01.
- `GET https://servesa-aad53.web.app/report` → same static document; **no** certified 4-step wizard, no `data-testid` contract UI.
- Cloud Functions health URLs → **404**.

## 18–28. Category / location / georesolution / SLA / Firestore case / event / idempotency / notification / media / duplicate / share / official

**Not evidenced in production** — blocked by missing Functions, BQ geo, and non-certified hosting.

Local/unit evidence from prior certification (`docs/reports/CASE_CREATION_END_TO_END_CERTIFICATION.md`) remains valid for source quality only.

## 29. Official-access evidence

Emulator-backed only (see §30). No live official queue verification.

## 30. Firestore emulator test results

**PASS — 12/12** (`infra/tests/rules.emulator.test.ts`)

Covers: backend-only create denial; cross-citizen read denial; own-case read; unauthenticated denial; cross-municipality official denial; same-municipality official read/update; event forgery denial; notification ledger / idempotency write denial; admin cross-muni read.

## 31. Storage emulator test results

**PASS — 6/6** (same suite; total **18/18**)

Covers: upload without case; cross-citizen upload denial; own-case image upload; executable reject; cross-municipality media read denial; unauthenticated media read denial.

Emulators: Firestore `:8080`, Storage `:9199`, project `demo-servesa-rules`, Java 21.

## 32. Build and test results

| Gate | Result |
|------|--------|
| `@servesa/case-contract` unit | **15/15 PASS** |
| `@servesa/functions` unit | **5/5 PASS** |
| Emulator rules | **18/18 PASS** |
| Web `tsc` / `next build` | **PASS** (`/report` included) |
| Functions full-project `tsc` | Pre-existing failures **outside** case path |
| Secret scan (private keys in `.next`) | No private key / service-account material found |
| Live production smoke | **FAIL / not possible** |

## 33. Observability evidence

Not verified in production (no createCase traffic path).

## 34. Production test-data cleanup

No certification cases, media, or notification ledger entries were written.  
Firestore change retained: Firestore rules release `357b282c-…` (intentional hardening).

## 35. Remaining risks

1. **Billing disabled** — cannot deploy Cloud Functions / complete Blaze-required stack.
2. **No BQ GIS** — ward resolution cannot be production-proven.
3. **Storage not initialised** — media path cannot be production-proven.
4. **Hosting/runtime mismatch** — citizens interact with 2025 static site.
5. **No git remote** — cannot push or verify `origin/main`.
6. **No Engineering Constitution / deployment registry** artefacts existed; this report + `docs/reports/DEPLOYMENT_REGISTRY.md` establish baseline.
7. Email ESP still stubbed in source (log-only) even after Functions exist.

## 36. Conditions preventing full PASS

| Condition | Status |
|-----------|--------|
| Production runtime matches certified SHA | **FAIL** |
| Live `/report` completes | **FAIL** |
| Live BigQuery ST_CONTAINS | **FAIL** (dataset missing) |
| Live Functions createCase | **FAIL** (none deployed; billing) |
| Emulator Firestore rules | **PASS** (closed) |
| Emulator Storage rules | **PASS** (closed) |
| Firestore rules published | **PASS** (this session) |
| Storage rules published | **FAIL** (Storage not set up) |
| Production smoke identities | **Not executed** |

## 37. Recommended next workstream

**Do not start the SLA breach engine.**

Required before re-attempting production PASS:

1. Enable billing (Blaze) on `servesa-aad53`.
2. Initialise Firebase Storage.
3. Create `geo` dataset + load `wards` geometries; grant least-privilege BQ access.
4. Deploy Functions from tip SHA via RUNBOOK (`firebase deploy --only functions`).
5. Deploy certified web app (static export or Hosting+SSR strategy aligned with `apps/web`).
6. Publish Storage rules.
7. Re-run this production smoke checklist end-to-end.
8. Only then schedule **SLA breach engine** hardening.

---

## Annex A — Integrity checks

| Check | Result |
|-------|--------|
| Working tree at start | Clean on `main` @ `4b51324` |
| Ancestors | `14d9456`, `535c54c`, `4b51324` ⊆ HEAD |
| Remote | **None** |
| Release policy docs | Absent (RUNBOOK only) |

## Annex B — Public probe hashes

Hosting etag: `2da66013e559bb0695f6ae40d6889040c40ddd4f4ceec1908a11d705096cff3b`  
(content-length 20119; not the certified Next bundle)
