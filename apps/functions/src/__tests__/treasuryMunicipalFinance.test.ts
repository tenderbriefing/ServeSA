/**
 * TreasuryMunicipalFinanceService — mocked API (deterministic).
 */

jest.mock('firebase-admin/firestore', () => {
  const store = new Map<string, Record<string, unknown>>()
  const changes: Record<string, unknown>[] = []
  return {
    FieldValue: { serverTimestamp: () => 'SERVER_TS' },
    getFirestore: () => ({
      collection: (name: string) => ({
        doc: (id: string) => ({
          get: async () => {
            const data = store.get(`${name}/${id}`)
            return {
              exists: Boolean(data),
              data: () => data,
            }
          },
          set: async (payload: Record<string, unknown>, opts?: { merge?: boolean }) => {
            const key = `${name}/${id}`
            if (opts?.merge && store.has(key)) {
              store.set(key, { ...store.get(key), ...payload })
            } else {
              store.set(key, { ...payload })
            }
          },
        }),
        add: async (payload: Record<string, unknown>) => {
          changes.push(payload)
          return { id: `chg_${changes.length}` }
        },
      }),
    }),
    __store: store,
    __changes: changes,
  }
})

import {
  fetchMunicipalFinanceFromTreasury,
  refreshMunicipalFinanceSnapshot,
  getMunicipalFinanceSnapshotCached,
} from '../treasury/TreasuryMunicipalFinanceService'

type MockRes = { ok: boolean; status: number; json: () => Promise<unknown> }

