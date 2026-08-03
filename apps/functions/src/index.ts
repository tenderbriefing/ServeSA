import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

// Initialize Firebase Admin
admin.initializeApp()

// Import function modules
import { createCase } from './cases/createCase'
import { updateCaseStatus } from './cases/updateCaseStatus'
import { getCaseAnalytics } from './cases/getCaseAnalytics'
import { dedupeCase } from './cases/dedupe'
import { processMediaUpload } from './cases/media'
import { generateCasePDF } from './cases/pdf'

import { georesolve } from './routing/georesolve'
import { getServiceCategories } from './routing/categories'

import { sendEmailNotification } from './notifications/email'
import { sendPushNotification } from './notifications/push'
import { slaEngine } from './notifications/slaEngine'

import { open311Router } from './open311/router'
import { open311Fanout } from './open311/fanout'

import { capIngest } from './cap/ingest'
import { getCAPAlerts } from './cap/getAlerts'

import { publicAnalytics } from './analytics/public'
import { wardAnalytics } from './analytics/ward'

// Case Management Functions
export const createCaseFunction = functions
  .region('africa-south1')
  .https.onCall(async (data: any, context: any) => {
    return await createCase(data, context.auth?.token);
  })

export const updateCaseStatusFunction = functions
  .region('africa-south1')
  .https.onCall(async (data: any, _context: any) => {
    return await updateCaseStatus(data);
  })

export const getCaseAnalyticsFunction = functions
  .region('africa-south1')
  .https.onCall(async (data: any, _context: any) => {
    return await getCaseAnalytics(data);
  })

export const dedupeCaseFunction = functions
  .region('africa-south1')
  .https.onCall(async (data: any, _context: any) => {
    return await dedupeCase(data);
  })

// Media Processing Functions
export const processMediaUploadFunction = functions
  .region('africa-south1')
  .storage.object()
  .onFinalize(processMediaUpload)

export const generateCasePDFFunction = functions
  .region('africa-south1')
  .https.onCall(generateCasePDF)

// Routing Functions
export const georesolveFunction = functions
  .region('africa-south1')
  .https.onCall(async (data: any, _context: any) => {
    const { lat, lng } = data;
    return await georesolve(lat, lng);
  })

export const getServiceCategoriesFunction = functions
  .region('africa-south1')
  .https.onCall(async (data: any, _context: any) => {
    return await getServiceCategories(data);
  })

// Notification Functions
export const sendEmailNotificationFunction = functions
  .region('africa-south1')
  .https.onCall(async (data: any, _context: any) => {
    return await sendEmailNotification(data);
  })

export const sendPushNotificationFunction = functions
  .region('africa-south1')
  .https.onCall(async (data: any, _context: any) => {
    return await sendPushNotification(data);
  })

export const slaEngineFunction = functions
  .region('africa-south1')
  .pubsub.schedule('every 5 minutes')
  .onRun(async (_context: any) => {
    return await slaEngine.checkSLA('all');
  })

// Open311 Functions
export const open311RouterFunction = functions
  .region('africa-south1')
  .https.onRequest(async (req: any, res: any) => {
    await open311Router({ req, res });
  })

export const open311FanoutFunction = functions
  .region('africa-south1')
  .https.onCall(async (data: any, _context: any) => {
    return await open311Fanout(data);
  })

// CAP Alert Functions
export const ingestCAPAlertsFunction = functions
  .region('africa-south1')
  .pubsub.schedule('every 15 minutes')
  .onRun(async (_context: any) => {
    return await capIngest({});
  })

export const getCAPAlertsFunction = functions
  .region('africa-south1')
  .https.onCall(async (data: any, _context: any) => {
    return await getCAPAlerts(data);
  })

// Analytics Functions
export const getPublicAnalyticsFunction = functions
  .region('africa-south1')
  .https.onCall(async (data: any, _context: any) => {
    return await publicAnalytics(data);
  })

