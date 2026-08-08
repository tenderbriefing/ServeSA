"use strict";
/**
 * Municipal Planning (Visual IDP Summary) — shared typed contract.
 *
 * Source of truth for budgets, dates, %, status, ward, and expenditure is
 * verified municipal documents — never AI. AI may assist summarisation only
 * and must be labelled as ServeSA plain-language summary.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLANNING_EMPTY_COPY = exports.ListPlanningEntitiesInputSchema = exports.GetMunicipalProjectInputSchema = exports.GetMunicipalPlanningSummaryInputSchema = exports.TransitionPlanningStatusInputSchema = exports.UpsertBudgetLineInputSchema = exports.UpsertMunicipalProjectInputSchema = exports.UpsertPriorityInputSchema = exports.UpsertPlanDocumentInputSchema = exports.MoneyAmountSchema = exports.SourceReferenceSchema = exports.AccountabilityLayerSchema = exports.DATA_CONFIDENCE_LABEL = exports.DataConfidenceSchema = exports.PROJECT_SCOPE_LABEL = exports.ProjectScopeSchema = exports.MUNICIPAL_PROJECT_STATUS_LABEL = exports.MunicipalProjectStatusSchema = exports.PLAN_PUBLICATION_TRANSITIONS = exports.PlanPublicationStatusSchema = exports.PLAN_DOCUMENT_KIND_LABEL = exports.PlanDocumentKindSchema = exports.MUNICIPAL_PLANNING_CONTRACT_VERSION = void 0;
exports.canTransitionPlanPublication = canTransitionPlanPublication;
exports.assertPlanPublicationTransition = assertPlanPublicationTransition;
const zod_1 = require("zod");
exports.MUNICIPAL_PLANNING_CONTRACT_VERSION = '1.0.0';
/** Official planning document kinds supported by the ingestion pipeline */
exports.PlanDocumentKindSchema = zod_1.z.enum([
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
]);
exports.PLAN_DOCUMENT_KIND_LABEL = {
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
};
/**
 * Publication lifecycle for planning artefacts.
 * No raw AI auto-publish: draft → awaiting_review → verified → published.
 */
exports.PlanPublicationStatusSchema = zod_1.z.enum([
    'draft',
    'awaiting_review',
    'verified',
    'published',
    'archived',
]);
exports.PLAN_PUBLICATION_TRANSITIONS = {
    draft: ['awaiting_review', 'archived'],
    awaiting_review: ['verified', 'draft', 'archived'],
    verified: ['published', 'awaiting_review', 'archived'],
    published: ['archived', 'verified'],
    archived: [],
};
function canTransitionPlanPublication(from, to) {
    const allowed = exports.PLAN_PUBLICATION_TRANSITIONS[from];
    if (!allowed)
        return false;
    return allowed.includes(to);
}
function assertPlanPublicationTransition(from, to) {
    if (!canTransitionPlanPublication(from, to)) {
        throw new Error(`Invalid planning publication transition from ${from} to ${to}`);
    }
}
/** Project statuses — never infer without official data */
exports.MunicipalProjectStatusSchema = zod_1.z.enum([
    'planned',
    'procurement',
    'tender_awarded',
    'in_progress',
    'delayed',
    'completed',
    'cancelled',
    'unknown',
]);
exports.MUNICIPAL_PROJECT_STATUS_LABEL = {
    planned: 'Planned',
    procurement: 'Procurement',
    tender_awarded: 'Tender Awarded',
    in_progress: 'In Progress',
    delayed: 'Delayed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    unknown: 'Unknown',
};
exports.ProjectScopeSchema = zod_1.z.enum([
    'municipality_wide',
    'regional',
    'ward_specific',
]);
exports.PROJECT_SCOPE_LABEL = {
    municipality_wide: 'Municipality-wide',
    regional: 'Regional',
    ward_specific: 'Ward-specific',
};
/** Data quality / confidence — honest empty states, never invent */
exports.DataConfidenceSchema = zod_1.z.enum([
    'verified_official',
    'awaiting_verification',
    'partial',
    'not_published',
]);
exports.DATA_CONFIDENCE_LABEL = {
    verified_official: 'Verified from official source',
    awaiting_verification: 'Data awaiting verification',
    partial: 'Partial — some fields not yet published',
    not_published: 'Not published yet',
};
/**
 * Future-ready accountability layers (metadata only — no scoring).
 * PROMISED / BUDGETED / SPENT / DELIVERED / CITIZEN_EXPERIENCE
 */
