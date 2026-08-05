import { test, expect } from '@playwright/test'
import {
  expectPageLoads,
  injectSyntheticAuth,
  UAT_TOKENS,
  hasToken,
} from './helpers/uat'

/**
 * Isolation UAT — cross-municipality and suspended-user paths.
 *
 * Documents expected behaviour:
 * - Ops / field / supervisor require auth; unauthenticated visitors must not see
 *   another municipality's case lists or map features.
 * - Cross-muni isolation is enforced server-side via custom claims (municipalityCode);
 *   without synthetic tokens we assert the client gate (redirect / sign-in / empty).
 * - Suspended / disabled accounts: Firebase Auth surfaces auth/user-disabled on
 *   sign-in; there is no dedicated suspended UI page — assert sign-in still loads
 *   and optional suspended token does not unlock ops queue rows.
 */
test.describe('Isolation UAT @pilot', () => {
  test('cross-muni ops pages do not leak case lists without auth @pilot', async ({
    page,
  }) => {
    for (const path of ['/ops', '/ops/supervisor', '/ops/map', '/ops/cases', '/field']) {
      await expectPageLoads(page, path)
      // No case deep-links from queue without authenticated official session
      const caseLinks = page.locator('a[href*="/ops/case?id="], a[href*="/case?id="]')
      await expect(caseLinks).toHaveCount(0)
    }
  })

  test('citizen case page without auth does not show ops duplicate review @pilot', async ({
    page,
  }) => {
    await expectPageLoads(page, '/case?id=CASE-OTHER-MUNI')
    await expect(page.getByText(/duplicate review/i)).toHaveCount(0)
    await expect(page.getByText(/link as same incident|keep separate/i)).toHaveCount(0)
  })

  test('suspended user path — sign-in available; ops stays gated @pilot', async ({
    page,
  }) => {
    // Documented: no dedicated /suspended route; disabled users fail at Firebase Auth.
    await expectPageLoads(page, '/auth/signin')
    await expect(page.locator('form, input[type="email"]').first()).toBeVisible()

    if (hasToken('suspended')) {
      await injectSyntheticAuth(page, UAT_TOKENS.suspended)
      await page.goto('/ops', { waitUntil: 'domcontentloaded' })
      // Suspended synthetic identity must not populate work queue case links
      await expect(page.locator('a[href*="/ops/case?id="]')).toHaveCount(0)
    } else {
      test.info().annotations.push({
        type: 'note',
        description:
          'PILOT_UAT_SUSPENDED_TOKEN unset — documented that auth/user-disabled is handled in lib/auth.ts; no dedicated suspended UI.',
      })
    }
  })

  test('official token from one muni cannot be assumed to show foreign muni data', async ({
    page,
  }) => {
    const token = UAT_TOKENS.officialCpt || UAT_TOKENS.official
    test.skip(!token?.trim(), 'PILOT_UAT_OFFICIAL_CPT_TOKEN / PILOT_UAT_OFFICIAL_TOKEN not set')
    await injectSyntheticAuth(page, token)
    await expectPageLoads(page, '/ops')
    // Soft check: municipality claim chrome may appear; foreign muni codes must not
    // be mixed in client-visible queue without server filter (server is source of truth).
    const body = await page.locator('body').innerText()
    // Queue must be empty or scoped — never dump raw multi-muni JSON blobs
    expect(body).not.toMatch(/"muniCode"\s*:\s*\[/)
    // CPT official must not render as JHB claim chrome
    if (UAT_TOKENS.officialCpt?.trim()) {
      await expect(page.getByText(/\bCPT\b/).first()).toBeVisible({ timeout: 25_000 })
    }
  })
})
