import { auditEngine as baseAuditService } from '../services/AuditEngine';
import { auditRepository } from '../services/db/AuditRepository';
import { orderBy, limit } from 'firebase/firestore';

/**
 * WeSabiHub Audit Engine
 * Authoritative source for system auditing and security logging.
 */
class AuditEngine {
  private static instance: AuditEngine;

  private constructor() {}

  public static getInstance(): AuditEngine {
    if (!AuditEngine.instance) {
      AuditEngine.instance = new AuditEngine();
    }
    return AuditEngine.instance;
  }

  /**
   * Log an event securely
   */
  async logEvent(params: {
    userId: string;
    userRole?: string;
    action: string;
    details: any;
    targetId?: string;
    result: 'SUCCESS' | 'FAILURE';
    correlationId?: string;
    requestId?: string;
    ipAddress?: string;
    deviceInfo?: string;
  }) {
    return await baseAuditService.logEvent(params);
  }

  /**
   * Specifically log profile updates (mapping to ProfileUpdateAuditService if needed,
   * but consolidating here for WOS standard)
   */
  async logProfileUpdate(userId: string, changes: any, actorId: string) {
    return await baseAuditService.logEvent({
      userId: actorId,
      action: 'PROFILE_UPDATE',
      details: { targetUserId: userId, changes },
      result: 'SUCCESS',
      targetId: userId
    });
  }

  async getAuditLogs(userId: string, limit: number = 50) {
    return await baseAuditService.getLogs(userId, limit);
  }


  async getRecentLogs(limitCount: number = 50): Promise<any[]> {
    return await auditRepository.getAll([orderBy('timestamp', 'desc'), limit(limitCount)]);
  }

  async getSecurityStats(logs: any[]) {
    return await baseAuditService.getSecurityStats(logs);
  }

  subscribeToRecentLogs(callback: (logs: any[]) => void, limitCount: number = 100) {
    return auditRepository.subscribeToQuery([orderBy('timestamp', 'desc'), limit(limitCount)], callback);
  }

  async getAll(conditions?: any[]): Promise<any[]> {
    return await auditRepository.getAll(conditions);
  }

  async enforceRetentionPolicy(retentionDays: number = 90): Promise<number> {
    return await baseAuditService.enforceRetentionPolicy(retentionDays);
  }

}

export const auditEngine = AuditEngine.getInstance();
