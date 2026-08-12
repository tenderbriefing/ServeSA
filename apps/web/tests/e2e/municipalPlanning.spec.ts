import { test, expect } from '@playwright/test'

/**
 * Municipal planning citizen surfaces — auth-gated; no anonymous JHB fallback.
 * Uses .html paths so local static `out/` servers work without Firebase cleanUrls.
 */
test.describe('municipal planning @planning', () => {
  test('anonymous municipality route requires sign-in', async ({ page }) => {
    await page.goto('/municipality.html')
    await expect(
      page.getByRole('heading', { name: /Sign in to view My Municipality/i })
    ).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('link', { name: /Sign in/i }).first()).toBeVisible()
    await expect(page.getByText(/\bJHB\b/)).toHaveCount(0)
    await expect(page.getByText(/pilot area/i)).toHaveCount(0)
  })

  test('ops planning route exists under staff shell path', async ({ page }) => {
    await page.goto('/ops/planning.html')
    await expect(page).toHaveURL(/auth\/signin|ops\/planning/)
  })
})
