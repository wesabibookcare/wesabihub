import { FirestoreDataConverter, QueryDocumentSnapshot, where, orderBy, limit } from 'firebase/firestore';
import { AuditLog } from '../../types';
import { BaseRepository } from './BaseRepository';

const auditConverter: FirestoreDataConverter<AuditLog> = {
  toFirestore: (log: AuditLog) => {
    return JSON.parse(JSON.stringify(log));
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as AuditLog;
  }
};

class AuditRepository extends BaseRepository<AuditLog> {
  constructor() {
    super('auditLogs', auditConverter);
  }

  async getByUser(userId: string, limitCount: number = 100): Promise<AuditLog[]> {
    return this.getAll([
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    ]);
  }

  async logAction(userId: string, action: string, details: any, targetId?: string) {
    const log: AuditLog = {
      id: crypto.randomUUID(),
      userId,
      action,
      details,
      targetId,
      timestamp: new Date().toISOString()
    };
    return this.create(log.id, log);
  }

  /**
   * Implements configurable log retention policies securely deleting/archiving old logs.
   * Default retention is 90 days for operational logs, 365 for compliance (enforced elsewhere).
   */
  async cleanOldLogs(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffIso = cutoffDate.toISOString();

    // In a real production environment, you would use a bulk deletion or Cloud Function
    // For this engine implementation, we query and delete batches
    const oldLogs = await this.getAll([
      where('timestamp', '<', cutoffIso),
      limit(500)
    ]);

    let deletedCount = 0;
    for (const log of oldLogs) {
      if (log.id) {
         await this.delete(log.id);
         deletedCount++;
      }
    }
    return deletedCount;
  }
}

export const auditRepository = new AuditRepository();
