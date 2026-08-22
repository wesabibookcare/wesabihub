import { db } from '../lib/firebase';
import { collection, doc, setDoc, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { OperationalNotification, OperationalNotificationType, UserRole } from '../types';
import { auditRepository } from './db/AuditRepository';

class OperationalNotificationService {
  private collectionName = 'operational_notifications';

  async send(data: {
    parcelId: string;
    shipmentId: string;
    trackingNumber: string;
    type: OperationalNotificationType;
    title: string;
    message: string;
    actorId: string;
    actorName: string;
    actorRole: UserRole;
    visibleToRoles: UserRole[];
    metadata?: any;
  }): Promise<OperationalNotification> {
    const notification: OperationalNotification = {
      id: crypto.randomUUID(),
      ...data,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, this.collectionName, notification.id), notification);

    // Audit Log
    await auditRepository.logAction(data.actorId, 'OPERATIONAL_NOTIFICATION_SENT', {
      type: data.type,
      parcelId: data.parcelId,
      shipmentId: data.shipmentId
    }, notification.id);

    return notification;
  }

  subscribeForRole(role: UserRole, callback: (notifications: OperationalNotification[]) => void) {
    const q = query(
      collection(db, this.collectionName),
      where('visibleToRoles', 'array-contains', role),
      orderBy('timestamp', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OperationalNotification)));
    });
  }

  async getForParcel(parcelId: string): Promise<OperationalNotification[]> {
    const q = query(
      collection(db, this.collectionName),
      where('parcelId', '==', parcelId),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OperationalNotification));
  }
}

export const operationalNotificationService = new OperationalNotificationService();
