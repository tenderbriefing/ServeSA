/**
 * Feature-flag helpers for municipal planning.
 */

import test from 'node:test'
import assert from 'node:assert/strict'

/**
 * Mirror of isMunicipalPlanningEnabledFor for unit isolation
 * (avoids pulling Next env module graph).
 */
function isEnabled(flagOn, allowlist, muni) {
  if (!flagOn) return false
  const code = (muni || '').trim().toUpperCase()
  if (!code) return false
  return allowlist.map((s) => s.toUpperCase()).includes(code)
}

test('municipal planning global OFF blocks all munis', () => {
  assert.equal(isEnabled(false, ['JHB'], 'JHB'), false)
})

test('allow-list gates municipality when flag ON', () => {
  assert.equal(isEnabled(true, ['JHB'], 'JHB'), true)
  assert.equal(isEnabled(true, ['JHB'], 'CPT'), false)
  assert.equal(isEnabled(true, ['JHB'], null), false)
})

test('Gauteng allow-list includes metros and excludes CPT', () => {
  const gauteng = ['JHB', 'TSH', 'EKU', 'WTS', 'SED', 'MTS']
  for (const code of gauteng) {
    assert.equal(isEnabled(true, gauteng, code), true, code)
  }
  assert.equal(isEnabled(true, gauteng, 'CPT'), false)
  assert.equal(isEnabled(true, gauteng, 'DBN'), false)
})
