/**
 * Conservative AI draft generator — summarises supplied text only.
 * No internet inference, no invented numbers, weak evidence → needs_review.
 */

import {
  AiExtractDraftSchema,
  MUNICIPAL_PUBLISHING_CONTRACT_VERSION,
  type AiExtractDraft,
  type PlanDocumentKind,
  type ProvenanceReference,
} from '@servesa/case-contract'

const PRIORITY_HEADING =
  /\b(strategic\s+priority|priority\s+\d|key\s+focus|development\s+priorit)/i
const PROJECT_HEADING =
  /\b(capital\s+project|infrastructure\s+project|project\s+\d|municipal\s+project)/i
const SERVICE_HEADING =
  /\b(service\s+delivery|basic\s+service|water|sanitation|electricity|roads)/i
const ZAR_AMOUNT =
  /R\s?([\d\s,]+(?:\.\d{2})?)\s*(million|bn|billion|m)?/gi

function excerptAround(text: string, index: number, radius = 120): string {
  const start = Math.max(0, index - radius)
  const end = Math.min(text.length, index + radius)
  return text.slice(start, end).trim()
}

function prov(
  documentId: string,
  text: string,
  index: number,
  section?: string
): ProvenanceReference {
  return {
    documentId,
    section: section || null,
    excerpt: excerptAround(text, index),
    charStart: index,
    charEnd: Math.min(text.length, index + 240),
  }
}

function firstParagraph(text: string, maxLen = 800): string {
  const parts = text.split(/\n{2,}|(?<=[.!?])\s+/)
  let out = ''
  for (const p of parts) {
    const chunk = p.trim()
    if (!chunk || chunk.length < 40) continue
    out = out ? `${out} ${chunk}` : chunk
    if (out.length >= maxLen) break
  }
  return out.slice(0, maxLen).trim()
}

function extractHeadings(
  text: string,
  pattern: RegExp,
  documentId: string,
  limit: number
): Array<{ title: string; summary: string; sourceReferences: ProvenanceReference[] }> {
  const lines = text.split(/\n+/)
  const results: Array<{
    title: string
    summary: string
    sourceReferences: ProvenanceReference[]
  }> = []
  for (let i = 0; i < lines.length && results.length < limit; i++) {
    const line = lines[i].trim()
    if (!line || line.length > 200) continue
    if (!pattern.test(line)) continue
    const summaryParts: string[] = []
    for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
      const next = lines[j].trim()
      if (!next) break
      if (next.length < 200 && PRIORITY_HEADING.test(next)) break
      summaryParts.push(next)
    }
    const summary = summaryParts.join(' ').slice(0, 800)
    if (summary.length < 30) continue
    results.push({
      title: line.slice(0, 160),
      summary,
      sourceReferences: [prov(documentId, text, text.indexOf(line), line)],
    })
  }
  return results
}

function extractVerifiedAmounts(
  text: string,
  documentId: string
): AiExtractDraft['budget'] {
  const allocations: NonNullable<AiExtractDraft['budget']>['keyAllocations'] =
    []
  let match: RegExpExecArray | null
  const seen = new Set<string>()
  while ((match = ZAR_AMOUNT.exec(text)) !== null && allocations.length < 15) {
    const raw = match[1].replace(/\s/g, '').replace(/,/g, '')
    const num = Number.parseFloat(raw)
    if (!Number.isFinite(num) || num <= 0) continue
    let amount = num
    const scale = (match[2] || '').toLowerCase()
    if (scale.startsWith('m') || scale === 'million') amount *= 1_000_000
    if (scale.startsWith('b') || scale === 'billion') amount *= 1_000_000_000
    const key = `${amount}:${match.index}`
    if (seen.has(key)) continue
    seen.add(key)
    const excerpt = excerptAround(text, match.index)
    if (excerpt.length < 20) continue
    allocations.push({
      label: excerpt.slice(0, 120),
      amountZar: amount,
      verificationStatus: 'needs_review',
      sourceReferences: [prov(documentId, text, match.index)],
    })
  }
  return {
    headline: allocations.length ? 'Budget figures extracted from source' : null,
    operatingBudget: null,
    capitalBudget: null,
    keyAllocations: allocations,
    verificationStatus: allocations.length ? 'needs_review' : 'not_generated',
  }
}

export function generateConservativeAiDraft(input: {
  municipalityCode: string
  sourceDocumentId: string
  documentType: PlanDocumentKind
  planningPeriod: string
  extractedText: string
  officialTitle: string
  officialUrl?: string | null
}): AiExtractDraft {
  const { extractedText, sourceDocumentId } = input
  const overviewSummary = firstParagraph(extractedText)
  const strategicPriorities = extractHeadings(
    extractedText,
    PRIORITY_HEADING,
    sourceDocumentId,
    8
  ).map((p) => ({
    title: p.title,
    summary: p.summary,
    verificationStatus: 'needs_review' as const,
    sourceReferences: p.sourceReferences,
  }))
  const projects = extractHeadings(
    extractedText,
    PROJECT_HEADING,
    sourceDocumentId,
    12
  ).map((p) => ({
    title: p.title,
    summary: p.summary,
    verificationStatus: 'needs_review' as const,
    sourceReferences: p.sourceReferences,
  }))
  const serviceDeliveryPriorities = extractHeadings(
    extractedText,
    SERVICE_HEADING,
    sourceDocumentId,
    8
  ).map((p) => ({
    title: p.title,
    summary: p.summary,
    verificationStatus: 'needs_review' as const,
    sourceReferences: p.sourceReferences,
  }))
  const budget = extractVerifiedAmounts(extractedText, sourceDocumentId)

  const draft = AiExtractDraftSchema.parse({
    contractVersion: MUNICIPAL_PUBLISHING_CONTRACT_VERSION,
    municipalityCode: input.municipalityCode,
    sourceDocumentId: input.sourceDocumentId,
    documentType: input.documentType,
    planningPeriod: input.planningPeriod,
    generatedAt: new Date().toISOString(),
    modelProvider: 'servesa-conservative-extractor',
    modelId: 'rule-based-v1',
    overview: overviewSummary
      ? {
          summary: overviewSummary,
          verificationStatus: 'needs_review',
          sourceReferences: [prov(sourceDocumentId, extractedText, 0, 'opening')],
        }
      : null,
    strategicPriorities,
    budget,
    projects,
    serviceDeliveryPriorities,
    citizenImpact: [],
    serviceContacts: [],
    sourceReferences: [
      {
        documentKind: input.documentType,
        title: input.officialTitle,
        url: input.officialUrl || null,
        isServeSaSummary: true,
      },
    ],
  })
  return draft
}
