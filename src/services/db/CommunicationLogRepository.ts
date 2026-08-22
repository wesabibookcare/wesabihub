import { FirestoreDataConverter, QueryDocumentSnapshot, where, orderBy, limit } from 'firebase/firestore';
import { CommunicationLog } from '../../types';
import { BaseRepository } from './BaseRepository';

const communicationLogConverter: FirestoreDataConverter<CommunicationLog> = {
  toFirestore: (log: CommunicationLog) => {
    return { ...log };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as CommunicationLog;
  }
};

class CommunicationLogRepository extends BaseRepository<CommunicationLog> {
  constructor() {
    super('communication_logs', communicationLogConverter);
  }

  async getByUser(userId: string, limitCount: number = 20): Promise<CommunicationLog[]> {
    return this.getAll([
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    ]);
  }

  async getRecent(limitCount: number = 50): Promise<CommunicationLog[]> {
    return this.getAll([
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    ]);
  }

  subscribeToRecent(callback: (logs: CommunicationLog[]) => void, limitCount: number = 50) {
    return this.subscribeToQuery(
      [orderBy('timestamp', 'desc'), limit(limitCount)],
      callback
    );
  }
}

export const communicationLogRepository = new CommunicationLogRepository();
