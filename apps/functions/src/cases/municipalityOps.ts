/**
 * Municipality operations — server-controlled case workflow.
 * Does not modify GIS resolver or authoritative routing fields.
 */

import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import {
  assertTransition,
  type CaseLifecycleStatus,
} from '@servesa/case-contract'
import { logCaseTelemetry } from '../telemetry/caseEvents'
import {
  OpsError,
  assertOfficial,
  type AuthCtx,
} from './municipalityOpsShared'

export { OpsError, assertOfficial }
export type { AuthCtx }

const db = getFirestore()
const auth = getAuth()

async function loadCase(caseId: string) {
  const ref = db.collection('cases').doc(caseId)
  const snap = await ref.get()
  if (!snap.exists) throw new OpsError('Case not found', 'not_found', 404)
  return { ref, data: snap.data()! }
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
  metadata: Record<string, unknown>
) {
  const payload = {
    caseId,
    eventType,
    description,
    actorType: 'official',
    actorUid,
    timestamp: FieldValue.serverTimestamp(),
    metadata,
  }
  const batch = db.batch()
  batch.set(db.collection('cases').doc(caseId).collection('events').doc(), payload)
  batch.set(db.collection('case_events').doc(), payload)
  await batch.commit()
}

export async function updateCaseStatusOps(
  raw: {
    caseId: string
    status: CaseLifecycleStatus
    comment?: string
    rejectionReason?: string
    resolutionSummary?: string
  },
  ctx: AuthCtx
) {
  const official = assertOfficial(ctx)
  const { ref, data } = await loadCase(raw.caseId)
  assertSameMunicipality(data, official)

  if (
    data.routingPending === true &&
    !['acknowledged', 'rejected', 'closed'].includes(raw.status)
  ) {
    throw new OpsError(
      'Case is in routing triage — complete municipality routing before this action',
      'routing_pending',
      409
    )
  }

  assertTransition(String(data.status), raw.status)

  if (raw.status === 'rejected' && !raw.rejectionReason?.trim()) {
    throw new OpsError('Rejection reason is required', 'validation_failed')
  }
  if (raw.status === 'resolved' && !raw.resolutionSummary?.trim()) {
    throw new OpsError('Resolution summary is required', 'validation_failed')
  }

  const update: Record<string, unknown> = {
    status: raw.status,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: ctx.uid,
  }

  if (raw.status === 'acknowledged') {
    update.acknowledgedAt = FieldValue.serverTimestamp()
    update.acknowledgedBy = ctx.uid
  }
  if (raw.status === 'assigned') {
    update.assignedAt = FieldValue.serverTimestamp()
    update.assignedBy = ctx.uid
  }
  if (raw.status === 'in_progress') {
    update.inProgressAt = FieldValue.serverTimestamp()
    update.inProgressBy = ctx.uid
  }
  if (raw.status === 'resolved') {
    update.resolvedAt = FieldValue.serverTimestamp()
    update.resolvedBy = ctx.uid
    update.resolution = {
      summary: raw.resolutionSummary!.trim(),
      resolvedAt: new Date().toISOString(),
      officialUid: ctx.uid,
      departmentId: data.assignedDepartment || null,
    }
  }
  if (raw.status === 'citizen_confirmed') {
    update.citizenConfirmedAt = FieldValue.serverTimestamp()
  }
  if (raw.status === 'closed') {
    update.closedAt = FieldValue.serverTimestamp()
    update.closedBy = ctx.uid
  }
  if (raw.status === 'rejected') {
    update.rejectedAt = FieldValue.serverTimestamp()
    update.rejectedBy = ctx.uid
    update.rejectionReason = raw.rejectionReason!.trim()
  }

  await ref.update(update)
  await appendEvent(raw.caseId, 'status_updated', `Status → ${raw.status}`, ctx.uid, {
    previousStatus: data.status,
    newStatus: raw.status,
    comment: raw.comment || null,
    rejectionReason: raw.rejectionReason || null,
  })
  logCaseTelemetry('ops_status_updated', {
    caseId: raw.caseId,
    from: data.status,
    to: raw.status,
  })
  return { success: true, caseId: raw.caseId, status: raw.status }
}

