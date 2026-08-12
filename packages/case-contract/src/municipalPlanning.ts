/**
 * Municipal Planning (Visual IDP Summary) — shared typed contract.
 *
 * Source of truth for budgets, dates, %, status, ward, and expenditure is
 * verified municipal documents — never AI. AI may assist summarisation only
 * and must be labelled as ServeSA plain-language summary.
 */

import { z } from 'zod'

export const MUNICIPAL_PLANNING_CONTRACT_VERSION = '1.0.0'

/** Official planning document kinds supported by the ingestion pipeline */
export const PlanDocumentKindSchema = z.enum([
  'idp',
  'budget',
  'adjusted_budget',
  'sdbip',
  'annual_report',
  'afs',
  's71',
  's52',
  'performance_report',
  'other_official',
])

export type PlanDocumentKind = z.infer<typeof PlanDocumentKindSchema>

export const PLAN_DOCUMENT_KIND_LABEL: Record<PlanDocumentKind, string> = {
  idp: 'Integrated Development Plan (IDP)',
  budget: 'Municipal Budget',
  adjusted_budget: 'Adjusted Budget',
  sdbip: 'SDBIP',
  annual_report: 'Annual Report',
  afs: 'Annual Financial Statements (AFS)',
  s71: 'Section 71 Report',
  s52: 'Section 52 Report',
  performance_report: 'Performance Report',
  other_official: 'Other Official Document',
}

/**
 * Publication lifecycle for planning artefacts.
 * No raw AI auto-publish: draft → awaiting_review → verified → published.
 */
export const PlanPublicationStatusSchema = z.enum([
  'draft',
  'awaiting_review',
  'verified',
  'published',
  'archived',
])

export type PlanPublicationStatus = z.infer<typeof PlanPublicationStatusSchema>

export const PLAN_PUBLICATION_TRANSITIONS: Record<
  PlanPublicationStatus,
  PlanPublicationStatus[]
> = {
  draft: ['awaiting_review', 'archived'],
  awaiting_review: ['verified', 'draft', 'archived'],
  verified: ['published', 'awaiting_review', 'archived'],
  published: ['archived', 'verified'],
  archived: [],
}

export function canTransitionPlanPublication(
  from: string,
  to: string
): boolean {
  const allowed =
    PLAN_PUBLICATION_TRANSITIONS[from as PlanPublicationStatus]
  if (!allowed) return false
  return allowed.includes(to as PlanPublicationStatus)
}

export function assertPlanPublicationTransition(from: string, to: string): void {
  if (!canTransitionPlanPublication(from, to)) {
    throw new Error(
      `Invalid planning publication transition from ${from} to ${to}`
    )
  }
}

/** Project statuses — never infer without official data */
export const MunicipalProjectStatusSchema = z.enum([
  'planned',
  'procurement',
  'tender_awarded',
  'in_progress',
  'delayed',
  'completed',
  'cancelled',
  'unknown',
])

export type MunicipalProjectStatus = z.infer<
  typeof MunicipalProjectStatusSchema
>

export const MUNICIPAL_PROJECT_STATUS_LABEL: Record<
  MunicipalProjectStatus,
  string
> = {
  planned: 'Planned',
  procurement: 'Procurement',
  tender_awarded: 'Tender Awarded',
  in_progress: 'In Progress',
  delayed: 'Delayed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  unknown: 'Unknown',
}

export const ProjectScopeSchema = z.enum([
  'municipality_wide',
  'regional',
  'ward_specific',
])

export type ProjectScope = z.infer<typeof ProjectScopeSchema>

export const PROJECT_SCOPE_LABEL: Record<ProjectScope, string> = {
  municipality_wide: 'Municipality-wide',
  regional: 'Regional',
  ward_specific: 'Ward-specific',
}

/** Data quality / confidence — honest empty states, never invent */
export const DataConfidenceSchema = z.enum([
  'verified_official',
  'awaiting_verification',
  'partial',
  'not_published',
])

export type DataConfidence = z.infer<typeof DataConfidenceSchema>

