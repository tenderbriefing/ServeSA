/**
 * Municipal publishing pipeline unit tests.
 */

import {
  canTransitionDocumentProcessing,
  canPublishFromProcessingStatus,
  UploadPlanningDocumentInputSchema,
  PLANNING_ALLOWED_MIME,
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
    expect(canTransitionDocumentProcessing('draft_generated', 'published')).toBe(
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

describe('upload validation', () => {
  it('accepts PDF and DOCX mime types only', () => {
    expect(PLANNING_ALLOWED_MIME).toContain('application/pdf')
    expect(PLANNING_ALLOWED_MIME).toContain(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
  })

  it('rejects unsupported mime types', () => {
    expect(() =>
      UploadPlanningDocumentInputSchema.parse({
        kind: 'idp',
        title: 'Official IDP',
        fiscalYear: '2026/27',
        file: {
          name: 'evil.exe',
          type: 'application/x-msdownload',
          size: 100,
          data: 'abc',
        },
      })
    ).toThrow()
  })

  it('rejects oversize files', () => {
    expect(() =>
      UploadPlanningDocumentInputSchema.parse({
        kind: 'idp',
        title: 'Official IDP',
        fiscalYear: '2026/27',
        file: {
          name: 'large.pdf',
          type: 'application/pdf',
          size: 26 * 1024 * 1024,
          data: 'abc',
        },
      })
    ).toThrow()
  })

  it('accepts valid PDF upload payload shape', () => {
    const parsed = UploadPlanningDocumentInputSchema.parse({
      kind: 'idp',
      title: 'Official IDP',
      fiscalYear: '2026/27',
      file: {
        name: 'idp.pdf',
        type: 'application/pdf',
        size: 1024,
        data: Buffer.from('sample').toString('base64'),
      },
    })
    expect(parsed.file.type).toBe('application/pdf')
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

  it('never marks generated fields as verified without review', () => {
    const draft = generateConservativeAiDraft({
      municipalityCode: 'JHB',
      sourceDocumentId: 'DOC-TEST',
      documentType: 'idp',
      planningPeriod: '2026/27',
      extractedText:
        'Strategic priority: water services. Capital project: reservoir upgrade.',
      officialTitle: 'Example IDP',
    })
    expect(
      draft.strategicPriorities.every(
        (p: { verificationStatus: string }) => p.verificationStatus === 'needs_review'
      )
    ).toBe(true)
    expect(
      draft.projects.every(
        (p: { verificationStatus: string }) => p.verificationStatus === 'needs_review'
      )
    ).toBe(true)
  })
})
