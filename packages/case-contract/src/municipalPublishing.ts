/**
 * Municipal Publishing Engine — document ingestion, AI draft, review lifecycle.
 * AI output never auto-publishes. Source documents are traceable via SHA-256.
 */

import { z } from 'zod'
import {
  PlanDocumentKindSchema,
  SourceReferenceSchema,
} from './municipalPlanning'

export const MUNICIPAL_PUBLISHING_CONTRACT_VERSION = '1.0.0'

/** Ingestion pipeline status (orthogonal to publicationStatus) */
export const DocumentProcessingStatusSchema = z.enum([
  'uploaded',
  'processing',
  'draft_generated',
  'extraction_failed',
  'under_review',
  'approved',
  'archived',
])

export type DocumentProcessingStatus = z.infer<
  typeof DocumentProcessingStatusSchema
>

export const DOCUMENT_PROCESSING_TRANSITIONS: Record<
  DocumentProcessingStatus,
  DocumentProcessingStatus[]
> = {
  uploaded: ['processing', 'archived'],
  processing: ['draft_generated', 'extraction_failed', 'archived'],
  draft_generated: ['under_review', 'archived'],
  extraction_failed: ['processing', 'archived'],
  under_review: ['approved', 'draft_generated', 'archived'],
  approved: ['archived'],
  archived: [],
}

export function canTransitionDocumentProcessing(
  from: string,
  to: string
): boolean {
  const allowed =
    DOCUMENT_PROCESSING_TRANSITIONS[from as DocumentProcessingStatus]
  if (!allowed) return false
  return allowed.includes(to as DocumentProcessingStatus)
}

/** Citizen-facing planning content modules (7 sections) */
export const PLANNING_CONTENT_MODULE_IDS = [
  'municipality_overview',
  'strategic_priorities',
  'idp_summary',
  'budget_overview',
  'capital_projects',
  'service_delivery_priorities',
  'service_contacts',
] as const

export type PlanningContentModuleId =
  (typeof PLANNING_CONTENT_MODULE_IDS)[number]

export const PLANNING_CONTENT_MODULE_LABEL: Record<
  PlanningContentModuleId,
  string
> = {
  municipality_overview: 'Municipality overview',
  strategic_priorities: 'Strategic priorities',
  idp_summary: 'IDP summary',
  budget_overview: 'Budget overview',
  capital_projects: 'Capital projects',
  service_delivery_priorities: 'Service delivery priorities',
  service_contacts: 'Service contacts',
}

export function computePlanningModuleCompleteness(
  availableModules: Partial<Record<PlanningContentModuleId, boolean>>
): { availableCount: number; total: number } {
  const total = PLANNING_CONTENT_MODULE_IDS.length
  const availableCount = PLANNING_CONTENT_MODULE_IDS.filter(
    (id) => availableModules[id] === true
  ).length
  return { availableCount, total }
}

export const VerificationStatusSchema = z.enum([
  'verified',
  'needs_review',
  'rejected',
  'not_generated',
])

export type VerificationStatus = z.infer<typeof VerificationStatusSchema>

export const ProvenanceReferenceSchema = z.object({
  documentId: z.string().min(1).max(64).optional(),
  page: z.number().int().min(1).max(5000).optional().nullable(),
  section: z.string().max(240).optional().nullable(),
  excerpt: z.string().max(800).optional(),
  charStart: z.number().int().min(0).optional().nullable(),
  charEnd: z.number().int().min(0).optional().nullable(),
})

export type ProvenanceReference = z.infer<typeof ProvenanceReferenceSchema>

export const AiDraftPrioritySchema = z.object({
  title: z.string().min(1).max(160),
  summary: z.string().min(1).max(1200),
  verificationStatus: VerificationStatusSchema.default('needs_review'),
  sourceReferences: z.array(ProvenanceReferenceSchema).max(20).default([]),
})

export const AiDraftBudgetSchema = z.object({
  headline: z.string().max(400).optional().nullable(),
  operatingBudget: z.number().finite().nonnegative().nullable().optional(),
  capitalBudget: z.number().finite().nonnegative().nullable().optional(),
  keyAllocations: z
    .array(
      z.object({
        label: z.string().min(1).max(160),
        amountZar: z.number().finite().nonnegative().nullable().optional(),
        verificationStatus: VerificationStatusSchema.default('needs_review'),
        sourceReferences: z.array(ProvenanceReferenceSchema).max(10).default([]),
      })
    )
    .max(40)
    .default([]),
  verificationStatus: VerificationStatusSchema.default('needs_review'),
})

