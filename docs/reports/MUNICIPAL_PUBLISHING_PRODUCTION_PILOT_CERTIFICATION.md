# Municipal Publishing Engine — Production Pilot Certification

**Date:** 2026-08-12  
**Auditor role:** Controlled production-validation exercise (not feature development)

---

## 1. Executive Verdict

**PASS WITH CONDITIONS**

Engineering certification passes locally. Production pilot **cannot be certified complete** until PR merges, targeted deployment, authenticated live UAT, and a genuine official JHB planning document are completed by the repository owner.

---

## 2. Starting SHA

`50cb1964ba34bf2447d73a986e0c9174b6d0e552` (publishing engine initial commit on `feat/municipal-publishing-engine`)

Phase 0 audit began from this SHA. Branch also contained PR #20 stack (`4a1433244a25e1f2119d6486f2a8edabca293da7` base).

---

## 3. Final SHA

`1648a584…` (full: `1648a584` — run `git rev-parse HEAD` on `feat/municipal-publishing-engine`)

Includes CI fix, MIME schema hardening, and publishing security intent tests.

---

## 4. PR Status

| PR | Title | State | CI | Merge |
|----|-------|-------|-----|-------|
| **#19** | Cinematic landing | **CLOSED** (superseded) | Was green | N/A — closed 2026-08-12 |
| **#20** | Auth-gated Our Municipality | **OPEN** | Green (verify + preview) | **BLOCKED** — requires ≥1 approving review |
| **#21** | Municipal Publishing Engine | **OPEN** | Was red (CI); fix pushed in `1648a58` | **BLOCKED** — depends on #20 + review |

**Merge SHA #20:** Not merged — no merge SHA.  
**Merge SHA #21:** Not merged — no merge SHA.

---

## 5. Production Deployment

**NOT DEPLOYED** in this exercise.

### Deployment manifest (minimum required when merging #21)

| Component | Action | Reason |
|-----------|--------|--------|
| **Cloud Functions** (7 new callables) | Deploy | Publishing pipeline |
| `uploadPlanningDocumentFunction` | NEW | Upload + SHA-256 |
| `processPlanningDocumentFunction` | NEW | Extract + draft |
| `updatePlanningAiDraftFunction` | NEW | Human review edits |
| `approvePlanningDocumentFunction` | NEW | Approval gate |
| `publishPlanningDocumentFunction` | NEW | Publish gate |
| `getPlanningPublishingDashboardFunction` | NEW | Ops dashboard |
| `getPlanningDocumentSourceUrlFunction` | NEW | Signed source URLs |
| **Storage rules** | Deploy | `municipal_planning/{documents,processing,published}` paths |
| **Firestore rules** | No change required | Planning writes remain Admin SDK only |
| **Hosting** | Deploy only if pilot flag/env changed | Flag defaults OFF — optional for pilot |

**Region:** `africa-south1` (per `infra/firebase.json`)  
**Runtime:** `nodejs22`

### Currently deployed (verified via `firebase functions:list`)

Existing planning callables only (`getMunicipalPlanningSummaryFunction`, `listPlanningEntitiesFunction`, `transitionPlanningStatusFunction`, etc.). **None of the seven publishing callables are deployed.**

### Deploy method

Production deploy is **manual** via GitHub Actions workflow `Deploy Production` (`workflow_dispatch` + WIF). Local Firebase CLI has project access to `servesa-aad53` but deploy was **not executed** pending merge to `main`.

---

## 6. Pilot Configuration

| Item | Value |
|------|-------|
| Pilot municipality (display) | City of Johannesburg |
| **Canonical ID** | **`JHB`** (from `apps/web/src/lib/southAfricaData.ts`) |
| Feature flag | `NEXT_PUBLIC_ENABLE_MUNICIPAL_PUBLISHING_ENGINE` — default **OFF** |
| Allow-list | `NEXT_PUBLIC_MUNICIPAL_PUBLISHING_ALLOWLIST=JHB` (recommended for pilot) |

**Not enabled in production Hosting** during this exercise.

---

## 7. Document Used

**NONE — BLOCKING**

No verified official City of Johannesburg IDP / IDP Review / SDBIP PDF or DOCX exists in the repository (`**/*.{pdf,docx}` search: 0 files).

**Required from owner:** One authentic official JHB planning document (PDF or DOCX) with known provenance for live UAT Phase 7.

---

## 8. Publishing Lifecycle (live)

**NOT EXECUTED** — blocked by: (a) publishing functions not deployed, (b) no official document, (c) no UAT identity tokens.

### Automated / local validation

| Stage | Result |
|-------|--------|
| Upload schema (PDF/DOCX) | PASS — MIME enum enforced |
| Upload schema (unsupported) | PASS — rejected |
| Upload schema (oversize) | PASS — rejected |
| SHA-256 | PASS — deterministic hash tests |
| Processing transitions | PASS — invalid transitions blocked |
| AI draft generation | PASS — `needs_review`; no auto-publish |
| Approval gate | PASS — intent tests |
| Publication gate | PASS — draft_generated → publish denied |

---

## 9. AI Accuracy

**NOT EXECUTED** against a real official document.

Local conservative extractor behaviour verified:
- Overview from source text only
- Budget totals `null` without regex-matched amounts
- All generated fields `verificationStatus: needs_review`
- No fields marked `verified` without human action

---

## 10. Human Approval Control

**PASS** (automated intent + contract tests)

| Attempt | Expected | Test result |
|---------|----------|-------------|
| Publish from `draft_generated` | DENIED | PASS |
| Publish from `under_review` | DENIED | PASS |
| Publish after `approved` + `verified` | Allowed (publisher role) | PASS (logic) |
| AI draft auto-publish | DENIED | PASS |
| Audit on approve/publish | Required | Implemented in `appendReview()` |

