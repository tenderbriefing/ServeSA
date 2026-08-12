/**
 * Web unit checks for Treasury finance citizen presentation helpers.
 */
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { describe, it } from 'node:test'

const require = createRequire(import.meta.url)

let contract
try {
  contract = require('@servesa/case-contract')
} catch {
  contract = require('../../../../packages/case-contract/dist/index.js')
}

describe('treasury municipal finance — web contract surface', () => {
  it('exports mapping and percentage helpers for citizen UI', () => {
    assert.equal(
      contract.mapServeSaMunicipalityCodeToTreasury('JHB').treasuryDemarcationCode,
      'JHB'
    )
    assert.equal(
      contract.mapServeSaMunicipalityCodeToTreasury('WTS').treasuryDemarcationCode,
      'DC48'
    )
    assert.equal(
      contract.formatCitizenBudgetPeriodLabel({
        financialYearLabel: '2025/26',
        amountType: 'ORGB',
        amountTypeLabel: 'Original Budget',
      }),
      '2025/26 Municipal Budget (Original Budget)'
    )
    const pct = contract.allocatePercentages([50, 30, 20])
    assert.equal(pct.reduce((s, n) => s + n, 0), 100)
  })

  it('does not fall back missing municipality to JHB', () => {
    const empty = contract.emptyMunicipalFinanceSnapshot('EC103')
    assert.equal(empty.municipalityCode, 'EC103')
    assert.notEqual(empty.municipalityCode, 'JHB')
    assert.equal(empty.operatingBudget, null)
  })
})
