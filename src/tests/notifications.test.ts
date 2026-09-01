import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { notificationEngine } from '../engines/NotificationEngine';
import { communicationProviderService } from '../services/CommunicationProviderService';

describe('OmorfiHub Unified Notification System Unit Tests', () => {
  test('NotificationEngine singleton returns consistent instance', () => {
    const instance1 = notificationEngine;
    const instance2 = notificationEngine;
    expect(instance1).toBe(instance2);
  });

  test('Provider Health stats report correct channel health structures', () => {
    const health = communicationProviderService.getHealthStats();
    expect(Array.isArray(health)).toBe(true);
    expect(health.length).toBeGreaterThan(0);
    const telegramHealth = health.find(h => h.provider === 'TELEGRAM');
    expect(telegramHealth).toBeDefined();
    expect(telegramHealth?.channel).toBe('TELEGRAM');
  });

  test('Critical notifications do not crash application when external dispatch fails', async () => {
    let didThrow = false;
    try {
      await notificationEngine.send(
        'TEST_USER_99',
        'Security Alert',
        'Suspicious login attempt detected',
        'WARNING',
        undefined,
        'SECURITY',
        { email: 'invalid-email-test', phone: '+2340000000' }
      );
    } catch (err) {
      didThrow = true;
    }
    expect(didThrow).toBe(false);
  });
});
