/**
 * Municipal Planning ops + citizen summary.
 * Municipality identity for writes always from JWT claims.
 * AI extract drafts never auto-publish.
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import {
  UpsertPlanDocumentInputSchema,
  UpsertPriorityInputSchema,
  UpsertMunicipalProjectInputSchema,
  UpsertBudgetLineInputSchema,
  TransitionPlanningStatusInputSchema,
  GetMunicipalPlanningSummaryInputSchema,
  GetMunicipalProjectInputSchema,
  ListPlanningEntitiesInputSchema,
  assertPlanPublicationTransition,
  MUNICIPAL_PLANNING_CONTRACT_VERSION,
  PLANNING_EMPTY_COPY,
  type PlanPublicationStatus,
} from '@servesa/case-contract'
import {
  AuthCtx,
  OpsError,
  assertCommsEditor,
  assertCommsPublisher,
} from '../cases/municipalityOpsShared'
import { logCaseTelemetry } from '../telemetry/caseEvents'

const db = getFirestore()

const COLLECTIONS = {
  plan: 'municipal_plans',
  document: 'municipal_plan_documents',
  priority: 'municipal_priorities',
  project: 'municipal_projects',
  budget_line: 'municipal_budget_lines',
  reviews: 'municipal_plan_reviews',
} as const

function collectionFor(
  entityType: 'document' | 'priority' | 'project' | 'budget_line' | 'plan'
): string {
  return COLLECTIONS[entityType]
}

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

function resolveMuniFromClaims(
  official: { isAdmin: boolean; muniCode: string | null },
  clientMuni?: string | null
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

async function appendReview(
  municipalityCode: string,
  entityType: string,
  entityId: string,
  eventType: string,
  actorUid: string,
  metadata: Record<string, unknown>
) {
  const ref = db.collection(COLLECTIONS.reviews).doc()
  await ref.set({
    reviewId: ref.id,
    municipalityCode,
    entityType,
    entityId,
    eventType,
    actorUid,
    timestamp: FieldValue.serverTimestamp(),
    metadata,
  })
  await db.collection('audit_logs').doc(ref.id).set({
    logId: ref.id,
    domain: 'municipal_planning',
    municipalityCode,
    entityType,
    entityId,
    eventType,
    actorUid,
    timestamp: FieldValue.serverTimestamp(),
    metadata,
  })
}

function serializeTimestamps(data: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...data }
  for (const [k, v] of Object.entries(out)) {
    if (v && typeof v === 'object' && typeof (v as { toDate?: () => Date }).toDate === 'function') {
      out[k] = (v as { toDate: () => Date }).toDate().toISOString()
    }
  }
  return out
}

// —— Upserts (editors) ——

export async function upsertPlanDocumentOps(raw: unknown, ctx: AuthCtx) {
  const editor = assertCommsEditor(ctx)
  const parsed = UpsertPlanDocumentInputSchema.parse(raw)
  const municipalityCode = resolveMuniFromClaims(editor, parsed.municipalityCode)
  const requestedStatus = parsed.publicationStatus || 'draft'
  if (requestedStatus !== 'draft' && requestedStatus !== 'awaiting_review') {
    throw new OpsError(
      'Use transitionPlanningStatus for verify/publish/archive',
      'validation_failed'
    )
  }

  const documentId = parsed.documentId || generateId('DOC')
  const ref = db.collection(COLLECTIONS.document).doc(documentId)
  const existing = await ref.get()
  if (existing.exists) {
    const data = existing.data()!
    if (data.municipalityCode !== municipalityCode && !editor.isAdmin) {
      throw new OpsError('Cross-municipality edit denied', 'permission_denied', 403)
    }
  }

  const payload: Record<string, unknown> = {
    documentId,
    municipalityCode,
    kind: parsed.kind,
    title: parsed.title.trim(),
    fiscalYear: parsed.fiscalYear.trim(),
    storagePath: parsed.storagePath || null,
    officialUrl: parsed.officialUrl || null,
    publisher: parsed.publisher?.trim() || null,
    notes: parsed.notes?.trim() || null,
    aiExtractDraft: parsed.aiExtractDraft || null,
    publicationStatus: requestedStatus,
    contractVersion: MUNICIPAL_PLANNING_CONTRACT_VERSION,
    updatedAt: FieldValue.serverTimestamp(),
    updatedByUid: ctx.uid,
  }
  if (!existing.exists) {
    payload.createdAt = FieldValue.serverTimestamp()
    payload.createdByUid = ctx.uid
  }

  await ref.set(payload, { merge: true })
  await appendReview(municipalityCode, 'document', documentId, 'document_upserted', ctx.uid, {
    status: requestedStatus,
    kind: parsed.kind,
  })
  logCaseTelemetry('municipal_plan_document_upserted', {
    documentId,
    municipalityCode,
    status: requestedStatus,
  })
  return { success: true, documentId, publicationStatus: requestedStatus, municipalityCode }
}

export async function upsertPriorityOps(raw: unknown, ctx: AuthCtx) {
  const editor = assertCommsEditor(ctx)
  const parsed = UpsertPriorityInputSchema.parse(raw)
  const municipalityCode = resolveMuniFromClaims(editor, parsed.municipalityCode)
  const requestedStatus = parsed.publicationStatus || 'draft'
  if (requestedStatus !== 'draft' && requestedStatus !== 'awaiting_review') {
    throw new OpsError(
      'Use transitionPlanningStatus for verify/publish/archive',
      'validation_failed'
    )
  }

  const priorityId = parsed.priorityId || generateId('PRI')
  const ref = db.collection(COLLECTIONS.priority).doc(priorityId)
  const existing = await ref.get()
  if (existing.exists) {
    const data = existing.data()!
    if (data.municipalityCode !== municipalityCode && !editor.isAdmin) {
      throw new OpsError('Cross-municipality edit denied', 'permission_denied', 403)
    }
  }

  const payload: Record<string, unknown> = {
    priorityId,
    municipalityCode,
    planId: parsed.planId || null,
    title: parsed.title.trim(),
    plainLanguageSummary: parsed.plainLanguageSummary.trim(),
    isServeSaSummary: parsed.isServeSaSummary !== false,
    officialWording: parsed.officialWording || null,
    sortOrder: parsed.sortOrder ?? 0,
    budgeted: parsed.budgeted || null,
    progressPercent:
      parsed.progressPercent === undefined ? null : parsed.progressPercent,
    relatedProjectIds: parsed.relatedProjectIds || [],
    sources: parsed.sources,
    confidence: parsed.confidence || 'awaiting_verification',
    publicationStatus: requestedStatus,
    contractVersion: MUNICIPAL_PLANNING_CONTRACT_VERSION,
    updatedAt: FieldValue.serverTimestamp(),
    updatedByUid: ctx.uid,
  }
  if (!existing.exists) {
    payload.createdAt = FieldValue.serverTimestamp()
    payload.createdByUid = ctx.uid
  }

  await ref.set(payload, { merge: true })
  await appendReview(municipalityCode, 'priority', priorityId, 'priority_upserted', ctx.uid, {
    status: requestedStatus,
  })
  logCaseTelemetry('municipal_priority_upserted', { priorityId, municipalityCode })
  return { success: true, priorityId, publicationStatus: requestedStatus, municipalityCode }
}

export async function upsertMunicipalProjectOps(raw: unknown, ctx: AuthCtx) {
  const editor = assertCommsEditor(ctx)
  const parsed = UpsertMunicipalProjectInputSchema.parse(raw)
  const municipalityCode = resolveMuniFromClaims(editor, parsed.municipalityCode)
  const requestedStatus = parsed.publicationStatus || 'draft'
  if (requestedStatus !== 'draft' && requestedStatus !== 'awaiting_review') {
    throw new OpsError(
      'Use transitionPlanningStatus for verify/publish/archive',
      'validation_failed'
    )
  }

  // Never invent ward mapping — if wardIds provided without flag, require explicit flag
  const wardIds = parsed.wardIds || []
  const wardMappingAvailable = Boolean(parsed.wardMappingAvailable && wardIds.length > 0)

  const projectId = parsed.projectId || generateId('PRJ')
  const ref = db.collection(COLLECTIONS.project).doc(projectId)
  const existing = await ref.get()
  if (existing.exists) {
    const data = existing.data()!
    if (data.municipalityCode !== municipalityCode && !editor.isAdmin) {
      throw new OpsError('Cross-municipality edit denied', 'permission_denied', 403)
    }
  }

  const payload: Record<string, unknown> = {
    projectId,
    municipalityCode,
    planId: parsed.planId || null,
    title: parsed.title.trim(),
    plainLanguageSummary: parsed.plainLanguageSummary.trim(),
    isServeSaSummary: parsed.isServeSaSummary !== false,
    officialDescription: parsed.officialDescription || null,
    status: parsed.status,
    scope: parsed.scope,
    wardIds: wardMappingAvailable ? wardIds : [],
    wardMappingAvailable,
    departmentLabel: parsed.departmentLabel || null,
    locationLabel: parsed.locationLabel || null,
    startDate: parsed.startDate ? new Date(parsed.startDate) : null,
    expectedEndDate: parsed.expectedEndDate
      ? new Date(parsed.expectedEndDate)
      : null,
    progressPercent:
      parsed.progressPercent === undefined ? null : parsed.progressPercent,
    budgeted: parsed.budgeted || null,
    spent: parsed.spent || null,
    priorityIds: parsed.priorityIds || [],
    relatedUpdateIds: parsed.relatedUpdateIds || [],
    relatedCaseIds: parsed.relatedCaseIds || [],
    officialSourceUrl: parsed.officialSourceUrl || null,
    sources: parsed.sources,
    confidence: parsed.confidence || 'awaiting_verification',
    publicationStatus: requestedStatus,
    contractVersion: MUNICIPAL_PLANNING_CONTRACT_VERSION,
    updatedAt: FieldValue.serverTimestamp(),
    updatedByUid: ctx.uid,
  }
  if (!existing.exists) {
    payload.createdAt = FieldValue.serverTimestamp()
    payload.createdByUid = ctx.uid
  }

  await ref.set(payload, { merge: true })
  await appendReview(municipalityCode, 'project', projectId, 'project_upserted', ctx.uid, {
    status: requestedStatus,
    projectStatus: parsed.status,
  })
  logCaseTelemetry('municipal_project_upserted', { projectId, municipalityCode })
  return { success: true, projectId, publicationStatus: requestedStatus, municipalityCode }
}

export async function upsertBudgetLineOps(raw: unknown, ctx: AuthCtx) {
  const editor = assertCommsEditor(ctx)
  const parsed = UpsertBudgetLineInputSchema.parse(raw)
  const municipalityCode = resolveMuniFromClaims(editor, parsed.municipalityCode)
  const requestedStatus = parsed.publicationStatus || 'draft'
  if (requestedStatus !== 'draft' && requestedStatus !== 'awaiting_review') {
    throw new OpsError(
      'Use transitionPlanningStatus for verify/publish/archive',
      'validation_failed'
    )
  }

  const budgetLineId = parsed.budgetLineId || generateId('BUD')
  const ref = db.collection(COLLECTIONS.budget_line).doc(budgetLineId)
  const existing = await ref.get()
  if (existing.exists) {
    const data = existing.data()!
    if (data.municipalityCode !== municipalityCode && !editor.isAdmin) {
      throw new OpsError('Cross-municipality edit denied', 'permission_denied', 403)
    }
  }

  const payload: Record<string, unknown> = {
    budgetLineId,
    municipalityCode,
    planId: parsed.planId || null,
    fiscalYear: parsed.fiscalYear.trim(),
    categoryLabel: parsed.categoryLabel.trim(),
    plainLanguageLabel: parsed.plainLanguageLabel.trim(),
    amount: parsed.amount,
    sortOrder: parsed.sortOrder ?? 0,
    confidence: parsed.confidence || 'awaiting_verification',
    publicationStatus: requestedStatus,
    contractVersion: MUNICIPAL_PLANNING_CONTRACT_VERSION,
    updatedAt: FieldValue.serverTimestamp(),
    updatedByUid: ctx.uid,
  }
  if (!existing.exists) {
    payload.createdAt = FieldValue.serverTimestamp()
    payload.createdByUid = ctx.uid
  }

  await ref.set(payload, { merge: true })
  await appendReview(municipalityCode, 'budget_line', budgetLineId, 'budget_line_upserted', ctx.uid, {
    status: requestedStatus,
  })
  logCaseTelemetry('municipal_budget_line_upserted', {
    budgetLineId,
    municipalityCode,
  })
  return { success: true, budgetLineId, publicationStatus: requestedStatus, municipalityCode }
}

export async function transitionPlanningStatusOps(raw: unknown, ctx: AuthCtx) {
  const parsed = TransitionPlanningStatusInputSchema.parse(raw)
  const toStatus = parsed.toStatus as PlanPublicationStatus

  // Verify/publish require publisher; draft corrections may be editors
  if (toStatus === 'verified' || toStatus === 'published' || toStatus === 'archived') {
    assertCommsPublisher(ctx)
  } else {
    assertCommsEditor(ctx)
  }
  const actor = assertCommsEditor(ctx)

  const col = collectionFor(parsed.entityType)
  const ref = db.collection(col).doc(parsed.entityId)
  const snap = await ref.get()
  if (!snap.exists) throw new OpsError('Entity not found', 'not_found', 404)
  const data = snap.data()!
  const municipalityCode = resolveMuniFromClaims(actor, data.municipalityCode)
  if (data.municipalityCode !== municipalityCode && !actor.isAdmin) {
    throw new OpsError('Cross-municipality transition denied', 'permission_denied', 403)
  }

  const from = (data.publicationStatus || 'draft') as string
  if (from !== toStatus) {
    assertPlanPublicationTransition(from, toStatus)
  }

  const patch: Record<string, unknown> = {
    publicationStatus: toStatus,
    updatedAt: FieldValue.serverTimestamp(),
    updatedByUid: ctx.uid,
  }
  if (toStatus === 'verified') {
    patch.verifiedAt = FieldValue.serverTimestamp()
    patch.verifiedByUid = ctx.uid
  }
  if (toStatus === 'published') {
    if (from !== 'verified' && from !== 'published') {
      // Contract requires verified before published — assertPlanPublicationTransition enforces
    }
    patch.publishedAt = FieldValue.serverTimestamp()
    patch.publishedByUid = ctx.uid
  }
  if (parsed.reviewNote) {
    patch.lastReviewNote = parsed.reviewNote.trim()
  }

  await ref.update(patch)
  await appendReview(
    municipalityCode,
    parsed.entityType,
    parsed.entityId,
    'status_transitioned',
    ctx.uid,
    { from, to: toStatus, reviewNote: parsed.reviewNote || null }
  )
  logCaseTelemetry('municipal_planning_status_transitioned', {
    entityType: parsed.entityType,
    entityId: parsed.entityId,
    municipalityCode,
    from,
    to: toStatus,
  })
  return {
    success: true,
    entityType: parsed.entityType,
    entityId: parsed.entityId,
    publicationStatus: toStatus,
    municipalityCode,
  }
}

export async function listPlanningEntitiesOps(raw: unknown, ctx: AuthCtx) {
  const parsed = ListPlanningEntitiesInputSchema.parse(raw || {})
  const citizenView = Boolean(parsed.citizenView)
  let municipalityCode = parsed.municipalityCode.trim()

  if (!citizenView) {
    const official = assertCommsEditor(ctx)
    municipalityCode = resolveMuniFromClaims(official, municipalityCode)
  }

  const col = collectionFor(parsed.entityType)
  let query = db
    .collection(col)
    .where('municipalityCode', '==', municipalityCode)
    .limit(parsed.limit || 50)

  if (citizenView) {
    query = query.where('publicationStatus', '==', 'published')
  } else if (parsed.publicationStatus) {
    query = query.where('publicationStatus', '==', parsed.publicationStatus)
  }

  const snap = await query.get()
  let items = snap.docs.map((d) =>
    serializeTimestamps(d.data() as Record<string, unknown>)
  )

  if (citizenView && parsed.wardId && parsed.entityType === 'project') {
    // Filter client-side after fetch for ward — only when mapping exists
    items = items.filter((p) => {
      const wards = (p.wardIds as string[]) || []
      return Boolean(p.wardMappingAvailable) && wards.includes(parsed.wardId!)
    })
  }

  return {
    success: true,
    municipalityCode,
    entityType: parsed.entityType,
    items,
    emptyCopy: items.length === 0 ? PLANNING_EMPTY_COPY.notPublished : null,
  }
}

export async function getMunicipalPlanningSummaryOps(raw: unknown, _ctx: AuthCtx) {
  const parsed = GetMunicipalPlanningSummaryInputSchema.parse(raw || {})
  const municipalityCode = parsed.municipalityCode.trim()
  const wardId = parsed.wardId?.trim() || null

  const [prioritiesSnap, projectsSnap, budgetSnap, docsSnap] = await Promise.all([
    db
      .collection(COLLECTIONS.priority)
      .where('municipalityCode', '==', municipalityCode)
      .where('publicationStatus', '==', 'published')
      .limit(40)
      .get(),
    db
      .collection(COLLECTIONS.project)
      .where('municipalityCode', '==', municipalityCode)
      .where('publicationStatus', '==', 'published')
      .limit(80)
      .get(),
    db
      .collection(COLLECTIONS.budget_line)
      .where('municipalityCode', '==', municipalityCode)
      .where('publicationStatus', '==', 'published')
      .limit(40)
      .get(),
    db
      .collection(COLLECTIONS.document)
      .where('municipalityCode', '==', municipalityCode)
      .where('publicationStatus', '==', 'published')
      .limit(20)
      .get(),
  ])

  const priorities = prioritiesSnap.docs
    .map((d) => serializeTimestamps(d.data() as Record<string, unknown>))
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))

  const projects = projectsSnap.docs.map((d) =>
    serializeTimestamps(d.data() as Record<string, unknown>)
  )
  const budgetLines = budgetSnap.docs
    .map((d) => serializeTimestamps(d.data() as Record<string, unknown>))
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
  const documents = docsSnap.docs.map((d) =>
    serializeTimestamps(d.data() as Record<string, unknown>)
  )

  const anyWardMapping = projects.some((p) => Boolean(p.wardMappingAvailable))
  const wardProjects =
    wardId && anyWardMapping
      ? projects.filter((p) => {
          const wards = (p.wardIds as string[]) || []
          return Boolean(p.wardMappingAvailable) && wards.includes(wardId)
        })
      : []

  const publishedProjectCount = projects.length
  const completedCount = projects.filter((p) => p.status === 'completed').length
  const inProgressCount = projects.filter((p) => p.status === 'in_progress').length
  const budgetTotalZar = budgetLines.reduce((sum, line) => {
    const amount = line.amount as { amountZar?: number } | null
    return sum + (typeof amount?.amountZar === 'number' ? amount.amountZar : 0)
  }, 0)

  // KPIs only from published data — never invent
  const kpis = [
    {
      id: 'priorities',
      label: 'Published priorities',
      value: priorities.length,
      unit: 'count' as const,
      confidence: priorities.length
        ? ('verified_official' as const)
        : ('not_published' as const),
    },
    {
      id: 'projects',
      label: 'Published projects',
      value: publishedProjectCount,
      unit: 'count' as const,
      confidence: publishedProjectCount
        ? ('verified_official' as const)
        : ('not_published' as const),
    },
    {
      id: 'in_progress',
      label: 'In progress',
      value: inProgressCount,
      unit: 'count' as const,
      confidence: publishedProjectCount
        ? ('verified_official' as const)
        : ('not_published' as const),
    },
    {
      id: 'completed',
      label: 'Completed',
      value: completedCount,
      unit: 'count' as const,
      confidence: publishedProjectCount
        ? ('verified_official' as const)
        : ('not_published' as const),
    },
    {
      id: 'budget_total',
      label: 'Published budget total',
      value: budgetTotalZar,
      unit: 'zar' as const,
      confidence: budgetLines.length
        ? ('verified_official' as const)
        : ('not_published' as const),
    },
  ]

  logCaseTelemetry('municipal_planning_summary_viewed', {
    municipalityCode,
    hasWard: Boolean(wardId),
    priorityCount: priorities.length,
    projectCount: publishedProjectCount,
  })

  return {
    success: true,
    municipalityCode,
    wardId,
    kpis,
    priorities,
    projects,
    budgetLines,
    documents,
    community: {
      wardId,
      wardMappingAvailable: anyWardMapping,
      wardProjects,
      emptyCopy: !anyWardMapping
        ? PLANNING_EMPTY_COPY.noWardMapping
        : wardProjects.length === 0
          ? PLANNING_EMPTY_COPY.notPublished
          : null,
    },
    empty:
      priorities.length === 0 &&
      projects.length === 0 &&
      budgetLines.length === 0,
    emptyCopy: PLANNING_EMPTY_COPY.notPublished,
    contractVersion: MUNICIPAL_PLANNING_CONTRACT_VERSION,
  }
}

export async function getMunicipalProjectOps(raw: unknown, ctx: AuthCtx) {
  const parsed = GetMunicipalProjectInputSchema.parse(raw)
  const ref = db.collection(COLLECTIONS.project).doc(parsed.projectId)
  const snap = await ref.get()
  if (!snap.exists) throw new OpsError('Project not found', 'not_found', 404)
  const data = snap.data()! as Record<string, unknown>

  const isOfficial = (() => {
    try {
      assertCommsEditor(ctx)
      return true
    } catch {
      return false
    }
  })()

  if (data.publicationStatus !== 'published') {
    if (!isOfficial) {
      throw new OpsError('Project not published', 'permission_denied', 403)
    }
    const official = assertCommsEditor(ctx)
    if (
      !official.isAdmin &&
      official.muniCode !== data.municipalityCode
    ) {
      throw new OpsError('Cross-municipality read denied', 'permission_denied', 403)
    }
  }

  // Related municipal updates (published family only for citizens)
  const relatedUpdateIds = (data.relatedUpdateIds as string[]) || []
  const relatedUpdates: Record<string, unknown>[] = []
  for (const updateId of relatedUpdateIds.slice(0, 10)) {
    const u = await db.collection('municipal_updates').doc(updateId).get()
    if (!u.exists) continue
    const ud = u.data()! as Record<string, unknown>
    if (
      ud.municipalityCode === data.municipalityCode &&
      ['published', 'updated', 'resolved'].includes(String(ud.status))
    ) {
      relatedUpdates.push(serializeTimestamps(ud))
    }
  }

  // Related cases — only safe public fields for citizens (case numbers if linked)
  const relatedCaseIds = (data.relatedCaseIds as string[]) || []
  const relatedReports: { caseId: string; caseNumber?: string; status?: string }[] =
    []
  if (isOfficial && relatedCaseIds.length) {
    for (const caseId of relatedCaseIds.slice(0, 10)) {
      const c = await db.collection('cases').doc(caseId).get()
      if (!c.exists) continue
      const cd = c.data()! as Record<string, unknown>
      if (cd.muniCode === data.municipalityCode) {
        relatedReports.push({
          caseId,
          caseNumber: String(cd.caseNumber || caseId),
          status: cd.status ? String(cd.status) : undefined,
        })
      }
    }
  }

  logCaseTelemetry('municipal_project_viewed', {
    projectId: parsed.projectId,
    municipalityCode: String(data.municipalityCode || ''),
  })

  return {
    success: true,
    project: serializeTimestamps(data),
    relatedUpdates,
    relatedReports,
    contractVersion: MUNICIPAL_PLANNING_CONTRACT_VERSION,
  }
}
