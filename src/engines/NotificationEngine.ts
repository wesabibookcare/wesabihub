import { notificationRepository } from '../services/db/NotificationRepository';
import { notificationService } from '../services/NotificationService';
import { operationalNotificationService } from '../services/OperationalNotificationService';
import { communicationProviderService, ProviderHealth } from '../services/CommunicationProviderService';
import { communicationLogRepository } from '../services/db/CommunicationLogRepository';
import { auditEngine } from './AuditEngine';
import { Notification, CommunicationLog } from '../types';
import { developerProfileRepository } from '../services/db/DeveloperProfileRepository';
import { monitoringEngine } from './MonitoringEngine';
import { webhookLogRepository } from '../services/db/WebhookLogRepository';
import { conversationRepository } from '../services/db/ConversationRepository';

/**
 * WeSabiHub Notification Engine
 * Sole entry point for all platform communications.
 * No page should send notifications directly.
 */
class NotificationEngine {
  private static instance: NotificationEngine;

  private constructor() {}

  public static getInstance(): NotificationEngine {
    if (!NotificationEngine.instance) {
      NotificationEngine.instance = new NotificationEngine();
    }
    return NotificationEngine.instance;
  }

  private mapCategory(cat: Notification['category'] | CommunicationLog['category']): CommunicationLog['category'] {
    const mapping: Record<string, CommunicationLog['category']> = {
      'PAYMENT': 'PAYMENT',
      'SECURITY': 'SECURITY',
      'SYSTEM': 'SYSTEM',
      'API': 'API',
      'ANNOUNCEMENT': 'SYSTEM',
      'WESABICHAT': 'SYSTEM',
      'SHIPMENT': 'PARCEL',
      'RETURN': 'PARCEL',
      'STORAGE': 'CENTRE',
      'COMPLAINT': 'SYSTEM',
      'DISPUTE': 'PAYMENT',
      'APPROVAL': 'ADMIN',
      'INVITATION': 'SYSTEM',
      'PLATFORM': 'SYSTEM'
    };
    return mapping[cat] || (cat as any) || 'SYSTEM';
  }

  /**
   * Send a standard notification (creates In-App and automatically propagates to configured channels based on rules)
   */
  async send(
    userId: string,
    title: string,
    message: string,
    type: Notification['type'] = 'INFO',
    link?: string,
    category: Notification['category'] = 'SYSTEM',
    recipientContact?: { email?: string; phone?: string }
  ): Promise<void> {
    // 1. Deliver standard In-App Notification
    await notificationService.send(userId, title, message, type, link, category);

    // 2. High-Integrity Propagation Rule:
    // Critical alert categories (e.g., PAYMENT, SECURITY) or urgent types (WARNING)
    // automatically trigger Telegram alerts, SMS, or Emails depending on configuration.
    const isCritical = category === 'PAYMENT' || category === 'SECURITY' || type === 'WARNING';

    if (isCritical) {
      // Propagation A: Telegram Operational Alerts
      await this.sendTelegram('SYSTEM_TELEGRAM_RECIPIENT', `[${category}] ${title}`, message, category);

      // Propagation B: Email (if a recipient email address is provided or resolved)
      if (recipientContact?.email) {
        await this.sendEmail(userId, recipientContact.email, title, message, category);
      }

      // Propagation C: SMS (if recipient phone number is provided or resolved)
      if (recipientContact?.phone) {
        await this.sendSMS(userId, recipientContact.phone, `${title}: ${message.substring(0, 100)}`, category);
      }
    }
  }

  /**
   * Send using a predefined template
   */
  async sendFromTemplate(
    userId: string,
    templateKey: 'received' | 'approved' | 'rejected' | 'reupload' | 'suspended',
    variables: Record<string, string> = {},
    fallbackTitle: string,
    fallbackMessage: string,
    type: Notification['type'] = 'INFO',
    category: Notification['category'] = 'APPROVAL',
    recipientContact?: { email?: string; phone?: string }
  ): Promise<void> {
    await notificationService.sendFromTemplate(userId, templateKey, variables, fallbackTitle, fallbackMessage, type, category);

    // Automatic propagation for template alerts
    if (recipientContact?.email) {
      await this.sendEmail(userId, recipientContact.email, fallbackTitle, fallbackMessage, category);
    }
  }

  /**
   * Direct Dispatch to Email channel
   */
  async sendEmail(
    userId: string,
    email: string,
    title: string,
    body: string,
    category: Notification['category'] | CommunicationLog['category'] = 'SYSTEM'
  ): Promise<CommunicationLog> {
    return await communicationProviderService.dispatch({
      userId,
      recipient: email,
      channel: 'EMAIL',
      category: this.mapCategory(category),
      title,
      body,
    });
  }

  /**
   * Direct Dispatch to SMS channel
   */
  async sendSMS(
    userId: string,
    phone: string,
    body: string,
    category: Notification['category'] | CommunicationLog['category'] = 'SYSTEM'
  ): Promise<CommunicationLog> {
    return await communicationProviderService.dispatch({
      userId,
      recipient: phone,
      channel: 'SMS',
      category: this.mapCategory(category),
      title: 'SMS Alert',
      body,
    });
  }

