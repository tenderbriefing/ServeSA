/**
 * Smart work queue, supervisor board, map listing, field jobs — bounded queries.
 */

import { getFirestore } from 'firebase-admin/firestore'
import {
  OpsError,
  assertOfficial,
  assertFieldWorker,
  type AuthCtx,
} from './municipalityOpsShared'

const db = getFirestore()

function muniOrThrow(ctx: ReturnType<typeof assertOfficial>): string {
  if (ctx.isAdmin && ctx.muniCode) return ctx.muniCode
  if (ctx.muniCode) return ctx.muniCode
  throw new OpsError('municipalityCode required', 'validation_failed')
}

export type QueueBucket =
  | 'needs_ack'
  | 'assigned_to_me'
  | 'duplicate_review'
  | 'triage'
  | 'high_priority'
  | 'in_progress'
  | 'ready_resolve'
  | 'reopened'
  | 'ready_closure'

function bucketPriority(bucket: QueueBucket): number {
  const order: QueueBucket[] = [
    'duplicate_review',
    'needs_ack',
    'triage',
    'reopened',
    'high_priority',
    'assigned_to_me',
    'in_progress',
    'ready_resolve',
    'ready_closure',
  ]
  return order.indexOf(bucket)
}

function classifyCase(c: Record<string, any>, uid: string): QueueBucket | null {
  if (c.duplicateReview?.status === 'pending') return 'duplicate_review'
  if (c.triageQueue === true || c.routingPending === true) return 'triage'
  if (c.reopenedAt && ['acknowledged', 'assigned'].includes(c.status)) return 'reopened'
  if (c.status === 'submitted') return 'needs_ack'
  if (c.assignedTo === uid && ['assigned', 'in_progress'].includes(c.status)) {
    return 'assigned_to_me'
  }
  if (['emergency', 'high'].includes(c.priority) && !['resolved', 'closed', 'rejected'].includes(c.status)) {
    return 'high_priority'
  }
  if (c.status === 'in_progress') return 'in_progress'
  if (c.status === 'resolved') return 'ready_closure'
  if (c.status === 'assigned') return 'ready_resolve'
  return null
}

function nextAction(bucket: QueueBucket): string {
  const map: Record<QueueBucket, string> = {
    needs_ack: 'Acknowledge',
    assigned_to_me: 'Continue work',
    duplicate_review: 'Review duplicate',
    triage: 'Complete routing triage',
    high_priority: 'Prioritise',
    in_progress: 'Update or resolve',
    ready_resolve: 'Start or resolve',
    reopened: 'Re-acknowledge work',
    ready_closure: 'Close or await citizen',
  }
  return map[bucket]
}

export async function listSmartWorkQueueOps(
  raw: { bucket?: QueueBucket; limit?: number },
  ctx: AuthCtx
) {
  const official = assertOfficial(ctx)
  if (official.roles.includes('field_worker') && !official.roles.includes('official') && !official.isAdmin) {
    // Field workers use field jobs endpoint
    throw new OpsError('Use field jobs endpoint', 'permission_denied', 403)
  }
  const muni = muniOrThrow(official)
  const limit = Math.min(raw.limit || 40, 80)

  const snap = await db
    .collection('cases')
    .where('muniCode', '==', muni)
    .orderBy('createdAt', 'desc')
    .limit(120)
    .get()

  const items: Array<{
    caseId: string
    reference: string
    title: string
    category: string
    status: string
    priority: string
    wardId: string | null
    department: string | null
    assignee: string | null
    thumbnailHint: string | null
    duplicateBadge: string | null
    bucket: QueueBucket
    nextAction: string
    bucketRank: number
    createdAt: unknown
  }> = []

  for (const doc of snap.docs) {
    const c = doc.data()
    if (['closed', 'rejected'].includes(c.status)) continue
    const bucket = classifyCase(c, ctx.uid)
    if (!bucket) continue
    if (raw.bucket && bucket !== raw.bucket) continue
    items.push({
      caseId: doc.id,
      reference: c.reference || doc.id,
      title: c.title,
      category: c.category,
      status: c.status,
      priority: c.priority,
      wardId: c.wardId || null,
      department: c.assignedDepartment || null,
      assignee: c.assignedTo || null,
      thumbnailHint: Array.isArray(c.mediaUrls) && c.mediaUrls[0] ? 'available' : null,
      duplicateBadge:
        c.duplicateReview?.status === 'pending'
          ? c.duplicateReview.confidence || 'pending'
          : null,
      bucket,
      nextAction: nextAction(bucket),
      bucketRank: bucketPriority(bucket),
      createdAt: c.createdAt || null,
    })
  }

  items.sort((a, b) => a.bucketRank - b.bucketRank || String(b.caseId).localeCompare(a.caseId))
  return { municipalityCode: muni, items: items.slice(0, limit), policy: 'deterministic_v1' }
}

