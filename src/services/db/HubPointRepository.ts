import { FirestoreDataConverter, QueryDocumentSnapshot, where } from 'firebase/firestore';
import { HubCenter } from '../../types';
import { BaseRepository } from './BaseRepository';

const hubConverter: FirestoreDataConverter<HubCenter> = {
  toFirestore: (hub: HubCenter) => {
    return { ...hub };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as HubCenter;
  }
};

class HubPointRepository extends BaseRepository<HubCenter> {
  constructor() {
    super('wesabiHubPoints', hubConverter);
  }

  async getByCountry(country: string): Promise<HubCenter[]> {
    return this.getAll([where('country', '==', country), where('status', '==', 'ACTIVE')]);
  }

  async getByCity(city: string): Promise<HubCenter[]> {
    return this.getAll([where('city', '==', city), where('status', '==', 'ACTIVE')]);
  }

  async getByOwner(ownerId: string): Promise<HubCenter[]> {
    return this.getAll([where('ownerId', '==', ownerId)]);
  }

  async search(filters: { country?: string, state?: string, lga?: string, query?: string }): Promise<HubCenter[]> {
    const q: any[] = [where('status', '==', 'ACTIVE')];
    if (filters.country) q.push(where('country', '==', filters.country));
    if (filters.state) q.push(where('state', '==', filters.state));

    let results = await this.getAll(q);

    if (filters.lga) {
      results = results.filter(h => h.lga?.toLowerCase() === filters.lga?.toLowerCase());
    }

    if (filters.query) {
      const qLower = filters.query.toLowerCase();
      results = results.filter(h =>
        h.name.toLowerCase().includes(qLower) ||
        h.city.toLowerCase().includes(qLower) ||
        h.address.toLowerCase().includes(qLower)
      );
    }
    return results;
  }

  async searchByLocation(lat: number, lng: number, radiusKm: number): Promise<HubCenter[]> {
    const allActive = await this.getAll([where('status', '==', 'ACTIVE')]);

    // Simple Haversine-like filter in-memory
    return allActive.filter(h => {
        if (!h.gps) return false;
        const dLat = (h.gps.lat - lat) * (Math.PI / 180);
        const dLng = (h.gps.lng - lng) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat * (Math.PI / 180)) * Math.cos(h.gps.lat * (Math.PI / 180)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = 6371 * c; // Radius of Earth in km
        return distance <= radiusKm;
    });
  }
}

export const hubPointRepository = new HubPointRepository();
