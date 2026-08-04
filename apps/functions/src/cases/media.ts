/**
 * Case media upload — only against an existing owned case.
 * Paths: cases/{caseId}/media/{fileName}
 */

import * as admin from 'firebase-admin'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { logCaseTelemetry } from '../telemetry/caseEvents'

const db = getFirestore()
const storage = getStorage()

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])

const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'])
const MAX_BYTES = 10 * 1024 * 1024

interface MediaUploadData {
  caseId: string
  files: Array<{
    name: string
    type: string
    size: number
    data: string
    contentHash?: string
  }>
  userId?: string
}

interface MediaProcessingResult {
  success: boolean
  mediaUrls: string[]
  failed: Array<{ name: string; reason: string }>
  status: 'completed' | 'partial' | 'failed'
  error?: string
}

function getExt(fileName: string): string {
  const i = fileName.lastIndexOf('.')
  return i === -1 ? '' : fileName.slice(i + 1).toLowerCase()
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 120)
}

function validateFile(file: {
  name: string
  type: string
  size: number
  data: string
}): void {
  if (!file.name) throw new Error('File name is required')
  if (file.size > MAX_BYTES) throw new Error('File exceeds 10MB limit')
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`)
  }
  const ext = getExt(file.name)
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error(`Unsupported file extension: ${ext}`)
  }
  // Reject executable disguises
  const lower = file.name.toLowerCase()
  if (
    lower.endsWith('.exe') ||
    lower.endsWith('.js') ||
    lower.endsWith('.html') ||
    lower.endsWith('.sh')
  ) {
    throw new Error('Executable or script uploads are not allowed')
  }
}

async function assertCaseOwnership(
  caseId: string,
  userId?: string
): Promise<Record<string, any>> {
  const caseDoc = await db.collection('cases').doc(caseId).get()
  if (!caseDoc.exists) {
    throw new Error('Case not found')
  }
  const data = caseDoc.data()!
  if (userId && data.reporterUid && data.reporterUid !== userId) {
    throw new Error('Not authorised to attach media to this case')
  }
  return data
}

/**
 * Callable media upload against a durable case ID.
 */
export const processMediaUpload = async (
  data: MediaUploadData
): Promise<MediaProcessingResult> => {
  const failed: Array<{ name: string; reason: string }> = []
  const mediaUrls: string[] = []

  try {
    const { caseId, files, userId } = data
    if (!caseId) throw new Error('caseId is required')
    if (!files?.length) throw new Error('No files provided')

    await assertCaseOwnership(caseId, userId)

    logCaseTelemetry('media_upload_started', {
      caseId,
      fileCount: files.length,
    })

    await db.collection('cases').doc(caseId).update({
      'media.status': 'processing',
      updatedAt: FieldValue.serverTimestamp(),
    })

    for (const file of files) {
      try {
        // Idempotency via content hash if provided
        if (file.contentHash) {
          const existing = await db
            .collection('case_media')
            .where('caseId', '==', caseId)
            .where('contentHash', '==', file.contentHash)
            .limit(1)
            .get()
          if (!existing.empty) {
            const url = existing.docs[0].data().url
            if (url) mediaUrls.push(url)
            continue
          }
        }

        validateFile(file)
        const processed = await processFile(file, caseId, userId || 'anonymous')
        mediaUrls.push(processed.url)
      } catch (error) {
        failed.push({
          name: file.name,
          reason: error instanceof Error ? error.message : 'upload failed',
        })
      }
    }

    const status: MediaProcessingResult['status'] =
      mediaUrls.length === 0
        ? 'failed'
        : failed.length > 0
          ? 'partial'
          : 'completed'

    const caseUpdate: Record<string, unknown> = {
      'media.status': status,
      'media.count': FieldValue.increment(mediaUrls.length),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: userId || 'anonymous',
    }
    if (mediaUrls.length > 0) {
      caseUpdate.mediaUrls = FieldValue.arrayUnion(...mediaUrls)
      caseUpdate['media.paths'] = FieldValue.arrayUnion(
        ...mediaUrls.map(() => `cases/${caseId}/media`)
      )
    }

    await db.collection('cases').doc(caseId).update(caseUpdate)

    if (mediaUrls.length > 0) {
      await db.collection('cases').doc(caseId).collection('events').add({
        caseId,
        eventType: 'media_uploaded',
        description: `${mediaUrls.length} media file(s) uploaded`,
        actorUid: userId || null,
        timestamp: FieldValue.serverTimestamp(),
        metadata: {
          fileCount: mediaUrls.length,
          failedCount: failed.length,
        },
      })
    }

    logCaseTelemetry('media_upload_completed', {
      caseId,
      uploaded: mediaUrls.length,
      failed: failed.length,
      status,
    })

    return {
      success: mediaUrls.length > 0,
      mediaUrls,
      failed,
      status,
      error: status === 'failed' ? 'No files were successfully processed' : undefined,
    }
  } catch (error) {
    console.error('Error processing media upload:', error)
    return {
      success: false,
      mediaUrls: [],
      failed,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function processFile(
  file: { name: string; type: string; size: number; data: string; contentHash?: string },
  caseId: string,
  userId: string
): Promise<{ name: string; type: string; size: number; url: string }> {
  const timestamp = Date.now()
  const fileName = `cases/${caseId}/media/${timestamp}_${sanitizeFileName(file.name)}`
  const downloadToken = require('crypto').randomUUID()
  const fileBuffer = Buffer.from(file.data, 'base64')
  const bucket = storage.bucket()
  const fileRef = bucket.file(fileName)

  await fileRef.save(fileBuffer, {
    metadata: {
      contentType: file.type,
      metadata: {
        caseId,
        userId,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        firebaseStorageDownloadTokens: downloadToken,
      },
    },
  })

  const bucketName = bucket.name
  const encodedPath = encodeURIComponent(fileName)
  const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${downloadToken}`

  await db.collection('case_media').add({
    caseId,
    fileName,
    originalName: file.name,
    type: file.type,
    size: file.size,
    url: downloadUrl,
    storagePath: fileName,
    contentHash: file.contentHash || null,
    processingStatus: 'stored',
    uploadedBy: userId,
    uploadedAt: FieldValue.serverTimestamp(),
  })

  return {
    name: file.name,
    type: file.type,
    size: file.size,
    url: downloadUrl,
  }
}

