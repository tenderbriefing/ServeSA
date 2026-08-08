# ADR: Municipality Operations Workspace

- Status: Accepted
- Date: 2026-08-05

## Context

Citizen reporting and authoritative GIS routing are production-certified. Municipal staff need a daily operational workspace without weakening GIS tenancy or inventing municipalities.

## Decisions

1. **Ops surface** lives at `/ops` (Dashboard, Cases, **Community**, Case detail, Team, Settings, Map, Supervisor) — not an admin analytics portal.
2. **All privileged mutations** (status, assign, notes, public updates, departments, claims, municipal updates, idea moderation) are Cloud Functions / Admin SDK only. Clients cannot write `cases` / `municipal_updates` / `community_ideas`.
3. **GIS resolver is unchanged.** Department routing runs only after `georesolutionStatus === polygon_match` with an official `municipalityId`.
4. Unresolved / ambiguous / unmapped category → `triageQueue=true`; never guess municipality or department.
5. **Internal notes** and **public updates** are separate subcollections (cases and ideas).
6. Custom claims (`roles`, `municipalityCode`) gate Firestore reads and callable auth. Profile `roles` are never trusted for privilege.

## Consequences

- Officials require claim provisioning (`setOfficialClaimsFunction`).
- Category→department maps are per-municipality configuration.
- Citizen `/report` path remains independent.
