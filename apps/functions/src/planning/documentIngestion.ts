/**
 * Municipal planning document upload, extraction, and AI draft pipeline.
 * Server-side only — citizens cannot upload or access unpublished files.
 */

import * as admin from 'firebase-admin'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import {
  UploadPlanningDocumentInputSchema,
  ProcessPlanningDocumentInputSchema,
  UpdatePlanningAiDraftInputSchema,
  GetPlanningPublishingDashboardInputSchema,
  AiExtractDraftSchema,
  PLANNING_ALLOWED_MIME,
  MUNICIPAL_PUBLISHING_CONTRACT_VERSION,
  canTransitionDocumentProcessing,
  computePlanningModuleCompleteness,
  PLANNING_CONTENT_MODULE_IDS,
} from '@servesa/case-contract'
import {
  AuthCtx,
  OpsError,
  assertCommsEditor,
  assertCommsPublisher,
} from '../cases/municipalityOpsShared'
import { logCaseTelemetry } from '../telemetry/caseEvents'
import {
  computeSha256Hex,
  extractTextFromBuffer,
  segmentText,
} from './extractText'
import { generateConservativeAiDraft } from './aiDraftGenerator'

const db = getFirestore()
const storage = getStorage()
const bucket = storage.bucket()

const COLLECTIONS = {
  document: 'municipal_plan_documents',
  priority: 'municipal_priorities',
  project: 'municipal_projects',
  budget_line: 'municipal_budget_lines',
  reviews: 'municipal_plan_reviews',
  extracted: 'municipal_plan_extractions',
} as const

const ALLOWED_MIME = new Set<string>(PLANNING_ALLOWED_MIME)
const MAX_BYTES = 25 * 1024 * 1024

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

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120)
}

function storagePathFor(
  municipalityCode: string,
  documentId: string,
  fileName: string,
  published = false
): string {
  const segment = published ? 'published' : 'documents'
  return `municipal_planning/${municipalityCode}/${segment}/${documentId}/${sanitizeFileName(fileName)}`
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
    domain: 'municipal_publishing',
    municipalityCode,
    entityType,
    entityId,
    eventType,
    actorUid,
    timestamp: FieldValue.serverTimestamp(),
    metadata,
  })
}

function decodeBase64(data: string): Buffer {
  const raw = data.includes(',') ? data.split(',').pop() || '' : data
  return Buffer.from(raw, 'base64')
}

export async function uploadPlanningDocumentOps(raw: unknown, ctx: AuthCtx) {
  const editor = assertCommsEditor(ctx)
  const parsed = UploadPlanningDocumentInputSchema.parse(raw)
  const municipalityCode = resolveMuniFromClaims(editor, parsed.municipalityCode)

  if (!ALLOWED_MIME.has(parsed.file.type)) {
    throw new OpsError('Unsupported document type', 'validation_failed')
  }
  if (parsed.file.size > MAX_BYTES) {
    throw new OpsError('File exceeds 25MB limit', 'validation_failed')
  }

  const buffer = decodeBase64(parsed.file.data)
  if (buffer.length > MAX_BYTES) {
    throw new OpsError('File exceeds 25MB limit', 'validation_failed')
  }

  const sha256 = computeSha256Hex(buffer)

  const dupSnap = await db
    .collection(COLLECTIONS.document)
    .where('municipalityCode', '==', municipalityCode)
    .where('sha256', '==', sha256)
    .limit(1)
    .get()
  if (!dupSnap.empty) {
    const existing = dupSnap.docs[0]
    throw new OpsError(
      `Duplicate document already uploaded (${existing.id})`,
      'duplicate_document',
      409
    )
  }

  const documentId = generateId('DOC')
  const path = storagePathFor(
    municipalityCode,
    documentId,
    parsed.file.name,
    false
  )
  const file = bucket.file(path)
  await file.save(buffer, {
    contentType: parsed.file.type,
    metadata: {
      municipalityCode,
      documentId,
      uploadedBy: ctx.uid,
      sha256,
    },
    resumable: false,
  })

  const ref = db.collection(COLLECTIONS.document).doc(documentId)
  await ref.set({
    documentId,
    municipalityCode,
    kind: parsed.kind,
    title: parsed.title.trim(),
    fiscalYear: parsed.fiscalYear.trim(),
    storagePath: path,
    officialUrl: parsed.officialUrl || null,
    publisher: parsed.publisher?.trim() || null,
    notes: parsed.notes?.trim() || null,
    sha256,
    fileName: sanitizeFileName(parsed.file.name),
    mimeType: parsed.file.type,
    fileSizeBytes: buffer.length,
    processingStatus: 'uploaded',
    publicationStatus: 'draft',
    aiExtractDraft: null,
    extractedTextPath: null,
    contractVersion: MUNICIPAL_PUBLISHING_CONTRACT_VERSION,
    createdAt: FieldValue.serverTimestamp(),
    createdByUid: ctx.uid,
    updatedAt: FieldValue.serverTimestamp(),
    updatedByUid: ctx.uid,
  })

  await appendReview(
    municipalityCode,
    'document',
    documentId,
    'planning_document_uploaded',
    ctx.uid,
    { sha256, kind: parsed.kind, storagePath: path }
  )
  logCaseTelemetry('planning_document_uploaded', {
    documentId,
    municipalityCode,
    kind: parsed.kind,
  })

  return {
    success: true,
    documentId,
    municipalityCode,
    sha256,
    processingStatus: 'uploaded',
    publicationStatus: 'draft',
  }
}

