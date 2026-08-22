import { systemSettingsRepository } from './db/SystemSettingsRepository';
import { auditRepository } from './db/AuditRepository';
import { notificationEngine } from '../engines/NotificationEngine';

export class AlertService {
  async sendTelegramAlert(title: string, message: string, priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM') {
    try {
      const priorityEmoji = {
        'LOW': 'ℹ️',
        'MEDIUM': '⚠️',
        'HIGH': '🚨',
        'CRITICAL': '🔥'
      };

      const emoji = priorityEmoji[priority] || '🔔';
      const telegramMessage = `
${emoji} *${title}*
Priority: ${priority}

${message}

_WeSabiHub Operations Centre_
      `.trim();

      await notificationEngine.sendTelegram('SYSTEM_ALERT', title, telegramMessage, 'SECURITY');
    } catch (err) {
      console.error('Failed to send Telegram alert:', err);
    }
  }

  async logAndAlert(title: string, message: string, priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', userId: string) {
    // Log to Audit Trail
    await auditRepository.logAction(
      userId,
      'SYSTEM_ALERT',
      { title, priority },
      'system'
    );

    // Send Telegram if priority is high enough
    if (priority === 'HIGH' || priority === 'CRITICAL') {
      await this.sendTelegramAlert(title, message, priority);
    }
  }
}

export const alertService = new AlertService();
