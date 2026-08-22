import { PaymentProtectionRecord, PaymentProtectionStatus, Parcel, Wallet, Transaction } from '../types';
import { notificationService } from './NotificationService';
import { notificationEngine } from '../engines/NotificationEngine';
import { auditRepository } from './db/AuditRepository';
import { disputeRepository } from './db/DisputeRepository';
import { paymentProtectionRepository } from './db/PaymentProtectionRepository';
import { paymentProtectionSettingsRepository } from './db/PaymentProtectionSettingsRepository';
import { walletRepository, transactionRepository } from './db/FinancialRepository';
import { shipmentRepository } from './db/ShipmentRepository';
import crypto from 'crypto';

export class PaymentProtectionEngine {
  private async getOrCreateWallet(userId: string): Promise<Wallet> {
    let wallet = await walletRepository.getByUserId(userId);
    if (!wallet) {
      const walletId = `W-${userId}`;
      wallet = {
        id: walletId,
        uid: walletId,
        userId,
        balance: 0,
        pendingBalance: 0,
        SafePayBalance: 0,
        totalEarned: 0,
        currency: 'NGN',
        status: 'ACTIVE',
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as Wallet;
      await walletRepository.create(walletId, wallet);
    }
    return wallet;
  }

  async handleSuccessfulPayment(txRef: string): Promise<boolean> {
    const records = await paymentProtectionRepository.getAll([
      { field: 'flutterwaveRef', op: '==', value: txRef }
    ] as any);
    if (records.length === 0) return false;

    const doc = records[0];
    if (doc.status !== 'FUNDS_SECURED') {
        await paymentProtectionRepository.update(doc.id, {
            status: 'FUNDS_SECURED',
            updatedAt: new Date().toISOString(),
            webhookReceived: true,
        });

        await shipmentRepository.update(doc.shipmentId, {
            status: 'PAYMENT_CONFIRMED',
            updatedAt: new Date().toISOString()
        });

        const txId = `TX-${Date.now()}`;
        await transactionRepository.create(txId, {
            id: txId,
            walletId: doc.merchantId,
            userId: doc.merchantId,
            amount: doc.amount,
            type: 'CREDIT',
            category: 'SHIPMENT_PAYMENT',
            status: 'PENDING',
            referenceId: doc.shipmentId,
            description: `Webhook: Secure funds held for tracking #${doc.trackingNumber}`,
            timestamp: new Date().toISOString()
        } as Transaction);

        await auditRepository.logAction('SYSTEM_WEBHOOK', 'PAYMENT_PROTECTION_WEBHOOK_RECEIVED', { txRef, status: 'FUNDS_SECURED', amount: doc.amount, shipmentId: doc.shipmentId }, doc.id);

        await notificationEngine.sendWebhookNotification(doc.merchantId, 'payment.secured', {
            txRef,
            status: 'FUNDS_SECURED',
            amount: doc.amount,
            shipmentId: doc.shipmentId
        });
        return true;
    }
    return false;
  }

  async initiatePaymentProtection(parcel: Parcel, customerId: string, merchantId: string, amount: number): Promise<PaymentProtectionRecord> {
    const settings = await paymentProtectionSettingsRepository.getSettings();
    const ppId = `PP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();

    const pp: PaymentProtectionRecord = {
      id: ppId,
      paymentProtectionId: ppId,
      shipmentId: parcel.shipmentId,
      parcelId: parcel.parcelId,
      trackingNumber: parcel.trackingNumber,
      customerId,
      merchantId,
      amount,
      currency: parcel.pricing.currency || 'NGN',
      status: 'PENDING_PAYMENT',
      inspectionPeriodHours: settings.defaultInspectionPeriodHours,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await paymentProtectionRepository.create(pp.id, pp);
    await auditRepository.logAction('SYSTEM', 'CREATE_PAYMENT_PROTECTION', { ppId, shipmentId: parcel.shipmentId }, ppId);

    return pp;
  }

  async securePayment(ppId: string, actorId: string): Promise<void> {
    const pp = await paymentProtectionRepository.getById(ppId);
    if (!pp) throw new Error('Payment Protection record not found');

    // Perform atomic state shift
    await walletRepository.transaction(async () => {
      await paymentProtectionRepository.update(pp.id, {
        status: 'FUNDS_SECURED'
      });

      // Secure funds in Merchant's SafePay Balance
      const merchantWallet = await this.getOrCreateWallet(pp.merchantId);
      const currentSafePay = merchantWallet.SafePayBalance || 0;
      await walletRepository.update(merchantWallet.id, {
        SafePayBalance: currentSafePay + pp.amount,
        lastUpdated: new Date().toISOString()
      });

      // Create transaction for audit trail
      const transactionId = `TX-SFP-${Date.now()}`;
      const transaction: Transaction = {
        id: transactionId,
        walletId: merchantWallet.id,
        userId: pp.merchantId,
        amount: pp.amount,
        type: 'CREDIT',
        category: 'SHIPMENT_PAYMENT',
        status: 'PENDING', // Pending until release
        referenceId: ppId,
        description: `Funds secured in SafePay for shipment ${pp.shipmentId}`,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await transactionRepository.create(transactionId, transaction);
    });

    await auditRepository.logAction(actorId, 'SECURE_PROTECTED_PAYMENT', { ppId, amount: pp.amount }, ppId);

    await notificationService.send(pp.merchantId, 'Protected Payment Funds Secured', `Payment of ${pp.currency} ${pp.amount} for shipment ${pp.shipmentId} has been secured under Payment Protection.`, 'INFO', undefined, 'PAYMENT');

    // Notify Customer
    await notificationService.send(pp.customerId, 'Payment Protection Secured', `Your payment for shipment ${pp.shipmentId} is now held securely under Payment Protection.`, 'INFO', undefined, 'PAYMENT');
  }

  async markInTransit(ppId: string, actorId: string): Promise<void> {
    const pp = await paymentProtectionRepository.getById(ppId);
    if (!pp) throw new Error('Payment Protection record not found');

    await paymentProtectionRepository.update(pp.id, {
      status: 'SHIPMENT_IN_TRANSIT'
    });

    await auditRepository.logAction(actorId, 'PAYMENT_PROTECTION_IN_TRANSIT', { ppId }, ppId);
  }

  async triggerDelivery(ppId: string, actorId: string): Promise<void> {
    const pp = await paymentProtectionRepository.getById(ppId);
    if (!pp) throw new Error('Payment Protection record not found');

    const settings = await paymentProtectionSettingsRepository.getSettings();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + settings.defaultInspectionPeriodHours * 60 * 60 * 1000);

    await paymentProtectionRepository.update(pp.id, {
      status: 'DELIVERED_AWAITING_CONFIRMATION',
      inspectionStartedAt: now.toISOString(),
      inspectionExpiresAt: expiresAt.toISOString()
    });

    await auditRepository.logAction(actorId, 'PAYMENT_PROTECTION_DELIVERY_TRIGGERED', { ppId, expiresAt: expiresAt.toISOString() }, ppId);

    await notificationService.send(pp.customerId, 'Shipment Delivered - Action Required', `Please inspect your item for shipment ${pp.shipmentId} and confirm release of your secure payment.`, 'WARNING', undefined, 'PAYMENT');
  }

  async releasePayment(ppId: string, actorId: string): Promise<void> {
    const pp = await paymentProtectionRepository.getById(ppId);
    if (!pp) throw new Error('Payment Protection record not found');

    if (pp.status === 'DISPUTE_OPENED' || pp.status === 'UNDER_INVESTIGATION') {
      throw new Error('Cannot release funds while a dispute is active.');
    }

    await walletRepository.transaction(async () => {
      await paymentProtectionRepository.update(pp.id, {
        status: 'PAYMENT_RELEASED',
        paymentReleasedAt: new Date().toISOString(),
        releasedBy: actorId
      });

      // Transfer from SafePay Balance to Pending Balance (waiting for 24h settlement delay)
      const merchantWallet = await this.getOrCreateWallet(pp.merchantId);
      const currentSafePay = merchantWallet.SafePayBalance || 0;
      const currentPending = merchantWallet.pendingBalance || 0;

      await walletRepository.update(merchantWallet.id, {
        SafePayBalance: Math.max(0, currentSafePay - pp.amount),
        pendingBalance: currentPending + pp.amount,
        lastUpdated: new Date().toISOString()
      });

      // Create PROTECTION_RELEASE credit transaction in PENDING state (settled by SettlementService)
      const transactionId = `TX-REL-${Date.now()}`;
      const transaction: Transaction = {
        id: transactionId,
        walletId: merchantWallet.id,
        userId: pp.merchantId,
        amount: pp.amount,
        type: 'CREDIT',
        category: 'PROTECTION_RELEASE',
        status: 'PENDING',
        referenceId: ppId,
        description: `Funds released from SafePay for shipment ${pp.shipmentId}`,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await transactionRepository.create(transactionId, transaction);
    });

    await auditRepository.logAction(actorId, 'PAYMENT_PROTECTION_RELEASED', { ppId }, ppId);

    await notificationService.send(pp.merchantId, 'Protected Payment Released', `Funds of ${pp.currency} ${pp.amount} for shipment ${pp.shipmentId} have been released to your wallet.`, 'SUCCESS', undefined, 'PAYMENT');

    await notificationService.send(pp.customerId, 'Payment Protection Released', `Your secure payment for shipment ${pp.shipmentId} has been released to the merchant.`, 'SUCCESS', undefined, 'PAYMENT');
  }

  async adminReleasePayment(ppId: string, actorId: string): Promise<void> {
    const pp = await paymentProtectionRepository.getById(ppId);
    if (!pp) throw new Error('Payment Protection record not found');

    await walletRepository.transaction(async () => {
      await paymentProtectionRepository.update(pp.id, {
        status: 'PAYMENT_RELEASED',
        paymentReleasedAt: new Date().toISOString(),
        releasedBy: actorId
      });

      // Transfer from SafePay to Pending balance
      const merchantWallet = await this.getOrCreateWallet(pp.merchantId);
      const currentSafePay = merchantWallet.SafePayBalance || 0;
      const currentPending = merchantWallet.pendingBalance || 0;

      await walletRepository.update(merchantWallet.id, {
        SafePayBalance: Math.max(0, currentSafePay - pp.amount),
        pendingBalance: currentPending + pp.amount,
        lastUpdated: new Date().toISOString()
      });

      const transactionId = `TX-REL-ADM-${Date.now()}`;
      const transaction: Transaction = {
        id: transactionId,
        walletId: merchantWallet.id,
        userId: pp.merchantId,
        amount: pp.amount,
        type: 'CREDIT',
        category: 'PROTECTION_RELEASE',
        status: 'PENDING',
        referenceId: ppId,
        description: `Dispute resolved: Funds released from SafePay by Admin for shipment ${pp.shipmentId}`,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await transactionRepository.create(transactionId, transaction);
    });

    await auditRepository.logAction(actorId, 'PAYMENT_PROTECTION_RELEASED_BY_ADMIN', { ppId, amount: pp.amount }, ppId);

    await notificationService.send(pp.merchantId, 'Secure Payment Dispute Resolved - Released', `Following dispute resolution, funds of ${pp.currency} ${pp.amount} for shipment ${pp.shipmentId} have been released to your wallet by the Dispute Administrator.`, 'SUCCESS', undefined, 'PAYMENT');

    await notificationService.send(pp.customerId, 'Dispute Resolved', `Your disputed payment of ${pp.currency} ${pp.amount} for shipment ${pp.shipmentId} has been released to the merchant.`, 'INFO', undefined, 'PAYMENT');
  }

  async adminRefundPayment(ppId: string, actorId: string): Promise<void> {
    const pp = await paymentProtectionRepository.getById(ppId);
    if (!pp) throw new Error('Payment Protection record not found');

    await walletRepository.transaction(async () => {
      await paymentProtectionRepository.update(pp.id, {
        status: 'REFUND_APPROVED',
        paymentReleasedAt: new Date().toISOString(),
        releasedBy: actorId,
        refundAmount: pp.amount
      });

      // Deduct from merchant's SafePay Balance
      const merchantWallet = await this.getOrCreateWallet(pp.merchantId);
      const currentSafePay = merchantWallet.SafePayBalance || 0;
      await walletRepository.update(merchantWallet.id, {
        SafePayBalance: Math.max(0, currentSafePay - pp.amount),
        lastUpdated: new Date().toISOString()
      });

      // Credit Customer's Available Balance immediately
      const customerWallet = await this.getOrCreateWallet(pp.customerId);
      const currentBalance = customerWallet.balance || 0;
      await walletRepository.update(customerWallet.id, {
        balance: currentBalance + pp.amount,
        lastUpdated: new Date().toISOString()
      });

      // Create REFUND credit transaction for the customer (COMPLETED)
      const transactionId = `TX-REF-${Date.now()}`;
      const transaction: Transaction = {
        id: transactionId,
        walletId: customerWallet.id,
        userId: pp.customerId,
        amount: pp.amount,
        type: 'CREDIT',
        category: 'REFUND',
        status: 'COMPLETED',
        referenceId: ppId,
        description: `Refund for disputed shipment ${pp.shipmentId} approved by Admin`,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await transactionRepository.create(transactionId, transaction);
    });

    await auditRepository.logAction(actorId, 'PAYMENT_PROTECTION_REFUNDED_BY_ADMIN', { ppId, amount: pp.amount }, ppId);

    await notificationService.send(pp.customerId, 'Secure Payment Refund Approved', `Your disputed payment of ${pp.currency} ${pp.amount} for shipment ${pp.shipmentId} has been refunded to your wallet.`, 'SUCCESS', undefined, 'PAYMENT');

    await notificationService.send(pp.merchantId, 'Dispute Resolved - Refunded', `The dispute on shipment ${pp.shipmentId} has been resolved. The protected payment has been refunded to the customer.`, 'WARNING', undefined, 'PAYMENT');
  }

  async adminPartialRefundPayment(ppId: string, buyerAmount: number, merchantAmount: number, actorId: string): Promise<void> {
    const pp = await paymentProtectionRepository.getById(ppId);
    if (!pp) throw new Error('Payment Protection record not found');

    await walletRepository.transaction(async () => {
      await paymentProtectionRepository.update(pp.id, {
        status: 'PARTIAL_REFUND_APPROVED',
        paymentReleasedAt: new Date().toISOString(),
        releasedBy: actorId,
        refundAmount: buyerAmount,
        metadata: {
          ...pp.metadata,
          partialSplit: { buyerAmount, merchantAmount }
        }
      });

      // Deduct total amount from merchant's SafePay
      const merchantWallet = await this.getOrCreateWallet(pp.merchantId);
      const currentSafePay = merchantWallet.SafePayBalance || 0;
      const currentPending = merchantWallet.pendingBalance || 0;

      await walletRepository.update(merchantWallet.id, {
        SafePayBalance: Math.max(0, currentSafePay - pp.amount),
        pendingBalance: currentPending + merchantAmount, // merchant's portion goes to pending
        lastUpdated: new Date().toISOString()
      });

      // Credit buyer's available balance immediately
      const customerWallet = await this.getOrCreateWallet(pp.customerId);
      const currentBuyerBal = customerWallet.balance || 0;
      await walletRepository.update(customerWallet.id, {
        balance: currentBuyerBal + buyerAmount,
        lastUpdated: new Date().toISOString()
      });

      // Create REFUND credit transaction for Customer
      const buyerTxId = `TX-REF-PRT-${Date.now()}`;
      const buyerTx: Transaction = {
        id: buyerTxId,
        walletId: customerWallet.id,
        userId: pp.customerId,
        amount: buyerAmount,
        type: 'CREDIT',
        category: 'REFUND',
        status: 'COMPLETED',
        referenceId: ppId,
        description: `Partial refund for disputed shipment ${pp.shipmentId} approved by Admin`,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await transactionRepository.create(buyerTxId, buyerTx);

      // Create PROTECTION_RELEASE credit transaction for Merchant
      const merchantTxId = `TX-REL-PRT-${Date.now()}`;
      const merchantTx: Transaction = {
        id: merchantTxId,
        walletId: merchantWallet.id,
        userId: pp.merchantId,
        amount: merchantAmount,
        type: 'CREDIT',
        category: 'PROTECTION_RELEASE',
        status: 'PENDING',
        referenceId: ppId,
        description: `Partial release from dispute for shipment ${pp.shipmentId} approved by Admin`,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await transactionRepository.create(merchantTxId, merchantTx);
    });

    await auditRepository.logAction(actorId, 'PAYMENT_PROTECTION_PARTIAL_REFUND_BY_ADMIN', { ppId, buyerAmount, merchantAmount }, ppId);

    await notificationService.send(pp.customerId, 'Partial Refund Approved', `The dispute has been resolved with a partial split. ${pp.currency} ${buyerAmount} has been refunded to your wallet.`, 'SUCCESS', undefined, 'PAYMENT');

    await notificationService.send(pp.merchantId, 'Partial Payout Released', `The dispute has been resolved with a partial split. ${pp.currency} ${merchantAmount} has been paid to your wallet.`, 'SUCCESS', undefined, 'PAYMENT');
  }

  async requestInspectionExtension(ppId: string, actorId: string): Promise<void> {
    const pp = await paymentProtectionRepository.getById(ppId);
    if (!pp) throw new Error('Payment Protection record not found');

    const settings = await paymentProtectionSettingsRepository.getSettings();
    if (!settings.allowInspectionExtension) {
      throw new Error('Inspection extensions are disabled by platform policy.');
    }

    if (!pp.inspectionExpiresAt) {
      throw new Error('No active inspection period.');
    }

    const expiresAt = new Date(pp.inspectionExpiresAt);
    const extendedExpiresAt = new Date(expiresAt.getTime() + settings.maxExtensionHours * 60 * 60 * 1000);

    await paymentProtectionRepository.update(pp.id, {
      inspectionExpiresAt: extendedExpiresAt.toISOString()
    });

    await auditRepository.logAction(actorId, 'PAYMENT_PROTECTION_INSPECTION_EXTENDED', { ppId, extendedExpiresAt: extendedExpiresAt.toISOString() }, ppId);

    await notificationService.send(pp.merchantId, 'Inspection Period Extended', `The buyer requested more time to inspect shipment ${pp.shipmentId}. New deadline: ${extendedExpiresAt.toLocaleString()}`, 'INFO', undefined, 'PAYMENT');
  }

  async reportIssue(ppId: string, actorId: string, reason: string, details: string, conversationId: string): Promise<void> {
    const pp = await paymentProtectionRepository.getById(ppId);
    if (!pp) throw new Error('Payment Protection record not found');

    // Create Dispute
    const disputeId = `DSP-${Date.now()}`;
    await disputeRepository.create(disputeId, {
      id: disputeId,
      conversationId,
      shipmentId: pp.shipmentId,
      parcelId: pp.parcelId,
      trackingNumber: pp.trackingNumber,
      initiatorId: actorId,
      initiatorRole: 'CUSTOMER',
      reason,
      details,
      status: 'OPEN',
      evidence: {
        conversationSnapshot: []
      },
      createdAt: new Date().toISOString()
    });

    await paymentProtectionRepository.update(pp.id, {
      status: 'DISPUTE_OPENED',
      disputeId
    });

    await auditRepository.logAction(actorId, 'PAYMENT_PROTECTION_DISPUTE_OPENED', { ppId, disputeId }, ppId);

    await notificationService.send(pp.merchantId, 'Dispute Opened', `A dispute has been opened for shipment ${pp.shipmentId}. Protected payment funds are frozen.`, 'ERROR', undefined, 'PAYMENT');
  }

  /**
   * Records that a required SafePay evidence video (seller testing/packing,
   * or buyer unboxing/inspection) has been captured, storing it on the
   * protection record itself so release/dispute gating can check for it
   * directly instead of having to search chat messages.
   */
  async recordEvidenceVideo(
    ppId: string,
    role: 'SELLER' | 'BUYER',
    url: string,
    durationSeconds: number,
    actorId: string
  ): Promise<void> {
    const pp = await paymentProtectionRepository.getById(ppId);
    if (!pp) throw new Error('Payment Protection record not found');

    const key = role === 'SELLER' ? 'sellerEvidenceVideo' : 'buyerEvidenceVideo';
    await paymentProtectionRepository.update(pp.id, {
      metadata: {
        ...pp.metadata,
        [key]: {
          url,
          durationSeconds,
          recordedAt: new Date().toISOString()
        }
      }
    });

    await auditRepository.logAction(actorId, 'SAFEPAY_EVIDENCE_VIDEO_RECORDED', { ppId, role, durationSeconds }, ppId);
  }
}

export const paymentProtectionEngine = new PaymentProtectionEngine();
