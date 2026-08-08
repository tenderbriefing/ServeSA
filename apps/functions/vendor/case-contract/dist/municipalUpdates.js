"use strict";
/**
 * Municipal Updates — shared typed contract.
 * Civic communications only; not a social feed.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListMunicipalUpdatesInputSchema = exports.UpsertMunicipalUpdateInputSchema = exports.UpdateTargetingSchema = exports.ProjectTrackingSchema = exports.ProjectStageSchema = exports.UPDATE_STATUS_TRANSITIONS = exports.MunicipalUpdateStatusSchema = exports.MUNICIPAL_UPDATE_TYPE_LABEL = exports.MunicipalUpdateTypeSchema = exports.MUNICIPAL_UPDATE_CONTRACT_VERSION = void 0;
exports.canTransitionUpdate = canTransitionUpdate;
exports.assertUpdateTransition = assertUpdateTransition;
const zod_1 = require("zod");
exports.MUNICIPAL_UPDATE_CONTRACT_VERSION = '1.0.0';
exports.MunicipalUpdateTypeSchema = zod_1.z.enum([
    'service_alert',
    'planned_maintenance',
    'emergency',
    'project_update',
    'development_update',
    'public_meeting',
    'community_notice',
    'road_closure',
    'water_interruption',
    'electricity_interruption',
    'waste_collection_update',
    'general_municipal_update',
]);
exports.MUNICIPAL_UPDATE_TYPE_LABEL = {
    service_alert: 'Service Alert',
    planned_maintenance: 'Planned Maintenance',
    emergency: 'Emergency',
    project_update: 'Project Update',
    development_update: 'Development Update',
    public_meeting: 'Public Meeting',
    community_notice: 'Community Notice',
    road_closure: 'Road Closure',
    water_interruption: 'Water Interruption',
    electricity_interruption: 'Electricity Interruption',
    waste_collection_update: 'Waste Collection Update',
    general_municipal_update: 'General Municipal Update',
};
exports.MunicipalUpdateStatusSchema = zod_1.z.enum([
    'draft',
    'scheduled',
    'published',
    'updated',
    'resolved',
    'archived',
]);
/** Lifecycle transitions for municipal updates */
exports.UPDATE_STATUS_TRANSITIONS = {
    draft: ['scheduled', 'published', 'archived'],
    scheduled: ['published', 'draft', 'archived'],
    published: ['updated', 'resolved', 'archived'],
    updated: ['updated', 'resolved', 'archived'],
    resolved: ['archived', 'updated'],
    archived: [],
};
function canTransitionUpdate(from, to) {
    const allowed = exports.UPDATE_STATUS_TRANSITIONS[from];
    if (!allowed)
        return false;
    return allowed.includes(to);
}
function assertUpdateTransition(from, to) {
    if (!canTransitionUpdate(from, to)) {
        throw new Error(`Invalid update status transition from ${from} to ${to}`);
    }
}
exports.ProjectStageSchema = zod_1.z.enum([
    'announced',
    'planning',
    'procurement',
    'construction',
    'commissioning',
    'completed',
    'on_hold',
]);
exports.ProjectTrackingSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    stage: exports.ProjectStageSchema,
    progressPercent: zod_1.z.number().int().min(0).max(100),
    summary: zod_1.z.string().max(1000).optional(),
});
exports.UpdateTargetingSchema = zod_1.z.object({
    /** Always set server-side from claims for privileged writes */
    municipalityCode: zod_1.z.string().min(1).max(32),
    wardIds: zod_1.z.array(zod_1.z.string().min(1).max(64)).max(50).optional(),
    suburbIds: zod_1.z.array(zod_1.z.string().min(1).max(64)).max(50).optional(),
    serviceCategories: zod_1.z.array(zod_1.z.string().min(1).max(64)).max(20).optional(),
    /** Optional GeoJSON-like affected area; never stores citizen GPS */
    affectedAreaLabel: zod_1.z.string().max(200).optional(),
    affectedAreaGeoJson: zod_1.z.record(zod_1.z.unknown()).optional(),
});
exports.UpsertMunicipalUpdateInputSchema = zod_1.z.object({
    updateId: zod_1.z.string().min(1).max(64).optional(),
    type: exports.MunicipalUpdateTypeSchema,
    title: zod_1.z.string().min(3).max(160),
    body: zod_1.z.string().min(10).max(8000),
    summary: zod_1.z.string().max(280).optional(),
    targeting: exports.UpdateTargetingSchema.omit({ municipalityCode: true }).extend({
        /** Client may suggest; server overwrites from claims */
        municipalityCode: zod_1.z.string().min(1).max(32).optional(),
    }),
    status: exports.MunicipalUpdateStatusSchema.optional(),
    scheduledAt: zod_1.z.string().datetime().optional().nullable(),
    expectedRestorationAt: zod_1.z.string().datetime().optional().nullable(),
    project: exports.ProjectTrackingSchema.optional().nullable(),
    mediaPaths: zod_1.z.array(zod_1.z.string().max(512)).max(6).optional(),
    publishedByDisplayName: zod_1.z.string().max(120).optional(),
});
exports.ListMunicipalUpdatesInputSchema = zod_1.z.object({
    municipalityCode: zod_1.z.string().min(1).max(32),
    status: exports.MunicipalUpdateStatusSchema.optional(),
    type: exports.MunicipalUpdateTypeSchema.optional(),
    wardId: zod_1.z.string().max(64).optional(),
    serviceCategory: zod_1.z.string().max(64).optional(),
    /** Citizen list defaults to published+updated+resolved */
    citizenView: zod_1.z.boolean().optional(),
    limit: zod_1.z.number().int().min(1).max(100).optional(),
    cursor: zod_1.z.string().max(128).optional(),
});
