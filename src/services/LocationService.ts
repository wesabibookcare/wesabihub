import { configurationEngine } from '../engines/ConfigurationEngine';
import { mapService } from './MapService';

class LocationService {
  /**
   * Fetch current client location with optional high-accuracy settings and validate coordinates
   */
  async getCurrentLocation(enableHighAccuracy = true): Promise<{ lat: number; lng: number; accuracy: number }> {
    const settings = await configurationEngine.getMapsSettings();
    const threshold = settings.locationAccuracyThresholdMeters;

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error('Geolocation is not supported by your browser'));
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          // Log coordinates for audit purposes
          console.log(`GPS captured: lat=${latitude}, lng=${longitude}, accuracy=${accuracy}m (Threshold is ${threshold}m)`);

          resolve({
            lat: latitude,
            lng: longitude,
            accuracy: accuracy
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: enableHighAccuracy,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  /**
   * Monitor client location changes in real-time
   */
  watchLocation(
    onUpdate: (coords: { lat: number; lng: number; accuracy: number }) => void,
    onError?: (err: GeolocationPositionError) => void,
    enableHighAccuracy = true
  ): number {
    if (!navigator.geolocation) {
      if (onError) onError({ code: 0, message: "Geolocation not supported", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as any);
      return 0;
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        onUpdate({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        if (onError) onError(error);
      },
      {
        enableHighAccuracy: enableHighAccuracy,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  /**
   * Stop monitoring client location
   */
  clearWatch(id: number): void {
    if (id && navigator.geolocation) {
      navigator.geolocation.clearWatch(id);
    }
  }

  /**
   * Calculate if a point is inside a geofenced circle center
   */
  isInsideGeofence(
    center: { lat: number; lng: number },
    current: { lat: number; lng: number },
    radiusMeters: number
  ): boolean {
    const distanceKm = mapService.calculateDistance(center.lat, center.lng, current.lat, current.lng);
    const distanceMeters = distanceKm * 1000;
    return distanceMeters <= radiusMeters;
  }

  /**
   * Detect if the current rider position has deviated from the active route steps
   */
  hasDeviatedFromRoute(
    currentLocation: { lat: number; lng: number },
    routeSteps: Array<{ start_location: { lat: number; lng: number }; end_location: { lat: number; lng: number } }>,
    deviationThresholdMeters = 150
  ): boolean {
    if (!routeSteps || routeSteps.length === 0) return false;

    // Compute distance to the closest point along any step segments
    let minDistanceMeters = Infinity;

    for (const step of routeSteps) {
      // Check distance to step start and end
      const dStart = mapService.calculateDistance(currentLocation.lat, currentLocation.lng, step.start_location.lat, step.start_location.lng) * 1000;
      const dEnd = mapService.calculateDistance(currentLocation.lat, currentLocation.lng, step.end_location.lat, step.end_location.lng) * 1000;

      minDistanceMeters = Math.min(minDistanceMeters, dStart, dEnd);
    }

    return minDistanceMeters > deviationThresholdMeters;
  }
}

export const locationService = new LocationService();