export async function processPlanningDocumentOps(raw: unknown, ctx: AuthCtx) {
  const editor = assertCommsEditor(ctx)
  const parsed = ProcessPlanningDocumentInputSchema.parse(raw)
  const ref = db.collection(COLLECTIONS.document).doc(parsed.documentId)
  const snap = await ref.get()
  if (!snap.exists) throw new OpsError('Document not found', 'not_found', 404)
  const data = snap.data()!
  const municipalityCode = resolveMuniFromClaims(
    editor,
    parsed.municipalityCode || (data.municipalityCode as string)
  )
  if (data.municipalityCode !== municipalityCode && !editor.isAdmin) {
    throw new OpsError('Cross-municipality access denied', 'permission_denied', 403)
  }

  const fromStatus = String(data.processingStatus || 'uploaded')
  if (!parsed.regenerate && fromStatus === 'draft_generated') {
    return {
      success: true,
      documentId: parsed.documentId,
      processingStatus: fromStatus,
      skipped: true,
    }
  }
  if (
    !canTransitionDocumentProcessing(fromStatus, 'processing') &&
    fromStatus !== 'extraction_failed' &&
    fromStatus !== 'draft_generated'
  ) {
    throw new OpsError(
      `Cannot process from status ${fromStatus}`,
      'validation_failed'
    )
  }

  await ref.update({
    processingStatus: 'processing',
    updatedAt: FieldValue.serverTimestamp(),
    updatedByUid: ctx.uid,
  })

  const storagePath = String(data.storagePath || '')
  if (!storagePath) {
    await ref.update({
      processingStatus: 'extraction_failed',
      processingError: 'Missing storage path',
    })
    throw new OpsError('Missing storage path', 'validation_failed')
  }

  const [fileBuffer] = await bucket.file(storagePath).download()
  const mimeType = String(data.mimeType || 'application/pdf')
  const extracted = await extractTextFromBuffer(fileBuffer, mimeType)

  if (!extracted?.text) {
    await ref.update({
      processingStatus: 'extraction_failed',
      processingError: 'Text extraction failed — source file remains available',
      updatedAt: FieldValue.serverTimestamp(),
    })
    await appendReview(
      municipalityCode,
      'document',
      parsed.documentId,
      'planning_extraction_failed',
      ctx.uid,
      {}
    )
    return {
      success: true,
      documentId: parsed.documentId,
      processingStatus: 'extraction_failed',
      extractionAvailable: false,
    }
  }

  const extractionId = generateId('EXT')
  const extractionPath = `municipal_planning/${municipalityCode}/processing/${parsed.documentId}/${extractionId}.txt`
  await bucket.file(extractionPath).save(extracted.text, {
    contentType: 'text/plain; charset=utf-8',
    metadata: { municipalityCode, documentId: parsed.documentId, private: true },
  })

  const draft = generateConservativeAiDraft({
    municipalityCode,
    sourceDocumentId: parsed.documentId,
    documentType: data.kind as never,
    planningPeriod: String(data.fiscalYear),
    extractedText: extracted.text,
    officialTitle: String(data.title),
    officialUrl: (data.officialUrl as string) || null,
  })

  await db.collection(COLLECTIONS.extracted).doc(extractionId).set({
    extractionId,
    documentId: parsed.documentId,
    municipalityCode,
    storagePath: extractionPath,
    segmentCount: segmentText(extracted.text).length,
    pageCount: extracted.pageCount || null,
    charCount: extracted.text.length,
    createdAt: FieldValue.serverTimestamp(),
  })

  await ref.update({
    processingStatus: 'draft_generated',
    publicationStatus: 'awaiting_review',
    aiExtractDraft: draft,
    extractedTextPath: extractionPath,
    processingError: null,
    updatedAt: FieldValue.serverTimestamp(),
    updatedByUid: ctx.uid,
  })

  await appendReview(
    municipalityCode,
    'document',
    parsed.documentId,
    'ai_draft_generated',
    ctx.uid,
    {
      modelProvider: draft.modelProvider,
      modelId: draft.modelId,
      charCount: extracted.text.length,
    }
  )
  logCaseTelemetry('ai_draft_generated', {
    documentId: parsed.documentId,
    municipalityCode,
  })

  return {
    success: true,
    documentId: parsed.documentId,
    processingStatus: 'draft_generated',
    publicationStatus: 'awaiting_review',
    aiExtractDraft: draft,
  }
}

