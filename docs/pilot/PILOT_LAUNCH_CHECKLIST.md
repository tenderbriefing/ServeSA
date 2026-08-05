# Pilot Launch Checklist

Project: `servesa-aad53` · Branch context: `cert/pilot-readiness-hardening` · Starting tip: `052161e` · Prior OI: `e90fdc0` / cert `405839d`

Mark each item `[x]` only with evidence. Items left open keep overall verdict at **PASS WITH CONDITIONS** or block launch if marked blocking.

## A. Configuration (blocking)

- [ ] `PILOT_CONFIGURATION_TEMPLATE.md` fully filled (code, departments, maps, officials)
- [ ] GIS code matches MDB wards (`municipalityCode` real)
- [ ] Admin + ≥1 official + ≥1 field_worker claims provisioned and re-login verified
- [ ] Category→department maps cover pilot categories; triage path understood

## B. Product smoke (blocking)

- [ ] `/report` create → durable case + media path (synthetic)
- [ ] GIS `polygon_match` or controlled unresolved → triage (resolver still `…-kuy`)
- [ ] `/ops` Smart Work Queue lists only pilot muni cases
- [ ] Lifecycle ack → assign → in progress → resolve → close
- [ ] Duplicate review link/dismiss; **no** auto-merge
- [ ] Cross-muni access denied (control account)
- [ ] `/ops/supervisor` counts navigate to filtered queues
- [ ] `/ops/map` loads muni features without contact PII
- [ ] `/field` start work + propose completion; offline draft note saves locally
- [ ] `/case` citizen timeline; confirm / reopen; no scores/internal notes

## C. Security & invariants (blocking)

- [ ] No GIS weaken / no image→muni inference verified this build
- [ ] Intelligence fail-open observed or unit/smoke referenced
- [ ] No face recognition / no speculative AI SLA dependency
- [ ] Deploy SHA recorded in `DEPLOYMENT_REGISTRY.md` (not placeholder)

## D. Operations readiness (blocking for go-live)

- [ ] `PILOT_UAT_SCRIPT.md` executed; failures triaged
- [ ] `PILOT_INCIDENT_RESPONSE.md` contacts filled (secure roster)
- [ ] Municipal admin + official + field guides circulated
- [ ] Success metrics owners assigned (`PILOT_SUCCESS_METRICS.md`) — **no public rankings**

## E. Platform (non-blocking unless dated)

- [ ] Performance baseline first measurements captured or explicitly deferred with owner
- [ ] Production rollback drill evidenced **or** scheduled before public announcement
- [ ] WIF migration status noted (ADR); JSON key interim accepted
- [ ] Node 20 upgrade plan acknowledged (deadline 2026-10-31)
- [ ] Observability: error rates, georesolve latency, cold starts dashboards shared (PII-safe)

## F. Go / No-go

| Decision | Criteria |
|----------|----------|
| **GO** | A–D complete; E deferred items have owners/dates; master cert conditions accepted |
| **GO WITH CONDITIONS** | A–C complete; listed D/E gaps accepted by sponsor |
| **NO-GO** | Any invariant failure, missing SHA, or empty municipal config |

**Launch decision:** _TBD_  
**Deployed SHA:** _to be filled at close_  
**Sign-off:** _TBD_
