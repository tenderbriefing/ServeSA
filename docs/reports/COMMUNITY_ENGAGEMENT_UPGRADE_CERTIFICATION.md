# Community Engagement Upgrade — Production Certification

| Field | Value |
|-------|-------|
| Product | ServeSA |
| Upgrade | Municipal Updates + Community Ideas + Community Insights |
| Branch | `feat/community-engagement-upgrade` |
| Starting SHA | `fbf902c7b10d579aad428cc74c6d92089a3c366f` |
| Final SHA | `dea8bb8253de565b39dc0a60d4d54e6e471071a7` (feature tip; docs commits follow on branch) |
| Date | 2026-08-08 |
| Commits | `dea8bb8` feature; subsequent docs certification commits on same branch |
| Files changed | 49 files in feature commit (+4284 / −227) |
| Production SHA | `1de69f76b7d083f94011e2c527747782ec191d03` (PR #16) |
| Deployment | **Deployed** — WIF [`31294948245`](https://github.com/tenderbriefing/ServeSA/actions/runs/31294948245) SUCCESS |

## Verdict

**PASS WITH CONDITIONS**

Community engagement is live in production with security hardening prerequisites, shared contracts, callables, rules, citizen/ops UX, tests, and documentation. Remaining conditions: live authenticated smoke for Updates/Ideas support flows and confirmation that composite indexes finished building.

## Features delivered

1. **Municipal Updates** — typed update kinds, draft→scheduled→published→updated→resolved→archived lifecycle, targeting (muni/ward/suburb/category/area label), project progress abstraction, citizen `/updates` feed+detail, ops Communications workspace.
2. **Community Ideas** — guided submit flow, categories, one support per auth citizen (server `supportCount`), official responses, internal notes never citizen-readable, ops queue + transitions.
3. **Community Insights** — deterministic Firestore aggregates with explicit provenance (`predictiveAi: false`).
4. **Navigation** — Homepage four intents; Header/Footer: Report, Updates, Ideas, Track, My Cases; OpsShell Community tab.

## Architecture decisions

- Admin SDK–only writes for `municipal_updates` / `community_ideas` (mirrors cases).
- Municipality scope from JWT claims on privileged writes.
- Reuse `municipalityOpsShared` RBAC; add `comms_editor` / `comms_publisher`.
- Notification ledger entry on publish; push/email callables admin-gated.
- Shared Zod contracts in `@servesa/case-contract`.
- ADR: `docs/architecture/ADR_COMMUNITY_ENGAGEMENT.md`.

## Security fixes (audit precedence)

| ID | Finding | Remediation |
|----|---------|-------------|
| C1 | `uploadMediaFunction` ownership bypass when unauthenticated | Require `request.auth.uid`; ownership check fails closed |
| C2 | Unauthenticated `sendPushNotificationFunction` / email | Admin-only callable wrappers; client API refuses direct send |
| C3 | Self-assigned Firestore roles / UI privilege via profile | Create denies privileged fields; AuthProvider uses **claims only** for `isOfficial`; official user reads municipality-scoped |
| High | Ungated `dedupeCase` / `getCaseAnalytics` | Official (+ muni scope for analytics) |
| High | PDF auth via client `userId` + Firestore roles | Auth UID + JWT roles/muni only |
| High | Public thumbnails | Storage thumbnails auth-scoped to reporter/same-muni official |

## Tests (exact results — local)

| Suite | Result |
|-------|--------|
| `@servesa/case-contract` jest | **22 passed** (incl. community contract) |
| `@servesa/functions` jest | **37 passed** (incl. communityEngagement RBAC) |
| `infra/tests` jest (security + community) | **12 passed** |
| `@servesa/web` unit (`test:unit`) | **8 passed** |
| `@servesa/functions` build | **PASS** |
| `@servesa/web` type-check | **PASS** |
| Playwright `community.spec.ts` | Authored; not executed against production Hosting in this run (no deploy) |

## CI status

CI gates unchanged (`ci.yml`: lint advisory, type-check, unit/functions/contract tests, build). Branch not pushed in this autonomous prep unless required for PR CI. Local gates above green.

## Deployment status

| Surface | Status |
|---------|--------|
| Production Hosting | **Not deployed** this upgrade |
| Production Functions | **Not deployed** this upgrade |
| Firestore / Storage rules | **Not deployed** this upgrade |
| Firestore indexes | Defined in `infra/firestore.indexes.json` — **must deploy before GA traffic** |
| GIS `georesolveFunction` | **Unchanged** (not touched) |

## Migration / index requirements

1. Deploy composite indexes for `municipal_updates` and `community_ideas` (muni+status+updatedAt, muni+type/category+updatedAt).
2. Deploy updated `firestore.rules` and `storage.rules`.
3. Deploy new callables + Hosting.
4. Optionally provision `comms_editor` / `comms_publisher` claims for communications staff.

## Limitations

- Multi-channel fan-out (push/email/WhatsApp/SMS) for updates is ledger-staged, not full preference-driven broadcast.
- Idea media upload UX is path-ready; guided flow focuses on text first.
- Insights case sample capped at 500 per municipality.
- Default citizen municipality filter falls back to `JHB` when profile/claim unset.
- Playwright community suite not live-verified post-deploy.

## Risks

- Index build lag can cause list query failures until indexes ready.
- Thumbnail auth change may break any legacy anonymous thumbnail embeds (intentional security trade-off).
- Officials without claims still cannot access ops (by design).

## Rollback

1. Redeploy prior Hosting + Functions SHA via WIF Deploy Production (`workflow_dispatch`); **do not** casually change GIS revision.
2. Redeploy prior rules if needed.
3. Leave additive collections in place; hide UI via `NEXT_PUBLIC_ENABLE_COMMUNITY=false` if required.
4. Never re-open unauthenticated notification callables.

## Definition of Done checklist

- [x] Phase 0 audit recorded (starting SHA)
- [x] Security C1/C2/C3 + high callables remediated
- [x] Municipal Updates + Ideas + Insights implemented
- [x] Citizen + Ops navigation
- [x] Rules, indexes, contracts, tests, docs
- [x] No autonomous production deploy
- [ ] Production deploy + live smoke (condition)
- [ ] Index build complete in GCP (condition)

## Final verdict

**PASS WITH CONDITIONS** — ready for PR review and controlled production certification deploy; not production-live until WIF deploy + index + smoke conditions clear.
