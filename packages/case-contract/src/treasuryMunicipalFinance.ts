/**
 * National Treasury Municipal Finance — shared contract for My Municipality.
 *
 * Source: municipaldata.treasury.gov.za (Section 71 / mSCOA cubes).
 * Citizen UI must consume this normalised shape — never raw Treasury payloads.
 */

import { z } from 'zod'

export const TREASURY_MUNICIPAL_FINANCE_CONTRACT_VERSION = '1.0.0'

/** Official Municipal Finance API base (no credentials required). */
export const TREASURY_MUNICIPAL_DATA_API_BASE =
  'https://municipaldata.treasury.gov.za/api'

export const TREASURY_AMOUNT_TYPE_CODES = [
  'ORGB',
  'ADJB',
  'TABB',
  'ACT',
  'AUDA',
  'PAUD',
  'RAUD',
  'IBY1',
  'IBY2',
  'ITY1',
  'ITY2',
  'SCHD',
  'TRFR',
] as const

export type TreasuryAmountTypeCode = (typeof TREASURY_AMOUNT_TYPE_CODES)[number]

export const TREASURY_AMOUNT_TYPE_LABEL: Record<TreasuryAmountTypeCode, string> =
  {
    ORGB: 'Original Budget',
    ADJB: 'Adjusted Budget',
    TABB: 'Tabled Budget',
    ACT: 'Actual',
    AUDA: 'Audited Actual',
    PAUD: 'Pre-audit',
    RAUD: 'Restructured Audit',
    IBY1: 'Forecast 1 year ahead of budget year',
    IBY2: 'Forecast 2 years ahead of budget year',
    ITY1: 'ITY1',
    ITY2: 'ITY2',
    SCHD: 'Approved payment schedule',
    TRFR: 'Transferred from Provincial Departments to Municipalities',
  }

/**
 * Citizen Municipal Budget Snapshot amount-type preference (ordered).
 * Prefer approved/adopted original budget; fall back to adjusted; never mix
 * budget with YTD/actual in the same snapshot metrics.
 */
export const CITIZEN_BUDGET_AMOUNT_TYPE_PREFERENCE: readonly TreasuryAmountTypeCode[] =
  ['ORGB', 'ADJB']

/** Capital acquisition types included in citizen capital budget (excludes depreciation & repairs). */
export const CAPITAL_ACQUISITION_TYPES = [
  'NEW',
  'RENEWAL',
  'UPGRADING',
] as const

export const TreasuryDataQualitySchema = z.enum([
  'official_source',
  'official_source_under_verification',
  'partial',
  'unavailable',
  'stale_cache',
])

export type TreasuryDataQuality = z.infer<typeof TreasuryDataQualitySchema>

export const TreasuryProvenanceSchema = z.object({
  sourceType: z.literal('national_treasury'),
  dataset: z.string().min(1).max(64),
  municipalityCode: z.string().min(1).max(32),
  treasuryDemarcationCode: z.string().min(1).max(32),
  financialYearEnd: z.number().int().min(2000).max(2100),
  financialYearLabel: z.string().min(4).max(16),
  amountType: z.string().min(1).max(16),
  amountTypeLabel: z.string().min(1).max(120),
  dataPeriod: z.string().min(1).max(64),
  periodLength: z.literal('year'),
  retrievedAt: z.string().datetime(),
  sourceUpdatedAt: z.string().max(64).optional().nullable(),
  sourceUrl: z.string().url().max(2048),
  reference: z.string().max(240).optional(),
  verificationState: TreasuryDataQualitySchema,
  cubeLastUpdated: z.string().max(64).optional().nullable(),
})

export type TreasuryProvenance = z.infer<typeof TreasuryProvenanceSchema>

export const MajorAllocationSchema = z.object({
  id: z.string().min(1).max(64),
  rawTreasuryLabel: z.string().min(1).max(200),
  displayLabel: z.string().min(1).max(200),
  amountZar: z.number().finite().nonnegative(),
  percentage: z.number().finite().nonnegative().max(100),
  denominatorZar: z.number().finite().nonnegative(),
  financialYearLabel: z.string().min(4).max(16),
  amountType: z.string().min(1).max(16),
  sourceDataset: z.string().min(1).max(64),
  sourceRetrievalDate: z.string().datetime(),
})

