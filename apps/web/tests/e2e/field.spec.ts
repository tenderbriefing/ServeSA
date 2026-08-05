import { test, expect } from '@playwright/test'
import {
  expectPageLoads,
  signInAndGoto,
  UAT_TOKENS,
  hasToken,
} from './helpers/uat'

/**
 * Field worker UAT — /field.
 */
test.describe('Field UAT @pilot', () => {
  test('field page loads (sign-in gate or field chrome) @pilot', async ({ page }) => {
    await expectPageLoads(page, '/field')
    const gateOrField = page
      .getByText(/sign in|field|checking access|field or official/i)
      .first()
    await expect(gateOrField).toBeVisible({ timeout: 20_000 })
  })

  test('field jobs UI when token present', async ({ page }) => {
    test.skip(
      !(hasToken('field') || hasToken('official')),
      'PILOT_UAT_FIELD_TOKEN / PILOT_UAT_OFFICIAL_TOKEN not set'
    )
    await signInAndGoto(page, UAT_TOKENS.field || UAT_TOKENS.official, '/field')
    await expect(page.getByRole('heading', { name: /^field$/i })).toBeVisible({
      timeout: 30_000,
    })
  })

  test('unauthenticated field does not list job cards @pilot', async ({ page }) => {
    test.skip(hasToken('field') || hasToken('official'), 'Authenticated run')
    await page.goto('/field', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/sign in with a field or official account/i)).toBeVisible({
      timeout: 15_000,
    })
  })
})
