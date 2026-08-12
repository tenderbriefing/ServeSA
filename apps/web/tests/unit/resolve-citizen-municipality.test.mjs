/**
 * Mirrors apps/web/src/lib/municipality/resolveCitizenMunicipality.ts
 */
import assert from 'node:assert/strict'
import test from 'node:test'

function normalizeMunicipalityCode(code) {
  const trimmed = (code || '').trim().toUpperCase()
  return trimmed || null
}

function resolveCitizenMunicipality(input) {
  const fromClaims = normalizeMunicipalityCode(input.claimsMunicipalityCode)
  if (fromClaims) {
    return {
      municipalityCode: fromClaims,
      source: 'claims',
      confirmed: true,
    }
  }
  const fromProfile = normalizeMunicipalityCode(input.profileMunicipalityCode)
  if (fromProfile) {
    return {
      municipalityCode: fromProfile,
      source: 'profile',
      confirmed: true,
    }
  }
  return {
    municipalityCode: null,
    source: 'none',
    confirmed: false,
  }
}

test('normalizeMunicipalityCode uppercases and trims', () => {
  assert.equal(normalizeMunicipalityCode(' jhb '), 'JHB')
  assert.equal(normalizeMunicipalityCode(''), null)
  assert.equal(normalizeMunicipalityCode(null), null)
})

test('resolveCitizenMunicipality prefers claims then profile', () => {
  assert.deepEqual(
    resolveCitizenMunicipality({
      claimsMunicipalityCode: 'CPT',
      profileMunicipalityCode: 'JHB',
    }),
    { municipalityCode: 'CPT', source: 'claims', confirmed: true }
  )
  assert.deepEqual(
    resolveCitizenMunicipality({
      claimsMunicipalityCode: null,
      profileMunicipalityCode: 'TSH',
    }),
    { municipalityCode: 'TSH', source: 'profile', confirmed: true }
  )
})

test('resolveCitizenMunicipality never invents a municipality', () => {
  const empty = resolveCitizenMunicipality({
    claimsMunicipalityCode: null,
    profileMunicipalityCode: undefined,
  })
  assert.equal(empty.municipalityCode, null)
  assert.equal(empty.source, 'none')
  assert.equal(empty.confirmed, false)
  assert.notEqual(empty.municipalityCode, 'JHB')
})
