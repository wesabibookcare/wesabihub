import { auditRepository } from './db/AuditRepository';
import { AuditLog, UserRole } from '../types';

export interface HardenedAuditLog extends AuditLog {
  id: string;
  userId: string;
  userRole?: string;
  action: string;
  timestamp: string;
  details: any;
  ipAddress?: string;
  deviceInfo?: string;
  result: 'SUCCESS' | 'FAILURE';
  isSuspicious?: boolean;
  suspicionReason?: string;
}

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
   * Log an action with hardened schema details
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
  }): Promise<HardenedAuditLog> {
    const eventId = `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();

    // Check for fraud/suspicious activity dynamically
    const suspicion = this.checkForSuspiciousHeuristics(params.action, params.details);

    // Scrub sensitive data (PII, Secrets) from details
    const scrubbedDetails = this.scrubSensitiveData(params.details);

    const logEntry: HardenedAuditLog = {
      id: eventId,
      userId: params.userId,
      userRole: params.userRole || 'UNKNOWN',
      action: params.action,
      targetId: params.targetId || '',
      details: {
        ...scrubbedDetails,
        ...(params.correlationId ? { correlationId: params.correlationId } : {}),
        ...(params.requestId ? { requestId: params.requestId } : {})
      },
      timestamp: new Date().toISOString(),
      ipAddress: params.ipAddress || ('192.168.1.' + Math.floor(Math.random() * 254 + 1)), // Use real IP if provided, otherwise fallback
      deviceInfo: params.deviceInfo || (typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent : 'Server Environment'),
      result: params.result,
      isSuspicious: suspicion.isSuspicious
    };
    if (suspicion.reason) {
      logEntry.suspicionReason = suspicion.reason;
    }

    try {
      // Save using repository
      await auditRepository.create(eventId, logEntry);

      // If suspicious, optionally trigger a background notification for Super Admin
      if (suspicion.isSuspicious) {
        console.warn('⚠️ SECURITY FRAUD DETECTED:', suspicion.reason, logEntry);
        // This should probably go through notificationEngine, but we are in a service.
        // For now, let's keep it direct or use a different service.
      }
    } catch (err) {
      console.error('AuditEngine failed to write hardened log to Firestore:', err);
    }

    return logEntry;
  }

  /**
   * Scrubs sensitive fields from log details to prevent data leakage.
   */
  private scrubSensitiveData(details: any): any {
    if (!details || typeof details !== 'object') return details;

    const sensitiveFields = [
      'password', 'secret', 'token', 'apiKey', 'card', 'cvv',
      'pin', 'private', 'key', 'auth', 'credential', 'ssn'
    ];

    const scrub = (obj: any): any => {
      if (Array.isArray(obj)) return obj.map(scrub);
      if (obj !== null && typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
          const isSensitive = sensitiveFields.some(f => key.toLowerCase().includes(f.toLowerCase()));
          if (isSensitive) {
            newObj[key] = '[REDACTED]';
          } else {
            newObj[key] = scrub(obj[key]);
          }
        }
        return newObj;
      }
      return obj;
    };

    return scrub(details);
  }

  async getLogs(userId: string, limitCount: number = 50): Promise<AuditLog[]> {
    return await auditRepository.getByUser(userId, limitCount);
  }

  async getSecurityStats(logs: HardenedAuditLog[]) {
    const suspiciousCount = logs.filter(l => l.isSuspicious).length;
    const failedLoginCount = logs.filter(l => l.action === 'FAILED_LOGIN_ATTEMPT').length;
    return {
      totalLogsCount: logs.length,
      activeSuspiciousFlags: suspiciousCount,
      failedLogins24h: failedLoginCount
    };
  }

  /**
   * Run client-side zero-trust heuristics to flag suspicious activity
   */
  private checkForSuspiciousHeuristics(action: string, details: any): { isSuspicious: boolean; reason?: string } {
    // 1. Role Change Checking
    if (action === 'USER_ROLE_UPDATE' || action === 'UPDATE_USER_PROFILE') {
      if (details?.newRole === 'SUPER_ADMIN' || details?.newRole === 'OPERATIONS_MANAGER') {
        return {
          isSuspicious: true,
          reason: 'Attempted escalation to high-privilege administrative role'
        };
      }
    }

    // 2. Suspicious Shipment Characteristics
    if (action === 'CREATE_SHIPMENT' || action === 'CALCULATE_PRICE') {
      if (details?.weightKg > 500 || details?.weight > 500) {
        return {
          isSuspicious: true,
          reason: 'Outsized shipment weight detected (Potential smuggling/overweight fraud)'
        };
      }
      if (details?.price < 100 && details?.price !== undefined) {
        return {
          isSuspicious: true,
          reason: 'Abnormally low transaction/pricing valuation'
        };
      }
    }

    // 3. Status Lifecycle Tampering Heuristics
    if (action === 'UPDATE_PARCEL_STATUS') {
      const { from, to, remarks } = details || {};
      if (from === 'DRAFT' && to === 'COMPLETED') {
        return {
          isSuspicious: true,
          reason: 'Lifecycle Shortcut: Shipment jumped from DRAFT straight to COMPLETED'
        };
      }
    }

    // 4. Duplicate QR/Barcode Verification Heuristics
    if (action === 'SCAN_QR_CODE' || action === 'VERIFY_PARCEL') {
      if (details?.scanCount > 1 || details?.isDuplicateScan) {
        return {
          isSuspicious: true,
          reason: 'Duplicate QR code scan detected (Possible replica barcode fraud)'
        };
      }
    }

    // 5. Verification Brute-Forcing Heuristics
    if (action === 'FAILED_VERIFICATION_ATTEMPT') {
      if (details?.failedAttemptsCount >= 3) {
        return {
          isSuspicious: true,
          reason: 'Excessive failed authentication/verification attempts (Potential brute-force attack)'
        };
      }
    }

    // 6. Suspicious Account Logins
    if (action === 'FAILED_LOGIN_ATTEMPT') {
      if (details?.count >= 5) {
        return {
          isSuspicious: true,
          reason: 'Multiple failed login attempts on account (Brute-force/Credential stuffing danger)'
        };
      }
    }

    return { isSuspicious: false };
  }

  /**
   * Enforces configurable log retention policies securely deleting/archiving old logs.
   * Ensures logs never expose passwords or secrets in the archive process by
   * enforcing the deletion of outdated records.
   */
  async enforceRetentionPolicy(retentionDays: number = 90): Promise<number> {
    try {
       const deletedCount = await auditRepository.cleanOldLogs(retentionDays);
       if (deletedCount > 0) {
         await this.logEvent({
           userId: 'SYSTEM',
           action: 'LOG_RETENTION_ENFORCED',
           details: { deletedCount, retentionDays },
           result: 'SUCCESS'
         });
       }
       return deletedCount;
    } catch (err) {
       console.error('Failed to enforce log retention policy:', err);
       return 0;
    }
  }
}

export const auditEngine = AuditEngine.getInstance();
