/**
 * Image-led duplicate intelligence — fail-safe, async, no auto-merge.
 * Does not modify GIS fields. Image is the primary signal; GPS/category/time support.
 */

import * as crypto from 'crypto'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { logCaseTelemetry } from '../telemetry/caseEvents'
import {
  CATEGORY_RADIUS_M,
  SCORING_POLICY_VERSION,
  confidenceBand,
  scorePair,
  type DuplicateCandidateShape,
} from './scoring'

export { CATEGORY_RADIUS_M, SCORING_POLICY_VERSION, scorePair, confidenceBand }
export const IMAGE_INTEL_VERSION = '1.0.0'

const db = getFirestore()
const storage = getStorage()

function mediaBucket() {
  return (
    storage.bucket(process.env.FIREBASE_STORAGE_BUCKET || 'servesa-aad53.firebasestorage.app')
  )
}

export type DuplicateCandidate = DuplicateCandidateShape

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export async function sha256Buffer(buf: Buffer): Promise<string> {
  return crypto.createHash('sha256').update(buf).digest('hex')
}

export async function perceptualHashFromBuffer(buf: Buffer): Promise<string | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { imageHash } = require('image-hash')
    const sharp = require('sharp') as typeof import('sharp')
    const normalised = await sharp(buf)
      .rotate()
      .resize(256, 256, { fit: 'inside' })
      .jpeg({ quality: 85 })
      .toBuffer()
    const hash: string = await new Promise((resolve, reject) => {
      imageHash(
        { ext: 'image/jpeg', data: normalised },
        16,
        true,
        (err: Error | null, data: string) => {
          if (err) reject(err)
          else resolve(data)
        }
      )
    })
    return hash
  } catch (e) {
    console.warn('perceptual hash failed', e)
    return null
  }
}

/**
 * Process one stored media document: fingerprint + candidate scoring.
 * Idempotent by mediaId processing status.
 */
