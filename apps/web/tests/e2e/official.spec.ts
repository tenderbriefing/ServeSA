import { test, expect } from '@playwright/test'
import {
  expectPageLoads,
  signInAndGoto,
  UAT_TOKENS,
  hasToken,
} from './helpers/uat'

/**
 * Official role UAT — /ops smart work queue.
 * Unauthenticated: expects redirect/gate to sign-in (no queue data leak).
 */
test.describe('Official UAT @pilot', () => {
  test('ops page loads (gate or queue UI) @pilot', async ({ page }) => {
    await expectPageLoads(page, '/ops')
    const gateOrQueue = page
      .getByText(/checking access|sign in|smart work queue|servesa ops/i)
      .first()
    await expect(gateOrQueue).toBeVisible({ timeout: 20_000 })
  })

  test('work queue UI structure when official token present', async ({ page }) => {
    test.skip(!hasToken('official'), 'PILOT_UAT_OFFICIAL_TOKEN not set')
    await signInAndGoto(page, UAT_TOKENS.official, '/ops')
    await expect(
      page.getByRole('heading', { name: /smart work queue/i })
    ).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('#ops-search')).toBeVisible()
    await expect(
      page.getByText(/needs acknowledgement|duplicate review|all actions/i).first()
    ).toBeVisible()
  })

  test('unauthenticated ops does not render municipality case rows @pilot', async ({
    page,
  }) => {
    test.skip(hasToken('official'), 'Authenticated run — skip leak check')
    await page.goto('/ops', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('a[href*="/ops/case?id="]')).toHaveCount(0, {
      timeout: 15_000,
    })
  })
})
