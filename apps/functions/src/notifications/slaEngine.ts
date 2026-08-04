import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

interface SLACheckResult {
  caseId: string;
  slaBreach: boolean;
  breachTime?: Date;
  timeRemaining?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SLABreach {
  caseId: string;
  breachTime: Date;
  originalSLA: Date;
  category: string;
  priority: string;
  municipalityId: string;
  wardId: string;
  severity: string;
  notified: boolean;
}

/**
 * SLA Engine - Monitors case SLAs and detects breaches
 */
export const slaEngine = {
  /**
   * Check SLA for a specific case
   */
  checkSLA: async (caseId: string): Promise<SLACheckResult> => {
    try {
      const caseDoc = await db.collection('cases').doc(caseId).get();
      
      if (!caseDoc.exists) {
        throw new Error('Case not found');
      }

      const caseData = caseDoc.data();
      const now = new Date();
      
      return checkSLA(caseData, now);

    } catch (error) {
      console.error('Error checking SLA:', error);
      throw error;
    }
  },

  /**
   * Run full SLA monitoring cycle
   */
  runMonitoringCycle: async (): Promise<void> => {
    try {
      console.log('Starting SLA monitoring cycle...');
      
      // Get all active cases that haven't breached SLA yet
      const activeCasesSnapshot = await db.collection('cases')
        .where('status', 'in', ['submitted', 'acknowledged', 'in_progress'])
        .where('slaBreach', '==', false)
        .get();

      const now = new Date();
      const breaches: SLABreach[] = [];
      const warnings: any[] = [];

      for (const caseDoc of activeCasesSnapshot.docs) {
        const caseData = caseDoc.data();
        const slaCheck = checkSLA(caseData, now);
        
        if (slaCheck.slaBreach) {
          breaches.push({
            caseId: caseData.caseId,
            breachTime: slaCheck.breachTime!,
            originalSLA: caseData.slaTarget.toDate(),
            category: caseData.category,
            priority: caseData.priority,
            municipalityId: caseData.location.municipalityId,
            wardId: caseData.location.wardId,
            severity: slaCheck.severity,
            notified: false
          });
        } else if (slaCheck.timeRemaining && slaCheck.timeRemaining < 24 * 60 * 60 * 1000) {
          // Warning for cases approaching SLA (within 24 hours)
          warnings.push({
            caseId: caseData.caseId,
            timeRemaining: slaCheck.timeRemaining,
            severity: slaCheck.severity
          });
        }
      }

      // Process SLA breaches
      if (breaches.length > 0) {
        await processSLABreaches(breaches);
      }

      // Process SLA warnings
      if (warnings.length > 0) {
        await processSLAWarnings(warnings);
      }

      console.log(`SLA monitoring complete. Found ${breaches.length} breaches and ${warnings.length} warnings.`);

    } catch (error) {
      console.error('Error in SLA monitoring cycle:', error);
    }
  },

  /**
   * Calculate SLA for a case based on category and priority
   */
  calculateSLA: (category: string, priority: string, municipalityConfig?: any): Date => {
    const baseSLAs: Record<string, number> = {
      'water': 24,
      'electricity': 4,
      'roads': 72,
      'waste': 48,
      'internet': 168,
      'emergency': 1
    };

    const priorityMultipliers: Record<string, number> = {
      'low': 1.5,
      'medium': 1.0,
      'high': 0.5,
      'emergency': 0.25
    };

    const baseHours = baseSLAs[category] || 72;
    const multiplier = priorityMultipliers[priority] || 1.0;
    const municipalityMultiplier = municipalityConfig?.slaMultiplier || 1.0;

    const totalHours = baseHours * multiplier * municipalityMultiplier;
    return new Date(Date.now() + (totalHours * 60 * 60 * 1000));
  },

  /**
   * Get SLA statistics for a municipality
   */
  getSLAStatistics: async (municipalityId: string, days: number = 30): Promise<any> => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const casesSnapshot = await db.collection('cases')
        .where('location.municipalityId', '==', municipalityId)
        .where('createdAt', '>=', startDate)
        .get();

      const stats = {
        totalCases: 0,
        slaBreaches: 0,
        slaBreachRate: 0,
        averageResolutionTime: 0,
        categoryBreakdown: {} as Record<string, any>,
        priorityBreakdown: {} as Record<string, any>
      };

      let totalResolutionTime = 0;
      let resolvedCases = 0;

      for (const caseDoc of casesSnapshot.docs) {
        const caseData = caseDoc.data();
        stats.totalCases++;

        if (caseData.slaBreach) {
          stats.slaBreaches++;
        }

        if (caseData.status === 'resolved' && caseData.resolvedAt) {
          const resolutionTime = caseData.resolvedAt.toDate().getTime() - caseData.createdAt.toDate().getTime();
          totalResolutionTime += resolutionTime;
          resolvedCases++;
        }

        // Category breakdown
        if (!stats.categoryBreakdown[caseData.category]) {
          stats.categoryBreakdown[caseData.category] = { total: 0, breaches: 0 };
        }
        stats.categoryBreakdown[caseData.category].total++;
        if (caseData.slaBreach) {
          stats.categoryBreakdown[caseData.category].breaches++;
        }

        // Priority breakdown
        if (!stats.priorityBreakdown[caseData.priority]) {
          stats.priorityBreakdown[caseData.priority] = { total: 0, breaches: 0 };
        }
        stats.priorityBreakdown[caseData.priority].total++;
        if (caseData.slaBreach) {
          stats.priorityBreakdown[caseData.priority].breaches++;
        }
      }

      stats.slaBreachRate = stats.totalCases > 0 ? (stats.slaBreaches / stats.totalCases) * 100 : 0;
      stats.averageResolutionTime = resolvedCases > 0 ? totalResolutionTime / resolvedCases : 0;

      return stats;

    } catch (error) {
      console.error('Error getting SLA statistics:', error);
      return {
        totalCases: 0,
        slaBreaches: 0,
        slaBreachRate: 0,
        averageResolutionTime: 0,
        categoryBreakdown: {},
        priorityBreakdown: {}
      };
    }
  }
};

