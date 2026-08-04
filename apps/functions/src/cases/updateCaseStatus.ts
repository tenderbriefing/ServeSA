import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

interface UpdateCaseStatusData {
  caseId: string;
  status: 'submitted' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed' | 'rejected';
  comment?: string;
  assignedTo?: string;
  assignedDepartment?: string;
  estimatedResolution?: Date;
  resolutionNotes?: string;
  userId: string;
}

interface UpdateResult {
  success: boolean;
  caseId: string;
  newStatus: string;
  error?: string;
}

/**
 * Update case status with validation and notifications
 */
export const updateCaseStatus = async (data: UpdateCaseStatusData): Promise<UpdateResult> => {
  try {
    const {
      caseId,
      status,
      comment,
      assignedTo,
      assignedDepartment,
      estimatedResolution,
      resolutionNotes,
      userId
    } = data;

    // Validate case exists
    const caseRef = db.collection('cases').doc(caseId);
    const caseDoc = await caseRef.get();

    if (!caseDoc.exists) {
      throw new Error('Case not found');
    }

    const caseData = caseDoc.data();
    if (!caseData) {
      throw new Error('Case not found');
    }

    // Validate user permissions
    await validateUserPermissions(caseData, userId);

    // Validate status transition
    validateStatusTransition(caseData.status, status);

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: userId
    };

    // Add conditional fields based on status
    if (status === 'acknowledged') {
      updateData.acknowledgedAt = admin.firestore.FieldValue.serverTimestamp();
      updateData.acknowledgedBy = userId;
    }

    if (status === 'in_progress') {
      updateData.inProgressAt = admin.firestore.FieldValue.serverTimestamp();
      updateData.inProgressBy = userId;
    }

    if (status === 'resolved') {
      updateData.resolvedAt = admin.firestore.FieldValue.serverTimestamp();
      updateData.resolvedBy = userId;
      updateData.resolutionNotes = resolutionNotes;
    }

    if (status === 'closed') {
      updateData.closedAt = admin.firestore.FieldValue.serverTimestamp();
      updateData.closedBy = userId;
    }

    if (assignedTo) {
      updateData.assignedTo = assignedTo;
    }

    if (assignedDepartment) {
      updateData.assignedDepartment = assignedDepartment;
    }

    if (estimatedResolution) {
      updateData.estimatedResolution = estimatedResolution;
    }

    // Update case
    await caseRef.update(updateData);

    // Create status update event
    await createStatusUpdateEvent(caseId, caseData.status, status, userId, comment);

    // Send notifications
    await sendStatusUpdateNotifications(caseData, status, userId, comment);

    // Update analytics
    await updateStatusAnalytics(caseData, status);

    // Check SLA if status changed to resolved
    if (status === 'resolved') {
      await checkSLACompliance(caseData);
    }

    return {
      success: true,
      caseId,
      newStatus: status
    };

  } catch (error) {
    console.error('Error updating case status:', error);
    return {
      success: false,
      caseId: data.caseId,
      newStatus: data.status,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Validate user permissions for case update
 */
async function validateUserPermissions(caseData: any, userId: string): Promise<void> {
  // Case owner can always update their own case
  if (caseData.userId === userId) {
    return;
  }

  // Check if user is official/admin for this municipality
  const userDoc = await db.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    throw new Error('User not found');
  }

  const userData = userDoc.data();

  if (userData?.role !== 'official' && userData?.role !== 'admin') {
    throw new Error('Insufficient permissions to update case status');
  }

  if (userData.municipalityId !== caseData.location.municipalityId) {
    throw new Error('User not authorized for this municipality');
  }
}

/**
 * Validate status transition
 */
function validateStatusTransition(currentStatus: string, newStatus: string): void {
  const validTransitions: Record<string, string[]> = {
    'submitted': ['acknowledged', 'rejected'],
    'acknowledged': ['in_progress', 'rejected'],
    'in_progress': ['resolved', 'acknowledged'],
    'resolved': ['closed'],
    'closed': [], // No transitions from closed
    'rejected': ['acknowledged'] // Can be reopened
  };

  const allowedTransitions = validTransitions[currentStatus] || [];
  
  if (!allowedTransitions.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
  }
}

/**
 * Create status update event
 */
async function createStatusUpdateEvent(
  caseId: string,
  previousStatus: string,
  newStatus: string,
  userId: string,
  comment?: string
): Promise<void> {
  try {
    await db.collection('case_events').add({
      caseId,
      eventType: 'status_updated',
      description: `Status updated from ${previousStatus} to ${newStatus}`,
      userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        previousStatus,
        newStatus,
        comment
      }
    });
  } catch (error) {
    console.error('Error creating status update event:', error);
  }
}

