import { geocodingService } from '../services/GeocodingService';
import { mapService } from '../services/MapService';
import { qrService } from '../services/QRService';
import { searchService } from '../services/SearchService';
import { merchantBusinessRepository } from '../services/db/MerchantBusinessRepository';
import { logisticsRepository } from '../services/db/LogisticsRepository';
import { auditEngine } from './AuditEngine';
import { developerProfileRepository } from '../services/db/DeveloperProfileRepository';
import { webhookLogRepository } from '../services/db/WebhookLogRepository';

/**
 * WeSabiHub API & Integration Engine
 * External service gateway (Maps, Geocoding, Search, QR, Webhooks).
 */
class IntegrationEngine {
  private static instance: IntegrationEngine;

  private constructor() {}

  public static getInstance(): IntegrationEngine {
    if (!IntegrationEngine.instance) {
      IntegrationEngine.instance = new IntegrationEngine();
    }
    return IntegrationEngine.instance;
  }

  get maps() {
    return mapService;
  }

  get geocoding() {
    return geocodingService;
  }

  get qr() {
    return qrService;
  }

  get search() {
    return searchService;
  }

  /**
   * API Key Management & Credential Rotation
   */
  async generateApiKey(entityId: string, type: 'MERCHANT' | 'LOGISTICS' | 'DEVELOPER'): Promise<string> {
    const apiKey = `WOS_${type.substring(0, 1)}_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;

    if (type === 'MERCHANT') {
      const businesses = await merchantBusinessRepository.getByMerchantId(entityId);
      if (businesses.length > 0) {
        await merchantBusinessRepository.update(businesses[0].id, { apiKey, apiKeyCreatedAt: new Date().toISOString() });
      }
    } else if (type === 'LOGISTICS') {
      const company = await logisticsRepository.getByOwner(entityId);
      if (company) {
        await logisticsRepository.update(company.id, { apiKey, apiKeyCreatedAt: new Date().toISOString() });
      }
    } else {
      // DEVELOPER: entityId is the developer's own uid, and the profile
      // document ID is that same uid (see DeveloperPage.tsx registration).
      await developerProfileRepository.update(entityId, { apiKey, apiKeyCreatedAt: new Date().toISOString() });
    }

    await auditEngine.logEvent({
      userId: entityId,
      action: 'GENERATE_API_KEY',
      details: { type },
      result: 'SUCCESS'
    });

    return apiKey;
  }

  async revokeApiKey(entityId: string, type: 'MERCHANT' | 'LOGISTICS' | 'DEVELOPER'): Promise<void> {
    if (type === 'MERCHANT') {
      const businesses = await merchantBusinessRepository.getByMerchantId(entityId);
      if (businesses.length > 0) {
        await merchantBusinessRepository.update(businesses[0].id, { apiKey: '', isApiKeyRevoked: true });
      }
    } else if (type === 'LOGISTICS') {
      const company = await logisticsRepository.getByOwner(entityId);
      if (company) {
        await logisticsRepository.update(company.id, { apiKey: '', isApiKeyRevoked: true, connectorActive: false });
      }
    } else {
      await developerProfileRepository.update(entityId, { apiKey: '', status: 'SUSPENDED' });
    }

    await auditEngine.logEvent({
      userId: entityId,
      action: 'REVOKE_API_KEY',
      details: { type },
      result: 'SUCCESS'
    });
  }

  /**
   * Webhook Management
   */
  async registerWebhook(entityId: string, type: 'MERCHANT' | 'LOGISTICS' | 'DEVELOPER', url: string): Promise<void> {
    if (type === 'MERCHANT') {
      const businesses = await merchantBusinessRepository.getByMerchantId(entityId);
      if (businesses.length > 0) {
        await merchantBusinessRepository.update(businesses[0].id, { webhookUrl: url });
      }
    } else if (type === 'LOGISTICS') {
      const company = await logisticsRepository.getByOwner(entityId);
      if (company) {
        await logisticsRepository.update(company.id, { webhookUrl: url });
      }
    } else {
      await developerProfileRepository.update(entityId, { webhookUrl: url });
    }
  }

  async testWebhook(userId: string, type: 'MERCHANT' | 'LOGISTICS' | 'DEVELOPER', url: string): Promise<void> {

    const start = Date.now();

    // Simulate a successful delivery
    await webhookLogRepository.create(`LOG-${Date.now()}`, {
      id: crypto.randomUUID(),
      userId,
      event: 'test.ping',
      url,
      payload: JSON.stringify({ ping: 'pong', timestamp: new Date().toISOString() }),
      response: JSON.stringify({ status: 'ok' }),
      status: 200,
      timestamp: new Date().toISOString(),
    });

    await auditEngine.logEvent({
      userId,
      action: 'TEST_WEBHOOK',
      details: { url, type },
      result: 'SUCCESS'
    });
  }

  /**
   * External Provider Integrations (Placeholders for real SDK calls)
   */
  async verifyFlutterwaveTransaction(transactionId: string): Promise<boolean> {
    // Logic to call Flutterwave API
    return true;
  }

  async verifyPaystackTransaction(reference: string): Promise<boolean> {
    // Logic to call Paystack API
    return true;
  }

  async sendTelegramNotification(chatId: string, message: string): Promise<void> {
    // Logic to call Telegram Bot API
  }
}

export const integrationEngine = IntegrationEngine.getInstance();
