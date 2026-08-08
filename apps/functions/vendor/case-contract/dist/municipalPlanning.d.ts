/**
 * Municipal Planning (Visual IDP Summary) — shared typed contract.
 *
 * Source of truth for budgets, dates, %, status, ward, and expenditure is
 * verified municipal documents — never AI. AI may assist summarisation only
 * and must be labelled as ServeSA plain-language summary.
 */
import { z } from 'zod';
export declare const MUNICIPAL_PLANNING_CONTRACT_VERSION = "1.0.0";
/** Official planning document kinds supported by the ingestion pipeline */
export declare const PlanDocumentKindSchema: z.ZodEnum<["idp", "budget", "adjusted_budget", "sdbip", "annual_report", "afs", "s71", "s52", "performance_report", "other_official"]>;
export type PlanDocumentKind = z.infer<typeof PlanDocumentKindSchema>;
export declare const PLAN_DOCUMENT_KIND_LABEL: Record<PlanDocumentKind, string>;
/**
 * Publication lifecycle for planning artefacts.
 * No raw AI auto-publish: draft → awaiting_review → verified → published.
 */
export declare const PlanPublicationStatusSchema: z.ZodEnum<["draft", "awaiting_review", "verified", "published", "archived"]>;
export type PlanPublicationStatus = z.infer<typeof PlanPublicationStatusSchema>;
export declare const PLAN_PUBLICATION_TRANSITIONS: Record<PlanPublicationStatus, PlanPublicationStatus[]>;
export declare function canTransitionPlanPublication(from: string, to: string): boolean;
export declare function assertPlanPublicationTransition(from: string, to: string): void;
/** Project statuses — never infer without official data */
export declare const MunicipalProjectStatusSchema: z.ZodEnum<["planned", "procurement", "tender_awarded", "in_progress", "delayed", "completed", "cancelled", "unknown"]>;
export type MunicipalProjectStatus = z.infer<typeof MunicipalProjectStatusSchema>;
export declare const MUNICIPAL_PROJECT_STATUS_LABEL: Record<MunicipalProjectStatus, string>;
export declare const ProjectScopeSchema: z.ZodEnum<["municipality_wide", "regional", "ward_specific"]>;
export type ProjectScope = z.infer<typeof ProjectScopeSchema>;
export declare const PROJECT_SCOPE_LABEL: Record<ProjectScope, string>;
/** Data quality / confidence — honest empty states, never invent */
export declare const DataConfidenceSchema: z.ZodEnum<["verified_official", "awaiting_verification", "partial", "not_published"]>;
export type DataConfidence = z.infer<typeof DataConfidenceSchema>;
export declare const DATA_CONFIDENCE_LABEL: Record<DataConfidence, string>;
/**
 * Future-ready accountability layers (metadata only — no scoring).
 * PROMISED / BUDGETED / SPENT / DELIVERED / CITIZEN_EXPERIENCE
 */