Live callable manipulation tests: **NOT EXECUTED** (functions not deployed).

---

## 11. Security Results

### RBAC & municipality isolation

| Test | Result |
|------|--------|
| Citizen cannot write planning data | PASS (existing + unchanged) |
| Cross-municipality official read draft | PASS (intent tests) |
| `infra/tests/municipalPlanning.security.test.ts` | **6/6 PASS** |
| `infra/tests/municipalPublishing.security.test.ts` | **6/6 PASS** |

### Storage

| Path | Expected | Rules intent test |
|------|----------|-------------------|
| `municipal_planning/*/documents/*` | Private (deny all client) | PASS |
| `municipal_planning/*/processing/*` | Private (deny all client) | PASS |
| `municipal_planning/*/published/*` | Public read only | PASS |

Live Storage emulator / production URL tests: **NOT EXECUTED**

---

## 12. Citizen UAT

**NOT EXECUTED**

Blocked: no `docs/reports/evidence/uat_tokens.env`, publishing not deployed, pilot flag not enabled in production Hosting.

Structural checks (code review + unit tests):
- `/municipality` auth-gated; no JHB fallback for citizens
- 7-module completeness uses count-based `N of 7`
- Published source links only when `summary.documents` populated

Mobile/desktop Playwright citizen UAT: **NOT EXECUTED**

---

## 13. Regression Results

| Area | Result |
|------|--------|
| Typecheck (web, functions, contract) | PASS |
| Web unit tests | **34/34 PASS** |
| Case-contract tests | **32/32 PASS** |
| Functions tests | **50/50 PASS** |
| Infra security (planning + publishing) | **12/12 PASS** |
| Web build (static export) | PASS |
| Functions build | PASS |
| Production smoke E2E | **NOT EXECUTED** (no server/tokens) |
| Live reporting / ops regression | **NOT EXECUTED** post-deploy |

No unrelated functionality was modified in this validation pass.

---

## 14. Rollback Readiness

**PASS** (documented, not live-tested)

| Control | Status |
|---------|--------|
| Disable `NEXT_PUBLIC_ENABLE_MUNICIPAL_PUBLISHING_ENGINE` | Documented |
| Remove `NEXT_PUBLIC_MUNICIPAL_PUBLISHING_ALLOWLIST` | Documented |
| Archive published documents via existing transition API | Supported |
| Citizen reporting unaffected by flag OFF | By design (separate surfaces) |
| Rollback procedure | `docs/features/MUNICIPAL_PUBLISHING_ENGINE.md` |

---

## 15. Tests

| Suite | Passed | Failed | Skipped | Not executed |
|-------|--------|--------|---------|--------------|
| Web unit | 34 | 0 | 0 | — |
| Case-contract | 32 | 0 | 0 | — |
| Functions | 50 | 0 | 0 | — |
| Infra security (planning) | 6 | 0 | 0 | — |
| Infra security (publishing) | 6 | 0 | 0 | — |
| Playwright @pilot authenticated | — | — | — | **All** (no tokens) |
| Playwright production smoke | — | — | — | **All** |
| Live document UAT | — | — | — | **All** |
| Live RBAC callable tests | — | — | — | **All** |
| CI PR #21 (pre-fix) | 30 | 1 | 0 | — |
| CI PR #21 (post `1648a58`) | — | — | — | **Pending re-run** |

---

## 16. Known Conditions

### Blocking

1. **PR #20 not merged** — branch protection requires approving review  
2. **PR #21 not merged** — stacked on #20  
3. **Publishing functions not deployed** to `servesa-aad53`  
4. **No official JHB document** available for live UAT  
5. **No authenticated UAT tokens** (`uat_tokens.env` not present)  
6. **Pilot feature flag not enabled** in production Hosting env  

### Non-blocking

1. CI fix pushed — await green verify on PR #21  
2. `apply draft → priorities/projects/budget_lines` automation deferred (manual ops path)  
3. DOCX/scanned PDF extraction quality varies  

---

## 17. Production Recommendation

**Continue pilot with conditions**

Do **not** enable nationally. Complete blocking conditions, then run single-municipality JHB pilot under explicit feature flag + allow-list.

---

## Deployment rollback (pre-deploy checklist)

1. Record current function list revision (`firebase functions:list`)  
2. Deploy only: `firebase deploy --only functions,storage --project servesa-aad53`  
3. Rollback: redeploy previous functions bundle from last known good SHA; revert storage rules if needed  
4. Disable pilot flag immediately if issues found  

---

## Manual actions required from owner

1. **Approve and merge PR #20** on GitHub  
2. **Rebase/update PR #21** onto merged `main`; approve and merge  
3. **Trigger** `Deploy Production` workflow with functions + storage rules (Hosting optional with pilot env vars)  
4. Set Hosting env for pilot only:
   - `NEXT_PUBLIC_ENABLE_MUNICIPAL_PUBLISHING_ENGINE=true`
   - `NEXT_PUBLIC_MUNICIPAL_PUBLISHING_ALLOWLIST=JHB`
5. Run `npm run pilot:uat-identities`; source `uat_tokens.env`  
6. **Supply one verified official JHB IDP/SDBIP PDF or DOCX** for live UAT  
7. Execute checklist: `docs/pilot/PRODUCTION_PILOT_UAT_CHECKLIST.md`  
8. Re-run this certification with live evidence  

---

*Previous report: `docs/reports/MUNICIPAL_PUBLISHING_CERTIFICATION.md` (engineering-only, pre-pilot)*
