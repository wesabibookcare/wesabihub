
import { auditEngine } from './AuditEngine';
import { notificationEngine } from './NotificationEngine';

export interface SystemError {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  category: 'DATABASE' | 'PAYMENT' | 'AUTH' | 'STORAGE' | 'API' | 'INFRASTRUCTURE' | 'WEBHOOK' | 'SECURITY' | 'CLOUD_FUNCTION' | 'QUEUE' | 'UNKNOWN';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metadata?: any;
}

/**
 * WeSabiHub Monitoring Engine
 * Responsible for authoritative production observability, error tracking, and alerting.
 */
class MonitoringEngine {
  private static instance: MonitoringEngine;
  private errorCounts: Record<string, number> = {};
  private alertThresholds: Record<string, number> = {
    'PAYMENT': 3,
    'WEBHOOK': 5,
    'DATABASE': 2,
    'SECURITY': 1,
    'AUTH': 5,
    'CLOUD_FUNCTION': 3,
    'STORAGE': 3,
    'API': 10,
    'QUEUE': 5,
    'INFRASTRUCTURE': 1
  };

  private constructor() {}

  public static getInstance(): MonitoringEngine {
    if (!MonitoringEngine.instance) {
      MonitoringEngine.instance = new MonitoringEngine();
    }
    return MonitoringEngine.instance;
  }

  /**
   * Captures and logs a system error with production-grade metadata.
   */
  public async captureError(error: Error | string, category: SystemError['category'], severity: SystemError['severity'], metadata: any = {}): Promise<void> {
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
    const message = typeof error === 'string' ? error : error.message;
    const stack = error instanceof Error ? error.stack : undefined;

    const errorEntry: SystemError = {
      id: errorId,
      timestamp: new Date().toISOString(),
      message,
      stack,
      category,
      severity,
      metadata
    };

    // 1. Log to console for platform observability
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      console.error(`[MONITORING] ${severity} ERROR: ${message}`, metadata);
    } else {
      console.warn(`[MONITORING] ${severity} ERROR: ${message}`, metadata);
    }

    // 2. Persist to AuditEngine for historical analysis
    await auditEngine.logEvent({
      userId: metadata.userId || 'SYSTEM',
      action: `SYSTEM_ERROR_${category}`,
      details: { ...errorEntry, stack: stack?.substring(0, 500) }, // Scrub stack for storage
      result: 'FAILURE'
    });

    // 3. Increment counters for alerting
    const counterKey = `${category}_${severity}`;
    this.errorCounts[counterKey] = (this.errorCounts[counterKey] || 0) + 1;

    // 4. Evaluate alerting thresholds
    await this.evaluateAlerts(category, severity, message);
  }

  /**
   * Tracks a production alert event and notifies administrators if thresholds are breached.
   */
  private async evaluateAlerts(category: string, severity: string, message: string): Promise<void> {
    const thresholdKey = `${category}_${severity}`;
    const count = this.errorCounts[thresholdKey];

    if (severity === 'CRITICAL' || count >= (this.alertThresholds[category] || 10)) {
       await notificationEngine.sendOperationalAlert(
         `PROD ALERT: ${category} ${severity}`,
         `The following issue was detected: ${message}. Occurrence count: ${count}`,
         severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH'
       );

       // Reset counter after alerting to avoid spam
       this.errorCounts[thresholdKey] = 0;
    }
  }

  /**
   * Records a performance metric for production health monitoring.
   */
  public async recordMetric(name: string, value: number, metadata: any = {}): Promise<void> {
    // In a real production environment, this might go to Prometheus/Cloud Monitoring
    // For WeSabiHub, we use AuditEngine for low-volume metric storage
    if (value > 1000) { // Log slow operations (>1s)
      await auditEngine.logEvent({
        userId: 'SYSTEM',
        action: 'PERFORMANCE_METRIC',
        details: { name, value, ...metadata },
        result: 'SUCCESS'
      });
    }
  }

  /**
   * Returns current health metrics for the operational dashboard.
   */
  public async getHealthMetrics(): Promise<any> {
    return {
      errorCounters: this.errorCounts,
      thresholds: this.alertThresholds,
      timestamp: new Date().toISOString()
    };
  }
}

export const monitoringEngine = MonitoringEngine.getInstance();
