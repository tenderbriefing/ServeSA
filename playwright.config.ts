import { defineConfig, devices } from '@playwright/test'

/**
 * Pilot / production smoke UAT.
 * Default base URL is hosted production; override with PILOT_UAT_BASE_URL
 * (e.g. http://localhost:3000 for local Next).
 */
const baseURL =
  process.env.PILOT_UAT_BASE_URL || 'https://servesa-aad53.web.app'

export default defineConfig({
  testDir: './apps/web/tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Prefer system Chrome when Playwright browser download is unavailable
        channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
      },
    },
  ],
})
