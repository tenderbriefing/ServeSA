# Community Engagement Runbook

## Surfaces

| Audience | Path | Purpose |
|----------|------|---------|
| Citizen | `/updates`, `/updates/[id]` | Municipal Updates feed + detail |
| Citizen | `/ideas`, `/ideas/new`, `/ideas/[id]` | Ideas list, guided submit, support |
| Ops | `/ops/community` | Updates / Ideas / Insights workspace |

## Privileged callables

- `upsertMunicipalUpdateFunction`, `publishMunicipalUpdateFunction`, `archiveMunicipalUpdateFunction`
- `transitionCommunityIdeaFunction`, `respondToCommunityIdeaFunction`, `addIdeaInternalNoteFunction`
- `submitCommunityIdeaFunction`, `supportCommunityIdeaFunction` (authenticated citizens)
- `list*` / `get*` / `getCommunityInsightsFunction`

Municipality on writes is taken from JWT claims.

## Claims

| Role | Capability |
|------|------------|
| `comms_editor` | Draft/edit updates |
| `comms_publisher` / `official` / `moderator` / `admin` | Publish / archive (+ editor) |
| `field_worker` | No communications edit |

Provision via `setOfficialClaimsFunction` (admin).

## Indexes

Deploy `infra/firestore.indexes.json` composites for `municipal_updates` and `community_ideas` before production traffic.

## Feature flag

`NEXT_PUBLIC_ENABLE_COMMUNITY=false` hides citizen Updates engagement flag checks (default enabled).

## Rollback

1. Redeploy prior Hosting + Functions SHA (exclude GIS revision changes).
2. Rules: prior `firestore.rules` / `storage.rules`.
3. Leave new collections in place (additive); stop serving UI routes if needed.
4. Do **not** re-open unauthenticated push/email callables.