function jsonRes(body: unknown, status = 200): MockRes {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

function buildMockFetch(handlers: Record<string, unknown>) {
  return async (url: string): Promise<MockRes> => {
    const u = decodeURIComponent(url)
    for (const [needle, body] of Object.entries(handlers)) {
      if (u.includes(needle)) {
        if (body instanceof Error) throw body
        if (typeof body === 'object' && body && 'httpStatus' in (body as object)) {
          const b = body as { httpStatus: number; payload: unknown }
          return jsonRes(b.payload, b.httpStatus)
        }
        return jsonRes(body)
      }
    }
    return jsonRes({ status: 'ok', data: [], cells: [], summary: { 'amount.sum': null } })
  }
}

const JHB_HANDLERS: Record<string, unknown> = {
  '/cubes/municipalities/facts': {
    status: 'ok',
    total_fact_count: 1,
    data: [
      {
        'municipality.demarcation_code': 'JHB',
        'municipality.name': 'City of Johannesburg',
        'municipality.long_name': 'City of Johannesburg, Gauteng',
        'municipality.province_code': 'GT',
        'municipality.province_name': 'Gauteng',
        'municipality.category': 'A',
        'municipality.miif_category': 'A',
      },
    ],
  },
  '/cubes/incexp_v2/members/financial_year_end': {
    status: 'ok',
    data: [{ 'financial_year_end.year': 2026 }, { 'financial_year_end.year': 2025 }],
  },
  'item.code:"4400"|amount_type.code:"ORGB"|period_length.length:"year"|financial_year_end.year:2026&drilldown=function.category_label':
    {
      status: 'ok',
      summary: { 'amount.sum': 80669613432 },
      cells: [
        { 'function.category_label': 'Trading services', 'amount.sum': 37114897942 },
        {
          'function.category_label': 'Municipal governance and administration',
          'amount.sum': 29714070647,
        },
        {
          'function.category_label': 'Community and public safety',
          'amount.sum': 7968522000,
        },
        {
          'function.category_label': 'Economic and environmental services',
          'amount.sum': 5194865843,
        },
        { 'function.category_label': 'Other', 'amount.sum': 677257000 },
      ],
    },
  'item.code:"4400"|amount_type.code:"ORGB"|period_length.length:"year"|financial_year_end.year:2026':
    {
      status: 'ok',
      summary: { 'amount.sum': 80669613432 },
      cells: [{ 'amount.sum': 80669613432 }],
    },
  'capital_type.code:"NEW";"RENEWAL";"UPGRADING"': {
    status: 'ok',
    summary: { 'amount.sum': 8700420163 },
    cells: [{ 'amount.sum': 8700420163 }],
  },
  '/cubes/incexp_v2/model': {
    status: 'ok',
    model: { last_updated: '2026-08-05T07:58' },
  },
  '/cubes/capital_v2/model': {
    status: 'ok',
    model: { last_updated: '2026-07-30T09:24' },
  },
}

describe('TreasuryMunicipalFinanceService', () => {
  test('normalises JHB operating, capital, allocations and provenance', async () => {
    const snap = await fetchMunicipalFinanceFromTreasury('JHB', {
      fetchFn: buildMockFetch(JHB_HANDLERS) as never,
      now: () => new Date('2026-08-12T12:00:00.000Z'),
    })
    expect(snap.empty).toBe(false)
    expect(snap.municipalityCode).toBe('JHB')
    expect(snap.treasuryDemarcationCode).toBe('JHB')
    expect(snap.identity?.name).toBe('City of Johannesburg')
    expect(snap.financialYearLabel).toBe('2025/26')
    expect(snap.amountType).toBe('ORGB')
    expect(snap.operatingBudget?.amountZar).toBe(80669613432)
    expect(snap.capitalBudget?.amountZar).toBe(8700420163)
    expect(snap.totalBudget?.amountZar).toBe(80669613432 + 8700420163)
    expect(snap.majorAllocations.length).toBe(5)
    expect(
      snap.majorAllocations.reduce((s, a) => s + a.percentage, 0)
    ).toBeCloseTo(100, 5)
    expect(snap.sources.every((s) => s.sourceType === 'national_treasury')).toBe(
      true
    )
    expect(snap.dataQuality).toBe('official_source_under_verification')
    expect(snap.completenessWarning).toMatch(/completeness and integrity/i)
  })

  test('second municipality CPT works nationally (not JHB-hardcoded)', async () => {
    const handlers = {
      ...JHB_HANDLERS,
      '/cubes/municipalities/facts': {
        status: 'ok',
        total_fact_count: 1,
        data: [
          {
            'municipality.demarcation_code': 'CPT',
            'municipality.name': 'Cape Town',
            'municipality.province_code': 'WC',
            'municipality.province_name': 'Western Cape',
            'municipality.category': 'A',
          },
        ],
      },
      'item.code:"4400"|amount_type.code:"ORGB"|period_length.length:"year"|financial_year_end.year:2026':
        {
          status: 'ok',
          summary: { 'amount.sum': 71183940671 },
          cells: [{ 'amount.sum': 71183940671 }],
        },
      'item.code:"4400"|amount_type.code:"ORGB"|period_length.length:"year"|financial_year_end.year:2026&drilldown=function.category_label':
        {
          status: 'ok',
          summary: { 'amount.sum': 71183940671 },
          cells: [
            { 'function.category_label': 'Trading services', 'amount.sum': 39045820961 },
            {
              'function.category_label': 'Municipal governance and administration',
              'amount.sum': 13938509013,
            },
          ],
        },
      'capital_type.code:"NEW";"RENEWAL";"UPGRADING"': {
        status: 'ok',
        summary: { 'amount.sum': 5000000000 },
        cells: [{ 'amount.sum': 5000000000 }],
      },
    }
    const snap = await fetchMunicipalFinanceFromTreasury('CPT', {
      fetchFn: buildMockFetch(handlers) as never,
      now: () => new Date('2026-08-12T12:00:00.000Z'),
    })
    expect(snap.municipalityCode).toBe('CPT')
    expect(snap.treasuryDemarcationCode).toBe('CPT')
    expect(snap.operatingBudget?.amountZar).toBe(71183940671)
    expect(snap.identity?.name).toBe('Cape Town')
  })

  test('missing municipality data returns empty without JHB fallback', async () => {
    const snap = await fetchMunicipalFinanceFromTreasury('EC103', {
      fetchFn: buildMockFetch({
        '/cubes/municipalities/facts': {
          status: 'ok',
          total_fact_count: 0,
          data: [],
        },
      }) as never,
    })
    expect(snap.empty).toBe(true)
    expect(snap.municipalityCode).toBe('EC103')
    expect(snap.operatingBudget).toBeNull()
    expect(snap.municipalityCode).not.toBe('JHB')
  })

  test('malformed aggregate does not invent numbers', async () => {
    const snap = await fetchMunicipalFinanceFromTreasury('JHB', {
      fetchFn: buildMockFetch({
        '/cubes/municipalities/facts': JHB_HANDLERS['/cubes/municipalities/facts'],
        '/cubes/incexp_v2/members/financial_year_end':
          JHB_HANDLERS['/cubes/incexp_v2/members/financial_year_end'],
        'item.code:"4400"': {
          status: 'ok',
          summary: { 'amount.sum': 'not-a-number' },
          cells: [],
        },
      }) as never,
    })
    expect(snap.empty).toBe(true)
    expect(snap.operatingBudget).toBeNull()
  })

  test('timeout / API error yields empty error snapshot', async () => {
    const snap = await fetchMunicipalFinanceFromTreasury('JHB', {
      fetchFn: async () => {
        throw Object.assign(new Error('The operation was aborted'), {
          name: 'AbortError',
        })
      },
      timeoutMs: 50,
    })
    expect(snap.empty).toBe(true)
    expect(snap.cacheStatus).toBe('error')
    expect(snap.emptyReason).toMatch(/treasury_fetch_failed|aborted/i)
  })

  test('incorrect / unmapped code MTS does not substitute another muni', async () => {
    const snap = await fetchMunicipalFinanceFromTreasury('MTS', {
      fetchFn: buildMockFetch(JHB_HANDLERS) as never,
    })
    expect(snap.empty).toBe(true)
    expect(snap.municipalityCode).toBe('MTS')
    expect(snap.emptyReason).toMatch(/disestablished/)
  })

  test('alias WTS resolves to DC48 before Treasury calls', async () => {
    const urls: string[] = []
    const fetchFn = async (url: string) => {
      urls.push(decodeURIComponent(url))
      return buildMockFetch({
        ...JHB_HANDLERS,
        '/cubes/municipalities/facts': {
          status: 'ok',
          total_fact_count: 1,
          data: [
            {
              'municipality.demarcation_code': 'DC48',
              'municipality.name': 'West Rand',
              'municipality.category': 'C',
              'municipality.province_name': 'Gauteng',
            },
          ],
        },
      })(url)
    }
    const snap = await fetchMunicipalFinanceFromTreasury('WTS', {
      fetchFn: fetchFn as never,
      now: () => new Date('2026-08-12T12:00:00.000Z'),
    })
    expect(snap.treasuryDemarcationCode).toBe('DC48')
    expect(urls.some((u) => u.includes('demarcation_code:DC48') || u.includes('demarcation.code:"DC48"'))).toBe(
      true
    )
  })

  test('cache fallback keeps last good snapshot on failed refresh', async () => {
    const good = await fetchMunicipalFinanceFromTreasury('JHB', {
      fetchFn: buildMockFetch(JHB_HANDLERS) as never,
      now: () => new Date('2026-08-01T12:00:00.000Z'),
    })
    await refreshMunicipalFinanceSnapshot('JHB', {
      fetchFn: buildMockFetch(JHB_HANDLERS) as never,
      now: () => new Date('2026-08-01T12:00:00.000Z'),
    })

    const failed = await refreshMunicipalFinanceSnapshot('JHB', {
      fetchFn: async () => {
        throw new Error('HTTP 503')
      },
      now: () => new Date('2026-08-12T12:00:00.000Z'),
    })
    expect(failed.updated).toBe(false)
    expect(failed.snapshot.operatingBudget?.amountZar).toBe(
      good.operatingBudget?.amountZar
    )

    const cached = await getMunicipalFinanceSnapshotCached('JHB', {
      now: () => new Date('2026-08-12T12:00:00.000Z'),
    })
    expect(cached.empty).toBe(false)
    expect(cached.operatingBudget?.amountZar).toBe(80669613432)
  })
})
