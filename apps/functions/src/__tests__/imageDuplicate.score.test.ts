/**
 * Unit tests for multi-signal duplicate scoring — deterministic, no network.
 */

import {
  scorePair,
  CATEGORY_RADIUS_M,
  SCORING_POLICY_VERSION,
} from '../intelligence/scoring'

describe('scorePair image-led duplicate scoring', () => {
  const radius = CATEGORY_RADIUS_M.roads

  it('records scoring policy version', () => {
    expect(SCORING_POLICY_VERSION).toBe('1.0.0')
  })

  it('scores exact hash + nearby GPS as high', () => {
    const r = scorePair({
      exactHash: true,
      phashA: 'aaaabbbbccccdddd',
      phashB: 'aaaabbbbccccdddd',
      distanceMeters: 12,
      radiusMeters: radius,
      categoryMatch: true,
      timeDiffHours: 3,
    })
    expect(r.breakdown.exactHash).toBe(true)
    expect(r.score).toBeGreaterThanOrEqual(0.75)
    expect(r.reasons).toContain('exact_image_hash')
    expect(r.reasons).toContain('within_category_radius')
  })

  it('suppresses visually similar but distant cases', () => {
    const r = scorePair({
      exactHash: false,
      phashA: 'aaaabbbbccccdddd',
      phashB: 'aaaabbbbccccddde',
      distanceMeters: 5000,
      radiusMeters: radius,
      categoryMatch: true,
      timeDiffHours: 2,
    })
    expect(r.reasons).toContain('distant_visual_suppressed')
    expect(r.score).toBeLessThan(0.5)
  })

  it('flags exact hash across distant locations as anomaly reason', () => {
    const r = scorePair({
      exactHash: true,
      phashA: null,
      phashB: null,
      distanceMeters: 8000,
      radiusMeters: radius,
      categoryMatch: false,
      timeDiffHours: 1,
    })
    expect(r.reasons).toContain('exact_hash_distant_anomaly')
    expect(r.reasons).toContain('distant_visual_suppressed')
  })

  it('reduces score for incompatible category at same location', () => {
    const match = scorePair({
      exactHash: false,
      phashA: '1111222233334444',
      phashB: '1111222233334444',
      distanceMeters: 10,
      radiusMeters: radius,
      categoryMatch: true,
      timeDiffHours: 1,
    })
    const mismatch = scorePair({
      exactHash: false,
      phashA: '1111222233334444',
      phashB: '1111222233334444',
      distanceMeters: 10,
      radiusMeters: radius,
      categoryMatch: false,
      timeDiffHours: 1,
    })
    expect(match.score).toBeGreaterThan(mismatch.score)
  })
})
