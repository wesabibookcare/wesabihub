import { LogisticsProviderAdapter, ProviderIntegrationModel } from '../types';
import { providerAdapterRepository } from './db/ProviderAdapterRepository';
import { auditEngine } from '../engines/AuditEngine';

export type OmorfiHubStatus =
  | 'AWAITING_DROP_OFF'
  | 'RECEIVED_AT_ORIGIN'
  | 'IN_TRANSIT'
  | 'ARRIVED_AT_DESTINATION'
  | 'READY_FOR_PICKUP'
  | 'DELIVERED'
  | 'DELIVERY_FAILED'
  | 'CANCELLED'
  | 'RETURNED';

export interface NormalizedShipmentStatus {
  omorfiStatus: OmorfiHubStatus;
  externalStatus: string;
  providerName: string;
  remarks?: string;
}

export interface EcommerceOrderMap {
  platform: 'SHOPIFY' | 'WOOCOMMERCE' | 'JUMIA' | 'TEMU' | 'KONGA' | 'OTHER';
  externalOrderId: string;
  externalParcelId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  city: string;
  weightKg: number;
}

class ProviderAdapterSystem {
  private static instance: ProviderAdapterSystem;

  // Default fallback status map for popular external provider status names
  private defaultStatusMap: Record<string, OmorfiHubStatus> = {
    // Delivery complete variations
    'DELIVERY_COMPLETE': 'DELIVERED',
    'SUCCESSFUL_DELIVERY': 'DELIVERED',
    'COMPLETED': 'DELIVERED',
    'HANDED_OVER': 'DELIVERED',
    'FULFILLED': 'DELIVERED',

    // In transit variations
    'EN_ROUTE': 'IN_TRANSIT',
    'ON_THE_WAY': 'IN_TRANSIT',
    'DISPATCHED': 'IN_TRANSIT',
    'TRANSIT_HUB': 'IN_TRANSIT',

    // Hub arrivals
    'ARRIVED_HUB': 'ARRIVED_AT_DESTINATION',
    'SORTED': 'ARRIVED_AT_DESTINATION',
    'STAGED': 'ARRIVED_AT_DESTINATION',
    'RECEIVED_ORIGIN': 'RECEIVED_AT_ORIGIN',

    // Pickup & Out for delivery
    'OUT_FOR_DELIVERY': 'READY_FOR_PICKUP',
    'PICKUP_READY': 'READY_FOR_PICKUP',
    'PENDING_COLLECTION': 'READY_FOR_PICKUP',

    // Failures & Cancellations
    'FAILED_ATTEMPT': 'DELIVERY_FAILED',
    'UNABLE_TO_DELIVER': 'DELIVERY_FAILED',
    'CANCELLED_BY_CUSTOMER': 'CANCELLED',
    'CANCELLED_BY_SELLER': 'CANCELLED',
    'RETURN_TO_SENDER': 'RETURNED',
    'RETURNED_HUB': 'RETURNED'
  };

  private constructor() {}

  public static getInstance(): ProviderAdapterSystem {
    if (!ProviderAdapterSystem.instance) {
      ProviderAdapterSystem.instance = new ProviderAdapterSystem();
    }
    return ProviderAdapterSystem.instance;
  }

  /**
   * Normalizes an external provider's status string into an authoritative OmorfiHubStatus
   */
  async normalizeStatus(providerName: string, externalStatus: string): Promise<NormalizedShipmentStatus> {
    const rawUpper = (externalStatus || '').trim().toUpperCase();

    // Check if provider has custom mapping in Firestore
    const adapter = await providerAdapterRepository.getByProviderName(providerName);
    let mappedStatus: OmorfiHubStatus | undefined;

    if (adapter && adapter.statusMappings && adapter.statusMappings[rawUpper]) {
      mappedStatus = adapter.statusMappings[rawUpper];
    }

    if (!mappedStatus) {
      mappedStatus = this.defaultStatusMap[rawUpper] || 'IN_TRANSIT';
    }

    return {
      omorfiStatus: mappedStatus,
      externalStatus: rawUpper,
      providerName,
      remarks: `Normalized external status '${rawUpper}' from provider '${providerName}' to '${mappedStatus}'`
    };
  }

  /**
   * Register or update a Provider Adapter configuration
   */
  async configureAdapter(
    providerName: string,
    model: ProviderIntegrationModel,
    config: {
      companyId?: string;
      apiKey?: string;
      apiEndpointUrl?: string;
      webhookUrl?: string;
      webhookSecret?: string;
      apiHeaders?: Record<string, string>;
      statusMappings?: Record<string, OmorfiHubStatus>;
      isActive?: boolean;
    }
  ): Promise<LogisticsProviderAdapter> {
    const existing = await providerAdapterRepository.getByProviderName(providerName);
    const now = new Date().toISOString();

    if (existing) {
      const updated: Partial<LogisticsProviderAdapter> = {
        model,
        ...config,
        statusMappings: { ...(existing.statusMappings || {}), ...(config.statusMappings || {}) },
        updatedAt: now
      };
      await providerAdapterRepository.update(existing.id, updated);

      await auditEngine.logEvent({
        userId: 'SYSTEM',
        action: 'PROVIDER_ADAPTER_UPDATED',
        details: { providerName, model },
        result: 'SUCCESS'
      });

      return { ...existing, ...updated } as LogisticsProviderAdapter;
    } else {
      const id = 'adapter_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const newAdapter: LogisticsProviderAdapter = {
        id,
        providerName,
        model,
        companyId: config.companyId || '',
        apiKey: config.apiKey || '',
        apiEndpointUrl: config.apiEndpointUrl || '',
        webhookUrl: config.webhookUrl || '',
        webhookSecret: config.webhookSecret || '',
        apiHeaders: config.apiHeaders || {},
        statusMappings: config.statusMappings || {},
        isActive: config.isActive !== false,
        createdAt: now,
        updatedAt: now,
        isDeleted: false
      };

      await providerAdapterRepository.create(id, newAdapter);

      await auditEngine.logEvent({
        userId: 'SYSTEM',
        action: 'PROVIDER_ADAPTER_CREATED',
        details: { providerName, model },
        result: 'SUCCESS'
      });

      return newAdapter;
    }
  }

  /**
   * E-Commerce Connector payload normalizer
   */
  normalizeEcommerceOrder(order: EcommerceOrderMap): any {
    return {
      recipientInfo: {
        name: order.customerName,
        phone: order.customerPhone,
        email: order.customerEmail || ''
      },
      deliveryAddress: order.deliveryAddress,
      city: order.city,
      weightKg: order.weightKg || 1,
      externalOrderId: order.externalOrderId,
      externalParcelId: order.externalParcelId || '',
      connectorPlatform: order.platform,
      isConnectorImport: true
    };
  }
}

export const providerAdapterSystem = ProviderAdapterSystem.getInstance();
