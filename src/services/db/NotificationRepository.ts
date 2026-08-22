import { FirestoreDataConverter, QueryDocumentSnapshot, where, orderBy, limit } from 'firebase/firestore';
import { Notification } from '../../types';
import { BaseRepository } from './BaseRepository';

const notificationConverter: FirestoreDataConverter<Notification> = {
  toFirestore: (note: Notification) => {
    const data = { ...note };
    if (data.link === undefined) {
      delete data.link;
    }
    return data;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as Notification;
  }
};

class NotificationRepository extends BaseRepository<Notification> {
  constructor() {
    super('notifications', notificationConverter);
  }

  async getByUser(userId: string, limitCount: number = 20): Promise<Notification[]> {
    return this.getAll([
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    ]);
  }

  async markAsRead(id: string) {
    return this.update(id, { isRead: true });
  }

  subscribeToUser(userId: string, callback: (notes: Notification[]) => void) {
    return this.subscribeToQuery(
      [where('userId', '==', userId), orderBy('timestamp', 'desc'), limit(50)],
      callback
    );
  }

  async getUnread(userId: string, limitCount: number = 20): Promise<Notification[]> {
    return this.getAll([
      where('userId', '==', userId),
      where('isRead', '==', false),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    ]);
  }

}

export const notificationRepository = new NotificationRepository();
