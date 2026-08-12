# National Treasury Municipal Finance — Production Deployment & National Readiness Certification

**Verdict:** NATIONAL TREASURY MUNICIPAL FINANCE — PRODUCTION CERTIFIED  
**Date:** 2026-08-12  
**Firebase project:** `servesa-aad53`  
**Production Hosting:** https://servesa-aad53.web.app  

---

## 1. Executive Verdict

**NATIONAL TREASURY MUNICIPAL FINANCE — PRODUCTION CERTIFIED**

End-to-end production path proven:

Citizen (authenticated) → municipalityCode `JHB` → production Firestore finance cache → `getMunicipalPlanningSummaryFunction` → `/municipality` infographic with explicit `2025/26 Municipal Budget (Original Budget)`, reconciled operating/capital figures, deterministic allocations, National Treasury provenance, publishing engine **OFF**, Gauteng allow-list preserved.

National **adapter** is production-ready. National **citizen content activation** remains explicitly controlled (Gauteng allow-list) and is **not** auto-expanded.

---

## 2. Starting main SHA

`4f45d10a6ecd685862bf43f7121fcda8f5a9a691` (pre–PR #29 tip; My Municipality snapshot)

At production-cert start, local/remote main already contained the merge:

`0697e37ed6d758eaaefe7467b3f6a19ea3d8953a`

---

## 3. PR #29 final status

**MERGED** — https://github.com/tenderbriefing/ServeSA/pull/29  

Head SHA at merge: `aff49bb32b0b6fc1c53249f7c487a46166f6e9ce`  
Feature implementation: `dd3e8766c86e75305e5676178a8ac75f702358c2`  
CI verify: SUCCESS  

---

## 4. Merge SHA

`0697e37ed6d758eaaefe7467b3f6a19ea3d8953a`  
Merged: 2026-08-12 19:33:46 +0200  

---

## 5. Final main SHA

`0697e37ed6d758eaaefe7467b3f6a19ea3d8953a`

---

## 6. Firebase project

`servesa-aad53` (Serve SA production; `.firebaserc` default/prod)

---

## 7. Hosting deployment result

**PASS**

- Live `/municipality` bundle includes National Treasury UI (`treasuryFinance`, “National Treasury”, “Operating + capital”).
- Municipality page asset hash matched build from main (`page-5b8c87f7a4485a28.js`).
- Certified WIF production deploy: https://github.com/tenderbriefing/ServeSA/actions/runs/31644882256  
  - `headSha=0697e37…`  
  - `conclusion=success`  
  - inputs: functions + hosting + rules  

---

## 8. Functions deployment result

**PASS**

| Function | Region | Post-cert revision / update |
|---|---|---|
| `refreshMunicipalFinanceFunction` | africa-south1 | `refreshmunicipalfinancefunction-00001-lev` (2026-08-12T17:40:52Z) |
| `getMunicipalPlanningSummaryFunction` | africa-south1 | `getmunicipalplanningsummaryfunction-00004-mog` (2026-08-12T22:06:50Z) |
| `refreshMunicipalFinanceScheduled` | europe-west1 | `refreshmunicipalfinancescheduled-00002-xem` (2026-08-12T22:12:29Z) |

Citizen path remains **cache-only** (no live Treasury dependency on page render).

---

## 9. Firestore rules / index deployment result

**PASS** (rules deployed via WIF run `31644882256`)

- `municipal_finance_snapshots` / `municipal_finance_snapshot_changes`: client read/write **denied**
- Unauthenticated REST read of finance cache → **403 PERMISSION_DENIED**
- No new composite indexes required (doc-id reads)

---

## 10. Global publishing flag state

**OFF**

Production web logic still requires `NEXT_PUBLIC_ENABLE_MUNICIPAL_PUBLISHING_ENGINE === 'true'` to enable ops publishing UI. Default remains disabled.

---

## 11. Citizen finance allow-list state

**Gauteng controlled allow-list preserved**

Default codes: `JHB, TSH, EKU, WTS, SED, MTS`  
`NEXT_PUBLIC_MUNICIPAL_PLANNING_ALLOWLIST` not set to `*`  
CPT technically validated in cache but **not** citizen-enabled under current allow-list.

---

## 12. JHB production reconciliation

**PASS — exact match**

| Field | Production cache | Live Treasury / reference |
|---|---|---|
| FY | 2025/26 | 2025/26 |
| Amount type | ORGB | ORGB |
| Operating | R80,669,613,432 | R80,669,613,432 |
| Capital (NEW+RENEWAL+UPGRADING) | R8,700,420,163 | R8,700,420,163 |
| Allocations | 5 categories, 100% | 100% |
| Cache retrievedAt | 2026-08-12T17:42:51.918Z | — |

Authenticated citizen callable + browser UAT displayed the same figures.

---

## 13. CPT production reconciliation

**PASS — exact match (technical validation; not citizen-enabled)**

| Field | Production cache | Live Treasury / reference |
|---|---|---|
| FY | 2025/26 | 2025/26 |
| Amount type | ORGB | ORGB |
| Operating | R71,183,940,671 | R71,183,940,671 |
| Capital | R12,937,677,817 | R12,937,677,817 |

---

## 14. Missing-data test

**PASS**

`EC103` (Ikwezi): empty finance metrics; identity may resolve; **no** invented zeros; **no** JHB substitution (`emptyReason=no_operating_budget_for_preferred_amount_types`).

---

## 15. Unmapped-municipality test

**PASS**

`MTS`: unmapped (Metsweding disestablished); empty; **no** Tshwane/JHB substitute.  
`ZZ99`: municipality not found in Treasury; empty; no substitution.

---

## 16. Cache refresh result

**PASS**

Warm production cache documents: `JHB, CPT, TSH, EKU, ETH, WTS, SED`  
JHB/CPT fingerprints/provenance present; completeness warning retained.  
Failed refresh path covered by automated tests (last-good retention).

---

## 17. Scheduler verification

**PASS**

Cloud Scheduler job enabled:

`firebase-schedule-refreshMunicipalFinanceScheduled-europe-west1`  
Schedule: `0 3 * * 0` (Africa/Johannesburg) — Sundays 03:00 SAST

---

## 18. Mobile UAT

**PASS** (~390px authenticated production)

- Auth gate for anonymous users
- Signed-in JHB citizen sees FY label, ORGB wording, operating/capital cards, allocation bars
- Numbers match reconciled cache
- No overflow of budget cards observed

---

## 19. Desktop UAT

**PASS** (1440×900 authenticated production)

- Nav shows My Municipality + “Your Municipality: City of Johannesburg…”
- Same Treasury FY/budget content present in DOM text
- Layout remains within existing Serve SA page composition

---

## 20. Accessibility result

**PASS**

- CSS bars are not the sole channel
- `BudgetBreakdown` retains `sr-only` table (“Budget amounts by category”) with Category / Amount / Share
- Meaningful headings and Source: National Treasury copy
- Percentages also exposed as text

Note: per-allocation `SourceCitation` currently falls back to “Data awaiting verification” because Treasury allocations are not planning `MoneyAmount` sources; page-level Treasury provenance remains authoritative.

---

## 21. Security / isolation result

**PASS**

- `/municipality` authenticated
- No open Treasury browser proxy
- Finance cache client writes denied
- Refresh callable requires official role
- No cross-municipality fallback to JHB
- GIS / ST_COVERS resolver untouched

---

## 22. Automated test counts

| Suite | Result |
|---|---|
| case-contract | **44 passed** (11 treasury) |
| functions | **58 passed** (8 treasury) |
| web unit | **50 passed** |
| infra security (planning/publishing/treasury) | **15 passed** |
| typecheck (contract/functions/web) | **PASS** |
| web build / functions build | **PASS** |

---

## 23. National readiness matrix summary

Machine-readable dataset:

`docs/reports/data/national_treasury_municipal_finance_readiness_matrix.json`

| Metric | Count |
|---|---|
| Serve SA listed municipalities (onboarding dataset) | 50 |
| Treasury municipalities known (MDB cube) | 292 |
| Serve SA codes mapped to Treasury | 11 |
| Unmapped (MTS) | 1 |
| Serve SA codes not present in Treasury (legacy/non-MDB aliases in onboarding data) | 38 |
| Cache-warm (production) | 7 |
| Validated (JHB + CPT) | 2 |
| Citizen allow-listed | 6 |
| Citizen-enabled + validated | 1 (JHB) |

**Interpretation:** The Treasury adapter is national for any valid MDB demarcation code. Serve SA’s historical onboarding code list contains many non-MDB placeholders; those are `EXCEPTION`/`UNMAPPED` and must **not** be citizen-enabled until remapped to official codes.

---

## 24–28. Counts (required fields)

24. **Mapped (Serve SA list → Treasury):** 11  
25. **With usable Treasury finance data (cache-warm production):** 7  
26. **Cache-ready:** 7  
27. **Validated:** 2 (JHB, CPT)  
28. **Citizen-enabled (allow-listed surface):** 6 codes allow-listed; **1** validated+enabled (JHB). CPT validated but not allow-listed.

---

## 29. Exceptions / unmapped codes

- **UNMAPPED:** `MTS` (Metsweding disestablished — no safe substitute)
- **EXCEPTION:** legacy Serve SA codes not in Treasury municipalities cube (examples: `UML` duplicates, `WCD`, `POL`, `CAC`, …) — see matrix JSON
- **Aliases working:** `WTS→DC48`, `SED→DC42`, `DBN→ETH`

---

## 30. Registration → municipality resolution result

**PASS**

- Signup/profile require province + municipality; ward optional
- Resolver: claims → profile → null (never invents JHB)
- Production UAT citizen profile set to `JHB` → `/municipality` resolved Johannesburg only
- Ward is not used as finance identifier

---

## 31. Observability result

**PASS (operational minimum)**

- Function deploy notices for refresh callable/scheduler
- Scheduler job visible and ENABLED
- Cache documents retain `retrievedAt`, `lastSuccessfulAt`, `fingerprint`, `lastError`, completeness warning
- Change collection available for material diffs
- No citizen PII required in finance refresh telemetry path

Enhancement opportunity (non-blocking): richer structured logging events for stale-cache hits / incomplete responses.

---

## 32. Rollback readiness

**PASS (documented; not destructively executed)**

Pre-WIF rollback points captured:

- main SHA: `0697e37…`
- `refreshMunicipalFinanceFunction`: `…-00001-lev`
- `getMunicipalPlanningSummaryFunction` prior: `…-00003-hew` → post `…-00004-mog`
- `refreshMunicipalFinanceScheduled` prior: `…-00001-xef` → post `…-00002-xem`

Procedure: `docs/runbooks/PRODUCTION_ROLLBACK_DRILL.md` + Hosting release rollback via Firebase Hosting previous version; redeploy prior Functions revisions; do not delete warm finance cache unless replacing with validated snapshot.

---

## 33. Outstanding conditions

1. Do **not** set citizen allow-list to `*` until non-MDB Serve SA onboarding codes are cleaned up.
2. CPT remains technical-validated only (outside Gauteng allow-list).
3. Per-line allocation SourceCitation copy still says “awaiting verification” (page-level Treasury provenance is correct).
4. Broader national cache warming beyond default refresh set is optional/scheduled.
5. UAT identity re-provision via ADC currently blocked by Identity Toolkit IAM for the operator account (existing `uat_tokens.env` used successfully).

---

## 34. National rollout recommendation

**Proceed with controlled activation:**

1. Keep publishing engine OFF.  
2. Keep Gauteng allow-list.  
3. Activate additional municipalities only after: MDB mapping → Treasury data available → cache warm → explicit validation → allow-list add.  
4. Parallel workstream: replace legacy Serve SA municipality codes with official MDB demarcation codes in onboarding data.  
5. Do not declare national citizen finance GO based on Johannesburg alone — adapter is national; citizen content remains staged.

---

## Evidence anchors

- PR: https://github.com/tenderbriefing/ServeSA/pull/29  
- WIF deploy: https://github.com/tenderbriefing/ServeSA/actions/runs/31644882256  
- Readiness matrix: `docs/reports/data/national_treasury_municipal_finance_readiness_matrix.json`  
- Prior engineering cert: `docs/reports/NATIONAL_TREASURY_MUNICIPAL_FINANCE_INTEGRATION_CERTIFICATION.md`  