export const AiDraftProjectSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(1200),
  verificationStatus: VerificationStatusSchema.default('needs_review'),
  sourceReferences: z.array(ProvenanceReferenceSchema).max(20).default([]),
})

export const AiExtractDraftSchema = z.object({
  contractVersion: z.string().default(MUNICIPAL_PUBLISHING_CONTRACT_VERSION),
  municipalityCode: z.string().min(1).max(32),
  sourceDocumentId: z.string().min(1).max(64),
  documentType: PlanDocumentKindSchema,
  planningPeriod: z.string().min(4).max(16),
  generatedAt: z.string().datetime().optional(),
  modelProvider: z.string().max(64).optional().nullable(),
  modelId: z.string().max(128).optional().nullable(),
  overview: z
    .object({
      summary: z.string().max(2000).optional().nullable(),
      verificationStatus: VerificationStatusSchema.default('needs_review'),
      sourceReferences: z.array(ProvenanceReferenceSchema).max(10).default([]),
    })
    .optional()
    .nullable(),
  strategicPriorities: z.array(AiDraftPrioritySchema).max(30).default([]),
  budget: AiDraftBudgetSchema.optional().nullable(),
  projects: z.array(AiDraftProjectSchema).max(60).default([]),
  serviceDeliveryPriorities: z.array(AiDraftPrioritySchema).max(30).default([]),
  citizenImpact: z
    .array(
      z.object({
        statement: z.string().min(1).max(600),
        verificationStatus: VerificationStatusSchema.default('needs_review'),
        sourceReferences: z.array(ProvenanceReferenceSchema).max(10).default([]),
      })
    )
    .max(20)
    .default([]),
  serviceContacts: z
    .array(
      z.object({
        label: z.string().min(1).max(120),
        detail: z.string().max(400).optional().nullable(),
        verificationStatus: VerificationStatusSchema.default('needs_review'),
        sourceReferences: z.array(ProvenanceReferenceSchema).max(5).default([]),
      })
    )
    .max(30)
    .default([]),
  sourceReferences: z.array(SourceReferenceSchema).max(20).default([]),
})

export type AiExtractDraft = z.infer<typeof AiExtractDraftSchema>

const Base64FileSchema = z.object({
  name: z.string().min(1).max(240),
  type: z.string().min(3).max(120),
  size: z.number().int().min(1).max(25 * 1024 * 1024),
  data: z.string().min(1),
})

export const UploadPlanningDocumentInputSchema = z.object({
  municipalityCode: z.string().min(1).max(32).optional(),
  kind: PlanDocumentKindSchema,
  title: z.string().min(3).max(240),
  fiscalYear: z.string().min(4).max(16),
  officialUrl: z.string().url().max(2048).optional().nullable(),
  publisher: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  file: Base64FileSchema,
})

export type UploadPlanningDocumentInput = z.infer<
  typeof UploadPlanningDocumentInputSchema
>

export const ProcessPlanningDocumentInputSchema = z.object({
  documentId: z.string().min(1).max(64),
  municipalityCode: z.string().min(1).max(32).optional(),
  regenerate: z.boolean().optional(),
})

export type ProcessPlanningDocumentInput = z.infer<
  typeof ProcessPlanningDocumentInputSchema
>

export const UpdatePlanningAiDraftInputSchema = z.object({
  documentId: z.string().min(1).max(64),
  municipalityCode: z.string().min(1).max(32).optional(),
  aiExtractDraft: AiExtractDraftSchema,
  reviewNote: z.string().max(1000).optional(),
})

export type UpdatePlanningAiDraftInput = z.infer<
  typeof UpdatePlanningAiDraftInputSchema
>

export const GetPlanningPublishingDashboardInputSchema = z.object({
  municipalityCode: z.string().min(1).max(32).optional(),
})

export type GetPlanningPublishingDashboardInput = z.infer<
  typeof GetPlanningPublishingDashboardInputSchema
>

export const PLANNING_ALLOWED_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

export function canPublishFromProcessingStatus(
  processingStatus: string,
  publicationStatus: string
): boolean {
  if (processingStatus === 'draft_generated') return false
  if (publicationStatus === 'draft' && processingStatus !== 'approved') {
    return false
  }
  return publicationStatus === 'verified'
}
