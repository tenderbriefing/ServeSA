# National Treasury Municipal Finance Integration Certification

**Branch:** `feat/treasury-municipal-finance`  
**PR:** https://github.com/tenderbriefing/ServeSA/pull/29  
**Starting SHA:** `4f45d10a6ecd685862bf43f7121fcda8f5a9a691` (PR #28 My Municipality snapshot merged to main)  
**Final SHA:** `197471e651e7a6f1fa19b6610477fb2be9ed3b49`  
**Product surface:** `/municipality` (My Municipality Snapshot)  
**Publishing engine:** remains **OFF** (Treasury finance is decoupled)

## 1. API contract (authoritative)

| Item | Value |
|---|---|
| Base URL | `https://municipaldata.treasury.gov.za/api` |
| Docs | `https://municipaldata.treasury.gov.za/docs` |
| Terms | `https://municipalmoney.gov.za/terms` |
| Auth | None (public API; no fabricated credentials) |
| Update cycle | Quarterly Section 71 snapshots |
| Completeness notice (live docs, 2026 Q2) | Data “in the process of being verified for completeness and integrity” |

### Endpoints used

| Purpose | Method | Path |
|---|---|---|
| List cubes | GET | `/cubes` |
| Municipality identity | GET | `/cubes/municipalities/facts?cut=municipality.demarcation_code:{CODE}` |
| Cube model / freshness | GET | `/cubes/{cube}/model` |
| Financial year members | GET | `/cubes/incexp_v2/members/financial_year_end?cut=demarcation.code:"{CODE}"` |
| Operating total | GET | `/cubes/incexp_v2/aggregate?aggregates=amount.sum&cut=...` |
| Operating by function category | GET | `/cubes/incexp_v2/aggregate?...&drilldown=function.category_label` |
| Capital acquisition | GET | `/cubes/capital_v2/aggregate?...&cut=...\|capital_type.code:"NEW";"RENEWAL";"UPGRADING"` |

### Datasets used

| Cube | Role |
|---|---|
| `municipalities` | Identity (code, name, province, category) |
| `incexp_v2` | Operating expenditure (`item.code=4400` Total Expenditure) + major allocations by `function.category_label` |
| `capital_v2` | Capital budget = `NEW` + `RENEWAL` + `UPGRADING` only |

**Not ingested (intentionally):** debtor/creditor analytics, full balance sheet, cash-flow tooling, grants (deferred), officials/mayor.

## 2. Municipality code mapping

Serve SA codes that already match MDB/Treasury demarcation codes are used **identity** (e.g. `JHB`, `CPT`, `TSH`, `EKU`, `ETH`).

Explicit aliases only:

| Serve SA | Treasury | Reason |
|---|---|---|
| `WTS` | `DC48` | West Rand District |
| `SED` | `DC42` | Sedibeng District |
| `DBN` | `ETH` | Legacy eThekwini alias |

**Unmapped:** `MTS` (Metsweding disestablished) — no substitute; never fall back to JHB/TSH finances.

## 3. Financial year policy

- SA municipal FY: 1 July → 30 June.
- `financial_year_end.year` **2026** ⇒ citizen label **2025/26**.
- Select latest year-end with preferred amount-type operating data (`period_length=year`).
- UI never shows bare “Latest”; always `{FY} Municipal Budget ({Amount Type})` (or Actual wording when applicable).

## 4. Amount type policy (citizen Municipal Budget Snapshot)

Preference order: **`ORGB` (Original Budget) → `ADJB` (Adjusted Budget)**.

- Never mix budget with ACT/AUDA/YTD in the same snapshot metrics.
- Internal metadata always stores `amountType` + `amountTypeLabel`.

## 5. Budget normalisation

| Metric | Derivation |
|---|---|
| Operating budget | `incexp_v2` `amount.sum` where `item.code=4400`, `period_length=year`, same FY + amount type (sum across functions) |
| Capital budget | `capital_v2` `amount.sum` for `capital_type` ∈ {NEW, RENEWAL, UPGRADING}; **excludes** DEPRECIATION and REPAIR_MNT |
| Operating + capital | Shown only when both exist for same FY + amount type; labelled explicitly (not a silent “total”) |
| Major allocations | Top function categories from operating Total Expenditure; percentages via deterministic largest-remainder |

## 6. Provenance & trust semantics

Every Treasury metric retains:

`sourceType: national_treasury`, dataset, municipality codes, FY, amount type, retrievedAt, sourceUrl, dataPeriod, verificationState.

Citizen trust copy:

- **Source: National Treasury**
- Completeness warning from Treasury’s own notice when present
- **Not** “independently audited by Serve SA”
- Stronger Serve SA verification language reserved for reviewed IDP/planning artefacts

## 7. Cache / refresh

| Layer | Behaviour |
|---|---|
| Storage | Firestore `municipal_finance_snapshots/{municipalityCode}` (Admin SDK only) |
| Citizen read | Cache only — **no live Treasury calls** on `/municipality` |
| TTL | 7 days fresh; stale-while-revalidate serves last good with `stale_cache` |
| Scheduler | `refreshMunicipalFinanceScheduled` — Sundays 03:00 Africa/Johannesburg |
| Ops callable | `refreshMunicipalFinanceFunction` (official/admin) |
| Failure | Keep last successfully validated snapshot; never overwrite with malformed/empty live data when prior good cache exists |
| Change log | `municipal_finance_snapshot_changes` stores previous/new fingerprints + operating/capital amounts |

## 8. Hybrid product model

| Fact | Source |
|---|---|
| Financial figures | National Treasury (this integration) |
| Priorities / projects | Municipal IDP / planning publishing (engine remains OFF) |
| Mayor / leadership | Separate leadership provenance (not from finance cubes) |

## 9. Security

- `/municipality` remains authenticated
- Municipality identity from claims/profile resolver (no client override)
- No open Treasury proxy to browsers
- Finance cache collections: client read/write **denied**
- Publishing engine flag unchanged (OFF)

## 10. Validation notes (live API sampled 2026-08-12)

| Check | JHB | CPT |
|---|---|---|
| Identity | City of Johannesburg | Cape Town |
| FY / amount type | 2025/26 ORGB | 2025/26 ORGB |
| Operating (4400) | R80 669 613 432 | R71 183 940 671 |
| Capital (NEW+RENEWAL+UPGRADING) | R8 700 420 163 | R12 937 677 817 |
| Operating + capital | R89 370 033 595 | R84 121 618 488 |
| Allocations | 5 GFS categories (100%) | 5 GFS categories (100%) |

Missing-data cases:

| Code | Result |
|---|---|
| `EC103` (Ikwezi) | Identity may resolve; preferred ORGB/ADJB operating absent → empty finance metrics, no zeros invented |
| `MTS` | Unmapped (disestablished) → empty; **no** Tshwane/JHB substitute |

## 11. Licensing

Per Municipal Money Terms of Use: data may be used commercially/non-commercially with **National Treasury acknowledgement** and publication date; do not imply NT endorsement; as-is warranty.

## 12. Automated tests (this branch)

| Suite | Count |
|---|---|
| case-contract treasury | 11 |
| case-contract full | 44 |
| functions treasury | 8 |
| functions full | 58 |
| web unit (incl. treasury) | 50 |
| infra security (planning + publishing + treasury) | 15 |

## 13. Deployment requirements

- **Functions** deploy required (adapter + scheduler + callable + summary merge)
- **Hosting** deploy required (citizen UI sources/budget copy)
- **Firestore rules** deploy required (new cache collections)
- Indexes: none required beyond document-id reads
- **Do not** enable `NEXT_PUBLIC_ENABLE_MUNICIPAL_PUBLISHING_ENGINE`

## 14. Rollout stance

National **adapter** is ready (multi-muni live proof: JHB + CPT + missing/unmapped).  
Citizen **content** activation remains Gauteng allow-list controlled; cache must be refreshed before citizens see figures.  
Do not declare national citizen content GO solely from Johannesburg.
