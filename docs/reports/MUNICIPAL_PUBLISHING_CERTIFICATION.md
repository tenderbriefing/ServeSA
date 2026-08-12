# Municipal Publishing Engine — Certification Report

**Date:** 2026-08-12  
**Branch:** `feat/municipal-publishing-engine` (from certified `4a1433244a25e1f2119d6486f2a8edabca293da7`)

---

## 1. Executive Verdict

**PASS WITH CONDITIONS**

Pilot-ready foundation for the AI Municipal Publishing Engine is implemented behind a feature flag, with conservative extraction, human review gates, and municipality isolation preserved. Live authenticated Firebase UAT and full authenticated E2E publishing flows remain **NOT RUN** in this session.

---

## 2. Starting SHA

`4a1433244a25e1f2119d6486f2a8edabca293da7`

---

## 3. Final SHA

**Uncommitted** on `feat/municipal-publishing-engine` (working tree). Commit required before PR/deploy.

---

## 4. Branch

`feat/municipal-publishing-engine`

---

## 5. PR / merge status

| Item | Status |
|------|--------|
| PR #20 (auth-gated municipality) | Open — merge first for pilot |
| PR #19 (cinematic landing) | Superseded by #20 — close after #20 merge |
| Publishing engine PR | Not yet opened |

See `docs/pilot/MERGE_STRATEGY_PR19_PR20.md`.

---

## 6. Files changed

~27 paths (including lockfile). Core additions:

- `packages/case-contract/src/municipalPublishing.ts`
- `apps/functions/src/planning/documentIngestion.ts`, `extractText.ts`, `aiDraftGenerator.ts`
- `apps/web/src/app/ops/planning/documents/**`
- `infra/storage.rules` (planning paths)
- Tests, docs, telemetry

---

## 7. Production readiness status

| Area | Status |
|------|--------|
| Auth-gated Our Municipality (#20) | Certified PASS WITH CONDITIONS at starting SHA |
| Publishing engine | Implemented, flag OFF by default |
| Functions deploy | New callables require deploy |
| Live UAT | **BLOCKED / NOT RUN** |

---

## 8. Authenticated UAT results

**NOT RUN** — checklist at `docs/pilot/PRODUCTION_PILOT_UAT_CHECKLIST.md`. Requires `uat_tokens.env` against staging/production Firebase.

---

## 9. Municipality resolution verification

**PASS** (unchanged from #20 baseline)

Precedence: `claimsMunicipalityCode` → profile `municipalityCode` → null. No IP inference, no JHB citizen fallback.

---

## 10. Citizen municipality security

**PASS** (unchanged)

Client writes limited to `province`, `municipalityCode`, `updatedAt`. No roles/claims/staff fields in citizen UI paths.

---

## 11. Municipal publishing architecture

**PASS WITH CONDITIONS**

Lightweight pipeline: upload (callable) → extract (pdf-parse/mammoth) → conservative draft → review UI → approve → publish. Reuses existing RBAC (`assertCommsEditor` / `assertCommsPublisher`) and Firestore collections (`municipal_plan_documents`).

---

## 12. Document upload and provenance

**PASS**

SHA-256 on upload; duplicate detection per municipality; storage paths scoped; audit dual-write to `municipal_plan_reviews` + `audit_logs`.

---

## 13. AI extraction approach

**PASS WITH CONDITIONS**

Rule-based conservative extractor (`servesa-conservative-extractor` v1) — summarises supplied text only. Vertex/Gemini upgrade path reserved; not wired in this iteration.

---

## 14. Hallucination safeguards

**PASS**

No internet inference; amounts only from regex on source text with `needs_review`; null/`not_generated` for missing data; no auto-publish.

---

## 15. Human review lifecycle

**PASS**

`draft_generated` → `under_review` → `approved` → publish. Blocked: direct `draft_generated` → published. Review UI at `/ops/planning/documents/[documentId]`.

---

## 16. Role and municipality isolation

**PASS**

Editors/publishers scoped via JWT claims; cross-municipality denied; citizens have zero ops access.

---

## 17. Citizen Visual IDP integration

**PASS WITH CONDITIONS**

`/municipality` uses 7-module completeness model; published source document links; existing KPI/priority/project rendering unchanged. Apply-draft-to-entities automation deferred.

---

## 18. Audit logging

**PASS**

Events: upload, extraction_failed, ai_draft_generated, ai_draft_reviewed, planning_content_approved, planning_content_published.

---

## 19. Analytics

**PASS**

Pilot events in `lib/telemetry/publishing.ts` — no PII in payloads.

---

## 20. Performance impact

**PASS**

Publishing UI/ops routes only; flag OFF keeps landing bundle unchanged. BudgetBreakdown remains lazy-loaded. No AI SDK in citizen bundles.

---

## 21. Accessibility

**PASS WITH CONDITIONS**

Existing patterns preserved; review textarea is functional; full keyboard audit of new ops pages not run in this session.

---

## 22. Firestore / Storage security

**PASS**

Planning client writes remain denied. Storage: private document/processing paths deny all client access; published path public read only.

---

## 23. Typecheck

**PASS** — `@servesa/web`, `@servesa/functions`, `@servesa/case-contract`

---

## 24. Lint

**PASS** — pre-existing ops hook warnings only

---

## 25. Unit / contract tests

**PASS**

- Web unit: 34/34
- Case-contract: 32/32
- Functions: 45/45

---

## 26. Integration / security tests

**PASS WITH CONDITIONS**

RBAC and lifecycle covered in unit tests. Full Storage rules emulator integration not run in this session.

---

## 27. E2E

**PARTIAL**

- Structural smoke: `productionSmoke.spec.ts` added (not run in CI by default)
- Authenticated municipality + publishing E2E: **NOT RUN**
- Existing `municipalPlanning.spec.ts`: anonymous gate checks

---

## 28. Build

**PASS** — web static export, functions compile

---

## 29. Feature flag status

| Flag | Default |
|------|---------|
| `NEXT_PUBLIC_ENABLE_MUNICIPAL_PUBLISHING_ENGINE` | `false` |
| `NEXT_PUBLIC_MUNICIPAL_PUBLISHING_ALLOWLIST` | empty (all munis when flag on) |

---

## 30. Remaining risks

1. Live Firebase UAT not executed
2. New functions not deployed to `servesa-aad53`
3. `apply draft → priorities/projects/budget_lines` not automated — manual ops flow via existing entities
4. DOCX extraction quality varies; PDF scanned images may fail extraction (source file retained)
5. package-lock churn from `pdf-parse` / `mammoth`

---

## 31. Manual steps required from owner

1. Merge PR #20; close #19 as superseded
2. Commit + push `feat/municipal-publishing-engine`; open PR
3. Deploy functions (new callables) + storage rules
4. Enable flag for pilot municipality only
5. Run authenticated UAT per checklist with `uat_tokens.env`
6. Upload real verified municipal document for pilot review

---

## 32. Deployment recommendation

1. **Merge #20** to `main` and deploy hosting for pilot auth-gated municipality
2. **Separate PR** for publishing engine after functions deploy
3. Enable `NEXT_PUBLIC_ENABLE_MUNICIPAL_PUBLISHING_ENGINE=true` + allow-list for **one** pilot municipality only
4. Do **not** enable nationally until UAT sign-off

---

*Serve SA principle upheld: Upload official document → Review → Approve → Publish. Citizens see verified published content only.*
