import { Parcel, CustodyRecord } from '../types';
import { parcelEngine as baseParcelService } from '../services/ParcelEngine';
import { trackingEngine } from '../services/TrackingEngine';
import { pricingEngine } from '../services/PricingEngine';
import { qrService } from '../services/QRService';
import { shipmentRepository } from '../services/db/ShipmentRepository';
import { custodyRepository } from '../services/db/CustodyRepository';
import { returnRepository } from '../services/db/ReturnRepository';

/**
 * OmorfiHub Parcel & Tracking Engine
 * Orchestrates parcel lifecycle, routing, tracking, pricing, and QR verification.
 */
class ParcelEngine {
  private static instance: ParcelEngine;
  private constructor() {}

  public static getInstance(): ParcelEngine {
    if (!ParcelEngine.instance) {
      ParcelEngine.instance = new ParcelEngine();
    }
    return ParcelEngine.instance;
  }

  public subscribeToParcels(callback: (parcels: Parcel[]) => void) {
    return shipmentRepository.subscribeToQuery([], callback);
  }

  get parcels() {
    return baseParcelService;
  }

  async getParcel(id: string): Promise<Parcel | null> {
    return await shipmentRepository.getById(id);
  }

  async getParcelByTracking(trackingNumber: string): Promise<Parcel | null> {
    return await shipmentRepository.getByTrackingNumber(trackingNumber);
  }

  async getParcelByToken(token: string): Promise<Parcel | null> {
    return await shipmentRepository.getByVerificationToken(token);
  }

  async updateParcel(id: string, updates: Partial<Parcel>): Promise<void> {
    await shipmentRepository.update(id, updates);
  }

  async recordCustodyHandover(custodyRecord: CustodyRecord): Promise<void> {
    await custodyRepository.create(custodyRecord.id, custodyRecord);
  }

  async getParcelsBySender(senderId: string): Promise<Parcel[]> {
    return await shipmentRepository.query([{ field: 'senderId', operator: '==', value: senderId }]);
  }

  async getParcelsByHub(hubId: string, type: 'origin' | 'destination' | 'current' = 'current'): Promise<Parcel[]> {
    if (type === 'current') {
       // approximation for current location
       const originParcels = await shipmentRepository.getByCenter(hubId, 'origin');
       const destParcels = await shipmentRepository.getByCenter(hubId, 'destination');
       return [...originParcels, ...destParcels].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
    }
    return await shipmentRepository.getByCenter(hubId, type);
  }

  get tracking() {
    return trackingEngine;
  }

  get pricing() {
    return pricingEngine;
  }

  get qr() {
    return qrService;
  }

  async getParcelsByRecipient(phone: string): Promise<any[]> {

    return await shipmentRepository.getByRecipient(phone);
  }
  async createReturnRequest(data: any): Promise<void> {

    await returnRepository.create(data);
  }
  async query(conditions: any[]): Promise<any[]> {

    return await shipmentRepository.query(conditions);
  }
  async updateStatus(id: string, status: any): Promise<void> {

    await shipmentRepository.update(id, { status });
  }

}

export const parcelEngine = ParcelEngine.getInstance();
