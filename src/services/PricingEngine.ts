import {
  PricingRule,
  PricingBreakdown,
  Parcel,
  HubCenter
} from '../types';
import { pricingRuleRepository } from './db/PricingRuleRepository';

export class PricingEngine {
  async calculatePrice(
    params: {
      country: string;
      weightKg: number;
      dimensions?: { l: number; w: number; h: number };
      distanceKm?: number;
      serviceType: 'STANDARD' | 'EXPRESS' | 'SAME_DAY';
      isTransfer?: boolean;
    }
  ): Promise<PricingBreakdown> {
    let rule = await pricingRuleRepository.getActiveRuleByCountry(params.country);
    if (!rule) {
      rule = {
        id: 'fallback-rule-ng',
        name: 'Default Pricing Rule',
        country: params.country || 'Nigeria',
        maxWeightKg: 100,
        currency: 'NGN',
        basePrice: 500,
        pricePerKg: 200,
        dimensionMultiplier: 100,
        distanceBasePrice: 200,
        pricePerKm: 50,
        serviceMultipliers: { STANDARD: 1, EXPRESS: 1.5, SAME_DAY: 2 },
        transferDiscountPercentage: 10,
        minPrice: 500,
        taxesPercentage: 7.5,
        commissions: { platformPercentage: 10, hubPointPercentage: 20, logisticsPercentage: 70 },
        isActive: true,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // 1. Base Price
    const basePrice = rule.basePrice;

    // 2. Weight Charge
    const weightCharge = params.weightKg * rule.pricePerKg;

    // 3. Dimension Charge
    let dimensionCharge = 0;
    if (params.dimensions) {
      const volume = (params.dimensions.l * params.dimensions.w * params.dimensions.h) / 1000000; // cubic meters
      dimensionCharge = volume * rule.dimensionMultiplier;
    }

    // 4. Distance Charge
    let distanceCharge = 0;
    if (params.distanceKm) {
      distanceCharge = rule.distanceBasePrice + (params.distanceKm * rule.pricePerKm);
    }

    // 5. Service Adjustment
    const serviceMultiplier = rule.serviceMultipliers[params.serviceType] || 1;
    const currentSubtotal = basePrice + weightCharge + dimensionCharge + distanceCharge;
    const serviceCharge = (currentSubtotal * serviceMultiplier) - currentSubtotal;

    // 6. Transfer Adjustment
    let transferAdjustment = 0;
    if (params.isTransfer) {
      transferAdjustment = -(currentSubtotal * (rule.transferDiscountPercentage / 100));
    }

    // 7. Calculate Final Subtotal
    const subtotal = Math.max(rule.minPrice, currentSubtotal + serviceCharge + transferAdjustment);

    // 8. Taxes
    const tax = subtotal * (rule.taxesPercentage / 100);
    const total = subtotal + tax;

    // 9. Commissions
    const platformComm = subtotal * (rule.commissions.platformPercentage / 100);
    const hubPointComm = subtotal * (rule.commissions.hubPointPercentage / 100);
    const logisticsComm = subtotal * (rule.commissions.logisticsPercentage / 100);

    return {
      basePrice,
      weightCharge,
      dimensionCharge,
      distanceCharge,
      serviceCharge,
      transferAdjustment,
      subtotal,
      tax,
      total,
      currency: rule.currency,
      ruleVersion: rule.version,
      commissions: {
        platform: platformComm,
        hubPoint: hubPointComm,
        logistics: logisticsComm
      }
    };
  }

  async estimateShipment(parcel: Partial<Parcel>, country: string): Promise<PricingBreakdown> {
    if (!parcel.weightKg) throw new Error('Weight is required for pricing estimation');

    return this.calculatePrice({
      country,
      weightKg: parcel.weightKg,
      dimensions: parcel.dimensions,
      serviceType: 'STANDARD', // Default for estimation
      isTransfer: false
    });
  }
}

export const pricingEngine = new PricingEngine();
