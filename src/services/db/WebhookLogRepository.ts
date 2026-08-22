import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { WebhookLog } from '../../types';
import { BaseRepository } from './BaseRepository';

const webhookLogConverter: FirestoreDataConverter<WebhookLog> = {
  toFirestore: (log: WebhookLog) => {
    const { ...data } = log;
    return data;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as WebhookLog;
  }
};

class WebhookLogRepository extends BaseRepository<WebhookLog> {
  constructor() {
    super('webhook_logs', webhookLogConverter);
  }
}

export const webhookLogRepository = new WebhookLogRepository();
