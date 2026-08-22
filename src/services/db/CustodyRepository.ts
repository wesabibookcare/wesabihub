import { FirestoreDataConverter, QueryDocumentSnapshot, where, orderBy } from 'firebase/firestore';
import { CustodyRecord } from '../../types';
import { BaseRepository } from './BaseRepository';

const custodyConverter: FirestoreDataConverter<CustodyRecord> = {
  toFirestore: (record: CustodyRecord) => {
    return { ...record };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as CustodyRecord;
  }
};

class CustodyRepository extends BaseRepository<CustodyRecord> {
  constructor() {
    super('parcelHistory', custodyConverter);
  }

  async getByParcel(parcelId: string): Promise<CustodyRecord[]> {
    return this.getAll([
      where('parcelId', '==', parcelId),
      orderBy('timestamp', 'desc')
    ]);
  }
}

export const custodyRepository = new CustodyRepository();
