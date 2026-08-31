import { describe, test, expect } from 'bun:test';
import { workflowEngine } from '../engines/WorkflowEngine';

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
});
