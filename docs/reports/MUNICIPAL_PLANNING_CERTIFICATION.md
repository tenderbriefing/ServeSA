# Municipal Planning (Visual IDP Summary) — Production Certification

| Field | Value |
|-------|-------|
| Product | ServeSA |
| Feature | Our Municipality — Visual IDP Summary |
| Branch | `feat/municipal-planning-idp` |
| Base | `feat/community-engagement-upgrade` @ `42fea0d` |
| Feature SHA | `b9016a468f71016841bec16b5a56880dcd41696b` |
| Production SHA | `1de69f76b7d083f94011e2c527747782ec191d03` (PR #16 squash) |
| Date | 2026-08-09 |
| Deployment | **Deployed** — WIF [`31294948245`](https://github.com/tenderbriefing/ServeSA/actions/runs/31294948245) SUCCESS (Hosting + Functions + rules + indexes) |

## Verdict

**PASS WITH CONDITIONS**

Municipal planning is live in production (non-staged: flag ON by default, allow-list `*`). Remaining condition: human-verified official IDP/budget documents must be published via `/ops/planning` — no fixture numbers in production. Live `/municipality` returns HTTP 200 with citizen heading copy.

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
| 15 | Feature flag `municipal_planning` ON by default (non-staged); optional allow-list (`*` = all) | **PASS** — enabled for production rollout; empty states when unpublished |
| 16 | Security C1–C3 patterns; rules tests; municipality isolation; citizens cannot write planning | **PASS** — Admin SDK writes; security intent tests |
| 17 | Docs + tests + production build/typecheck/lint; WIF deploy; no fake production numbers | **PASS WITH CONDITIONS** — deployed; verified official content still pending publish |

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
| Production Hosting | **Deployed** `1de69f7` via WIF `31294948245` |
| Production Functions | **Deployed** via same run |
| Firestore rules / indexes | **Deployed** (indexes with rules) |
| GIS | **Unchanged** |

## Remaining conditions

1. ~~WIF deploy~~ **DONE** (`31294948245`).
2. Feature is **ON by default** (non-staged; allow-list `*`). Hide with `NEXT_PUBLIC_ENABLE_MUNICIPAL_PLANNING=false` if needed.
3. Human-verify and publish real official documents — **no fixture numbers in production**.
4. Live authenticated callable smoke for summary + project detail after first publish.
5. Confirm composite indexes finished building in GCP console.

## Rollback

1. Hide UI: set `NEXT_PUBLIC_ENABLE_MUNICIPAL_PLANNING=false` and redeploy Hosting.
2. Redeploy prior Functions/rules SHA via WIF if needed.
3. Leave collections in place (additive); do not weaken GIS.

## Final verdict

**PASS WITH CONDITIONS** — production-live (non-staged UI); awaiting verified municipal document publication before citizens see sourced plan/budget numbers.
