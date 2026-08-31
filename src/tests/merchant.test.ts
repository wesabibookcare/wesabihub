import { describe, test, expect } from 'bun:test';
import { workflowEngine } from '../engines/WorkflowEngine';
import { pricingEngine } from '../services/PricingEngine';

describe('Merchant & Delegated Merchant Booking Tests', () => {
  test('Prevents unverified merchants from creating shipments directly', async () => {
    const fakeUnverifiedUserId = 'unverified-merchant-uid';

    const result = await workflowEngine.runParcelCreationWorkflow(
      fakeUnverifiedUserId,
      {
        recipientInfo: { name: 'Test Recipient', phone: '+2348000000000' },
        originCenterId: 'hub-1',
        destinationCenterId: 'hub-2',
        weightKg: 1,
        estimatedValue: 5000
      },
      'WALLET'
    );

    expect(result.success).toBe(false);
  });

  test('Calculates price correctly based on weight and country rules', async () => {
    const price = await pricingEngine.calculatePrice({
      country: 'Nigeria',
      weightKg: 2,
      dimensions: { l: 10, w: 10, h: 10 },
      serviceType: 'STANDARD'
    });

    expect(price.total).toBeGreaterThan(0);
    expect(price.currency).toBe('NGN');
  });

  test('Rejects invalid parcel weight in workflow execution', async () => {
    const fakeUserId = 'some-user-id';

    const result = await workflowEngine.runParcelCreationWorkflow(
      fakeUserId,
      {
        recipientInfo: { name: 'Test Recipient', phone: '+2348000000000' },
        originCenterId: 'hub-1',
        destinationCenterId: 'hub-2',
        weightKg: -5,
        estimatedValue: 5000
      },
      'WALLET'
    );

    expect(result.success).toBe(false);
  });
});
