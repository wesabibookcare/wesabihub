import { commissionRecordRepository } from './db/CommissionRecordRepository';
import { systemSettingsRepository } from './db/SystemSettingsRepository';
import { auditEngine } from '../engines/AuditEngine';

export interface HubVolumeTier {
  minVolume: number;
  maxVolume: number;
  hubPercentage: number;
  omorfiHubPercentage: number;
}

export interface HubRevenueConfig {
  tiers: HubVolumeTier[];
  effectiveDate: string;
  isActive: boolean;
}

export const DEFAULT_HUB_REVENUE_CONFIG: HubRevenueConfig = {
  effectiveDate: '2025-01-01',
  isActive: true,
  tiers: [
    { minVolume: 1, maxVolume: 500, hubPercentage: 50, omorfiHubPercentage: 50 },
    { minVolume: 501, maxVolume: 1000, hubPercentage: 55, omorfiHubPercentage: 45 },
    { minVolume: 1001, maxVolume: 999999, hubPercentage: 60, omorfiHubPercentage: 40 }
  ]
};

export class HubRevenueEngine {
  private static instance: HubRevenueEngine;

  private constructor() {}

  public static getInstance(): HubRevenueEngine {
    if (!HubRevenueEngine.instance) {
      HubRevenueEngine.instance = new HubRevenueEngine();
    }
    return HubRevenueEngine.instance;
  }

  async getRevenueConfig(): Promise<HubRevenueConfig> {
    try {
      const settings = await systemSettingsRepository.getById('global');
      if (settings && (settings as any).hubRevenueConfig) {
        return (settings as any).hubRevenueConfig;
      }
    } catch {
      // Fallback to default
    }
    return DEFAULT_HUB_REVENUE_CONFIG;
  }

  async getMonthlyCompletedParcelCount(hubId: string, monthKey?: string): Promise<number> {
    // Current calendar month key format: YYYY-MM
    const targetMonth = monthKey || new Date().toISOString().substring(0, 7);
    const records = await commissionRecordRepository.getByCentre(hubId, 500);

    // Filter by completed & paid qualifying parcels in the calendar month
    const qualifyingRecords = records.filter(r => {
      const recordMonth = r.timestamp?.seconds
        ? new Date(r.timestamp.seconds * 1000).toISOString().substring(0, 7)
        : (typeof r.timestamp === 'string' ? r.timestamp.substring(0, 7) : targetMonth);
      return recordMonth === targetMonth && r.status === 'COMPLETED';
    });

    return qualifyingRecords.length;
  }

  async calculateRevenueSplit(hubId: string, qualifyingAmount: number): Promise<{
    tier: HubVolumeTier;
    hubAmount: number;
    omorfiHubAmount: number;
    monthlyCount: number;
  }> {
    const config = await this.getRevenueConfig();
    const currentVolume = await this.getMonthlyCompletedParcelCount(hubId);
    // Parcel being processed makes it currentVolume + 1
    const totalVolume = currentVolume + 1;

    let matchingTier = config.tiers.find(
      t => totalVolume >= t.minVolume && totalVolume <= t.maxVolume
    );

    if (!matchingTier) {
      matchingTier = config.tiers[config.tiers.length - 1] || DEFAULT_HUB_REVENUE_CONFIG.tiers[0];
    }

    const hubAmount = Number(((qualifyingAmount * matchingTier.hubPercentage) / 100).toFixed(2));
    const omorfiHubAmount = Number((qualifyingAmount - hubAmount).toFixed(2));

    return {
      tier: matchingTier,
      hubAmount,
      omorfiHubAmount,
      monthlyCount: totalVolume
    };
  }

  async recordQualifyingCollection(params: {
    hubId: string;
    parcelId: string;
    shipmentId: string;
    merchantId: string;
    totalFee: number;
  }): Promise<any> {
    const { tier, hubAmount, omorfiHubAmount, monthlyCount } = await this.calculateRevenueSplit(
      params.hubId,
      params.totalFee
    );

    const recordId = `COMM-${params.parcelId}-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const record = {
      id: recordId,
      shipmentId: params.shipmentId,
      parcelId: params.parcelId,
      totalFee: params.totalFee,
      platformAmount: omorfiHubAmount,
      centreAmount: hubAmount,
      futureLogisticsAmount: 0,
      pricingRuleVersion: 1,
      commissionRuleVersion: 1,
      timestamp,
      centreId: params.hubId,
      merchantId: params.merchantId,
      status: 'COMPLETED',
      country: 'NG',
      serviceType: 'HUB_COLLECTION',
      appliedTier: tier,
      monthlyParcelCountAtCollection: monthlyCount
    };

    await commissionRecordRepository.create(recordId, record as any);

    await auditEngine.logEvent({
      userId: params.hubId,
      action: 'HUB_REVENUE_SPLIT_RECORDED',
      details: {
        parcelId: params.parcelId,
        hubAmount,
        omorfiHubAmount,
        tier
      },
      result: 'SUCCESS'
    });

    return record;
  }
}

export const hubRevenueEngine = HubRevenueEngine.getInstance();
