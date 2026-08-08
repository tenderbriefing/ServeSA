import { test, expect } from '@playwright/test'

/**
 * Municipal planning citizen surfaces — structural smoke.
 * Feature is ON by default (non-staged); expects heading, empty, or load error.
 * Set NEXT_PUBLIC_ENABLE_MUNICIPAL_PLANNING=false to expect disabled copy.
 * Uses .html paths so local static `out/` servers work without Firebase cleanUrls.
 */
test.describe('municipal planning @planning', () => {
  test('municipality route loads with honest empty or disabled state', async ({
    page,
  }) => {
    await page.goto('/municipality.html')
    const disabled = page.getByText(/not enabled for this area/i)
    const heading = page.getByRole('heading', {
      name: /What your municipality plans to do/i,
    })
    const empty = page.getByText(/Not published yet/i)
    const loadError = page.getByText(/Unable to load municipal planning/i)
    await expect(
      disabled.or(heading).or(empty).or(loadError).first()
    ).toBeVisible({ timeout: 20_000 })
  })

  test('ops planning route exists under staff shell path', async ({ page }) => {
    await page.goto('/ops/planning.html')
    await expect(page).toHaveURL(/auth\/signin|ops\/planning/)
  })
})
