/**
 * Community Ideas — shared typed contract.
 * Constructive civic suggestions; not a social network.
 */

import { z } from 'zod'

export const COMMUNITY_IDEA_CONTRACT_VERSION = '1.0.0'

export const CommunityIdeaCategorySchema = z.enum([
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
])

export type CommunityIdeaCategory = z.infer<typeof CommunityIdeaCategorySchema>

export const COMMUNITY_IDEA_CATEGORY_LABEL: Record<
  CommunityIdeaCategory,
  string
> = {
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
}

export const CommunityIdeaStatusSchema = z.enum([
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
])

export type CommunityIdeaStatus = z.infer<typeof CommunityIdeaStatusSchema>

export const IDEA_STATUS_TRANSITIONS: Record<
  CommunityIdeaStatus,
  CommunityIdeaStatus[]
> = {
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
}

export function canTransitionIdea(from: string, to: string): boolean {
  const allowed = IDEA_STATUS_TRANSITIONS[from as CommunityIdeaStatus]
  if (!allowed) return false
  return allowed.includes(to as CommunityIdeaStatus)
}

export function assertIdeaTransition(from: string, to: string): void {
  if (!canTransitionIdea(from, to)) {
    throw new Error(`Invalid idea status transition from ${from} to ${to}`)
  }
}

export const CITIZEN_IDEA_STATUS_LABEL: Record<CommunityIdeaStatus, string> = {
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
}

export const SubmitCommunityIdeaInputSchema = z.object({
  title: z.string().min(5).max(160),
  description: z.string().min(20).max(4000),
  category: CommunityIdeaCategorySchema,
  municipalityCode: z.string().min(1).max(32),
  wardId: z.string().max(64).optional(),
  suburbLabel: z.string().max(120).optional(),
  mediaPaths: z.array(z.string().max(512)).max(4).optional(),
  clientRequestId: z.string().uuid().optional(),
})

export type SubmitCommunityIdeaInput = z.infer<
  typeof SubmitCommunityIdeaInputSchema
>

export const OfficialIdeaResponseSchema = z.object({
  ideaId: z.string().min(1).max(64),
  body: z.string().min(1).max(2000),
})

export type OfficialIdeaResponseInput = z.infer<typeof OfficialIdeaResponseSchema>

export const TransitionIdeaStatusInputSchema = z.object({
  ideaId: z.string().min(1).max(64),
  status: CommunityIdeaStatusSchema,
  note: z.string().max(1000).optional(),
})

export type TransitionIdeaStatusInput = z.infer<
  typeof TransitionIdeaStatusInputSchema
>

export const ListCommunityIdeasInputSchema = z.object({
  municipalityCode: z.string().min(1).max(32),
  status: CommunityIdeaStatusSchema.optional(),
  category: CommunityIdeaCategorySchema.optional(),
  wardId: z.string().max(64).optional(),
  /** Ops queues include drafts/internal; citizen view excludes withdrawn internal notes */
  opsView: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  cursor: z.string().max(128).optional(),
})

export type ListCommunityIdeasInput = z.infer<
  typeof ListCommunityIdeasInputSchema
>
