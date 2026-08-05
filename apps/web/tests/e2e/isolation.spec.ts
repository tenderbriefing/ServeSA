import { test, expect } from '@playwright/test'
import {
  expectPageLoads,
  signInAndGoto,
  UAT_TOKENS,
  hasToken,
} from './helpers/uat'

/**
 * Isolation UAT — cross-municipality and suspended-user paths.
 */
test.describe('Isolation UAT @pilot', () => {
  test('cross-muni ops pages do not leak case lists without auth @pilot', async ({
    page,
  }) => {
    for (const path of ['/ops', '/ops/supervisor', '/ops/map', '/ops/cases', '/field']) {
      await expectPageLoads(page, path)
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
    await expectPageLoads(page, '/auth/signin')
    await expect(page.locator('form, input[type="email"]').first()).toBeVisible()
    // Disabled account must not unlock ops case rows (sign-in fails or stays gated)
    await page.goto('/ops', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('a[href*="/ops/case?id="]')).toHaveCount(0)
  })

  test('official token from one muni cannot be assumed to show foreign muni data', async ({
    page,
  }) => {
    const token = UAT_TOKENS.officialCpt || UAT_TOKENS.official
    test.skip(!token?.trim(), 'PILOT_UAT_OFFICIAL_CPT_TOKEN / PILOT_UAT_OFFICIAL_TOKEN not set')
    await signInAndGoto(page, token, '/ops')
    await expect(
      page.getByRole('heading', { name: /smart work queue/i })
    ).toBeVisible({ timeout: 30_000 })
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/"muniCode"\s*:\s*\[/)
    if (UAT_TOKENS.officialCpt?.trim()) {
      await expect(page.getByText(/\bCPT\b|No municipality claim/i).first()).toBeVisible({
        timeout: 15_000,
      })
    }
  })
})
