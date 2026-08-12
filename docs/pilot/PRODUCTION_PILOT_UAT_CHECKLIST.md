# Production pilot UAT checklist

Repeatable checklist for authenticated Firebase UAT before production pilot.

## Prerequisites

- PR #20 merged (or branch deployed to staging)
- `docs/reports/evidence/uat_tokens.env` provisioned (`npm run pilot:uat-identities`)
- `NEXT_PUBLIC_ENABLE_MUNICIPAL_PLANNING` not set to `false`
- For publishing engine pilot: `NEXT_PUBLIC_ENABLE_MUNICIPAL_PUBLISHING_ENGINE=true` + allow-list

## Merge order (Phase 1.1)

1. Review and merge **PR #20** (`feat/auth-gated-our-municipality`) — includes cinematic landing from #19
2. Close **PR #19** as superseded (do not merge #19 after #20)
3. Deploy hosting + functions from merged `main`
4. Branch publishing engine work from merged `main` or continue on `feat/municipal-publishing-engine`

## Citizen happy path

| Step | Expected |
|------|----------|
| Anonymous `/` | Landing loads; no Our Municipality preview with fake JHB data |
| Sign up | Account created; municipality optional |
| Login unresolved | Municipality confirmation UI |
| Save municipality | Profile updated; `refreshProfile()` updates dependent screens |
| `/municipality` | Auth gate; scoped planning data or honest empty state |
| `/updates`, `/ideas` | Scoped to profile municipality |
| `/report` | Case flow unchanged |
| `/account` | Change municipality with confirm step |
| Logout | Municipality nav hidden |
| Re-login | Saved municipality persists |

## Google Sign-In

| Step | Expected |
|------|----------|
| Google signup | Profile without municipality if needed |
| Confirmation UI | Appears when unresolved |
| Save municipality | Authenticated surfaces update without hard reload |

## Security

| Check | Expected |
|-------|----------|
| Citizen profile write | Only `province`, `municipalityCode`, `updatedAt` (and phone in complete profile) |
| No role elevation | No `roles`, `claims`, staff fields in client writes |
| Cross-muni staff | Denied via JWT claims |
| Unpublished planning files | Not readable by citizens (Storage rules deny client paths) |

## Publishing engine (pilot flag ON)

| Step | Expected |
|------|----------|
| Ops upload PDF/DOCX | SHA-256 recorded; duplicate rejected |
| Process | Draft generated; `publicationStatus=awaiting_review` |
| Review UI | Source left / draft right; edit, approve, publish |
| Publish | Requires approve + publisher role; citizen sees published sources only |
| AI failure | Source file still accessible; extraction_failed state |

## Automated coverage

```bash
npm run test:unit --workspace=@servesa/web
npx playwright test apps/web/tests/e2e/productionSmoke.spec.ts
# Authenticated (requires uat_tokens.env):
set -a && source docs/reports/evidence/uat_tokens.env && set +a
npx playwright test --grep @pilot
```

## Evidence

Record results in `docs/reports/evidence/` — do not mark skipped auth tests as passed.
