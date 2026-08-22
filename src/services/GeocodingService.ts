class GeocodingService {
  async geocode(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const response = await fetch(`/api/maps/geocode?address=${encodeURIComponent(address)}`);
      if (!response.ok) {
        throw new Error(`Geocoding failed with status: ${response.status}`);
      }
      const data = await response.json();
      if (data && typeof data.lat === 'number' && typeof data.lng === 'number') {
        return { lat: data.lat, lng: data.lng };
      }
      return null;
    } catch (err) {
      console.error("Failed to geocode address:", err);
      return null;
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const response = await fetch(`/api/maps/reverse-geocode?lat=${lat}&lng=${lng}`);
      if (!response.ok) {
        throw new Error(`Reverse geocoding failed with status: ${response.status}`);
      }
      const data = await response.json();
      return data.address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (err) {
      console.error("Failed to reverse geocode:", err);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }
}

export const geocodingService = new GeocodingService();
