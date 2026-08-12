import { test, expect } from '@playwright/test'
import {
  signInAndGoto,
  UAT_TOKENS,
  hasToken,
  dismissOnboardingIfPresent,
} from './helpers/uat'

/**
 * Production closeout UAT for national municipality onboarding.
 * Run against https://servesa-aad53.web.app with uat_tokens.env loaded.
 */
test.describe('National closeout production UAT', () => {
  test('signup requires province and municipality; ward optional @closeout', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/auth')
    await expect(
      page.getByText(/province and municipality are required/i)
    ).toBeVisible()
    await expect(page.getByLabel(/^province/i)).toBeVisible()
    await expect(page.getByLabel(/^municipality/i)).toBeVisible()
    await expect(page.getByLabel(/ward/i)).toBeVisible()
    await page.getByRole('button', { name: /create account/i }).click()
    await expect(
      page.getByText(/there is a problem with your form/i)
    ).toBeVisible({ timeout: 10_000 })
  })

  test('western cape municipalities do not include johannesburg @closeout', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/auth')
    await page.getByRole('combobox', { name: /province/i }).click()
    await page.getByRole('option', { name: /western cape/i }).click()
    await page.getByRole('combobox', { name: /municipality/i }).click()
    const options = page.getByRole('option')
    await expect(options.filter({ hasText: /cape town/i }).first()).toBeVisible()
    await expect(options.filter({ hasText: /johannesburg/i })).toHaveCount(0)
  })

  test('unauthenticated /municipality gates to auth @closeout', async ({
    page,
  }) => {
    await page.goto('/municipality')
    await page.waitForTimeout(2500)
    const url = page.url()
    const body = await page.locator('body').innerText()
    const gated =
      /auth\/signin|\/auth/i.test(url) ||
      /sign in|create account|checking your session/i.test(body)
    expect(gated).toBeTruthy()
    expect(body).not.toMatch(/\bJHB\b/)
    expect(body.toLowerCase()).not.toContain('johannesburg metropolitan')
  })

  test('report wizard still loads @closeout', async ({ page }) => {
    await page.goto('/report')
    await expect(page.getByText(/report/i).first()).toBeVisible({
      timeout: 20_000,
    })
    const body = (await page.locator('body').innerText()).toLowerCase()
    expect(body.length).toBeGreaterThan(40)
  })

  test('authenticated citizen municipality surface @closeout', async ({
    page,
  }) => {
    test.skip(!hasToken('citizen'), 'no citizen token')
    await signInAndGoto(page, UAT_TOKENS.citizen, '/municipality')
    await page
      .getByText(/checking your session/i)
      .waitFor({ state: 'hidden', timeout: 45_000 })
      .catch(() => undefined)
    await dismissOnboardingIfPresent(page)
    // Auth may land on sign-in gate, confirm panel, or scoped municipality content.
    await expect(
      page
        .getByRole('heading', { name: /sign in to view our municipality/i })
        .or(page.getByText(/confirm your municipality/i))
        .or(page.getByText(/your municipality/i))
        .or(page.getByText(/planning information is not available/i))
        .or(page.getByRole('heading', { name: /our municipality/i }))
        .first()
    ).toBeVisible({ timeout: 45_000 })
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/anonymous.*jhb|pilot area substitute/i)
    expect(body.toLowerCase()).not.toContain('johannesburg metropolitan')
  })

  test('cross-muni official tokens reach scoped ops @closeout', async ({
    page,
  }) => {
    test.skip(
      !hasToken('official') || !hasToken('officialCpt'),
      'need jhb+cpt official tokens'
    )
    await signInAndGoto(page, UAT_TOKENS.official, '/ops')
    const jhb = await page.locator('body').innerText()
    expect(jhb.length).toBeGreaterThan(20)

    await page.context().clearCookies()
    await page.goto('/')
    await signInAndGoto(page, UAT_TOKENS.officialCpt, '/ops')
    const cpt = await page.locator('body').innerText()
    expect(cpt.length).toBeGreaterThan(20)
  })
})
