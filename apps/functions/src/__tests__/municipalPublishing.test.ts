/**
 * Municipal publishing pipeline unit tests.
 */

import {
  canTransitionDocumentProcessing,
  canPublishFromProcessingStatus,
} from '../../../../packages/case-contract/src/municipalPublishing'
import { generateConservativeAiDraft } from '../planning/aiDraftGenerator'
import { computeSha256Hex } from '../planning/extractText'

describe('municipal publishing contract', () => {
  it('blocks skip-review publish transitions', () => {
    expect(canTransitionDocumentProcessing('draft_generated', 'under_review')).toBe(
      true
    )
    expect(canPublishFromProcessingStatus('draft_generated', 'verified')).toBe(
      false
    )
  })

  it('detects duplicate SHA-256', () => {
    const buf = Buffer.from('official-idp-excerpt')
    const a = computeSha256Hex(buf)
    const b = computeSha256Hex(buf)
    expect(a).toBe(b)
    expect(a).toHaveLength(64)
  })
})

describe('conservative AI draft', () => {
  it('does not invent budget totals without source matches', () => {
    const draft = generateConservativeAiDraft({
      municipalityCode: 'JHB',
      sourceDocumentId: 'DOC-TEST',
      documentType: 'idp',
      planningPeriod: '2026/27',
      extractedText:
        'This Integrated Development Plan outlines strategic priority one for service delivery.',
      officialTitle: 'Example IDP',
    })
    expect(draft.overview?.summary).toBeTruthy()
    expect(draft.budget?.operatingBudget).toBeNull()
    expect(draft.overview?.verificationStatus).toBe('needs_review')
  })
})
