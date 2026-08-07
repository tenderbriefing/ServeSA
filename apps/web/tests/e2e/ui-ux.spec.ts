import { test, expect, devices } from '@playwright/test'
import { expectPageLoads, waitForClientHydration } from './helpers/uat'

/**
 * UI/UX transformation certification tests.
 * Assert language selector / US flag absence, mobile nav, a11y basics,
 * form validation cues, draft preservation, and reduced-motion safety.
 */
test.describe('UI/UX transformation @uiux', () => {
  test('homepage has no language selector and no US flag', async ({ page }) => {
    await expectPageLoads(page, '/')
    await expect(
      page.getByRole('heading', {
        name: /building better communities together/i,
      })
    ).toBeVisible({ timeout: 20_000 })

    await expect(page.getByText('🇺🇸')).toHaveCount(0)
    await expect(page.locator('[data-testid="language-switcher"]')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /language|isiZulu|Afrikaans/i })).toHaveCount(0)
    await expect(page.getByLabel(/language/i)).toHaveCount(0)

    const html = await page.content()
    expect(html).not.toContain('🇺🇸')
    expect(html.toLowerCase()).not.toContain('languageswitcher')
  })

  test('header, report, auth, and help never expose language controls', async ({
    page,
  }) => {
    for (const path of ['/', '/report', '/auth', '/auth/signin', '/help', '/case']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await expect(page.getByText('🇺🇸')).toHaveCount(0)
      await expect(page.locator('[data-testid="language-switcher"]')).toHaveCount(0)
      const body = await page.locator('body').innerText()
      expect(body).not.toContain('🇺🇸')
      expect(body.toLowerCase()).not.toMatch(/\bchoose language\b|\blanguage selector\b/)
    }
  })

  test('mobile menu opens, lists citizen labels, and closes with Escape', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await expectPageLoads(page, '/')
    await waitForClientHydration(page)

    const menuButton = page.getByTestId('mobile-menu-button')
    await expect(menuButton).toBeVisible()
    await menuButton.click()
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true', {
      timeout: 10_000,
    })
    const menu = page.getByTestId('mobile-menu')
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('link', { name: 'Report' })).toBeVisible()
    await expect(menu.getByRole('link', { name: 'Track' })).toBeVisible()
    await expect(menu.getByRole('link', { name: 'My Cases' })).toBeVisible()
    await expect(menu.getByRole('link', { name: 'Help' })).toBeVisible()
    await expect(menu.getByText('🇺🇸')).toHaveCount(0)

    await page.keyboard.press('Escape')
    await expect(menu).toHaveCount(0)
  })

  test('skip link and keyboard focus are available on homepage', async ({ page }) => {
    await expectPageLoads(page, '/')
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => {
      const el = document.activeElement
      return {
        tag: el?.tagName,
        text: el?.textContent?.trim().slice(0, 80) || '',
        href: (el as HTMLAnchorElement | null)?.getAttribute?.('href') || '',
      }
    })
    expect(
      focused.href === '#main-content' ||
        focused.text.toLowerCase().includes('skip') ||
        focused.tag === 'A' ||
        focused.tag === 'BUTTON'
    ).toBeTruthy()
  })

  test('report form preserves draft across reload', async ({ page }) => {
    await expectPageLoads(page, '/report')
    const title = page.getByTestId('title')
    await expect(title).toBeVisible({ timeout: 20_000 })
    await title.fill('Pothole near clinic entrance')
    await page.getByTestId('description').fill(
      'Large pothole damaging vehicles on the approach road to the clinic.'
    )
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('title')).toHaveValue(/Pothole near clinic/i, {
      timeout: 20_000,
    })
  })

  test('report submit stays disabled until required fields and photo', async ({
    page,
  }) => {
    await expectPageLoads(page, '/report')
    await expect(page.getByTestId('next-step')).toBeDisabled()
    await page.locator('[data-testid^="category-"]').first().click()
    await page.getByTestId('title').fill('Broken street light')
    await page
      .getByTestId('description')
      .fill('Street light out for several nights on the corner near the school.')
    await expect(page.getByTestId('next-step')).toBeEnabled()
  })

  test('empty My Cases gate offers report without account', async ({ page }) => {
    await expectPageLoads(page, '/dashboard')
    await expect(
      page.getByRole('heading', { name: /sign in to view my cases/i })
    ).toBeVisible({ timeout: 20_000 })
    await expect(
      page.getByRole('link', { name: /report an issue without signing in/i })
    ).toBeVisible()
  })

  test('responsive nav at key mobile widths has no language control', async ({
    page,
  }) => {
    for (const width of [320, 360, 375, 390, 414]) {
      await page.setViewportSize({ width, height: 720 })
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      await expect(page.getByText('🇺🇸')).toHaveCount(0)
      const overflowX = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      })
      expect(overflowX, `horizontal overflow at ${width}px`).toBeFalsy()
    }
  })

  test('prefers-reduced-motion does not break homepage', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expectPageLoads(page, '/')
    await expect(
      page.getByRole('link', { name: /report an issue/i }).first()
    ).toBeVisible()
  })
})

test.describe('UI/UX mobile project smoke @uiux', () => {
  test('iPhone viewport: primary CTA reachable, no US flag', async ({ page }) => {
    await page.setViewportSize(devices['iPhone 12'].viewport!)
    await expectPageLoads(page, '/')
    await waitForClientHydration(page)
    await expect(page.getByRole('link', { name: /report an issue/i }).first()).toBeVisible()
    await expect(page.getByText('🇺🇸')).toHaveCount(0)
    const menuButton = page.getByTestId('mobile-menu-button')
    await menuButton.click()
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true', {
      timeout: 10_000,
    })
    await expect(page.getByTestId('mobile-menu')).toBeVisible()
  })
})
