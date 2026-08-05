# Performance Baseline — Pilot Readiness

| Field | Value |
|-------|-------|
| Project | `servesa-aad53` |
| Region | `africa-south1` |
| Branch context | `cert/pilot-readiness-hardening` |
| Starting tip | `052161e` |
| Prior OI tip | `e90fdc0` |
| Measurement window | Synthetic local bench 2026-08-05; production latency TBD week 1 |
| Owner | Platform / SRE |

## Purpose

Record operational latency/reliability baselines for pilot support **and** local synthetic filter/sort benches.

---

## A. Production / staging observability (pilot)

### Baseline table

| Metric | Target (pilot) | Measured | Method / note |
|--------|----------------|----------|---------------|
| `createCaseFunction` p50 latency | < 3s warm | TBD week 1 | Exclude cold start |
| `createCaseFunction` p95 latency | < 8s warm | TBD week 1 | |
| `georesolveFunction` p50 | < 500ms warm | TBD week 1 | GIS rev `…-kuy` |
| `georesolveFunction` p95 | < 2s warm | TBD week 1 | |
| `georesolve` error rate | < 1% (infra) | TBD week 1 | Distinct from legitimate `unresolved` |
| `uploadMediaFunction` p95 | < 10s (small JPEG) | TBD week 1 | |
| Image intelligence completion (async) | fail-open; p95 < 60s when Storage readable | TBD week 1 | Must not block create/ack |
| Ops Smart Queue callable p95 | < 3s | TBD week 1 | Muni-scoped |
| `listMapCasesFunction` p95 | < 3s | Prior OI: 15 features JHB | |
| Hosting `/report` `/ops` `/field` `/case` availability | 99% pilot week | Smoke 30/30 PASS 2026-08-05 | `docs/reports/evidence/prod_smoke_30.txt` |
| Function cold start (Gen2) p95 | Record only | TBD | |
| Callable 5xx rate (aggregate) | < 0.5% | TBD week 1 | |

### What to monitor (PII-safe)

Prefer structured log fields: `caseId`, `municipalityCode`, `revision`, `latencyMs`, `code`. Never log reporter contact fields or duplicate score payloads to shared dashboards.

---

## B. Synthetic local bench (non-production)

**Corpus:** 1000 active + 10 000 historical case-shaped objects.  
**Does not** write to or read production Firebase.

Evidence: `docs/reports/evidence/loadtest_baseline.json` (generated 2026-08-05T14:49:22Z)

| Operation | p50 (ms) | p95 (ms) | mean (ms) |
|-----------|----------|----------|-----------|
| smart_queue_filter_sort | 0.22 | 0.45 | 0.26 |
| map_filter | 0.01 | 0.03 | 0.01 |
| list_pagination | 0.29 | 0.35 | 0.30 |
| geohash_bucket | 0.55 | 0.65 | 0.57 |

**Hardening applied:** none required — local filter/sort p95 ≪ 25ms. Production path still uses bounded Firestore queries (`limit` ≤ 120). Concurrent-user profile for pilot: assume ≤ 25 concurrent staff + citizen bursts; no production write load test executed this sprint.

## Related

- Master cert: `docs/reports/PILOT_READINESS_CERTIFICATION.md`
- Incident response: `docs/runbooks/PILOT_INCIDENT_RESPONSE.md`
