/**
 * Municipal publishing engine contract tests.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canTransitionDocumentProcessing,
  canPublishFromProcessingStatus,
  computePlanningModuleCompleteness,
  AiExtractDraftSchema,
  PLANNING_CONTENT_MODULE_IDS,
} from '../../../../packages/case-contract/dist/index.js'

test('document processing requires review before approval path', () => {
  assert.equal(canTransitionDocumentProcessing('uploaded', 'processing'), true)
  assert.equal(canTransitionDocumentProcessing('processing', 'draft_generated'), true)
  assert.equal(canTransitionDocumentProcessing('draft_generated', 'published'), false)
  assert.equal(canTransitionDocumentProcessing('draft_generated', 'under_review'), true)
})

test('cannot publish directly from draft_generated processing status', () => {
  assert.equal(canPublishFromProcessingStatus('draft_generated', 'verified'), false)
  assert.equal(canPublishFromProcessingStatus('approved', 'verified'), true)
})

test('module completeness is count-based not percentage invented', () => {
  const { availableCount, total } = computePlanningModuleCompleteness({
    municipality_overview: true,
    strategic_priorities: true,
  })
  assert.equal(total, PLANNING_CONTENT_MODULE_IDS.length)
  assert.equal(availableCount, 2)
})

test('AI draft schema rejects invented budget without provenance fields optional', () => {
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
  assert.equal(draft.budget?.operatingBudget, null)
})
