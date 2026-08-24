import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { IdempotencyRecord } from '../../types';
import { BaseRepository } from './BaseRepository';

const idempotencyConverter: FirestoreDataConverter<IdempotencyRecord> = {
  toFirestore: (record: IdempotencyRecord) => {
    const { ...data } = record;
    return data;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as IdempotencyRecord;
  }
};

class IdempotencyRepository extends BaseRepository<IdempotencyRecord> {
  constructor() {
    super('idempotencyRecords', idempotencyConverter);
  }

  async getByKey(idempotencyKey: string): Promise<IdempotencyRecord | null> {
    const results = await this.query([{ field: 'idempotencyKey', operator: '==', value: idempotencyKey }]);
    return results.length > 0 ? results[0] : null;
  }
}

export const idempotencyRepository = new IdempotencyRepository();
