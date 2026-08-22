import { FirestoreDataConverter, QueryDocumentSnapshot, where } from 'firebase/firestore';
import { PaymentProtectionRecord } from '../../types';
import { BaseRepository } from './BaseRepository';

const paymentProtectionConverter: FirestoreDataConverter<PaymentProtectionRecord> = {
  toFirestore: (record: PaymentProtectionRecord) => {
    return { ...record };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as PaymentProtectionRecord;
  }
};

class PaymentProtectionRepository extends BaseRepository<PaymentProtectionRecord> {
  constructor() {
    super('paymentProtections', paymentProtectionConverter);
  }

  async getByShipmentId(shipmentId: string): Promise<PaymentProtectionRecord | null> {
    const results = await this.getAll([where('shipmentId', '==', shipmentId)]);
    return results.length > 0 ? results[0] : null;
  }

  async getByParcelId(parcelId: string): Promise<PaymentProtectionRecord | null> {
    const results = await this.getAll([where('parcelId', '==', parcelId)]);
    return results.length > 0 ? results[0] : null;
  }

  async getByMerchantId(merchantId: string): Promise<PaymentProtectionRecord[]> {
    return this.getAll([where('merchantId', '==', merchantId)]);
  }
}

export const paymentProtectionRepository = new PaymentProtectionRepository();
