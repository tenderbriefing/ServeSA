import * as admin from 'firebase-admin'
import { setGlobalOptions } from 'firebase-functions/v2'
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https'
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { onObjectFinalized } from 'firebase-functions/v2/storage'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { ZodError } from 'zod'

admin.initializeApp()

import { createCaseCallable, CaseCreationError } from './cases/createCase'
import {
  updateCaseStatusOps,
  assignCaseOps,
  addInternalNoteOps,
  addPublicUpdateOps,
  setOfficialClaimsOps,
  upsertDepartmentOps,
  upsertCategoryDepartmentMapOps,
  OpsError,
} from './cases/municipalityOps'
import {
  reviewDuplicateRecommendationOps,
  unlinkCasesOps,
  citizenConfirmResolutionOps,
  getCitizenTimelineOps,
} from './cases/duplicateReview'
import {
  listSmartWorkQueueOps,
  listSupervisorBoardOps,
  listMapCasesOps,
  listFieldJobsOps,
  startFieldWorkOps,
  proposeFieldCompletionOps,
  searchOpsCasesOps,
} from './cases/opsQueues'
import { runImageIntelligenceForCase } from './intelligence/imageDuplicate'
import { getCaseAnalytics } from './cases/getCaseAnalytics'
import { dedupeCase, getDuplicateCases } from './cases/dedupe'
import {
  processMediaUpload,
  onMediaObjectFinalized,
} from './cases/media'
import { generateCasePDF } from './cases/pdf'

import { georesolveSafe } from './routing/georesolve'
import { reconcileUnresolvedCases } from './routing/reconcileUnresolved'
import { getServiceCategories } from './routing/categories'

import { sendEmailNotification } from './notifications/email'
import { sendPushNotification } from './notifications/push'
import { orchestrateCaseCreatedNotifications } from './notifications/caseCreatedOrchestrator'

import { open311Router } from './open311/router'
import { open311Fanout } from './open311/fanout'

import { capIngest } from './cap/ingest'
import { getCAPAlerts } from './cap/getAlerts'

import { publicAnalytics } from './analytics/public'
import { wardAnalytics } from './analytics/ward'

setGlobalOptions({
  region: 'africa-south1',
  maxInstances: 20,
})

function mapCallableError(error: unknown): never {
  if (error instanceof CaseCreationError) {
    throw new HttpsError(
      error.status === 429 ? 'resource-exhausted' : 'invalid-argument',
      error.message
    )
  }
  if (error instanceof OpsError) {
    const code =
      error.status === 401
        ? 'unauthenticated'
        : error.status === 403
          ? 'permission-denied'
          : error.status === 404
            ? 'not-found'
            : error.status === 409
              ? 'failed-precondition'
              : 'invalid-argument'
    throw new HttpsError(code, error.message)
  }
  if (error instanceof ZodError) {
    throw new HttpsError(
      'invalid-argument',
      error.issues[0]?.message || 'Validation failed'
    )
  }
  console.error('callable error', error)
  throw new HttpsError(
    'internal',
    'Unable to complete request. Please try again.'
  )
}

// Case Management
export const createCaseFunction = onCall(async (request) => {
  try {
    return await createCaseCallable(request.data, request.auth)
  } catch (error) {
    mapCallableError(error)
  }
})

export const updateCaseStatusFunction = onCall(async (request) => {
  try {
    return await updateCaseStatusOps(request.data, {
      uid: request.auth?.uid || '',
      token: (request.auth?.token || null) as Record<string, unknown> | null,
    })
  } catch (error) {
    mapCallableError(error)
  }
})

export const assignCaseFunction = onCall(async (request) => {
  try {
    return await assignCaseOps(request.data, {
      uid: request.auth?.uid || '',
      token: (request.auth?.token || null) as Record<string, unknown> | null,
    })
  } catch (error) {
    mapCallableError(error)
  }
})

export const addInternalNoteFunction = onCall(async (request) => {
  try {
    return await addInternalNoteOps(request.data, {
      uid: request.auth?.uid || '',
      token: (request.auth?.token || null) as Record<string, unknown> | null,
    })
  } catch (error) {
    mapCallableError(error)
  }
})

export const addPublicUpdateFunction = onCall(async (request) => {
  try {
    return await addPublicUpdateOps(request.data, {
      uid: request.auth?.uid || '',
      token: (request.auth?.token || null) as Record<string, unknown> | null,
    })
  } catch (error) {
    mapCallableError(error)
  }
})

export const setOfficialClaimsFunction = onCall(async (request) => {
  try {
    return await setOfficialClaimsOps(request.data, {
      uid: request.auth?.uid || '',
      token: (request.auth?.token || null) as Record<string, unknown> | null,
    })
  } catch (error) {
    mapCallableError(error)
  }
})

