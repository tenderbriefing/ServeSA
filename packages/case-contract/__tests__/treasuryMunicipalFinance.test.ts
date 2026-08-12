import {
  mapServeSaMunicipalityCodeToTreasury,
  financialYearLabelFromEnd,
  currentMunicipalFinancialYearEnd,
  allocatePercentages,
  buildMajorAllocations,
  formatCitizenBudgetPeriodLabel,
  emptyMunicipalFinanceSnapshot,
  fingerprintMunicipalFinanceSnapshot,
  CITIZEN_BUDGET_AMOUNT_TYPE_PREFERENCE,
  CAPITAL_ACQUISITION_TYPES,
  SERVE_SA_TO_TREASURY_DEMARCATION,
} from '../src/treasuryMunicipalFinance'

describe('treasury municipal finance contract', () => {
  test('maps metro codes identity to Treasury demarcation', () => {
    for (const code of ['JHB', 'CPT', 'TSH', 'EKU', 'ETH']) {
      const m = mapServeSaMunicipalityCodeToTreasury(code)
      expect(m.mapping).toBe('identity')
      expect(m.treasuryDemarcationCode).toBe(code)
    }
  })

  test('applies explicit aliases only where required', () => {
    expect(mapServeSaMunicipalityCodeToTreasury('WTS')).toEqual({
      serveSaCode: 'WTS',
      treasuryDemarcationCode: 'DC48',
      mapping: 'alias',
      aliasReason: 'explicit_alias:WTS',
    })
    expect(mapServeSaMunicipalityCodeToTreasury('SED').treasuryDemarcationCode).toBe(
      'DC42'
    )
    expect(mapServeSaMunicipalityCodeToTreasury('DBN').treasuryDemarcationCode).toBe(
      'ETH'
    )
    expect(SERVE_SA_TO_TREASURY_DEMARCATION.WTS).toBe('DC48')
  })

  test('does not map Metsweding to Tshwane (no Johannesburg-style fallback)', () => {
    const m = mapServeSaMunicipalityCodeToTreasury('MTS')
    expect(m.treasuryDemarcationCode).toBeNull()
    expect(m.mapping).toBe('unmapped')
    expect(m.aliasReason).toMatch(/disestablished/)
  })

  test('never invents JHB for empty codes', () => {
    const m = mapServeSaMunicipalityCodeToTreasury('')
    expect(m.treasuryDemarcationCode).toBeNull()
    expect(m.treasuryDemarcationCode).not.toBe('JHB')
  })

  test('financial year label and current year-end', () => {
    expect(financialYearLabelFromEnd(2026)).toBe('2025/26')
    expect(financialYearLabelFromEnd(2027)).toBe('2026/27')
    // 12 Aug 2026 UTC → after 1 July → FY end 2027
    expect(currentMunicipalFinancialYearEnd(new Date('2026-08-12T12:00:00Z'))).toBe(
      2027
    )
    expect(currentMunicipalFinancialYearEnd(new Date('2026-06-15T12:00:00Z'))).toBe(
      2026
    )
  })

  test('citizen period labels distinguish budget vs actual', () => {
    expect(
      formatCitizenBudgetPeriodLabel({
        financialYearLabel: '2025/26',
        amountType: 'ORGB',
        amountTypeLabel: 'Original Budget',
      })
    ).toBe('2025/26 Municipal Budget (Original Budget)')
    expect(
      formatCitizenBudgetPeriodLabel({
        financialYearLabel: '2024/25',
        amountType: 'AUDA',
        amountTypeLabel: 'Audited Actual',
      })
    ).toBe('2024/25 Actual Expenditure (Audited Actual)')
  })

  test('amount type preference prefers ORGB then ADJB', () => {
    expect(CITIZEN_BUDGET_AMOUNT_TYPE_PREFERENCE).toEqual(['ORGB', 'ADJB'])
    expect(CAPITAL_ACQUISITION_TYPES).toEqual(['NEW', 'RENEWAL', 'UPGRADING'])
  })

  test('percentage allocation is deterministic and sums to 100', () => {
    const a = allocatePercentages([37114897942, 29714070647, 7968522000, 5194865843, 677257000])
    const b = allocatePercentages([37114897942, 29714070647, 7968522000, 5194865843, 677257000])
    expect(a).toEqual(b)
    expect(a.reduce((s, n) => s + n, 0)).toBeCloseTo(100, 5)
    expect(allocatePercentages([])).toEqual([])
    expect(allocatePercentages([0, 0])).toEqual([0, 0])
  })

  test('buildMajorAllocations retains raw labels and provenance fields', () => {
    const rows = buildMajorAllocations({
      categories: [
        { rawLabel: 'Trading services', amountZar: 50 },
        { rawLabel: 'Municipal governance and administration', amountZar: 30 },
        { rawLabel: 'Other', amountZar: 20 },
      ],
      financialYearLabel: '2025/26',
      amountType: 'ORGB',
      sourceDataset: 'incexp_v2',
      sourceRetrievalDate: '2026-08-12T12:00:00.000Z',
    })
    expect(rows).toHaveLength(3)
    expect(rows[0].rawTreasuryLabel).toBe('Trading services')
    expect(rows[0].displayLabel).toBe('Trading services')
    expect(rows[1].displayLabel).toBe('Municipal governance & administration')
    expect(rows.reduce((s, r) => s + r.percentage, 0)).toBeCloseTo(100, 5)
    expect(rows[0].sourceDataset).toBe('incexp_v2')
  })

  test('empty snapshot never copies another municipality', () => {
    const empty = emptyMunicipalFinanceSnapshot('CPT', {
      reason: 'missing',
    })
    expect(empty.municipalityCode).toBe('CPT')
    expect(empty.empty).toBe(true)
    expect(empty.operatingBudget).toBeNull()
    expect(empty.majorAllocations).toEqual([])
  })

  test('fingerprint changes when operating amount changes', () => {
    const base = {
      treasuryDemarcationCode: 'JHB',
      financialYearEnd: 2026,
      amountType: 'ORGB',
      operatingBudget: {
        amountZar: 100,
        financialYearLabel: '2025/26',
        amountType: 'ORGB',
        amountTypeLabel: 'Original Budget',
        derivation: 'x',
        dataset: 'incexp_v2',
      },
      capitalBudget: null,
      majorAllocations: [],
    }
    const a = fingerprintMunicipalFinanceSnapshot(base)
    const b = fingerprintMunicipalFinanceSnapshot({
      ...base,
      operatingBudget: { ...base.operatingBudget, amountZar: 200 },
    })
    expect(a).not.toBe(b)
  })
})
