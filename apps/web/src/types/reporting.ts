export interface Report {
  id: string
  title: string
  description: string
  category: ReportCategory
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'resolved' | 'closed'
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
  reporterEmail: string
  reporterPhone?: string
  isAnonymous: boolean
  media: MediaFile[]
  assignedTo?: string
  estimatedResolution?: Date
  actualResolution?: Date
  createdAt: Date
  updatedAt: Date
}

export type ReportCategory = 
  | 'water_sewage'
  | 'electricity'
  | 'roads_infrastructure'
  | 'waste_management'
  | 'digital_services'
  | 'emergency_services'

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
