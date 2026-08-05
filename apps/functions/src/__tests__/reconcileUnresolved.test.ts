/**
 * Reconciliation unit tests (mocked Firestore + georesolve).
 */

const mockGet = jest.fn()
const mockUpdate = jest.fn()
const mockRunTransaction = jest.fn()
const mockStartAfter = jest.fn()
const mockLimit = jest.fn()
const mockOrderBy = jest.fn()
const mockWhere = jest.fn()

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: () => ({
      where: (...a: unknown[]) => mockWhere(...a),
      doc: (id?: string) => ({
        id,
        get: mockGet,
        update: mockUpdate,
        collection: () => ({
          doc: () => ({ get: mockGet, set: jest.fn() }),
        }),
      }),
    }),
    runTransaction: (...a: unknown[]) => mockRunTransaction(...a),
  }),
  FieldValue: { serverTimestamp: () => 'SERVER_TS' },
}))

const mockGeoresolveSafe = jest.fn()
jest.mock('../routing/georesolve', () => ({
  georesolveSafe: (...a: unknown[]) => mockGeoresolveSafe(...a),
}))
jest.mock('../telemetry/caseEvents', () => ({
  logCaseTelemetry: jest.fn(),
}))

import { reconcileUnresolvedCases } from '../routing/reconcileUnresolved'

function chainQuery(docs: any[]) {
  const snap = { docs, size: docs.length }
  const q: any = {
    where: mockWhere,
    orderBy: mockOrderBy,
    limit: mockLimit,
    startAfter: mockStartAfter,
    get: jest.fn().mockResolvedValue(snap),
  }
  mockWhere.mockReturnValue(q)
  mockOrderBy.mockReturnValue(q)
  mockLimit.mockReturnValue(q)
  mockStartAfter.mockReturnValue(q)
  return q
}

describe('reconcileUnresolvedCases', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('supports dry-run without writes', async () => {
    chainQuery([
      {
        id: 'CASE-1',
        data: () => ({
          routingPending: true,
          routingManualOverride: false,
          location: { lat: -26.2, lng: 28.0 },
        }),
      },
    ])
    mockGeoresolveSafe.mockResolvedValue({
      status: 'polygon_match',
      wardId: '79800060',
      municipalityId: 'JHB',
      datasetVersion: 'mdb-wards-2020-v1',
    })
    const result = await reconcileUnresolvedCases({ limit: 10, dryRun: true })
    expect(result.dryRun).toBe(true)
    expect(result.outcomes[0].outcome).toBe('resolved')
    expect(mockRunTransaction).not.toHaveBeenCalled()
  })

  it('skips manual overrides', async () => {
    chainQuery([
      {
        id: 'CASE-2',
        data: () => ({
          routingPending: true,
          routingManualOverride: true,
          location: { lat: -26.2, lng: 28.0 },
        }),
      },
    ])
    const result = await reconcileUnresolvedCases({ dryRun: true })
    expect(result.outcomes[0].outcome).toBe('skipped')
    expect(result.outcomes[0].reason).toBe('manual_override')
  })

  it('classifies ambiguous without assigning ward', async () => {
    chainQuery([
      {
        id: 'CASE-3',
        data: () => ({
          routingPending: true,
          location: { lat: -26.2, lng: 28.0 },
        }),
      },
    ])
    mockGeoresolveSafe.mockResolvedValue({
      status: 'ambiguous',
      wardId: null,
      candidateCount: 2,
      failureReason: 'multiple_polygons_cover_point',
    })
    const result = await reconcileUnresolvedCases({ dryRun: true })
    expect(result.outcomes[0].outcome).toBe('ambiguous')
  })
})