export type MajorAllocation = z.infer<typeof MajorAllocationSchema>

export const BudgetMetricSchema = z.object({
  amountZar: z.number().finite().nonnegative(),
  financialYearLabel: z.string().min(4).max(16),
  amountType: z.string().min(1).max(16),
  amountTypeLabel: z.string().min(1).max(120),
  derivation: z.string().min(1).max(240),
  dataset: z.string().min(1).max(64),
})

export type BudgetMetric = z.infer<typeof BudgetMetricSchema>

export const MunicipalityTreasuryIdentitySchema = z.object({
  demarcationCode: z.string().min(1).max(32),
  name: z.string().min(1).max(200),
  longName: z.string().max(240).optional().nullable(),
  provinceCode: z.string().max(8).optional().nullable(),
  provinceName: z.string().max(120).optional().nullable(),
  category: z.string().max(8).optional().nullable(),
  miifCategory: z.string().max(8).optional().nullable(),
})

export type MunicipalityTreasuryIdentity = z.infer<
  typeof MunicipalityTreasuryIdentitySchema
>

export const MunicipalFinanceSnapshotSchema = z.object({
  contractVersion: z.literal(TREASURY_MUNICIPAL_FINANCE_CONTRACT_VERSION),
  municipalityCode: z.string().min(1).max(32),
  treasuryDemarcationCode: z.string().min(1).max(32),
  identity: MunicipalityTreasuryIdentitySchema.nullable(),
  financialYearEnd: z.number().int().min(2000).max(2100).nullable(),
  financialYearLabel: z.string().min(4).max(16).nullable(),
  amountType: z.string().min(1).max(16).nullable(),
  amountTypeLabel: z.string().min(1).max(120).nullable(),
  periodLength: z.literal('year').nullable(),
  dataPeriod: z.string().max(64).nullable(),
  /** Operating: incexp_v2 item 4400 Total Expenditure (sum across functions). */
  operatingBudget: BudgetMetricSchema.nullable(),
  /**
   * Capital: capital_v2 NEW+RENEWAL+UPGRADING only
   * (excludes DEPRECIATION and REPAIR_MNT).
   */
  capitalBudget: BudgetMetricSchema.nullable(),
  /**
   * Derived only when both operating and capital exist for the same FY + amount type.
   * Formula: operatingBudget + capitalBudget.
   */
  totalBudget: BudgetMetricSchema.nullable(),
  majorAllocations: z.array(MajorAllocationSchema).max(12),
  sources: z.array(TreasuryProvenanceSchema).max(12),
  dataUpdatedAt: z.string().datetime().nullable(),
  retrievedAt: z.string().datetime(),
  cacheStatus: z.enum(['fresh', 'stale', 'miss', 'error']),
  dataQuality: TreasuryDataQualitySchema,
  completenessWarning: z.string().max(500).optional().nullable(),
  empty: z.boolean(),
  emptyReason: z.string().max(240).optional().nullable(),
})

export type MunicipalFinanceSnapshot = z.infer<
  typeof MunicipalFinanceSnapshotSchema
>

export const MunicipalFinanceCacheRecordSchema =
  MunicipalFinanceSnapshotSchema.extend({
    previousFingerprint: z.string().max(128).optional().nullable(),
    fingerprint: z.string().min(1).max(128),
    lastSuccessfulAt: z.string().datetime(),
    lastAttemptAt: z.string().datetime(),
    lastError: z.string().max(500).optional().nullable(),
  })

export type MunicipalFinanceCacheRecord = z.infer<
  typeof MunicipalFinanceCacheRecordSchema
>

/**
 * Explicit Serve SA → Treasury demarcation aliases.
 * Prefer 1:1 MDB codes; only list stable identifier mismatches (never name matching).
 * Metsweding (MTS) is intentionally unmapped — district was disestablished; do not
 * substitute Tshwane financials.
 */
export const SERVE_SA_TO_TREASURY_DEMARCATION: Readonly<Record<string, string>> =
  {
    WTS: 'DC48', // West Rand District
    SED: 'DC42', // Sedibeng District
    DBN: 'ETH', // eThekwini (legacy Serve SA alias)
  }

