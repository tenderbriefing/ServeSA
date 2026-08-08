# Municipal Planning — Visual IDP Summary (“Our Municipality”)

## Purpose

Help citizens understand municipal plans without IDP jargon: what is planned, what it costs, where, when, progress, and how to participate.

## Citizen experience

| Route | Description |
|-------|-------------|
| `/municipality` | Overview, priorities, budget, projects, your community |
| `/municipality/projects/[projectId]` | Project detail, sources, related updates, official source |

Nav label: **Our Municipality**. Feature flag `municipal_planning` is **ON by default** (non-staged). Set `NEXT_PUBLIC_ENABLE_MUNICIPAL_PLANNING=false` to hide. Optional municipality allow-list via `NEXT_PUBLIC_MUNICIPAL_PLANNING_ALLOWLIST` (default `*` = all municipalities; empty states when no published plan).

Municipality resolution follows the same soft pattern as Updates/Ideas: claims → profile → pilot default `JHB`. Missing values never invent figures — copy uses “Not published yet” / “Data awaiting verification”.

## Ops

| Route | Description |
|-------|-------------|
| `/ops/planning` | Review documents, priorities, projects, budgets; verify; publish; archive |

Publication: `draft → awaiting_review → verified → published → archived`. AI extract drafts never auto-publish.

## Data model (Admin SDK writes only)

| Collection | Role |
|------------|------|
| `municipal_plans` | Plan period metadata |
| `municipal_plan_documents` | IDP, Budget, Adjusted Budget, SDBIP, Annual Report, AFS, S71, S52, performance reports |
| `municipal_priorities` | Plain-language priorities with sources |
| `municipal_projects` | Projects with official statuses |
| `municipal_budget_lines` | Budget lines — every amount has a source |
| `municipal_plan_reviews` | Review/audit events |

Contract: `@servesa/case-contract` → `municipalPlanning.ts`.

## Ingestion pipeline

`document → ingestion → extract → structured model → validation → human verify → publish`

AI may assist summarisation/classification/simplification and **must** be labelled as ServeSA plain-language summary. AI is **not** source of truth for budgets, dates, percentages, status, ward, or expenditure.

## Integration

- **Community Ideas:** CTAs to `/ideas/new` — no competing ideas system.
- **Municipal Updates:** Related updates on project detail via `relatedUpdateIds`.
- **GIS:** Unchanged. Planning does not invent municipalities or weaken georesolution.

## Security

- Citizens: published only; cannot write planning data.
- Officials: municipality-isolated via JWT claims (C3).
- Follows C1–C3 patterns from community engagement hardening.

## Analytics (privacy-conscious)

Client events in `lib/telemetry/planning.ts` (no PII): page viewed, project opened, official source clicked, idea/priority CTAs.

## Pilot

City of Johannesburg (`JHB`). National-scale ready via municipality-scoped collections and allow-list. **No fake demo numbers in production paths** — fixtures for tests/dev only (`data/fixtures/municipal-planning/`).

## Future layering (metadata only)

`promised | budgeted | spent | delivered | citizen_experience` — no speculative accountability scoring.

## ADR

See `docs/architecture/ADR_MUNICIPAL_PLANNING.md`.
