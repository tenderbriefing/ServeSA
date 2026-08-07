import { test, expect } from '@playwright/test'
import {
  dismissOnboardingIfPresent,
  hasToken,
  signInAndGoto,
  UAT_TOKENS,
  waitForClientHydration,
} from './helpers/uat'

/**
 * Live production citizen report journey — no createCase mocks.
 * Requires PILOT_UAT_CITIZEN_TOKEN. Records a real Case ID from acknowledgement UI.
 */
test.describe('Enterprise live citizen report @enterprise', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      navigator.geolocation.getCurrentPosition = (success) => {
        success({
          coords: {
            latitude: -26.2041,
            longitude: 28.0473,
            accuracy: 12,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
            toJSON: () => ({}),
          },
          timestamp: Date.now(),
        } as GeolocationPosition)
      }
    })
  })

  test('authenticated homepage → report → submit yields Case ID', async ({
    page,
  }) => {
    test.skip(!hasToken('citizen'), 'PILOT_UAT_CITIZEN_TOKEN not set')
    test.setTimeout(120_000)

    // Pre-seed onboarding complete so modal cannot intercept the journey.
    await page.addInitScript(() => {
      localStorage.setItem('servesa.onboarding.completed', 'true')
    })

    await signInAndGoto(page, UAT_TOKENS.citizen, '/report')
    await waitForClientHydration(page)
    await dismissOnboardingIfPresent(page)

    await page.locator('[data-testid="category-water-sewage"]').click()
    await page.fill(
      '[data-testid="title"]',
      'Enterprise live UAT — water leak'
    )
    await page.fill(
      '[data-testid="description"]',
      'Production certification browser journey. Synthetic UAT citizen. Continuous curb leak for routing verification.'
    )
    await page.locator('[data-testid="priority-medium"]').check()
    await page.click('[data-testid="next-step"]')

    // Prefer manual pin so GPS is optional (GPS stub available if UI requires it)
    const useGps = page.locator('[data-testid="use-gps"]')
    if (await useGps.isVisible().catch(() => false)) {
      await useGps.click()
    }
    const lat = page.locator('[data-testid="lat"]')
    if (await lat.isVisible().catch(() => false)) {
      await lat.fill('-26.2041')
      await page.locator('[data-testid="lng"]').fill('28.0473')
      await page.click('[data-testid="confirm-pin"]')
    }
    await expect(page.locator('[data-testid="location-summary"]')).toBeVisible({
      timeout: 20_000,
    })
    await page.click('[data-testid="next-step"]')

    await page.fill('[data-testid="reporter-name"]', 'UAT Citizen Pilot')
    const email = page.locator('[data-testid="reporter-email"]')
    if (await email.isVisible().catch(() => false)) {
      await email.fill('uat.citizen.pilot@servesa.test')
    }
    await page.check('[data-testid="consent"]')

    await expect(page.locator('[data-testid="submit"]')).toBeDisabled()
    await page.setInputFiles('[data-testid="photo-upload"]', {
      name: 'enterprise-live.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from(
        '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGfAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//Z',
        'base64'
      ),
    })
    await expect(page.locator('[data-testid="submit"]')).toBeEnabled({
      timeout: 15_000,
    })
    await page.click('[data-testid="submit"]')

    const caseIdLocator = page.getByText(/CASE-[A-Z0-9-]+/).first()
    await expect(caseIdLocator).toBeVisible({ timeout: 90_000 })
    const caseIdText = (await caseIdLocator.innerText()).match(
      /CASE-[A-Z0-9-]+/
    )?.[0]
    expect(caseIdText).toBeTruthy()
    console.log(`ENTERPRISE_LIVE_CASE_ID=${caseIdText}`)
  })
})
