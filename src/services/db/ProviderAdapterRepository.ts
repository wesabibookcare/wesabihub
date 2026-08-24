import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { LogisticsProviderAdapter } from '../../types';
import { BaseRepository } from './BaseRepository';

const providerAdapterConverter: FirestoreDataConverter<LogisticsProviderAdapter> = {
  toFirestore: (adapter: LogisticsProviderAdapter) => {
    const { ...data } = adapter;
    return data;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as LogisticsProviderAdapter;
  }
};

class ProviderAdapterRepository extends BaseRepository<LogisticsProviderAdapter> {
  constructor() {
    super('providerAdapters', providerAdapterConverter);
  }

  async getByProviderName(providerName: string): Promise<LogisticsProviderAdapter | null> {
    const results = await this.query([{ field: 'providerName', operator: '==', value: providerName }]);
    return results.length > 0 ? results[0] : null;
  }

  async getActiveAdapters(): Promise<LogisticsProviderAdapter[]> {
    return this.query([{ field: 'isActive', operator: '==', value: true }]);
  }
}

export const providerAdapterRepository = new ProviderAdapterRepository();
