import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Notification, SystemSettings } from '../types';
import { notificationRepository } from './db/NotificationRepository';

class NotificationService {
  async send(
    userId: string,
    title: string,
    message: string,
    type: Notification['type'] = 'INFO',
    link?: string,
    category: Notification['category'] = 'SYSTEM'
  ): Promise<void> {
    const notification: Notification = {
      id: crypto.randomUUID(),
      userId,
      title,
      message,
      type,
      category,
      isRead: false,
      timestamp: new Date().toISOString()
    };
    if (link) {
      (notification as any).link = link;
    }
    await notificationRepository.create(notification.id, notification);
  }

  /**
   * Send a notification using a predefined system template
   */
  async sendFromTemplate(
    userId: string,
    templateKey: 'received' | 'approved' | 'rejected' | 'reupload' | 'suspended',
    variables: Record<string, string> = {},
    fallbackTitle: string,
    fallbackMessage: string,
    type: Notification['type'] = 'INFO',
    category: Notification['category'] = 'APPROVAL'
  ): Promise<void> {
    try {
      const settingsSnap = await getDoc(doc(db, 'systemSettings', 'global'));
      const settings = settingsSnap.exists() ? settingsSnap.data() as SystemSettings : null;

      let title = fallbackTitle;
      let message = fallbackMessage;

      if (settings?.notificationTemplates?.[templateKey]?.enabled) {
        title = settings.notificationTemplates[templateKey]!.title;
        message = settings.notificationTemplates[templateKey]!.body;

        // Replace variables in template e.g. {{role}}
        Object.entries(variables).forEach(([key, val]) => {
          title = title.replace(new RegExp(`{{${key}}}`, 'g'), val);
          message = message.replace(new RegExp(`{{${key}}}`, 'g'), val);
        });
      }

      await this.send(userId, title, message, type, undefined, category);
    } catch (err) {
      console.error('Failed to send template notification:', err);
      // Fallback to basic send if settings fetch fails
      await this.send(userId, fallbackTitle, fallbackMessage, type, undefined, category);
    }
  }
}

export const notificationService = new NotificationService();