exports.AccountabilityLayerSchema = zod_1.z.enum([
    'promised',
    'budgeted',
    'spent',
    'delivered',
    'citizen_experience',
]);
exports.SourceReferenceSchema = zod_1.z.object({
    sourceId: zod_1.z.string().min(1).max(64).optional(),
    documentKind: exports.PlanDocumentKindSchema,
    title: zod_1.z.string().min(1).max(240),
    publisher: zod_1.z.string().max(200).optional(),
    publishedAt: zod_1.z.string().datetime().optional().nullable(),
    url: zod_1.z.string().url().max(2048).optional().nullable(),
    pageOrSection: zod_1.z.string().max(120).optional(),
    /** When true, accompanying text is a ServeSA plain-language summary */
    isServeSaSummary: zod_1.z.boolean().optional(),
    excerpt: zod_1.z.string().max(500).optional(),
});
exports.MoneyAmountSchema = zod_1.z.object({
    amountZar: zod_1.z.number().finite().nonnegative(),
    currency: zod_1.z.literal('ZAR').optional().default('ZAR'),
    asOf: zod_1.z.string().datetime().optional().nullable(),
    layer: exports.AccountabilityLayerSchema.optional(),
    source: exports.SourceReferenceSchema,
});
exports.UpsertPlanDocumentInputSchema = zod_1.z.object({
    documentId: zod_1.z.string().min(1).max(64).optional(),
    municipalityCode: zod_1.z.string().min(1).max(32).optional(),
    kind: exports.PlanDocumentKindSchema,
    title: zod_1.z.string().min(3).max(240),
    fiscalYear: zod_1.z.string().min(4).max(16),
    storagePath: zod_1.z.string().max(512).optional().nullable(),
    officialUrl: zod_1.z.string().url().max(2048).optional().nullable(),
    publisher: zod_1.z.string().max(200).optional(),
    notes: zod_1.z.string().max(2000).optional(),
    /** AI-assisted extraction draft — never auto-published */
    aiExtractDraft: zod_1.z.record(zod_1.z.unknown()).optional().nullable(),
    publicationStatus: exports.PlanPublicationStatusSchema.optional(),
});
exports.UpsertPriorityInputSchema = zod_1.z.object({
    priorityId: zod_1.z.string().min(1).max(64).optional(),
    municipalityCode: zod_1.z.string().min(1).max(32).optional(),
    planId: zod_1.z.string().min(1).max(64).optional(),
    title: zod_1.z.string().min(3).max(160),
    /** Plain-language citizen copy — must be labelled if ServeSA-written */
    plainLanguageSummary: zod_1.z.string().min(10).max(800),
    isServeSaSummary: zod_1.z.boolean().default(true),
    officialWording: zod_1.z.string().max(2000).optional().nullable(),
    sortOrder: zod_1.z.number().int().min(0).max(500).optional(),
    budgeted: exports.MoneyAmountSchema.optional().nullable(),
    progressPercent: zod_1.z.number().int().min(0).max(100).optional().nullable(),
    relatedProjectIds: zod_1.z.array(zod_1.z.string().min(1).max(64)).max(50).optional(),
    sources: zod_1.z.array(exports.SourceReferenceSchema).min(1).max(20),
    confidence: exports.DataConfidenceSchema.optional(),
    publicationStatus: exports.PlanPublicationStatusSchema.optional(),
});
exports.UpsertMunicipalProjectInputSchema = zod_1.z.object({
    projectId: zod_1.z.string().min(1).max(64).optional(),
    municipalityCode: zod_1.z.string().min(1).max(32).optional(),
    planId: zod_1.z.string().min(1).max(64).optional(),
    title: zod_1.z.string().min(3).max(200),
    plainLanguageSummary: zod_1.z.string().min(10).max(1200),
    isServeSaSummary: zod_1.z.boolean().default(true),
    officialDescription: zod_1.z.string().max(4000).optional().nullable(),
    status: exports.MunicipalProjectStatusSchema,
    scope: exports.ProjectScopeSchema,
    /** Authoritative ward IDs only when documents provide ward mapping */
    wardIds: zod_1.z.array(zod_1.z.string().min(1).max(64)).max(50).optional(),
    wardMappingAvailable: zod_1.z.boolean().default(false),
    departmentLabel: zod_1.z.string().max(120).optional().nullable(),
    locationLabel: zod_1.z.string().max(200).optional().nullable(),
    startDate: zod_1.z.string().datetime().optional().nullable(),
    expectedEndDate: zod_1.z.string().datetime().optional().nullable(),
    progressPercent: zod_1.z.number().int().min(0).max(100).optional().nullable(),
    budgeted: exports.MoneyAmountSchema.optional().nullable(),
    spent: exports.MoneyAmountSchema.optional().nullable(),
    priorityIds: zod_1.z.array(zod_1.z.string().min(1).max(64)).max(20).optional(),
    relatedUpdateIds: zod_1.z.array(zod_1.z.string().min(1).max(64)).max(50).optional(),
    relatedCaseIds: zod_1.z.array(zod_1.z.string().min(1).max(64)).max(20).optional(),
    officialSourceUrl: zod_1.z.string().url().max(2048).optional().nullable(),
    sources: zod_1.z.array(exports.SourceReferenceSchema).min(1).max(20),
    confidence: exports.DataConfidenceSchema.optional(),
    publicationStatus: exports.PlanPublicationStatusSchema.optional(),
});
exports.UpsertBudgetLineInputSchema = zod_1.z.object({
    budgetLineId: zod_1.z.string().min(1).max(64).optional(),
    municipalityCode: zod_1.z.string().min(1).max(32).optional(),
    planId: zod_1.z.string().min(1).max(64).optional(),
    fiscalYear: zod_1.z.string().min(4).max(16),
    categoryLabel: zod_1.z.string().min(2).max(160),
    plainLanguageLabel: zod_1.z.string().min(2).max(160),
    amount: exports.MoneyAmountSchema,
    sortOrder: zod_1.z.number().int().min(0).max(500).optional(),
    confidence: exports.DataConfidenceSchema.optional(),
    publicationStatus: exports.PlanPublicationStatusSchema.optional(),
});
exports.TransitionPlanningStatusInputSchema = zod_1.z.object({
    entityType: zod_1.z.enum([
        'document',
        'priority',
        'project',
        'budget_line',
        'plan',
    ]),
    entityId: zod_1.z.string().min(1).max(64),
    toStatus: exports.PlanPublicationStatusSchema,
    reviewNote: zod_1.z.string().max(1000).optional(),
});
exports.GetMunicipalPlanningSummaryInputSchema = zod_1.z.object({
    municipalityCode: zod_1.z.string().min(1).max(32),
    /** Optional ward for YOUR COMMUNITY section — never invent if absent */
    wardId: zod_1.z.string().max(64).optional().nullable(),
    fiscalYear: zod_1.z.string().max(16).optional(),
});
exports.GetMunicipalProjectInputSchema = zod_1.z.object({
    projectId: zod_1.z.string().min(1).max(64),
});
exports.ListPlanningEntitiesInputSchema = zod_1.z.object({
    municipalityCode: zod_1.z.string().min(1).max(32),
    entityType: zod_1.z.enum(['document', 'priority', 'project', 'budget_line', 'plan']),
    /** Ops may list all statuses; citizen callables force published */
    publicationStatus: exports.PlanPublicationStatusSchema.optional(),
    citizenView: zod_1.z.boolean().optional(),
    wardId: zod_1.z.string().max(64).optional(),
    limit: zod_1.z.number().int().min(1).max(100).optional(),
});
/** Citizen-facing empty-state copy — never invent numbers */
exports.PLANNING_EMPTY_COPY = {
    notPublished: 'Not published yet',
    awaitingVerification: 'Data awaiting verification',
    noWardMapping: 'Ward-level project mapping is not available for this municipality yet.',
    resolutionUnavailable: 'We could not confirm your municipality yet. Showing published planning for the pilot area when available.',
};
