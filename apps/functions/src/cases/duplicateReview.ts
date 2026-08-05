/**
 * Official duplicate review + controlled link/merge — never auto-merge.
 * Does not modify GIS fields. Preserves all source case records.
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { logCaseTelemetry } from '../telemetry/caseEvents'
import {
  OpsError,
  assertOfficial,
  type AuthCtx,
} from './municipalityOpsShared'

const db = getFirestore()

async function loadCase(caseId: string) {
  const ref = db.collection('cases').doc(caseId)
  const snap = await ref.get()
  if (!snap.exists) throw new OpsError('Case not found', 'not_found', 404)
  return { ref, data: snap.data()!, id: caseId }
}

function assertSameMunicipality(
  caseData: Record<string, any>,
  ctx: ReturnType<typeof assertOfficial>
) {
  if (ctx.isAdmin) return
  const caseMuni = caseData.muniCode || caseData.location?.municipalityId
  if (!caseMuni || caseMuni !== ctx.muniCode) {
    throw new OpsError('Not authorised for this municipality', 'permission_denied', 403)
  }
}

async function appendEvent(
  caseId: string,
  eventType: string,
  description: string,
  actorUid: string,
  metadata: Record<string, unknown>,
  actorType: string = 'official'
) {
  const payload = {
    caseId,
    eventType,
    description,
    actorType,
    actorUid,
    timestamp: FieldValue.serverTimestamp(),
    metadata,
  }
  const batch = db.batch()
  batch.set(db.collection('cases').doc(caseId).collection('events').doc(), payload)
  batch.set(db.collection('case_events').doc(), payload)
  await batch.commit()
}

export type DuplicateDecision =
  | 'link_same_incident'
  | 'merge_operational'
  | 'keep_separate'
  | 'dismiss'
  | 'flag_image_reuse'
  | 'request_review'

/**
 * Official reviews a duplicate recommendation. Never auto-merges.
 */
