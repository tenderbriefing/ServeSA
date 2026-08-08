/**
 * Municipal Updates — shared typed contract.
 * Civic communications only; not a social feed.
 */
import { z } from 'zod';
export declare const MUNICIPAL_UPDATE_CONTRACT_VERSION = "1.0.0";
export declare const MunicipalUpdateTypeSchema: z.ZodEnum<["service_alert", "planned_maintenance", "emergency", "project_update", "development_update", "public_meeting", "community_notice", "road_closure", "water_interruption", "electricity_interruption", "waste_collection_update", "general_municipal_update"]>;
export type MunicipalUpdateType = z.infer<typeof MunicipalUpdateTypeSchema>;
export declare const MUNICIPAL_UPDATE_TYPE_LABEL: Record<MunicipalUpdateType, string>;
export declare const MunicipalUpdateStatusSchema: z.ZodEnum<["draft", "scheduled", "published", "updated", "resolved", "archived"]>;
export type MunicipalUpdateStatus = z.infer<typeof MunicipalUpdateStatusSchema>;
/** Lifecycle transitions for municipal updates */
export declare const UPDATE_STATUS_TRANSITIONS: Record<MunicipalUpdateStatus, MunicipalUpdateStatus[]>;
export declare function canTransitionUpdate(from: string, to: string): boolean;
export declare function assertUpdateTransition(from: string, to: string): void;
export declare const ProjectStageSchema: z.ZodEnum<["announced", "planning", "procurement", "construction", "commissioning", "completed", "on_hold"]>;
export type ProjectStage = z.infer<typeof ProjectStageSchema>;
export declare const ProjectTrackingSchema: z.ZodObject<{
    name: z.ZodString;
    stage: z.ZodEnum<["announced", "planning", "procurement", "construction", "commissioning", "completed", "on_hold"]>;
    progressPercent: z.ZodNumber;
    summary: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    stage: "completed" | "announced" | "planning" | "procurement" | "construction" | "commissioning" | "on_hold";
    progressPercent: number;
    summary?: string | undefined;
}, {
    name: string;
    stage: "completed" | "announced" | "planning" | "procurement" | "construction" | "commissioning" | "on_hold";
    progressPercent: number;
    summary?: string | undefined;
}>;
export type ProjectTracking = z.infer<typeof ProjectTrackingSchema>;
export declare const UpdateTargetingSchema: z.ZodObject<{
    /** Always set server-side from claims for privileged writes */
    municipalityCode: z.ZodString;
    wardIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    suburbIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    serviceCategories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    /** Optional GeoJSON-like affected area; never stores citizen GPS */
    affectedAreaLabel: z.ZodOptional<z.ZodString>;
    affectedAreaGeoJson: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    municipalityCode: string;
    wardIds?: string[] | undefined;
    suburbIds?: string[] | undefined;
    serviceCategories?: string[] | undefined;
    affectedAreaLabel?: string | undefined;
    affectedAreaGeoJson?: Record<string, unknown> | undefined;
}, {
    municipalityCode: string;
    wardIds?: string[] | undefined;
    suburbIds?: string[] | undefined;
    serviceCategories?: string[] | undefined;
    affectedAreaLabel?: string | undefined;
    affectedAreaGeoJson?: Record<string, unknown> | undefined;
}>;
export type UpdateTargeting = z.infer<typeof UpdateTargetingSchema>;
export declare const UpsertMunicipalUpdateInputSchema: z.ZodObject<{
    updateId: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["service_alert", "planned_maintenance", "emergency", "project_update", "development_update", "public_meeting", "community_notice", "road_closure", "water_interruption", "electricity_interruption", "waste_collection_update", "general_municipal_update"]>;
    title: z.ZodString;
    body: z.ZodString;
    summary: z.ZodOptional<z.ZodString>;
    targeting: z.ZodObject<Omit<{
        /** Always set server-side from claims for privileged writes */
        municipalityCode: z.ZodString;
        wardIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        suburbIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        serviceCategories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        /** Optional GeoJSON-like affected area; never stores citizen GPS */
        affectedAreaLabel: z.ZodOptional<z.ZodString>;
        affectedAreaGeoJson: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "municipalityCode"> & {
        /** Client may suggest; server overwrites from claims */
        municipalityCode: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        municipalityCode?: string | undefined;
        wardIds?: string[] | undefined;
        suburbIds?: string[] | undefined;
        serviceCategories?: string[] | undefined;
        affectedAreaLabel?: string | undefined;
        affectedAreaGeoJson?: Record<string, unknown> | undefined;
    }, {
        municipalityCode?: string | undefined;
        wardIds?: string[] | undefined;
        suburbIds?: string[] | undefined;
        serviceCategories?: string[] | undefined;
        affectedAreaLabel?: string | undefined;
        affectedAreaGeoJson?: Record<string, unknown> | undefined;
    }>;
    status: z.ZodOptional<z.ZodEnum<["draft", "scheduled", "published", "updated", "resolved", "archived"]>>;
    scheduledAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    expectedRestorationAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    project: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        stage: z.ZodEnum<["announced", "planning", "procurement", "construction", "commissioning", "completed", "on_hold"]>;
        progressPercent: z.ZodNumber;
        summary: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        stage: "completed" | "announced" | "planning" | "procurement" | "construction" | "commissioning" | "on_hold";
        progressPercent: number;
        summary?: string | undefined;
    }, {
        name: string;
        stage: "completed" | "announced" | "planning" | "procurement" | "construction" | "commissioning" | "on_hold";
        progressPercent: number;
        summary?: string | undefined;
    }>>>;
    mediaPaths: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    publishedByDisplayName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "emergency" | "service_alert" | "planned_maintenance" | "project_update" | "development_update" | "public_meeting" | "community_notice" | "road_closure" | "water_interruption" | "electricity_interruption" | "waste_collection_update" | "general_municipal_update";
    title: string;
    body: string;
    targeting: {
        municipalityCode?: string | undefined;
        wardIds?: string[] | undefined;
        suburbIds?: string[] | undefined;
        serviceCategories?: string[] | undefined;
        affectedAreaLabel?: string | undefined;
        affectedAreaGeoJson?: Record<string, unknown> | undefined;
    };
    status?: "archived" | "resolved" | "draft" | "scheduled" | "published" | "updated" | undefined;
    mediaPaths?: string[] | undefined;
    summary?: string | undefined;
    updateId?: string | undefined;
    scheduledAt?: string | null | undefined;
    expectedRestorationAt?: string | null | undefined;
    project?: {
        name: string;
        stage: "completed" | "announced" | "planning" | "procurement" | "construction" | "commissioning" | "on_hold";
        progressPercent: number;
        summary?: string | undefined;
    } | null | undefined;
    publishedByDisplayName?: string | undefined;
}, {
    type: "emergency" | "service_alert" | "planned_maintenance" | "project_update" | "development_update" | "public_meeting" | "community_notice" | "road_closure" | "water_interruption" | "electricity_interruption" | "waste_collection_update" | "general_municipal_update";
    title: string;
    body: string;
    targeting: {
        municipalityCode?: string | undefined;
        wardIds?: string[] | undefined;
        suburbIds?: string[] | undefined;
        serviceCategories?: string[] | undefined;
        affectedAreaLabel?: string | undefined;
        affectedAreaGeoJson?: Record<string, unknown> | undefined;
    };
    status?: "archived" | "resolved" | "draft" | "scheduled" | "published" | "updated" | undefined;
    mediaPaths?: string[] | undefined;
    summary?: string | undefined;
    updateId?: string | undefined;
    scheduledAt?: string | null | undefined;
    expectedRestorationAt?: string | null | undefined;
    project?: {
        name: string;
        stage: "completed" | "announced" | "planning" | "procurement" | "construction" | "commissioning" | "on_hold";
        progressPercent: number;
        summary?: string | undefined;
    } | null | undefined;
    publishedByDisplayName?: string | undefined;
}>;
export type UpsertMunicipalUpdateInput = z.infer<typeof UpsertMunicipalUpdateInputSchema>;
export declare const ListMunicipalUpdatesInputSchema: z.ZodObject<{
    municipalityCode: z.ZodString;
    status: z.ZodOptional<z.ZodEnum<["draft", "scheduled", "published", "updated", "resolved", "archived"]>>;
    type: z.ZodOptional<z.ZodEnum<["service_alert", "planned_maintenance", "emergency", "project_update", "development_update", "public_meeting", "community_notice", "road_closure", "water_interruption", "electricity_interruption", "waste_collection_update", "general_municipal_update"]>>;
    wardId: z.ZodOptional<z.ZodString>;
    serviceCategory: z.ZodOptional<z.ZodString>;
    /** Citizen list defaults to published+updated+resolved */
    citizenView: z.ZodOptional<z.ZodBoolean>;
    limit: z.ZodOptional<z.ZodNumber>;
    cursor: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    municipalityCode: string;
    type?: "emergency" | "service_alert" | "planned_maintenance" | "project_update" | "development_update" | "public_meeting" | "community_notice" | "road_closure" | "water_interruption" | "electricity_interruption" | "waste_collection_update" | "general_municipal_update" | undefined;
    status?: "archived" | "resolved" | "draft" | "scheduled" | "published" | "updated" | undefined;
    wardId?: string | undefined;
    limit?: number | undefined;
    cursor?: string | undefined;
    serviceCategory?: string | undefined;
    citizenView?: boolean | undefined;
}, {
    municipalityCode: string;
    type?: "emergency" | "service_alert" | "planned_maintenance" | "project_update" | "development_update" | "public_meeting" | "community_notice" | "road_closure" | "water_interruption" | "electricity_interruption" | "waste_collection_update" | "general_municipal_update" | undefined;
    status?: "archived" | "resolved" | "draft" | "scheduled" | "published" | "updated" | undefined;
    wardId?: string | undefined;
    limit?: number | undefined;
    cursor?: string | undefined;
    serviceCategory?: string | undefined;
    citizenView?: boolean | undefined;
}>;
export type ListMunicipalUpdatesInput = z.infer<typeof ListMunicipalUpdatesInputSchema>;