/**
 * Storage onFinalize processor — idempotent finalisation hook.
 */
export const onMediaObjectFinalized = async (object: {
  name?: string
  contentType?: string
  metadata?: Record<string, string>
}): Promise<void> => {
  const name = object.name
  if (!name || !name.startsWith('cases/') || !name.includes('/media/')) {
    return
  }
  const parts = name.split('/')
  const caseId = parts[1]
  if (!caseId) return

  const existing = await db
    .collection('case_media')
    .where('storagePath', '==', name)
    .limit(1)
    .get()

  if (!existing.empty) {
    return // already recorded
  }

  await db.collection('case_media').add({
    caseId,
    fileName: name,
    storagePath: name,
    type: object.contentType || 'application/octet-stream',
    processingStatus: 'stored',
    uploadedBy: object.metadata?.userId || 'system',
    uploadedAt: FieldValue.serverTimestamp(),
  })
}

export const deleteCaseMedia = async (
  caseId: string,
  userId: string
): Promise<void> => {
  await assertCaseOwnership(caseId, userId)
  const mediaSnapshot = await db
    .collection('case_media')
    .where('caseId', '==', caseId)
    .get()
  const bucket = storage.bucket()

  for (const mediaDoc of mediaSnapshot.docs) {
    const mediaData = mediaDoc.data()
    try {
      await bucket.file(mediaData.fileName || mediaData.storagePath).delete()
    } catch (error) {
      console.error(`Error deleting file ${mediaData.fileName}:`, error)
    }
    await mediaDoc.ref.delete()
  }
}

export const getCaseMedia = async (caseId: string): Promise<any[]> => {
  const mediaSnapshot = await db
    .collection('case_media')
    .where('caseId', '==', caseId)
    .get()
  return mediaSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

export const generateSignedUrl = async (
  fileName: string,
  expiresIn: number = 3600
): Promise<string> => {
  const bucket = storage.bucket()
  const [signedUrl] = await bucket.file(fileName).getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresIn * 1000,
  })
  return signedUrl
}

export const compressImage = async (
  fileBuffer: Buffer,
  _quality: number = 80
): Promise<Buffer> => fileBuffer

export const extractImageMetadata = async (
  _fileBuffer: Buffer
): Promise<any> => ({
  width: 0,
  height: 0,
  format: 'unknown',
  hasLocation: false,
  location: null,
})

// Avoid unused import warning for admin namespace usage patterns
void admin
