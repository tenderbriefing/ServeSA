/**
 * Municipal Updates — privileged ops + citizen list/read.
 * Municipality identity always comes from JWT claims for writes.
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import {
  UpsertMunicipalUpdateInputSchema,
  ListMunicipalUpdatesInputSchema,
  assertUpdateTransition,
  MUNICIPAL_UPDATE_CONTRACT_VERSION,
  type MunicipalUpdateStatus,
} from '@servesa/case-contract'
import {
  AuthCtx,
  OpsError,
  assertCommsEditor,
  assertCommsPublisher,
  assertOfficial,
} from '../cases/municipalityOpsShared'
import { logCaseTelemetry } from '../telemetry/caseEvents'

const db = getFirestore()

const CITIZEN_VISIBLE: MunicipalUpdateStatus[] = [
  'published',
  'updated',
  'resolved',
]

function generateUpdateId(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `UPD-${timestamp}-${random}`
}

async function appendUpdateAudit(
  updateId: string,
  municipalityCode: string,
  eventType: string,
  actorUid: string,
  metadata: Record<string, unknown>
) {
  const ref = db.collection('municipal_update_events').doc()
  await ref.set({
    eventId: ref.id,
    updateId,
    municipalityCode,
    eventType,
    actorType: 'official',
    actorUid,
    timestamp: FieldValue.serverTimestamp(),
    metadata,
  })
  await db.collection('audit_logs').doc(ref.id).set({
    logId: ref.id,
    domain: 'municipal_updates',
    updateId,
    municipalityCode,
    eventType,
    actorUid,
    timestamp: FieldValue.serverTimestamp(),
    metadata,
  })
}

function resolveMuniFromClaims(
  official: { isAdmin: boolean; muniCode: string | null },
  clientMuni?: string
): string {
  if (official.isAdmin) {
    const code = (clientMuni || official.muniCode || '').trim()
    if (!code) throw new OpsError('municipalityCode required', 'validation_failed')
    return code
  }
  if (!official.muniCode) {
    throw new OpsError('Municipality claim required', 'permission_denied', 403)
  }
  if (clientMuni && clientMuni.trim() !== official.muniCode) {
    throw new OpsError(
      'Cannot target another municipality',
      'permission_denied',
      403
    )
  }
  return official.muniCode
}

/**
 * Create or update a draft/scheduled update. Editors may save drafts;
 * publishing requires publisher role (separate callable).
 */
export async function upsertMunicipalUpdateOps(
  raw: unknown,
  ctx: AuthCtx
) {
  const editor = assertCommsEditor(ctx)
  const parsed = UpsertMunicipalUpdateInputSchema.parse(raw)
  const municipalityCode = resolveMuniFromClaims(
    editor,
    parsed.targeting.municipalityCode
  )

  const requestedStatus = parsed.status || 'draft'
  if (requestedStatus !== 'draft' && requestedStatus !== 'scheduled') {
    throw new OpsError(
      'Use publishMunicipalUpdate for publish/resolve/archive',
      'validation_failed'
    )
  }
  if (requestedStatus === 'scheduled') {
    assertCommsPublisher(ctx)
    if (!parsed.scheduledAt) {
      throw new OpsError('scheduledAt required for scheduled updates', 'validation_failed')
    }
  }

  const updateId = parsed.updateId || generateUpdateId()
  const ref = db.collection('municipal_updates').doc(updateId)
  const existing = await ref.get()

  if (existing.exists) {
    const data = existing.data()!
    if (data.municipalityCode !== municipalityCode && !editor.isAdmin) {
      throw new OpsError('Cross-municipality edit denied', 'permission_denied', 403)
    }
    const from = data.status as string
    if (from !== requestedStatus) {
      assertUpdateTransition(from, requestedStatus)
    }
  }

  const targeting = {
    municipalityCode,
    wardIds: parsed.targeting.wardIds || [],
    suburbIds: parsed.targeting.suburbIds || [],
    serviceCategories: parsed.targeting.serviceCategories || [],
    affectedAreaLabel: parsed.targeting.affectedAreaLabel || null,
    affectedAreaGeoJson: parsed.targeting.affectedAreaGeoJson || null,
  }

  const payload: Record<string, unknown> = {
    updateId,
    municipalityCode,
    type: parsed.type,
    title: parsed.title.trim(),
    body: parsed.body.trim(),
    summary: (parsed.summary || parsed.body.slice(0, 160)).trim(),
    targeting,
    status: requestedStatus,
    project: parsed.project || null,
    mediaPaths: parsed.mediaPaths || [],
    publishedByDisplayName:
      parsed.publishedByDisplayName?.trim() ||
      `Municipality ${municipalityCode}`,
    expectedRestorationAt: parsed.expectedRestorationAt
      ? new Date(parsed.expectedRestorationAt)
      : null,
    scheduledAt: parsed.scheduledAt ? new Date(parsed.scheduledAt) : null,
    contractVersion: MUNICIPAL_UPDATE_CONTRACT_VERSION,
    updatedAt: FieldValue.serverTimestamp(),
    updatedByUid: ctx.uid,
  }

  if (!existing.exists) {
    payload.createdAt = FieldValue.serverTimestamp()
    payload.createdByUid = ctx.uid
    payload.viewCount = 0
  }

  await ref.set(payload, { merge: true })
  await appendUpdateAudit(updateId, municipalityCode, 'update_upserted', ctx.uid, {
    status: requestedStatus,
    type: parsed.type,
  })
  logCaseTelemetry('municipal_update_upserted', {
    updateId,
    municipalityCode,
    status: requestedStatus,
  })
  return { success: true, updateId, status: requestedStatus, municipalityCode }
}

