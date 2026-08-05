/**
 * Department routing after GIS — unit tests with mocked Firestore.
 */

const mockGet = jest.fn()

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: () => ({
      doc: () => ({
        collection: () => ({
          doc: () => ({
            get: (...a: unknown[]) => mockGet(...a),
          }),
        }),
        get: (...a: unknown[]) => mockGet(...a),
      }),
    }),
  }),
}))

import { resolveDepartmentRouting } from '../routing/departmentRouting'

describe('resolveDepartmentRouting', () => {
  beforeEach(() => mockGet.mockReset())

  it('sends unresolved GIS to triage — never invents municipality department', async () => {
    const r = await resolveDepartmentRouting({
      georesolutionStatus: 'unresolved',
      municipalityId: null,
      category: 'roads',
    })
    expect(r.triageQueue).toBe(true)
    expect(r.assignedDepartment).toBeNull()
    expect(r.departmentRoutingStatus).toBe('triage_routing_pending')
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('sends ambiguous GIS to triage', async () => {
    const r = await resolveDepartmentRouting({
      georesolutionStatus: 'ambiguous',
      municipalityId: 'JHB',
      category: 'roads',
    })
    expect(r.triageQueue).toBe(true)
    expect(r.departmentRoutingStatus).toBe('triage_ambiguous')
  })

  it('maps category to department when configured', async () => {
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({ departmentId: 'roads', departmentName: 'Roads' }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({ name: 'Roads & Stormwater' }),
      })
    const r = await resolveDepartmentRouting({
      georesolutionStatus: 'polygon_match',
      municipalityId: 'JHB',
      category: 'roads',
    })
    expect(r.triageQueue).toBe(false)
    expect(r.assignedDepartment).toBe('roads')
    expect(r.departmentRoutingStatus).toBe('mapped')
  })

  it('triages when mapping missing', async () => {
    mockGet.mockResolvedValueOnce({ exists: false })
    const r = await resolveDepartmentRouting({
      georesolutionStatus: 'polygon_match',
      municipalityId: 'JHB',
      category: 'roads',
    })
    expect(r.triageQueue).toBe(true)
    expect(r.departmentRoutingStatus).toBe('triage_unmapped')
  })
})
