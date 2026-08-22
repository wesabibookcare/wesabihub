import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { RoleApplication } from '../../types';
import { BaseRepository } from './BaseRepository';

const roleApplicationConverter: FirestoreDataConverter<RoleApplication> = {
  toFirestore: (app: RoleApplication) => {
    return JSON.parse(JSON.stringify(app));
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as RoleApplication;
  }
};

class RoleApplicationRepository extends BaseRepository<RoleApplication> {
  constructor() {
    super('roleApplications', roleApplicationConverter);
  }

  async getByUser(userId: string): Promise<RoleApplication[]> {
    if (!userId) return [];
    return this.query([{ field: 'userId', operator: '==', value: userId }]);
  }

  async getPending(): Promise<RoleApplication[]> {
    return this.query([{ field: 'status', operator: '==', value: 'PENDING' }]);
  }

  async getAll(): Promise<RoleApplication[]> {
    return this.query([]);
  }
}

export const roleApplicationRepository = new RoleApplicationRepository();