export const getWardAnalyticsFunction = functions
  .region('africa-south1')
  .https.onCall(async (data: any, _context: any) => {
    return await wardAnalytics(data);
  })

// HTTP API Functions
export const api = functions
  .region('africa-south1')
  .https.onRequest((req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    // Route API requests
    const path = req.path


    switch (path) {
      case '/api/health':
        res.json({ status: 'healthy', timestamp: new Date().toISOString() })
        break
      
      case '/api/version':
        res.json({ 
          version: '1.0.0',
          region: 'africa-south1',
          environment: process.env.NODE_ENV || 'production'
        })
        break
      
      default:
        res.status(404).json({ error: 'Not found' })
    }
  })

// Firestore Triggers
export const onCaseCreated = functions
  .region('africa-south1')
  .firestore.document('cases/{caseId}')
  .onCreate(async (snap, context) => {
    const caseData = snap.data()
    const caseId = context.params.caseId

    try {
      // Log case creation
      console.log(`Case created: ${caseId}`, {
        category: caseData.category,
        municipality: caseData.muniCode,
        ward: caseData.wardId,
        severity: caseData.severity
      })

      // Trigger deduplication
      await dedupeCase({ data: { caseId } })

      // Send acknowledgment notification
      if (caseData.reporterUid) {
        await sendEmailNotification({
          data: {
            userId: caseData.reporterUid,
            type: 'case_acknowledged',
            caseId: caseId,
            title: 'Case Acknowledged',
            body: `Your case #${caseId} has been received and is being processed.`
          }
        })
      }

    } catch (error) {
      console.error('Error in onCaseCreated trigger:', error)
    }
  })

export const onCaseStatusUpdated = functions
  .region('africa-south1')
  .firestore.document('cases/{caseId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data()
    const afterData = change.after.data()
    const caseId = context.params.caseId

    // Check if status changed
    if (beforeData.status !== afterData.status) {
      try {
        console.log(`Case status updated: ${caseId}`, {
          from: beforeData.status,
          to: afterData.status
        })

        // Send status update notification
        if (afterData.reporterUid) {
          await sendEmailNotification({
            data: {
              userId: afterData.reporterUid,
              type: 'case_status_updated',
              caseId: caseId,
              title: 'Case Status Updated',
              body: `Your case #${caseId} status has been updated to ${afterData.status}.`
            }
          })
        }

        // Check for SLA breach
        if (afterData.status === 'IN_PROGRESS' && afterData.sla?.breached) {
          await slaEngine.checkSLA(caseId)
        }

      } catch (error) {
        console.error('Error in onCaseStatusUpdated trigger:', error)
      }
    }
  })

// Scheduled Functions
export const cleanupOldMedia = functions
  .region('africa-south1')
  .pubsub.schedule('every 24 hours')
  .onRun(async (_context) => {
    try {
      const bucket = admin.storage().bucket()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - 365) // 1 year

      const [files] = await bucket.getFiles({
        prefix: 'cases/',
        maxResults: 1000
      })

      const oldFiles = files.filter(file => {
        const metadata = file.metadata
        return metadata && metadata.timeCreated && new Date(metadata.timeCreated) < cutoffDate
      })

      for (const file of oldFiles) {
        await file.delete()
        console.log(`Deleted old file: ${file.name}`)
      }

      console.log(`Cleaned up ${oldFiles.length} old media files`)
    } catch (error) {
      console.error('Error in cleanupOldMedia:', error)
    }
  })

export const generateDailyReport = functions
  .region('africa-south1')
  .pubsub.schedule('0 6 * * *') // Daily at 6 AM
  .onRun(async (_context) => {
    try {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const analytics = await publicAnalytics({
        data: {
          startDate: yesterday.toISOString(),
          endDate: new Date().toISOString()
        }
      })

      // Send daily report to administrators
      console.log('Daily report generated:', analytics)
      
      // TODO: Send email report to administrators
      
    } catch (error) {
      console.error('Error in generateDailyReport:', error)
    }
  })

// Export admin for use in other modules
export { admin }