/**
 * Send status update notifications
 */
async function sendStatusUpdateNotifications(
  caseData: any,
  newStatus: string,
  userId: string,
  comment?: string
): Promise<void> {
  try {
    // Notify case owner if different from updater
    if (caseData.userId && caseData.userId !== userId) {
      const { sendPushNotification } = await import('../notifications/push');
      const { sendCaseStatusUpdateEmail } = await import('../notifications/email');

      const statusMessages: Record<string, string> = {
        'acknowledged': 'Your case has been acknowledged and is being reviewed',
        'in_progress': 'Work has begun on your case',
        'resolved': 'Your case has been resolved',
        'closed': 'Your case has been closed',
        'rejected': 'Your case has been rejected'
      };

      const message = statusMessages[newStatus] || 'Your case status has been updated';

      await sendPushNotification({
        userId: caseData.userId,
        title: 'Case Status Update',
        body: `${message}: ${caseData.title}`,
        type: 'status_update',
        data: {
          caseId: caseData.caseId,
          status: newStatus,
          comment
        }
      });

      // Send email if contact info available
      if (caseData.contactInfo?.email) {
        await sendCaseStatusUpdateEmail(
          caseData,
          caseData.contactInfo.email,
          caseData.userProfile?.displayName,
          newStatus,
          comment
        );
      }
    }

    // Notify assigned user if different from updater
    if (caseData.assignedTo && caseData.assignedTo !== userId) {
      const { sendPushNotification } = await import('../notifications/push');

      await sendPushNotification({
        userId: caseData.assignedTo,
        title: 'Case Assignment Update',
        body: `Case ${caseData.caseId} status updated to ${newStatus}`,
        type: 'case_assignment',
        data: {
          caseId: caseData.caseId,
          status: newStatus,
          comment
        }
      });
    }

  } catch (error) {
    console.error('Error sending status update notifications:', error);
  }
}

/**
 * Update status analytics
 */
async function updateStatusAnalytics(caseData: any, newStatus: string): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const analyticsRef = db.collection('status_analytics').doc(today);
    
    await analyticsRef.set({
      date: today,
      municipalityId: caseData.location.municipalityId,
      wardId: caseData.location.wardId,
      category: caseData.category,
      priority: caseData.priority,
      status: newStatus,
      statusCount: 1,
      totalCount: 1
    }, { merge: true });

  } catch (error) {
    console.error('Error updating status analytics:', error);
  }
}

/**
 * Check SLA compliance when case is resolved
 */
async function checkSLACompliance(caseData: any): Promise<void> {
  try {
    const { slaEngine } = await import('../notifications/slaEngine');
    
    const slaCheck = await slaEngine.checkSLA(caseData.caseId);
    
    if (!slaCheck.slaBreach) {
      // Case resolved within SLA - update analytics
      await db.collection('case_events').add({
        caseId: caseData.caseId,
        eventType: 'sla_compliant',
        description: 'Case resolved within SLA',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          slaTarget: caseData.slaTarget,
          resolvedAt: new Date(),
          complianceTime: Date.now() - caseData.slaTarget.toDate().getTime()
        }
      });
    }

  } catch (error) {
    console.error('Error checking SLA compliance:', error);
  }
}

/**
 * Bulk update case statuses
 */
export const bulkUpdateCaseStatus = async (
  caseIds: string[],
  status: string,
  userId: string,
  comment?: string
): Promise<{ success: number; failed: number; errors: string[] }> => {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };

  for (const caseId of caseIds) {
    try {
      const result = await updateCaseStatus({
        caseId,
        status: status as any,
        comment,
        userId
      });

      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push(`${caseId}: ${result.error}`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`${caseId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return results;
};

/**
 * Get case status history
 */
export const getCaseStatusHistory = async (caseId: string): Promise<any[]> => {
  try {
    const eventsSnapshot = await db.collection('case_events')
      .where('caseId', '==', caseId)
      .where('eventType', '==', 'status_updated')
      .orderBy('timestamp', 'desc')
      .get();

    return eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

  } catch (error) {
    console.error('Error getting case status history:', error);
    return [];
  }
};
