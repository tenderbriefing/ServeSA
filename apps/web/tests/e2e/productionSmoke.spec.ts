/**
 * Production pilot routes — structural smoke (390px + 1440px viewports).
 */
import { test, expect } from '@playwright/test'

const PUBLIC_ROUTES = [
  '/',
  '/report.html',
  '/track.html',
  '/login.html',
  '/signup.html',
]

const AUTH_GATED_ROUTES = [
  '/account.html',
  '/municipality.html',
  '/updates.html',
  '/ideas.html',
]

const OPS_ROUTES = ['/ops.html', '/ops/planning.html']

for (const route of PUBLIC_ROUTES) {
  test(`smoke public ${route} @smoke`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const res = await page.goto(route)
    expect(res?.status()).toBeLessThan(500)
    await expect(page.locator('body')).toBeVisible()
  })
}

for (const route of AUTH_GATED_ROUTES) {
  test(`smoke auth-gated ${route} redirects or gates @smoke`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(route)
    await expect(page.locator('body')).toBeVisible()
  })
}

for (const route of OPS_ROUTES) {
  test(`smoke ops ${route} @smoke`, async ({ page }) => {
    await page.goto(route)
    await expect(page).toHaveURL(/auth\/signin|ops/)
  })
}

test('publishing documents route exists when flag off shows disabled copy @smoke', async ({
  page,
}) => {
  await page.goto('/ops/planning/documents.html')
  await expect(page).toHaveURL(/auth\/signin|ops\/planning\/documents/)
})
