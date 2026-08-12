import { z } from 'zod'

// Re-export new organized types
export * from './auth'
export * from './messaging'
export * from './reporting'
export * from './common'

// User Types
export const UserRoleSchema = z.enum(['citizen', 'official', 'moderator', 'admin'])
export type UserRole = z.infer<typeof UserRoleSchema>

export const ContactPreferenceSchema = z.enum(['email', 'push', 'sms', 'whatsapp'])
export type ContactPreference = z.infer<typeof ContactPreferenceSchema>

export const UserSchema = z.object({
  uid: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  displayName: z.string().optional(),
  photoURL: z.string().url().optional(),
  roles: z.array(UserRoleSchema).default(['citizen']),
  contactPreferences: z.array(ContactPreferenceSchema).default(['email']),
  province: z.string().optional(),
  municipalityCode: z.string().optional(),
  wardId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastActiveAt: z.date().optional(),
  consent: z.object({
    dataCollection: z.boolean().default(false),
    notifications: z.boolean().default(false),
    location: z.boolean().default(false),
    media: z.boolean().default(false),
  }),
})
export type User = z.infer<typeof UserSchema>

// UserProfile type for backward compatibility
export type UserProfile = User

// Case Types
export const CaseStatusSchema = z.enum(['ACK', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED'])
export type CaseStatus = z.infer<typeof CaseStatusSchema>

export const CaseSeveritySchema = z.enum(['1', '2', '3'])
export type CaseSeverity = z.infer<typeof CaseSeveritySchema>

export const CaseChannelSchema = z.enum(['web', 'email', 'whatsapp', 'sms'])
export type CaseChannel = z.infer<typeof CaseChannelSchema>

export const MediaTypeSchema = z.enum(['image', 'video', 'audio'])
export type MediaType = z.infer<typeof MediaTypeSchema>

export const MediaSchema = z.object({
  path: z.string(),
  type: MediaTypeSchema,
  hash: z.string(),
  blurred: z.boolean().default(false),
  originalPath: z.string().optional(),
  thumbnailPath: z.string().optional(),
  metadata: z.object({
    size: z.number(),
    width: z.number().optional(),
    height: z.number().optional(),
    duration: z.number().optional(),
    mimeType: z.string(),
  }).optional(),
})
export type Media = z.infer<typeof MediaSchema>

export const DedupeInfoSchema = z.object({
  textSim: z.number().optional(),
  imgHash: z.string().optional(),
  geoClusterId: z.string().optional(),
  canonicalCaseId: z.string().optional(),
  duplicateOf: z.string().optional(),
})
export type DedupeInfo = z.infer<typeof DedupeInfoSchema>

export const SLASchema = z.object({
  targetAt: z.date(),
  breached: z.boolean().default(false),
  priority: z.number().default(3),
  category: z.string(),
})
export type SLA = z.infer<typeof SLASchema>

export const CaseSchema = z.object({
  caseId: z.string(),
  reporterUid: z.string().optional(),
  channel: CaseChannelSchema,
  lat: z.number(),
  lng: z.number(),
  address: z.string(),
  muniCode: z.string(),
  wardId: z.string(),
  category: z.string(),
  severity: CaseSeveritySchema,
  description: z.string(),
  media: z.array(MediaSchema).default([]),
  dedupe: DedupeInfoSchema.optional(),
  status: CaseStatusSchema,
  sla: SLASchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  resolvedAt: z.date().optional(),
  reopenedAt: z.date().optional(),
  assignedTo: z.string().optional(),
  resolutionNotes: z.string().optional(),
  resolutionMedia: z.array(MediaSchema).default([]),
  affectedCount: z.number().default(1),
  tags: z.array(z.string()).default([]),
})
export type Case = z.infer<typeof CaseSchema>

// Event Types
export const EventTypeSchema = z.enum([
  'CASE_CREATED',
  'CASE_ACKNOWLEDGED',
  'CASE_ASSIGNED',
  'CASE_IN_PROGRESS',
  'CASE_RESOLVED',
  'CASE_REOPENED',
  'MEDIA_ADDED',
  'NOTE_ADDED',
  'SLA_BREACHED',
  'DUPLICATE_LINKED',
])
export type EventType = z.infer<typeof EventTypeSchema>

export const CaseEventSchema = z.object({
  eventId: z.string(),
  caseId: z.string(),
  type: EventTypeSchema,
  actorUid: z.string().optional(),
  system: z.boolean().default(false),
  note: z.string().optional(),
  mediaRef: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  timestamp: z.date(),
})
export type CaseEvent = z.infer<typeof CaseEventSchema>

// Municipality Types
export const ITSMTypeSchema = z.enum(['jira', 'servicenow', 'email'])
export type ITSMType = z.infer<typeof ITSMTypeSchema>

export const ITSMConfigSchema = z.object({
  type: ITSMTypeSchema,
  endpoint: z.string().url().optional(),
  apiKey: z.string().optional(),
  projectKey: z.string().optional(),
  queueId: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
})
export type ITSMConfig = z.infer<typeof ITSMConfigSchema>

export const ServiceCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  slaHours: z.number(),
  severity: CaseSeveritySchema,
  requiresMedia: z.boolean().default(false),
  requiresLocation: z.boolean().default(true),
  active: z.boolean().default(true),
})
export type ServiceCategory = z.infer<typeof ServiceCategorySchema>

