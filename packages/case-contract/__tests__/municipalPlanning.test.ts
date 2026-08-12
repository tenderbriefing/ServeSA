/**
 * Municipal planning contract tests
 */

import {
  canTransitionPlanPublication,
  assertPlanPublicationTransition,
  UpsertMunicipalProjectInputSchema,
  UpsertBudgetLineInputSchema,
  UpsertPriorityInputSchema,
  MUNICIPAL_PROJECT_STATUS_LABEL,
  PLAN_DOCUMENT_KIND_LABEL,
  PLANNING_EMPTY_COPY,
  selectMajorMunicipalProjects,
} from '../src'

describe('municipal planning contract', () => {
  it('exposes document kinds and project statuses', () => {
    expect(Object.keys(PLAN_DOCUMENT_KIND_LABEL).length).toBeGreaterThanOrEqual(9)
    expect(Object.keys(MUNICIPAL_PROJECT_STATUS_LABEL)).toEqual(
      expect.arrayContaining([
        'planned',
        'procurement',
        'tender_awarded',
        'in_progress',
        'delayed',
        'completed',
        'cancelled',
        'unknown',
      ])
    )
  })

  it('enforces publication lifecycle (no draft → published)', () => {
    expect(canTransitionPlanPublication('draft', 'awaiting_review')).toBe(true)
    expect(canTransitionPlanPublication('awaiting_review', 'verified')).toBe(
      true
    )
    expect(canTransitionPlanPublication('verified', 'published')).toBe(true)
    expect(canTransitionPlanPublication('draft', 'published')).toBe(false)
    expect(() =>
      assertPlanPublicationTransition('draft', 'published')
    ).toThrow()
  })

  it('requires sources on priorities and projects', () => {
    const bad = UpsertPriorityInputSchema.safeParse({
      title: 'Clean water',
      plainLanguageSummary: 'Expand water infrastructure in underserved areas.',
      sources: [],
    })
    expect(bad.success).toBe(false)

    const ok = UpsertPriorityInputSchema.safeParse({
      title: 'Clean water',
      plainLanguageSummary: 'Expand water infrastructure in underserved areas.',
      sources: [
        {
          documentKind: 'idp',
          title: 'IDP 2022-2027',
          isServeSaSummary: true,
        },
      ],
    })
    expect(ok.success).toBe(true)
  })

  it('does not invent unknown status — status is required enum', () => {
    const bad = UpsertMunicipalProjectInputSchema.safeParse({
      title: 'Road resurfacing Ward 60',
      plainLanguageSummary: 'Resurface arterial roads after storm damage.',
      status: 'maybe_done',
      scope: 'ward_specific',
      sources: [{ documentKind: 'sdbip', title: 'SDBIP' }],
    })
    expect(bad.success).toBe(false)
  })

  it('requires source on every budget amount', () => {
    const ok = UpsertBudgetLineInputSchema.safeParse({
      fiscalYear: '2025/26',
      categoryLabel: 'Water infrastructure',
      plainLanguageLabel: 'Water & sanitation',
      amount: {
        amountZar: 1_000_000,
        source: {
          documentKind: 'budget',
          title: 'MTREF Budget 2025/26',
          pageOrSection: 'Table A4',
        },
      },
    })
    expect(ok.success).toBe(true)

    const bad = UpsertBudgetLineInputSchema.safeParse({
      fiscalYear: '2025/26',
      categoryLabel: 'Water',
      plainLanguageLabel: 'Water',
      amount: { amountZar: 100 },
    })
    expect(bad.success).toBe(false)
  })

  it('exposes honest empty-state copy', () => {
    expect(PLANNING_EMPTY_COPY.notPublished).toMatch(/Not published/i)
    expect(PLANNING_EMPTY_COPY.awaitingVerification).toMatch(/verification/i)
    expect(PLANNING_EMPTY_COPY.municipalitySnapshotComingSoon).toMatch(
      /coming soon/i
    )
  })

  it('selects major projects deterministically without inventing ward focus', () => {
    const selected = selectMajorMunicipalProjects(
      [
        { id: 'w', scope: 'ward_specific', status: 'planned', sortOrder: 0 },
        { id: 'm', scope: 'municipality_wide', status: 'in_progress', sortOrder: 5 },
        { id: 'r', scope: 'regional', status: 'planned', sortOrder: 1 },
        { id: 'c', scope: 'municipality_wide', status: 'cancelled', sortOrder: 0 },
      ],
      3
    )
    expect(selected.map((p) => p.id)).toEqual(['m', 'r', 'w'])
    expect(MUNICIPAL_PROJECT_STATUS_LABEL.in_progress).toMatch(/implementation/i)
  })
})