export async function listSupervisorBoardOps(_raw: Record<string, unknown>, ctx: AuthCtx) {
  const official = assertOfficial(ctx)
  if (
    !official.isAdmin &&
    !official.roles.includes('moderator') &&
    !official.roles.includes('official')
  ) {
    throw new OpsError('Supervisor board requires official role', 'permission_denied', 403)
  }
  const muni = muniOrThrow(official)
  const snap = await db
    .collection('cases')
    .where('muniCode', '==', muni)
    .orderBy('createdAt', 'desc')
    .limit(200)
    .get()

  const counts = {
    unacknowledged: 0,
    unassigned: 0,
    inProgress: 0,
    duplicateReviewsPending: 0,
    triage: 0,
    reopened: 0,
    readyForClosure: 0,
    highPriority: 0,
  }

  const workload: Record<string, number> = {}

  for (const doc of snap.docs) {
    const c = doc.data()
    if (c.status === 'submitted') counts.unacknowledged++
    if (['submitted', 'acknowledged'].includes(c.status) && !c.assignedTo) counts.unassigned++
    if (c.status === 'in_progress') counts.inProgress++
    if (c.duplicateReview?.status === 'pending') counts.duplicateReviewsPending++
    if (c.triageQueue || c.routingPending) counts.triage++
    if (c.reopenedAt && c.status !== 'closed') counts.reopened++
    if (c.status === 'resolved' || c.status === 'citizen_confirmed') counts.readyForClosure++
    if (['emergency', 'high'].includes(c.priority) && !['closed', 'rejected'].includes(c.status)) {
      counts.highPriority++
    }
    if (c.assignedTo && !['closed', 'rejected'].includes(c.status)) {
      workload[c.assignedTo] = (workload[c.assignedTo] || 0) + 1
    }
  }

  return {
    municipalityCode: muni,
    counts,
    workload: Object.entries(workload)
      .map(([uid, openCases]) => ({ uid, openCases }))
      .sort((a, b) => b.openCases - a.openCases)
      .slice(0, 20),
  }
}

export async function listMapCasesOps(
  raw: {
    status?: string
    category?: string
    department?: string
    ward?: string
    limit?: number
  },
  ctx: AuthCtx
) {
  const official = assertOfficial(ctx)
  const muni = muniOrThrow(official)
  const limit = Math.min(raw.limit || 100, 200)

  let q = db
    .collection('cases')
    .where('muniCode', '==', muni)
    .orderBy('createdAt', 'desc')
    .limit(limit)

  if (raw.status) {
    q = db
      .collection('cases')
      .where('muniCode', '==', muni)
      .where('status', '==', raw.status)
      .orderBy('createdAt', 'desc')
      .limit(limit) as typeof q
  }

  const snap = await q.get()
  const features = []
  for (const doc of snap.docs) {
    const c = doc.data()
    if (raw.category && c.category !== raw.category) continue
    if (raw.department && c.assignedDepartment !== raw.department) continue
    if (raw.ward && c.wardId !== raw.ward) continue
    const lat = c.location?.lat
    const lng = c.location?.lng
    if (typeof lat !== 'number' || typeof lng !== 'number') continue
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    // Minimal payload — no contact PII, short title only
    features.push({
      id: doc.id,
      lat,
      lng,
      status: c.status,
      category: c.category,
      priority: c.priority,
      wardId: c.wardId || null,
      department: c.assignedDepartment || null,
      duplicatePending: c.duplicateReview?.status === 'pending',
      linked: Boolean(c.incidentLink?.primaryCaseId),
      label: String(c.reference || doc.id),
    })
  }
  return { municipalityCode: muni, count: features.length, features }
}

export async function listFieldJobsOps(
  raw: { limit?: number },
  ctx: AuthCtx
) {
  const worker = assertFieldWorker(ctx)
  const muni = muniOrThrow(worker)
  const limit = Math.min(raw.limit || 40, 80)

  // Assigned to this worker OR department open jobs for field roles
  const snap = await db
    .collection('cases')
    .where('muniCode', '==', muni)
    .where('assignedTo', '==', ctx.uid)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get()

  const jobs = snap.docs.map((doc) => {
    const c = doc.data()
    return {
      caseId: doc.id,
      reference: c.reference || doc.id,
      category: c.category,
      status: c.status,
      priority: c.priority,
      department: c.assignedDepartment || null,
      title: c.title,
      location: {
        lat: c.location?.lat ?? null,
        lng: c.location?.lng ?? null,
        address: c.location?.address || null,
      },
      workInstruction: c.publicWorkInstruction || null,
      hasMedia: Array.isArray(c.mediaUrls) && c.mediaUrls.length > 0,
    }
  })

  return { municipalityCode: muni, jobs }
}

