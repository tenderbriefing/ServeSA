import {
  CreateCaseInputSchema,
  mapUiCategoryToCanonical,
  isWithinSouthAfrica,
  normalizeSaPhone,
  calculateSlaFields,
  DEFAULT_SLA_HOURS,
} from '../src'

describe('CreateCaseInputSchema', () => {
  const validBase = {
    title: 'Burst water pipe on Main Street',
    description:
      'Water is gushing from a broken main pipe affecting several households.',
    category: 'water',
    priority: 'high' as const,
    latitude: -26.2041,
    longitude: 28.0473,
    locationSource: 'device_gps' as const,
    address: 'Main Street, Johannesburg',
    reporter: {
      name: 'Thabo Molefe',
      email: 'thabo@example.com',
    },
    consent: { dataProcessing: true as const },
    clientRequestId: '550e8400-e29b-41d4-a716-446655440000',
  }

  it('accepts valid South African coordinates', () => {
    const result = CreateCaseInputSchema.safeParse(validBase)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.category).toBe('water')
      expect(result.data.latitude).toBe(-26.2041)
    }
  })

  it('rejects coordinates outside South Africa', () => {
    const result = CreateCaseInputSchema.safeParse({
      ...validBase,
      latitude: 51.5074,
      longitude: -0.1278,
    })
    expect(result.success).toBe(false)
  })

  it('rejects 0,0', () => {
    const result = CreateCaseInputSchema.safeParse({
      ...validBase,
      latitude: 0,
      longitude: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects unsupported category', () => {
    const result = CreateCaseInputSchema.safeParse({
      ...validBase,
      category: 'alien-invasion',
    })
    expect(result.success).toBe(false)
  })

  it('maps water-sewage UI id to water + sewage subcategory', () => {
    const result = CreateCaseInputSchema.safeParse({
      ...validBase,
      category: 'water-sewage',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.category).toBe('water')
      expect(result.data.subcategory).toBe('sewage')
    }
  })

  it('rejects missing data-processing consent', () => {
    const result = CreateCaseInputSchema.safeParse({
      ...validBase,
      consent: { dataProcessing: false },
    })
    expect(result.success).toBe(false)
  })

  it('rejects when neither email nor phone provided', () => {
    const result = CreateCaseInputSchema.safeParse({
      ...validBase,
      reporter: { name: 'Anonymous Citizen' },
    })
    expect(result.success).toBe(false)
  })

  it('accepts phone-only reporter contact', () => {
    const result = CreateCaseInputSchema.safeParse({
      ...validBase,
      reporter: { name: 'Nomsa Dlamini', phone: '0821234567' },
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.reporter.phone).toBe('+27821234567')
    }
  })

  it('normalises whitespace in title and description', () => {
    const result = CreateCaseInputSchema.safeParse({
      ...validBase,
      title: '  Burst   pipe   nearby  ',
      description: '  Detailed   description   of   the   issue  here. ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Burst pipe nearby')
      expect(result.data.description).toBe(
        'Detailed description of the issue here.'
      )
    }
  })
})

describe('category mapping', () => {
  it('maps all UI category IDs', () => {
    const ids = [
      'water-sewage',
      'electricity',
      'roads-infrastructure',
      'waste-management',
      'digital-services',
      'emergency-services',
    ]
    for (const id of ids) {
      const mapped = mapUiCategoryToCanonical(id)
      expect(mapped).not.toBeNull()
    }
  })

  it('returns null for unknown', () => {
    expect(mapUiCategoryToCanonical('not-a-category')).toBeNull()
  })
})

describe('geo + phone helpers', () => {
  it('validates SA bounds', () => {
    expect(isWithinSouthAfrica(-26.2, 28.0)).toBe(true)
    expect(isWithinSouthAfrica(0, 0)).toBe(false)
    expect(isWithinSouthAfrica(40, -74)).toBe(false)
  })

  it('normalises SA phones', () => {
    expect(normalizeSaPhone('082 123 4567')).toBe('+27821234567')
    expect(normalizeSaPhone('+27 82 123 4567')).toBe('+27821234567')
    expect(normalizeSaPhone('123')).toBeNull()
  })
})

describe('SLA calculation', () => {
  it('covers all category/priority defaults', () => {
    for (const [category, priorities] of Object.entries(DEFAULT_SLA_HOURS)) {
      for (const [priority, hours] of Object.entries(priorities)) {
        const result = calculateSlaFields(
          category as any,
          priority as any
        )
        expect(result.targetHours).toBe(hours)
        expect(result.slaBreach).toBe(false)
        expect(result.slaTarget.getTime()).toBeGreaterThan(
          result.slaStartedAt.getTime()
        )
      }
    }
  })

  it('applies municipality override', () => {
    const result = calculateSlaFields('water', 'high', {
      water: { emergency: 1, high: 2, medium: 10, low: 20 },
    })
    expect(result.targetHours).toBe(2)
  })
})
