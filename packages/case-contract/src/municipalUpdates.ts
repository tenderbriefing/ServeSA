/**
 * Municipal Updates — shared typed contract.
 * Civic communications only; not a social feed.
 */

import { z } from 'zod'

export const MUNICIPAL_UPDATE_CONTRACT_VERSION = '1.0.0'

export const MunicipalUpdateTypeSchema = z.enum([
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
])

export type MunicipalUpdateType = z.infer<typeof MunicipalUpdateTypeSchema>

export const MUNICIPAL_UPDATE_TYPE_LABEL: Record<MunicipalUpdateType, string> = {
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
}

export const MunicipalUpdateStatusSchema = z.enum([
  'draft',
  'scheduled',
  'published',
  'updated',
  'resolved',
  'archived',
])

export type MunicipalUpdateStatus = z.infer<typeof MunicipalUpdateStatusSchema>

/** Lifecycle transitions for municipal updates */
export const UPDATE_STATUS_TRANSITIONS: Record<
  MunicipalUpdateStatus,
  MunicipalUpdateStatus[]
> = {
  draft: ['scheduled', 'published', 'archived'],
  scheduled: ['published', 'draft', 'archived'],
  published: ['updated', 'resolved', 'archived'],
  updated: ['updated', 'resolved', 'archived'],
  resolved: ['archived', 'updated'],
  archived: [],
}

export function canTransitionUpdate(
  from: string,
  to: string
): boolean {
  const allowed = UPDATE_STATUS_TRANSITIONS[from as MunicipalUpdateStatus]
  if (!allowed) return false
  return allowed.includes(to as MunicipalUpdateStatus)
}

export function assertUpdateTransition(from: string, to: string): void {
  if (!canTransitionUpdate(from, to)) {
    throw new Error(`Invalid update status transition from ${from} to ${to}`)
  }
}

export const ProjectStageSchema = z.enum([
  'announced',
  'planning',
  'procurement',
  'construction',
  'commissioning',
  'completed',
  'on_hold',
])

export type ProjectStage = z.infer<typeof ProjectStageSchema>

export const ProjectTrackingSchema = z.object({
  name: z.string().min(1).max(200),
  stage: ProjectStageSchema,
  progressPercent: z.number().int().min(0).max(100),
  summary: z.string().max(1000).optional(),
})

export type ProjectTracking = z.infer<typeof ProjectTrackingSchema>

export const UpdateTargetingSchema = z.object({
  /** Always set server-side from claims for privileged writes */
  municipalityCode: z.string().min(1).max(32),
  wardIds: z.array(z.string().min(1).max(64)).max(50).optional(),
  suburbIds: z.array(z.string().min(1).max(64)).max(50).optional(),
  serviceCategories: z.array(z.string().min(1).max(64)).max(20).optional(),
  /** Optional GeoJSON-like affected area; never stores citizen GPS */
  affectedAreaLabel: z.string().max(200).optional(),
  affectedAreaGeoJson: z.record(z.unknown()).optional(),
})

export type UpdateTargeting = z.infer<typeof UpdateTargetingSchema>

export const UpsertMunicipalUpdateInputSchema = z.object({
  updateId: z.string().min(1).max(64).optional(),
  type: MunicipalUpdateTypeSchema,
  title: z.string().min(3).max(160),
  body: z.string().min(10).max(8000),
  summary: z.string().max(280).optional(),
  targeting: UpdateTargetingSchema.omit({ municipalityCode: true }).extend({
    /** Client may suggest; server overwrites from claims */
    municipalityCode: z.string().min(1).max(32).optional(),
  }),
  status: MunicipalUpdateStatusSchema.optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  expectedRestorationAt: z.string().datetime().optional().nullable(),
  project: ProjectTrackingSchema.optional().nullable(),
  mediaPaths: z.array(z.string().max(512)).max(6).optional(),
  publishedByDisplayName: z.string().max(120).optional(),
})

export type UpsertMunicipalUpdateInput = z.infer<
  typeof UpsertMunicipalUpdateInputSchema
>

export const ListMunicipalUpdatesInputSchema = z.object({
  municipalityCode: z.string().min(1).max(32),
  status: MunicipalUpdateStatusSchema.optional(),
  type: MunicipalUpdateTypeSchema.optional(),
  wardId: z.string().max(64).optional(),
  serviceCategory: z.string().max(64).optional(),
  /** Citizen list defaults to published+updated+resolved */
  citizenView: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  cursor: z.string().max(128).optional(),
})

export type ListMunicipalUpdatesInput = z.infer<
  typeof ListMunicipalUpdatesInputSchema
>
