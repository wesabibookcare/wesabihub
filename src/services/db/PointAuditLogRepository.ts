import { FirestoreDataConverter, QueryDocumentSnapshot, where, orderBy, limit } from 'firebase/firestore';
import { PointAuditLog } from '../../types';
import { BaseRepository } from './BaseRepository';

const pointAuditLogConverter: FirestoreDataConverter<PointAuditLog> = {
  toFirestore: (log: PointAuditLog) => {
    return { ...log };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as PointAuditLog;
  }
};

class PointAuditLogRepository extends BaseRepository<PointAuditLog> {
  constructor() {
    super('wesabiPointAuditLogs', pointAuditLogConverter);
  }

  async getByHub(hubId: string): Promise<PointAuditLog[]> {
    return this.getAll([
      where('hubId', '==', hubId),
      orderBy('timestamp', 'desc')
    ]);
  }
}

export const pointAuditLogRepository = new PointAuditLogRepository();
