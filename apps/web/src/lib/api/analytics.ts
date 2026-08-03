import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

// Analytics API
export class AnalyticsAPI {
  private static instance: AnalyticsAPI;
  
  public static getInstance(): AnalyticsAPI {
    if (!AnalyticsAPI.instance) {
      AnalyticsAPI.instance = new AnalyticsAPI();
    }
    return AnalyticsAPI.instance;
  }

  /**
   * Get case analytics
   */
  async getCaseAnalytics(request: {
    municipalityId?: string;
    wardId?: string;
    category?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
    groupBy?: 'day' | 'week' | 'month';
  }) {
    try {
      const getAnalyticsFunction = httpsCallable(functions, 'getCaseAnalyticsFunction');
      const result = await getAnalyticsFunction(request);
      return result.data;
    } catch (error) {
      console.error('Error getting case analytics:', error);
      throw new Error('Failed to load analytics data.');
    }
  }

  /**
   * Get dashboard data
   */
  async getDashboardData(municipalityId?: string) {
    try {
      const getDashboardFunction = httpsCallable(functions, 'getDashboardDataFunction');
      const result = await getDashboardFunction({ municipalityId });
      return result.data;
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw new Error('Failed to load dashboard data.');
    }
  }

  /**
   * Get municipality comparison
   */
  async getMunicipalityComparison(municipalityIds: string[]) {
    try {
      const getComparisonFunction = httpsCallable(functions, 'getMunicipalityComparisonFunction');
      const result = await getComparisonFunction({ municipalityIds });
      return result.data;
    } catch (error) {
      console.error('Error getting municipality comparison:', error);
      throw new Error('Failed to load municipality comparison.');
    }
  }

  /**
   * Get SLA statistics
   */
  async getSLAStatistics(municipalityId: string, days: number = 30) {
    try {
      const getSLAStatsFunction = httpsCallable(functions, 'getSLAStatisticsFunction');
      const result = await getSLAStatsFunction({ municipalityId, days });
      return result.data;
    } catch (error) {
      console.error('Error getting SLA statistics:', error);
      throw new Error('Failed to load SLA statistics.');
    }
  }

  /**
   * Get category statistics
   */
  async getCategoryStatistics(municipalityId?: string) {
    try {
      const getCategoryStatsFunction = httpsCallable(functions, 'getCategoryStatisticsFunction');
      const result = await getCategoryStatsFunction({ municipalityId });
      return result.data;
    } catch (error) {
      console.error('Error getting category statistics:', error);
      throw new Error('Failed to load category statistics.');
    }
  }
}

// Export singleton instance
export const analyticsAPI = AnalyticsAPI.getInstance();
