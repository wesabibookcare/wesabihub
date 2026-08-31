import { describe, it, expect } from 'bun:test';
import { dispatchEngine } from '../engines/DispatchEngine';
import { VALID_PUBLIC_ROLES, ROLES } from '../constants/roles';

describe('SendOmorfi Role Integration Suite', () => {
  it('includes DISPATCH_RIDER as an active public role for registration', () => {
    expect(VALID_PUBLIC_ROLES.includes('DISPATCH_RIDER')).toBe(true);
    const dispatchRole = ROLES.find(r => r.id === 'DISPATCH_RIDER');
    expect(dispatchRole).toBeDefined();
    expect(dispatchRole?.title).toBe('SendOmorfi');
  });

  it('calculates SendOmorfi payouts correctly based on transit mode multipliers', () => {
    const baseFare = 2000;
    const rates = {
      onFootMultiplier: 1.0,
      bicycleMultiplier: 1.25,
      otherVehiclesMultiplier: 1.6
    };

    const footPayout = dispatchEngine.calculatePayout(baseFare, 'On foot', rates);
    const bicyclePayout = dispatchEngine.calculatePayout(baseFare, 'Bicycle', rates);
    const vehiclePayout = dispatchEngine.calculatePayout(baseFare, 'Other Vehicles', rates);

    expect(footPayout).toBe(2000);
    expect(bicyclePayout).toBe(2500);
    expect(vehiclePayout).toBe(3200);
  });

  it('handles fallbacks gracefully when no pricing rates are provided', () => {
    const baseFare = 1000;
    const footPayout = dispatchEngine.calculatePayout(baseFare, 'On foot');
    const bicyclePayout = dispatchEngine.calculatePayout(baseFare, 'Bicycle');
    const vehiclePayout = dispatchEngine.calculatePayout(baseFare, 'Other Vehicles');

    expect(footPayout).toBe(1000);
    expect(bicyclePayout).toBe(1250);
    expect(vehiclePayout).toBe(1600);
  });
});