export async function assignCaseOps(
  raw: {
    caseId: string
    departmentId: string
    officialUid?: string
  },
  ctx: AuthCtx
) {
  const official = assertOfficial(ctx)
  const { ref, data } = await loadCase(raw.caseId)
  assertSameMunicipality(data, official)

  if (data.operationalLocked && data.incidentLink?.role === 'merged_support') {
    throw new OpsError(
      'Case is operationally merged — work the primary incident',
      'operational_locked',
      409
    )
  }

  if (data.routingPending === true || !data.muniCode) {
    throw new OpsError(
      'Cannot assign until authoritative municipality routing succeeds',
      'routing_pending',
      409
    )
  }

  if (!raw.departmentId?.trim()) {
    throw new OpsError('Department is required', 'validation_failed')
  }

  const deptSnap = await db
    .collection('municipalities')
    .doc(String(data.muniCode))
    .collection('departments')
    .doc(raw.departmentId)
    .get()
  if (!deptSnap.exists) {
    throw new OpsError('Department not found for municipality', 'not_found', 404)
  }

  const from = String(data.status)
  if (!['submitted', 'acknowledged', 'assigned', 'in_progress'].includes(from)) {
    throw new OpsError(`Cannot assign from status ${from}`, 'invalid_transition')
  }

  const deptName = String(deptSnap.data()?.name || raw.departmentId)
  const patch: Record<string, unknown> = {
    status: 'assigned',
    assignedDepartment: raw.departmentId,
    assignedDepartmentName: deptName,
    assignedTo: raw.officialUid || null,
    assignedAt: FieldValue.serverTimestamp(),
    assignedBy: ctx.uid,
    triageQueue: false,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: ctx.uid,
  }
  if (from === 'submitted') {
    patch.acknowledgedAt = FieldValue.serverTimestamp()
    patch.acknowledgedBy = ctx.uid
  }

  await ref.update(patch)
  await appendEvent(raw.caseId, 'case_assigned', 'Case assigned', ctx.uid, {
    departmentId: raw.departmentId,
    departmentName: deptName,
    officialUid: raw.officialUid || null,
    previousStatus: from,
    newStatus: 'assigned',
  })

  return {
    success: true,
    caseId: raw.caseId,
    status: 'assigned',
    assignedDepartment: raw.departmentId,
    assignedTo: raw.officialUid || null,
  }
}

export async function addInternalNoteOps(
  raw: { caseId: string; body: string },
  ctx: AuthCtx
) {
  const official = assertOfficial(ctx)
  const { data } = await loadCase(raw.caseId)
  assertSameMunicipality(data, official)
  const body = (raw.body || '').trim()
  if (body.length < 1 || body.length > 4000) {
    throw new OpsError('Note must be 1–4000 characters', 'validation_failed')
  }
  const noteRef = db
    .collection('cases')
    .doc(raw.caseId)
    .collection('internal_notes')
    .doc()
  await noteRef.set({
    noteId: noteRef.id,
    caseId: raw.caseId,
    body,
    authorUid: ctx.uid,
    visibility: 'internal',
    createdAt: FieldValue.serverTimestamp(),
  })
  await appendEvent(raw.caseId, 'internal_note_added', 'Internal note added', ctx.uid, {
    noteId: noteRef.id,
  })
  return { success: true, noteId: noteRef.id }
}

