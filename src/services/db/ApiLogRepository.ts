import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { BaseEntity } from '../../types';
import { BaseRepository } from './BaseRepository';

export interface ApiLog extends BaseEntity {
  userId: string;
  endpoint: string;
  method: string;
  status: number;
  ip?: string;
  timestamp: string;
  responsePayload?: string;
  requestPayload?: string;
}

const apiLogConverter: FirestoreDataConverter<ApiLog> = {
  toFirestore: (log: ApiLog) => {
    const { ...data } = log;
    return data;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as ApiLog;
  }
};

class ApiLogRepository extends BaseRepository<ApiLog> {
  constructor() {
    super('api_logs', apiLogConverter);
  }
}

export const apiLogRepository = new ApiLogRepository();