export async function publishMunicipalUpdateOps(
  raw: { updateId: string; resolve?: boolean },
  ctx: AuthCtx
) {
  const publisher = assertCommsPublisher(ctx)
  if (!raw.updateId) throw new OpsError('updateId required', 'validation_failed')
  const ref = db.collection('municipal_updates').doc(raw.updateId)
  const snap = await ref.get()
  if (!snap.exists) throw new OpsError('Update not found', 'not_found', 404)
  const data = snap.data()!
  const municipalityCode = resolveMuniFromClaims(publisher, data.municipalityCode)
  if (data.municipalityCode !== municipalityCode && !publisher.isAdmin) {
    throw new OpsError('Cross-municipality publish denied', 'permission_denied', 403)
  }

  const from = data.status as string
  const to: MunicipalUpdateStatus = raw.resolve
    ? 'resolved'
    : from === 'published' || from === 'updated'
      ? 'updated'
      : 'published'
  assertUpdateTransition(from, to)

  const patch: Record<string, unknown> = {
    status: to,
    updatedAt: FieldValue.serverTimestamp(),
    updatedByUid: ctx.uid,
    lastPublishedAt: FieldValue.serverTimestamp(),
  }
  if (to === 'published' && !data.publishedAt) {
    patch.publishedAt = FieldValue.serverTimestamp()
    patch.publishedByUid = ctx.uid
  }
  if (to === 'resolved') {
    patch.resolvedAt = FieldValue.serverTimestamp()
  }

  await ref.update(patch)
  await appendUpdateAudit(raw.updateId, municipalityCode, 'update_published', ctx.uid, {
    from,
    to,
  })
  logCaseTelemetry('municipal_update_published', {
    updateId: raw.updateId,
    municipalityCode,
    status: to,
  })

  // In-app notification ledger entry (broadcast fan-out is preference-gated later)
  const ledgerId = `muni_update_${raw.updateId}_${to}`
  await db
    .collection('notification_ledger')
    .doc(ledgerId)
    .set(
      {
        ledgerId,
        type: 'municipal_update',
        updateId: raw.updateId,
        municipalityCode,
        status: to,
        createdAt: FieldValue.serverTimestamp(),
        channel: 'in_app_pending',
      },
      { merge: true }
    )

  return { success: true, updateId: raw.updateId, status: to }
}

export async function archiveMunicipalUpdateOps(
  raw: { updateId: string },
  ctx: AuthCtx
) {
  const publisher = assertCommsPublisher(ctx)
  if (!raw.updateId) throw new OpsError('updateId required', 'validation_failed')
  const ref = db.collection('municipal_updates').doc(raw.updateId)
  const snap = await ref.get()
  if (!snap.exists) throw new OpsError('Update not found', 'not_found', 404)
  const data = snap.data()!
  const municipalityCode = resolveMuniFromClaims(publisher, data.municipalityCode)
  if (data.municipalityCode !== municipalityCode && !publisher.isAdmin) {
    throw new OpsError('Cross-municipality archive denied', 'permission_denied', 403)
  }
  assertUpdateTransition(data.status, 'archived')
  await ref.update({
    status: 'archived',
    archivedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedByUid: ctx.uid,
  })
  await appendUpdateAudit(raw.updateId, municipalityCode, 'update_archived', ctx.uid, {
    from: data.status,
  })
  return { success: true, updateId: raw.updateId, status: 'archived' }
}

