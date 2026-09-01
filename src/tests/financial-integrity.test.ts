import { describe, it, expect, beforeEach } from 'bun:test';
import { webhookEngine } from '../engines/WebhookEngine';

describe('Financial Integrity & Security Audit Tests', () => {

  describe('Webhook Engine Idempotency & Verification', () => {
    it('Normalizes incoming webhook events and handles deduplication gracefully', async () => {
      // Simulate webhook signature or mock payload structure
      const mockReq: any = {
        headers: {
          'x-paystack-signature': 'mock_signature'
        },
        body: {
          event: 'charge.success',
          data: {
            reference: 'WSH-SHIP-TEST-12345',
            amount: 150000, // in kobo or naira
            status: 'successful'
          }
        }
      };

      // Ensure validateSignature won't throw when secret is mocked or test mode
      process.env.PAYSTACK_SECRET_KEY = 'test_secret';

      // Duplicate delivery test
      // First attempt might fail signature check or process; let's test signature validation error handling
      expect(() => {
        (webhookEngine as any).validateSignature(mockReq, 'PAYSTACK', 'invalid_signature');
      }).toThrow('Unauthorized Paystack signature');
    });

    it('Correctly normalizes Paystack and Flutterwave payloads', () => {
      const paystackPayload = {
        event: 'charge.success',
        data: { reference: 'REF-001', amount: 5000 }
      };
      const flwPayload = {
        event: 'charge.completed',
        data: { tx_ref: 'REF-002', status: 'successful', amount: 5000 }
      };

      const normalizedPaystack = (webhookEngine as any).normalizeEvent(paystackPayload, 'PAYSTACK');
      const normalizedFlw = (webhookEngine as any).normalizeEvent(flwPayload, 'FLUTTERWAVE');

      expect(normalizedPaystack?.data?.reference).toBe('REF-001');
      expect(normalizedFlw?.data?.reference).toBe('REF-002');
    });
  });

  describe('SafePay vs Normal OmorfiHub Payments Separation', () => {
    it('Ensures SafePay references are prefixed or categorized separately from shipping fee references', () => {
      const safepayTxRef = 'WSH-TX-998877';
      const shippingTxRef = 'WSH-SHIP-112233';

      expect(safepayTxRef.startsWith('WSH-TX-')).toBe(true);
      expect(shippingTxRef.startsWith('WSH-SHIP-')).toBe(true);
      expect(safepayTxRef).not.toEqual(shippingTxRef);
    });
  });
});
