import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp()

import { createCaseCallable, CaseCreationError } from './cases/createCase'
import { updateCaseStatus } from './cases/updateCaseStatus'
import { getCaseAnalytics } from './cases/getCaseAnalytics'
import { dedupeCase, getDuplicateCases } from './cases/dedupe'
import {
  processMediaUpload,
  onMediaObjectFinalized,
} from './cases/media'
import { generateCasePDF } from './cases/pdf'

import { georesolveSafe } from './routing/georesolve'
import { getServiceCategories } from './routing/categories'

import { sendEmailNotification } from './notifications/email'
import { sendPushNotification } from './notifications/push'
import { slaEngine } from './notifications/slaEngine'
import { orchestrateCaseCreatedNotifications } from './notifications/caseCreatedOrchestrator'

import { open311Router } from './open311/router'
import { open311Fanout } from './open311/fanout'

import { capIngest } from './cap/ingest'
import { getCAPAlerts } from './cap/getAlerts'

import { publicAnalytics } from './analytics/public'
import { wardAnalytics } from './analytics/ward'
import { ZodError } from 'zod'

function mapCallableError(error: unknown): never {
  if (error instanceof CaseCreationError) {
    throw new functions.https.HttpsError(
      error.status === 429 ? 'resource-exhausted' : 'invalid-argument',
      error.message
    )
  }
  if (error instanceof ZodError) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      error.issues[0]?.message || 'Validation failed'
    )
  }
  console.error('callable error', error)
  throw new functions.https.HttpsError(
    'internal',
    'Unable to complete request. Please try again.'
  )
}

// Case Management
export const createCaseFunction = functions
  .region('africa-south1')
  .https.onCall(async (data: any, context) => {
    try {
      return await createCaseCallable(data, context.auth)
    } catch (error) {
      mapCallableError(error)
    }
  })

export const updateCaseStatusFunction = functions
  .region('africa-south1')
  .https.onCall(async (data: any, _context) => {
    return await updateCaseStatus(data)
  })

export const getCaseAnalyticsFunction = functions
  .region('africa-south1')
  .https.onCall(async (data: any, _context) => {
    return await getCaseAnalytics(data)
  })

export const dedupeCaseFunction = functions
  .region('africa-south1')
  .https.onCall(async (data: any, _context) => {
    return await dedupeCase(data)
  })

export const getDuplicateCasesFunction = functions
  .region('africa-south1')
  .https.onCall(async (data: any, _context) => {
    return await getDuplicateCases(data.caseId)
  })

/** Client callable for base64 media upload after durable case creation */
export const uploadMediaFunction = functions
  .region('africa-south1')
  .https.onCall(async (data: any, context) => {
    return await processMediaUpload({
      caseId: data.caseId,
      files: data.files || [],
      userId: context.auth?.uid,
    })
  })

/** Storage finalisation — idempotent metadata only */
export const processMediaUploadFunction = functions
  .region('africa-south1')
  .storage.object()
  .onFinalize(async (object) => {
    await onMediaObjectFinalized(object)
  })

export const generateCasePDFFunction = functions
  .region('africa-south1')
  .https.onCall(generateCasePDF)

export const georesolveFunction = functions
  .region('africa-south1')
  .https.onCall(async (data: any, _context) => {
    const { lat, lng } = data
    return await georesolveSafe(lat, lng)
  })

export const getServiceCategoriesFunction = functions
  .region('africa-south1')
  .https.onCall(async (data: any, _context) => {
    return await getServiceCategories(data)
  })

export const sendEmailNotificationFunction = functions
  .region('africa-south1')
  .https.onCall(async (data: any, _context) => {
    return await sendEmailNotification(data)
  })

export const sendPushNotificationFunction = functions
  .region('africa-south1')
  .https.onCall(async (data: any, _context) => {
    return await sendPushNotification(data)
  })

export const slaEngineFunction = functions
  .region('africa-south1')
  .pubsub.schedule('every 5 minutes')
  .onRun(async (_context) => {
    return await slaEngine.checkSLA('all')
  })

export const open311RouterFunction = functions
  .region('africa-south1')
  .https.onRequest(async (req, res) => {
    await open311Router({ req, res })
  })

export const open311FanoutFunction = functions
  .region('africa-south1')
  .https.onCall(async (data: any, _context) => {
    return await open311Fanout(data)
  })

export const ingestCAPAlertsFunction = functions
  .region('africa-south1')
  .pubsub.schedule('every 15 minutes')
  .onRun(async (_context) => {
    return await capIngest({})
  })