export type MunicipalityCodeMappingResult = {
  serveSaCode: string
  treasuryDemarcationCode: string | null
  mapping: 'identity' | 'alias' | 'unmapped'
  aliasReason?: string
}

export function mapServeSaMunicipalityCodeToTreasury(
  municipalityCode: string | null | undefined
): MunicipalityCodeMappingResult {
  const serveSaCode = (municipalityCode || '').trim().toUpperCase()
  if (!serveSaCode) {
    return {
      serveSaCode: '',
      treasuryDemarcationCode: null,
      mapping: 'unmapped',
      aliasReason: 'empty_municipality_code',
    }
  }
  if (Object.prototype.hasOwnProperty.call(SERVE_SA_TO_TREASURY_DEMARCATION, serveSaCode)) {
    return {
      serveSaCode,
      treasuryDemarcationCode: SERVE_SA_TO_TREASURY_DEMARCATION[serveSaCode],
      mapping: 'alias',
      aliasReason: `explicit_alias:${serveSaCode}`,
    }
  }
  // Known Serve SA codes with no safe Treasury substitute
  if (serveSaCode === 'MTS') {
    return {
      serveSaCode,
      treasuryDemarcationCode: null,
      mapping: 'unmapped',
      aliasReason: 'metsweding_disestablished_no_safe_substitute',
    }
  }
  return {
    serveSaCode,
    treasuryDemarcationCode: serveSaCode,
    mapping: 'identity',
  }
}

/** SA municipal FY ends 30 June; yearEnd 2026 ⇒ label 2025/26 */
export function financialYearLabelFromEnd(yearEnd: number): string {
  const start = yearEnd - 1
  const endShort = String(yearEnd).slice(-2)
  return `${start}/${endShort}`
}

/**
 * Current municipal financial year-end as of a calendar date (Africa/Johannesburg).
 * FY runs 1 July → 30 June.
 */
export function currentMunicipalFinancialYearEnd(asOf: Date = new Date()): number {
  const year = asOf.getUTCFullYear()
  const month = asOf.getUTCMonth() // 0-based
  // Before July → previous FY still current (year-end = this calendar year)
  // On/after 1 July → new FY (year-end = next calendar year)
  return month >= 6 ? year + 1 : year
}

export function formatCitizenBudgetPeriodLabel(input: {
  financialYearLabel: string
  amountType: string
  amountTypeLabel: string
}): string {
  if (input.amountType === 'ORGB' || input.amountType === 'ADJB' || input.amountType === 'TABB') {
    return `${input.financialYearLabel} Municipal Budget (${input.amountTypeLabel})`
  }
  if (input.amountType === 'AUDA' || input.amountType === 'ACT' || input.amountType === 'PAUD') {
    return `${input.financialYearLabel} Actual Expenditure (${input.amountTypeLabel})`
  }
  return `${input.financialYearLabel} (${input.amountTypeLabel})`
}

const FUNCTION_CATEGORY_DISPLAY: Record<string, string> = {
  'Trading services': 'Trading services',
  'Municipal governance and administration':
    'Municipal governance & administration',
  'Community and public safety': 'Community & public safety',
  'Economic and environmental services': 'Economic & environmental services',
  Other: 'Other municipal services',
}

export function citizenLabelForFunctionCategory(raw: string): string {
  return FUNCTION_CATEGORY_DISPLAY[raw] || raw
}

/**
 * Deterministic percentage to 1 decimal place.
 * Shares are computed from integer minor units (cents) where possible to avoid drift.
 */
export function allocatePercentages(
  amountsZar: number[],
  options?: { precision?: number }
): number[] {
  const precision = options?.precision ?? 1
  const factor = 10 ** precision
  if (!amountsZar.length) return []
  const total = amountsZar.reduce((s, n) => s + (Number.isFinite(n) ? n : 0), 0)
  if (total <= 0) return amountsZar.map(() => 0)

  const raw = amountsZar.map((n) => (n / total) * 100)
  const floored = raw.map((p) => Math.floor(p * factor))
  let remainder = Math.round(100 * factor - floored.reduce((s, n) => s + n, 0))
  const order = raw
    .map((p, i) => ({ i, frac: p * factor - floored[i] }))
    .sort((a, b) => b.frac - a.frac)
  const out = [...floored]
  let idx = 0
  while (remainder > 0 && order.length) {
    out[order[idx % order.length].i] += 1
    remainder -= 1
    idx += 1
  }
  return out.map((n) => n / factor)
}

