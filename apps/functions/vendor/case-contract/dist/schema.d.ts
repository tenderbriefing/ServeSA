/**
 * ServeSA canonical case-creation contract
 * Shared by apps/web and apps/functions.
 */
import { z } from 'zod';
export declare const CASE_CONTRACT_VERSION = "1.0.0";
export declare const CONSENT_POLICY_VERSION = "2025-08-01";
export declare const CanonicalCategorySchema: z.ZodEnum<["water", "electricity", "roads", "waste", "internet", "emergency"]>;
export declare const PrioritySchema: z.ZodEnum<["emergency", "high", "medium", "low"]>;
export declare const LocationSourceSchema: z.ZodEnum<["device_gps", "map_pin", "address_search"]>;
export declare const GeoresolutionStatusSchema: z.ZodEnum<["polygon_match", "ambiguous", "nearest_ward", "municipality_only", "unresolved"]>;
export declare const CreateCaseInputSchema: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodObject<{
    title: z.ZodPipeline<z.ZodEffects<z.ZodString, string, string>, z.ZodString>;
    description: z.ZodPipeline<z.ZodEffects<z.ZodString, string, string>, z.ZodString>;
    category: z.ZodString;
    subcategory: z.ZodOptional<z.ZodString>;
    priority: z.ZodEnum<["emergency", "high", "medium", "low"]>;
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    locationSource: z.ZodEnum<["device_gps", "map_pin", "address_search"]>;
    address: z.ZodOptional<z.ZodString>;
    reporter: z.ZodObject<{
        name: z.ZodPipeline<z.ZodEffects<z.ZodString, string, string>, z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        email?: string | undefined;
        phone?: string | undefined;
    }, {
        name: string;
        email?: string | undefined;
        phone?: string | undefined;
    }>;
    consent: z.ZodObject<{
        dataProcessing: z.ZodLiteral<true>;
        communications: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        dataProcessing: true;
        communications?: boolean | undefined;
    }, {
        dataProcessing: true;
        communications?: boolean | undefined;
    }>;
    clientRequestId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    category: string;
    title: string;
    description: string;
    clientRequestId: string;
    priority: "emergency" | "high" | "medium" | "low";
    latitude: number;
    longitude: number;
    locationSource: "device_gps" | "map_pin" | "address_search";
    reporter: {
        name: string;
        email?: string | undefined;
        phone?: string | undefined;
    };
    consent: {
        dataProcessing: true;
        communications?: boolean | undefined;
    };
    subcategory?: string | undefined;
    address?: string | undefined;
}, {
    category: string;
    title: string;
    description: string;
    clientRequestId: string;
    priority: "emergency" | "high" | "medium" | "low";
    latitude: number;
    longitude: number;
    locationSource: "device_gps" | "map_pin" | "address_search";
    reporter: {
        name: string;
        email?: string | undefined;
        phone?: string | undefined;
    };
    consent: {
        dataProcessing: true;
        communications?: boolean | undefined;
    };
    subcategory?: string | undefined;
    address?: string | undefined;
}>, {
    category: string;
    title: string;
    description: string;
    clientRequestId: string;
    priority: "emergency" | "high" | "medium" | "low";
    latitude: number;
    longitude: number;
    locationSource: "device_gps" | "map_pin" | "address_search";
    reporter: {
        name: string;
        email?: string | undefined;
        phone?: string | undefined;
    };
    consent: {
        dataProcessing: true;
        communications?: boolean | undefined;
    };
    subcategory?: string | undefined;
    address?: string | undefined;
}, {
    category: string;
    title: string;
    description: string;
    clientRequestId: string;
    priority: "emergency" | "high" | "medium" | "low";
    latitude: number;
    longitude: number;
    locationSource: "device_gps" | "map_pin" | "address_search";
    reporter: {
        name: string;
        email?: string | undefined;
        phone?: string | undefined;
    };
    consent: {
        dataProcessing: true;
        communications?: boolean | undefined;
    };
    subcategory?: string | undefined;
    address?: string | undefined;
}>, {
    category: "water" | "electricity" | "roads" | "waste" | "internet" | "emergency";
    subcategory: string | undefined;
    address: string | undefined;
    reporter: {
        name: string;
        email: string | undefined;
        phone: string | undefined;
    };
    title: string;
    description: string;
    clientRequestId: string;
    priority: "emergency" | "high" | "medium" | "low";
    latitude: number;
    longitude: number;
    locationSource: "device_gps" | "map_pin" | "address_search";
    consent: {
        dataProcessing: true;
        communications?: boolean | undefined;
    };
}, {
    category: string;
    title: string;
    description: string;
    clientRequestId: string;
    priority: "emergency" | "high" | "medium" | "low";
    latitude: number;
    longitude: number;
    locationSource: "device_gps" | "map_pin" | "address_search";
    reporter: {
        name: string;
        email?: string | undefined;
        phone?: string | undefined;
    };
    consent: {
        dataProcessing: true;
        communications?: boolean | undefined;
    };
    subcategory?: string | undefined;
    address?: string | undefined;
}>, {
    category: "water" | "electricity" | "roads" | "waste" | "internet" | "emergency";
    subcategory: string | undefined;
    address: string | undefined;
    reporter: {
        name: string;
        email: string | undefined;
        phone: string | undefined;
    };
    title: string;
    description: string;
    clientRequestId: string;
    priority: "emergency" | "high" | "medium" | "low";
    latitude: number;
    longitude: number;
    locationSource: "device_gps" | "map_pin" | "address_search";
    consent: {
        dataProcessing: true;
        communications?: boolean | undefined;
    };
}, unknown>;
export type CreateCaseInput = z.infer<typeof CreateCaseInputSchema>;
export type CanonicalCategory = z.infer<typeof CanonicalCategorySchema>;
export type Priority = z.infer<typeof PrioritySchema>;
export type LocationSource = z.infer<typeof LocationSourceSchema>;
export type GeoresolutionStatus = z.infer<typeof GeoresolutionStatusSchema>;
export declare const CreateCaseResponseSchema: z.ZodObject<{
    caseId: z.ZodString;
    reference: z.ZodString;
    shareUrl: z.ZodString;
    status: z.ZodLiteral<"submitted">;
    municipality: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
    }, {
        name: string;
        id: string;
    }>>;
    ward: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        number: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        number?: string | undefined;
        name?: string | undefined;
    }, {
        id: string;
        number?: string | undefined;
        name?: string | undefined;
    }>>;
    slaTarget: z.ZodString;
    targetHours: z.ZodNumber;
    georesolutionStatus: z.ZodEnum<["polygon_match", "ambiguous", "nearest_ward", "municipality_only", "unresolved"]>;
    mediaUploadPath: z.ZodOptional<z.ZodString>;
    routingPending: z.ZodOptional<z.ZodBoolean>;
    duplicateAssessment: z.ZodOptional<z.ZodObject<{
        status: z.ZodEnum<["pending", "completed", "skipped"]>;
        candidateCaseIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        status: "pending" | "completed" | "skipped";
        candidateCaseIds?: string[] | undefined;
    }, {
        status: "pending" | "completed" | "skipped";
        candidateCaseIds?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    status: "submitted";
    caseId: string;
    reference: string;
    shareUrl: string;
    slaTarget: string;
    targetHours: number;
    georesolutionStatus: "polygon_match" | "ambiguous" | "nearest_ward" | "municipality_only" | "unresolved";
    municipality?: {
        name: string;
        id: string;
    } | undefined;
    ward?: {
        id: string;
        number?: string | undefined;
        name?: string | undefined;
    } | undefined;
    mediaUploadPath?: string | undefined;
    routingPending?: boolean | undefined;
    duplicateAssessment?: {
        status: "pending" | "completed" | "skipped";
        candidateCaseIds?: string[] | undefined;
    } | undefined;
}, {
    status: "submitted";
    caseId: string;
    reference: string;
    shareUrl: string;
    slaTarget: string;
    targetHours: number;
    georesolutionStatus: "polygon_match" | "ambiguous" | "nearest_ward" | "municipality_only" | "unresolved";
    municipality?: {
        name: string;
        id: string;
    } | undefined;
    ward?: {
        id: string;
        number?: string | undefined;
        name?: string | undefined;
    } | undefined;
    mediaUploadPath?: string | undefined;
    routingPending?: boolean | undefined;
    duplicateAssessment?: {
        status: "pending" | "completed" | "skipped";
        candidateCaseIds?: string[] | undefined;
    } | undefined;
}>;
export type CreateCaseResponse = z.infer<typeof CreateCaseResponseSchema>;
export declare function parseCreateCaseInput(input: unknown): CreateCaseInput;
export declare function safeParseCreateCaseInput(input: unknown): z.SafeParseReturnType<unknown, {
    category: "water" | "electricity" | "roads" | "waste" | "internet" | "emergency";
    subcategory: string | undefined;
    address: string | undefined;
    reporter: {
        name: string;
        email: string | undefined;
        phone: string | undefined;
    };
    title: string;
    description: string;
    clientRequestId: string;
    priority: "emergency" | "high" | "medium" | "low";
    latitude: number;
    longitude: number;
    locationSource: "device_gps" | "map_pin" | "address_search";
    consent: {
        dataProcessing: true;
        communications?: boolean | undefined;
    };
}>;
export { CANONICAL_CATEGORIES } from './categories';
