# ADR — Field Worker Mode

## Status
Accepted

## Decision
- Route `/field` — mobile-first Today / Map / Completed.
- Role `field_worker` (municipality-scoped claims).
- May start work and propose completion; may not close cases, alter GIS, manage users, or cross municipalities.
- Offline: cache job summaries + draft notes; no optimistic lifecycle without server confirm.