export async function getMunicipalUpdateOps(
  raw: { updateId: string },
  ctx: AuthCtx
) {
  if (!raw.updateId) throw new OpsError('updateId required', 'validation_failed')
  const snap = await db.collection('municipal_updates').doc(raw.updateId).get()
  if (!snap.exists) throw new OpsError('Update not found', 'not_found', 404)
  const data = snap.data()!
  const status = data.status as MunicipalUpdateStatus

  // Officials in same muni may read drafts; citizens only published family
  if (ctx.uid) {
    try {
      const official = assertOfficial(ctx)
      if (
        official.isAdmin ||
        official.muniCode === data.municipalityCode
      ) {
        return { success: true, update: serializeUpdate(data) }
      }
    } catch {
      // fall through to citizen rules
    }
  }
  if (!CITIZEN_VISIBLE.includes(status)) {
    throw new OpsError('Update not found', 'not_found', 404)
  }
  // Soft counter — best effort
  void db
    .collection('municipal_updates')
    .doc(raw.updateId)
    .update({ viewCount: FieldValue.increment(1) })
    .catch(() => undefined)
  return { success: true, update: serializeUpdate(data, true) }
}

export async function listMunicipalUpdatesOps(
  raw: unknown,
  ctx: AuthCtx
) {
  const parsed = ListMunicipalUpdatesInputSchema.parse(raw || {})
  const limit = parsed.limit || 30
  let query = db
    .collection('municipal_updates')
    .where('municipalityCode', '==', parsed.municipalityCode)

  const opsView = parsed.citizenView === false
  if (opsView) {
    const official = assertOfficial(ctx)
    if (
      !official.isAdmin &&
      official.muniCode !== parsed.municipalityCode
    ) {
      throw new OpsError('Cross-municipality list denied', 'permission_denied', 403)
    }
    if (parsed.status) {
      query = query.where('status', '==', parsed.status)
    }
  } else {
    if (parsed.status && CITIZEN_VISIBLE.includes(parsed.status)) {
      query = query.where('status', '==', parsed.status)
    } else {
      query = query.where('status', 'in', CITIZEN_VISIBLE)
    }
  }

  if (parsed.type) {
    // Apply in memory when combined with status `in` / equality to avoid extra composites
    // (status+type+muni+updatedAt). Equality-only paths still hit indexed queries above.
  }

  query = query.orderBy('updatedAt', 'desc').limit(limit)
  const snap = await query.get()
  let updates = snap.docs.map((d) => serializeUpdate(d.data(), !opsView))

  if (parsed.type) {
    updates = updates.filter((u) => u.type === parsed.type)
  }
  if (parsed.wardId) {
    updates = updates.filter(
      (u) =>
        !u.targeting.wardIds?.length ||
        u.targeting.wardIds.includes(parsed.wardId!)
    )
  }
  if (parsed.serviceCategory) {
    updates = updates.filter(
      (u) =>
        !u.targeting.serviceCategories?.length ||
        u.targeting.serviceCategories.includes(parsed.serviceCategory!)
    )
  }

  return { success: true, updates, municipalityCode: parsed.municipalityCode }
}

function serializeUpdate(data: Record<string, any>, citizen = false) {
  const base = {
    updateId: data.updateId,
    municipalityCode: data.municipalityCode,
    type: data.type,
    title: data.title,
    body: data.body,
    summary: data.summary,
    status: data.status,
    targeting: data.targeting || { municipalityCode: data.municipalityCode },
    project: data.project || null,
    mediaPaths: data.mediaPaths || [],
    publishedByDisplayName: data.publishedByDisplayName || null,
    expectedRestorationAt: data.expectedRestorationAt?.toDate?.()?.toISOString?.() ||
      data.expectedRestorationAt ||
      null,
    publishedAt: data.publishedAt?.toDate?.()?.toISOString?.() || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
    resolvedAt: data.resolvedAt?.toDate?.()?.toISOString?.() || null,
    viewCount: typeof data.viewCount === 'number' ? data.viewCount : 0,
    contractVersion: data.contractVersion || MUNICIPAL_UPDATE_CONTRACT_VERSION,
  }
  if (citizen) {
    return base
  }
  return {
    ...base,
    createdByUid: data.createdByUid || null,
    updatedByUid: data.updatedByUid || null,
    publishedByUid: data.publishedByUid || null,
    scheduledAt: data.scheduledAt?.toDate?.()?.toISOString?.() || null,
  }
}
