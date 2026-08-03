import { calculateSLADetails } from '../utils/slaCalculator'
import { DEFAULT_SLA_HOURS } from '@servesa/case-contract'

describe('SLA calculator', () => {
  it('matches defaults for all category/priority pairs', () => {
    const startedAt = new Date('2026-01-01T00:00:00.000Z')
    for (const [category, priorities] of Object.entries(DEFAULT_SLA_HOURS)) {
      for (const [priority, hours] of Object.entries(priorities)) {
        const details = calculateSLADetails(category, priority, undefined, startedAt)
        expect(details.targetHours).toBe(hours)
        expect(details.slaBreach).toBe(false)
        expect(details.slaTarget.getTime()).toBe(
          startedAt.getTime() + hours * 60 * 60 * 1000
        )
      }
    }
  })

  it('applies municipality override', () => {
    const details = calculateSLADetails('electricity', 'high', {
      electricity: { emergency: 1, high: 2, medium: 8, low: 24 },
      water: DEFAULT_SLA_HOURS.water,
      roads: DEFAULT_SLA_HOURS.roads,
      waste: DEFAULT_SLA_HOURS.waste,
      internet: DEFAULT_SLA_HOURS.internet,
      emergency: DEFAULT_SLA_HOURS.emergency,
    })
    expect(details.targetHours).toBe(2)
  })
})