export async function reviewDuplicateRecommendationOps(
  raw: {
    caseId: string
    decision: DuplicateDecision
    targetCaseId?: string
    reason?: string
  },
  ctx: AuthCtx
) {
  const official = assertOfficial(ctx)
  const { ref, data } = await loadCase(raw.caseId)
  assertSameMunicipality(data, official)

  const decision = raw.decision
  if (!decision) throw new OpsError('decision is required', 'validation_failed')

  if (
    (decision === 'link_same_incident' || decision === 'merge_operational') &&
    !raw.targetCaseId
  ) {
    throw new OpsError('targetCaseId required for link/merge', 'validation_failed')
  }

  let target: Awaited<ReturnType<typeof loadCase>> | null = null
  if (raw.targetCaseId) {
    target = await loadCase(raw.targetCaseId)
    assertSameMunicipality(target.data, official)
    const a = data.muniCode || data.location?.municipalityId
    const b = target.data.muniCode || target.data.location?.municipalityId
    if (a && b && a !== b) {
      throw new OpsError(
        'Cross-municipality linking denied',
        'permission_denied',
        403
      )
    }
  }

  const reviewUpdate: Record<string, unknown> = {
    'duplicateReview.status': 'decided',
    'duplicateReview.decision': decision,
    'duplicateReview.decidedBy': ctx.uid,
    'duplicateReview.decidedAt': FieldValue.serverTimestamp(),
    'duplicateReview.decisionReason': raw.reason || null,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: ctx.uid,
  }

  if (decision === 'dismiss' || decision === 'keep_separate') {
    await ref.update(reviewUpdate)
    await appendEvent(
      raw.caseId,
      'duplicate_recommendation_dismissed',
      `Duplicate recommendation: ${decision}`,
      ctx.uid,
      { decision, reason: raw.reason || null, targetCaseId: raw.targetCaseId || null }
    )
    logCaseTelemetry('duplicate_dismissed', { caseId: raw.caseId, decision })
    return { success: true, decision, linked: false }
  }

  if (decision === 'flag_image_reuse') {
    await ref.update({
      ...reviewUpdate,
      'duplicateReview.anomaly': true,
      'duplicateReview.anomalyStatus': 'review_required',
    })
    await appendEvent(
      raw.caseId,
      'suspected_image_reuse_flagged',
      'Suspected image reuse flagged for review',
      ctx.uid,
      { reason: raw.reason || null, targetCaseId: raw.targetCaseId || null }
    )
    return { success: true, decision, linked: false }
  }

  if (decision === 'request_review') {
    await ref.update({
      ...reviewUpdate,
      'duplicateReview.status': 'escalated',
    })
    await appendEvent(
      raw.caseId,
      'duplicate_review_requested',
      'Duplicate review escalated',
      ctx.uid,
      { reason: raw.reason || null }
    )
    return { success: true, decision, linked: false }
  }

  // link or operational merge — preserve both cases
  const primaryId = raw.targetCaseId!
  const secondaryId = raw.caseId
  const primary = target!

  const linkedIds = new Set<string>([
    ...(primary.data.incidentLink?.linkedCaseIds || []),
    ...(data.incidentLink?.linkedCaseIds || []),
    secondaryId,
    primaryId,
  ])
  linkedIds.delete(primaryId)

  const operationalMerge = decision === 'merge_operational'

  await primary.ref.update({
    incidentLink: {
      primaryCaseId: primaryId,
      linkedCaseIds: Array.from(linkedIds),
      role: 'primary',
      operationalMerge,
      linkedAt: new Date().toISOString(),
      linkedBy: ctx.uid,
    },
    updatedAt: FieldValue.serverTimestamp(),
  })

  await ref.update({
    ...reviewUpdate,
    incidentLink: {
      primaryCaseId: primaryId,
      linkedCaseIds: Array.from(linkedIds),
      role: operationalMerge ? 'merged_support' : 'linked_support',
      operationalMerge,
      linkedAt: new Date().toISOString(),
      linkedBy: ctx.uid,
    },
    // Operational merge prevents independent assignment spam; keeps record
    operationalLocked: operationalMerge,
  })

  const eventType = operationalMerge ? 'cases_operationally_merged' : 'cases_linked'
  await appendEvent(secondaryId, eventType, `Linked to primary ${primaryId}`, ctx.uid, {
    primaryCaseId: primaryId,
    decision,
    reason: raw.reason || null,
  })
  await appendEvent(primaryId, eventType, `Linked supporting case ${secondaryId}`, ctx.uid, {
    supportingCaseId: secondaryId,
    decision,
    reason: raw.reason || null,
  })

  // One safe public update on each case (dedupe via ledger key)
  const linkMsg =
    'Your report appears to relate to an existing incident. It has been linked so that you can receive progress updates.'
  for (const cid of [primaryId, secondaryId]) {
    const ledgerId = `link_notice_${primaryId}_${cid}`
    const ledgerRef = db.collection('notification_ledger').doc(ledgerId)
    const existing = await ledgerRef.get()
    if (existing.exists) continue
    await db.collection('cases').doc(cid).collection('public_updates').add({
      body: linkMsg,
      createdBy: ctx.uid,
      createdAt: FieldValue.serverTimestamp(),
      visibility: 'citizen',
      kind: 'incident_linked',
    })
    await ledgerRef.set({
      type: 'incident_link_notice',
      caseId: cid,
      primaryCaseId: primaryId,
      createdAt: FieldValue.serverTimestamp(),
    })
  }

  logCaseTelemetry(eventType, {
    primaryCaseId: primaryId,
    supportingCaseId: secondaryId,
    decision,
  })

  return {
    success: true,
    decision,
    linked: true,
    primaryCaseId: primaryId,
    supportingCaseId: secondaryId,
  }
}

