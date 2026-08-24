import { HubCenter } from '../types';
import { getApiUrl } from '../lib/apiClient';

class MapService {
  calculateDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number
  ): number {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async calculateDistanceAndDuration(
    origin: string | { lat: number; lng: number },
    destination: string | { lat: number; lng: number }
  ): Promise<{ distanceKm: number; durationMin: number }> {
    const originStr = typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`;
    const destStr = typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`;

    try {
      const response = await fetch(getApiUrl('/api/maps/distance-matrix'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origins: originStr, destinations: destStr })
      });
      if (!response.ok) throw new Error('Distance matrix API returned error status');
      const data = await response.json();
      if (data && data.rows && data.rows[0]?.elements && data.rows[0].elements[0]?.status === 'OK') {
        const element = data.rows[0].elements[0];
        const distKm = (element.distance?.value ?? 0) / 1000;
        const durMin = Math.round((element.duration?.value ?? 0) / 60);
        return { distanceKm: distKm, durationMin: durMin };
      }
    } catch (err) {
      console.error("MapService distance matrix failed, using fallback:", err);
    }

    // Fallback: Use straight-line Haversine
    let lat1 = 6.5244, lng1 = 3.3792, lat2 = 6.5244, lng2 = 3.3792;
    if (typeof origin !== 'string') {
      lat1 = origin.lat;
      lng1 = origin.lng;
    }
    if (typeof destination !== 'string') {
      lat2 = destination.lat;
      lng2 = destination.lng;
    }
    const dist = this.calculateDistance(lat1, lng1, lat2, lng2);
    const dur = Math.round((dist / 40) * 60 + 5); // 40 km/h avg speed + 5 min delay
    return { distanceKm: dist, durationMin: dur };
  }

  async getDirections(
    origin: string | { lat: number; lng: number },
    destination: string | { lat: number; lng: number }
  ): Promise<any> {
    const originStr = typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`;
    const destStr = typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`;

    try {
      const response = await fetch(getApiUrl('/api/maps/route'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: originStr, destination: destStr })
      });
      if (!response.ok) throw new Error('Route API returned error status');
      const data = await response.json();
      if (data && data.status === 'OK') {
        return data.route;
      }
    } catch (err) {
      console.error("MapService getDirections failed:", err);
    }
    return null;
  }
}

export const mapService = new MapService();
