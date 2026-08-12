/**
 * National Treasury Municipal Finance adapter (server-side).
 *
 * Flow: municipalityCode → Treasury API → normalisation → Firestore cache
 * → citizen summary. Frontend never sees raw Treasury payloads.
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import {
  TREASURY_MUNICIPAL_DATA_API_BASE,
  CITIZEN_BUDGET_AMOUNT_TYPE_PREFERENCE,
  CAPITAL_ACQUISITION_TYPES,
  TREASURY_AMOUNT_TYPE_LABEL,
  TREASURY_MUNICIPAL_FINANCE_CONTRACT_VERSION,
  MunicipalFinanceSnapshotSchema,
  mapServeSaMunicipalityCodeToTreasury,
  financialYearLabelFromEnd,
  buildMajorAllocations,
  emptyMunicipalFinanceSnapshot,
  fingerprintMunicipalFinanceSnapshot,
  type MunicipalFinanceSnapshot,
  type MunicipalityTreasuryIdentity,
  type TreasuryAmountTypeCode,
  type TreasuryProvenance,
} from '@servesa/case-contract'

const COLLECTION = 'municipal_finance_snapshots'
const CHANGE_COLLECTION = 'municipal_finance_snapshot_changes'

const DEFAULT_TIMEOUT_MS = 12_000
const MAX_RETRIES = 2
/** Cache considered fresh for citizen reads. */
export const TREASURY_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000
/** Completeness banner published on Municipal Money / API docs (2026 Q2). */
const TREASURY_COMPLETENESS_WARNING =
  'National Treasury figures have been updated with the latest 2026 Q2 data and are in the process of being verified for completeness and integrity.'

export type TreasuryMunicipalFinanceDeps = {
  fetchFn?: typeof fetch
  now?: () => Date
  timeoutMs?: number
}

type AggregateResponse = {
  status?: string
  message?: string
  summary?: { 'amount.sum'?: number | null }
  cells?: Array<Record<string, unknown>>
  total_cell_count?: number
}

type FactsResponse = {
  status?: string
  total_fact_count?: number
  data?: Array<Record<string, unknown>>
}

