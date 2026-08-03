/**
 * Duplicate assessment — advisory only.
 * Never auto-closes or merges citizen cases without an authorised workflow.
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { logCaseTelemetry } from '../telemetry/caseEvents'

const db = getFirestore()

interface DedupeRequest {
  caseId: string
  threshold?: number
  timeWindow?: number
}

export interface DedupeResult {
  success: boolean
  caseId: string
  status: 'completed' | 'skipped' | 'failed'
  duplicates: Array<{
    caseId: string
    similarity: number
    distance: number
    timeDiffHours: number
    signals: string[]
  }>
  linked: false
  suggested: boolean
  error?: string
}

function toDate(value: any): Date {
  if (!value) return new Date(0)
  if (typeof value.toDate === 'function') return value.toDate()
  if (value instanceof Date) return value
  return new Date(value)
}

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

function textSimilarity(a: string, b: string): number {
  const ta = new Set(
    (a || '')
      .toLowerCase()
      .split(/\W+/)
      .filter(Boolean)
  )
  const tb = new Set(
    (b || '')
      .toLowerCase()
      .split(/\W+/)
      .filter(Boolean)
  )
  if (ta.size === 0 || tb.size === 0) return 0
  let inter = 0
  for (const t of ta) if (tb.has(t)) inter++
  return inter / Math.max(ta.size, tb.size)
}

export const dedupeCase = async (data: DedupeRequest): Promise<DedupeResult> => {
  try {
    const { caseId, threshold = 150, timeWindow = 48 } = data
    const caseDoc = await db.collection('cases').doc(caseId).get()
    if (!caseDoc.exists) {
      throw new Error('Case not found')
    }

    const caseData = caseDoc.data()!
    const createdAt = toDate(caseData.createdAt)
    const timeThreshold = new Date(
      createdAt.getTime() - timeWindow * 60 * 60 * 1000
    )

    const lat = caseData.location?.lat
    const lng = caseData.location?.lng

    let query = db
      .collection('cases')
      .where('category', '==', caseData.category)
      .where('status', 'in', ['submitted', 'acknowledged', 'in_progress', 'ACK', 'IN_PROGRESS'])
      .where('createdAt', '>=', timeThreshold)
      .limit(50)

    // Prefer municipality scope when available
    if (caseData.muniCode || caseData.location?.municipalityId) {
      query = db
        .collection('cases')
        .where(
          'muniCode',
          '==',
          caseData.muniCode || caseData.location?.municipalityId
        )
        .where('category', '==', caseData.category)
        .where('createdAt', '>=', timeThreshold)
        .limit(50)
    }

    const snapshot = await query.get()
    const duplicates: DedupeResult['duplicates'] = []

    for (const doc of snapshot.docs) {
      if (doc.id === caseId) continue
      const other = doc.data()
      const otherLat = other.location?.lat
      const otherLng = other.location?.lng
      const signals: string[] = []

      let distance = Number.POSITIVE_INFINITY
      if (
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        typeof otherLat === 'number' &&
        typeof otherLng === 'number'
      ) {
        distance = haversineMeters(lat, lng, otherLat, otherLng)
        if (distance <= threshold) signals.push('geo_proximity')
      }

      if (
        caseData.subcategory &&
        other.subcategory &&
        caseData.subcategory === other.subcategory
      ) {
        signals.push('subcategory_match')
      }

      const titleSim = textSimilarity(caseData.title || '', other.title || '')
      if (titleSim >= 0.5) signals.push('title_similarity')

      const openStatuses = [
        'submitted',
        'acknowledged',
        'in_progress',
        'ACK',
        'IN_PROGRESS',
      ]
      if (openStatuses.includes(other.status)) signals.push('open_status')

      const timeDiffHours =
        Math.abs(createdAt.getTime() - toDate(other.createdAt).getTime()) /
        (1000 * 60 * 60)

      if (signals.length === 0) continue
      if (distance !== Number.POSITIVE_INFINITY && distance > threshold * 3) {
        continue
      }

      const similarity = Math.min(
        1,
        (signals.includes('geo_proximity') ? 0.45 : 0) +
          (signals.includes('subcategory_match') ? 0.2 : 0) +
          (signals.includes('title_similarity') ? 0.25 : 0) +
          (signals.includes('open_status') ? 0.1 : 0)
      )

      if (similarity < 0.35) continue

      duplicates.push({
        caseId: doc.id,
        similarity,
        distance: Number.isFinite(distance) ? distance : -1,
        timeDiffHours,
        signals,
      })
    }

    duplicates.sort((a, b) => b.similarity - a.similarity)

    const suggested = duplicates.some((d) => d.similarity >= 0.7)
    const assessment = {
      status: 'completed' as const,
      candidateCaseIds: duplicates.map((d) => d.caseId),
      confidence: duplicates[0]?.similarity ?? 0,
      reasoning: duplicates[0]?.signals ?? [],
      disposition: suggested ? 'suggested' : 'independent',
      assessedAt: FieldValue.serverTimestamp(),
    }

    await db.collection('cases').doc(caseId).update({
      duplicateAssessment: assessment,
      updatedAt: FieldValue.serverTimestamp(),
    })

    logCaseTelemetry('duplicate_assessment_completed', {
      caseId,
      candidates: duplicates.length,
      suggested,
    })

    return {
      success: true,
      caseId,
      status: 'completed',
      duplicates,
      linked: false,
      suggested,
    }
  } catch (error) {
    console.error('Error in case deduplication:', error)
    return {
      success: false,
      caseId: data.caseId,
      status: 'failed',
      duplicates: [],
      linked: false,
      suggested: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export const getDuplicateCases = async (caseId: string) => {
  const caseDoc = await db.collection('cases').doc(caseId).get()
  if (!caseDoc.exists) return []
  const assessment = caseDoc.data()?.duplicateAssessment
  return assessment?.candidateCaseIds || []
}