  /**
   * Direct Dispatch to Telegram channel
   */
  async sendTelegram(
    userId: string,
    title: string,
    body: string,
    category: Notification['category'] | CommunicationLog['category'] = 'SYSTEM'
  ): Promise<CommunicationLog> {
    return await communicationProviderService.dispatch({
      userId,
      recipient: 'TELEGRAM_CHAT',
      channel: 'TELEGRAM',
      category: this.mapCategory(category),
      title,
      body,
    });
  }

  /**
   * Direct Dispatch to Push notification channel
   */
  async sendPush(
    userId: string,
    token: string,
    title: string,
    body: string,
    category: CommunicationLog['category'] = 'SYSTEM'
  ): Promise<CommunicationLog> {
    return await communicationProviderService.dispatch({
      userId,
      recipient: token,
      channel: 'PUSH',
      category,
      title,
      body,
    });
  }

  /**
   * Get all notifications for a user
   */
  async getNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    return await notificationRepository.getByUser(userId, limit);
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<void> {
    await notificationRepository.markAsRead(id);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const unread = await notificationRepository.getUnread(userId, 100);
    await Promise.all(unread.map(n => notificationRepository.markAsRead(n.id)));
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<void> {
    await notificationRepository.delete(id);
  }

  /**
   * Subscribe to live notifications for a user
   */
  subscribeToNotifications(userId: string, callback: (notes: Notification[]) => void) {
    return notificationRepository.subscribeToUser(userId, callback);
  }

  /**
   * Get unread in-app notifications for a user
   */
  async getUnreadNotifications(userId: string, limit: number = 20): Promise<Notification[]> {
    return await notificationRepository.getUnread(userId, limit);
  }

  /**
   * Get recent communication delivery logs (Email, SMS, Telegram, etc.)
   */
  async getRecentCommunicationLogs(limitCount: number = 50): Promise<CommunicationLog[]> {
    return await communicationLogRepository.getRecent(limitCount);
  }

  /**
   * Subscribe to live communication logs updates
   */
  subscribeToCommunicationLogs(callback: (logs: CommunicationLog[]) => void, limitCount: number = 50) {
    return communicationLogRepository.subscribeToRecent(callback, limitCount);
  }

  /**
   * Get provider status and health dashboard metrics
   */
  getProviderHealthStats(): ProviderHealth[] {
    return communicationProviderService.getHealthStats();
  }

  /**
   * Send operational alert (e.g. to admins or ops staff)
   */
  async sendOperationalAlert(title: string, body: string, urgency: 'NORMAL' | 'HIGH' | 'CRITICAL' = 'NORMAL'): Promise<void> {
    await operationalNotificationService.send({
      parcelId: 'SYSTEM',
      shipmentId: 'SYSTEM',
      trackingNumber: 'SYSTEM',
      type: urgency === 'CRITICAL' ? 'EXCEPTION_REPORTED' : 'PARCEL_RECEIVED_AT_HUB',
      title,
      message: body,
      actorId: 'SYSTEM',
      actorName: 'WeSabiHub Engine',
      actorRole: 'SUPER_ADMIN',
      visibleToRoles: ['SUPER_ADMIN', 'OPERATIONS_MANAGER', 'VERIFICATION_OFFICER']
    });

    // Automatically send urgent alerts to Telegram as well
    if (urgency === 'HIGH' || urgency === 'CRITICAL') {
      await this.sendTelegram('SYSTEM_OPERATIONS', `🚨 OPERATIONAL ALERT: ${title}`, body, 'ADMIN');
    }
  }

  async sendWebhookNotification(userId: string, event: string, payload: any): Promise<void> {

    const profile = await developerProfileRepository.getById(userId);
    if (!profile || !profile.webhookUrl || profile.status !== 'APPROVED') return;

    const webhookLogId = crypto.randomUUID();
    const webhookPayload = {
        id: webhookLogId,
        event,
        timestamp: new Date().toISOString(),
        payload
    };

    let status = 0;
    let responseText = '';

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(profile.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'WeSabiHub-Webhook-Bot/1.0'
            },
            body: JSON.stringify(webhookPayload),
            signal: controller.signal as any
        });
        clearTimeout(timeoutId);
        status = response.status;
        responseText = await response.text();
    } catch (fetchErr: any) {
        status = 500;
        responseText = fetchErr.message || 'Network error';

        await monitoringEngine.captureError(fetchErr, 'WEBHOOK', 'MEDIUM', { userId, event, webhookUrl: profile.webhookUrl });
    }


    await webhookLogRepository.create(webhookLogId, {
        id: webhookLogId,
        userId,
        event,
        url: profile.webhookUrl,
        status,
        response: responseText.substring(0, 500),
        payload: JSON.stringify(payload),
        timestamp: new Date().toISOString()
    });

    await auditEngine.logEvent({
        userId,
        action: 'WEBHOOK_DELIVERY',
        details: { event, status, url: profile.webhookUrl },
        result: status >= 200 && status < 300 ? 'SUCCESS' : 'FAILURE'
    });
  }

  async getConversations(): Promise<any[]> {

    return await conversationRepository.getAll();
  }
}

export const notificationEngine = NotificationEngine.getInstance();