type ModelResponse = {
  status?: string
  model?: { last_updated?: string }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseCubeTimestamp(value: string | null | undefined): string | null {
  if (!value) return null
  const normalized = /T\d{2}:\d{2}$/.test(value) ? `${value}:00Z` : value
  const ms = Date.parse(normalized)
  if (!Number.isFinite(ms)) return null
  return new Date(ms).toISOString()
}

async function treasuryGet(
  pathAndQuery: string,
  deps: TreasuryMunicipalFinanceDeps
): Promise<unknown> {
  const fetchFn = deps.fetchFn || globalThis.fetch
  const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const url = pathAndQuery.startsWith('http')
    ? pathAndQuery
    : `${TREASURY_MUNICIPAL_DATA_API_BASE}${pathAndQuery}`

  let lastError: Error | null = null
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetchFn(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) {
        throw new Error(`Treasury HTTP ${res.status}`)
      }
      const body = await res.json()
      if (
        body &&
        typeof body === 'object' &&
        (body as { status?: string }).status === 'error'
      ) {
        throw new Error(
          `Treasury API error: ${(body as { message?: string }).message || 'unknown'}`
        )
      }
      return body
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      const retryable =
        /abort|timeout|HTTP 5|network|ECONNRESET|ETIMEDOUT/i.test(
          lastError.message
        ) || lastError.name === 'AbortError'
      if (!retryable || attempt === MAX_RETRIES) break
      await sleep(250 * (attempt + 1))
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastError || new Error('Treasury request failed')
}

function cut(parts: string[]): string {
  return encodeURIComponent(parts.join('|'))
}

function amountSum(body: AggregateResponse): number | null {
  const v = body.summary?.['amount.sum']
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return null
  return v
}

async function fetchIdentity(
  demarcationCode: string,
  deps: TreasuryMunicipalFinanceDeps
): Promise<MunicipalityTreasuryIdentity | null> {
  const body = (await treasuryGet(
    `/cubes/municipalities/facts?cut=${encodeURIComponent(
      `municipality.demarcation_code:${demarcationCode}`
    )}&page_size=1`,
    deps
  )) as FactsResponse
  const row = body.data?.[0]
  if (!row) return null
  const code = String(row['municipality.demarcation_code'] || '').trim()
  const name = String(row['municipality.name'] || '').trim()
  if (!code || !name) return null
  if (code.toUpperCase() !== demarcationCode.toUpperCase()) return null
  return {
    demarcationCode: code.toUpperCase(),
    name,
    longName: (row['municipality.long_name'] as string) || null,
    provinceCode: (row['municipality.province_code'] as string) || null,
    provinceName: (row['municipality.province_name'] as string) || null,
    category: (row['municipality.category'] as string) || null,
    miifCategory: (row['municipality.miif_category'] as string) || null,
  }
}

async function listYearEnds(
  demarcationCode: string,
  deps: TreasuryMunicipalFinanceDeps
): Promise<number[]> {
  const body = (await treasuryGet(
    `/cubes/incexp_v2/members/financial_year_end?cut=${cut([
      `demarcation.code:"${demarcationCode}"`,
    ])}&order=financial_year_end.year:desc&page_size=20`,
    deps
  )) as { data?: Array<{ 'financial_year_end.year'?: number }> }
  return (body.data || [])
    .map((r) => r['financial_year_end.year'])
    .filter((y): y is number => typeof y === 'number' && y >= 2019)
}

async function operatingTotal(
  demarcationCode: string,
  yearEnd: number,
  amountType: string,
  deps: TreasuryMunicipalFinanceDeps
): Promise<number | null> {
  const body = (await treasuryGet(
    `/cubes/incexp_v2/aggregate?aggregates=amount.sum&cut=${cut([
      `demarcation.code:"${demarcationCode}"`,
      'item.code:"4400"',
      `amount_type.code:"${amountType}"`,
      'period_length.length:"year"',
      `financial_year_end.year:${yearEnd}`,
    ])}`,
    deps
  )) as AggregateResponse
  return amountSum(body)
}

async function operatingByCategory(
  demarcationCode: string,
  yearEnd: number,
  amountType: string,
  deps: TreasuryMunicipalFinanceDeps
): Promise<Array<{ rawLabel: string; amountZar: number }>> {
  const body = (await treasuryGet(
    `/cubes/incexp_v2/aggregate?aggregates=amount.sum&cut=${cut([
      `demarcation.code:"${demarcationCode}"`,
      'item.code:"4400"',
      `amount_type.code:"${amountType}"`,
      'period_length.length:"year"',
      `financial_year_end.year:${yearEnd}`,
    ])}&drilldown=function.category_label`,
    deps
  )) as AggregateResponse
  return (body.cells || [])
    .map((cell) => ({
      rawLabel: String(cell['function.category_label'] || '').trim(),
      amountZar: Number(cell['amount.sum']),
    }))
    .filter(
      (c) =>
        c.rawLabel &&
        Number.isFinite(c.amountZar) &&
        c.amountZar > 0
    )
}

async function capitalAcquisitionTotal(
  demarcationCode: string,
  yearEnd: number,
  amountType: string,
  deps: TreasuryMunicipalFinanceDeps
): Promise<number | null> {
  const types = CAPITAL_ACQUISITION_TYPES.map((t) => `"${t}"`).join(';')
  const body = (await treasuryGet(
    `/cubes/capital_v2/aggregate?aggregates=amount.sum&cut=${cut([
      `demarcation.code:"${demarcationCode}"`,
      `amount_type.code:"${amountType}"`,
      'period_length.length:"year"',
      `financial_year_end.year:${yearEnd}`,
      `capital_type.code:${types}`,
    ])}`,
    deps
  )) as AggregateResponse
  return amountSum(body)
}

async function cubeLastUpdated(
  cube: string,
  deps: TreasuryMunicipalFinanceDeps
): Promise<string | null> {
  try {
    const body = (await treasuryGet(`/cubes/${cube}/model`, deps)) as ModelResponse
    return body.model?.last_updated || null
  } catch {
    return null
  }
}

/* eslint-disable no-unused-vars -- callback arg names document the probe contract */
type OperatingProbe = (
  yearEnd: number,
  amountType: TreasuryAmountTypeCode
) => Promise<number | null>
/* eslint-enable no-unused-vars */

async function selectYearAndAmountType(
  yearEnds: number[],
  probe: OperatingProbe
): Promise<{
  yearEnd: number
  amountType: TreasuryAmountTypeCode
  operating: number
} | null> {
  for (const yearEnd of yearEnds) {
    for (const amountType of CITIZEN_BUDGET_AMOUNT_TYPE_PREFERENCE) {
      const operating = await probe(yearEnd, amountType)
      if (operating != null && operating > 0) {
        return { yearEnd, amountType, operating }
      }
    }
  }
  return null
}

function provenance(input: {
  dataset: string
  municipalityCode: string
  treasuryDemarcationCode: string
  financialYearEnd: number
  amountType: string
  retrievedAt: string
  cubeLastUpdated?: string | null
}): TreasuryProvenance {
  const financialYearLabel = financialYearLabelFromEnd(input.financialYearEnd)
  return {
    sourceType: 'national_treasury',
    dataset: input.dataset,
    municipalityCode: input.municipalityCode,
    treasuryDemarcationCode: input.treasuryDemarcationCode,
    financialYearEnd: input.financialYearEnd,
    financialYearLabel,
    amountType: input.amountType,
    amountTypeLabel:
      TREASURY_AMOUNT_TYPE_LABEL[input.amountType as TreasuryAmountTypeCode] ||
      input.amountType,
    dataPeriod: `financial_year_end:${input.financialYearEnd};period_length:year`,
    periodLength: 'year',
    retrievedAt: input.retrievedAt,
    sourceUpdatedAt: input.cubeLastUpdated || null,
    sourceUrl: 'https://municipaldata.treasury.gov.za/',
    reference: 'National Treasury Municipal Finance Data (Section 71 / mSCOA)',
    verificationState: 'official_source_under_verification',
    cubeLastUpdated: input.cubeLastUpdated || null,
  }
}

/**
 * Live fetch + normalise for one municipality. Does not write cache.
 */
export async function fetchMunicipalFinanceFromTreasury(
  municipalityCode: string,
  deps: TreasuryMunicipalFinanceDeps = {}
): Promise<MunicipalFinanceSnapshot> {
  const now = deps.now?.() || new Date()
  const retrievedAt = now.toISOString()
  const mapping = mapServeSaMunicipalityCodeToTreasury(municipalityCode)

  if (!mapping.treasuryDemarcationCode) {
    return emptyMunicipalFinanceSnapshot(mapping.serveSaCode || municipalityCode, {
      reason: mapping.aliasReason || 'unmapped_municipality_code',
      cacheStatus: 'miss',
      dataQuality: 'unavailable',
      retrievedAt,
    })
  }

  const treasuryCode = mapping.treasuryDemarcationCode

  try {
    const identity = await fetchIdentity(treasuryCode, deps)
    if (!identity) {
      return emptyMunicipalFinanceSnapshot(mapping.serveSaCode, {
        treasuryDemarcationCode: treasuryCode,
        reason: 'municipality_not_found_in_treasury',
        cacheStatus: 'miss',
        dataQuality: 'unavailable',
        retrievedAt,
      })
    }

    const yearEnds = await listYearEnds(treasuryCode, deps)
    const selected = await selectYearAndAmountType(yearEnds, (y, at) =>
      operatingTotal(treasuryCode, y, at, deps)
    )

    if (!selected) {
      return {
        ...emptyMunicipalFinanceSnapshot(mapping.serveSaCode, {
          treasuryDemarcationCode: treasuryCode,
          reason: 'no_operating_budget_for_preferred_amount_types',
          cacheStatus: 'miss',
          dataQuality: 'partial',
          retrievedAt,
        }),
        identity,
      }
    }

    const { yearEnd, amountType, operating } = selected
    const fyLabel = financialYearLabelFromEnd(yearEnd)
    const amountTypeLabel =
      TREASURY_AMOUNT_TYPE_LABEL[amountType] || amountType

    const [categories, capital, incexpUpdated, capitalUpdated] =
      await Promise.all([
        operatingByCategory(treasuryCode, yearEnd, amountType, deps),
        capitalAcquisitionTotal(treasuryCode, yearEnd, amountType, deps),
        cubeLastUpdated('incexp_v2', deps),
        cubeLastUpdated('capital_v2', deps),
      ])

    const majorAllocations = buildMajorAllocations({
      categories,
      financialYearLabel: fyLabel,
      amountType,
      sourceDataset: 'incexp_v2',
      sourceRetrievalDate: retrievedAt,
      maxCategories: 7,
    })

    const operatingBudget = {
      amountZar: operating,
      financialYearLabel: fyLabel,
      amountType,
      amountTypeLabel,
      derivation:
        'incexp_v2 aggregate amount.sum where item.code=4400 (Total Expenditure), period_length=year, sum across government functions',
      dataset: 'incexp_v2',
    }

    const capitalBudget =
      capital != null && capital > 0
        ? {
            amountZar: capital,
            financialYearLabel: fyLabel,
            amountType,
            amountTypeLabel,
            derivation:
              'capital_v2 aggregate amount.sum for capital_type NEW+RENEWAL+UPGRADING (excludes DEPRECIATION and REPAIR_MNT), period_length=year',
            dataset: 'capital_v2',
          }
        : null

    const totalBudget =
      capitalBudget != null
        ? {
            amountZar: operating + capitalBudget.amountZar,
            financialYearLabel: fyLabel,
            amountType,
            amountTypeLabel,
            derivation:
              'operating_total_expenditure_plus_capital_acquisition (same financial year and amount type)',
            dataset: 'incexp_v2+capital_v2',
          }
        : null

    const sources: TreasuryProvenance[] = [
      provenance({
        dataset: 'municipalities',
        municipalityCode: mapping.serveSaCode,
        treasuryDemarcationCode: treasuryCode,
        financialYearEnd: yearEnd,
        amountType,
        retrievedAt,
      }),
      provenance({
        dataset: 'incexp_v2',
        municipalityCode: mapping.serveSaCode,
        treasuryDemarcationCode: treasuryCode,
        financialYearEnd: yearEnd,
        amountType,
        retrievedAt,
        cubeLastUpdated: incexpUpdated,
      }),
    ]
    if (capitalBudget) {
      sources.push(
        provenance({
          dataset: 'capital_v2',
          municipalityCode: mapping.serveSaCode,
          treasuryDemarcationCode: treasuryCode,
          financialYearEnd: yearEnd,
          amountType,
          retrievedAt,
          cubeLastUpdated: capitalUpdated,
        })
      )
    }

    const snapshot: MunicipalFinanceSnapshot = {
      contractVersion: TREASURY_MUNICIPAL_FINANCE_CONTRACT_VERSION,
      municipalityCode: mapping.serveSaCode,
      treasuryDemarcationCode: treasuryCode,
      identity,
      financialYearEnd: yearEnd,
      financialYearLabel: fyLabel,
      amountType,
      amountTypeLabel,
      periodLength: 'year',
      dataPeriod: `financial_year_end:${yearEnd};period_length:year;amount_type:${amountType}`,
      operatingBudget,
      capitalBudget,
      totalBudget,
      majorAllocations,
      sources,
      dataUpdatedAt: parseCubeTimestamp(incexpUpdated) || retrievedAt,
      retrievedAt,
      cacheStatus: 'fresh',
      dataQuality: 'official_source_under_verification',
      completenessWarning: TREASURY_COMPLETENESS_WARNING,
      empty: false,
      emptyReason: null,
    }

    return MunicipalFinanceSnapshotSchema.parse(snapshot)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return emptyMunicipalFinanceSnapshot(mapping.serveSaCode, {
      treasuryDemarcationCode: treasuryCode,
      reason: `treasury_fetch_failed:${message.slice(0, 180)}`,
      cacheStatus: 'error',
      dataQuality: 'unavailable',
      retrievedAt,
    })
  }
}

function db() {
  return getFirestore()
}

export async function readMunicipalFinanceCache(
  municipalityCode: string
): Promise<MunicipalFinanceSnapshot | null> {
  const code = municipalityCode.trim().toUpperCase()
  if (!code) return null
  const snap = await db().collection(COLLECTION).doc(code).get()
  if (!snap.exists) return null
  const data = snap.data() as Record<string, unknown>
  const parsed = MunicipalFinanceSnapshotSchema.safeParse({
    ...data,
    // strip cache-only fields if present
    previousFingerprint: undefined,
    fingerprint: undefined,
    lastSuccessfulAt: undefined,
    lastAttemptAt: undefined,
    lastError: undefined,
  })
  if (!parsed.success) return null
  return parsed.data
}

export async function getMunicipalFinanceSnapshotCached(
  municipalityCode: string,
  deps: TreasuryMunicipalFinanceDeps = {}
): Promise<MunicipalFinanceSnapshot> {
  const now = deps.now?.() || new Date()
  const cached = await readMunicipalFinanceCache(municipalityCode)
  if (cached && !cached.empty) {
    const retrievedMs = Date.parse(cached.retrievedAt)
    const age = Number.isFinite(retrievedMs)
      ? now.getTime() - retrievedMs
      : Number.POSITIVE_INFINITY
    if (age <= TREASURY_CACHE_TTL_MS) {
      return { ...cached, cacheStatus: 'fresh' }
    }
    return {
      ...cached,
      cacheStatus: 'stale',
      dataQuality: 'stale_cache',
    }
  }
  if (cached?.empty === false) {
    return cached
  }
  // No usable cache — do not block citizen path on live Treasury.
  // Return empty; scheduled refresh populates cache.
  if (cached) {
    return { ...cached, cacheStatus: 'miss' }
  }
  const mapping = mapServeSaMunicipalityCodeToTreasury(municipalityCode)
  return emptyMunicipalFinanceSnapshot(mapping.serveSaCode || municipalityCode, {
    treasuryDemarcationCode: mapping.treasuryDemarcationCode,
    reason: mapping.aliasReason || 'cache_miss_awaiting_refresh',
    cacheStatus: 'miss',
    dataQuality: 'unavailable',
    retrievedAt: now.toISOString(),
  })
}

/**
 * Refresh one municipality from Treasury and persist only on successful validation.
 * Malformed / empty live responses do not overwrite a previously valid cache.
 */
export async function refreshMunicipalFinanceSnapshot(
  municipalityCode: string,
  deps: TreasuryMunicipalFinanceDeps = {}
): Promise<{
  municipalityCode: string
  updated: boolean
  changed: boolean
  snapshot: MunicipalFinanceSnapshot
  error?: string
}> {
  const code = municipalityCode.trim().toUpperCase()
  const now = deps.now?.() || new Date()
  const ref = db().collection(COLLECTION).doc(code)
  const existing = await ref.get()
  const previous = existing.exists
    ? (existing.data() as Record<string, unknown>)
    : null

  const live = await fetchMunicipalFinanceFromTreasury(code, deps)
  const attemptAt = now.toISOString()

  if (live.empty || live.cacheStatus === 'error') {
    // Keep last good cache
    if (previous && previous.empty === false) {
      await ref.set(
        {
          lastAttemptAt: attemptAt,
          lastError: live.emptyReason || 'refresh_failed',
        },
        { merge: true }
      )
      const kept = await getMunicipalFinanceSnapshotCached(code, deps)
      return {
        municipalityCode: code,
        updated: false,
        changed: false,
        snapshot: kept,
        error: live.emptyReason || 'refresh_failed',
      }
    }
    await ref.set(
      {
        ...live,
        fingerprint: fingerprintMunicipalFinanceSnapshot(live),
        previousFingerprint: previous?.fingerprint || null,
        lastSuccessfulAt: previous?.lastSuccessfulAt || null,
        lastAttemptAt: attemptAt,
        lastError: live.emptyReason || 'empty',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
    return {
      municipalityCode: code,
      updated: true,
      changed: false,
      snapshot: live,
      error: live.emptyReason || undefined,
    }
  }

  const fingerprint = fingerprintMunicipalFinanceSnapshot(live)
  const previousFingerprint =
    typeof previous?.fingerprint === 'string' ? previous.fingerprint : null
  const changed = Boolean(previousFingerprint && previousFingerprint !== fingerprint)

  await ref.set(
    {
      ...live,
      fingerprint,
      previousFingerprint,
      lastSuccessfulAt: attemptAt,
      lastAttemptAt: attemptAt,
      lastError: null,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: false }
  )

  if (changed || !previousFingerprint) {
    await db().collection(CHANGE_COLLECTION).add({
      municipalityCode: code,
      treasuryDemarcationCode: live.treasuryDemarcationCode,
      financialYearEnd: live.financialYearEnd,
      amountType: live.amountType,
      previousFingerprint,
      fingerprint,
      previousOperatingZar: (previous?.operatingBudget as { amountZar?: number } | undefined)
        ?.amountZar ?? null,
      newOperatingZar: live.operatingBudget?.amountZar ?? null,
      previousCapitalZar: (previous?.capitalBudget as { amountZar?: number } | undefined)
        ?.amountZar ?? null,
      newCapitalZar: live.capitalBudget?.amountZar ?? null,
      retrievedAt: live.retrievedAt,
      createdAt: FieldValue.serverTimestamp(),
    })
  }

  return {
    municipalityCode: code,
    updated: true,
    changed,
    snapshot: live,
  }
}

/** Default refresh set: metros + mapped Gauteng districts (national-capable, staged list). */
export const DEFAULT_TREASURY_REFRESH_MUNICIPALITIES = [
  'JHB',
  'TSH',
  'EKU',
  'CPT',
  'ETH',
  'WTS',
  'SED',
] as const

export async function refreshMunicipalFinanceBatch(
  municipalityCodes: readonly string[] = DEFAULT_TREASURY_REFRESH_MUNICIPALITIES,
  deps: TreasuryMunicipalFinanceDeps = {}
) {
  const results = []
  for (const code of municipalityCodes) {
    try {
      results.push(await refreshMunicipalFinanceSnapshot(code, deps))
    } catch (err) {
      results.push({
        municipalityCode: code,
        updated: false,
        changed: false,
        snapshot: emptyMunicipalFinanceSnapshot(code, {
          reason: err instanceof Error ? err.message : 'batch_error',
          cacheStatus: 'error',
        }),
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }
  return {
    success: true,
    refreshedAt: (deps.now?.() || new Date()).toISOString(),
    results,
  }
}
