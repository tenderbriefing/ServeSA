/**
 * Idempotent notification ledger for case lifecycle.
 * onCaseCreated owns citizen ack + official alerts.
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { sendNotification } from './notifications'
import { sendEmailNotification } from './email'
import { logCaseTelemetry } from '../telemetry/caseEvents'

const db = getFirestore()

async function claimNotification(
  caseId: string,
  type: string
): Promise<boolean> {
  const ref = db.collection('notification_ledger').doc(`${caseId}_${type}`)
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      if (snap.exists) {
        throw new Error('already_sent')
      }
      tx.set(ref, {
        caseId,
        type,
        status: 'claimed',
        claimedAt: FieldValue.serverTimestamp(),
      })
    })
    return true
  } catch (error) {
    if (error instanceof Error && error.message === 'already_sent') {
      return false
    }
    // If transaction failed for other reasons, do not send to avoid duplicates
    console.error('notification claim failed', error)
    return false
  }
}

async function markNotification(
  caseId: string,
  type: string,
  status: 'sent' | 'failed' | 'skipped',
  detail?: string
) {
  await db
    .collection('notification_ledger')
    .doc(`${caseId}_${type}`)
    .set(
      {
        status,
        detail: detail || null,
        completedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
}

export async function orchestrateCaseCreatedNotifications(
  caseId: string,
  caseData: Record<string, any>
): Promise<void> {
  // Citizen acknowledgement
  if (await claimNotification(caseId, 'citizen_ack')) {
    try {
      const email = caseData.reporter?.email
      const uid = caseData.reporterUid

      if (uid) {
        await sendNotification({
          userId: uid,
          title: 'Case Submitted Successfully',
          body: `Your case "${caseData.title}" has been submitted (${caseId}).`,
          type: 'case_acknowledgment',
          data: { caseId, category: caseData.category, priority: caseData.priority },
        })
      }

      if (email) {
        await sendEmailNotification({
          to: email,
          subject: `Case Acknowledged: ${caseId}`,
          htmlContent: `<p>Your case <strong>${caseId}</strong> (${caseData.title}) has been received and is being processed.</p>`,
          textContent: `Your case ${caseId} (${caseData.title}) has been received and is being processed.`,
          type: 'case_acknowledgment',
          data: { caseId },
        })
      }

      await markNotification(caseId, 'citizen_ack', 'sent')
      await db.collection('cases').doc(caseId).update({
        'notifications.citizenAck': 'sent',
      })
    } catch (error) {
      await markNotification(
        caseId,
        'citizen_ack',
        'failed',
        error instanceof Error ? error.message : 'error'
      )
      logCaseTelemetry('notification_failure', { caseId, type: 'citizen_ack' })
    }
  }

  // Official alert — only when municipality routing exists
  const muniId =
    caseData.muniCode || caseData.location?.municipalityId || null

  if (!muniId) {
    if (await claimNotification(caseId, 'official_alert')) {
      await markNotification(caseId, 'official_alert', 'skipped', 'no_municipality')
      await db.collection('cases').doc(caseId).update({
        'notifications.officialAlert': 'skipped',
      })
    }
    return
  }

  if (await claimNotification(caseId, 'official_alert')) {
    try {
      const officialsSnapshot = await db
        .collection('users')
        .where('role', 'in', ['official', 'admin'])
        .where('municipalityId', '==', muniId)
        .limit(25)
        .get()

      for (const officialDoc of officialsSnapshot.docs) {
        await sendNotification({
          userId: officialDoc.id,
          title: 'New Case Assigned',
          body: `New ${caseData.priority} priority case in ${
            caseData.location?.wardName || 'your municipality'
          }`,
          type: 'new_case',
          data: {
            caseId,
            category: caseData.category,
            priority: caseData.priority,
            wardId: caseData.wardId || caseData.location?.wardId,
          },
        })
      }

      await markNotification(caseId, 'official_alert', 'sent')
      await db.collection('cases').doc(caseId).update({
        'notifications.officialAlert': 'sent',
      })
    } catch (error) {
      await markNotification(
        caseId,
        'official_alert',
        'failed',
        error instanceof Error ? error.message : 'error'
      )
      logCaseTelemetry('notification_failure', {
        caseId,
        type: 'official_alert',
      })
    }
  }
}
