/**
 * ServeSA: Production case creation
 * Canonical contract: @servesa/case-contract
 */

import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { ZodError } from 'zod'
import {
  CreateCaseInputSchema,
  calculateSlaFields,
  CASE_CONTRACT_VERSION,
  CONSENT_POLICY_VERSION,
  type CreateCaseInput,
  type CreateCaseResponse,
  type GeoresolutionStatus,
} from '@servesa/case-contract'
import { georesolveSafe } from '../routing/georesolve'
import { resolveDepartmentRouting } from '../routing/departmentRouting'
import { caseCreationLimiter } from '../utils/rateLimit'
import { logCaseTelemetry } from '../telemetry/caseEvents'

const db = getFirestore()
const auth = getAuth()

const WEB_APP_URL = process.env.WEB_APP_URL || 'https://servesa-aad53.web.app'

export class CaseCreationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 400
  ) {
    super(message)
    this.name = 'CaseCreationError'
  }
}

function generateCaseId(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `CASE-${timestamp}-${random}`
}

function publicErrorMessage(error: unknown): { message: string; code: string; status: number } {
  if (error instanceof CaseCreationError) {
    return { message: error.message, code: error.code, status: error.status }
  }
  if (error instanceof ZodError) {
    const first = error.issues[0]
    return {
      message: first?.message || 'Validation failed',
      code: 'validation_failed',
      status: 400,
    }
  }
  return {
    message: 'Unable to create case. Please try again.',
    code: 'internal_error',
    status: 500,
  }
}

/**
 * Create a case with idempotency, georesolution, SLA, and atomic event write.
 * Notifications are owned by onCaseCreated (not duplicated here).
 */
