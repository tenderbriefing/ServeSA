/**
 * ServeSA Phase-1: Case Creation Function
 * This function handles case creation with validation, georesolve, and notifications
 */

import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { z } from 'zod'
import { georesolve } from '../routing/georesolve'
import { sendNotification } from '../notifications/notifications'
import { calculateSLA } from '../utils/slaCalculator'

const db = getFirestore()
const auth = getAuth()


// Case creation schema
const CreateCaseSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  category: z.enum(['water', 'electricity', 'roads', 'waste', 'internet', 'emergency']),
  subcategory: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'emergency']),
  location: z.object({
    lat: z.number().min(-35).max(-22),
    lng: z.number().min(16).max(33),
    address: z.string().optional()
  }),
  contactInfo: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional()
  }).optional(),
  images: z.array(z.string()).optional(),
  consent: z.boolean().refine(val => val === true, 'Consent is required'),
  userId: z.string().optional() // Optional for anonymous reports
})

interface CreateCaseRequest {
  title: string
  description: string
  category: string
  subcategory?: string
  priority: string
  location: {
    lat: number
    lng: number
    address?: string
  }
  contactInfo?: {
    phone?: string
    email?: string
  }
  images?: string[]
  consent: boolean
  userId?: string
}

interface CaseDocument {
  caseId: string
  title: string
  description: string
  category: string
  subcategory?: string
  priority: string
  status: string
  location: {
    lat: number
    lng: number
    address?: string
    wardId: string
    wardName: string
    municipalityId: string
    municipalityName: string
    province: string
  }
  contactInfo?: {
    phone?: string
    email?: string
  }
  images?: string[]
  userId?: string
  userProfile?: {
    displayName?: string
    email?: string
    phone?: string
  }
  slaTarget: Date
  slaBreach: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
}

/**
 * Create a new case
 */
