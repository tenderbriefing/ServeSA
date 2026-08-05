// Application Constants
export const APP_CONFIG = {
  name: 'ServeSA',
  description: 'South African Service Platform',
  version: '1.0.0',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://servesa-aad53.web.app',
} as const

// Firebase Collections
export const COLLECTIONS = {
  users: 'users',
  cases: 'cases',
  caseEvents: 'caseEvents',
  municipalities: 'municipalities',
  wards: 'wards',
  capAlerts: 'cap_alerts',
  notifications: 'notifications',
  conversations: 'conversations',
  messages: 'messages',
  departments: 'departments',
} as const

// Storage Paths
export const STORAGE_PATHS = {
  caseMedia: (caseId: string) => `cases/${caseId}/media`,
  userAvatars: (userId: string) => `users/${userId}/avatar`,
  publicThumbnails: (caseId: string) => `cases/${caseId}/thumbnails`,
  evidence: (reportId: string) => `evidence/${reportId}`,
} as const

// Report Categories
export const REPORT_CATEGORIES = {
  water_sewage: {
    name: 'Water & Sewage',
    icon: '💧',
    sla: 24,
    priority: 'high',
  },
  electricity: {
    name: 'Electricity',
    icon: '⚡',
    sla: 4,
    priority: 'urgent',
  },
  roads_infrastructure: {
    name: 'Roads & Infrastructure',
    icon: '🛣️',
    sla: 72,
    priority: 'medium',
  },
  waste_management: {
    name: 'Waste Management',
    icon: '🗑️',
    sla: 48,
    priority: 'medium',
  },
  digital_services: {
    name: 'Digital Services',
    icon: '💻',
    sla: 168,
    priority: 'low',
  },
  emergency_services: {
    name: 'Emergency Services',
    icon: '🚨',
    sla: 1,
    priority: 'urgent',
  },
} as const

// User Types
export const USER_TYPES = {
  citizen: 'citizen',
  department: 'department',
  admin: 'admin',
} as const

// Case Status
export const CASE_STATUS = {
  pending: 'pending',
  in_progress: 'in_progress',
  resolved: 'resolved',
  closed: 'closed',
} as const

// Priority Levels
export const PRIORITY_LEVELS = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  urgent: 'urgent',
} as const

// API Endpoints
export const API_ENDPOINTS = {
  base: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://africa-south1-servesa-aad53.cloudfunctions.net',
  open311: process.env.NEXT_PUBLIC_OPEN311_ENDPOINT || 'https://africa-south1-servesa-aad53.cloudfunctions.net/api/open311',
  health: '/api/health',
} as const

// Feature Flags
export const FEATURE_FLAGS = {
  enablePWA: process.env.NEXT_PUBLIC_ENABLE_PWA === 'true',
  enableOfflineReporting: process.env.NEXT_PUBLIC_ENABLE_OFFLINE_REPORTING === 'true',
  enableVoiceNotes: process.env.NEXT_PUBLIC_ENABLE_VOICE_NOTES === 'true',
  enableFaceBlur: process.env.NEXT_PUBLIC_ENABLE_FACE_BLUR === 'true',
  enablePlateBlur: process.env.NEXT_PUBLIC_ENABLE_PLATE_BLUR === 'true',
} as const
