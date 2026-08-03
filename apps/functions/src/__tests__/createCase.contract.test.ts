import {
  CreateCaseInputSchema,
  mapUiCategoryToCanonical,
} from '@servesa/case-contract'

/**
 * Contract tests ensuring functions accept the same payload the web wizard sends.
 */
describe('createCase contract alignment', () => {
  const base = {
    title: 'Pothole on Sandton Drive',
    description: 'Large pothole damaging vehicles near the intersection.',
    category: 'roads-infrastructure',
    priority: 'medium',
    latitude: -26.1076,
    longitude: 28.0567,
    locationSource: 'map_pin',
    address: 'Sandton Drive',
    reporter: { name: 'Citizen Test', email: 'citizen@example.com' },
    consent: { dataProcessing: true },
    clientRequestId: '11111111-2222-4333-8444-555555555555',
  }

  it('accepts UI category ids from the wizard', () => {
    const result = CreateCaseInputSchema.safeParse(base)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.category).toBe('roads')
      expect(result.data.subcategory).toBe('infrastructure')
    }
  })

  it('rejects lat/lng 0,0 from legacy clients', () => {
    const result = CreateCaseInputSchema.safeParse({
      ...base,
      latitude: 0,
      longitude: 0,
    })
    expect(result.success).toBe(false)
  })

  it('maps every visible wizard category', () => {
    const uiIds = [
      'water-sewage',
      'electricity',
      'roads-infrastructure',
      'waste-management',
      'digital-services',
      'emergency-services',
    ]
    for (const id of uiIds) {
      expect(mapUiCategoryToCanonical(id)?.category).toBeTruthy()
      const parsed = CreateCaseInputSchema.safeParse({ ...base, category: id })
      expect(parsed.success).toBe(true)
    }
  })
})