export declare const AccountabilityLayerSchema: z.ZodEnum<["promised", "budgeted", "spent", "delivered", "citizen_experience"]>;
export type AccountabilityLayer = z.infer<typeof AccountabilityLayerSchema>;
export declare const SourceReferenceSchema: z.ZodObject<{
    sourceId: z.ZodOptional<z.ZodString>;
    documentKind: z.ZodEnum<["idp", "budget", "adjusted_budget", "sdbip", "annual_report", "afs", "s71", "s52", "performance_report", "other_official"]>;
    title: z.ZodString;
    publisher: z.ZodOptional<z.ZodString>;
    publishedAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    url: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    pageOrSection: z.ZodOptional<z.ZodString>;
    /** When true, accompanying text is a ServeSA plain-language summary */
    isServeSaSummary: z.ZodOptional<z.ZodBoolean>;
    excerpt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
    sourceId?: string | undefined;
    publisher?: string | undefined;
    publishedAt?: string | null | undefined;
    url?: string | null | undefined;
    pageOrSection?: string | undefined;
    isServeSaSummary?: boolean | undefined;
    excerpt?: string | undefined;
}, {
    title: string;
    documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
    sourceId?: string | undefined;
    publisher?: string | undefined;
    publishedAt?: string | null | undefined;
    url?: string | null | undefined;
    pageOrSection?: string | undefined;
    isServeSaSummary?: boolean | undefined;
    excerpt?: string | undefined;
}>;
export type SourceReference = z.infer<typeof SourceReferenceSchema>;
export declare const MoneyAmountSchema: z.ZodObject<{
    amountZar: z.ZodNumber;
    currency: z.ZodDefault<z.ZodOptional<z.ZodLiteral<"ZAR">>>;
    asOf: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    layer: z.ZodOptional<z.ZodEnum<["promised", "budgeted", "spent", "delivered", "citizen_experience"]>>;
    source: z.ZodObject<{
        sourceId: z.ZodOptional<z.ZodString>;
        documentKind: z.ZodEnum<["idp", "budget", "adjusted_budget", "sdbip", "annual_report", "afs", "s71", "s52", "performance_report", "other_official"]>;
        title: z.ZodString;
        publisher: z.ZodOptional<z.ZodString>;
        publishedAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        url: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        pageOrSection: z.ZodOptional<z.ZodString>;
        /** When true, accompanying text is a ServeSA plain-language summary */
        isServeSaSummary: z.ZodOptional<z.ZodBoolean>;
        excerpt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
        sourceId?: string | undefined;
        publisher?: string | undefined;
        publishedAt?: string | null | undefined;
        url?: string | null | undefined;
        pageOrSection?: string | undefined;
        isServeSaSummary?: boolean | undefined;
        excerpt?: string | undefined;
    }, {
        title: string;
        documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
        sourceId?: string | undefined;
        publisher?: string | undefined;
        publishedAt?: string | null | undefined;
        url?: string | null | undefined;
        pageOrSection?: string | undefined;
        isServeSaSummary?: boolean | undefined;
        excerpt?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    amountZar: number;
    currency: "ZAR";
    source: {
        title: string;
        documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
        sourceId?: string | undefined;
        publisher?: string | undefined;
        publishedAt?: string | null | undefined;
        url?: string | null | undefined;
        pageOrSection?: string | undefined;
        isServeSaSummary?: boolean | undefined;
        excerpt?: string | undefined;
    };
    asOf?: string | null | undefined;
    layer?: "promised" | "budgeted" | "spent" | "delivered" | "citizen_experience" | undefined;
}, {
    amountZar: number;
    source: {
        title: string;
        documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
        sourceId?: string | undefined;
        publisher?: string | undefined;
        publishedAt?: string | null | undefined;
        url?: string | null | undefined;
        pageOrSection?: string | undefined;
        isServeSaSummary?: boolean | undefined;
        excerpt?: string | undefined;
    };
    currency?: "ZAR" | undefined;
    asOf?: string | null | undefined;
    layer?: "promised" | "budgeted" | "spent" | "delivered" | "citizen_experience" | undefined;
}>;
export type MoneyAmount = z.infer<typeof MoneyAmountSchema>;
export declare const UpsertPlanDocumentInputSchema: z.ZodObject<{
    documentId: z.ZodOptional<z.ZodString>;
    municipalityCode: z.ZodOptional<z.ZodString>;
    kind: z.ZodEnum<["idp", "budget", "adjusted_budget", "sdbip", "annual_report", "afs", "s71", "s52", "performance_report", "other_official"]>;
    title: z.ZodString;
    fiscalYear: z.ZodString;
    storagePath: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    officialUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    publisher: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    /** AI-assisted extraction draft — never auto-published */
    aiExtractDraft: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    publicationStatus: z.ZodOptional<z.ZodEnum<["draft", "awaiting_review", "verified", "published", "archived"]>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    kind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
    fiscalYear: string;
    municipalityCode?: string | undefined;
    publisher?: string | undefined;
    documentId?: string | undefined;
    storagePath?: string | null | undefined;
    officialUrl?: string | null | undefined;
    notes?: string | undefined;
    aiExtractDraft?: Record<string, unknown> | null | undefined;
    publicationStatus?: "archived" | "draft" | "published" | "awaiting_review" | "verified" | undefined;
}, {
    title: string;
    kind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
    fiscalYear: string;
    municipalityCode?: string | undefined;
    publisher?: string | undefined;
    documentId?: string | undefined;
    storagePath?: string | null | undefined;
    officialUrl?: string | null | undefined;
    notes?: string | undefined;
    aiExtractDraft?: Record<string, unknown> | null | undefined;
    publicationStatus?: "archived" | "draft" | "published" | "awaiting_review" | "verified" | undefined;
}>;
export type UpsertPlanDocumentInput = z.infer<typeof UpsertPlanDocumentInputSchema>;
export declare const UpsertPriorityInputSchema: z.ZodObject<{
    priorityId: z.ZodOptional<z.ZodString>;
    municipalityCode: z.ZodOptional<z.ZodString>;
    planId: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    /** Plain-language citizen copy — must be labelled if ServeSA-written */
    plainLanguageSummary: z.ZodString;
    isServeSaSummary: z.ZodDefault<z.ZodBoolean>;
    officialWording: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
    budgeted: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        amountZar: z.ZodNumber;
        currency: z.ZodDefault<z.ZodOptional<z.ZodLiteral<"ZAR">>>;
        asOf: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        layer: z.ZodOptional<z.ZodEnum<["promised", "budgeted", "spent", "delivered", "citizen_experience"]>>;
        source: z.ZodObject<{
            sourceId: z.ZodOptional<z.ZodString>;
            documentKind: z.ZodEnum<["idp", "budget", "adjusted_budget", "sdbip", "annual_report", "afs", "s71", "s52", "performance_report", "other_official"]>;
            title: z.ZodString;
            publisher: z.ZodOptional<z.ZodString>;
            publishedAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            url: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            pageOrSection: z.ZodOptional<z.ZodString>;
            /** When true, accompanying text is a ServeSA plain-language summary */
            isServeSaSummary: z.ZodOptional<z.ZodBoolean>;
            excerpt: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            title: string;
            documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
            sourceId?: string | undefined;
            publisher?: string | undefined;
            publishedAt?: string | null | undefined;
            url?: string | null | undefined;
            pageOrSection?: string | undefined;
            isServeSaSummary?: boolean | undefined;
            excerpt?: string | undefined;
        }, {
            title: string;
            documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
            sourceId?: string | undefined;
            publisher?: string | undefined;
            publishedAt?: string | null | undefined;
            url?: string | null | undefined;
            pageOrSection?: string | undefined;
            isServeSaSummary?: boolean | undefined;
            excerpt?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        amountZar: number;
        currency: "ZAR";
        source: {
            title: string;
            documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
            sourceId?: string | undefined;
            publisher?: string | undefined;
            publishedAt?: string | null | undefined;
            url?: string | null | undefined;
            pageOrSection?: string | undefined;
            isServeSaSummary?: boolean | undefined;
            excerpt?: string | undefined;
        };
        asOf?: string | null | undefined;
        layer?: "promised" | "budgeted" | "spent" | "delivered" | "citizen_experience" | undefined;
    }, {
        amountZar: number;
        source: {
            title: string;
            documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
            sourceId?: string | undefined;
            publisher?: string | undefined;
            publishedAt?: string | null | undefined;
            url?: string | null | undefined;
            pageOrSection?: string | undefined;
            isServeSaSummary?: boolean | undefined;
            excerpt?: string | undefined;
        };
        currency?: "ZAR" | undefined;
        asOf?: string | null | undefined;
        layer?: "promised" | "budgeted" | "spent" | "delivered" | "citizen_experience" | undefined;
    }>>>;
    progressPercent: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    relatedProjectIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    sources: z.ZodArray<z.ZodObject<{
        sourceId: z.ZodOptional<z.ZodString>;
        documentKind: z.ZodEnum<["idp", "budget", "adjusted_budget", "sdbip", "annual_report", "afs", "s71", "s52", "performance_report", "other_official"]>;
        title: z.ZodString;
        publisher: z.ZodOptional<z.ZodString>;
        publishedAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        url: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        pageOrSection: z.ZodOptional<z.ZodString>;
        /** When true, accompanying text is a ServeSA plain-language summary */
        isServeSaSummary: z.ZodOptional<z.ZodBoolean>;
        excerpt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
        sourceId?: string | undefined;
        publisher?: string | undefined;
        publishedAt?: string | null | undefined;
        url?: string | null | undefined;
        pageOrSection?: string | undefined;
        isServeSaSummary?: boolean | undefined;
        excerpt?: string | undefined;
    }, {
        title: string;
        documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
        sourceId?: string | undefined;
        publisher?: string | undefined;
        publishedAt?: string | null | undefined;
        url?: string | null | undefined;
        pageOrSection?: string | undefined;
        isServeSaSummary?: boolean | undefined;
        excerpt?: string | undefined;
    }>, "many">;
    confidence: z.ZodOptional<z.ZodEnum<["verified_official", "awaiting_verification", "partial", "not_published"]>>;
    publicationStatus: z.ZodOptional<z.ZodEnum<["draft", "awaiting_review", "verified", "published", "archived"]>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    isServeSaSummary: boolean;
    plainLanguageSummary: string;
    sources: {
        title: string;
        documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
        sourceId?: string | undefined;
        publisher?: string | undefined;
        publishedAt?: string | null | undefined;
        url?: string | null | undefined;
        pageOrSection?: string | undefined;
        isServeSaSummary?: boolean | undefined;
        excerpt?: string | undefined;
    }[];
    municipalityCode?: string | undefined;
    progressPercent?: number | null | undefined;
    budgeted?: {
        amountZar: number;
        currency: "ZAR";
        source: {
            title: string;
            documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
            sourceId?: string | undefined;
            publisher?: string | undefined;
            publishedAt?: string | null | undefined;
            url?: string | null | undefined;
            pageOrSection?: string | undefined;
            isServeSaSummary?: boolean | undefined;
            excerpt?: string | undefined;
        };
        asOf?: string | null | undefined;
        layer?: "promised" | "budgeted" | "spent" | "delivered" | "citizen_experience" | undefined;
    } | null | undefined;
    publicationStatus?: "archived" | "draft" | "published" | "awaiting_review" | "verified" | undefined;
    priorityId?: string | undefined;
    planId?: string | undefined;
    officialWording?: string | null | undefined;
    sortOrder?: number | undefined;
    relatedProjectIds?: string[] | undefined;
    confidence?: "verified_official" | "awaiting_verification" | "partial" | "not_published" | undefined;
}, {
    title: string;
    plainLanguageSummary: string;
    sources: {
        title: string;
        documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
        sourceId?: string | undefined;
        publisher?: string | undefined;
        publishedAt?: string | null | undefined;
        url?: string | null | undefined;
        pageOrSection?: string | undefined;
        isServeSaSummary?: boolean | undefined;
        excerpt?: string | undefined;
    }[];
    municipalityCode?: string | undefined;
    progressPercent?: number | null | undefined;
    budgeted?: {
        amountZar: number;
        source: {
            title: string;
            documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
            sourceId?: string | undefined;
            publisher?: string | undefined;
            publishedAt?: string | null | undefined;
            url?: string | null | undefined;
            pageOrSection?: string | undefined;
            isServeSaSummary?: boolean | undefined;
            excerpt?: string | undefined;
        };
        currency?: "ZAR" | undefined;
        asOf?: string | null | undefined;
        layer?: "promised" | "budgeted" | "spent" | "delivered" | "citizen_experience" | undefined;
    } | null | undefined;
    isServeSaSummary?: boolean | undefined;
    publicationStatus?: "archived" | "draft" | "published" | "awaiting_review" | "verified" | undefined;
    priorityId?: string | undefined;
    planId?: string | undefined;
    officialWording?: string | null | undefined;
    sortOrder?: number | undefined;
    relatedProjectIds?: string[] | undefined;
    confidence?: "verified_official" | "awaiting_verification" | "partial" | "not_published" | undefined;
}>;
export type UpsertPriorityInput = z.infer<typeof UpsertPriorityInputSchema>;
export declare const UpsertMunicipalProjectInputSchema: z.ZodObject<{
    projectId: z.ZodOptional<z.ZodString>;
    municipalityCode: z.ZodOptional<z.ZodString>;
    planId: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    plainLanguageSummary: z.ZodString;
    isServeSaSummary: z.ZodDefault<z.ZodBoolean>;
    officialDescription: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodEnum<["planned", "procurement", "tender_awarded", "in_progress", "delayed", "completed", "cancelled", "unknown"]>;
    scope: z.ZodEnum<["municipality_wide", "regional", "ward_specific"]>;
    /** Authoritative ward IDs only when documents provide ward mapping */
    wardIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    wardMappingAvailable: z.ZodDefault<z.ZodBoolean>;
    departmentLabel: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    locationLabel: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    startDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    expectedEndDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    progressPercent: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    budgeted: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        amountZar: z.ZodNumber;
        currency: z.ZodDefault<z.ZodOptional<z.ZodLiteral<"ZAR">>>;
        asOf: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        layer: z.ZodOptional<z.ZodEnum<["promised", "budgeted", "spent", "delivered", "citizen_experience"]>>;
        source: z.ZodObject<{
            sourceId: z.ZodOptional<z.ZodString>;
            documentKind: z.ZodEnum<["idp", "budget", "adjusted_budget", "sdbip", "annual_report", "afs", "s71", "s52", "performance_report", "other_official"]>;
            title: z.ZodString;
            publisher: z.ZodOptional<z.ZodString>;
            publishedAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            url: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            pageOrSection: z.ZodOptional<z.ZodString>;
            /** When true, accompanying text is a ServeSA plain-language summary */
            isServeSaSummary: z.ZodOptional<z.ZodBoolean>;
            excerpt: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            title: string;
            documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
            sourceId?: string | undefined;
            publisher?: string | undefined;
            publishedAt?: string | null | undefined;
            url?: string | null | undefined;
            pageOrSection?: string | undefined;
            isServeSaSummary?: boolean | undefined;
            excerpt?: string | undefined;
        }, {
            title: string;
            documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
            sourceId?: string | undefined;
            publisher?: string | undefined;
            publishedAt?: string | null | undefined;
            url?: string | null | undefined;
            pageOrSection?: string | undefined;
            isServeSaSummary?: boolean | undefined;
            excerpt?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        amountZar: number;
        currency: "ZAR";
        source: {
            title: string;
            documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
            sourceId?: string | undefined;
            publisher?: string | undefined;
            publishedAt?: string | null | undefined;
            url?: string | null | undefined;
            pageOrSection?: string | undefined;
            isServeSaSummary?: boolean | undefined;
            excerpt?: string | undefined;
        };
        asOf?: string | null | undefined;
        layer?: "promised" | "budgeted" | "spent" | "delivered" | "citizen_experience" | undefined;
    }, {
        amountZar: number;
        source: {
            title: string;
            documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
            sourceId?: string | undefined;
            publisher?: string | undefined;
            publishedAt?: string | null | undefined;
            url?: string | null | undefined;
            pageOrSection?: string | undefined;
            isServeSaSummary?: boolean | undefined;
            excerpt?: string | undefined;
        };
        currency?: "ZAR" | undefined;
        asOf?: string | null | undefined;
        layer?: "promised" | "budgeted" | "spent" | "delivered" | "citizen_experience" | undefined;
    }>>>;
    spent: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        amountZar: z.ZodNumber;
        currency: z.ZodDefault<z.ZodOptional<z.ZodLiteral<"ZAR">>>;
        asOf: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        layer: z.ZodOptional<z.ZodEnum<["promised", "budgeted", "spent", "delivered", "citizen_experience"]>>;
        source: z.ZodObject<{
            sourceId: z.ZodOptional<z.ZodString>;
            documentKind: z.ZodEnum<["idp", "budget", "adjusted_budget", "sdbip", "annual_report", "afs", "s71", "s52", "performance_report", "other_official"]>;
            title: z.ZodString;
            publisher: z.ZodOptional<z.ZodString>;
            publishedAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            url: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            pageOrSection: z.ZodOptional<z.ZodString>;
            /** When true, accompanying text is a ServeSA plain-language summary */
            isServeSaSummary: z.ZodOptional<z.ZodBoolean>;
            excerpt: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            title: string;
            documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
            sourceId?: string | undefined;
            publisher?: string | undefined;
            publishedAt?: string | null | undefined;
            url?: string | null | undefined;
            pageOrSection?: string | undefined;
            isServeSaSummary?: boolean | undefined;
            excerpt?: string | undefined;
        }, {
            title: string;
            documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
            sourceId?: string | undefined;
            publisher?: string | undefined;
            publishedAt?: string | null | undefined;
            url?: string | null | undefined;
            pageOrSection?: string | undefined;
            isServeSaSummary?: boolean | undefined;
            excerpt?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        amountZar: number;
        currency: "ZAR";
        source: {
            title: string;
            documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
            sourceId?: string | undefined;
            publisher?: string | undefined;
            publishedAt?: string | null | undefined;
            url?: string | null | undefined;
            pageOrSection?: string | undefined;
            isServeSaSummary?: boolean | undefined;
            excerpt?: string | undefined;
        };
        asOf?: string | null | undefined;
        layer?: "promised" | "budgeted" | "spent" | "delivered" | "citizen_experience" | undefined;
    }, {
        amountZar: number;
        source: {
            title: string;
            documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
            sourceId?: string | undefined;
            publisher?: string | undefined;
            publishedAt?: string | null | undefined;
            url?: string | null | undefined;
            pageOrSection?: string | undefined;
            isServeSaSummary?: boolean | undefined;
            excerpt?: string | undefined;
        };
        currency?: "ZAR" | undefined;
        asOf?: string | null | undefined;
        layer?: "promised" | "budgeted" | "spent" | "delivered" | "citizen_experience" | undefined;
    }>>>;
    priorityIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    relatedUpdateIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    relatedCaseIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    officialSourceUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sources: z.ZodArray<z.ZodObject<{
        sourceId: z.ZodOptional<z.ZodString>;
        documentKind: z.ZodEnum<["idp", "budget", "adjusted_budget", "sdbip", "annual_report", "afs", "s71", "s52", "performance_report", "other_official"]>;
        title: z.ZodString;
        publisher: z.ZodOptional<z.ZodString>;
        publishedAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        url: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        pageOrSection: z.ZodOptional<z.ZodString>;
        /** When true, accompanying text is a ServeSA plain-language summary */
        isServeSaSummary: z.ZodOptional<z.ZodBoolean>;
        excerpt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
        sourceId?: string | undefined;
        publisher?: string | undefined;
        publishedAt?: string | null | undefined;
        url?: string | null | undefined;
        pageOrSection?: string | undefined;
        isServeSaSummary?: boolean | undefined;
        excerpt?: string | undefined;
    }, {
        title: string;
        documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
        sourceId?: string | undefined;
        publisher?: string | undefined;
        publishedAt?: string | null | undefined;
        url?: string | null | undefined;
        pageOrSection?: string | undefined;
        isServeSaSummary?: boolean | undefined;
        excerpt?: string | undefined;
    }>, "many">;
    confidence: z.ZodOptional<z.ZodEnum<["verified_official", "awaiting_verification", "partial", "not_published"]>>;
    publicationStatus: z.ZodOptional<z.ZodEnum<["draft", "awaiting_review", "verified", "published", "archived"]>>;
}, "strip", z.ZodTypeAny, {
    status: "planned" | "in_progress" | "unknown" | "completed" | "procurement" | "tender_awarded" | "delayed" | "cancelled";
    title: string;
    isServeSaSummary: boolean;
    plainLanguageSummary: string;
    sources: {
        title: string;
        documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
        sourceId?: string | undefined;
        publisher?: string | undefined;
        publishedAt?: string | null | undefined;
        url?: string | null | undefined;
        pageOrSection?: string | undefined;
        isServeSaSummary?: boolean | undefined;
        excerpt?: string | undefined;
    }[];
    scope: "municipality_wide" | "regional" | "ward_specific";
    wardMappingAvailable: boolean;
    municipalityCode?: string | undefined;
    progressPercent?: number | null | undefined;
    wardIds?: string[] | undefined;
    budgeted?: {
        amountZar: number;
        currency: "ZAR";
        source: {
            title: string;
            documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
            sourceId?: string | undefined;
            publisher?: string | undefined;
            publishedAt?: string | null | undefined;
            url?: string | null | undefined;
            pageOrSection?: string | undefined;
            isServeSaSummary?: boolean | undefined;
            excerpt?: string | undefined;
        };
        asOf?: string | null | undefined;
        layer?: "promised" | "budgeted" | "spent" | "delivered" | "citizen_experience" | undefined;
    } | null | undefined;
    spent?: {
        amountZar: number;
        currency: "ZAR";
        source: {
            title: string;
            documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
            sourceId?: string | undefined;
            publisher?: string | undefined;
            publishedAt?: string | null | undefined;
            url?: string | null | undefined;
            pageOrSection?: string | undefined;
            isServeSaSummary?: boolean | undefined;
            excerpt?: string | undefined;
        };
        asOf?: string | null | undefined;
        layer?: "promised" | "budgeted" | "spent" | "delivered" | "citizen_experience" | undefined;
    } | null | undefined;
    publicationStatus?: "archived" | "draft" | "published" | "awaiting_review" | "verified" | undefined;
    planId?: string | undefined;
    confidence?: "verified_official" | "awaiting_verification" | "partial" | "not_published" | undefined;
    projectId?: string | undefined;
    officialDescription?: string | null | undefined;
    departmentLabel?: string | null | undefined;
    locationLabel?: string | null | undefined;
    startDate?: string | null | undefined;
    expectedEndDate?: string | null | undefined;
    priorityIds?: string[] | undefined;
    relatedUpdateIds?: string[] | undefined;
    relatedCaseIds?: string[] | undefined;
    officialSourceUrl?: string | null | undefined;
}, {
    status: "planned" | "in_progress" | "unknown" | "completed" | "procurement" | "tender_awarded" | "delayed" | "cancelled";
    title: string;
    plainLanguageSummary: string;
    sources: {
        title: string;
        documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
        sourceId?: string | undefined;
        publisher?: string | undefined;
        publishedAt?: string | null | undefined;
        url?: string | null | undefined;
        pageOrSection?: string | undefined;
        isServeSaSummary?: boolean | undefined;
        excerpt?: string | undefined;
    }[];
    scope: "municipality_wide" | "regional" | "ward_specific";
    municipalityCode?: string | undefined;
    progressPercent?: number | null | undefined;
    wardIds?: string[] | undefined;
    budgeted?: {
        amountZar: number;
        source: {
            title: string;
            documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
            sourceId?: string | undefined;
            publisher?: string | undefined;
            publishedAt?: string | null | undefined;
            url?: string | null | undefined;
            pageOrSection?: string | undefined;
            isServeSaSummary?: boolean | undefined;
            excerpt?: string | undefined;
        };
        currency?: "ZAR" | undefined;
        asOf?: string | null | undefined;
        layer?: "promised" | "budgeted" | "spent" | "delivered" | "citizen_experience" | undefined;
    } | null | undefined;
    spent?: {
        amountZar: number;
        source: {
            title: string;
            documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
            sourceId?: string | undefined;
            publisher?: string | undefined;
            publishedAt?: string | null | undefined;
            url?: string | null | undefined;
            pageOrSection?: string | undefined;
            isServeSaSummary?: boolean | undefined;
            excerpt?: string | undefined;
        };
        currency?: "ZAR" | undefined;
        asOf?: string | null | undefined;
        layer?: "promised" | "budgeted" | "spent" | "delivered" | "citizen_experience" | undefined;
    } | null | undefined;
    isServeSaSummary?: boolean | undefined;
    publicationStatus?: "archived" | "draft" | "published" | "awaiting_review" | "verified" | undefined;
    planId?: string | undefined;
    confidence?: "verified_official" | "awaiting_verification" | "partial" | "not_published" | undefined;
    projectId?: string | undefined;
    officialDescription?: string | null | undefined;
    wardMappingAvailable?: boolean | undefined;
    departmentLabel?: string | null | undefined;
    locationLabel?: string | null | undefined;
    startDate?: string | null | undefined;
    expectedEndDate?: string | null | undefined;
    priorityIds?: string[] | undefined;
    relatedUpdateIds?: string[] | undefined;
    relatedCaseIds?: string[] | undefined;
    officialSourceUrl?: string | null | undefined;
}>;
export type UpsertMunicipalProjectInput = z.infer<typeof UpsertMunicipalProjectInputSchema>;
export declare const UpsertBudgetLineInputSchema: z.ZodObject<{
    budgetLineId: z.ZodOptional<z.ZodString>;
    municipalityCode: z.ZodOptional<z.ZodString>;
    planId: z.ZodOptional<z.ZodString>;
    fiscalYear: z.ZodString;
    categoryLabel: z.ZodString;
    plainLanguageLabel: z.ZodString;
    amount: z.ZodObject<{
        amountZar: z.ZodNumber;
        currency: z.ZodDefault<z.ZodOptional<z.ZodLiteral<"ZAR">>>;
        asOf: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        layer: z.ZodOptional<z.ZodEnum<["promised", "budgeted", "spent", "delivered", "citizen_experience"]>>;
        source: z.ZodObject<{
            sourceId: z.ZodOptional<z.ZodString>;
            documentKind: z.ZodEnum<["idp", "budget", "adjusted_budget", "sdbip", "annual_report", "afs", "s71", "s52", "performance_report", "other_official"]>;
            title: z.ZodString;
            publisher: z.ZodOptional<z.ZodString>;
            publishedAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            url: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            pageOrSection: z.ZodOptional<z.ZodString>;
            /** When true, accompanying text is a ServeSA plain-language summary */
            isServeSaSummary: z.ZodOptional<z.ZodBoolean>;
            excerpt: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            title: string;
            documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
            sourceId?: string | undefined;
            publisher?: string | undefined;
            publishedAt?: string | null | undefined;
            url?: string | null | undefined;
            pageOrSection?: string | undefined;
            isServeSaSummary?: boolean | undefined;
            excerpt?: string | undefined;
        }, {
            title: string;
            documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
            sourceId?: string | undefined;
            publisher?: string | undefined;
            publishedAt?: string | null | undefined;
            url?: string | null | undefined;
            pageOrSection?: string | undefined;
            isServeSaSummary?: boolean | undefined;
            excerpt?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        amountZar: number;
        currency: "ZAR";
        source: {
            title: string;
            documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
            sourceId?: string | undefined;
            publisher?: string | undefined;
            publishedAt?: string | null | undefined;
            url?: string | null | undefined;
            pageOrSection?: string | undefined;
            isServeSaSummary?: boolean | undefined;
            excerpt?: string | undefined;
        };
        asOf?: string | null | undefined;
        layer?: "promised" | "budgeted" | "spent" | "delivered" | "citizen_experience" | undefined;
    }, {
        amountZar: number;
        source: {
            title: string;
            documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
            sourceId?: string | undefined;
            publisher?: string | undefined;
            publishedAt?: string | null | undefined;
            url?: string | null | undefined;
            pageOrSection?: string | undefined;
            isServeSaSummary?: boolean | undefined;
            excerpt?: string | undefined;
        };
        currency?: "ZAR" | undefined;
        asOf?: string | null | undefined;
        layer?: "promised" | "budgeted" | "spent" | "delivered" | "citizen_experience" | undefined;
    }>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
    confidence: z.ZodOptional<z.ZodEnum<["verified_official", "awaiting_verification", "partial", "not_published"]>>;
    publicationStatus: z.ZodOptional<z.ZodEnum<["draft", "awaiting_review", "verified", "published", "archived"]>>;
}, "strip", z.ZodTypeAny, {
    fiscalYear: string;
    categoryLabel: string;
    plainLanguageLabel: string;
    amount: {
        amountZar: number;
        currency: "ZAR";
        source: {
            title: string;
            documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
            sourceId?: string | undefined;
            publisher?: string | undefined;
            publishedAt?: string | null | undefined;
            url?: string | null | undefined;
            pageOrSection?: string | undefined;
            isServeSaSummary?: boolean | undefined;
            excerpt?: string | undefined;
        };
        asOf?: string | null | undefined;
        layer?: "promised" | "budgeted" | "spent" | "delivered" | "citizen_experience" | undefined;
    };
    municipalityCode?: string | undefined;
    publicationStatus?: "archived" | "draft" | "published" | "awaiting_review" | "verified" | undefined;
    planId?: string | undefined;
    sortOrder?: number | undefined;
    confidence?: "verified_official" | "awaiting_verification" | "partial" | "not_published" | undefined;
    budgetLineId?: string | undefined;
}, {
    fiscalYear: string;
    categoryLabel: string;
    plainLanguageLabel: string;
    amount: {
        amountZar: number;
        source: {
            title: string;
            documentKind: "idp" | "budget" | "adjusted_budget" | "sdbip" | "annual_report" | "afs" | "s71" | "s52" | "performance_report" | "other_official";
            sourceId?: string | undefined;
            publisher?: string | undefined;
            publishedAt?: string | null | undefined;
            url?: string | null | undefined;
            pageOrSection?: string | undefined;
            isServeSaSummary?: boolean | undefined;
            excerpt?: string | undefined;
        };
        currency?: "ZAR" | undefined;
        asOf?: string | null | undefined;
        layer?: "promised" | "budgeted" | "spent" | "delivered" | "citizen_experience" | undefined;
    };
    municipalityCode?: string | undefined;
    publicationStatus?: "archived" | "draft" | "published" | "awaiting_review" | "verified" | undefined;
    planId?: string | undefined;
    sortOrder?: number | undefined;
    confidence?: "verified_official" | "awaiting_verification" | "partial" | "not_published" | undefined;
    budgetLineId?: string | undefined;
}>;
export type UpsertBudgetLineInput = z.infer<typeof UpsertBudgetLineInputSchema>;
export declare const TransitionPlanningStatusInputSchema: z.ZodObject<{
    entityType: z.ZodEnum<["document", "priority", "project", "budget_line", "plan"]>;
    entityId: z.ZodString;
    toStatus: z.ZodEnum<["draft", "awaiting_review", "verified", "published", "archived"]>;
    reviewNote: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    entityType: "priority" | "project" | "document" | "budget_line" | "plan";
    entityId: string;
    toStatus: "archived" | "draft" | "published" | "awaiting_review" | "verified";
    reviewNote?: string | undefined;
}, {
    entityType: "priority" | "project" | "document" | "budget_line" | "plan";
    entityId: string;
    toStatus: "archived" | "draft" | "published" | "awaiting_review" | "verified";
    reviewNote?: string | undefined;
}>;
export type TransitionPlanningStatusInput = z.infer<typeof TransitionPlanningStatusInputSchema>;
export declare const GetMunicipalPlanningSummaryInputSchema: z.ZodObject<{
    municipalityCode: z.ZodString;
    /** Optional ward for YOUR COMMUNITY section — never invent if absent */
    wardId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    fiscalYear: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    municipalityCode: string;
    wardId?: string | null | undefined;
    fiscalYear?: string | undefined;
}, {
    municipalityCode: string;
    wardId?: string | null | undefined;
    fiscalYear?: string | undefined;
}>;
export type GetMunicipalPlanningSummaryInput = z.infer<typeof GetMunicipalPlanningSummaryInputSchema>;
export declare const GetMunicipalProjectInputSchema: z.ZodObject<{
    projectId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    projectId: string;
}, {
    projectId: string;
}>;
export type GetMunicipalProjectInput = z.infer<typeof GetMunicipalProjectInputSchema>;
export declare const ListPlanningEntitiesInputSchema: z.ZodObject<{
    municipalityCode: z.ZodString;
    entityType: z.ZodEnum<["document", "priority", "project", "budget_line", "plan"]>;
    /** Ops may list all statuses; citizen callables force published */
    publicationStatus: z.ZodOptional<z.ZodEnum<["draft", "awaiting_review", "verified", "published", "archived"]>>;
    citizenView: z.ZodOptional<z.ZodBoolean>;
    wardId: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    municipalityCode: string;
    entityType: "priority" | "project" | "document" | "budget_line" | "plan";
    wardId?: string | undefined;
    limit?: number | undefined;
    citizenView?: boolean | undefined;
    publicationStatus?: "archived" | "draft" | "published" | "awaiting_review" | "verified" | undefined;
}, {
    municipalityCode: string;
    entityType: "priority" | "project" | "document" | "budget_line" | "plan";
    wardId?: string | undefined;
    limit?: number | undefined;
    citizenView?: boolean | undefined;
    publicationStatus?: "archived" | "draft" | "published" | "awaiting_review" | "verified" | undefined;
}>;
export type ListPlanningEntitiesInput = z.infer<typeof ListPlanningEntitiesInputSchema>;
/** Citizen-facing empty-state copy — never invent numbers */
export declare const PLANNING_EMPTY_COPY: {
    readonly notPublished: "Not published yet";
    readonly awaitingVerification: "Data awaiting verification";
    readonly noWardMapping: "Ward-level project mapping is not available for this municipality yet.";
    readonly resolutionUnavailable: "We could not confirm your municipality yet. Showing published planning for the pilot area when available.";
};