export async function addPublicUpdateOps(
  raw: { caseId: string; body: string },
  ctx: AuthCtx
) {
  const official = assertOfficial(ctx)
  const { data } = await loadCase(raw.caseId)
  assertSameMunicipality(data, official)
  const body = (raw.body || '').trim()
  if (body.length < 1 || body.length > 2000) {
    throw new OpsError('Update must be 1–2000 characters', 'validation_failed')
  }
  const updRef = db
    .collection('cases')
    .doc(raw.caseId)
    .collection('public_updates')
    .doc()
  await updRef.set({
    updateId: updRef.id,
    caseId: raw.caseId,
    body,
    authorUid: ctx.uid,
    visibility: 'public',
    createdAt: FieldValue.serverTimestamp(),
  })
  await appendEvent(raw.caseId, 'public_update_added', 'Public update posted', ctx.uid, {
    updateId: updRef.id,
  })
  return { success: true, updateId: updRef.id }
}

export async function setOfficialClaimsOps(
  raw: {
    uid: string
    roles: string[]
    municipalityCode: string
    departmentId?: string
    displayName?: string
  },
  ctx: AuthCtx
) {
  const official = assertOfficial(ctx)
  if (!official.isAdmin) {
    throw new OpsError('Admin role required', 'permission_denied', 403)
  }
  const allowedRoles = new Set([
    'official',
    'moderator',
    'admin',
    'field_worker',
  ])
  const roles = Array.from(
    new Set(
      (raw.roles || [])
        .filter(Boolean)
        .map(String)
        .filter((r) => allowedRoles.has(r))
    )
  )
  if (roles.length === 0) {
    roles.push('official')
  }
  if (!raw.municipalityCode?.trim()) {
    throw new OpsError('municipalityCode required', 'validation_failed')
  }
  await auth.setCustomUserClaims(raw.uid, {
    roles,
    municipalityCode: raw.municipalityCode.trim(),
    departmentId: raw.departmentId || null,
  })
  await db
    .collection('users')
    .doc(raw.uid)
    .set(
      {
        roles,
        municipalityCode: raw.municipalityCode.trim(),
        municipalityId: raw.municipalityCode.trim(),
        departmentId: raw.departmentId || null,
        displayName: raw.displayName || null,
        role: roles.includes('field_worker') ? 'field_worker' : 'official',
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: ctx.uid,
      },
      { merge: true }
    )
  return { success: true, uid: raw.uid, municipalityCode: raw.municipalityCode, roles }
}

export async function upsertDepartmentOps(
  raw: {
    municipalityCode: string
    departmentId: string
    name: string
    active?: boolean
  },
  ctx: AuthCtx
) {
  const official = assertOfficial(ctx)
  if (!official.isAdmin && official.muniCode !== raw.municipalityCode) {
    throw new OpsError('Not authorised for this municipality', 'permission_denied', 403)
  }
  await db
    .collection('municipalities')
    .doc(raw.municipalityCode)
    .collection('departments')
    .doc(raw.departmentId)
    .set(
      {
        departmentId: raw.departmentId,
        name: raw.name,
        active: raw.active !== false,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: ctx.uid,
      },
      { merge: true }
    )
  return { success: true, departmentId: raw.departmentId }
}

export async function upsertCategoryDepartmentMapOps(
  raw: {
    municipalityCode: string
    category: string
    departmentId: string
  },
  ctx: AuthCtx
) {
  const official = assertOfficial(ctx)
  if (!official.isAdmin && official.muniCode !== raw.municipalityCode) {
    throw new OpsError('Not authorised for this municipality', 'permission_denied', 403)
  }
  await db
    .collection('municipalities')
    .doc(raw.municipalityCode)
    .collection('category_department_map')
    .doc(raw.category)
    .set(
      {
        category: raw.category,
        departmentId: raw.departmentId,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: ctx.uid,
      },
      { merge: true }
    )
  return { success: true }
}

/** Legacy adapter */
export async function updateCaseStatus(data: any) {
  return updateCaseStatusOps(
    {
      caseId: data.caseId,
      status: data.status,
      comment: data.comment,
      rejectionReason: data.rejectionReason,
      resolutionSummary: data.resolutionNotes || data.resolutionSummary,
    },
    { uid: data.userId, token: data.token || null }
  )
}
