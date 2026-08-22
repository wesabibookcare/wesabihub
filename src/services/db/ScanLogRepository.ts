import { FirestoreDataConverter, QueryDocumentSnapshot, where, orderBy } from 'firebase/firestore';
import { ScanLog } from '../../types';
import { BaseRepository } from './BaseRepository';

const scanLogConverter: FirestoreDataConverter<ScanLog> = {
  toFirestore: (log: ScanLog) => {
    return { ...log };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as ScanLog;
  }
};

class ScanLogRepository extends BaseRepository<ScanLog> {
  constructor() {
    super('scanLogs', scanLogConverter);
  }

  async getByParcel(parcelId: string): Promise<ScanLog[]> {
    return this.getAll([
      where('parcelId', '==', parcelId),
      orderBy('timestamp', 'desc')
    ]);
  }
}

export const scanLogRepository = new ScanLogRepository();