export async function updatePlanningAiDraftOps(raw: unknown, ctx: AuthCtx) {
  const editor = assertCommsEditor(ctx)
  const parsed = UpdatePlanningAiDraftInputSchema.parse(raw)
  const ref = db.collection(COLLECTIONS.document).doc(parsed.documentId)
  const snap = await ref.get()
  if (!snap.exists) throw new OpsError('Document not found', 'not_found', 404)
  const data = snap.data()!
  const municipalityCode = resolveMuniFromClaims(
    editor,
    parsed.municipalityCode || (data.municipalityCode as string)
  )
  if (data.municipalityCode !== municipalityCode && !editor.isAdmin) {
    throw new OpsError('Cross-municipality edit denied', 'permission_denied', 403)
  }

  const draft = AiExtractDraftSchema.parse(parsed.aiExtractDraft)
  if (draft.sourceDocumentId !== parsed.documentId) {
    throw new OpsError('Draft sourceDocumentId mismatch', 'validation_failed')
  }

  await ref.update({
    aiExtractDraft: draft,
    processingStatus: 'under_review',
    publicationStatus: 'awaiting_review',
    updatedAt: FieldValue.serverTimestamp(),
    updatedByUid: ctx.uid,
  })

  await appendReview(
    municipalityCode,
    'document',
    parsed.documentId,
    'ai_draft_reviewed',
    ctx.uid,
    { reviewNote: parsed.reviewNote || null }
  )
  logCaseTelemetry('ai_draft_reviewed', {
    documentId: parsed.documentId,
    municipalityCode,
  })

  return { success: true, documentId: parsed.documentId, processingStatus: 'under_review' }
}

export async function approvePlanningDocumentOps(
  documentId: string,
  ctx: AuthCtx,
  municipalityCodeOverride?: string
) {
  const editor = assertCommsEditor(ctx)
  const ref = db.collection(COLLECTIONS.document).doc(documentId)
  const snap = await ref.get()
  if (!snap.exists) throw new OpsError('Document not found', 'not_found', 404)
  const data = snap.data()!
  const municipalityCode = resolveMuniFromClaims(
    editor,
    municipalityCodeOverride || (data.municipalityCode as string)
  )
  if (data.municipalityCode !== municipalityCode && !editor.isAdmin) {
    throw new OpsError('Cross-municipality edit denied', 'permission_denied', 403)
  }
  if (!data.aiExtractDraft) {
    throw new OpsError('No AI draft to approve', 'validation_failed')
  }

  await ref.update({
    processingStatus: 'approved',
    publicationStatus: 'verified',
    updatedAt: FieldValue.serverTimestamp(),
    updatedByUid: ctx.uid,
  })
  await appendReview(
    municipalityCode,
    'document',
    documentId,
    'planning_content_approved',
    ctx.uid,
    {}
  )
  logCaseTelemetry('planning_content_approved', { documentId, municipalityCode })
  return { success: true, documentId, processingStatus: 'approved' }
}

