import { MerchantBusiness } from '../types';
import { merchantBusinessRepository } from '../services/db/MerchantBusinessRepository';
import { auditEngine, notificationEngine, storageEngine } from './index';
import { monitoringEngine } from './MonitoringEngine';
import { userEngine } from './UserEngine';
import { permissionService } from '../services/permissionService';

/**
 * WeSabiHub Merchant Engine
 * Manages Merchant Business Profiles, Verifications, and Operations.
 */
class MerchantEngine {
  private static instance: MerchantEngine;

  private constructor() {}

  public static getInstance(): MerchantEngine {
    if (!MerchantEngine.instance) {
      MerchantEngine.instance = new MerchantEngine();
    }
    return MerchantEngine.instance;
  }

  async getBusiness(merchantId: string): Promise<MerchantBusiness | null> {
    const businesses = await merchantBusinessRepository.getByMerchantId(merchantId);
    return businesses.length > 0 ? businesses[0] : null;
  }

  async getBusinessesByMerchant(merchantId: string): Promise<MerchantBusiness[]> {
    return await merchantBusinessRepository.getByMerchantId(merchantId);
  }

  async createBusiness(merchantId: string, businessData: Partial<MerchantBusiness>): Promise<void> {
    try {
      const user = await userEngine.getUser(merchantId);
      if (!user || !permissionService.hasPermission(user, 'SETTINGS_EDIT')) {
         throw new Error('Unauthorized');
      }

      await merchantBusinessRepository.create(merchantId, {
        ...businessData,
        ownerId: merchantId,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as MerchantBusiness);

      await auditEngine.logEvent({
        userId: merchantId,
        userRole: 'MERCHANT',
        action: 'CREATE_BUSINESS_PROFILE',
        details: { businessName: businessData.businessName },
        result: 'SUCCESS'
      });

      await notificationEngine.send(
        merchantId,
        'Business Profile Created',
        `Your business profile for ${businessData.businessName} has been created and is pending verification.`,
        'INFO',
        '/merchant/settings',
        'SYSTEM'
      );
    } catch (err: any) {
      await monitoringEngine.captureError(err, 'API', 'MEDIUM', { merchantId, action: 'CREATE_BUSINESS' });
      throw err;
    }
  }

  async updateBusiness(merchantId: string, updates: Partial<MerchantBusiness>): Promise<void> {
    try {
      const user = await userEngine.getUser(merchantId);
      if (!user || !permissionService.hasPermission(user, 'SETTINGS_EDIT')) {
         throw new Error('Unauthorized');
      }

      await merchantBusinessRepository.update(merchantId, {
        ...updates,
        updatedAt: new Date().toISOString()
      });

      await auditEngine.logEvent({
        userId: merchantId,
        userRole: 'MERCHANT',
        action: 'UPDATE_BUSINESS_PROFILE',
        details: { updates },
        result: 'SUCCESS'
      });

      await notificationEngine.send(
        merchantId,
        'Business Profile Updated',
        'Your business profile settings have been updated successfully.',
        'INFO',
        '/merchant/settings',
        'SYSTEM'
      );
    } catch (err: any) {
      await monitoringEngine.captureError(err, 'API', 'MEDIUM', { merchantId, action: 'UPDATE_BUSINESS' });
      throw err;
    }
  }

  async uploadBusinessDocument(merchantId: string, docType: string, file: File): Promise<string> {
    const url = await storageEngine.uploadUserDocument(merchantId, `merchant_${docType}`, file);

    await this.updateBusiness(merchantId, {
      [`${docType}Url`]: url
    });

    return url;
  }
}

export const merchantEngine = MerchantEngine.getInstance();