export async function unlinkCasesOps(
  raw: { caseId: string; reason?: string },
  ctx: AuthCtx
) {
  const official = assertOfficial(ctx)
  const roles = official.roles
  if (!official.isAdmin && !roles.includes('moderator')) {
    throw new OpsError('Unlink requires manager role', 'permission_denied', 403)
  }
  const { ref, data } = await loadCase(raw.caseId)
  assertSameMunicipality(data, official)
  const primaryId = data.incidentLink?.primaryCaseId
  if (!primaryId) {
    throw new OpsError('Case is not linked', 'validation_failed')
  }

  await ref.update({
    incidentLink: {
      primaryCaseId: null,
      linkedCaseIds: [],
      role: 'standalone',
    },
    operationalLocked: false,
    updatedAt: FieldValue.serverTimestamp(),
  })
  await appendEvent(raw.caseId, 'cases_unlinked', 'Incident link removed', ctx.uid, {
    previousPrimary: primaryId,
    reason: raw.reason || null,
  })

  if (primaryId !== raw.caseId) {
    const primary = await loadCase(primaryId)
    const remaining = (primary.data.incidentLink?.linkedCaseIds || []).filter(
      (id: string) => id !== raw.caseId
    )
    await primary.ref.update({
      'incidentLink.linkedCaseIds': remaining,
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  return { success: true, caseId: raw.caseId }
}

/**
 * Citizen confirms resolution or reports still unresolved (reopen path).
 */
export async function citizenConfirmResolutionOps(
  raw: {
    caseId: string
    confirmed: boolean
    reason?: string
    rating?: number
  },
  ctx: AuthCtx
) {
  if (!ctx.uid) throw new OpsError('Authentication required', 'unauthenticated', 401)
  const { ref, data } = await loadCase(raw.caseId)

  if (data.reporterUid && data.reporterUid !== ctx.uid) {
    throw new OpsError('Not your case', 'permission_denied', 403)
  }
  if (!data.reporterUid) {
    throw new OpsError(
      'Anonymous cases require contact verification for confirmation',
      'permission_denied',
      403
    )
  }
  if (data.status !== 'resolved') {
    throw new OpsError('Case must be resolved before confirmation', 'validation_failed', 409)
  }

  if (raw.confirmed) {
    await ref.update({
      status: 'citizen_confirmed',
      citizenConfirmedAt: FieldValue.serverTimestamp(),
      citizenConfirmation: {
        confirmed: true,
        reason: raw.reason || null,
        rating:
          typeof raw.rating === 'number' && raw.rating >= 1 && raw.rating <= 5
            ? raw.rating
            : null,
        at: new Date().toISOString(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    })
    await appendEvent(
      raw.caseId,
      'citizen_confirmed_resolution',
      'Citizen confirmed resolution',
      ctx.uid,
      { rating: raw.rating || null },
      'citizen'
    )
    return { success: true, status: 'citizen_confirmed' }
  }

  // Still unresolved → reopen to acknowledged
  await ref.update({
    status: 'acknowledged',
    citizenConfirmation: {
      confirmed: false,
      reason: raw.reason || 'Issue still unresolved',
      at: new Date().toISOString(),
    },
    reopenedAt: FieldValue.serverTimestamp(),
    reopenedBy: ctx.uid,
    updatedAt: FieldValue.serverTimestamp(),
  })
  await appendEvent(
    raw.caseId,
    'citizen_reopened',
    'Citizen reported issue still unresolved',
    ctx.uid,
    { reason: raw.reason || null },
    'citizen'
  )
  return { success: true, status: 'acknowledged' }
}

/**
 * Safe citizen timeline — no internal notes, scores, or PII.
 */
export async function getCitizenTimelineOps(raw: { caseId: string }, ctx: AuthCtx) {
  if (!ctx.uid) throw new OpsError('Authentication required', 'unauthenticated', 401)
  const { data, id } = await loadCase(raw.caseId)
  const isOwner = data.reporterUid === ctx.uid
  const official = (() => {
    try {
      return assertOfficial(ctx)
    } catch {
      return null
    }
  })()
  if (!isOwner && !official) {
    throw new OpsError('Not authorised', 'permission_denied', 403)
  }
  if (official && !isOwner) {
    assertSameMunicipality(data, official)
  }

  const SAFE_EVENTS = new Set([
    'case_created',
    'routing_resolution',
    'media_uploaded',
    'status_updated',
    'cases_linked',
    'cases_operationally_merged',
    'citizen_confirmed_resolution',
    'citizen_reopened',
    'public_update',
  ])

  const eventsSnap = await db
    .collection('cases')
    .doc(id)
    .collection('events')
    .orderBy('timestamp', 'asc')
    .limit(100)
    .get()

  const milestones = eventsSnap.docs
    .map((d) => d.data())
    .filter((e) => SAFE_EVENTS.has(String(e.eventType)))
    .map((e) => ({
      type: e.eventType,
      description: e.description,
      // Never expose actor identities to citizens beyond system/official label
      actor: e.actorType === 'citizen' ? 'you' : e.actorType === 'official' ? 'municipality' : 'system',
      at: e.timestamp || null,
    }))

  const updatesSnap = await db
    .collection('cases')
    .doc(id)
    .collection('public_updates')
    .orderBy('createdAt', 'asc')
    .limit(50)
    .get()

  const publicUpdates = updatesSnap.docs.map((d) => {
    const u = d.data()
    return { body: u.body, at: u.createdAt || null, kind: u.kind || 'update' }
  })

  return {
    caseId: id,
    reference: data.reference || id,
    status: data.status,
    title: data.title,
    category: data.category,
    linkedPrimary: data.incidentLink?.primaryCaseId || null,
    linkedRole: data.incidentLink?.role || 'standalone',
    milestones,
    publicUpdates,
    canConfirm: data.status === 'resolved' && isOwner,
  }
}
