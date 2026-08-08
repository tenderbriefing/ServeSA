/**
 * Community Ideas — shared typed contract.
 * Constructive civic suggestions; not a social network.
 */
import { z } from 'zod';
export declare const COMMUNITY_IDEA_CONTRACT_VERSION = "1.0.0";
export declare const CommunityIdeaCategorySchema: z.ZodEnum<["parks_and_recreation", "roads_and_mobility", "water_and_sanitation", "waste_and_recycling", "safety_and_lighting", "housing_and_development", "economic_development", "youth_and_education", "health_and_wellbeing", "environment_and_climate", "digital_and_connectivity", "other"]>;
export type CommunityIdeaCategory = z.infer<typeof CommunityIdeaCategorySchema>;
export declare const COMMUNITY_IDEA_CATEGORY_LABEL: Record<CommunityIdeaCategory, string>;
export declare const CommunityIdeaStatusSchema: z.ZodEnum<["submitted", "under_review", "community_support", "feasibility_review", "planned", "in_progress", "implemented", "declined", "withdrawn", "archived"]>;
export type CommunityIdeaStatus = z.infer<typeof CommunityIdeaStatusSchema>;
export declare const IDEA_STATUS_TRANSITIONS: Record<CommunityIdeaStatus, CommunityIdeaStatus[]>;
export declare function canTransitionIdea(from: string, to: string): boolean;
export declare function assertIdeaTransition(from: string, to: string): void;
export declare const CITIZEN_IDEA_STATUS_LABEL: Record<CommunityIdeaStatus, string>;
export declare const SubmitCommunityIdeaInputSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    category: z.ZodEnum<["parks_and_recreation", "roads_and_mobility", "water_and_sanitation", "waste_and_recycling", "safety_and_lighting", "housing_and_development", "economic_development", "youth_and_education", "health_and_wellbeing", "environment_and_climate", "digital_and_connectivity", "other"]>;
    municipalityCode: z.ZodString;
    wardId: z.ZodOptional<z.ZodString>;
    suburbLabel: z.ZodOptional<z.ZodString>;
    mediaPaths: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    clientRequestId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    category: "parks_and_recreation" | "roads_and_mobility" | "water_and_sanitation" | "waste_and_recycling" | "safety_and_lighting" | "housing_and_development" | "economic_development" | "youth_and_education" | "health_and_wellbeing" | "environment_and_climate" | "digital_and_connectivity" | "other";
    title: string;
    description: string;
    municipalityCode: string;
    wardId?: string | undefined;
    suburbLabel?: string | undefined;
    mediaPaths?: string[] | undefined;
    clientRequestId?: string | undefined;
}, {
    category: "parks_and_recreation" | "roads_and_mobility" | "water_and_sanitation" | "waste_and_recycling" | "safety_and_lighting" | "housing_and_development" | "economic_development" | "youth_and_education" | "health_and_wellbeing" | "environment_and_climate" | "digital_and_connectivity" | "other";
    title: string;
    description: string;
    municipalityCode: string;
    wardId?: string | undefined;
    suburbLabel?: string | undefined;
    mediaPaths?: string[] | undefined;
    clientRequestId?: string | undefined;
}>;
export type SubmitCommunityIdeaInput = z.infer<typeof SubmitCommunityIdeaInputSchema>;
export declare const OfficialIdeaResponseSchema: z.ZodObject<{
    ideaId: z.ZodString;
    body: z.ZodString;
}, "strip", z.ZodTypeAny, {
    ideaId: string;
    body: string;
}, {
    ideaId: string;
    body: string;
}>;
export type OfficialIdeaResponseInput = z.infer<typeof OfficialIdeaResponseSchema>;
export declare const TransitionIdeaStatusInputSchema: z.ZodObject<{
    ideaId: z.ZodString;
    status: z.ZodEnum<["submitted", "under_review", "community_support", "feasibility_review", "planned", "in_progress", "implemented", "declined", "withdrawn", "archived"]>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "submitted" | "under_review" | "community_support" | "feasibility_review" | "planned" | "in_progress" | "implemented" | "declined" | "withdrawn" | "archived";
    ideaId: string;
    note?: string | undefined;
}, {
    status: "submitted" | "under_review" | "community_support" | "feasibility_review" | "planned" | "in_progress" | "implemented" | "declined" | "withdrawn" | "archived";
    ideaId: string;
    note?: string | undefined;
}>;
export type TransitionIdeaStatusInput = z.infer<typeof TransitionIdeaStatusInputSchema>;
export declare const ListCommunityIdeasInputSchema: z.ZodObject<{
    municipalityCode: z.ZodString;
    status: z.ZodOptional<z.ZodEnum<["submitted", "under_review", "community_support", "feasibility_review", "planned", "in_progress", "implemented", "declined", "withdrawn", "archived"]>>;
    category: z.ZodOptional<z.ZodEnum<["parks_and_recreation", "roads_and_mobility", "water_and_sanitation", "waste_and_recycling", "safety_and_lighting", "housing_and_development", "economic_development", "youth_and_education", "health_and_wellbeing", "environment_and_climate", "digital_and_connectivity", "other"]>>;
    wardId: z.ZodOptional<z.ZodString>;
    /** Ops queues include drafts/internal; citizen view excludes withdrawn internal notes */
    opsView: z.ZodOptional<z.ZodBoolean>;
    limit: z.ZodOptional<z.ZodNumber>;
    cursor: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    municipalityCode: string;
    category?: "parks_and_recreation" | "roads_and_mobility" | "water_and_sanitation" | "waste_and_recycling" | "safety_and_lighting" | "housing_and_development" | "economic_development" | "youth_and_education" | "health_and_wellbeing" | "environment_and_climate" | "digital_and_connectivity" | "other" | undefined;
    status?: "submitted" | "under_review" | "community_support" | "feasibility_review" | "planned" | "in_progress" | "implemented" | "declined" | "withdrawn" | "archived" | undefined;
    wardId?: string | undefined;
    opsView?: boolean | undefined;
    limit?: number | undefined;
    cursor?: string | undefined;
}, {
    municipalityCode: string;
    category?: "parks_and_recreation" | "roads_and_mobility" | "water_and_sanitation" | "waste_and_recycling" | "safety_and_lighting" | "housing_and_development" | "economic_development" | "youth_and_education" | "health_and_wellbeing" | "environment_and_climate" | "digital_and_connectivity" | "other" | undefined;
    status?: "submitted" | "under_review" | "community_support" | "feasibility_review" | "planned" | "in_progress" | "implemented" | "declined" | "withdrawn" | "archived" | undefined;
    wardId?: string | undefined;
    opsView?: boolean | undefined;
    limit?: number | undefined;
    cursor?: string | undefined;
}>;
export type ListCommunityIdeasInput = z.infer<typeof ListCommunityIdeasInputSchema>;