/**
 * Check if a case has breached its SLA
 */
function checkSLA(caseData: any, currentTime: Date): SLACheckResult {
  const slaTarget = caseData.slaTarget.toDate();
  const timeDiff = currentTime.getTime() - slaTarget.getTime();
  
  const result: SLACheckResult = {
    caseId: caseData.caseId,
    slaBreach: timeDiff > 0,
    severity: 'low'
  };

  if (result.slaBreach) {
    result.breachTime = currentTime;
    
    // Determine severity based on breach duration
    const breachHours = timeDiff / (1000 * 60 * 60);
    if (breachHours > 168) { // 7 days
      result.severity = 'critical';
    } else if (breachHours > 72) { // 3 days
      result.severity = 'high';
    } else if (breachHours > 24) { // 1 day
      result.severity = 'medium';
    } else {
      result.severity = 'low';
    }
  } else {
    result.timeRemaining = Math.abs(timeDiff);
    
    // Determine warning severity based on time remaining
    const hoursRemaining = result.timeRemaining / (1000 * 60 * 60);
    if (hoursRemaining < 2) {
      result.severity = 'high';
    } else if (hoursRemaining < 8) {
      result.severity = 'medium';
    } else {
      result.severity = 'low';
    }
  }

  return result;
}

/**
 * Process SLA breaches
 */
