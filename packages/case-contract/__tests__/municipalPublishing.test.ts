import {
  canTransitionDocumentProcessing,
  canPublishFromProcessingStatus,
  computePlanningModuleCompleteness,
  AiExtractDraftSchema,
  PLANNING_CONTENT_MODULE_IDS,
} from '../src/municipalPublishing'

describe('municipal publishing contract', () => {
  it('requires processing pipeline before review', () => {
    expect(canTransitionDocumentProcessing('uploaded', 'processing')).toBe(true)
    expect(canTransitionDocumentProcessing('draft_generated', 'published')).toBe(
      false
    )
  })

  it('blocks publish from draft_generated', () => {
    expect(canPublishFromProcessingStatus('draft_generated', 'verified')).toBe(
      false
    )
    expect(canPublishFromProcessingStatus('approved', 'verified')).toBe(true)
  })

  it('computes module completeness as N of 7', () => {
    const { availableCount, total } = computePlanningModuleCompleteness({
      municipality_overview: true,
    })
    expect(total).toBe(PLANNING_CONTENT_MODULE_IDS.length)
    expect(availableCount).toBe(1)
  })

  it('allows null budgets in AI draft', () => {
    const draft = AiExtractDraftSchema.parse({
      municipalityCode: 'JHB',
      sourceDocumentId: 'DOC-1',
      documentType: 'idp',
      planningPeriod: '2026/27',
      budget: {
        operatingBudget: null,
        capitalBudget: null,
        keyAllocations: [],
        verificationStatus: 'not_generated',
      },
    })
    expect(draft.budget?.operatingBudget).toBeNull()
  })
})