export function buildMajorAllocations(input: {
  categories: Array<{ rawLabel: string; amountZar: number }>
  financialYearLabel: string
  amountType: string
  sourceDataset: string
  sourceRetrievalDate: string
  maxCategories?: number
}): MajorAllocation[] {
  const max = input.maxCategories ?? 7
  const sorted = [...input.categories]
    .filter((c) => Number.isFinite(c.amountZar) && c.amountZar > 0)
    .sort((a, b) => b.amountZar - a.amountZar)
    .slice(0, max)
  const denominator = sorted.reduce((s, c) => s + c.amountZar, 0)
  const percentages = allocatePercentages(sorted.map((c) => c.amountZar))
  return sorted.map((c, i) => ({
    id: `alloc-${i + 1}-${slugify(c.rawLabel)}`,
    rawTreasuryLabel: c.rawLabel,
    displayLabel: citizenLabelForFunctionCategory(c.rawLabel),
    amountZar: c.amountZar,
    percentage: percentages[i] ?? 0,
    denominatorZar: denominator,
    financialYearLabel: input.financialYearLabel,
    amountType: input.amountType,
    sourceDataset: input.sourceDataset,
    sourceRetrievalDate: input.sourceRetrievalDate,
  }))
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

export function emptyMunicipalFinanceSnapshot(
  municipalityCode: string,
  opts?: {
    treasuryDemarcationCode?: string | null
    reason?: string
    cacheStatus?: MunicipalFinanceSnapshot['cacheStatus']
    dataQuality?: TreasuryDataQuality
    retrievedAt?: string
  }
): MunicipalFinanceSnapshot {
  const retrievedAt = opts?.retrievedAt || new Date().toISOString()
  return {
    contractVersion: TREASURY_MUNICIPAL_FINANCE_CONTRACT_VERSION,
    municipalityCode: municipalityCode.trim().toUpperCase() || 'UNKNOWN',
    treasuryDemarcationCode:
      opts?.treasuryDemarcationCode ||
      municipalityCode.trim().toUpperCase() ||
      'UNKNOWN',
    identity: null,
    financialYearEnd: null,
    financialYearLabel: null,
    amountType: null,
    amountTypeLabel: null,
    periodLength: null,
    dataPeriod: null,
    operatingBudget: null,
    capitalBudget: null,
    totalBudget: null,
    majorAllocations: [],
    sources: [],
    dataUpdatedAt: null,
    retrievedAt,
    cacheStatus: opts?.cacheStatus || 'miss',
    dataQuality: opts?.dataQuality || 'unavailable',
    completenessWarning: null,
    empty: true,
    emptyReason: opts?.reason || 'treasury_data_unavailable',
  }
}

export function fingerprintMunicipalFinanceSnapshot(
  snapshot: Pick<
    MunicipalFinanceSnapshot,
    | 'treasuryDemarcationCode'
    | 'financialYearEnd'
    | 'amountType'
    | 'operatingBudget'
    | 'capitalBudget'
    | 'majorAllocations'
  >
): string {
  const payload = JSON.stringify({
    code: snapshot.treasuryDemarcationCode,
    fy: snapshot.financialYearEnd,
    at: snapshot.amountType,
    op: snapshot.operatingBudget?.amountZar ?? null,
    cap: snapshot.capitalBudget?.amountZar ?? null,
    alloc: snapshot.majorAllocations.map((a) => [
      a.rawTreasuryLabel,
      a.amountZar,
      a.percentage,
    ]),
  })
  let hash = 0
  for (let i = 0; i < payload.length; i++) {
    hash = (hash * 31 + payload.charCodeAt(i)) >>> 0
  }
  return `tf_${hash.toString(16)}_${payload.length}`
}
