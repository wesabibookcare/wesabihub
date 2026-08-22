
import { FirestoreDataConverter, QueryDocumentSnapshot, where, orderBy, query, collection, getDocs, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BaseRepository } from './BaseRepository';

export interface CommissionRecord {
  id: string;
  shipmentId: string;
  totalFee: number;
  platformAmount: number;
  centreAmount: number;
  futureLogisticsAmount: number;
  pricingRuleVersion: number;
  commissionRuleVersion: number;
  timestamp: any;
  centreId: string;
  merchantId: string;
  status: string;
  country: string;
  serviceType: string;
}

const commissionConverter: FirestoreDataConverter<CommissionRecord> = {
  toFirestore: (record: CommissionRecord) => {
    return { ...record };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as CommissionRecord;
  }
};

class CommissionRecordRepository extends BaseRepository<CommissionRecord> {
  constructor() {
    super('commissionRecords', commissionConverter);
  }

  async getByCentre(centreId: string, limitCount = 50): Promise<CommissionRecord[]> {
    return this.getAll([
      where('centreId', '==', centreId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    ]);
  }

  async getByMerchant(merchantId: string, limitCount = 50): Promise<CommissionRecord[]> {
    return this.getAll([
      where('merchantId', '==', merchantId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    ]);
  }

  async getDailyRevenue(date: Date): Promise<CommissionRecord[]> {
    // Start and end of day logic
    const start = new Date(date.setHours(0,0,0,0));
    const end = new Date(date.setHours(23,59,59,999));
    return this.getAll([
      where('timestamp', '>=', start),
      where('timestamp', '<=', end)
    ]);
  }
}

export const commissionRecordRepository = new CommissionRecordRepository();
