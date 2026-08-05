# ADR — Incident Grouping

## Status
Accepted — lightweight linking first

## Decision
- Preserve immutable citizen cases.
- `incidentLink` on each case: `primaryCaseId`, `linkedCaseIds`, `role` (`standalone` | `primary` | `linked_support` | `merged_support`).
- Operational merge sets `operationalLocked` on support cases; no hard delete.
- Unlink restricted to manager/admin with audit.

## Non-goals
- Full separate `incidents` collection (deferred until pilot proves need).
