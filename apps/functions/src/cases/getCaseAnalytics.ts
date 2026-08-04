import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

interface AnalyticsRequest {
  municipalityId?: string;
  wardId?: string;
  category?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  groupBy?: 'day' | 'week' | 'month';
}

interface CaseAnalytics {
  totalCases: number;
  resolvedCases: number;
  activeCases: number;
  slaBreaches: number;
  averageResolutionTime: number;
  resolutionRate: number;
  slaBreachRate: number;
  categoryBreakdown: Record<string, any>;
  priorityBreakdown: Record<string, any>;
  statusBreakdown: Record<string, any>;
  timeSeries: Array<{
    date: string;
    cases: number;
    resolved: number;
    breaches: number;
  }>;
  topWards: Array<{
    wardId: string;
    wardName: string;
    caseCount: number;
    resolutionRate: number;
  }>;
  performanceMetrics: {
    responseTime: number;
    resolutionTime: number;
    citizenSatisfaction: number;
  };
}

/**
 * Get comprehensive case analytics
 */
export const getCaseAnalytics = async (request: AnalyticsRequest): Promise<CaseAnalytics> => {
  try {
    const {
      municipalityId,
      wardId,
      category,
      dateRange,
      groupBy = 'day'
    } = request;

    // Build query
    let query = db.collection('cases') as admin.firestore.Query;

    if (municipalityId) {
      query = query.where('location.municipalityId', '==', municipalityId);
    }

    if (wardId) {
      query = query.where('location.wardId', '==', wardId);
    }

    if (category) {
      query = query.where('category', '==', category);
    }

    if (dateRange) {
      query = query.where('createdAt', '>=', dateRange.start)
                   .where('createdAt', '<=', dateRange.end);
    }

    const casesSnapshot = await query.get();
    const cases = casesSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Record<string, any>) })) as Array<Record<string, any>>;

    // Calculate basic metrics
    const totalCases = cases.length;
    const resolvedCases = cases.filter(c => c.status === 'resolved').length;
    const activeCases = cases.filter(c => ['submitted', 'acknowledged', 'in_progress'].includes(c.status)).length;
    const slaBreaches = cases.filter(c => c.slaBreach).length;

    // Calculate resolution time
    const resolvedCasesWithTime = cases.filter(c => c.status === 'resolved' && c.resolvedAt && c.createdAt);
    const totalResolutionTime = resolvedCasesWithTime.reduce((sum, c) => {
      const resolutionTime = c.resolvedAt.toDate().getTime() - c.createdAt.toDate().getTime();
      return sum + resolutionTime;
    }, 0);
    const averageResolutionTime = resolvedCasesWithTime.length > 0 
      ? totalResolutionTime / resolvedCasesWithTime.length 
      : 0;

    // Calculate rates
    const resolutionRate = totalCases > 0 ? (resolvedCases / totalCases) * 100 : 0;
    const slaBreachRate = totalCases > 0 ? (slaBreaches / totalCases) * 100 : 0;

    // Category breakdown
    const categoryBreakdown = cases.reduce((acc, c) => {
      if (!acc[c.category]) {
        acc[c.category] = { total: 0, resolved: 0, breaches: 0 };
      }
      acc[c.category].total++;
      if (c.status === 'resolved') acc[c.category].resolved++;
      if (c.slaBreach) acc[c.category].breaches++;
      return acc;
    }, {} as Record<string, any>);

    // Priority breakdown
    const priorityBreakdown = cases.reduce((acc, c) => {
      if (!acc[c.priority]) {
        acc[c.priority] = { total: 0, resolved: 0, breaches: 0 };
      }
      acc[c.priority].total++;
      if (c.status === 'resolved') acc[c.priority].resolved++;
      if (c.slaBreach) acc[c.priority].breaches++;
      return acc;
    }, {} as Record<string, any>);

    // Status breakdown
    const statusBreakdown = cases.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Time series data
    const timeSeries = generateTimeSeries(cases, groupBy, dateRange);

    // Top wards
    const topWards = await getTopWards(cases, municipalityId);

    // Performance metrics
    const performanceMetrics = await getPerformanceMetrics(cases);

    return {
      totalCases,
      resolvedCases,
      activeCases,
      slaBreaches,
      averageResolutionTime,
      resolutionRate,
      slaBreachRate,
      categoryBreakdown,
      priorityBreakdown,
      statusBreakdown,
      timeSeries,
      topWards,
      performanceMetrics
    };

  } catch (error) {
    console.error('Error getting case analytics:', error);
    throw error;
  }
};

/**
 * Generate time series data
 */
