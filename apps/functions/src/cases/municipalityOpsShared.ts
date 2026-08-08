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
    roles.includes('field_worker') ||
    roles.includes('comms_editor') ||
    roles.includes('comms_publisher')
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

/**
 * Communications editor: draft / edit municipal updates.
 * Roles: admin | moderator | official | comms_editor | comms_publisher
 */
export function assertCommsEditor(ctx: AuthCtx) {
  const o = assertOfficial(ctx)
  const ok =
    o.isAdmin ||
    o.roles.includes('moderator') ||
    o.roles.includes('official') ||
    o.roles.includes('comms_editor') ||
    o.roles.includes('comms_publisher')
  if (!ok) {
    throw new OpsError('Communications editor role required', 'permission_denied', 403)
  }
  // Field workers are official-scoped but must not edit communications
  if (
    o.roles.includes('field_worker') &&
    !o.isAdmin &&
    !o.roles.includes('official') &&
    !o.roles.includes('moderator') &&
    !o.roles.includes('comms_editor') &&
    !o.roles.includes('comms_publisher')
  ) {
    throw new OpsError('Communications editor role required', 'permission_denied', 403)
  }
  return o
}

/**
 * Communications publisher: publish / schedule / resolve / archive.
 * Roles: admin | moderator | official | comms_publisher
 * (comms_editor alone may draft but not publish)
 */
export function assertCommsPublisher(ctx: AuthCtx) {
  const o = assertOfficial(ctx)
  const ok =
    o.isAdmin ||
    o.roles.includes('moderator') ||
    o.roles.includes('official') ||
    o.roles.includes('comms_publisher')
  if (!ok) {
    throw new OpsError(
      'Communications publisher role required',
      'permission_denied',
      403
    )
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
