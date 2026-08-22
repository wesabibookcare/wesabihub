import { BaseRepository } from './BaseRepository';
import { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, where, orderBy, limit } from 'firebase/firestore';
import { IdVerification } from '../../types';

const converter: FirestoreDataConverter<IdVerification> = {
  toFirestore: (data: IdVerification) => {
    const { id, ...rest } = data;
    return rest;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions) => {
    return { id: snapshot.id, ...snapshot.data(options) } as IdVerification;
  }
};

export class IdVerificationRepository extends BaseRepository<IdVerification> {
  constructor() {
    super('idVerifications', converter);
  }

  async getByUserId(userId: string): Promise<IdVerification[]> {
    return this.getAll([where('userId', '==', userId), orderBy('createdAt', 'desc')]);
  }

  async getRecentVerifications(limitCount: number = 50): Promise<IdVerification[]> {
    return this.getAll([orderBy('createdAt', 'desc'), limit(limitCount)]);
  }

  async getByStatus(status: IdVerification['status']): Promise<IdVerification[]> {
    return this.getAll([where('status', '==', status), orderBy('createdAt', 'desc')]);
  }
}

export const idVerificationRepository = new IdVerificationRepository();