async function processSLABreaches(breaches: SLABreach[]): Promise<void> {
  for (const breach of breaches) {
    try {
      // Update case with SLA breach
      await db.collection('cases').doc(breach.caseId).update({
        slaBreach: true,
        slaBreachTime: admin.firestore.FieldValue.serverTimestamp(),
        slaBreachSeverity: breach.severity,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create SLA breach event
      await db.collection('case_events').add({
        caseId: breach.caseId,
        eventType: 'sla_breach',
        description: `SLA breached - ${breach.severity} severity`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          breachTime: breach.breachTime,
          originalSLA: breach.originalSLA,
          severity: breach.severity,
          category: breach.category,
          priority: breach.priority
        }
      });

      // Send notifications
      await sendSLABreachNotifications(breach);

      // Update analytics
      await updateSLABreachAnalytics(breach);

    } catch (error) {
      console.error(`Error processing SLA breach for case ${breach.caseId}:`, error);
    }
  }
}

/**
 * Process SLA warnings
 */
async function processSLAWarnings(warnings: any[]): Promise<void> {
  for (const warning of warnings) {
    try {
      // Send warning notifications
      await sendSLAWarningNotifications(warning);

    } catch (error) {
      console.error(`Error processing SLA warning for case ${warning.caseId}:`, error);
    }
  }
}

/**
 * Send SLA breach notifications
 */
async function sendSLABreachNotifications(breach: SLABreach): Promise<void> {
  try {
    // Get case details
    const caseDoc = await db.collection('cases').doc(breach.caseId).get();
    if (!caseDoc.exists) return;

    const caseData = caseDoc.data();
    if (!caseData) return;

    // Notify case owner
    if (caseData.userId) {
      const { sendPushNotification } = await import('./push');
      const { sendSLABreachEmail } = await import('./email');

      await sendPushNotification({
        userId: caseData.userId,
        title: 'SLA Breach Alert',
        body: `Your case "${caseData.title}" has exceeded its estimated resolution time`,
        type: 'sla_breach',
        data: {
          caseId: breach.caseId,
          severity: breach.severity
        }
      });

      // Send email if contact info available
      if (caseData.contactInfo?.email) {
        await sendSLABreachEmail(caseData, caseData.contactInfo.email, caseData.userProfile?.displayName);
      }
    }

    // Notify municipality officials
    const { sendOfficialNotification } = await import('./push');
    await sendOfficialNotification(
      breach.municipalityId,
      'SLA Breach Alert',
      `${breach.severity.toUpperCase()} SLA breach: Case ${breach.caseId} in ${breach.category}`,
      'sla_breach',
      {
        caseId: breach.caseId,
        severity: breach.severity,
        category: breach.category,
        priority: breach.priority
      }
    );

  } catch (error) {
    console.error('Error sending SLA breach notifications:', error);
  }
}

/**
 * Send SLA warning notifications
 */
async function sendSLAWarningNotifications(warning: any): Promise<void> {
  try {
    // Get case details
    const caseDoc = await db.collection('cases').doc(warning.caseId).get();
    if (!caseDoc.exists) return;

    const caseData = caseDoc.data();
    if (!caseData?.location?.municipalityId) return;

    // Notify municipality officials about approaching SLA
    const { sendOfficialNotification } = await import('./push');
    await sendOfficialNotification(
      caseData.location.municipalityId,
      'SLA Warning',
      `Case ${warning.caseId} approaching SLA deadline - ${Math.round(warning.timeRemaining / (1000 * 60 * 60))} hours remaining`,
      'sla_warning',
      {
        caseId: warning.caseId,
        timeRemaining: warning.timeRemaining,
        severity: warning.severity
      }
    );

  } catch (error) {
    console.error('Error sending SLA warning notifications:', error);
  }
}

/**
 * Update SLA breach analytics
 */
async function updateSLABreachAnalytics(breach: SLABreach): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const analyticsRef = db.collection('sla_analytics').doc(today);
    
    await analyticsRef.set({
      date: today,
      municipalityId: breach.municipalityId,
      wardId: breach.wardId,
      category: breach.category,
      priority: breach.priority,
      severity: breach.severity,
      breachCount: 1,
      totalBreaches: 1
    }, { merge: true });

  } catch (error) {
    console.error('Error updating SLA breach analytics:', error);
  }
}
