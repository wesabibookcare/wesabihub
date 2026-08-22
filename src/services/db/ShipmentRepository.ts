import { FirestoreDataConverter, QueryDocumentSnapshot, where, orderBy } from 'firebase/firestore';
import { Parcel } from '../../types';
import { BaseRepository } from './BaseRepository';

const parcelConverter: FirestoreDataConverter<Parcel> = {
  toFirestore: (parcel: Parcel) => {
    return JSON.parse(JSON.stringify(parcel));
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as Parcel;
  }
};

class ShipmentRepository extends BaseRepository<Parcel> {
  constructor() {
    super('shipments', parcelConverter);
  }

  async getByTrackingNumber(trackingNumber: string): Promise<Parcel | null> {
    const results = await this.getAll([where('trackingNumber', '==', trackingNumber)]);
    return results.length > 0 ? results[0] : null;
  }

  async getByVerificationToken(token: string): Promise<Parcel | null> {
    const results = await this.getAll([where('verificationToken', '==', token)]);
    return results.length > 0 ? results[0] : null;
  }

  async getByHub(hubId: string): Promise<Parcel[]> {
    const atOrigin = await this.getAll([where('originCenterId', '==', hubId)]);
    const atDestination = await this.getAll([where('destinationCenterId', '==', hubId)]);

    // Combine and deduplicate
    const combined = [...atOrigin, ...atDestination];
    const uniqueIds = new Set();
    return combined.filter(p => {
      if (uniqueIds.has(p.id)) return false;
      uniqueIds.add(p.id);
      return true;
    });
  }

  async getByRecipient(phone: string): Promise<Parcel[]> {
    return this.getAll([where('recipientInfo.phone', '==', phone)]);
  }

  async getBySender(senderId: string): Promise<Parcel[]> {
    return this.getAll([
      where('senderId', '==', senderId),
      orderBy('createdAt', 'desc')
    ]);
  }

  async getByCenter(centerId: string, type: 'origin' | 'destination'): Promise<Parcel[]> {
    const field = type === 'origin' ? 'originCenterId' : 'destinationCenterId';
    return this.getAll([
      where(field, '==', centerId),
      orderBy('createdAt', 'desc')
    ]);
  }

  async getByMerchant(merchantId: string): Promise<Parcel[]> {
    return this.getAll([
      where('merchantId', '==', merchantId),
      orderBy('createdAt', 'desc')
    ]);
  }

  async updateStatus(id: string, status: Parcel['status'], updateData: Partial<Parcel> = {}) {
    return this.update(id, {
      ...updateData,
      status,
      updatedAt: new Date().toISOString()
    });
  }
}

export const shipmentRepository = new ShipmentRepository();