export const DATA_CONFIDENCE_LABEL: Record<DataConfidence, string> = {
  verified_official: 'Verified from official source',
  awaiting_verification: 'Data awaiting verification',
  partial: 'Partial — some fields not yet published',
  not_published: 'Not published yet',
}

/**
 * Future-ready accountability layers (metadata only — no scoring).
 * PROMISED / BUDGETED / SPENT / DELIVERED / CITIZEN_EXPERIENCE
 */
export const AccountabilityLayerSchema = z.enum([
  'promised',
  'budgeted',
  'spent',
  'delivered',
  'citizen_experience',
])

export type AccountabilityLayer = z.infer<typeof AccountabilityLayerSchema>

export const SourceReferenceSchema = z.object({
  sourceId: z.string().min(1).max(64).optional(),
  documentKind: PlanDocumentKindSchema,
  title: z.string().min(1).max(240),
  publisher: z.string().max(200).optional(),
  publishedAt: z.string().datetime().optional().nullable(),
  url: z.string().url().max(2048).optional().nullable(),
  pageOrSection: z.string().max(120).optional(),
  /** When true, accompanying text is a ServeSA plain-language summary */
  isServeSaSummary: z.boolean().optional(),
  excerpt: z.string().max(500).optional(),
})

export type SourceReference = z.infer<typeof SourceReferenceSchema>

export const MoneyAmountSchema = z.object({
  amountZar: z.number().finite().nonnegative(),
  currency: z.literal('ZAR').optional().default('ZAR'),
  asOf: z.string().datetime().optional().nullable(),
  layer: AccountabilityLayerSchema.optional(),
  source: SourceReferenceSchema,
})

export type MoneyAmount = z.infer<typeof MoneyAmountSchema>

export const UpsertPlanDocumentInputSchema = z.object({
  documentId: z.string().min(1).max(64).optional(),
  municipalityCode: z.string().min(1).max(32).optional(),
  kind: PlanDocumentKindSchema,
  title: z.string().min(3).max(240),
  fiscalYear: z.string().min(4).max(16),
  storagePath: z.string().max(512).optional().nullable(),
  officialUrl: z.string().url().max(2048).optional().nullable(),
  publisher: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  /** AI-assisted extraction draft — never auto-published */
  aiExtractDraft: z.record(z.unknown()).optional().nullable(),
  publicationStatus: PlanPublicationStatusSchema.optional(),
})

export type UpsertPlanDocumentInput = z.infer<
  typeof UpsertPlanDocumentInputSchema
>

export const UpsertPriorityInputSchema = z.object({
  priorityId: z.string().min(1).max(64).optional(),
  municipalityCode: z.string().min(1).max(32).optional(),
  planId: z.string().min(1).max(64).optional(),
  title: z.string().min(3).max(160),
  /** Plain-language citizen copy — must be labelled if ServeSA-written */
  plainLanguageSummary: z.string().min(10).max(800),
  isServeSaSummary: z.boolean().default(true),
  officialWording: z.string().max(2000).optional().nullable(),
  sortOrder: z.number().int().min(0).max(500).optional(),
  budgeted: MoneyAmountSchema.optional().nullable(),
  progressPercent: z.number().int().min(0).max(100).optional().nullable(),
  relatedProjectIds: z.array(z.string().min(1).max(64)).max(50).optional(),
  sources: z.array(SourceReferenceSchema).min(1).max(20),
  confidence: DataConfidenceSchema.optional(),
  publicationStatus: PlanPublicationStatusSchema.optional(),
})

export type UpsertPriorityInput = z.infer<typeof UpsertPriorityInputSchema>