export async function runImageIntelligenceForMedia(mediaId: string): Promise<void> {
  const mediaRef = db.collection('case_media').doc(mediaId)
  const mediaSnap = await mediaRef.get()
  if (!mediaSnap.exists) return
  const media = mediaSnap.data()!
  if (media.intelligenceStatus === 'completed' || media.intelligenceStatus === 'processing') {
    return
  }

  await mediaRef.update({
    intelligenceStatus: 'processing',
    intelligenceStartedAt: FieldValue.serverTimestamp(),
    intelligenceVersion: IMAGE_INTEL_VERSION,
  })

  const caseId = String(media.caseId)
  const caseSnap = await db.collection('cases').doc(caseId).get()
  if (!caseSnap.exists) {
    await mediaRef.update({
      intelligenceStatus: 'failed',
      intelligenceError: 'case_missing',
    })
    return
  }
  const caseData = caseSnap.data()!

  try {
    logCaseTelemetry('media_intelligence_started', { caseId, mediaId })

    const storagePath = String(media.fileName || media.storagePath || '')
    let buf: Buffer | null = null
    let contentHash = media.contentHash || null
    let phash: string | null = null
    try {
      ;[buf] = await mediaBucket().file(storagePath).download()
      contentHash = contentHash || (await sha256Buffer(buf))
      phash = await perceptualHashFromBuffer(buf)
    } catch (dlErr) {
      console.warn('media download failed; continuing with stored hash only', storagePath, dlErr)
      if (!contentHash) throw dlErr
    }

    // Thumbnail (derived, not original)
    let thumbPath: string | null = null
    if (buf) {
      try {
        const sharp = require('sharp') as typeof import('sharp')
        const thumb = await sharp(buf).rotate().resize(320, 320, { fit: 'inside' }).jpeg({ quality: 70 }).toBuffer()
        thumbPath = `cases/${caseId}/thumbnails/${mediaId}.jpg`
        await mediaBucket().file(thumbPath).save(thumb, {
          metadata: { contentType: 'image/jpeg', metadata: { caseId, derived: 'thumbnail' } },
        })
      } catch {
        /* thumbnails optional */
      }
    }

    await mediaRef.update({
      contentHash,
      perceptualHash: phash,
      thumbnailPath: thumbPath,
      intelligenceStatus: 'fingerprinted',
      intelligenceVersion: IMAGE_INTEL_VERSION,
    })

    // Candidate retrieval — municipality-scoped open cases with media fingerprints
    const muni = caseData.muniCode || caseData.location?.municipalityId
    const lat = caseData.location?.lat
    const lng = caseData.location?.lng
    const category = String(caseData.category || '')
    const radius = CATEGORY_RADIUS_M[category] || 100
    const createdAt = caseData.createdAt?.toDate?.() || new Date()

    let candidates: DuplicateCandidate[] = []
    if (muni && typeof lat === 'number' && typeof lng === 'number') {
      const openStatuses = new Set([
        'submitted',
        'acknowledged',
        'assigned',
        'in_progress',
        'resolved',
      ])
      const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      // Bounded: municipality + recent createdAt (existing composite index pattern)
      const q = await db
        .collection('cases')
        .where('muniCode', '==', muni)
        .where('createdAt', '>=', since)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get()

      for (const doc of q.docs) {
        if (doc.id === caseId) continue
        const other = doc.data()
        if (!openStatuses.has(String(other.status))) continue
        if (other.category && other.category !== category) continue
        const olat = other.location?.lat
        const olng = other.location?.lng
        if (typeof olat !== 'number' || typeof olng !== 'number') continue
        const dist = haversineMeters(lat, lng, olat, olng)
        // Pre-filter: within 3x radius OR exact hash will be checked via media
        const otherMedia = await db
          .collection('case_media')
          .where('caseId', '==', doc.id)
          .limit(3)
          .get()
        if (otherMedia.empty) continue

        for (const om of otherMedia.docs) {
          const od = om.data()
          const exact = Boolean(od.contentHash && od.contentHash === contentHash)
          if (!exact && dist > radius * 3) continue
          const otherCreated = other.createdAt?.toDate?.() || new Date(0)
          const timeDiffHours =
            Math.abs(createdAt.getTime() - otherCreated.getTime()) / (1000 * 60 * 60)
          const scored = scorePair({
            exactHash: exact,
            phashA: phash,
            phashB: od.perceptualHash || null,
            distanceMeters: dist,
            radiusMeters: radius,
            categoryMatch: other.category === category,
            timeDiffHours,
          })
          const confidence = confidenceBand(scored.score)
          if (confidence === 'none') continue
          candidates.push({
            caseId: doc.id,
            mediaId: om.id,
            score: scored.score,
            confidence,
            breakdown: scored.breakdown,
            reasons: scored.reasons,
          })
        }
      }
    }

    candidates.sort((a, b) => b.score - a.score)
    candidates = candidates.slice(0, 5)

    const top = candidates[0]
    const recommendation =
      !top
        ? 'none'
        : top.confidence === 'high'
          ? 'high_confidence'
          : top.confidence === 'medium'
            ? 'possible_duplicate'
            : 'low_confidence'

    const anomaly =
      candidates.some((c) => c.reasons.includes('exact_hash_distant_anomaly')) ||
      false

    await mediaRef.update({
      intelligenceStatus: 'completed',
      intelligenceCompletedAt: FieldValue.serverTimestamp(),
    })

    await db.collection('cases').doc(caseId).update({
      imageIntelligence: {
        status: 'completed',
        version: IMAGE_INTEL_VERSION,
        scoringPolicyVersion: SCORING_POLICY_VERSION,
        recommendation,
        confidence: top?.confidence || 'none',
        processedAt: new Date().toISOString(),
      },
      duplicateReview: {
        status:
          recommendation === 'none' || recommendation === 'low_confidence'
            ? 'none'
            : 'pending',
        recommendation,
        confidence: top?.confidence || 'none',
        candidates: candidates.map((c) => ({
          caseId: c.caseId,
          mediaId: c.mediaId,
          score: c.score,
          confidence: c.confidence,
          breakdown: c.breakdown,
          reasons: c.reasons,
        })),
        anomaly,
        decision: null,
        decidedBy: null,
        decidedAt: null,
      },
      updatedAt: FieldValue.serverTimestamp(),
    })

    await db.collection('cases').doc(caseId).collection('events').add({
      caseId,
      eventType: 'media_intelligence_completed',
      description: `Image intelligence ${recommendation}`,
      actorType: 'system',
      actorUid: null,
      timestamp: FieldValue.serverTimestamp(),
      metadata: {
        mediaId,
        recommendation,
        candidateCount: candidates.length,
        scoringPolicyVersion: SCORING_POLICY_VERSION,
        anomaly,
      },
    })

    logCaseTelemetry('media_intelligence_completed', {
      caseId,
      recommendation,
      candidates: candidates.length,
    })
  } catch (error) {
    console.error('image intelligence failed', error)
    await mediaRef.update({
      intelligenceStatus: 'failed',
      intelligenceError: error instanceof Error ? error.message.slice(0, 200) : 'failed',
    })
    await db.collection('cases').doc(caseId).set(
      {
        imageIntelligence: {
          status: 'failed',
          version: IMAGE_INTEL_VERSION,
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
    logCaseTelemetry('media_intelligence_failed', { caseId, mediaId })
  }
}

export async function runImageIntelligenceForCase(caseId: string): Promise<void> {
  const snap = await db.collection('case_media').where('caseId', '==', caseId).limit(5).get()
  for (const doc of snap.docs) {
    await runImageIntelligenceForMedia(doc.id)
  }
}
