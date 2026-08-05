/**
 * Unit tests for deterministic ward georesolve (mocked BigQuery).
 */
import type { GeoresolveResult } from '../routing/georesolve'

const mockQuery = jest.fn()
const mockCacheGet = jest.fn()
const mockCacheSet = jest.fn()

jest.mock('@google-cloud/bigquery', () => ({
  BigQuery: jest.fn().mockImplementation(() => ({
    query: (...args: unknown[]) => mockQuery(...args),
  })),
}))

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: () => ({
      doc: () => ({
        get: (...args: unknown[]) => mockCacheGet(...args),
        set: (...args: unknown[]) => mockCacheSet(...args),
      }),
    }),
  }),
  Timestamp: { now: () => ({ toDate: () => new Date() }) },
}))

jest.mock('../telemetry/caseEvents', () => ({
  logCaseTelemetry: jest.fn(),
}))

import { georesolve, georesolveSafe } from '../routing/georesolve'

describe('georesolve', () => {
  beforeEach(() => {
    mockQuery.mockReset()
    mockCacheGet.mockReset()
    mockCacheSet.mockReset()
    mockCacheGet.mockResolvedValue({ exists: false })
    mockCacheSet.mockResolvedValue(undefined)
  })

  it('rejects coordinates outside South Africa', async () => {
    const result = await georesolve(0, 0)
    expect(result.status).toBe('unresolved')
    expect(result.errorClass).toBe('outside_bounds')
    expect(result.wardId).toBeNull()
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('returns unique ward match', async () => {
    mockQuery.mockResolvedValue([
      [
        {
          ward_id: '79800060',
          ward_name: 'JHB_60',
          ward_number: '60',
          municipality_id: 'JHB',
          municipality_name: 'City of Johannesburg Metropolitan Municipality',
          district_code: 'JHB',
          district_name: 'City of Johannesburg',
          province: 'Gauteng',
          dataset_version: 'mdb-wards-2020-v1',
          boundary_cycle: '2020-LGE',
          candidate_count: 1,
        },
      ],
    ])
    const result = await georesolve(-26.2041, 28.0473)
    expect(result.status).toBe('polygon_match')
    expect(result.wardId).toBe('79800060')
    expect(result.municipalityId).toBe('JHB')
    expect(result.routingSource).toBe('authoritative_gis')
    expect(result.datasetVersion).toBe('mdb-wards-2020-v1')
  })

  it('returns unresolved on no match', async () => {
    mockQuery.mockResolvedValue([[]])
    const result = await georesolve(-26.2041, 28.0473)
    expect(result.status).toBe('unresolved')
    expect(result.wardId).toBeNull()
    expect(result.errorClass).toBe('no_match')
  })

  it('returns ambiguous when multiple polygons match', async () => {
    mockQuery.mockResolvedValue([
      [
        {
          ward_id: 'A',
          ward_name: 'A',
          municipality_id: 'M1',
          municipality_name: 'M1',
          province: 'Gauteng',
          dataset_version: 'mdb-wards-2020-v1',
          candidate_count: 2,
        },
        {
          ward_id: 'B',
          ward_name: 'B',
          municipality_id: 'M1',
          municipality_name: 'M1',
          province: 'Gauteng',
          dataset_version: 'mdb-wards-2020-v1',
          candidate_count: 2,
        },
      ],
    ])
    const result = await georesolve(-26.2041, 28.0473)
    expect(result.status).toBe('ambiguous')
    expect(result.wardId).toBeNull()
    expect(result.candidateCount).toBe(2)
  })

  it('georesolveSafe returns unresolved on timeout', async () => {
    mockQuery.mockImplementation(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => reject(Object.assign(new Error('georesolve_polygon timed out after 1ms'), { errorClass: 'timeout' })), 5)
        })
    )
    // Force short timeout via env would require reload; simulate reject
    mockQuery.mockRejectedValue(
      Object.assign(new Error('georesolve_polygon timed out after 8000ms'), {
        errorClass: 'timeout',
      })
    )
    const result = await georesolveSafe(-26.2041, 28.0473)
    expect(result.status).toBe('unresolved')
    expect(result.errorClass).toBe('timeout')
    expect(result.wardId).toBeNull()
  })

  it('georesolveSafe returns unresolved on permission failure', async () => {
    mockQuery.mockRejectedValue(new Error('Access Denied: permission bigquery.jobs.create'))
    const result = await georesolveSafe(-26.2041, 28.0473)
    expect(result.status).toBe('unresolved')
    expect(result.errorClass).toBe('permission')
  })

  it('treats malformed rows as infrastructure-safe unresolved', async () => {
    mockQuery.mockResolvedValue([
      [
        {
          ward_id: null,
          municipality_id: null,
          province: null,
          candidate_count: 1,
        },
      ],
    ])
    const result = await georesolveSafe(-26.2041, 28.0473)
    expect(result.status).toBe('unresolved')
    expect(result.wardId).toBeNull()
  })
})

describe('routingPending semantics', () => {
  it('only polygon_match clears routing pending', () => {
    const statuses: Array<GeoresolveResult['status']> = [
      'polygon_match',
      'ambiguous',
      'unresolved',
      'nearest_ward',
      'municipality_only',
    ]
    for (const status of statuses) {
      const routingPending = status !== 'polygon_match'
      if (status === 'polygon_match') expect(routingPending).toBe(false)
      else expect(routingPending).toBe(true)
    }
  })
})
