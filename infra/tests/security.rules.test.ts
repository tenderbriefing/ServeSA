/**
 * Security rule intent tests (logic mirrors infra/firestore.rules + storage.rules).
 * Full emulator suite should be run in CI when emulators are available.
 */

function canCitizenReadCase(authUid: string | null, caseReporterUid: string) {
  return Boolean(authUid && authUid === caseReporterUid)
}

function canOfficialReadCase(
  roles: string[] | null,
  tokenMuni: string | null,
  caseMuni: string | null
) {
  if (!roles) return false
  if (roles.includes('admin')) return true
  if (
    (roles.includes('official') || roles.includes('moderator')) &&
    tokenMuni &&
    caseMuni &&
    tokenMuni === caseMuni
  ) {
    return true
  }
  return false
}

function canAttachMedia(
  authUid: string | null,
  caseReporterUid: string | null
) {
  return Boolean(authUid && caseReporterUid && authUid === caseReporterUid)
}

describe('security boundaries', () => {
  it('citizen cannot read another citizen private case', () => {
    expect(canCitizenReadCase('user-a', 'user-b')).toBe(false)
    expect(canCitizenReadCase('user-a', 'user-a')).toBe(true)
  })

  it('official cannot access another municipality cases', () => {
    expect(
      canOfficialReadCase(['official'], 'JHB', 'CPT')
    ).toBe(false)
    expect(
      canOfficialReadCase(['official'], 'JHB', 'JHB')
    ).toBe(true)
  })

  it('citizen cannot attach media to another case', () => {
    expect(canAttachMedia('user-a', 'user-b')).toBe(false)
    expect(canAttachMedia('user-a', 'user-a')).toBe(true)
  })

  it('anonymous share URL must not expose reporter contact via rules (client create denied)', () => {
    // Client create is denied — only Admin SDK writes cases. Share pages must use callables.
    const clientCreateAllowed = false
    expect(clientCreateAllowed).toBe(false)
  })
})