export const upsertDepartmentFunction = onCall(async (request) => {
  try {
    return await upsertDepartmentOps(request.data, {
      uid: request.auth?.uid || '',
      token: (request.auth?.token || null) as Record<string, unknown> | null,
    })
  } catch (error) {
    mapCallableError(error)
  }
})

export const upsertCategoryDepartmentMapFunction = onCall(async (request) => {
  try {
    return await upsertCategoryDepartmentMapOps(request.data, {
      uid: request.auth?.uid || '',
      token: (request.auth?.token || null) as Record<string, unknown> | null,
    })
  } catch (error) {
    mapCallableError(error)
  }
})

export const reviewDuplicateFunction = onCall(async (request) => {
  try {
    return await reviewDuplicateRecommendationOps(request.data, {
      uid: request.auth?.uid || '',
      token: (request.auth?.token || null) as Record<string, unknown> | null,
    })
  } catch (error) {
    mapCallableError(error)
  }
})

export const unlinkCasesFunction = onCall(async (request) => {
  try {
    return await unlinkCasesOps(request.data, {
      uid: request.auth?.uid || '',
      token: (request.auth?.token || null) as Record<string, unknown> | null,
    })
  } catch (error) {
    mapCallableError(error)
  }
})

export const citizenConfirmResolutionFunction = onCall(async (request) => {
  try {
    return await citizenConfirmResolutionOps(request.data, {
      uid: request.auth?.uid || '',
      token: (request.auth?.token || null) as Record<string, unknown> | null,
    })
  } catch (error) {
    mapCallableError(error)
  }
})

export const getCitizenTimelineFunction = onCall(async (request) => {
  try {
    return await getCitizenTimelineOps(request.data, {
      uid: request.auth?.uid || '',
      token: (request.auth?.token || null) as Record<string, unknown> | null,
    })
  } catch (error) {
    mapCallableError(error)
  }
})

export const listSmartWorkQueueFunction = onCall(async (request) => {
  try {
    return await listSmartWorkQueueOps(request.data || {}, {
      uid: request.auth?.uid || '',
      token: (request.auth?.token || null) as Record<string, unknown> | null,
    })
  } catch (error) {
    mapCallableError(error)
  }
})

export const listSupervisorBoardFunction = onCall(async (request) => {
  try {
    return await listSupervisorBoardOps(request.data || {}, {
      uid: request.auth?.uid || '',
      token: (request.auth?.token || null) as Record<string, unknown> | null,
    })
  } catch (error) {
    mapCallableError(error)
  }
})

export const listMapCasesFunction = onCall(async (request) => {
  try {
    return await listMapCasesOps(request.data || {}, {
      uid: request.auth?.uid || '',
      token: (request.auth?.token || null) as Record<string, unknown> | null,
    })
  } catch (error) {
    mapCallableError(error)
  }
})

export const listFieldJobsFunction = onCall(async (request) => {
  try {
    return await listFieldJobsOps(request.data || {}, {
      uid: request.auth?.uid || '',
      token: (request.auth?.token || null) as Record<string, unknown> | null,
    })
  } catch (error) {
    mapCallableError(error)
  }
})

export const startFieldWorkFunction = onCall(async (request) => {
  try {
    return await startFieldWorkOps(request.data, {
      uid: request.auth?.uid || '',
      token: (request.auth?.token || null) as Record<string, unknown> | null,
    })
  } catch (error) {
    mapCallableError(error)
  }
})

export const proposeFieldCompletionFunction = onCall(async (request) => {
  try {
    return await proposeFieldCompletionOps(request.data, {
      uid: request.auth?.uid || '',
      token: (request.auth?.token || null) as Record<string, unknown> | null,
    })
  } catch (error) {
    mapCallableError(error)
  }
})

export const searchOpsCasesFunction = onCall(async (request) => {
  try {
    return await searchOpsCasesOps(request.data || {}, {
      uid: request.auth?.uid || '',
      token: (request.auth?.token || null) as Record<string, unknown> | null,
    })
  } catch (error) {
    mapCallableError(error)
  }
})

export const runImageIntelligenceFunction = onCall(
  { memory: '1GiB', timeoutSeconds: 180 },
  async (request) => {
    try {
      const token = request.auth?.token as Record<string, unknown> | undefined
      const roles = (token?.roles as string[] | undefined) || []
      if (!request.auth || !roles.some((r) => r === 'admin' || r === 'official' || r === 'moderator')) {
        throw new HttpsError('permission-denied', 'Official role required')
      }
      const caseId = String(request.data?.caseId || '')
      if (!caseId) throw new HttpsError('invalid-argument', 'caseId required')
      await runImageIntelligenceForCase(caseId)
      return { success: true, caseId }
    } catch (error) {
      mapCallableError(error)
    }
  }
)

