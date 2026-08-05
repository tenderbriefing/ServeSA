/**
 * ServeSA canonical case-creation contract
 * Shared by apps/web and apps/functions.
 */

import { z } from 'zod'
import { mapUiCategoryToCanonical } from './categories'
import { normalizeSaPhone } from './phone'
import { SA_BOUNDS } from './geo'

export const CASE_CONTRACT_VERSION = '1.0.0'
export const CONSENT_POLICY_VERSION = '2025-08-01'

const trimString = (min: number, max: number) =>
  z
    .string()
    .transform((v) => v.trim().replace(/\s+/g, ' '))
    .pipe(z.string().min(min).max(max))

export const CanonicalCategorySchema = z.enum([
  'water',
  'electricity',
  'roads',
  'waste',
  'internet',
  'emergency',
])

export const PrioritySchema = z.enum(['emergency', 'high', 'medium', 'low'])

export const LocationSourceSchema = z.enum([
  'device_gps',
  'map_pin',
  'address_search',
])

export const GeoresolutionStatusSchema = z.enum([
  'polygon_match', // unique authoritative GIS match (resolved)
  'ambiguous', // multiple conflicting polygons contain the point
  'nearest_ward', // legacy / advisory only — never authoritative routing
  'municipality_only',
  'unresolved',
])

const CreateCaseInputBaseSchema = z.object({
  title: trimString(5, 200),
  description: trimString(10, 2000),
  // string here so unsupported UI IDs can produce a friendly message in superRefine
  category: z.string().min(1),
  subcategory: z.string().trim().max(100).optional(),
  priority: PrioritySchema,
  latitude: z.number().finite(),
  longitude: z.number().finite(),
  locationSource: LocationSourceSchema,
  address: z.string().trim().max(500).optional(),
  reporter: z.object({
    name: trimString(2, 120),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().optional(),
  }),
  consent: z.object({
    dataProcessing: z.literal(true, {
      errorMap: () => ({
        message: 'Data-processing consent is required to submit a report.',
      }),
    }),
    communications: z.boolean().optional(),
  }),
  clientRequestId: z
    .string()
    .uuid({ message: 'clientRequestId must be a UUID' }),
})

/**
 * Preprocess raw client payloads:
 * - map UI / legacy category IDs → canonical
 * - fill subcategory from mapping when absent
 * - normalise empty strings to undefined
 */
function preprocessCreateCaseInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw
  const input = { ...(raw as Record<string, unknown>) }

  if (typeof input.category === 'string') {
    const mapped = mapUiCategoryToCanonical(input.category)
    if (!mapped) {
      // Leave invalid category for Zod to reject with a clear message
      input.category = `__unsupported__:${input.category}`
    } else {
      input.category = mapped.category
      if (!input.subcategory && mapped.subcategory) {
        input.subcategory = mapped.subcategory
      }
    }
  }

  // Normalise empty optional strings
  if (input.address === '') input.address = undefined
  if (input.subcategory === '') input.subcategory = undefined

  if (input.reporter && typeof input.reporter === 'object') {
    const reporter = { ...(input.reporter as Record<string, unknown>) }
    if (reporter.email === '') reporter.email = undefined
    if (reporter.phone === '') reporter.phone = undefined
    input.reporter = reporter
  }

  return input
}

export const CreateCaseInputSchema = z.preprocess(
  preprocessCreateCaseInput,
  CreateCaseInputBaseSchema.superRefine((data, ctx) => {
    if (String(data.category).startsWith('__unsupported__:')) {
      const original = String(data.category).replace('__unsupported__:', '')
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['category'],
        message: `Unsupported category "${original}". Choose a supported service category.`,
      })
      return
    }

    if (data.latitude === 0 && data.longitude === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['latitude'],
        message:
          'A valid South African location is required (0,0 is not allowed).',
      })
    }

    if (
      data.latitude < SA_BOUNDS.minLat ||
      data.latitude > SA_BOUNDS.maxLat ||
      data.longitude < SA_BOUNDS.minLng ||
      data.longitude > SA_BOUNDS.maxLng
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['latitude'],
        message:
          'Selected location is outside South Africa. Please choose a location within South Africa.',
      })
    }

    const email = data.reporter.email
    const phone = data.reporter.phone
      ? normalizeSaPhone(data.reporter.phone)
      : undefined

    if (!email && !phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reporter'],
        message: 'Provide at least an email address or a mobile number.',
      })
    }

    if (data.reporter.phone && !phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reporter', 'phone'],
        message: 'Enter a valid South African mobile number.',
      })
    }
  }).transform((data) => {
    const phone = data.reporter.phone
      ? normalizeSaPhone(data.reporter.phone) ?? undefined
      : undefined

    const category = data.category as
      | 'water'
      | 'electricity'
      | 'roads'
      | 'waste'
      | 'internet'
      | 'emergency'

    return {
      ...data,
      category,
      subcategory: data.subcategory || undefined,
      address: data.address || undefined,
      reporter: {
        name: data.reporter.name,
        email: data.reporter.email || undefined,
        phone,
      },
    }
  })
)

export type CreateCaseInput = z.infer<typeof CreateCaseInputSchema>
export type CanonicalCategory = z.infer<typeof CanonicalCategorySchema>
export type Priority = z.infer<typeof PrioritySchema>
export type LocationSource = z.infer<typeof LocationSourceSchema>
export type GeoresolutionStatus = z.infer<typeof GeoresolutionStatusSchema>

export const CreateCaseResponseSchema = z.object({
  caseId: z.string(),
  reference: z.string(),
  shareUrl: z.string().url(),
  status: z.literal('submitted'),
  municipality: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
  ward: z
    .object({
      id: z.string(),
      number: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
  slaTarget: z.string(),
  targetHours: z.number(),
  georesolutionStatus: GeoresolutionStatusSchema,
  mediaUploadPath: z.string().optional(),
  routingPending: z.boolean().optional(),
  duplicateAssessment: z
    .object({
      status: z.enum(['pending', 'completed', 'skipped']),
      candidateCaseIds: z.array(z.string()).optional(),
    })
    .optional(),
})

export type CreateCaseResponse = z.infer<typeof CreateCaseResponseSchema>

export function parseCreateCaseInput(input: unknown): CreateCaseInput {
  return CreateCaseInputSchema.parse(input)
}

export function safeParseCreateCaseInput(input: unknown) {
  return CreateCaseInputSchema.safeParse(input)
}

export { CANONICAL_CATEGORIES } from './categories'