export async function createCase(data: CreateCaseRequest, authToken?: string): Promise<{ caseId: string; shareUrl: string }> {
  try {
    // Validate input
    const validatedData = CreateCaseSchema.parse(data)
    
    // Authenticate user if token provided
    let user = null
    if (authToken) {
      try {
        const decodedToken = await auth.verifyIdToken(authToken)
        user = decodedToken
      } catch (error) {
        console.warn('Invalid auth token, proceeding as anonymous')
      }
    }

    // Georesolve location
    const georesolveResult = await georesolve(validatedData.location.lat, validatedData.location.lng)
    
    // Get municipality SLA configuration
    const municipalityDoc = await db.collection('municipalities').doc(georesolveResult.municipalityId).get()
    const municipality = municipalityDoc.exists ? municipalityDoc.data() : null
    
    // Calculate SLA target
    const slaTarget = calculateSLA(validatedData.category, validatedData.priority, municipality?.slaConfig)
    
    // Create case document
    const caseId = generateCaseId()
    const now = new Date()
    
    const caseDoc: CaseDocument = {
      caseId,
      title: validatedData.title,
      description: validatedData.description,
      category: validatedData.category,
      subcategory: validatedData.subcategory,
      priority: validatedData.priority,
      status: 'submitted',
      location: {
        lat: validatedData.location.lat,
        lng: validatedData.location.lng,
        address: validatedData.location.address,
        wardId: georesolveResult.wardId,
        wardName: georesolveResult.wardName,
        municipalityId: georesolveResult.municipalityId,
        municipalityName: georesolveResult.municipalityName,
        province: georesolveResult.province
      },
      contactInfo: validatedData.contactInfo,
      images: validatedData.images,
      userId: user?.uid || validatedData.userId,
      userProfile: user ? {
        displayName: user.name,
        email: user.email,
        phone: user.phone_number
      } : undefined,
      slaTarget,
      slaBreach: false,
      createdAt: now,
      updatedAt: now,
      createdBy: user?.uid || 'anonymous',
      updatedBy: user?.uid || 'anonymous'
    }

    // Write to Firestore
    await db.collection('cases').doc(caseId).set(caseDoc)

    // Create case event
    const caseEvent = {
      caseId,
      eventType: 'case_created',
      description: 'Case submitted',
      userId: user?.uid || 'anonymous',
      userDisplayName: user?.name || 'Anonymous User',
      timestamp: now,
      metadata: {
        category: validatedData.category,
        priority: validatedData.priority,
        wardId: georesolveResult.wardId,
        municipalityId: georesolveResult.municipalityId
      }
    }

    await db.collection('case_events').add(caseEvent)

    // Send notifications
    await sendCaseNotifications(caseDoc, user)

    // Generate share URL
    const shareUrl = `${process.env.WEB_APP_URL || 'https://servesa.co.za'}/case/${caseId}`

    // Update analytics
    await updateCaseAnalytics(caseDoc)

    return {
      caseId,
      shareUrl
    }

  } catch (error) {
    console.error('Error creating case:', error)
    throw new Error(`Case creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Send notifications for new case
 */
async function sendCaseNotifications(caseDoc: CaseDocument, user: any) {
  try {
    // Send acknowledgment to user
    if (user?.uid) {
      await sendNotification({
        userId: user.uid,
        title: 'Case Submitted Successfully',
        body: `Your case "${caseDoc.title}" has been submitted and assigned case ID ${caseDoc.caseId}`,
        type: 'case_acknowledgment',
        data: {
          caseId: caseDoc.caseId,
          category: caseDoc.category,
          priority: caseDoc.priority
        }
      })
    }

    // Send notification to municipality officials
    const officialsSnapshot = await db.collection('users')
      .where('role', 'in', ['official', 'admin'])
      .where('municipalityId', '==', caseDoc.location.municipalityId)
      .get()

    for (const officialDoc of officialsSnapshot.docs) {
      await sendNotification({
        userId: officialDoc.id,
        title: 'New Case Assigned',
        body: `New ${caseDoc.priority} priority case in ${caseDoc.location.wardName}`,
        type: 'new_case',
        data: {
          caseId: caseDoc.caseId,
          category: caseDoc.category,
          priority: caseDoc.priority,
          wardId: caseDoc.location.wardId
        }
      })
    }

    // Send email notification if contact info provided
    if (caseDoc.contactInfo?.email) {
      await sendEmailNotification(caseDoc)
    }

  } catch (error) {
    console.error('Error sending case notifications:', error)
    // Don't throw - notification failure shouldn't break case creation
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(caseDoc: CaseDocument) {
  try {
    // This would integrate with Gmail API
    // For Phase-1, log the email notification
    console.log('Email notification would be sent to:', caseDoc.contactInfo?.email)
    console.log('Case details:', {
      caseId: caseDoc.caseId,
      title: caseDoc.title,
      category: caseDoc.category,
      priority: caseDoc.priority
    })
  } catch (error) {
    console.error('Error sending email notification:', error)
  }
}

/**
 * Update case analytics
 */
async function updateCaseAnalytics(caseDoc: CaseDocument) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const analyticsRef = db.collection('case_analytics').doc(today)
    
    await analyticsRef.set({
      date: today,
      municipalityId: caseDoc.location.municipalityId,
      wardId: caseDoc.location.wardId,
      category: caseDoc.category,
      priority: caseDoc.priority,
      status: caseDoc.status,
      caseCount: 1,
      totalCount: 1
    }, { merge: true })

  } catch (error) {
    console.error('Error updating case analytics:', error)
  }
}

/**
 * Generate unique case ID
 */
function generateCaseId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 5)
  return `CASE-${timestamp}-${random}`.toUpperCase()
}

/**
 * HTTP callable function for case creation
 */
export const createCaseHttp = async (req: any, res: any) => {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '')
    const caseData = req.body

    const result = await createCase(caseData, authToken)

    res.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Error in createCaseHttp:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      })
    }

    res.status(500).json({
      error: 'Case creation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * Get case by ID
 */
export async function getCase(caseId: string, userId?: string): Promise<CaseDocument | null> {
  try {
    const caseDoc = await db.collection('cases').doc(caseId).get()
    
    if (!caseDoc.exists) {
      return null
    }

    const caseData = caseDoc.data() as CaseDocument

    // Check access permissions
    if (caseData.userId && caseData.userId !== userId) {
      // Check if user is official/admin for this municipality
      if (userId) {
        const userDoc = await db.collection('users').doc(userId).get()
        const userData = userDoc.data()
        
        if (userData?.role === 'official' || userData?.role === 'admin') {
          if (userData.municipalityId === caseData.location.municipalityId) {
            return caseData
          }
        }
      }
      
      throw new Error('Access denied')
    }

    return caseData

  } catch (error) {
    console.error('Error getting case:', error)
    throw error
  }
}

/**
 * Update case status
 */
export async function updateCaseStatus(caseId: string, status: string, userId: string, comment?: string): Promise<void> {
  try {
    const caseRef = db.collection('cases').doc(caseId)
    const caseDoc = await caseRef.get()

    if (!caseDoc.exists) {
      throw new Error('Case not found')
    }

    const caseData = caseDoc.data() as CaseDocument

    // Check permissions
    if (caseData.userId !== userId) {
      const userDoc = await db.collection('users').doc(userId).get()
      const userData = userDoc.data()
      
      if (userData?.role !== 'official' && userData?.role !== 'admin') {
        throw new Error('Access denied')
      }
      
      if (userData.municipalityId !== caseData.location.municipalityId) {
        throw new Error('Access denied')
      }
    }

    // Update case
    await caseRef.update({
      status,
      updatedAt: new Date(),
      updatedBy: userId
    })

    // Create status update event
    const caseEvent = {
      caseId,
      eventType: 'status_updated',
      description: `Status updated to ${status}`,
      userId,
      timestamp: new Date(),
      metadata: {
        previousStatus: caseData.status,
        newStatus: status,
        comment
      }
    }

    await db.collection('case_events').add(caseEvent)

    // Send notification to case owner
    if (caseData.userId && caseData.userId !== userId) {
      await sendNotification({
        userId: caseData.userId,
        title: 'Case Status Updated',
        body: `Your case "${caseData.title}" status has been updated to ${status}`,
        type: 'status_update',
        data: {
          caseId,
          status,
          comment
        }
      })
    }

  } catch (error) {
    console.error('Error updating case status:', error)
    throw error
  }
}
