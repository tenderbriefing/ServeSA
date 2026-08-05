/**
 * Shared auth helpers for ops modules (avoid circular imports).
 */

export class OpsError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 400
  ) {
    super(message)
    this.name = 'OpsError'
  }
}

export type AuthCtx = {
  uid: string
  token?: Record<string, unknown> | null
}

function rolesOf(ctx: AuthCtx): string[] {
  const t = ctx.token || {}
  const roles = t.roles
  if (Array.isArray(roles)) return roles.map(String)
  return []
}

function municipalityOf(ctx: AuthCtx): string | null {
  const code = ctx.token?.municipalityCode
  return code ? String(code) : null
}

export function assertOfficial(ctx: AuthCtx): {
  roles: string[]
  muniCode: string | null
  isAdmin: boolean
} {
  if (!ctx.uid) throw new OpsError('Authentication required', 'unauthenticated', 401)
  const roles = rolesOf(ctx)
  const isAdmin = roles.includes('admin')
  const isOfficial =
    isAdmin ||
    roles.includes('official') ||
    roles.includes('moderator') ||
    roles.includes('field_worker')
  if (!isOfficial) throw new OpsError('Official role required', 'permission_denied', 403)
  const muniCode = municipalityOf(ctx)
  if (!isAdmin && !muniCode) {
    throw new OpsError('Municipality claim required', 'permission_denied', 403)
  }
  return { roles, muniCode, isAdmin }
}

export function assertManager(ctx: AuthCtx) {
  const o = assertOfficial(ctx)
  if (
    !o.isAdmin &&
    !o.roles.includes('moderator') &&
    !o.roles.includes('official')
  ) {
    throw new OpsError('Manager role required', 'permission_denied', 403)
  }
  return o
}

export function assertFieldWorker(ctx: AuthCtx) {
  const o = assertOfficial(ctx)
  const ok =
    o.isAdmin ||
    o.roles.includes('field_worker') ||
    o.roles.includes('official') ||
    o.roles.includes('moderator')
  if (!ok) throw new OpsError('Field worker role required', 'permission_denied', 403)
  return o
}

export { rolesOf, municipalityOf }