export const getCAPAlertsFunction = functions
  .region('africa-south1')
  .https.onCall(async (data: any, _context) => {
    return await getCAPAlerts(data)
  })

export const getPublicAnalyticsFunction = functions
  .region('africa-south1')
  .https.onCall(async (data: any, _context) => {
    return await publicAnalytics(data)
  })

export const getWardAnalyticsFunction = functions
  .region('africa-south1')
  .https.onCall(async (data: any, _context) => {
    return await wardAnalytics(data)
  })

export const api = functions
  .region('africa-south1')
  .https.onRequest((req, res) => {
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    const path = req.path
    switch (path) {
      case '/api/health':
        res.json({ status: 'healthy', timestamp: new Date().toISOString() })
        break
      case '/api/version':
        res.json({
          version: '1.0.0',
          region: 'africa-south1',
          environment: process.env.NODE_ENV || 'production',
        })
        break
      default:
        res.status(404).json({ error: 'Not found' })
    }
  })

/**
 * Notification + duplicate ownership lives here (retry-safe via ledger).
 * createCase performs durable writes only.
 */
export const onCaseCreated = functions
  .region('africa-south1')
  .firestore.document('cases/{caseId}')
  .onCreate(async (snap, context) => {
    const caseData = snap.data()
    const caseId = context.params.caseId

    try {
      console.log(
        JSON.stringify({
          event: 'on_case_created',
          caseId,
          category: caseData.category,
          municipality: caseData.muniCode || null,
          ward: caseData.wardId || null,
        })
      )

      // Duplicate assessment (advisory; never blocks / never merges)
      try {
        await dedupeCase({ caseId })
      } catch (dupErr) {
        console.error('dedupe on create failed', dupErr)
      }

      await orchestrateCaseCreatedNotifications(caseId, caseData)
    } catch (error) {
      console.error('Error in onCaseCreated trigger:', error)
      // Allow retry — ledger prevents duplicate sends
      throw error
    }
  })

export const onCaseStatusUpdated = functions
  .region('africa-south1')
  .firestore.document('cases/{caseId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data()
    const afterData = change.after.data()
    const caseId = context.params.caseId

    if (beforeData.status === afterData.status) return

    try {
      console.log(
        JSON.stringify({
          event: 'on_case_status_updated',
          caseId,
          from: beforeData.status,
          to: afterData.status,
        })
      )

      if (afterData.reporterUid) {
        const ledgerId = `${caseId}_status_${afterData.status}`
        const ledgerRef = admin
          .firestore()
          .collection('notification_ledger')
          .doc(ledgerId)
        const existing = await ledgerRef.get()
        if (!existing.exists) {
          await ledgerRef.set({
            caseId,
            type: `status_${afterData.status}`,
            status: 'claimed',
            claimedAt: admin.firestore.FieldValue.serverTimestamp(),
          })
          await sendEmailNotification({
            to: afterData.reporter?.email || '',
            subject: `Case Status Updated: ${caseId}`,
            htmlContent: `<p>Your case ${caseId} status is now <strong>${afterData.status}</strong>.</p>`,
            type: 'status_update',
            data: { caseId, status: afterData.status },
          })
        }
      }

      if (
        (afterData.status === 'IN_PROGRESS' ||
          afterData.status === 'in_progress') &&
        afterData.slaBreach
      ) {
        await slaEngine.checkSLA(caseId)
      }
    } catch (error) {
      console.error('Error in onCaseStatusUpdated trigger:', error)
    }
  })

export const cleanupOldMedia = functions
  .region('africa-south1')
  .pubsub.schedule('every 24 hours')
  .onRun(async (_context) => {
    try {
      const bucket = admin.storage().bucket()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - 365)

      const [files] = await bucket.getFiles({
        prefix: 'cases/',
        maxResults: 1000,
      })

      const oldFiles = files.filter((file) => {
        const metadata = file.metadata
        return (
          metadata &&
          metadata.timeCreated &&
          new Date(metadata.timeCreated) < cutoffDate
        )
      })

      for (const file of oldFiles) {
        await file.delete()
      }
      console.log(`Cleaned up ${oldFiles.length} old media files`)
    } catch (error) {
      console.error('Error in cleanupOldMedia:', error)
    }
  })

export const generateDailyReport = functions
  .region('africa-south1')
  .pubsub.schedule('0 6 * * *')
  .onRun(async (_context) => {
    try {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const analytics = await publicAnalytics({
        data: {
          startDate: yesterday.toISOString(),
          endDate: new Date().toISOString(),
        },
      })
      console.log('Daily report generated:', analytics)
    } catch (error) {
      console.error('Error in generateDailyReport:', error)
    }
  })

export { admin }
