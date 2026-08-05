/**
 * Bounded reconciliation for cases with routingPending=true.
 * Admin/ops only — dry-run by default when invoked from CLI.
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { georesolveSafe } from '../routing/georesolve'
import { logCaseTelemetry } from '../telemetry/caseEvents'

const db = getFirestore()

export interface ReconcileOptions {
  limit?: number
  dryRun?: boolean
  cursorCaseId?: string
}

export interface ReconcileOutcome {
  caseId: string
  outcome: 'resolved' | 'unresolved' | 'ambiguous' | 'skipped' | 'failed'
  reason?: string
  wardId?: string | null
  municipalityId?: string | null
  datasetVersion?: string | null
}

export interface ReconcileResult {
  processed: number
  dryRun: boolean
  outcomes: ReconcileOutcome[]
  nextCursor: string | null
}

export async function reconcileUnresolvedCases(
  options: ReconcileOptions = {}
): Promise<ReconcileResult> {
  const limit = Math.min(Math.max(options.limit ?? 25, 1), 100)
  const dryRun = options.dryRun !== false // default dry-run safe
  const outcomes: ReconcileOutcome[] = []

  let query = db
    .collection('cases')
    .where('routingPending', '==', true)
    .orderBy('createdAt', 'asc')
    .limit(limit)

  // Optional pagination start — caller supplies last seen caseId via separate field scan.
  if (options.cursorCaseId) {
    const cursorDoc = await db.collection('cases').doc(options.cursorCaseId).get()
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc)
    }
  }

  const snap = await query.get()
  let nextCursor: string | null = null

  for (const doc of snap.docs) {
    nextCursor = doc.id
    const data = doc.data()
    const caseId = doc.id

    try {
      if (data.routingManualOverride === true) {
        outcomes.push({ caseId, outcome: 'skipped', reason: 'manual_override' })
        continue
      }
      if (data.georesolution?.status === 'polygon_match' && data.wardId) {
        outcomes.push({ caseId, outcome: 'skipped', reason: 'already_resolved' })
        continue
      }

      const lat = data.location?.lat
      const lng = data.location?.lng
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        outcomes.push({ caseId, outcome: 'skipped', reason: 'missing_coordinates' })
        continue
      }

      const geo = await georesolveSafe(lat, lng)

      if (geo.status === 'polygon_match' && geo.wardId && geo.municipalityId) {
        outcomes.push({
          caseId,
          outcome: 'resolved',
          wardId: geo.wardId,
          municipalityId: geo.municipalityId,
          datasetVersion: geo.datasetVersion,
        })
        if (!dryRun) {
          // Idempotent event key by dataset version
          const idempotentEventId = `routing_reconcile_${geo.datasetVersion || 'unknown'}`
          const existing = await db
            .collection('cases')
            .doc(caseId)
            .collection('events')
            .doc(idempotentEventId)
            .get()
          if (!existing.exists) {
            await db.runTransaction(async (tx) => {
              const ref = db.collection('cases').doc(caseId)
              tx.update(ref, {
                wardId: geo.wardId,
                muniCode: geo.municipalityId,
                'location.wardId': geo.wardId,
                'location.wardName': geo.wardName,
                'location.wardNumber': geo.wardNumber,
                'location.municipalityId': geo.municipalityId,
                'location.municipalityName': geo.municipalityName,
                'location.districtCode': geo.districtCode,
                'location.districtName': geo.districtName,
                'location.province': geo.province,
                'location.muniCode': geo.municipalityId,
                georesolution: {
                  status: geo.status,
                  confidence: geo.confidence,
                  method: geo.method,
                  cached: geo.cached,
                  datasetVersion: geo.datasetVersion,
                  boundaryCycle: geo.boundaryCycle,
                  resolvedAt: geo.resolvedAt,
                  routingSource: geo.routingSource,
                  candidateCount: geo.candidateCount,
                  failureReason: geo.failureReason,
                },
                routingPending: false,
                updatedAt: FieldValue.serverTimestamp(),
                updatedBy: 'reconcileUnresolvedCases',
              })
              tx.set(ref.collection('events').doc(idempotentEventId), {
                caseId,
                eventType: 'routing_resolution',
                description: 'Reconciliation authoritative GIS ward resolution',
                actorType: 'system',
                actorUid: null,
                timestamp: FieldValue.serverTimestamp(),
                metadata: {
                  georesolutionStatus: geo.status,
                  wardId: geo.wardId,
                  municipalityId: geo.municipalityId,
                  datasetVersion: geo.datasetVersion,
                  routingSource: geo.routingSource,
                  reconcile: true,
                },
              })
            })
          }
        }
        continue
      }

      if (geo.status === 'ambiguous') {
        outcomes.push({
          caseId,
          outcome: 'ambiguous',
          datasetVersion: geo.datasetVersion,
          reason: geo.failureReason || 'ambiguous',
        })
        if (!dryRun) {
          await db.collection('cases').doc(caseId).update({
            'georesolution.status': 'ambiguous',
            'georesolution.candidateCount': geo.candidateCount,
            'georesolution.failureReason': geo.failureReason,
            'georesolution.datasetVersion': geo.datasetVersion,
            routingPending: true,
            updatedAt: FieldValue.serverTimestamp(),
          })
        }
        continue
      }

      outcomes.push({
        caseId,
        outcome: 'unresolved',
        reason: geo.failureReason || geo.status,
        datasetVersion: geo.datasetVersion,
      })
    } catch (error) {
      outcomes.push({
        caseId,
        outcome: 'failed',
        reason: error instanceof Error ? error.message.slice(0, 120) : 'unknown',
      })
    }
  }

  logCaseTelemetry('routing_reconciliation_batch', {
    processed: outcomes.length,
    dryRun,
    resolved: outcomes.filter((o) => o.outcome === 'resolved').length,
  })

  return {
    processed: outcomes.length,
    dryRun,
    outcomes,
    nextCursor: snap.size < limit ? null : nextCursor,
  }
}
