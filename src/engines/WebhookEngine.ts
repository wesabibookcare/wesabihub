
import { Request } from 'express';
import crypto from 'crypto';
import { auditEngine } from './AuditEngine';
import { paymentEngine } from './PaymentEngine';
import { monitoringEngine } from './MonitoringEngine';

/**
 * OmorfiHub Webhook Engine
 * Centralized handling, validation, idempotency, and routing for incoming webhooks.
 */
class WebhookEngine {
  private static instance: WebhookEngine;

  private constructor() {}

  public static getInstance(): WebhookEngine {
    if (!WebhookEngine.instance) {
      WebhookEngine.instance = new WebhookEngine();
    }
    return WebhookEngine.instance;
  }

  async processWebhook(req: Request, provider: 'PAYSTACK' | 'FLUTTERWAVE'): Promise<any> {
    try {
      const payload = req.body;
      const signature = req.headers['x-paystack-signature'] || req.headers['verif-hash'] || req.headers['x-flutterwave-signature'];

      // 1. Signature Validation
      this.validateSignature(req, provider, signature as string);

      // 2. Normalize and Deduplicate
      const event = this.normalizeEvent(payload, provider);
      if (!event) return { ignored: true };

      // 3. Process via authoritative business engine
      const result = await paymentEngine.handleWebhookEvent(event);

      await auditEngine.logEvent({
        userId: 'SYSTEM',
        action: 'WEBHOOK_PROCESSED_SUCCESS',
        details: { provider, event: event.event, reference: event.data.reference },
        result: 'SUCCESS'
      });

      return result;
    } catch (err: any) {
      // Critical: Track webhook failures in monitoring engine
      await monitoringEngine.captureError(err, 'WEBHOOK', 'HIGH', {
        provider,
        path: req.path,
        ip: req.ip
      });

      await auditEngine.logEvent({
        userId: 'SYSTEM',
        action: 'WEBHOOK_PROCESSED_FAILURE',
        details: { provider, error: err.message },
        result: 'FAILURE'
      });

      throw err;
    }
  }

  private validateSignature(req: Request, provider: 'PAYSTACK' | 'FLUTTERWAVE', signature: string) {
    // Implement validation logic
    if (provider === 'PAYSTACK') {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret) throw new Error('Paystack secret not configured');
        const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
        if (hash !== signature) throw new Error('Unauthorized Paystack signature');
    } else if (provider === 'FLUTTERWAVE') {
        const hash = process.env.FLUTTERWAVE_WEBHOOK_HASH;
        if (!hash) throw new Error('Flutterwave hash not configured');
        if (signature !== hash) throw new Error('Unauthorized Flutterwave signature');
    }
  }

  private normalizeEvent(payload: any, provider: 'PAYSTACK' | 'FLUTTERWAVE') {
    let eventName = payload.event;
    let txRef = "";
    let isSuccess = false;

    if (provider === 'PAYSTACK') {
        eventName = payload.event || "charge.success";
        isSuccess = eventName === "charge.success";
        if (payload.data) {
            txRef = payload.data.reference;
        }
    } else {
        eventName = payload.event || "charge.completed";
        isSuccess = payload.event === "charge.completed" && payload.data && payload.data.status === "successful";
        if (payload.data) {
            txRef = payload.data.tx_ref;
        }
    }

    if (!isSuccess || !txRef) return null;

    return { provider, event: eventName, data: { ...payload.data, reference: txRef } };
  }
}

export const webhookEngine = WebhookEngine.getInstance();
