# Pilot UAT Script

Maps interactive acceptance to **Playwright / role-based** coverage. Existing automated seed: `apps/web/tests/e2e/report.spec.ts` (citizen `/report` stubs). Extend Playwright with the role projects below; until then, execute rows **manually** and tick evidence.

| Field | Value |
|-------|-------|
| Project | `servesa-aad53` |
| Hosting | https://servesa-aad53.web.app |
| Config | `docs/pilot/PILOT_CONFIGURATION_TEMPLATE.md` |
| Related | `docs/pilot/OPERATIONAL_INTELLIGENCE_UAT.md` |

## Role matrix (Playwright projects — target)

| Playwright project / grep | Auth | Primary routes |
|---------------------------|------|----------------|
| `citizen` | Anonymous or citizen account | `/report`, `/case` |
| `official` | `roles: ['official']` + `municipalityCode` | `/ops`, `/ops/case`, duplicate review |
| `supervisor` | official (same claims; supervisor UX) | `/ops/supervisor`, `/ops/map` |
| `field_worker` | `roles: ['field_worker']` + muni | `/field` |
| `cross_muni` | official other muni | Negative tests |
| `admin` | `roles: ['admin']` | Claims / settings bootstrap |

Tag tests `@pilot` for the launch suite.

---

## Script

### R1 — Citizen report (`citizen` / `report.spec.ts`)

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1 | Open `/report` | Report UI loads | |
| 2 | Select category, title, description, priority | Validation OK | |
| 3 | GPS within SA (stub or device) | Location summary | |
| 4 | Mandatory image attached | Cannot submit without media contract | |
| 5 | Submit | Durable `caseId`; share URL `/case…` | |
| 6 | GIS | `polygon_match` or unresolved→pending — **not** image-invented muni | |

_Automation:_ extend `report.spec.ts` beyond stubbed create when live credentials available.

### R2 — Citizen timeline (`citizen`)

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1 | Open `/case?id=…` | Safe milestones only | |
| 2 | Confirm no duplicate scores / internal notes | Hidden | |
| 3 | When resolved: Confirm / Still unresolved | `citizen_confirmed` or reopen → `acknowledged` | |

### R3 — Official queue (`official`)

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1 | Sign in → `/ops` | Smart Work Queue for **one** muni | |
| 2 | Open case → acknowledge → assign → in progress → resolve → close | Server-controlled lifecycle | |
| 3 | Internal note vs public update | Citizen sees public only | |
| 4 | Duplicate review: link or dismiss | Audited; **no** auto-merge | |

### R4 — Supervisor (`supervisor`)

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1 | `/ops/supervisor` | Actionable counts only | |
| 2 | Click metric | Filtered `/ops` bucket | |
| 3 | Workload list | Open cases by assignee — **no public rankings** | |
| 4 | `/ops/map` | Markers; no contact PII in payload | |

### R5 — Field (`field_worker`)

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1 | `/field` Today | Assigned/related jobs only | |
| 2 | Navigate | OSM handoff | |
| 3 | Start work (online) | Server-confirmed `in_progress` | |
| 4 | Draft note offline | localStorage; lifecycle blocked offline | |
| 5 | Propose completion | Awaits official; cannot close / edit GIS | |

### R6 — Negatives (`cross_muni`)

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1 | Official A opens Official B muni case | Denied | |
| 2 | Link duplicate across munis | Denied | |
| 3 | Field worker lists unrelated jobs | Empty / denied | |

### R7 — Invariants spot-check (`admin` or eng)

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1 | GIS revision | `georesolvefunction-00002-kuy` | |
| 2 | Intelligence failure injection (if available) | Create/ack still works (fail-open) | |
| 3 | Deploy SHA | Matches registry | |

---

## Evidence log

| Date | Operator | Build SHA | Result | Notes (no PII) |
|------|----------|-----------|--------|----------------|
| | | _to be filled_ | TBD | |

Do not claim full pilot UAT PASS until R1–R6 are evidenced for the configured municipality.
