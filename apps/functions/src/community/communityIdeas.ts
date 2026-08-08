/**
 * Community Ideas — citizen submit + official moderation.
 * No unrestricted comments; one support vote per authenticated citizen.
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import {
  SubmitCommunityIdeaInputSchema,
  TransitionIdeaStatusInputSchema,
  OfficialIdeaResponseSchema,
  ListCommunityIdeasInputSchema,
  assertIdeaTransition,
  COMMUNITY_IDEA_CONTRACT_VERSION,
  CITIZEN_IDEA_STATUS_LABEL,
  type CommunityIdeaStatus,
} from '@servesa/case-contract'
import {
  AuthCtx,
  OpsError,
  assertOfficial,
  assertManager,
} from '../cases/municipalityOpsShared'
import { logCaseTelemetry } from '../telemetry/caseEvents'

const db = getFirestore()

const CITIZEN_LIST_STATUSES: CommunityIdeaStatus[] = [
  'submitted',
  'under_review',
  'community_support',
  'feasibility_review',
  'planned',
  'in_progress',
  'implemented',
  'declined',
]

function generateIdeaId(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `IDEA-${timestamp}-${random}`
}

async function appendIdeaAudit(
  ideaId: string,
  municipalityCode: string,
  eventType: string,
  actorUid: string,
  actorType: 'citizen' | 'official' | 'system',
  metadata: Record<string, unknown>
) {
  const ref = db.collection('community_idea_events').doc()
  await ref.set({
    eventId: ref.id,
    ideaId,
    municipalityCode,
    eventType,
    actorType,
    actorUid,
    timestamp: FieldValue.serverTimestamp(),
    metadata,
  })
  await db.collection('audit_logs').doc(ref.id).set({
    logId: ref.id,
    domain: 'community_ideas',
    ideaId,
    municipalityCode,
    eventType,
    actorUid,
    actorType,
    timestamp: FieldValue.serverTimestamp(),
    metadata,
  })
}

export async function submitCommunityIdeaOps(raw: unknown, ctx: AuthCtx) {
  if (!ctx.uid) {
    throw new OpsError('Authentication required', 'unauthenticated', 401)
  }
  const parsed = SubmitCommunityIdeaInputSchema.parse(raw)

  if (parsed.clientRequestId) {
    const idem = await db
      .collection('idea_idempotency')
      .doc(`${ctx.uid}_${parsed.clientRequestId}`)
      .get()
    if (idem.exists) {
      const existing = idem.data()!
      return {
        success: true,
        ideaId: existing.ideaId,
        status: existing.status,
        idempotent: true,
      }
    }
  }

  const ideaId = generateIdeaId()
  const municipalityCode = parsed.municipalityCode.trim()

  const doc = {
    ideaId,
    municipalityCode,
    authorUid: ctx.uid,
    title: parsed.title.trim(),
    description: parsed.description.trim(),
    category: parsed.category,
    wardId: parsed.wardId || null,
    suburbLabel: parsed.suburbLabel || null,
    mediaPaths: parsed.mediaPaths || [],
    status: 'submitted' as CommunityIdeaStatus,
    supportCount: 0,
    officialResponse: null,
    contractVersion: COMMUNITY_IDEA_CONTRACT_VERSION,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }

  const batch = db.batch()
  batch.set(db.collection('community_ideas').doc(ideaId), doc)
  if (parsed.clientRequestId) {
    batch.set(
      db.collection('idea_idempotency').doc(`${ctx.uid}_${parsed.clientRequestId}`),
      {
        ideaId,
        status: 'submitted',
        createdAt: FieldValue.serverTimestamp(),
      }
    )
  }
  await batch.commit()

  await appendIdeaAudit(
    ideaId,
    municipalityCode,
    'idea_submitted',
    ctx.uid,
    'citizen',
    { category: parsed.category }
  )
  logCaseTelemetry('community_idea_submitted', {
    ideaId,
    municipalityCode,
    category: parsed.category,
  })

  return { success: true, ideaId, status: 'submitted' as const }
}

export async function supportCommunityIdeaOps(
  raw: { ideaId: string },
  ctx: AuthCtx
) {
  if (!ctx.uid) {
    throw new OpsError('Authentication required', 'unauthenticated', 401)
  }
  if (!raw.ideaId) throw new OpsError('ideaId required', 'validation_failed')

  const ideaRef = db.collection('community_ideas').doc(raw.ideaId)
  const supportRef = ideaRef.collection('supports').doc(ctx.uid)

  const result = await db.runTransaction(async (tx) => {
    const ideaSnap = await tx.get(ideaRef)
    if (!ideaSnap.exists) {
      throw new OpsError('Idea not found', 'not_found', 404)
    }
    const idea = ideaSnap.data()!
    const status = idea.status as CommunityIdeaStatus
    if (status === 'archived' || status === 'withdrawn' || status === 'declined') {
      throw new OpsError('Idea cannot receive support', 'failed-precondition', 409)
    }
    const existing = await tx.get(supportRef)
    if (existing.exists) {
      return {
        success: true,
        ideaId: raw.ideaId,
        supportCount: idea.supportCount || 0,
        alreadySupported: true,
      }
    }
    tx.set(supportRef, {
      uid: ctx.uid,
      createdAt: FieldValue.serverTimestamp(),
    })
    const next = (idea.supportCount || 0) + 1
    tx.update(ideaRef, {
      supportCount: next,
      updatedAt: FieldValue.serverTimestamp(),
    })
    return {
      success: true,
      ideaId: raw.ideaId,
      supportCount: next,
      alreadySupported: false,
    }
  })

  if (!result.alreadySupported) {
    const ideaSnap = await ideaRef.get()
    const muni = ideaSnap.data()?.municipalityCode || 'unknown'
    await appendIdeaAudit(
      raw.ideaId,
      muni,
      'idea_supported',
      ctx.uid,
      'citizen',
      { supportCount: result.supportCount }
    )
  }
  return result
}

export async function transitionCommunityIdeaOps(raw: unknown, ctx: AuthCtx) {
  const official = assertManager(ctx)
  const parsed = TransitionIdeaStatusInputSchema.parse(raw)
  const ref = db.collection('community_ideas').doc(parsed.ideaId)
  const snap = await ref.get()
  if (!snap.exists) throw new OpsError('Idea not found', 'not_found', 404)
  const data = snap.data()!
  if (
    !official.isAdmin &&
    official.muniCode !== data.municipalityCode
  ) {
    throw new OpsError('Cross-municipality transition denied', 'permission_denied', 403)
  }
  assertIdeaTransition(data.status, parsed.status)
  await ref.update({
    status: parsed.status,
    updatedAt: FieldValue.serverTimestamp(),
    lastTransitionByUid: ctx.uid,
    lastTransitionNote: parsed.note || null,
  })
  await appendIdeaAudit(
    parsed.ideaId,
    data.municipalityCode,
    'idea_status_changed',
    ctx.uid,
    'official',
    { from: data.status, to: parsed.status }
  )
  return { success: true, ideaId: parsed.ideaId, status: parsed.status }
}

export async function respondToCommunityIdeaOps(raw: unknown, ctx: AuthCtx) {
  const official = assertManager(ctx)
  const parsed = OfficialIdeaResponseSchema.parse(raw)
  const ref = db.collection('community_ideas').doc(parsed.ideaId)
  const snap = await ref.get()
  if (!snap.exists) throw new OpsError('Idea not found', 'not_found', 404)
  const data = snap.data()!
  if (
    !official.isAdmin &&
    official.muniCode !== data.municipalityCode
  ) {
    throw new OpsError('Cross-municipality response denied', 'permission_denied', 403)
  }
  const response = {
    body: parsed.body.trim(),
    authorUid: ctx.uid,
    createdAt: new Date().toISOString(),
    publishedByDisplayName: `Municipality ${data.municipalityCode}`,
  }
  await ref.update({
    officialResponse: response,
    updatedAt: FieldValue.serverTimestamp(),
  })
  await appendIdeaAudit(
    parsed.ideaId,
    data.municipalityCode,
    'idea_official_response',
    ctx.uid,
    'official',
    {}
  )
  return { success: true, ideaId: parsed.ideaId }
}

export async function addIdeaInternalNoteOps(
  raw: { ideaId: string; body: string },
  ctx: AuthCtx
) {
  const official = assertOfficial(ctx)
  if (!raw.ideaId || !(raw.body || '').trim()) {
    throw new OpsError('ideaId and body required', 'validation_failed')
  }
  const ideaSnap = await db.collection('community_ideas').doc(raw.ideaId).get()
  if (!ideaSnap.exists) throw new OpsError('Idea not found', 'not_found', 404)
  const data = ideaSnap.data()!
  if (
    !official.isAdmin &&
    official.muniCode !== data.municipalityCode
  ) {
    throw new OpsError('Cross-municipality note denied', 'permission_denied', 403)
  }
  const noteRef = db
    .collection('community_ideas')
    .doc(raw.ideaId)
    .collection('internal_notes')
    .doc()
  await noteRef.set({
    noteId: noteRef.id,
    body: raw.body.trim().slice(0, 2000),
    authorUid: ctx.uid,
    createdAt: FieldValue.serverTimestamp(),
  })
  await appendIdeaAudit(
    raw.ideaId,
    data.municipalityCode,
    'idea_internal_note',
    ctx.uid,
    'official',
    { noteId: noteRef.id }
  )
  return { success: true, noteId: noteRef.id }
}

export async function getCommunityIdeaOps(
  raw: { ideaId: string },
  ctx: AuthCtx
) {
  if (!raw.ideaId) throw new OpsError('ideaId required', 'validation_failed')
  const snap = await db.collection('community_ideas').doc(raw.ideaId).get()
  if (!snap.exists) throw new OpsError('Idea not found', 'not_found', 404)
  const data = snap.data()!
  let ops = false
  if (ctx.uid) {
    try {
      const official = assertOfficial(ctx)
      ops =
        official.isAdmin || official.muniCode === data.municipalityCode
    } catch {
      ops = false
    }
  }
  if (!ops && (data.status === 'withdrawn' || data.status === 'archived')) {
    // Author may still see own withdrawn idea
    if (data.authorUid !== ctx.uid) {
      throw new OpsError('Idea not found', 'not_found', 404)
    }
  }

  let supportedByMe = false
  if (ctx.uid) {
    const support = await db
      .collection('community_ideas')
      .doc(raw.ideaId)
      .collection('supports')
      .doc(ctx.uid)
      .get()
    supportedByMe = support.exists
  }

  return {
    success: true,
    idea: serializeIdea(data, { ops, viewerUid: ctx.uid }),
    supportedByMe,
  }
}

export async function listCommunityIdeasOps(raw: unknown, ctx: AuthCtx) {
  const parsed = ListCommunityIdeasInputSchema.parse(raw || {})
  const limit = parsed.limit || 30
  let query = db
    .collection('community_ideas')
    .where('municipalityCode', '==', parsed.municipalityCode)

  if (parsed.opsView) {
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
    if (parsed.status && CITIZEN_LIST_STATUSES.includes(parsed.status)) {
      query = query.where('status', '==', parsed.status)
    } else {
      query = query.where('status', 'in', CITIZEN_LIST_STATUSES.slice(0, 10))
    }
  }

  if (parsed.category) {
    // Filter in memory when combined with status `in` to reduce index surface
  }

  query = query.orderBy('updatedAt', 'desc').limit(limit)
  const snap = await query.get()
  let ideas = snap.docs.map((d) =>
    serializeIdea(d.data(), { ops: Boolean(parsed.opsView), viewerUid: ctx.uid })
  )
  if (parsed.category) {
    ideas = ideas.filter((i) => i.category === parsed.category)
  }
  if (parsed.wardId) {
    ideas = ideas.filter((i) => !i.wardId || i.wardId === parsed.wardId)
  }
  return {
    success: true,
    ideas,
    municipalityCode: parsed.municipalityCode,
  }
}

/**
 * Lightweight deterministic insights — aggregate counts only.
 * Provenance: Firestore tallies for the requested municipality.
 */
