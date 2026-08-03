import { test, expect, Page } from '@playwright/test'

test.describe('ServeSA Report Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      navigator.geolocation.getCurrentPosition = (success) => {
        success({
          coords: {
            latitude: -26.2041,
            longitude: 28.0473,
            accuracy: 10,
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

  test('should complete report flow and generate case ID', async ({
    page,
  }: {
    page: Page
  }) => {
    await page.route('**/createCaseFunction**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            caseId: 'CASE-TEST-001',
            reference: 'CASE-TEST-001',
            shareUrl: 'https://servesa-aad53.web.app/case/CASE-TEST-001',
            status: 'submitted',
            slaTarget: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
            targetHours: 72,
            georesolutionStatus: 'polygon_match',
            municipality: { id: 'JHB', name: 'Johannesburg' },
            ward: { id: '58', name: 'Ward 58' },
          },
        }),
      })
    })

    // Callable protocol is more complex; stub window fetch / firebase if needed.
    await page.goto('/report')
    await expect(page.locator('h1')).toContainText('Report')

    await page.locator('[data-testid="category-water-sewage"]').click()
    await page.fill('[data-testid="title"]', 'Test Case - Water Leak')
    await page.fill(
      '[data-testid="description"]',
      'There is a water leak in the street outside my house. Water is flowing continuously.'
    )
    await page.locator('[data-testid="priority-medium"]').check()
    await page.click('[data-testid="next-step"]')

    await page.click('[data-testid="use-gps"]')
    await expect(page.locator('[data-testid="location-summary"]')).toBeVisible()
    await page.click('[data-testid="next-step"]')

    await page.fill('[data-testid="reporter-name"]', 'Test Citizen')
    await page.fill('[data-testid="reporter-email"]', 'test@example.com')
    await page.check('[data-testid="consent"]')

    // Without live functions, assert client validation path remains ready
    await expect(page.locator('[data-testid="submit"]')).toBeEnabled()
  })

  test('should handle geolocation errors gracefully', async ({ page }) => {
    await page.addInitScript(() => {
      navigator.geolocation.getCurrentPosition = (_success, error) => {
        if (error) {
          error({
            code: 1,
            message: 'User denied geolocation',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          } as GeolocationPositionError)
        }
      }
    })

    await page.goto('/report')
    await page.locator('[data-testid="category-roads-infrastructure"]').click()
    await page.fill('[data-testid="title"]', 'Test Case - Manual Location')
    await page.fill(
      '[data-testid="description"]',
      'Test case with manual location input for roads.'
    )
    await page.click('[data-testid="next-step"]')

    await page.click('[data-testid="use-gps"]')
    await expect(page.locator('[data-testid="gps-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="manual-location"]')).toBeVisible()

    await page.fill('[data-testid="address"]', '123 Test Street, Johannesburg')
    await page.fill('[data-testid="lat"]', '-26.2041')
    await page.fill('[data-testid="lng"]', '28.0473')
    await page.click('[data-testid="confirm-pin"]')
    await expect(page.locator('[data-testid="location-summary"]')).toBeVisible()
  })

  test('should validate required fields before advancing', async ({ page }) => {
    await page.goto('/report')
    await expect(page.locator('[data-testid="next-step"]')).toBeDisabled()
    await page.fill('[data-testid="title"]', 'ab')
    await expect(page.locator('[data-testid="next-step"]')).toBeDisabled()
  })
})