function generateTimeSeries(cases: any[], groupBy: string, dateRange?: { start: Date; end: Date }): Array<{
  date: string;
  cases: number;
  resolved: number;
  breaches: number;
}> {
  const timeSeries: Array<{
    date: string;
    cases: number;
    resolved: number;
    breaches: number;
  }> = [];

  // Group cases by time period
  const groupedCases = cases.reduce((acc, c) => {
    const date = c.createdAt.toDate();
    let key: string;

    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        key = date.toISOString().split('T')[0];
    }

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(c);
    return acc;
  }, {} as Record<string, any[]>);

  // Generate time series data
  Object.entries(groupedCases).forEach(([date, casesInPeriod]) => {
    const periodCases = casesInPeriod as Array<Record<string, any>>;
    timeSeries.push({
      date,
      cases: periodCases.length,
      resolved: periodCases.filter(c => c.status === 'resolved').length,
      breaches: periodCases.filter(c => c.slaBreach).length
    });
  });

  return timeSeries.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get top wards by case count and resolution rate
 */
async function getTopWards(cases: any[], municipalityId?: string): Promise<Array<{
  wardId: string;
  wardName: string;
  caseCount: number;
  resolutionRate: number;
}>> {
  try {
    // Group cases by ward
    const wardStats = cases.reduce((acc, c) => {
      const wardId = c.location.wardId;
      if (!acc[wardId]) {
        acc[wardId] = {
          wardId,
          wardName: c.location.wardName,
          total: 0,
          resolved: 0
        };
      }
      acc[wardId].total++;
      if (c.status === 'resolved') {
        acc[wardId].resolved++;
      }
      return acc;
    }, {} as Record<string, any>);

    // Calculate resolution rates and sort
    const topWards = Object.values(wardStats)
      .map((ward: any) => ({
        wardId: ward.wardId,
        wardName: ward.wardName,
        caseCount: ward.total,
        resolutionRate: ward.total > 0 ? (ward.resolved / ward.total) * 100 : 0
      }))
      .sort((a, b) => b.caseCount - a.caseCount)
      .slice(0, 10);

    return topWards;

  } catch (error) {
    console.error('Error getting top wards:', error);
    return [];
  }
}

/**
 * Get performance metrics
 */
async function getPerformanceMetrics(cases: any[]): Promise<{
  responseTime: number;
  resolutionTime: number;
  citizenSatisfaction: number;
}> {
  try {
    // Calculate average response time (time from submission to acknowledgment)
    const acknowledgedCases = cases.filter(c => c.status !== 'submitted' && c.acknowledgedAt);
    const totalResponseTime = acknowledgedCases.reduce((sum, c) => {
      const responseTime = c.acknowledgedAt.toDate().getTime() - c.createdAt.toDate().getTime();
      return sum + responseTime;
    }, 0);
    const responseTime = acknowledgedCases.length > 0 
      ? totalResponseTime / acknowledgedCases.length 
      : 0;

    // Calculate average resolution time
    const resolvedCases = cases.filter(c => c.status === 'resolved' && c.resolvedAt);
    const totalResolutionTime = resolvedCases.reduce((sum, c) => {
      const resolutionTime = c.resolvedAt.toDate().getTime() - c.createdAt.toDate().getTime();
      return sum + resolutionTime;
    }, 0);
    const resolutionTime = resolvedCases.length > 0 
      ? totalResolutionTime / resolvedCases.length 
      : 0;

    // Calculate citizen satisfaction (based on ratings if available)
    const ratedCases = cases.filter(c => c.citizenRating);
    const totalRating = ratedCases.reduce((sum, c) => sum + c.citizenRating, 0);
    const citizenSatisfaction = ratedCases.length > 0 
      ? (totalRating / ratedCases.length) * 20 // Convert to percentage (assuming 1-5 scale)
      : 0;

    return {
      responseTime,
      resolutionTime,
      citizenSatisfaction
    };

  } catch (error) {
    console.error('Error getting performance metrics:', error);
    return {
      responseTime: 0,
      resolutionTime: 0,
      citizenSatisfaction: 0
    };
  }
}

/**
 * Get municipality performance comparison
 */
export const getMunicipalityComparison = async (municipalityIds: string[]): Promise<any[]> => {
  try {
    const comparisons = await Promise.all(
      municipalityIds.map(async (municipalityId) => {
        const analytics = await getCaseAnalytics({ municipalityId });
        return {
          municipalityId,
          ...analytics
        };
      })
    );

    return comparisons;

  } catch (error) {
    console.error('Error getting municipality comparison:', error);
    return [];
  }
};

/**
 * Get real-time dashboard data
 */
export const getDashboardData = async (municipalityId?: string): Promise<any> => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [recentCases, weeklyAnalytics, monthlyAnalytics] = await Promise.all([
      getCaseAnalytics({ 
        municipalityId, 
        dateRange: { start: last24Hours, end: now } 
      }),
      getCaseAnalytics({ 
        municipalityId, 
        dateRange: { start: last7Days, end: now },
        groupBy: 'day'
      }),
      getCaseAnalytics({ 
        municipalityId, 
        dateRange: { start: last30Days, end: now },
        groupBy: 'week'
      })
    ]);

    return {
      recent: recentCases,
      weekly: weeklyAnalytics,
      monthly: monthlyAnalytics,
      lastUpdated: now.toISOString()
    };

  } catch (error) {
    console.error('Error getting dashboard data:', error);
    throw error;
  }
};