export async function getPlanningPublishingDashboardOps(
  raw: unknown,
  ctx: AuthCtx
) {
  assertCommsEditor(ctx)
  const parsed = GetPlanningPublishingDashboardInputSchema.parse(raw || {})
  const editor = assertCommsEditor(ctx)
  const municipalityCode = resolveMuniFromClaims(editor, parsed.municipalityCode)

  const docsSnap = await db
    .collection(COLLECTIONS.document)
    .where('municipalityCode', '==', municipalityCode)
    .limit(200)
    .get()

  const docs = docsSnap.docs.map((d) => d.data())
  const countBy = (field: string, value: string) =>
    docs.filter((d) => String(d[field] || '') === value).length

  const publishedPriorities = await db
    .collection(COLLECTIONS.priority)
    .where('municipalityCode', '==', municipalityCode)
    .where('publicationStatus', '==', 'published')
    .limit(1)
    .get()
  const publishedProjects = await db
    .collection(COLLECTIONS.project)
    .where('municipalityCode', '==', municipalityCode)
    .where('publicationStatus', '==', 'published')
    .limit(1)
    .get()
  const publishedBudget = await db
    .collection(COLLECTIONS.budget_line)
    .where('municipalityCode', '==', municipalityCode)
    .where('publicationStatus', '==', 'published')
    .limit(1)
    .get()
  const publishedDocs = docs.filter(
    (d) => d.publicationStatus === 'published'
  )

  const moduleAvailability: Partial<
    Record<(typeof PLANNING_CONTENT_MODULE_IDS)[number], boolean>
  > = {
    municipality_overview: publishedDocs.length > 0,
    strategic_priorities: !publishedPriorities.empty,
    idp_summary: !publishedPriorities.empty,
    budget_overview: !publishedBudget.empty,
    capital_projects: !publishedProjects.empty,
    service_delivery_priorities: false,
    service_contacts: false,
  }
  const completeness = computePlanningModuleCompleteness(moduleAvailability)

  const fiscalYears = docs
    .map((d) => String(d.fiscalYear || ''))
    .filter(Boolean)
    .sort()
  const latestPlanningPeriod = fiscalYears[fiscalYears.length - 1] || null

  return {
    success: true,
    municipalityCode,
    counts: {
      documentsUploaded: docs.length,
      awaitingProcessing: countBy('processingStatus', 'uploaded'),
      processing: countBy('processingStatus', 'processing'),
      aiDraftsAwaitingReview: countBy('processingStatus', 'draft_generated') +
        countBy('processingStatus', 'under_review'),
      approvedUnpublished: docs.filter(
        (d) =>
          d.processingStatus === 'approved' &&
          d.publicationStatus !== 'published'
      ).length,
      publishedDocuments: countBy('publicationStatus', 'published'),
      extractionFailed: countBy('processingStatus', 'extraction_failed'),
    },
    completeness,
    latestPlanningPeriod,
    moduleAvailability,
  }
}

export async function getPlanningDocumentSourceUrlOps(
  documentId: string,
  ctx: AuthCtx
) {
  const editor = assertCommsEditor(ctx)
  const ref = db.collection(COLLECTIONS.document).doc(documentId)
  const snap = await ref.get()
  if (!snap.exists) throw new OpsError('Document not found', 'not_found', 404)
  const data = snap.data()!
  resolveMuniFromClaims(editor, data.municipalityCode as string)
  if (
    !editor.isAdmin &&
    editor.muniCode !== data.municipalityCode
  ) {
    throw new OpsError('Cross-municipality read denied', 'permission_denied', 403)
  }

  const storagePath = String(data.storagePath || '')
  if (!storagePath) throw new OpsError('No source file', 'not_found', 404)
  const [url] = await bucket.file(storagePath).getSignedUrl({
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000,
  })
  return { success: true, url, documentId }
}

export async function publishPlanningDocumentOps(
  documentId: string,
  ctx: AuthCtx
) {
  const publisher = assertCommsPublisher(ctx)
  const ref = db.collection(COLLECTIONS.document).doc(documentId)
  const snap = await ref.get()
  if (!snap.exists) throw new OpsError('Document not found', 'not_found', 404)
  const data = snap.data()!
  const municipalityCode = resolveMuniFromClaims(
    publisher,
    data.municipalityCode as string
  )
  if (data.municipalityCode !== municipalityCode && !publisher.isAdmin) {
    throw new OpsError('Cross-municipality publish denied', 'permission_denied', 403)
  }
  if (data.processingStatus !== 'approved' && data.publicationStatus !== 'verified') {
    throw new OpsError(
      'Document must be approved before publish',
      'validation_failed'
    )
  }

  const sourcePath = String(data.storagePath || '')
  const fileName = String(data.fileName || 'document.pdf')
  const publishedPath = storagePathFor(
    municipalityCode,
    documentId,
    fileName,
    true
  )
  if (sourcePath) {
    await bucket.file(sourcePath).copy(bucket.file(publishedPath))
  }

  await ref.update({
    publicationStatus: 'published',
    publishedStoragePath: publishedPath,
    publishedAt: FieldValue.serverTimestamp(),
    publishedByUid: ctx.uid,
    updatedAt: FieldValue.serverTimestamp(),
  })

  await appendReview(
    municipalityCode,
    'document',
    documentId,
    'planning_content_published',
    ctx.uid,
    { publishedStoragePath: publishedPath }
  )
  logCaseTelemetry('planning_content_published', { documentId, municipalityCode })

  return { success: true, documentId, publicationStatus: 'published' }
}
