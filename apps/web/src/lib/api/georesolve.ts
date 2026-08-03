import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

// Georesolve API
export class GeoresolveAPI {
  private static instance: GeoresolveAPI;
  
  public static getInstance(): GeoresolveAPI {
    if (!GeoresolveAPI.instance) {
      GeoresolveAPI.instance = new GeoresolveAPI();
    }
    return GeoresolveAPI.instance;
  }

  /**
   * Resolve coordinates to ward and municipality
   */
  async resolveCoordinates(lat: number, lng: number) {
    try {
      const georesolveFunction = httpsCallable(functions, 'routingLookup');
      const result = await georesolveFunction({ lat, lng });
      return result.data;
    } catch (error) {
      console.error('Error resolving coordinates:', error);
      throw new Error('Failed to resolve location. Please try again.');
    }
  }

  /**
   * Batch resolve multiple coordinates
   */
  async batchResolveCoordinates(coordinates: Array<{ lat: number; lng: number }>) {
    try {
      const batchGeoresolveFunction = httpsCallable(functions, 'batchGeoresolveFunction');
      const result = await batchGeoresolveFunction({ coordinates });
      return result.data;
    } catch (error) {
      console.error('Error batch resolving coordinates:', error);
      throw new Error('Failed to resolve locations. Please try again.');
    }
  }

  /**
   * Get ward statistics
   */
  async getWardStats(wardId: string) {
    try {
      const getWardStatsFunction = httpsCallable(functions, 'getWardStatsFunction');
      const result = await getWardStatsFunction({ wardId });
      return result.data;
    } catch (error) {
      console.error('Error getting ward stats:', error);
      throw new Error('Failed to load ward statistics.');
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(lat: number, lng: number) {
    try {
      const reverseGeocodeFunction = httpsCallable(functions, 'reverseGeocodeFunction');
      const result = await reverseGeocodeFunction({ lat, lng });
      return result.data;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      throw new Error('Failed to get address. Please try again.');
    }
  }

  /**
   * Get current location using browser geolocation
   */
  async getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          let errorMessage = 'Failed to get current location.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Validate coordinates are within South Africa bounds
   */
  validateCoordinates(lat: number, lng: number): boolean {
    // South Africa bounds: lat: -35 to -22, lng: 16 to 33
    return lat >= -35 && lat <= -22 && lng >= 16 && lng <= 33;
  }

  /**
   * Calculate distance between two coordinates
   */
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  /**
   * Format distance for display
   */
  formatDistance(distanceInMeters: number): string {
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)}m`;
    } else {
      return `${(distanceInMeters / 1000).toFixed(1)}km`;
    }
  }
}

// Export singleton instance
export const georesolveAPI = GeoresolveAPI.getInstance();
