/**
 * National municipality onboarding — signup, validation, gates, no JHB fallback.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(__dirname, '../..')
const read = (rel) => fs.readFileSync(path.join(webRoot, rel), 'utf8')

/** Mirrors southAfricaData validation helpers for unit isolation */
function isValidMunicipalitySelection(province, municipality, byProvince) {
  const p = (province || '').trim().toUpperCase()
  const m = (municipality || '').trim().toUpperCase()
  if (!p || !m) return false
  return (byProvince[p] || []).includes(m)
}

function normalizeOptionalWard(ward) {
  const trimmed = (ward || '').trim()
  if (!trimmed) return null
  if (trimmed.length > 64) return null
  return trimmed
}

const CANONICAL = {
  GP: ['JHB', 'TSH', 'EKU'],
  WC: ['CPT'],
  KZN: ['DBN'],
  LP: ['POL'],
  EC: ['BUF', 'NMA'],
}

test('province/municipality pairs validate nationally without inventing', () => {
  assert.equal(isValidMunicipalitySelection('GP', 'JHB', CANONICAL), true)
  assert.equal(isValidMunicipalitySelection('WC', 'CPT', CANONICAL), true)
  assert.equal(isValidMunicipalitySelection('KZN', 'DBN', CANONICAL), true)
  assert.equal(isValidMunicipalitySelection('LP', 'POL', CANONICAL), true)
  assert.equal(isValidMunicipalitySelection('EC', 'BUF', CANONICAL), true)
  assert.equal(isValidMunicipalitySelection('GP', 'CPT', CANONICAL), false)
  assert.equal(isValidMunicipalitySelection('GP', 'FAKE', CANONICAL), false)
  assert.equal(isValidMunicipalitySelection('', 'JHB', CANONICAL), false)
})

test('optional ward blank accepted; overlong rejected', () => {
  assert.equal(normalizeOptionalWard(''), null)
  assert.equal(normalizeOptionalWard('79'), '79')
  assert.equal(normalizeOptionalWard('x'.repeat(65)), null)
})

test('signup requires province and municipality; ward optional', () => {
  const signup = read('src/components/Auth/SignupForm.tsx')
  assert.match(signup, /Province and municipality are required/)
  assert.match(signup, /errors\.province/)
  assert.match(signup, /errors\.municipality/)
  assert.match(signup, /isValidMunicipalitySelection/)
  assert.match(signup, /Ward — optional/)
  assert.doesNotMatch(signup, /Province and municipality are optional now/)
})

test('southAfricaData exports national validators', () => {
  const data = read('src/lib/southAfricaData.ts')
  assert.match(data, /export function isValidMunicipalitySelection/)
  assert.match(data, /export function normalizeOptionalWard/)
  assert.match(data, /code: 'JHB'/)
  assert.match(data, /code: 'CPT'/)
  assert.match(data, /code: 'DBN'/)
  assert.match(data, /code: 'POL'/)
  assert.match(data, /code: 'BUF'/)
})

test('shared CitizenMunicipalityGate used by updates, ideas, and new idea', () => {
  const gate = read('src/components/municipality/CitizenMunicipalityGate.tsx')
  const updates = read('src/app/updates/page.tsx')
  const ideas = read('src/app/ideas/page.tsx')
  const ideasNew = read('src/app/ideas/new/page.tsx')
  assert.match(gate, /AuthGate/)
  assert.match(gate, /ConfirmMunicipalityPanel/)
  assert.match(updates, /CitizenMunicipalityGate/)
  assert.match(ideas, /CitizenMunicipalityGate/)
  assert.match(ideasNew, /CitizenMunicipalityGate/)
})

test('CompleteProfileModal requires province and municipality when saving', () => {
  const modal = read('src/components/Auth/CompleteProfileModal.tsx')
  assert.match(modal, /isValidMunicipalitySelection/)
  assert.match(modal, /MunicipalitySelectFields/)
  assert.match(modal, /required/)
  assert.match(modal, /showWard/)
  assert.doesNotMatch(modal, /Province <span className="text-ink-subtle">\(optional\)<\/span>/)
})

test('UserSchema includes province with municipalityCode and wardId', () => {
  const types = read('src/types/index.ts')
  assert.match(types, /province:\s*z\.string\(\)\.optional\(\)/)
  assert.match(types, /municipalityCode:\s*z\.string\(\)\.optional\(\)/)
  assert.match(types, /wardId:\s*z\.string\(\)\.optional\(\)/)
})

test('Header surfaces Your Municipality context when resolved', () => {
  const header = read('src/components/layout/Header.tsx')
  assert.match(header, /Your Municipality/)
  assert.match(header, /useCitizenMunicipality/)
  assert.match(header, /getMunicipalityDisplayName/)
})

test('canonical municipality codes cover national samples', () => {
  const data = read('src/lib/southAfricaData.ts')
  // eThekwini is DBN in the Serve SA dataset (not ETH)
  assert.match(data, /code: 'DBN'[\s\S]*?eThekwini/)
  assert.match(data, /code: 'JHB'/)
  assert.match(data, /code: 'CPT'/)
  assert.match(data, /code: 'POL'/)
  assert.match(data, /code: 'BUF'/)
  assert.match(data, /code: 'TSH'/)
})

test('ops planning has no JHB fallback', () => {
  for (const rel of [
    'src/app/ops/planning/page.tsx',
    'src/app/ops/planning/documents/page.tsx',
    'src/app/ops/planning/documents/upload/page.tsx',
    'src/app/ops/planning/documents/[documentId]/ReviewPlanningDocumentClient.tsx',
  ]) {
    const src = read(rel)
    assert.doesNotMatch(src, /\|\|\s*'JHB'/)
    assert.doesNotMatch(src, /\|\|\s*"JHB"/)
  }
})

test('municipality page empty state is national-honest', () => {
  const page = read('src/app/municipality/page.tsx')
  assert.match(page, /Municipal information coming soon|municipalitySnapshotComingSoon/)
  assert.doesNotMatch(page, /Your community/)
  assert.doesNotMatch(page, /Projects in your ward/i)
  assert.match(page, /My Municipality/)
  assert.doesNotMatch(page, /municipalityCode \|\| ['"]JHB['"]/)
})

test('publishing allowlist empty means national when flag on', () => {
  const constants = read('src/lib/constants.ts')
  assert.match(constants, /Empty allow-list = all municipalities/)
  assert.match(
    constants,
    /MUNICIPAL_PUBLISHING_ALLOWLIST\.length === 0\) return true/
  )
})
