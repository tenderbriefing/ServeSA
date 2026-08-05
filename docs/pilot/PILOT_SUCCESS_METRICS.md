# Pilot Success Metrics

| Field | Value |
|-------|-------|
| Project | `servesa-aad53` |
| Audience | Pilot sponsor + Serve SA (internal) |
| Public rankings | **Forbidden** — no citizen or inter-municipality league tables |

## Principles

1. Measure **service reliability and cycle time**, not publicity scoreboards.
2. Aggregate at municipality level; no public per-official leaderboards.
3. Prefer counts and rates derivable without exporting PII.
4. Image intelligence metrics stay internal (recommend precision) — never citizen-facing scores.

## Primary metrics (weekly during pilot)

| ID | Metric | Definition | Target (initial) | Source |
|----|--------|------------|------------------|--------|
| M1 | Report success rate | Durable creates / submit attempts | ≥ 95% | Functions + client telemetry (no PII) |
| M2 | GIS match rate | `polygon_match` / creates in-boundary | Record baseline; investigate drops | Case `georesolutionStatus` |
| M3 | Time to acknowledge | Median create → acknowledged | _TBD with muni_ | Case events |
| M4 | Time to first assignment | Median ack → assigned | _TBD_ | Case events |
| M5 | Time to resolve | Median create → resolved | _TBD_ | Case events |
| M6 | Citizen confirm rate | `citizen_confirmed` / resolved | Record only | Lifecycle |
| M7 | Reopen rate | Reopen after resolve / resolved | Investigate if rising | Lifecycle |
| M8 | Duplicate review lag | Median pending → link/dismiss | _TBD_ | `duplicateReview` |
| M9 | Field propose→close lag | Propose completion → official resolve | _TBD_ | Field + ops |
| M10 | Cross-muni deny events | Expected denies vs anomalies | Anomalies = 0 SEV1 | Auth logs (codes only) |

## Reliability metrics

| ID | Metric | Target | Notes |
|----|--------|--------|-------|
| R1 | Callable error rate | < 0.5% | See performance baseline |
| R2 | Georesolve p95 | Within baseline | Cold starts called out separately |
| R3 | Intelligence fail-open rate | Failures do not block create | Internal only |
| R4 | Hosting availability | ≥ 99% pilot week | Synthetic checks |

## Explicitly out of scope

- Public “best ward / best official” rankings
- Publishing duplicate similarity scores
- Comparing municipalities on a public site during pilot
- SLA “AI predictions” as success criteria

## Reporting cadence

| Cadence | Content | Audience |
|---------|---------|----------|
| Weekly | M1–M10 snapshot + incidents | Sponsor + eng (private) |
| End of pilot | Trend, conditions closed, go/no-go for expansion | Sponsor |

Store exports off public git if they include fine-grained staff identifiers. Repo may keep **targets and definitions** only.

## Tie-in

- Launch checklist owners assign names to M3–M9 targets before go-live.
- Master cert: `docs/reports/PILOT_READINESS_CERTIFICATION.md`
- Legacy scorecard ideas in `docs/pilot/KPI_Scorecard.md` must be filtered through **no public rankings** before reuse.
