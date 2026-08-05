import { test, expect } from '@playwright/test'
import {
  expectPageLoads,
  injectSyntheticAuth,
  UAT_TOKENS,
  hasToken,
} from './helpers/uat'

/**
 * Supervisor role UAT — /ops/supervisor board.
 */
test.describe('Supervisor UAT @pilot', () => {
  test.beforeEach(async ({ page }) => {
    await injectSyntheticAuth(page, UAT_TOKENS.supervisor || UAT_TOKENS.official)
  })

  test('supervisor page loads (gate or board) @pilot', async ({ page }) => {
    await expectPageLoads(page, '/ops/supervisor')
    const gateOrBoard = page
      .getByText(/checking access|sign in|supervisor operations board|servesa ops/i)
      .first()
    await expect(gateOrBoard).toBeVisible({ timeout: 20_000 })
  })

  test('supervisor board metrics when token present', async ({ page }) => {
    test.skip(
      !(hasToken('supervisor') || hasToken('official')),
      'PILOT_UAT_SUPERVISOR_TOKEN / PILOT_UAT_OFFICIAL_TOKEN not set'
    )
    await expectPageLoads(page, '/ops/supervisor')
    await expect(
      page.getByRole('heading', { name: /supervisor operations board/i })
    ).toBeVisible({ timeout: 25_000 })
    await expect(page.getByText(/unacknowledged|duplicate reviews|high priority/i).first()).toBeVisible()
  })
})