export const getCaseAnalyticsFunction = onCall(async (request) => {
  return await getCaseAnalytics(request.data)
})

export const dedupeCaseFunction = onCall(async (request) => {
  return await dedupeCase(request.data)
})

export const getDuplicateCasesFunction = onCall(async (request) => {
  return await getDuplicateCases(request.data.caseId)
})

/** Client callable for base64 media upload after durable case creation */
export const uploadMediaFunction = onCall(
  { memory: '1GiB', timeoutSeconds: 180 },
  async (request) => {
    return await processMediaUpload({
      caseId: request.data.caseId,
      files: request.data.files || [],
      userId: request.auth?.uid,
    })
  }
)

/** Storage finalisation — idempotent metadata only */
export const processMediaUploadFunction = onObjectFinalized(
  {
    bucket: 'servesa-aad53.firebasestorage.app',
    memory: '512MiB',
  },
  async (event) => {
    await onMediaObjectFinalized(event.data)
  }
)

export const generateCasePDFFunction = onCall(async (request) => {
  return await generateCasePDF(request.data)
})

export const georesolveFunction = onCall(async (request) => {
  const { lat, lng } = request.data
  return await georesolveSafe(lat, lng)
})

/** Admin/ops only: bounded reconciliation of routingPending cases. Default dry-run. */
export const reconcileUnresolvedRoutingFunction = onCall(async (request) => {
  const token = request.auth?.token as Record<string, unknown> | undefined
  const roles = (token?.roles as string[] | undefined) || []
  if (!request.auth || !roles.some((r) => r === 'admin' || r === 'ops')) {
    throw new HttpsError('permission-denied', 'Admin or ops role required')
  }
  return await reconcileUnresolvedCases({
    limit: request.data?.limit,
    dryRun: request.data?.dryRun !== false,
    cursorCaseId: request.data?.cursorCaseId,
  })
})

export const getServiceCategoriesFunction = onCall(async (request) => {
  return await getServiceCategories(request.data)
})

export const sendEmailNotificationFunction = onCall(async (request) => {
  return await sendEmailNotification(request.data)
})

export const sendPushNotificationFunction = onCall(async (request) => {
  return await sendPushNotification(request.data)
})

// SLA breach engine intentionally NOT deployed until case-creation receives PASS.

export const open311RouterFunction = onRequest(async (req, res) => {
  await open311Router({ req, res })
})

export const open311FanoutFunction = onCall(async (request) => {
  return await open311Fanout(request.data)
})

export const ingestCAPAlertsFunction = onSchedule(
  {
    schedule: 'every 15 minutes',
    region: 'europe-west1',
    timeZone: 'Africa/Johannesburg',
  },
  async () => {
    await capIngest({})
  }
)

export const getCAPAlertsFunction = onCall(async (request) => {
  return await getCAPAlerts(request.data)
})

export const getPublicAnalyticsFunction = onCall(async (request) => {
  return await publicAnalytics(request.data)
})

export const getWardAnalyticsFunction = onCall(async (request) => {
  return await wardAnalytics(request.data)
})

export const api = onRequest((req, res) => {
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
        platform: 'gcfv2',
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
export const onCaseCreated = onDocumentCreated(
  'cases/{caseId}',
  async (event) => {
    const snap = event.data
    if (!snap) return
    const caseData = snap.data()
    const caseId = event.params.caseId

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

      try {
        await dedupeCase({ caseId })
      } catch (dupErr) {
        console.error('dedupe on create failed', dupErr)
      }

      await orchestrateCaseCreatedNotifications(caseId, caseData)
    } catch (error) {
      console.error('Error in onCaseCreated trigger:', error)
      throw error
    }
  }
)

export const onCaseStatusUpdated = onDocumentUpdated(
  'cases/{caseId}',
  async (event) => {
    const beforeData = event.data?.before.data()
    const afterData = event.data?.after.data()
    const caseId = event.params.caseId
    if (!beforeData || !afterData) return
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
    } catch (error) {
      console.error('Error in onCaseStatusUpdated trigger:', error)
    }
  }
)

export const cleanupOldMedia = onSchedule(
  {
    schedule: 'every 24 hours',
    region: 'europe-west1',
    timeZone: 'Africa/Johannesburg',
  },
  async () => {
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

export const generateDailyReport = onSchedule(
  {
    schedule: '0 6 * * *',
    region: 'europe-west1',
    timeZone: 'Africa/Johannesburg',
  },
  async () => {
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
