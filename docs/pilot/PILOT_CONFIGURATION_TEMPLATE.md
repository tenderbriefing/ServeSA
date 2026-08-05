# Pilot Configuration Template — One Municipality

| Field | Value |
|-------|-------|
| Template version | 1.0 |
| Project | `servesa-aad53` |
| Hosting | https://servesa-aad53.web.app |
| GIS dataset | `mdb-wards-2020-v1` |
| GIS resolver | `georesolvefunction-00002-kuy` (`ST_COVERS`) |
| Fill before go-live | Replace all `_TBD_` |

Use with `docs/runbooks/MUNICIPALITY_ONBOARDING.md`. Official municipality code **must** match GIS (e.g. `JHB`) — never invent codes from images or staff preference.

---

## 1. Municipality identity

| Field | Pilot value |
|-------|-------------|
| Display name | _TBD_ |
| `municipalityCode` (GIS) | _TBD_ (e.g. `JHB`) |
| Province | _TBD_ |
| Pilot start date | _TBD_ |
| Pilot end / review date | _TBD_ |
| Primary contact (role only in public docs) | Municipal admin |
| Internal roster location | _off-repo / secure_ |

---

## 2. Departments

Create via `/ops/settings` or `upsertDepartmentFunction`. Example set — adjust to municipal organogram:

| departmentId | Display name | Active |
|--------------|--------------|--------|
| `water` | Water & Sanitation | yes |
| `electricity` | Electricity | yes |
| `roads` | Roads & Stormwater | yes |
| `waste` | Waste Management | yes |
| `internet` | Digital / ICT | optional |
| `emergency` | Emergency Services | optional |
| `triage` | Routing Triage (catch-all) | yes |

_Pilot values:_ _TBD — list final IDs_

---

## 3. Category → department map

Citizen categories (canonical) from product: `water`, `electricity`, `roads`, `waste`, `internet`, `emergency`.

| Category | departmentId | Notes |
|----------|--------------|-------|
| water | _TBD_ | |
| electricity | _TBD_ | |
| roads | _TBD_ | |
| waste | _TBD_ | |
| internet | _TBD_ | |
| emergency | _TBD_ | |

Unmapped categories → `triageQueue=true`. Do not guess.

---

## 4. Officials and claims

Provision with `setOfficialClaimsFunction` (admin). User must sign out/in after claims change.

| Auth email (internal) | uid | roles | municipalityCode | departmentId | Notes |
|-----------------------|-----|-------|------------------|--------------|-------|
| _TBD_ | | `["admin"]` or municipal admin pattern | _code_ | | Bootstrap only |
| _TBD_ | | `["official"]` | _code_ | e.g. `roads` | Desk ops |
| _TBD_ | | `["official"]` | _code_ | | Supervisor user of `/ops/supervisor` |
| _TBD_ | | `["field_worker"]` | _code_ | | `/field` only as needed |

**Rules**

- Every non-admin official/field worker **must** have matching `municipalityCode`.
- Field workers: no close-case, no GIS edits, no cross-muni.
- Admins may be global — minimise admin accounts in pilot.

---

## 5. Feature flags / pilot posture

| Flag / posture | Pilot default | Notes |
|----------------|---------------|-------|
| Citizen `/report` + mandatory image | **ON** | Live |
| Image intelligence (hash/phash recommend) | **ON** | Fail-open; no auto-merge |
| Auto-merge | **OFF** (hard invariant) | |
| Multimodal / embeddings AI | **OFF** | Deferred |
| Face recognition | **OFF** | |
| Speculative AI SLA engine | **OFF** | |
| Smart Work Queue `/ops` | **ON** | |
| Supervisor board `/ops/supervisor` | **ON** | |
| Ops map `/ops/map` | **ON** | |
| Field mode `/field` | **ON** | Offline = drafts + cache only |
| Citizen confirm / reopen | **ON** | |
| Public rankings / league tables | **OFF** | Never enable for pilot |
| WIF deploy auth | Preferred; JSON key interim | See ADR |

Record any env/config toggles used in production here when they exist: _TBD_

---

## 6. Smoke / acceptance anchors

| Item | Value |
|------|-------|
| Synthetic test ward / point | _TBD_ (prefer known `polygon_match`) |
| Baseline ops case (historical) | `CASE-MSFN98YW-0TQWX7` (JHB reference only) |
| OI duplicate pair (historical) | `CASE-MSFZ5GAE-H8KDCP` / `CASE-MSFZ5H52-79EE5V` |
| Pilot UAT sheet | `docs/pilot/PILOT_UAT_SCRIPT.md` |

---

## 7. Sign-off

| Role | Name | Date |
|------|------|------|
| Municipal sponsor | | |
| Municipal admin | | |
| Serve SA pilot lead | | |

Configuration incomplete ⇒ do not claim launch PASS.
