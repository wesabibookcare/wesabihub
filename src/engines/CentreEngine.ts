import { HubPoint, User } from '../types';
import { hubPointRepository } from '../services/db/HubPointRepository';
import { userRepository } from '../services/db/UserRepository';
import { mapService } from '../services/MapService';
import { configurationEngine } from './ConfigurationEngine';
import { auditEngine, notificationEngine } from './index';

/**
 * WeSabiHub Centre (Hub) Engine
 * Manages Hub Points, Staff, and Local Operations.
 */
class CentreEngine {
  private static instance: CentreEngine;

  private constructor() {}

  public static getInstance(): CentreEngine {
    if (!CentreEngine.instance) {
      CentreEngine.instance = new CentreEngine();
    }
    return CentreEngine.instance;
  }

  async getHub(hubId: string): Promise<HubPoint | null> {
    return await hubPointRepository.getById(hubId);
  }

  async getHubsByOwner(ownerId: string): Promise<HubPoint[]> {
    return await hubPointRepository.getByOwner(ownerId);
  }

  async getHubByOwner(ownerId: string): Promise<HubPoint | null> {
    const hubs = await this.getHubsByOwner(ownerId);
    return hubs.length > 0 ? hubs[0] : null;
  }

  /**
   * Register a new physical Hub/PUDO point for a Hub Owner.
   * The hub always starts as PENDING and must be approved by an authorized
   * admin (see approveHub) before it becomes visible to customers/merchants.
   * One hub per owner is supported today (document ID = ownerId), matching
   * getHubByOwner()'s assumption.
   */
  async createHub(ownerId: string, hubData: {
    name: string;
    type: HubPoint['type'];
    address: string;
    city: string;
    state: string;
    lga?: string;
    country: string;
    contactPhone: string;
    operatingHours: string;
    services?: string[];
    location?: { lat: number; lng: number };
  }): Promise<void> {
    if (!ownerId) throw new Error('You must be signed in to register a hub.');
    if (!hubData.name?.trim()) throw new Error('Hub name is required.');
    if (!hubData.address?.trim()) throw new Error('Hub address is required.');
    if (!hubData.city?.trim()) throw new Error('City is required.');
    if (!hubData.state?.trim()) throw new Error('State is required.');
    if (!hubData.contactPhone?.trim()) throw new Error('A contact phone number is required.');

    const existing = await this.getHubByOwner(ownerId);
    if (existing) {
      throw new Error('You already have a hub registered. Edit your existing hub instead of creating a new one.');
    }

    const now = new Date().toISOString();
    await hubPointRepository.create(ownerId, {
      id: ownerId,
      name: hubData.name.trim(),
      type: hubData.type,
      address: hubData.address.trim(),
      city: hubData.city.trim(),
      state: hubData.state.trim(),
      lga: hubData.lga?.trim() || '',
      country: hubData.country || 'Nigeria',
      contactPhone: hubData.contactPhone.trim(),
      operatingHours: hubData.operatingHours.trim(),
      services: hubData.services || [],
      location: hubData.location,
      gps: hubData.location,
      ownerId,
      isVerified: false,
      status: 'PENDING',
      trustScore: 0,
      rating: 0,
      reviews: 0,
      totalPoints: 0,
      starRating: 0,
      createdAt: now,
      updatedAt: now
    } as HubPoint);

    await auditEngine.logEvent({
      userId: ownerId,
      userRole: 'CENTER_OWNER',
      action: 'HUB_REGISTERED',
      details: { hubName: hubData.name, city: hubData.city, state: hubData.state },
      result: 'SUCCESS'
    });

    await notificationEngine.send(
      ownerId,
      'Hub Submitted for Approval',
      `Your hub "${hubData.name}" has been submitted and is pending admin approval. You'll be notified once it's live and visible to customers.`,
      'INFO'
    );
  }

  /**
   * Update the editable details of an existing hub (owner-facing edit).
   * Status, trust score, rating, and verification fields are intentionally
   * excluded here -- those are controlled by approveHub/rejectHub and the
   * trust/points system, never by the owner directly.
   */
  async updateHubDetails(hubId: string, updates: {
    name?: string;
    type?: HubPoint['type'];
    address?: string;
    city?: string;
    state?: string;
    lga?: string;
    contactPhone?: string;
    operatingHours?: string;
    services?: string[];
    location?: { lat: number; lng: number };
  }): Promise<void> {
    await hubPointRepository.update(hubId, {
      ...updates,
      ...(updates.location ? { gps: updates.location } : {}),
      updatedAt: new Date().toISOString()
    } as Partial<HubPoint>);
  }

  /** All hubs awaiting admin approval, newest first. */
  async getPendingHubs(): Promise<HubPoint[]> {
    const all = await hubPointRepository.getAll();
    return all
      .filter(h => h.status === 'PENDING')
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  /** Approve a pending hub, making it visible to customers and merchants. */
  async approveHub(hubId: string): Promise<void> {
    await this.updateHubStatus(hubId, 'ACTIVE', 'Approved by admin');
  }

  /** Reject a pending hub. It stays hidden from customers/merchants. */
  async rejectHub(hubId: string, reason: string): Promise<void> {
    await this.updateHubStatus(hubId, 'INACTIVE', reason || 'Rejected by admin');
  }

  async searchHubs(params: { country?: string; state?: string; lga?: string; query?: string }): Promise<HubPoint[]> {
    return await hubPointRepository.search(params);
  }

  async getAllHubs(): Promise<HubPoint[]> {
    return await hubPointRepository.getAll();
  }

  async listNearbyHubs(lat: number, lng: number, radiusKm?: number): Promise<Array<HubPoint & { distanceKm?: number }>> {
    const config = await configurationEngine.getMapsSettings();
    const searchRadius = radiusKm ?? config.defaultSearchRadiusKm;

    const allHubs = await hubPointRepository.getAll();
    const activeHubs = allHubs.filter(h => h.status === 'ACTIVE' && !h.isDeleted);

    const hubsWithDistance = activeHubs.map(hub => {
      const hubLat = hub.location?.lat ?? hub.gps?.lat ?? 6.5244;
      const hubLng = hub.location?.lng ?? hub.gps?.lng ?? 3.3792;
      const distance = mapService.calculateDistance(lat, lng, hubLat, hubLng);
      return {
        ...hub,
        distanceKm: Number(distance.toFixed(2))
      };
    });

    return hubsWithDistance
      .filter(h => h.distanceKm <= searchRadius)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  async getHubStaff(hubId: string): Promise<User[]> {
    return await userRepository.getByHub(hubId);
  }

  async updateHubStatus(hubId: string, status: HubPoint['status'], reason?: string): Promise<void> {
    await hubPointRepository.update(hubId, {
      status,
      updatedAt: new Date().toISOString()
    });

    const hub = await this.getHub(hubId);
    if (hub) {
      await auditEngine.logEvent({
        userId: hub.ownerId,
        userRole: 'CENTER_OWNER',
        action: 'HUB_STATUS_UPDATE',
        details: { hubId, status, reason },
        result: 'SUCCESS'
      });

      await notificationEngine.send(
        hub.ownerId,
        'Hub Status Updated',
        `Your hub "${hub.name}" status has been updated to ${status}.`,
        status === 'ACTIVE' ? 'SUCCESS' : 'INFO',
        '/point/dashboard/owner'
      );
    }
  }
}

export const centreEngine = CentreEngine.getInstance();
