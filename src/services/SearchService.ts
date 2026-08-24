import { HubCenter } from '../types';
import { hubPointRepository } from './db/HubPointRepository';

const TIER_PRIORITY: Record<string, number> = {
  'Diamond': 5,
  'Platinum': 4,
  'Gold': 3,
  'Silver': 2,
  'Bronze': 1
};

class SearchService {
  async searchPoints(query: string, filters?: any): Promise<HubCenter[]> {
    // Basic implementation: search by name or city/state
    const allPoints = await hubPointRepository.getAll();
    const q = query.toLowerCase();

    const filtered = allPoints.filter(point =>
      point.name.toLowerCase().includes(q) ||
      point.city.toLowerCase().includes(q) ||
      point.state.toLowerCase().includes(q) ||
      point.address.toLowerCase().includes(q)
    );

    // Prioritize rankings based on OmorfiHubPoints, Trust Score, and Tier level (Diamond, Platinum, Gold first)
    return filtered.sort((a, b) => {
      const aTier = (a as any).tier || 'Bronze';
      const bTier = (b as any).tier || 'Bronze';

      const aPriority = TIER_PRIORITY[aTier] || 1;
      const bPriority = TIER_PRIORITY[bTier] || 1;

      if (bPriority !== aPriority) {
        return bPriority - aPriority;
      }

      const bTrust = b.trustScore || 0;
      const aTrust = a.trustScore || 0;
      if (bTrust !== aTrust) {
        return bTrust - aTrust;
      }

      const bPoints = (b as any).totalPoints || 0;
      const aPoints = (a as any).totalPoints || 0;
      return bPoints - aPoints;
    });
  }

  async globalAdminSearch(searchTerm: string) {
    const q = searchTerm.toLowerCase();

    // We'll search across multiple collections
    // In a real app, this might be a cloud function or Algolia search
    // For this pass, we use the existing repositories to fetch and filter
    const [users, points, shipments] = await Promise.all([
      import('./db/UserRepository').then(m => m.userRepository.getAll()),
      import('./db/HubPointRepository').then(m => m.hubPointRepository.getAll()),
      import('./db/ShipmentRepository').then(m => m.shipmentRepository.getAll())
    ]);

    const results = {
      users: users.filter(u =>
        u.displayName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phoneNumber?.toLowerCase().includes(q)
      ),
      centers: points.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
      ),
      shipments: shipments.filter(s =>
        s.trackingNumber?.toLowerCase().includes(q) ||
        s.recipientInfo?.name?.toLowerCase().includes(q)
      )
    };

    return results;
  }
}

export const searchService = new SearchService();
