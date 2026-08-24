import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { ApiApplication } from '../../types';
import { BaseRepository } from './BaseRepository';

const apiApplicationConverter: FirestoreDataConverter<ApiApplication> = {
  toFirestore: (app: ApiApplication) => {
    const { ...data } = app;
    return data;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as ApiApplication;
  }
};

class ApiApplicationRepository extends BaseRepository<ApiApplication> {
  constructor() {
    super('apiApplications', apiApplicationConverter);
  }

  async getByApiKey(apiKey: string): Promise<ApiApplication | null> {
    const results = await this.query([{ field: 'apiKey', operator: '==', value: apiKey }]);
    return results.length > 0 ? results[0] : null;
  }

  async getByUserId(userId: string): Promise<ApiApplication[]> {
    return this.query([{ field: 'userId', operator: '==', value: userId }]);
  }
}

export const apiApplicationRepository = new ApiApplicationRepository();
