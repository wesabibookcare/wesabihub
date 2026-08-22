import { FirestoreDataConverter, QueryDocumentSnapshot, where } from 'firebase/firestore';
import { LogisticsCompany } from '../../types';
import { BaseRepository } from './BaseRepository';

const logisticsConverter: FirestoreDataConverter<LogisticsCompany> = {
  toFirestore: (comp: LogisticsCompany) => {
    return { ...comp };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as LogisticsCompany;
  }
};

class LogisticsRepository extends BaseRepository<LogisticsCompany> {
  constructor() {
    super('logisticsCompanies', logisticsConverter);
  }

  async getByOwner(ownerId: string): Promise<LogisticsCompany | null> {
    const results = await this.getAll([where('ownerId', '==', ownerId)]);
    return results.length > 0 ? results[0] : null;
  }

  async getActiveInZone(zone: string): Promise<LogisticsCompany[]> {
    return this.getAll([
      where('serviceAreas', 'array-contains', zone),
      where('status', '==', 'ACTIVE')
    ]);
  }
}

export const logisticsRepository = new LogisticsRepository();
