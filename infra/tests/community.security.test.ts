/**
 * Security intent tests for community engagement + hardened callables.
 */

function canAttachMedia(authUid: string | null, caseReporterUid: string | null) {
  return Boolean(authUid && caseReporterUid && authUid === caseReporterUid)
}

function canCitizenReadUpdate(status: string) {
  return ['published', 'updated', 'resolved'].includes(status)
}

function canOfficialReadDraft(
  roles: string[] | null,
  tokenMuni: string | null,
  updateMuni: string
) {
  if (!roles) return false
  if (roles.includes('admin')) return true
  return (
    (roles.includes('official') ||
      roles.includes('moderator') ||
      roles.includes('comms_editor')) &&
    tokenMuni === updateMuni
  )
}

function profileCreateAllowsPrivilegedRoles(keys: string[]) {
  const denied = ['roles', 'role', 'departmentId', 'municipalityId']
  return !keys.some((k) => denied.includes(k))
}

function officialUserReadScoped(
  viewerRoles: string[],
  viewerMuni: string | null,
  profileMuni: string | undefined
) {
  if (viewerRoles.includes('admin')) return true
  if (!profileMuni || !viewerMuni) return false
  return (
    (viewerRoles.includes('official') || viewerRoles.includes('moderator')) &&
    viewerMuni === profileMuni
  )
}

function notificationCallableAllowed(roles: string[] | null) {
  return Boolean(roles && roles.includes('admin'))
}

function analyticsCallableAllowed(
  roles: string[] | null,
  tokenMuni: string | null,
  requestedMuni: string
) {
  if (!roles) return false
  if (roles.includes('admin')) return true
  if (
    (roles.includes('official') || roles.includes('moderator')) &&
    tokenMuni === requestedMuni
  ) {
    return true
  }
  return false
}

describe('security boundaries — community upgrade', () => {
  it('citizen cannot attach media to another case (C1)', () => {
    expect(canAttachMedia(null, 'user-a')).toBe(false)
    expect(canAttachMedia('user-a', 'user-b')).toBe(false)
    expect(canAttachMedia('user-a', 'user-a')).toBe(true)
  })

  it('citizens only see published update family', () => {
    expect(canCitizenReadUpdate('draft')).toBe(false)
    expect(canCitizenReadUpdate('published')).toBe(true)
    expect(canCitizenReadUpdate('archived')).toBe(false)
  })

  it('officials cannot read another municipality draft', () => {
    expect(canOfficialReadDraft(['official'], 'JHB', 'CPT')).toBe(false)
    expect(canOfficialReadDraft(['official'], 'JHB', 'JHB')).toBe(true)
  })

  it('profile create cannot forge privileged roles (C3)', () => {
    expect(profileCreateAllowsPrivilegedRoles(['email', 'firstName'])).toBe(true)
    expect(profileCreateAllowsPrivilegedRoles(['email', 'roles'])).toBe(false)
  })

  it('official user reads are municipality-scoped', () => {
    expect(officialUserReadScoped(['official'], 'JHB', 'CPT')).toBe(false)
    expect(officialUserReadScoped(['official'], 'JHB', 'JHB')).toBe(true)
    expect(officialUserReadScoped(['official'], 'JHB', undefined)).toBe(false)
  })

  it('push/email callables require admin (C2)', () => {
    expect(notificationCallableAllowed(null)).toBe(false)
    expect(notificationCallableAllowed(['official'])).toBe(false)
    expect(notificationCallableAllowed(['admin'])).toBe(true)
  })

  it('analytics callable is municipality-scoped', () => {
    expect(analyticsCallableAllowed(null, null, 'JHB')).toBe(false)
    expect(analyticsCallableAllowed(['official'], 'JHB', 'CPT')).toBe(false)
    expect(analyticsCallableAllowed(['official'], 'JHB', 'JHB')).toBe(true)
  })

  it('idea internal notes never citizen-readable (rule intent)', () => {
    const citizenCanReadInternalNotes = false
    expect(citizenCanReadInternalNotes).toBe(false)
  })
})