export async function startFieldWorkOps(raw: { caseId: string }, ctx: AuthCtx) {
  const worker = assertFieldWorker(ctx)
  const ref = db.collection('cases').doc(raw.caseId)
  const snap = await ref.get()
  if (!snap.exists) throw new OpsError('Case not found', 'not_found', 404)
  const data = snap.data()!
  const caseMuni = data.muniCode || data.location?.municipalityId
  if (!worker.isAdmin && caseMuni !== worker.muniCode) {
    throw new OpsError('Not authorised for this municipality', 'permission_denied', 403)
  }
  if (data.assignedTo && data.assignedTo !== ctx.uid && !worker.isAdmin) {
    throw new OpsError('Not assigned to you', 'permission_denied', 403)
  }
  // Field workers may not change GIS fields — only status toward in_progress
  if (!['assigned', 'in_progress'].includes(data.status)) {
    throw new OpsError('Case not ready for field work', 'validation_failed', 409)
  }
  if (data.status === 'assigned') {
    await ref.update({
      status: 'in_progress',
      inProgressAt: new Date(),
      inProgressBy: ctx.uid,
      updatedAt: new Date(),
      updatedBy: ctx.uid,
    })
  }
  await db.collection('cases').doc(raw.caseId).collection('events').add({
    caseId: raw.caseId,
    eventType: 'field_work_started',
    description: 'Field work started',
    actorType: 'field_worker',
    actorUid: ctx.uid,
    timestamp: new Date(),
    metadata: {},
  })
  return { success: true, caseId: raw.caseId, status: 'in_progress' }
}

export async function proposeFieldCompletionOps(
  raw: { caseId: string; note?: string },
  ctx: AuthCtx
) {
  const worker = assertFieldWorker(ctx)
  const ref = db.collection('cases').doc(raw.caseId)
  const snap = await ref.get()
  if (!snap.exists) throw new OpsError('Case not found', 'not_found', 404)
  const data = snap.data()!
  const caseMuni = data.muniCode || data.location?.municipalityId
  if (!worker.isAdmin && caseMuni !== worker.muniCode) {
    throw new OpsError('Not authorised', 'permission_denied', 403)
  }
  if (data.assignedTo !== ctx.uid && !worker.isAdmin && !worker.roles.includes('official')) {
    throw new OpsError('Not assigned to you', 'permission_denied', 403)
  }
  // Propose only — officials close/resolve
  await ref.update({
    fieldCompletionProposed: true,
    fieldCompletionNote: raw.note || null,
    fieldCompletionBy: ctx.uid,
    fieldCompletionAt: new Date().toISOString(),
    updatedAt: new Date(),
  })
  await db.collection('cases').doc(raw.caseId).collection('events').add({
    caseId: raw.caseId,
    eventType: 'work_completion_proposed',
    description: 'Field worker proposed completion',
    actorType: 'field_worker',
    actorUid: ctx.uid,
    timestamp: new Date(),
    metadata: { note: raw.note || null },
  })
  return { success: true, proposed: true }
}

export async function searchOpsCasesOps(
  raw: { q: string; limit?: number },
  ctx: AuthCtx
) {
  const official = assertOfficial(ctx)
  const muni = muniOrThrow(official)
  const needle = String(raw.q || '').trim()
  if (needle.length < 2) throw new OpsError('Query too short', 'validation_failed')
  const limit = Math.min(raw.limit || 30, 50)

  // Bounded: prefer exact case id / reference prefix
  if (needle.toUpperCase().startsWith('CASE-')) {
    const doc = await db.collection('cases').doc(needle.toUpperCase()).get()
    if (doc.exists) {
      const c = doc.data()!
      const caseMuni = c.muniCode || c.location?.municipalityId
      if (official.isAdmin || caseMuni === muni) {
        return {
          results: [
            {
              caseId: doc.id,
              title: c.title,
              status: c.status,
              category: c.category,
              wardId: c.wardId || null,
            },
          ],
        }
      }
    }
  }

  const snap = await db
    .collection('cases')
    .where('muniCode', '==', muni)
    .orderBy('createdAt', 'desc')
    .limit(80)
    .get()

  const lower = needle.toLowerCase()
  const results = []
  for (const doc of snap.docs) {
    const c = doc.data()
    const hay = [
      doc.id,
      c.reference,
      c.title,
      c.category,
      c.wardId,
      c.assignedDepartment,
      c.location?.address,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    if (hay.includes(lower)) {
      results.push({
        caseId: doc.id,
        title: c.title,
        status: c.status,
        category: c.category,
        wardId: c.wardId || null,
      })
    }
    if (results.length >= limit) break
  }
  return { results }
}
