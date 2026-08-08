/**
 * Community engagement contract tests
 */

import {
  canTransitionUpdate,
  canTransitionIdea,
  UpsertMunicipalUpdateInputSchema,
  SubmitCommunityIdeaInputSchema,
  MUNICIPAL_UPDATE_TYPE_LABEL,
  COMMUNITY_IDEA_CATEGORY_LABEL,
  assertUpdateTransition,
  assertIdeaTransition,
} from '../src'

describe('municipal updates contract', () => {
  it('exposes all required update types', () => {
    expect(Object.keys(MUNICIPAL_UPDATE_TYPE_LABEL).length).toBe(12)
    expect(MUNICIPAL_UPDATE_TYPE_LABEL.emergency).toBe('Emergency')
  })

  it('allows draft → published and rejects archived → published', () => {
    expect(canTransitionUpdate('draft', 'published')).toBe(true)
    expect(canTransitionUpdate('archived', 'published')).toBe(false)
    expect(() => assertUpdateTransition('archived', 'published')).toThrow()
  })

  it('validates upsert input and rejects short bodies', () => {
    const ok = UpsertMunicipalUpdateInputSchema.safeParse({
      type: 'water_interruption',
      title: 'Water outage in Ward 60',
      body: 'Repairs are underway on the main line. Expect restoration by evening.',
      targeting: { municipalityCode: 'JHB' },
    })
    expect(ok.success).toBe(true)

    const bad = UpsertMunicipalUpdateInputSchema.safeParse({
      type: 'water_interruption',
      title: 'Hi',
      body: 'Too short',
      targeting: {},
    })
    expect(bad.success).toBe(false)
  })
})

describe('community ideas contract', () => {
  it('exposes idea categories', () => {
    expect(Object.keys(COMMUNITY_IDEA_CATEGORY_LABEL).length).toBeGreaterThanOrEqual(10)
  })

  it('allows submitted → under_review and rejects implemented → submitted', () => {
    expect(canTransitionIdea('submitted', 'under_review')).toBe(true)
    expect(canTransitionIdea('implemented', 'submitted')).toBe(false)
    expect(() => assertIdeaTransition('implemented', 'submitted')).toThrow()
  })

  it('validates submit input', () => {
    const ok = SubmitCommunityIdeaInputSchema.safeParse({
      title: 'More shade trees at the park',
      description:
        'Plant indigenous shade trees along the walking path so families can rest in summer.',
      category: 'parks_and_recreation',
      municipalityCode: 'JHB',
    })
    expect(ok.success).toBe(true)
  })
})