export const MunicipalitySchema = z.object({
  code: z.string(),
  name: z.string(),
  emails: z.array(z.string().email()),
  itSM: ITSMConfigSchema.optional(),
  open311Endpoint: z.string().url().optional(),
  categories: z.array(ServiceCategorySchema),
  slaPolicy: z.object({
    defaultHours: z.number().default(72),
    emergencyHours: z.number().default(24),
    weekendMultiplier: z.number().default(1.5),
  }),
  contactInfo: z.object({
    phone: z.string().optional(),
    website: z.string().url().optional(),
    address: z.string().optional(),
  }).optional(),
  active: z.boolean().default(true),
})
export type Municipality = z.infer<typeof MunicipalitySchema>

// Ward Types
export const CouncillorSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  party: z.string().optional(),
  termStart: z.date().optional(),
  termEnd: z.date().optional(),
})
export type Councillor = z.infer<typeof CouncillorSchema>

export const WardSchema = z.object({
  wardId: z.string(),
  muniCode: z.string(),
  name: z.string(),
  councillor: CouncillorSchema.optional(),
  population: z.number().optional(),
  area: z.number().optional(),
  geometry: z.any().optional(), // BigQuery GEOGRAPHY type
  active: z.boolean().default(true),
})
export type Ward = z.infer<typeof WardSchema>

// CAP Alert Types
export const CAPAlertSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  sender: z.string(),
  sent: z.date(),
  status: z.enum(['Actual', 'Exercise', 'System', 'Test', 'Draft']),
  msgType: z.enum(['Alert', 'Update', 'Cancel', 'Ack', 'Error']),
  scope: z.enum(['Public', 'Restricted', 'Private']),
  category: z.array(z.string()),
  event: z.string(),
  responseType: z.array(z.string()).optional(),
  urgency: z.enum(['Immediate', 'Expected', 'Future', 'Past', 'Unknown']),
  severity: z.enum(['Extreme', 'Severe', 'Moderate', 'Minor', 'Unknown']),
  certainty: z.enum(['Observed', 'Likely', 'Possible', 'Unlikely', 'Unknown']),
  effective: z.date().optional(),
  expires: z.date().optional(),
  headline: z.string(),
  description: z.string(),
  instruction: z.string().optional(),
  area: z.object({
    desc: z.string(),
    polygon: z.array(z.array(z.number())).optional(),
    circle: z.object({
      lat: z.number(),
      lng: z.number(),
      radius: z.number(),
    }).optional(),
  }),
  affectedWards: z.array(z.string()).default([]),
})
export type CAPAlert = z.infer<typeof CAPAlertSchema>

// API Response Types
export const APIResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
})
export type APIResponse = z.infer<typeof APIResponseSchema>

// Open311 Types
export const Open311ServiceRequestSchema = z.object({
  service_request_id: z.string().optional(),
  status: z.enum(['open', 'closed']),
  status_notes: z.string().optional(),
  service_name: z.string(),
  service_code: z.string(),
  description: z.string(),
  agency_responsible: z.string().optional(),
  service_notice: z.string().optional(),
  requested_datetime: z.string(),
  updated_datetime: z.string().optional(),
  expected_datetime: z.string().optional(),
  address: z.string(),
  address_id: z.string().optional(),
  zipcode: z.string().optional(),
  lat: z.number().optional(),
  long: z.number().optional(),
  media_url: z.string().url().optional(),
})
export type Open311ServiceRequest = z.infer<typeof Open311ServiceRequestSchema>

// Geolocation Types
export const CoordinatesSchema = z.object({
  lat: z.number(),
  lng: z.number(),
})
export type Coordinates = z.infer<typeof CoordinatesSchema>

export const LocationInfoSchema = z.object({
  coordinates: CoordinatesSchema,
  address: z.string(),
  wardId: z.string(),
  muniCode: z.string(),
  municipality: z.string(),
  ward: z.string(),
})
export type LocationInfo = z.infer<typeof LocationInfoSchema>

// Analytics Types
export const CaseAnalyticsSchema = z.object({
  totalCases: z.number(),
  resolvedCases: z.number(),
  openCases: z.number(),
  averageResolutionTime: z.number(),
  slaCompliance: z.number(),
  categoryBreakdown: z.record(z.number()),
  severityBreakdown: z.record(z.number()),
  timeSeries: z.array(z.object({
    date: z.string(),
    created: z.number(),
    resolved: z.number(),
  })),
})
export type CaseAnalytics = z.infer<typeof CaseAnalyticsSchema>

// Notification Types
export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(['case_update', 'sla_breach', 'resolution', 'duplicate_found']),
  title: z.string(),
  body: z.string(),
  data: z.record(z.any()).optional(),
  read: z.boolean().default(false),
  createdAt: z.date(),
  sentAt: z.date().optional(),
})
export type Notification = z.infer<typeof NotificationSchema>

// Export all schemas for validation
export const schemas = {
  User: UserSchema,
  Case: CaseSchema,
  CaseEvent: CaseEventSchema,
  Municipality: MunicipalitySchema,
  Ward: WardSchema,
  CAPAlert: CAPAlertSchema,
  APIResponse: APIResponseSchema,
  Open311ServiceRequest: Open311ServiceRequestSchema,
  LocationInfo: LocationInfoSchema,
  CaseAnalytics: CaseAnalyticsSchema,
  Notification: NotificationSchema,
}
