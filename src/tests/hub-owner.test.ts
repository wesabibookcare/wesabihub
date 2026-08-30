import { describe, test, expect } from 'bun:test';
import { VALID_PUBLIC_ROLES } from '../constants/roles';

export interface HubVolumeTier {
  id: string;
  minParcels: number;
  maxParcels: number;
  hubPercentage: number;
  omorfiPercentage: number;
}

describe('Hub Owner Role Lifecycle Tests', () => {
  test('CENTER_OWNER role is included in allowed public roles', () => {
    expect(VALID_PUBLIC_ROLES).toContain('CENTER_OWNER');
  });

  test('Hub volume revenue split tier calculation', () => {
    const tiers: HubVolumeTier[] = [
      { id: '1', minParcels: 1, maxParcels: 50, hubPercentage: 50, omorfiPercentage: 50 },
      { id: '2', minParcels: 51, maxParcels: 200, hubPercentage: 55, omorfiPercentage: 45 },
      { id: '3', minParcels: 201, maxParcels: 99999, hubPercentage: 60, omorfiPercentage: 40 },
    ];

    const getSplitForVolume = (volume: number) => {
      const match = tiers.find(t => volume >= t.minParcels && volume <= t.maxParcels);
      return match || tiers[0];
    };

    expect(getSplitForVolume(10).hubPercentage).toBe(50);
    expect(getSplitForVolume(75).hubPercentage).toBe(55);
    expect(getSplitForVolume(300).hubPercentage).toBe(60);
  });

  test('Hub base rate calculation per kilogram', () => {
    const hubBaseRatePerKg = 300;
    const weightKg = 3.5;
    const calculatedFee = weightKg * hubBaseRatePerKg;
    expect(calculatedFee).toBe(1050);
  });
});
