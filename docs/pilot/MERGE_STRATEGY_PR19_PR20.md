# Merge strategy — PR #19 vs PR #20

## Current state

| PR | Branch | Status |
|----|--------|--------|
| #20 | `feat/auth-gated-our-municipality` | Open — **merge target** |
| #19 | `feat/public-landing-cinematic-storytelling` | Open — **superseded by #20** |

Certified SHA on #20: `4a1433244a25e1f2119d6486f2a8edabca293da7`

## Ancestry

PR #20 already contains all cinematic landing commits from #19. Merging #19 after #20 risks reverse conflicts or duplicate history.

## Recommended order

1. Final review of PR #20 (CI green, no security regressions)
2. Merge **#20** → `main` only
3. Close **#19** with comment: superseded by #20
4. Deploy from `main` per release runbook (not automatic)
5. Branch `feat/municipal-publishing-engine` from merged `main` for publishing work

## Do not

- Merge #19 and #20 in parallel without checking diff ancestry
- Re-introduce anonymous Visual IDP / JHB citizen fallback
- Weaken Firestore or Storage rules for pilot convenience

## Publishing engine follow-on

After #20 is on `main`, merge publishing engine PR separately behind `NEXT_PUBLIC_ENABLE_MUNICIPAL_PUBLISHING_ENGINE`.
