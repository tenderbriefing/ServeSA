import { Page, expect, test } from '@playwright/test'

/**
 * Optional synthetic Firebase *custom* tokens for signInWithCustomToken.
 * Provision via: node tools/pilot/provision_uat_identities.js
 * Load env: set -a && source docs/reports/evidence/uat_tokens.env && set +a
 * Never commit token values.
 */
export const UAT_TOKENS = {
  citizen: process.env.PILOT_UAT_CITIZEN_TOKEN,
  official: process.env.PILOT_UAT_OFFICIAL_TOKEN,
  supervisor: process.env.PILOT_UAT_SUPERVISOR_TOKEN,
  field: process.env.PILOT_UAT_FIELD_TOKEN,
  suspended: process.env.PILOT_UAT_SUSPENDED_TOKEN,
  admin: process.env.PILOT_UAT_ADMIN_TOKEN,
  officialCpt: process.env.PILOT_UAT_OFFICIAL_CPT_TOKEN,
}

export function hasToken(role: keyof typeof UAT_TOKENS): boolean {
  return Boolean(UAT_TOKENS[role]?.trim())
}

/**
 * Inject a synthetic Firebase custom token before page scripts run.
 * AuthProvider calls signInWithCustomToken when __PILOT_UAT_ID_TOKEN is set.
 * Without tokens, tests stay on unauthenticated page-load / UI structure checks.
 */
export async function injectSyntheticAuth(
  page: Page,
  token: string | undefined
): Promise<boolean> {
  if (!token?.trim()) return false
  await page.addInitScript((customToken) => {
    ;(window as unknown as { __PILOT_UAT_ID_TOKEN?: string }).__PILOT_UAT_ID_TOKEN =
      customToken
  }, token.trim())
  return true
}

export async function expectPageLoads(page: Page, path: string) {
  const res = await page.goto(path, { waitUntil: 'domcontentloaded' })
  // Hosting may soft-404 SPA routes as 200; treat network failure only as hard fail
  expect(res?.status() ?? 0).toBeLessThan(500)
  await expect(page.locator('body')).toBeVisible()
}

/** Skip auth-dependent block when synthetic token missing (CI-safe). */
export function skipWithoutToken(role: keyof typeof UAT_TOKENS, reason?: string) {
  test.skip(
    !hasToken(role),
    reason ||
      `PILOT_UAT_${role.toUpperCase()}_TOKEN not set — skipping auth-dependent assertion`
  )
}
