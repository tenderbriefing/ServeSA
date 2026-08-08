import { test, expect } from '@playwright/test'

/**
 * Community engagement citizen surfaces — structural / a11y smoke.
 * Does not require live callable backends when pages render empty/error states.
 */
test.describe('community engagement @community', () => {
  test('homepage exposes four civic intents', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('heading', { name: /How you can engage/i })
    ).toBeVisible()
    await expect(page.getByRole('link', { name: /Report an Issue/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Municipal Updates/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Share an Idea/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Track a Case/i }).first()).toBeVisible()
  })

  test('updates feed page loads', async ({ page }) => {
    await page.goto('/updates')
    await expect(
      page.getByRole('heading', { name: /Verified information/i })
    ).toBeVisible()
  })

  test('ideas page distinguishes report vs idea', async ({ page }) => {
    await page.goto('/ideas')
    await expect(
      page.getByRole('heading', { name: /Suggest constructive improvements/i })
    ).toBeVisible()
    await expect(page.getByText(/not reports of broken/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /Share an Idea/i }).first()).toBeVisible()
  })

  test('header includes Updates and Ideas', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Primary' })
    await expect(nav.getByRole('link', { name: 'Updates' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Ideas' })).toBeVisible()
  })
})
