import { Page, expect, test } from '@playwright/test'

/** Optional synthetic Firebase ID tokens — never commit real credentials. */
export const UAT_TOKENS = {
  citizen: process.env.PILOT_UAT_CITIZEN_TOKEN,
  official: process.env.PILOT_UAT_OFFICIAL_TOKEN,
  supervisor: process.env.PILOT_UAT_SUPERVISOR_TOKEN,
  field: process.env.PILOT_UAT_FIELD_TOKEN,
  suspended: process.env.PILOT_UAT_SUSPENDED_TOKEN,
}

export function hasToken(role: keyof typeof UAT_TOKENS): boolean {
  return Boolean(UAT_TOKENS[role]?.trim())
}

/**
 * Inject a synthetic Firebase Auth persistence hint when a token env is set.
 * Without tokens, tests stay on unauthenticated page-load / UI structure checks.
 */
export async function injectSyntheticAuth(
  page: Page,
  token: string | undefined
): Promise<boolean> {
  if (!token?.trim()) return false
  await page.addInitScript((idToken) => {
    ;(window as unknown as { __PILOT_UAT_ID_TOKEN?: string }).__PILOT_UAT_ID_TOKEN =
      idToken
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
