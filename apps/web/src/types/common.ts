export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface FilterState {
  category?: string
  status?: string
  priority?: string
  dateRange?: {
    start: Date
    end: Date
  }
  location?: {
    municipality?: string
    ward?: string
  }
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  sms: boolean
  caseUpdates: boolean
  communityUpdates: boolean
  emergencyAlerts: boolean
}

export interface AccessibilitySettings {
  highContrast: boolean
  largeText: boolean
  screenReader: boolean
  keyboardNavigation: boolean
  voiceControl: boolean
}
