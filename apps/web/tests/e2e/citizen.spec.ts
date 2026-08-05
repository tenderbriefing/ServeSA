import { test, expect } from '@playwright/test'
import {
  expectPageLoads,
  signInAndGoto,
  UAT_TOKENS,
  hasToken,
} from './helpers/uat'

/**
 * Citizen role UAT — synthetic identities only.
 * @pilot critical smoke: public report/auth/case surfaces.
 */
test.describe('Citizen UAT @pilot', () => {
  test('report page loads with report UI elements @pilot', async ({ page }) => {
    await expectPageLoads(page, '/report')
    await expect(
      page.getByRole('heading', { name: /report an issue|report/i }).or(
        page.getByText(/report an issue/i)
      ).first()
    ).toBeVisible({ timeout: 20_000 })
    const categoryOrTitle = page
      .locator('[data-testid="title"], [data-testid="category"], [data-testid^="category-"], input, select, button')
      .first()
    await expect(categoryOrTitle).toBeVisible({ timeout: 20_000 })
  })

  test('case page loads without exposing duplicate scores @pilot', async ({ page }) => {
    await expectPageLoads(page, '/case')
    await expect(page.locator('body')).toBeVisible()
    const bodyText = (await page.locator('body').innerText()).toLowerCase()
    expect(bodyText).not.toMatch(/duplicate\s*score|scorepair|hamming|perceptual.?hash/i)
    await expect(page.getByText(/duplicate review/i)).toHaveCount(0)
    await expect(
      page.getByText(/sign in|case|progress|report/i).first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('auth pages load @pilot', async ({ page }) => {
    await expectPageLoads(page, '/auth')
    await expect(page.getByText(/servesa/i).first()).toBeVisible({ timeout: 15_000 })

    await expectPageLoads(page, '/auth/signin')
    await expect(
      page.locator('input[type="email"], input[name="email"], form').first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('authenticated citizen timeline path (optional token)', async ({ page }) => {
    test.skip(!hasToken('citizen'), 'PILOT_UAT_CITIZEN_TOKEN not set')
    await signInAndGoto(page, UAT_TOKENS.citizen, '/case?id=CASE-SYNTHETIC-UAT')
    const html = await page.content()
    expect(html.toLowerCase()).not.toContain('duplicatebadge')
    expect(html.toLowerCase()).not.toMatch(/confidence\s*:\s*(high|medium|low)/)
  })
})
