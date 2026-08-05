# ADR — Operations Map

## Status
Accepted

## Decision
- Route `/ops/map` for authorised municipal users.
- Server callable `listMapCasesFunction` — municipality-bounded, minimal payload (no contact PII).
- Client projects markers locally; OSM handoff for navigation.
- Does not alter coordinates from image content.
