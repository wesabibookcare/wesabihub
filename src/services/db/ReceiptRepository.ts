import { FirestoreDataConverter, QueryDocumentSnapshot, where } from 'firebase/firestore';
import { Receipt } from '../../types';
import { BaseRepository } from './BaseRepository';

const receiptConverter: FirestoreDataConverter<Receipt> = {
  toFirestore: (receipt: Receipt) => {
    return { ...receipt };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as Receipt;
  }
};

class ReceiptRepository extends BaseRepository<Receipt> {
  constructor() {
    super('receipts', receiptConverter);
  }

  async getByReceiptId(receiptId: string): Promise<Receipt | null> {
    const results = await this.getAll([where('receiptId', '==', receiptId)]);
    return results.length > 0 ? results[0] : null;
  }

  async getByTrackingNumber(trackingNumber: string): Promise<Receipt[]> {
    return this.getAll([where('trackingNumber', '==', trackingNumber)]);
  }

  async getByShipmentId(shipmentId: string): Promise<Receipt[]> {
    return this.getAll([where('shipmentId', '==', shipmentId)]);
  }

  async getByVerificationToken(token: string): Promise<Receipt | null> {
    const results = await this.getAll([where('verificationToken', '==', token)]);
    return results.length > 0 ? results[0] : null;
  }
}

export const receiptRepository = new ReceiptRepository();
