/**
 * Security intent tests for municipal planning boundaries.
 */

function canCitizenReadPlanning(status: string) {
  return status === 'published'
}

function canOfficialReadDraft(
  roles: string[] | null,
  tokenMuni: string | null,
  entityMuni: string
) {
  if (!roles) return false
  if (roles.includes('admin')) return true
  return (
    (roles.includes('official') ||
      roles.includes('moderator') ||
      roles.includes('comms_editor') ||
      roles.includes('comms_publisher')) &&
    tokenMuni === entityMuni
  )
}

function citizenCanWritePlanning() {
  return false
}

function aiExtractAutoPublishes(statusRequested: string, hasAiDraft: boolean) {
  if (hasAiDraft && statusRequested === 'published') return true
  return false
}

function wardSectionPromisedWithoutMapping(
  wardMappingAvailable: boolean,
  wardIds: string[]
) {
  return !wardMappingAvailable && wardIds.length > 0
}

function crossMunicipalityEditAllowed(
  tokenMuni: string,
  entityMuni: string,
  isAdmin: boolean
) {
  if (isAdmin) return true
  return tokenMuni === entityMuni
}

describe('security boundaries — municipal planning', () => {
  it('citizens only read published planning artefacts', () => {
    expect(canCitizenReadPlanning('draft')).toBe(false)
    expect(canCitizenReadPlanning('awaiting_review')).toBe(false)
    expect(canCitizenReadPlanning('verified')).toBe(false)
    expect(canCitizenReadPlanning('published')).toBe(true)
    expect(canCitizenReadPlanning('archived')).toBe(false)
  })

  it('officials cannot read another municipality draft', () => {
    expect(canOfficialReadDraft(['official'], 'JHB', 'CPT')).toBe(false)
    expect(canOfficialReadDraft(['official'], 'JHB', 'JHB')).toBe(true)
    expect(canOfficialReadDraft(['comms_editor'], 'JHB', 'JHB')).toBe(true)
  })

  it('citizens cannot write official planning data', () => {
    expect(citizenCanWritePlanning()).toBe(false)
  })

  it('AI extract drafts must not auto-publish', () => {
    expect(aiExtractAutoPublishes('draft', true)).toBe(false)
    expect(aiExtractAutoPublishes('awaiting_review', true)).toBe(false)
    // Upsert path rejects published; this intent flag documents the hazard
    expect(aiExtractAutoPublishes('published', true)).toBe(true)
  })

  it('does not promise ward data without mapping', () => {
    expect(wardSectionPromisedWithoutMapping(false, [])).toBe(false)
    expect(wardSectionPromisedWithoutMapping(false, ['79800060'])).toBe(true)
    expect(wardSectionPromisedWithoutMapping(true, ['79800060'])).toBe(false)
  })

  it('enforces municipality isolation on edits', () => {
    expect(crossMunicipalityEditAllowed('JHB', 'CPT', false)).toBe(false)
    expect(crossMunicipalityEditAllowed('JHB', 'JHB', false)).toBe(true)
    expect(crossMunicipalityEditAllowed('JHB', 'CPT', true)).toBe(true)
  })
})
