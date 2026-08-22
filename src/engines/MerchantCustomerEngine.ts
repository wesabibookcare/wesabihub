import { MerchantCustomer, Parcel, User } from '../types';
import { merchantCustomerRepository } from '../services/db/MerchantCustomerRepository';
import { shipmentRepository } from '../services/db/ShipmentRepository';
import { userRepository } from '../services/db/UserRepository';
import { auditEngine } from './AuditEngine';
import { monitoringEngine } from './MonitoringEngine';

/**
 * WeSabiHub Merchant Customer Engine
 * Aggregates and manages customer relationships for Merchants.
 */
class MerchantCustomerEngine {
  private static instance: MerchantCustomerEngine;

  private constructor() {}

  public static getInstance(): MerchantCustomerEngine {
    if (!MerchantCustomerEngine.instance) {
      MerchantCustomerEngine.instance = new MerchantCustomerEngine();
    }
    return MerchantCustomerEngine.instance;
  }

  /**
   * Synchronizes merchant customers based on their shipment history.
   * This is a heavy operation, should be used carefully or triggered by events.
   */
  async syncCustomersFromShipments(merchantId: string): Promise<void> {
    try {
      const shipments = await shipmentRepository.getByMerchant(merchantId);

      const customerMap = new Map<string, {
        name: string,
        email?: string,
        phone: string,
        totalShipments: number,
        totalSpent: number,
        lastShipmentId: string
      }>();

      for (const shipment of shipments) {
        const phone = shipment.recipientInfo.phone;
        const current = customerMap.get(phone) || {
          name: shipment.recipientInfo.name,
          email: shipment.recipientInfo.email,
          phone: phone,
          totalShipments: 0,
          totalSpent: 0,
          lastShipmentId: shipment.id
        };

        current.totalShipments += 1;
        current.totalSpent += shipment.pricing.total;
        customerMap.set(phone, current);
      }

      for (const [phone, data] of customerMap.entries()) {
        const existing = await merchantCustomerRepository.getByMerchantAndPhone(merchantId, phone);

        if (existing) {
          await merchantCustomerRepository.update(existing.id, {
            ...data,
            updatedAt: new Date().toISOString()
          });
        } else {
          const id = `MC-${merchantId.substring(0, 5)}-${phone.replace(/[^0-9]/g, '').slice(-6)}`;
          await merchantCustomerRepository.create(id, {
            id,
            merchantId,
            ...data,
            isFavorite: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as MerchantCustomer);
        }
      }

      await auditEngine.logEvent({
        userId: merchantId,
        userRole: 'MERCHANT',
        action: 'SYNC_CUSTOMERS',
        details: { count: customerMap.size },
        result: 'SUCCESS'
      });
    } catch (err: any) {
      await monitoringEngine.captureError(err, 'API', 'MEDIUM', { merchantId, action: 'SYNC_CUSTOMERS' });
      throw err;
    }
  }

  async getCustomers(merchantId: string): Promise<MerchantCustomer[]> {
    return await merchantCustomerRepository.getByMerchant(merchantId);
  }

  async toggleFavorite(customerId: string, isFavorite: boolean): Promise<void> {
    await merchantCustomerRepository.update(customerId, { isFavorite });
  }

  async updateCustomer(customerId: string, data: Partial<MerchantCustomer>): Promise<void> {
    await merchantCustomerRepository.update(customerId, data);
  }

  async addNote(customerId: string, note: string): Promise<void> {
    await merchantCustomerRepository.update(customerId, { notes: note });
  }

  async deleteCustomer(customerId: string): Promise<void> {
    await merchantCustomerRepository.delete(customerId);
  }

  async getCustomerDetails(customerId: string): Promise<MerchantCustomer | null> {
    return await merchantCustomerRepository.getById(customerId);
  }

  /**
   * Fetches the actual User object if they are registered on WeSabiHub
   */
  async getLinkedUser(phone: string): Promise<User | null> {
    return await userRepository.getByPhone(phone);
  }

  /**
   * Automatically records or updates a customer record from a shipment.
   * Ensures the merchant's customer list is always up-to-date.
   */
  async recordCustomerFromShipment(merchantId: string, shipment: Parcel): Promise<void> {
    try {
      const phone = shipment.recipientInfo.phone;
      const existing = await merchantCustomerRepository.getByMerchantAndPhone(merchantId, phone);

      if (existing) {
        await merchantCustomerRepository.update(existing.id, {
          name: shipment.recipientInfo.name,
          email: shipment.recipientInfo.email || existing.email,
          totalShipments: (existing.totalShipments || 0) + 1,
          totalSpent: (existing.totalSpent || 0) + shipment.pricing.total,
          lastShipmentId: shipment.id,
          updatedAt: new Date().toISOString()
        });
      } else {
        const id = `MC-${merchantId.substring(0, 5)}-${phone.replace(/[^0-9]/g, '').slice(-6)}`;
        await merchantCustomerRepository.create(id, {
          id,
          merchantId,
          name: shipment.recipientInfo.name,
          email: shipment.recipientInfo.email,
          phone: phone,
          totalShipments: 1,
          totalSpent: shipment.pricing.total,
          lastShipmentId: shipment.id,
          isFavorite: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as MerchantCustomer);
      }
    } catch (err) {
      console.error('Failed to record customer from shipment:', err);
      // Non-blocking, do not throw
    }
  }
}

export const merchantCustomerEngine = MerchantCustomerEngine.getInstance();