export async function getCommunityInsightsOps(
  raw: { municipalityCode: string },
  ctx: AuthCtx
) {
  if (!raw.municipalityCode) {
    throw new OpsError('municipalityCode required', 'validation_failed')
  }
  const muni = raw.municipalityCode.trim()

  const [updatesSnap, ideasSnap, casesSnap] = await Promise.all([
    db
      .collection('municipal_updates')
      .where('municipalityCode', '==', muni)
      .where('status', 'in', ['published', 'updated', 'resolved'])
      .get(),
    db
      .collection('community_ideas')
      .where('municipalityCode', '==', muni)
      .where('status', 'in', CITIZEN_LIST_STATUSES.slice(0, 10))
      .get(),
    db
      .collection('cases')
      .where('muniCode', '==', muni)
      .limit(500)
      .get(),
  ])

  const updatesByType: Record<string, number> = {}
  updatesSnap.docs.forEach((d) => {
    const t = String(d.data().type || 'unknown')
    updatesByType[t] = (updatesByType[t] || 0) + 1
  })

  const ideasByStatus: Record<string, number> = {}
  let totalSupport = 0
  ideasSnap.docs.forEach((d) => {
    const s = String(d.data().status || 'unknown')
    ideasByStatus[s] = (ideasByStatus[s] || 0) + 1
    totalSupport += Number(d.data().supportCount || 0)
  })

  const casesByStatus: Record<string, number> = {}
  casesSnap.docs.forEach((d) => {
    const s = String(d.data().status || 'unknown')
    casesByStatus[s] = (casesByStatus[s] || 0) + 1
  })

  // Auth not strictly required for aggregate public metrics, but log access shape
  void ctx

  return {
    success: true,
    municipalityCode: muni,
    generatedAt: new Date().toISOString(),
    provenance: {
      method: 'deterministic_firestore_counts',
      updateSampleSize: updatesSnap.size,
      ideaSampleSize: ideasSnap.size,
      caseSampleSize: casesSnap.size,
      caseSampleCappedAt: 500,
      predictiveAi: false,
    },
    metrics: {
      publishedUpdates: updatesSnap.size,
      updatesByType,
      openIdeas: ideasSnap.size,
      ideasByStatus,
      totalIdeaSupports: totalSupport,
      recentCasesSampled: casesSnap.size,
      casesByStatus,
    },
  }
}

function serializeIdea(
  data: Record<string, any>,
  opts: { ops: boolean; viewerUid?: string }
) {
  const status = data.status as CommunityIdeaStatus
  const base = {
    ideaId: data.ideaId,
    municipalityCode: data.municipalityCode,
    title: data.title,
    description: data.description,
    category: data.category,
    wardId: data.wardId || null,
    suburbLabel: data.suburbLabel || null,
    mediaPaths: data.mediaPaths || [],
    status,
    statusLabel: CITIZEN_IDEA_STATUS_LABEL[status] || status,
    supportCount: data.supportCount || 0,
    officialResponse: data.officialResponse || null,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null,
    isAuthor: opts.viewerUid ? data.authorUid === opts.viewerUid : false,
    contractVersion: data.contractVersion || COMMUNITY_IDEA_CONTRACT_VERSION,
  }
  if (opts.ops) {
    return {
      ...base,
      authorUid: data.authorUid,
      lastTransitionByUid: data.lastTransitionByUid || null,
      lastTransitionNote: data.lastTransitionNote || null,
    }
  }
  // Never leak authorUid to other citizens
  return base
}