export async function createCase(
  rawData: unknown,
  options: {
    authUid?: string
    authTokenValid?: boolean
    anonymousSessionId?: string
  } = {}
): Promise<CreateCaseResponse> {
  const started = Date.now()
  let clientRequestId: string | undefined

  try {
    const parsed = CreateCaseInputSchema.parse(rawData) as CreateCaseInput
    clientRequestId = parsed.clientRequestId

    const rateKey =
      options.authUid ||
      options.anonymousSessionId ||
      parsed.reporter.email ||
      parsed.reporter.phone ||
      parsed.clientRequestId

    const rate = await caseCreationLimiter.checkRateLimit(`create:${rateKey}`)
    if (!rate.allowed) {
      throw new CaseCreationError(
        'Too many reports submitted. Please wait a moment and try again.',
        'rate_limited',
        429
      )
    }

    // Idempotency: return existing case for same clientRequestId + identity
    const identityKey = options.authUid || `anon:${options.anonymousSessionId || parsed.reporter.email || parsed.reporter.phone || 'unknown'}`
    const idempotencyDocId = `${parsed.clientRequestId}_${identityKey}`.replace(/[/\\]/g, '_')
    const idempotencyRef = db.collection('case_idempotency').doc(idempotencyDocId)
    const existingIdempotency = await idempotencyRef.get()

    if (existingIdempotency.exists) {
      const existing = existingIdempotency.data()
      if (existing?.response) {
        logCaseTelemetry('case_create_idempotent_hit', {
          caseId: existing.response.caseId,
          clientRequestId: parsed.clientRequestId,
        })
        return existing.response as CreateCaseResponse
      }
    }

    const geo = await georesolveSafe(parsed.latitude, parsed.longitude)
    const deptRouting = await resolveDepartmentRouting({
      georesolutionStatus: geo.status,
      municipalityId: geo.municipalityId,
      category: parsed.category,
    })

    let municipalitySla: any = null
    if (geo.municipalityId) {
      const muniDoc = await db.collection('municipalities').doc(geo.municipalityId).get()
      municipalitySla = muniDoc.exists ? muniDoc.data()?.slaConfig : null
    }

    const slaStartedAt = new Date()
    const sla = calculateSlaFields(
      parsed.category,
      parsed.priority,
      municipalitySla,
      slaStartedAt
    )

    const caseId = generateCaseId()
    const reference = caseId
    const shareUrl = `${WEB_APP_URL}/case/${caseId}`
    const mediaUploadPath = `cases/${caseId}/media`
    // Authoritative routing only on unique polygon_match; ambiguous/unresolved stay pending.
    const routingPending = geo.status !== 'polygon_match'
    const status = 'submitted' as const

    const reporterUid = options.authUid || null
    const isAnonymous = !options.authUid

    const caseDoc = {
      caseId,
      reference,
      title: parsed.title,
      description: parsed.description,
      category: parsed.category,
      subcategory: parsed.subcategory || null,
      priority: parsed.priority,
      status,
      // Align with security rules
      reporterUid: reporterUid,
      anonymousSessionId: isAnonymous
        ? options.anonymousSessionId || parsed.clientRequestId
        : null,
      reporter: {
        name: parsed.reporter.name,
        // Contact fields are private — never mirrored to analytics/events
        email: parsed.reporter.email || null,
        phone: parsed.reporter.phone || null,
      },
      location: {
        lat: parsed.latitude,
        lng: parsed.longitude,
        address: parsed.address || null,
        source: parsed.locationSource,
        wardId: geo.wardId || null,
        wardName: geo.wardName || null,
        wardNumber: geo.wardNumber || null,
        municipalityId: geo.municipalityId || null,
        municipalityName: geo.municipalityName || null,
        districtCode: geo.districtCode || null,
        districtName: geo.districtName || null,
        province: geo.province || null,
        // Rules also check muniCode
        muniCode: geo.municipalityId || null,
      },
      muniCode: geo.municipalityId || null,
      wardId: geo.wardId || null,
      georesolution: {
        status: geo.status as GeoresolutionStatus,
        confidence: geo.confidence,
        method: geo.method,
        cached: geo.cached,
        datasetVersion: geo.datasetVersion || null,
        boundaryCycle: geo.boundaryCycle || null,
        resolvedAt: geo.resolvedAt || null,
        routingSource: geo.routingSource || 'none',
        candidateCount: geo.candidateCount || 0,
        failureReason: geo.failureReason || null,
      },
      routingManualOverride: false,
      triageQueue: deptRouting.triageQueue,
      assignedDepartment: deptRouting.assignedDepartment,
      assignedDepartmentName: deptRouting.departmentName,
      departmentRouting: {
        status: deptRouting.departmentRoutingStatus,
        mappingSource: deptRouting.mappingSource,
      },
      sla: {
        targetHours: sla.targetHours,
        slaStartedAt: Timestamp.fromDate(sla.slaStartedAt),
        slaTarget: Timestamp.fromDate(sla.slaTarget),
        slaBreach: false,
        policyVersion: sla.policyVersion,
      },
      // Flat fields for legacy readers / SLA engine compatibility
      slaTarget: Timestamp.fromDate(sla.slaTarget),
      slaBreach: false,
      targetHours: sla.targetHours,
      slaStartedAt: Timestamp.fromDate(sla.slaStartedAt),
      slaPolicyVersion: sla.policyVersion,
      clientRequestId: parsed.clientRequestId,
      contractVersion: CASE_CONTRACT_VERSION,
      consent: {
        dataProcessing: true,
        communications: parsed.consent.communications === true,
        policyVersion: CONSENT_POLICY_VERSION,
        consentedAt: FieldValue.serverTimestamp(),
      },
      media: {
        status: 'none',
        count: 0,
        paths: [],
      },
      duplicateAssessment: {
        status: 'pending',
        candidateCaseIds: [],
        confidence: null,
        reasoning: null,
      },
      notifications: {
        citizenAck: 'pending',
        officialAlert: 'pending',
      },
      routingPending,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: reporterUid || 'anonymous',
      updatedBy: reporterUid || 'anonymous',
    }

    const eventDoc = {
      caseId,
      eventType: 'case_created',
      description: 'Case submitted',
      // No PII in events
      actorType: isAnonymous ? 'anonymous' : 'citizen',
      actorUid: reporterUid,
      timestamp: FieldValue.serverTimestamp(),
      metadata: {
        category: parsed.category,
        subcategory: parsed.subcategory || null,
        priority: parsed.priority,
        wardId: geo.wardId || null,
        municipalityId: geo.municipalityId || null,
        georesolutionStatus: geo.status,
        locationSource: parsed.locationSource,
        routingPending,
        datasetVersion: geo.datasetVersion || null,
        routingSource: geo.routingSource || 'none',
      },
    }

    const routingEventDoc = {
      caseId,
      eventType: 'routing_resolution',
      description:
        geo.status === 'polygon_match'
          ? 'Authoritative GIS ward resolution'
          : geo.status === 'ambiguous'
            ? 'Ambiguous GIS ward candidates'
            : 'GIS ward resolution pending',
      actorType: 'system',
      actorUid: null,
      timestamp: FieldValue.serverTimestamp(),
      metadata: {
        georesolutionStatus: geo.status,
        method: geo.method,
        wardId: geo.wardId || null,
        municipalityId: geo.municipalityId || null,
        province: geo.province || null,
        datasetVersion: geo.datasetVersion || null,
        boundaryCycle: geo.boundaryCycle || null,
        routingSource: geo.routingSource || 'none',
        candidateCount: geo.candidateCount || 0,
        failureReason: geo.failureReason || null,
        routingPending,
      },
    }

    const response: CreateCaseResponse = {
      caseId,
      reference,
      shareUrl,
      status,
      ...(geo.municipalityId
        ? {
            municipality: {
              id: geo.municipalityId,
              name: geo.municipalityName || geo.municipalityId,
            },
          }
        : {}),
      ...(geo.wardId
        ? {
            ward: {
              id: geo.wardId,
              name: geo.wardName || undefined,
              number: geo.wardNumber || geo.wardId,
            },
          }
        : {}),
      slaTarget: sla.slaTarget.toISOString(),
      targetHours: sla.targetHours,
      georesolutionStatus: geo.status,
      mediaUploadPath,
      routingPending,
      duplicateAssessment: { status: 'pending' },
    }

    // Firestore rejects `undefined` — persist a JSON-safe copy for idempotency.
    const idempotentResponse = JSON.parse(
      JSON.stringify(response)
    ) as CreateCaseResponse

    await db.runTransaction(async (tx) => {
      const again = await tx.get(idempotencyRef)
      if (again.exists && again.data()?.response) {
        Object.assign(response, again.data()!.response)
        return
      }

      const caseRef = db.collection('cases').doc(caseId)
      const eventRef = caseRef.collection('events').doc()
      const routingEventRef = caseRef.collection('events').doc()

      tx.set(caseRef, caseDoc)
      tx.set(eventRef, eventDoc)
      tx.set(routingEventRef, routingEventDoc)
      // Also write top-level case_events for existing consumers (no PII)
      const topLevelEventRef = db.collection('case_events').doc()
      tx.set(topLevelEventRef, eventDoc)
      const topLevelRoutingRef = db.collection('case_events').doc()
      tx.set(topLevelRoutingRef, routingEventDoc)
      tx.set(idempotencyRef, {
        clientRequestId: parsed.clientRequestId,
        identityKey,
        caseId,
        response: idempotentResponse,
        createdAt: FieldValue.serverTimestamp(),
      })
    })

    logCaseTelemetry('case_created', {
      caseId,
      category: parsed.category,
      priority: parsed.priority,
      georesolutionStatus: geo.status,
      routingPending,
      latencyMs: Date.now() - started,
      authenticated: Boolean(options.authUid),
    })

    return response
  } catch (error) {
    const pub = publicErrorMessage(error)
    logCaseTelemetry('case_creation_failed', {
      code: pub.code,
      clientRequestId,
      latencyMs: Date.now() - started,
    })
    if (error instanceof CaseCreationError || error instanceof ZodError) {
      throw new CaseCreationError(pub.message, pub.code, pub.status)
    }
    console.error('createCase unexpected error', error)
    throw new CaseCreationError(pub.message, pub.code, pub.status)
  }
}

/**
 * Callable adapter — uses Firebase Auth context correctly (uid, not token object).
 */
export async function createCaseCallable(
  data: unknown,
  authContext?: { uid: string; token?: unknown } | null
): Promise<CreateCaseResponse> {
  return createCase(data, {
    authUid: authContext?.uid,
    authTokenValid: Boolean(authContext?.uid),
    anonymousSessionId:
      data && typeof data === 'object' && 'anonymousSessionId' in (data as any)
        ? String((data as any).anonymousSessionId)
        : undefined,
  })
}

/** HTTP helper kept for compatibility */
export const createCaseHttp = async (req: any, res: any) => {
  try {
    let authUid: string | undefined
    const header = req.headers.authorization
    if (header?.startsWith('Bearer ')) {
      try {
        const decoded = await auth.verifyIdToken(header.slice(7))
        authUid = decoded.uid
      } catch {
        // proceed anonymous
      }
    }

    const result = await createCase(req.body, {
      authUid,
      anonymousSessionId: req.headers['x-anonymous-session'] as string | undefined,
    })
    res.json({ success: true, data: result })
  } catch (error) {
    const pub = publicErrorMessage(error)
    res.status(pub.status).json({ error: pub.message, code: pub.code })
  }
}
