/**
 * Reporting types — aligned with @servesa/case-contract canonical enums.
 * Legacy underscore IDs remain accepted via category mapping.
 */

export type CanonicalReportCategory =
  | 'water'
  | 'electricity'
  | 'roads'
  | 'waste'
  | 'internet'
  | 'emergency'

/** @deprecated Prefer CanonicalReportCategory; kept for historical drafts */
export type ReportCategory =
  | CanonicalReportCategory
  | 'water_sewage'
  | 'roads_infrastructure'
  | 'waste_management'
  | 'digital_services'
  | 'emergency_services'

export interface Report {
  id: string
  title: string
  description: string
  category: CanonicalReportCategory
  subcategory?: string
  priority: 'low' | 'medium' | 'high' | 'emergency'
  status: 'submitted' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed'
  location: {
    address: string
    coordinates: {
      lat: number
      lng: number
    }
    ward?: string
    municipality?: string
  }
  reporterId: string
  reporterName: string
  reporterEmail?: string
  reporterPhone?: string
  isAnonymous: boolean
  media: MediaFile[]
  assignedTo?: string
  estimatedResolution?: Date
  actualResolution?: Date
  createdAt: Date
  updatedAt: Date
}

export interface MediaFile {
  id: string
  type: 'image' | 'video' | 'audio' | 'document'
  url: string
  filename: string
  size: number
  uploadedAt: Date
}

export interface BulkReport {
  id: string
  issues: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>[]
  reporterId: string
  status: 'draft' | 'submitted' | 'processing'
  createdAt: Date
  updatedAt: Date
}
