# Municipal Planning (Visual IDP Summary) — Production Certification

| Field | Value |
|-------|-------|
| Product | ServeSA |
| Feature | Our Municipality — Visual IDP Summary |
| Branch | `feat/municipal-planning-idp` |
| Base | `feat/community-engagement-upgrade` @ `42fea0d` |
| Date | 2026-08-08 |
| Deployment | **Not deployed** — production remains manual WIF `workflow_dispatch` only |

## Verdict

**PASS WITH CONDITIONS**

Municipal planning is implemented end-to-end in-repo: contracts, Admin SDK callables, Firestore rules/indexes, citizen `/municipality` + project detail, ops `/ops/planning`, feature flag (global OFF + allow-list), tests, ADR, and feature docs. Production Hosting/Functions/Rules deploy was **not** performed. Live callable smoke and composite index build remain conditions before pilot GA.

## Certification checklist (17 items)

| # | Requirement | Result |
|---|-------------|--------|
| 1 | Phase 0 architecture audit; GIS resolver preserved; Report→GIS→Ops→Field unchanged | **PASS** — ADR `docs/architecture/ADR_MUNICIPAL_PLANNING.md`; no georesolve changes |
| 2 | Citizen route `/municipality` with nav “Our Municipality” | **PASS** — page + Header/Footer gated by flag |
| 3 | Auto-display municipality from authoritative claims/profile; safe fallback | **PASS** — claims → profile → `JHB`; resolution copy when unset |
| 4 | Never invent missing values (“Not published yet” / “Data awaiting verification”) | **PASS** — `PLANNING_EMPTY_COPY` + UI empty states |
| 5 | Overview with animated KPI cards from published data only | **PASS** — server-aggregated KPIs via `getMunicipalPlanningSummaryFunction` |
| 6 | Our Priorities — plain language; ServeSA summary labelled | **PASS** — priority cards + `ServeSaSummaryBanner` |
| 7 | Where the Money Goes — accessible budget viz; every amount has source | **PASS** — `BudgetBreakdown` + required `MoneyAmount.source` |
| 8 | Projects with full status model; no inferred status | **PASS** — enum statuses; Unknown only when official |
| 9 | YOUR COMMUNITY via wardId; no ward promise without mapping | **PASS** — `wardMappingAvailable` gate |
| 10 | Project detail `/municipality/projects/[projectId]` with sources, related updates, official source | **PASS** |
| 11 | Source transparency; AI never SoT for budgets/dates/%/status/ward/spend | **PASS** — publication lifecycle + source schemas |
| 12 | Document kinds (IDP/Budget/Adjusted/SDBIP/Annual/AFS/S71/S52/performance) + ingestion pipeline | **PASS** — contract + ops copy; draft→verify→publish |
| 13 | Admin `/ops/planning` review/correct/approve/verify/unpublish | **PASS** |
| 14 | Participation reuses Community Ideas; Updates related not duplicated | **PASS** — CTAs to `/ideas/new`; `relatedUpdateIds` |
| 15 | Feature flag `municipal_planning` global OFF + municipality allow-list | **PASS** — `NEXT_PUBLIC_ENABLE_MUNICIPAL_PLANNING` + allow-list |
| 16 | Security C1–C3 patterns; rules tests; municipality isolation; citizens cannot write planning | **PASS** — Admin SDK writes; security intent tests |
| 17 | Docs + tests + production build/typecheck/lint; no fake production numbers; no auto-deploy | **PASS WITH CONDITIONS** — local gates green; deploy/index/smoke pending |

## Tests (local)

| Suite | Result |
|-------|--------|
| `@servesa/case-contract` municipalPlanning | **6 passed** |
| `@servesa/functions` municipalPlanning | **5 passed** |
| `infra/tests` municipalPlanning.security | **6 passed** |
| `@servesa/web` unit | **10 passed** |
| `@servesa/functions` build + type-check | **PASS** |
| `@servesa/web` type-check | **PASS** |
| `@servesa/web` production build (static export) | **PASS** — includes `/municipality`, `/ops/planning` |
| `@servesa/web` lint | **PASS** (pre-existing ops hook warnings only) |
| Playwright `municipalPlanning.spec.ts` | **2 passed** (local static `out/` on :8765) |

## Deployment status

| Surface | Status |
|---------|--------|
| Production Hosting | **Not deployed** |
| Production Functions | **Not deployed** |
| Firestore rules / indexes | Defined; **must deploy before GA** |
| GIS | **Unchanged** |

## Conditions before pilot GA

1. WIF `workflow_dispatch` deploy of Hosting + Functions + rules + indexes.
2. Enable `NEXT_PUBLIC_ENABLE_MUNICIPAL_PLANNING=true` with allow-list `JHB` for pilot only.
3. Human-verify and publish real official documents — **no fixture numbers in production**.
4. Live callable smoke for summary + project detail.
5. Confirm composite indexes built in GCP.

## Rollback

1. Hide UI: unset / set `NEXT_PUBLIC_ENABLE_MUNICIPAL_PLANNING=false` and redeploy Hosting.
2. Redeploy prior Functions/rules SHA via WIF if needed.
3. Leave collections in place (additive); do not weaken GIS.

## Final verdict

**PASS WITH CONDITIONS** — ready for PR review and controlled pilot enablement after WIF deploy + index + verified content; not production-live.
