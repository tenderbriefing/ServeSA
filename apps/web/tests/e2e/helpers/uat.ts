import { Page, expect, test } from '@playwright/test'

/**
 * Optional synthetic Firebase auth payloads for Playwright UAT.
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

export function decodeUatPayload(
  token: string | undefined
): { email: string; password: string } | null {
  if (!token?.trim()) return null
  const raw = token.trim()
  if (raw.split('.').length === 3) return null
  try {
    const padded = raw.replace(/-/g, '+').replace(/_/g, '/')
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
    const json = JSON.parse(Buffer.from(padded + pad, 'base64').toString('utf8')) as {
      email?: string
      password?: string
    }
    if (json.email && json.password) {
      return { email: json.email, password: json.password }
    }
  } catch {
    return null
  }
  return null
}

/**
 * Inject password/custom-token payload before page scripts run.
 * AuthProvider bootstraps sign-in (JWT = 3 segments; else base64url password JSON).
 */
export async function injectSyntheticAuth(
  page: Page,
  token: string | undefined
): Promise<boolean> {
  if (!token?.trim()) return false
  await page.addInitScript((payload) => {
    ;(window as unknown as { __PILOT_UAT_ID_TOKEN?: string }).__PILOT_UAT_ID_TOKEN =
      payload
  }, token.trim())
  return true
}

/** Authenticate via init-script bootstrap then open a protected path. */
export async function signInAndGoto(
  page: Page,
  token: string | undefined,
  path: string
): Promise<void> {
  const ok = await injectSyntheticAuth(page, token)
  if (!ok) throw new Error('UAT token missing')
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await page
    .getByText(/checking access/i)
    .first()
    .waitFor({ state: 'hidden', timeout: 30_000 })
    .catch(() => undefined)
  // Confirm we did not bounce to sign-in
  if (page.url().includes('/auth/signin')) {
    const creds = decodeUatPayload(token)
    throw new Error(
      `UAT bootstrap left sign-in for ${creds?.email || 'unknown'} at ${page.url()}`
    )
  }
}

export async function expectPageLoads(page: Page, path: string) {
  const res = await page.goto(path, { waitUntil: 'domcontentloaded' })
  expect(res?.status() ?? 0).toBeLessThan(500)
  await expect(page.locator('body')).toBeVisible()
}

export function skipWithoutToken(role: keyof typeof UAT_TOKENS, reason?: string) {
  test.skip(
    !hasToken(role),
    reason ||
      `PILOT_UAT_${role.toUpperCase()}_TOKEN not set — skipping auth-dependent assertion`
  )
}
