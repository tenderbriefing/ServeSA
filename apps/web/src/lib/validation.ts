import { z } from 'zod'

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address')
export const phoneSchema = z.string().regex(/^(\+27|0)[0-9]{9}$/, 'Invalid South African phone number')
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters')

// User validation schemas
export const userProfileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: emailSchema,
  phone: phoneSchema.optional(),
  userType: z.enum(['citizen', 'department', 'admin']),
  municipalityCode: z.string().optional(),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const signupSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  phone: phoneSchema.optional(),
  userType: z.enum(['citizen', 'department', 'admin']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Report validation schemas
export const reportSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(['water_sewage', 'electricity', 'roads_infrastructure', 'waste_management', 'digital_services', 'emergency_services']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  location: z.object({
    address: z.string().min(1, 'Address is required'),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
  }),
  isAnonymous: z.boolean().default(false),
})

export const bulkReportSchema = z.object({
  issues: z.array(reportSchema).min(1, 'At least one issue is required'),
})

// Message validation schemas
export const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
  conversationId: z.string().min(1, 'Conversation ID is required'),
})

// Location validation
export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

export const locationSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  coordinates: coordinatesSchema,
  wardId: z.string().optional(),
  municipalityCode: z.string().optional(),
})

// Media validation
export const mediaFileSchema = z.object({
  type: z.enum(['image', 'video', 'audio', 'document']),
  filename: z.string(),
  size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  url: z.string().url(),
})

// Search and filter validation
export const searchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  dateRange: z.object({
    start: z.date(),
    end: z.date(),
  }).optional(),
})

// Export all schemas
export const schemas = {
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  userProfile: userProfileSchema,
  login: loginSchema,
  signup: signupSchema,
  report: reportSchema,
  bulkReport: bulkReportSchema,
  message: messageSchema,
  coordinates: coordinatesSchema,
  location: locationSchema,
  mediaFile: mediaFileSchema,
  search: searchSchema,
}