export const UpsertMunicipalProjectInputSchema = z.object({
  projectId: z.string().min(1).max(64).optional(),
  municipalityCode: z.string().min(1).max(32).optional(),
  planId: z.string().min(1).max(64).optional(),
  title: z.string().min(3).max(200),
  plainLanguageSummary: z.string().min(10).max(1200),
  isServeSaSummary: z.boolean().default(true),
  officialDescription: z.string().max(4000).optional().nullable(),
  status: MunicipalProjectStatusSchema,
  scope: ProjectScopeSchema,
  /** Authoritative ward IDs only when documents provide ward mapping */
  wardIds: z.array(z.string().min(1).max(64)).max(50).optional(),
  wardMappingAvailable: z.boolean().default(false),
  departmentLabel: z.string().max(120).optional().nullable(),
  locationLabel: z.string().max(200).optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  expectedEndDate: z.string().datetime().optional().nullable(),
  progressPercent: z.number().int().min(0).max(100).optional().nullable(),
  budgeted: MoneyAmountSchema.optional().nullable(),
  spent: MoneyAmountSchema.optional().nullable(),
  priorityIds: z.array(z.string().min(1).max(64)).max(20).optional(),
  relatedUpdateIds: z.array(z.string().min(1).max(64)).max(50).optional(),
  relatedCaseIds: z.array(z.string().min(1).max(64)).max(20).optional(),
  officialSourceUrl: z.string().url().max(2048).optional().nullable(),
  sources: z.array(SourceReferenceSchema).min(1).max(20),
  confidence: DataConfidenceSchema.optional(),
  publicationStatus: PlanPublicationStatusSchema.optional(),
})

export type UpsertMunicipalProjectInput = z.infer<
  typeof UpsertMunicipalProjectInputSchema
>

export const UpsertBudgetLineInputSchema = z.object({
  budgetLineId: z.string().min(1).max(64).optional(),
  municipalityCode: z.string().min(1).max(32).optional(),
  planId: z.string().min(1).max(64).optional(),
  fiscalYear: z.string().min(4).max(16),
  categoryLabel: z.string().min(2).max(160),
  plainLanguageLabel: z.string().min(2).max(160),
  amount: MoneyAmountSchema,
  sortOrder: z.number().int().min(0).max(500).optional(),
  confidence: DataConfidenceSchema.optional(),
  publicationStatus: PlanPublicationStatusSchema.optional(),
})

export type UpsertBudgetLineInput = z.infer<typeof UpsertBudgetLineInputSchema>

export const TransitionPlanningStatusInputSchema = z.object({
  entityType: z.enum([
    'document',
    'priority',
    'project',
    'budget_line',
    'plan',
  ]),
  entityId: z.string().min(1).max(64),
  toStatus: PlanPublicationStatusSchema,
  reviewNote: z.string().max(1000).optional(),
})

export type TransitionPlanningStatusInput = z.infer<
  typeof TransitionPlanningStatusInputSchema
>

export const GetMunicipalPlanningSummaryInputSchema = z.object({
  municipalityCode: z.string().min(1).max(32),
  /** Optional ward for YOUR COMMUNITY section — never invent if absent */
  wardId: z.string().max(64).optional().nullable(),
  fiscalYear: z.string().max(16).optional(),
})

export type GetMunicipalPlanningSummaryInput = z.infer<
  typeof GetMunicipalPlanningSummaryInputSchema
>

export const GetMunicipalProjectInputSchema = z.object({
  projectId: z.string().min(1).max(64),
})

export type GetMunicipalProjectInput = z.infer<
  typeof GetMunicipalProjectInputSchema
>

export const ListPlanningEntitiesInputSchema = z.object({
  municipalityCode: z.string().min(1).max(32),
  entityType: z.enum(['document', 'priority', 'project', 'budget_line', 'plan']),
  /** Ops may list all statuses; citizen callables force published */
  publicationStatus: PlanPublicationStatusSchema.optional(),
  citizenView: z.boolean().optional(),
  wardId: z.string().max(64).optional(),
  limit: z.number().int().min(1).max(100).optional(),
})

export type ListPlanningEntitiesInput = z.infer<
  typeof ListPlanningEntitiesInputSchema
>

/** Citizen-facing empty-state copy — never invent numbers */
export const PLANNING_EMPTY_COPY = {
  notPublished: 'Not published yet',
  awaitingVerification: 'Data awaiting verification',
  noWardMapping:
    'Ward-level project mapping is not available for this municipality yet.',
  resolutionUnavailable:
    'We could not confirm your municipality yet. Confirm where you live to see local planning information.',
} as const
