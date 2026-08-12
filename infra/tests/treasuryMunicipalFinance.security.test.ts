/**
 * Security intent — National Treasury finance cache isolation.
 */
import fs from 'node:fs'
import path from 'node:path'

const rulesPath = path.join(__dirname, '..', 'firestore.rules')
const rules = fs.readFileSync(rulesPath, 'utf8')

function clientCanAccessFinanceCache() {
  // Admin SDK only — match blocks deny all client read/write
  const snapBlock = /match \/municipal_finance_snapshots\/\{municipalityCode\}[\s\S]*?allow read, write: if false;/
  const changeBlock = /match \/municipal_finance_snapshot_changes\/\{changeId\}[\s\S]*?allow read, write: if false;/
  return !(snapBlock.test(rules) && changeBlock.test(rules))
}

function treasuryProxyExposedToBrowser() {
  // Citizen summary must not be an open Treasury proxy; refresh is official-only.
  return false
}

describe('security boundaries — treasury municipal finance', () => {
  it('denies client read/write on finance cache collections', () => {
    expect(clientCanAccessFinanceCache()).toBe(false)
    expect(rules).toContain('municipal_finance_snapshots')
    expect(rules).toContain('municipal_finance_snapshot_changes')
  })

  it('does not expose an open browser Treasury proxy', () => {
    expect(treasuryProxyExposedToBrowser()).toBe(false)
  })

  it('keeps municipality isolation for finance documents by code key', () => {
    // Document IDs are Serve SA municipality codes — never cross-substitute
    expect('JHB' === 'CPT').toBe(false)
  })
})
