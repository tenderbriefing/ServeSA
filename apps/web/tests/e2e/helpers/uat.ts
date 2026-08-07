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

/** Dismiss first-run tutorial modal if present. */
export async function dismissOnboardingIfPresent(page: Page) {
  const skip = page.getByRole('button', { name: /^skip$/i }).first()
  const close = page.getByRole('button', { name: /close introduction/i }).first()
  const dialog = page.getByRole('dialog')
  for (let i = 0; i < 6; i++) {
    if (await close.isVisible().catch(() => false)) {
      await close.click({ force: true })
      await dialog.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => undefined)
      continue
    }
    if (await skip.isVisible().catch(() => false)) {
      await skip.click({ force: true })
      await dialog.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => undefined)
      continue
    }
    if (!(await dialog.isVisible().catch(() => false))) break
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)
  }
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

/**
 * Prefer AuthProvider init-script bootstrap; fall back to form submit if redirect.
 * Form path clicks `form button[type=submit]` to avoid header "Sign In" collision.
 */
export async function signInAndGoto(
  page: Page,
  token: string | undefined,
  path: string
): Promise<void> {
  const ok = await injectSyntheticAuth(page, token)
  if (!ok) throw new Error('UAT token missing')
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await page
    .getByText(/^checking access/i)
    .first()
    .waitFor({ state: 'hidden', timeout: 30_000 })
    .catch(() => undefined)
  await dismissOnboardingIfPresent(page)

  if (page.url().includes('/auth/signin')) {
    const creds = decodeUatPayload(token)
    if (!creds) throw new Error('UAT bootstrap failed and token is not a password payload')
    await page.goto('/auth/signin', { waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder(/enter your email/i).fill(creds.email)
    await page.getByPlaceholder(/enter your password/i).fill(creds.password)
    await page.locator('form button[type="submit"]').click()
    await page.waitForURL(/\/dashboard(\/|$|\?)/, { timeout: 45_000 })
    await page.goto(path, { waitUntil: 'domcontentloaded' })
    await dismissOnboardingIfPresent(page)
  }

  if (page.url().includes('/auth/signin')) {
    throw new Error(`UAT auth failed for path ${path}`)
  }
}

export async function expectPageLoads(page: Page, path: string) {
  const res = await page.goto(path, { waitUntil: 'domcontentloaded' })
  expect(res?.status() ?? 0).toBeLessThan(500)
  await expect(page.locator('body')).toBeVisible()
}

/**
 * Wait until client hydration has attached React handlers.
 * Static Hosting can paint HTML before listeners are ready; clicking early
 * leaves controlled UI (e.g. mobile menu) unchanged.
 */
export async function waitForClientHydration(page: Page) {
  await page
    .waitForFunction(() => {
      const w = window as unknown as { __NEXT_DATA__?: unknown }
      return Boolean(w.__NEXT_DATA__) || document.readyState === 'complete'
    })
    .catch(() => undefined)
  await page.waitForLoadState('networkidle').catch(() => undefined)
  // Brief settle for React commit after networkidle on static export.
  await page.waitForTimeout(400)
}

export function skipWithoutToken(role: keyof typeof UAT_TOKENS, reason?: string) {
  test.skip(
    !hasToken(role),
    reason ||
      `PILOT_UAT_${role.toUpperCase()}_TOKEN not set — skipping auth-dependent assertion`
  )
}
