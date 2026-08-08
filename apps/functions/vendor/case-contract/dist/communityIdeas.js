"use strict";
/**
 * Community Ideas — shared typed contract.
 * Constructive civic suggestions; not a social network.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListCommunityIdeasInputSchema = exports.TransitionIdeaStatusInputSchema = exports.OfficialIdeaResponseSchema = exports.SubmitCommunityIdeaInputSchema = exports.CITIZEN_IDEA_STATUS_LABEL = exports.IDEA_STATUS_TRANSITIONS = exports.CommunityIdeaStatusSchema = exports.COMMUNITY_IDEA_CATEGORY_LABEL = exports.CommunityIdeaCategorySchema = exports.COMMUNITY_IDEA_CONTRACT_VERSION = void 0;
exports.canTransitionIdea = canTransitionIdea;
exports.assertIdeaTransition = assertIdeaTransition;
const zod_1 = require("zod");
exports.COMMUNITY_IDEA_CONTRACT_VERSION = '1.0.0';
exports.CommunityIdeaCategorySchema = zod_1.z.enum([
    'parks_and_recreation',
    'roads_and_mobility',
    'water_and_sanitation',
    'waste_and_recycling',
    'safety_and_lighting',
    'housing_and_development',
    'economic_development',
    'youth_and_education',
    'health_and_wellbeing',
    'environment_and_climate',
    'digital_and_connectivity',
    'other',
]);
exports.COMMUNITY_IDEA_CATEGORY_LABEL = {
    parks_and_recreation: 'Parks & Recreation',
    roads_and_mobility: 'Roads & Mobility',
    water_and_sanitation: 'Water & Sanitation',
    waste_and_recycling: 'Waste & Recycling',
    safety_and_lighting: 'Safety & Lighting',
    housing_and_development: 'Housing & Development',
    economic_development: 'Economic Development',
    youth_and_education: 'Youth & Education',
    health_and_wellbeing: 'Health & Wellbeing',
    environment_and_climate: 'Environment & Climate',
    digital_and_connectivity: 'Digital & Connectivity',
    other: 'Other',
};
exports.CommunityIdeaStatusSchema = zod_1.z.enum([
    'submitted',
    'under_review',
    'community_support',
    'feasibility_review',
    'planned',
    'in_progress',
    'implemented',
    'declined',
    'withdrawn',
    'archived',
]);
exports.IDEA_STATUS_TRANSITIONS = {
    submitted: ['under_review', 'withdrawn', 'declined', 'archived'],
    under_review: [
        'community_support',
        'feasibility_review',
        'declined',
        'archived',
    ],
    community_support: ['feasibility_review', 'declined', 'archived'],
    feasibility_review: ['planned', 'declined', 'community_support', 'archived'],
    planned: ['in_progress', 'declined', 'archived'],
    in_progress: ['implemented', 'planned', 'archived'],
    implemented: ['archived'],
    declined: ['archived', 'under_review'],
    withdrawn: ['archived'],
    archived: [],
};
function canTransitionIdea(from, to) {
    const allowed = exports.IDEA_STATUS_TRANSITIONS[from];
    if (!allowed)
        return false;
    return allowed.includes(to);
}
function assertIdeaTransition(from, to) {
    if (!canTransitionIdea(from, to)) {
        throw new Error(`Invalid idea status transition from ${from} to ${to}`);
    }
}
exports.CITIZEN_IDEA_STATUS_LABEL = {
    submitted: 'Submitted',
    under_review: 'Under review',
    community_support: 'Gathering community support',
    feasibility_review: 'Feasibility review',
    planned: 'Planned',
    in_progress: 'In progress',
    implemented: 'Implemented',
    declined: 'Not proceeding',
    withdrawn: 'Withdrawn',
    archived: 'Archived',
};
exports.SubmitCommunityIdeaInputSchema = zod_1.z.object({
    title: zod_1.z.string().min(5).max(160),
    description: zod_1.z.string().min(20).max(4000),
    category: exports.CommunityIdeaCategorySchema,
    municipalityCode: zod_1.z.string().min(1).max(32),
    wardId: zod_1.z.string().max(64).optional(),
    suburbLabel: zod_1.z.string().max(120).optional(),
    mediaPaths: zod_1.z.array(zod_1.z.string().max(512)).max(4).optional(),
    clientRequestId: zod_1.z.string().uuid().optional(),
});
exports.OfficialIdeaResponseSchema = zod_1.z.object({
    ideaId: zod_1.z.string().min(1).max(64),
    body: zod_1.z.string().min(1).max(2000),
});
exports.TransitionIdeaStatusInputSchema = zod_1.z.object({
    ideaId: zod_1.z.string().min(1).max(64),
    status: exports.CommunityIdeaStatusSchema,
    note: zod_1.z.string().max(1000).optional(),
});
exports.ListCommunityIdeasInputSchema = zod_1.z.object({
    municipalityCode: zod_1.z.string().min(1).max(32),
    status: exports.CommunityIdeaStatusSchema.optional(),
    category: exports.CommunityIdeaCategorySchema.optional(),
    wardId: zod_1.z.string().max(64).optional(),
    /** Ops queues include drafts/internal; citizen view excludes withdrawn internal notes */
    opsView: zod_1.z.boolean().optional(),
    limit: zod_1.z.number().int().min(1).max(100).optional(),
    cursor: zod_1.z.string().max(128).optional(),
});
