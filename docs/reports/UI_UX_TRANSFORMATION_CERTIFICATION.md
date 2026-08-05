# Serve SA — UI/UX Transformation Certification

## 1. Executive verdict

**PASS WITH CONDITIONS**

The mandatory language-selector and US-flag removals are complete and covered by automated tests. Citizen information architecture, civic design tokens, homepage clarity, report-flow guidance, mobile/accessibility hardening, and staff/citizen shell separation are implemented and verified by production build plus Playwright/unit suites on this branch. Conditions: (a) production Hosting deploy remains gated on review and was **not** performed; (b) authenticated token-backed pilot UAT paths were skipped locally where tokens were unset; (c) full Storybook does not exist in-repo so component gallery certification is N/A; (d) remaining ops hook exhaustive-deps lint warnings are pre-existing and non-blocking.

## 2. Starting SHA

`c4613b5533a323a173fbdd45ede2a1de689094bd` (`main` at branch creation)

## 3. Final SHA

`PENDING_FINAL` — replaced immediately after this certification commit lands.

## 4. Branch

`feat/ui-ux-transformation`

## 5. PR number

[#6](https://github.com/tenderbriefing/ServeSA/pull/6)

## 6. Problems identified (P0 / P1 / P2)

### P0
- Language selector with **🇺🇸** for English created false multilingual expectation
- Homepage behind AuthGate blocked anonymous understanding of the service
- Citizen nav exposed internal/placeholder destinations (Explore, Community, Messaging, Budget, GIS-adjacent jargon risk)
- Unsupported i18n stack implied languages not actually productised

### P1
- Startup-style gradient homepage with over-promised stats/response times
- Default Johannesburg lat/lng in location step
- Profile modal could interrupt reporting
- Citizen and staff chrome mixed on ops routes
- Forms lacked consistent SA phone guidance and error summaries
- Duplicate/placeholder admin and marketing surfaces diluted trust

### P2
- Fragmented UI primitives; no single token source of truth
- Weak empty/loading frameworks on My Cases
- Touch targets and 16px input floor inconsistent
- Footer linked to missing routes (`/contact`, `/faq`, `/cookies`)

## 7. Pages removed

- `/admin`, `/admin/dashboard`, `/admin/data`
- `/explore`, `/community`, `/community/guidelines`
- `/messaging`, `/municipality`, `/budget`, `/training`
- `/bulk-report`, `/anonymous-report`, `/evidence`
- Legacy root `src/app` scaffold (non-`apps/web`)

## 8. Pages consolidated

- Public chrome → `AppShell` + `Header` + `Footer`
- Staff chrome → `OpsShell` (bare AppShell on `/ops*` and `/field*`)
- Homepage rewritten as the single citizen entry narrative
- Auth (`/auth`, `/auth/signin`) share improved Login/Signup forms
- My Cases (`/dashboard`) is the authenticated citizen case list (not staff)

## 9. Navigation changes

Citizen primary: **Report an Issue**, **Track a Case**, **My Cases**  
Utilities: Notifications, Help, Sign in / Create account, Staff console (role-gated)  
Removed from citizen nav: Explore, Community, Messaging, Bulk/Anonymous/Evidence/Training/Budget/Municipality, LanguageSwitcher  
Staff: Queue, Cases, Map, Supervisor, Team, Settings, Field + link back to citizen site

## 10. Onboarding improvements

- Three short steps; Esc/Skip closes; does not block reporting
- Auto profile-completion modal disabled (profile remains optional)
- Signup province/municipality optional; staff role self-selection removed

## 11. Report-flow improvements

- Stepper: What → Where → Who & photos
- Mandatory photo retained with clearer guidance
- No default lat/lng; GPS only on explicit action; address/pin alternatives
- Routing-pending copy: “We are confirming which authority should receive this report.”
- Draft autosave retained; submit lock / idempotent clientRequestId retained
- Specific failure copy preserves answers on device

## 12. Mobile improvements

- Touch targets ≥44px on primary controls
- Inputs ≥16px to avoid iOS zoom
- Mobile menu with Escape close + focus return
- Viewport checks at 320/360/375/390/414 in Playwright
- Ops gains mobile nav drawer

## 13. Accessibility improvements

- Skip link to main content
- Semantic headings/landmarks; dialog roles on onboarding
- Visible focus tokens; `prefers-reduced-motion` respected
- StatusBadge uses shape + colour
- Form labels, autocomplete, error summaries on signup
- Location not map-only

## 14. Performance improvements

- Route surface reduced (fewer static pages / JS graphs)
- Home first-load JS reduced vs prior AuthGate+marketing stack
- Static export build green (21 routes)
- Design tokens CSS variables avoid runtime theme thrash

## 15. Copywriting improvements

- Headline: “Report local service issues and track progress.”
- SA English; no American flag metaphor; SA mobile examples (`082 123 4567`)
- Honest officialness disclaimer; emergency services boundary
- Removed fabricated resolution-rate / 24h marketing claims from home

## 16. Design-system changes

- Tokens in `apps/web/src/app/globals.css` + `apps/web/src/lib/design-tokens.ts`
- Tailwind maps to RGB channel tokens (navy primary, teal secondary, gold accent)
- Shared: EmptyState, LoadingSkeleton/Spinner, StatusBadge, AlertBanner, Stepper, PageHeader, AppShell
- Button/Input floors for touch and 16px text

## 17. Confirmation — language options removed

Verified by:
- Deletion of `LanguageSwitcher` components and `apps/web/src/i18n/**`
- Removal of `i18next` / `react-i18next` / `next-i18next` dependencies
- Static unit test `apps/web/tests/unit/language-absence.test.mjs`
- Playwright `@uiux` suite asserting no language controls on key routes

## 18. Confirmation — US flag removed

Verified by:
- Source scan: no `🇺🇸` under `apps/web/src`
- Playwright assertions on `/`, `/report`, `/auth`, `/help`, `/case`, mobile menu

## 19. Automated test results

| Suite | Result |
| --- | --- |
| `npm run test:unit -w @servesa/web` | **4/4 pass** |
| Playwright `ui-ux.spec.ts` + `citizen.spec.ts` + `report.spec.ts` | **16 pass, 1 skipped** (token optional) |
| Playwright `@pilot` | **11 pass, 5 skipped** (tokens unset) |
| `@servesa/case-contract` Jest | **15/15 pass** |
| `@servesa/functions` Jest | **32/32 pass** |
| Image similarity fixtures | **pass** |
| Synthetic load bench | **pass** |

Evidence: `docs/reports/evidence/ui-ux/`

## 20. Build results

| Check | Result |
| --- | --- |
| `npm run type-check -w @servesa/web` | **pass** |
| `npm run type-check -w @servesa/functions` | **pass** |
| `npm run lint -w @servesa/web` | **pass** (2 pre-existing hooks warnings in ops pages) |
| `npm run build -w @servesa/web` | **pass** — static export, 21 routes |

## 21. Screenshots / evidence refs

- `docs/reports/evidence/ui-ux/homepage.png`
- `docs/reports/evidence/ui-ux/homepage-mobile-menu.png`
- `docs/reports/evidence/ui-ux/report.png`
- `docs/reports/evidence/ui-ux/playwright_uiux.txt`
- `docs/reports/evidence/ui-ux/playwright_pilot.txt`
- `docs/reports/evidence/ui-ux/unit_language_absence.txt`
- `docs/reports/evidence/ui-ux/web_typecheck.txt`
- `docs/reports/evidence/ui-ux/web_lint.txt`

## 22. Known limitations

- No production deploy (governance)
- Token-backed authenticated pilot scenarios skipped without UAT env
- Help content still largely static FAQ (not a full CMS)
- Case track page UX improved indirectly; deep timeline polish remains iterative
- Map still optional assistive UI — not a full interactive GIS redesign
- Pre-existing ops `useEffect` dependency lint warnings remain

## 23. Rollback instructions

```bash
git checkout main
git pull
git branch -D feat/ui-ux-transformation   # local only
# If PR merged: revert merge commit
git revert -m 1 <merge_commit_sha>
# Do not force-push main. Redeploy Hosting only after review.
```

Hosting public dir remains `apps/web/out` after a reviewed build.

## 24. Final recommendation

Merge after required review. Prioritise a follow-up PR for authenticated UAT with provisioned tokens and any remaining help/content polish. Do **not** reintroduce multilingual UI until full localisation, content ops, and QA exist. Keep citizen and staff shells separate.

---

### Amendment log

- Certification authored on branch `feat/ui-ux-transformation`.
- Pull request: https://github.com/tenderbriefing/ServeSA/pull/6
- Final SHA recorded in the commit that adds this file.
