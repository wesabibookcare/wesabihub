import { paymentProtectionRepository } from '../services/db/PaymentProtectionRepository';
import { where } from 'firebase/firestore';
import { settlementService } from '../services/SettlementService';
import { paymentProtectionEngine } from '../services/PaymentProtectionEngine';
import { walletRepository, transactionRepository } from '../services/db/FinancialRepository';
import { Wallet, Transaction, PaymentInitiationData, PaymentResponse } from '../types';
import { paymentGatewayService } from '../services/payments/PaymentGatewayService';
import { configurationEngine } from './ConfigurationEngine';
import { auditEngine } from './AuditEngine';
import { notificationEngine } from './NotificationEngine';
import { monitoringEngine } from './MonitoringEngine';
import { commissionRecordRepository } from '../services/db/CommissionRecordRepository';
import { platformPaymentRepository } from '../services/db/PlatformPaymentRepository';
import { paymentMethodRepository } from '../services/db/PaymentMethodRepository';

/**
 * OmorfiHub Payment & Wallet Engine
 * Authoritative source for payouts, settlements, wallets, and payment protection.
 */
class PaymentEngine {
  private static instance: PaymentEngine;

  private constructor() {}

  public static getInstance(): PaymentEngine {
    if (!PaymentEngine.instance) {
      PaymentEngine.instance = new PaymentEngine();
    }
    return PaymentEngine.instance;
  }

  /**
   * External Payment Gateway Integration
   */
  async initiateExternalPayment(data: PaymentInitiationData): Promise<PaymentResponse> {
    const paymentType = data.paymentType || data.metadata?.paymentType || 'GENERAL_PLATFORM_CHARGE';
    const userId = data.userId || data.metadata?.userId || 'SYSTEM';

    // 1. Get payment settings from ConfigurationEngine
    const config = await configurationEngine.getPaymentSettings();

    // Maintenance Mode check
    if (config.paymentMaintenanceMode) {
      throw new Error('Payment system is currently undergoing scheduled maintenance. Please try again later.');
    }

    // Payment Method Enforcement for normal platform payments
    const isSafePay = paymentType === 'SAFEPAY';
    const requestedMethod = data.paymentMethod || data.metadata?.paymentMethod || data.metadata?.method;

    if (!isSafePay) {
      const normMethod = String(requestedMethod || '').toUpperCase();
      if (normMethod.includes('CARD') || normMethod === 'CREDIT_CARD' || normMethod === 'DEBIT_CARD') {
        await auditEngine.logEvent({
          userId,
          action: 'CARD_PAYMENT_ATTEMPT_REJECTED',
          details: {
            paymentType,
            reference: data.reference,
            amount: data.amount,
            currency: data.currency,
            reason: 'Card payments are temporarily disabled for platform payments. Please use Bank Transfer.'
          },
          result: 'FAILURE'
        });
        throw new Error('Card payments are temporarily disabled for platform payments. Please use Bank Transfer.');
      }

      if (requestedMethod) {
        const isAllowed = await configurationEngine.isPaymentMethodAllowed(requestedMethod, paymentType);
        if (!isAllowed) {
          await auditEngine.logEvent({
            userId,
            action: 'PAYMENT_METHOD_REJECTED',
            details: { paymentType, reference: data.reference, requestedMethod },
            result: 'FAILURE'
          });
          throw new Error(`Selected payment method (${requestedMethod}) is currently disabled on the platform.`);
        }
      }
    }

    // 2. Determine provider and retry/fallback policy
    // SafePay strictly uses Flutterwave only
    let primaryProviderName = isSafePay ? 'FLUTTERWAVE' : (config.primaryPlatformProvider || 'PAYSTACK');

    const isProduction = process.env.NODE_ENV === 'production';
    const hasFlutterwaveKey = !!process.env.FLUTTERWAVE_SECRET_KEY;
    const hasPaystackKey = !!process.env.PAYSTACK_SECRET_KEY;

    if (isProduction) {
      if (isSafePay && !hasFlutterwaveKey) {
        throw new Error('SafePay service is currently unavailable. Provider configuration missing.');
      }
      if (!isSafePay && !hasPaystackKey && !hasFlutterwaveKey) {
        throw new Error('Payment service is currently unavailable. Provider configuration missing.');
      }
    } else if (!hasFlutterwaveKey && !hasPaystackKey) {
      const shipmentId = data.metadata?.shipmentId || '';
      const mockCheckoutUrl = `/api/payment-protection/mock-checkout?tx_ref=${encodeURIComponent(data.reference)}&amount=${encodeURIComponent(data.amount)}&shipmentId=${encodeURIComponent(shipmentId)}`;
      await auditEngine.logEvent({
        userId,
        action: 'PAYMENT_SANDBOX_MODE_USED',
        details: { reference: data.reference, paymentType, reason: 'No FLUTTERWAVE_SECRET_KEY or PAYSTACK_SECRET_KEY configured.' },
        result: 'SUCCESS'
      });
      return {
        reference: data.reference,
        status: 'PENDING',
        checkoutUrl: mockCheckoutUrl,
        provider: primaryProviderName || 'FLUTTERWAVE'
      };
    }

    // Fallback eligibility (SafePay is NEVER eligible for fallback)
    const fallbackAllowed = !isSafePay && config.enableFallback && config.allowedFallbackTypes.includes(paymentType);
    const backupProviderName = isSafePay ? '' : (primaryProviderName === 'PAYSTACK' ? 'FLUTTERWAVE' : 'PAYSTACK');

    const maxRetries = config.retryLimits;
    const timeoutSec = config.timeoutDuration;

    // 5. Audit log before contacting provider
    await auditEngine.logEvent({
      userId,
      action: 'PAYMENT_INITIATION_START',
      details: {
        paymentType,
        primaryProvider: primaryProviderName,
        amount: data.amount,
        currency: data.currency,
        reference: data.reference,
        fallbackAllowed,
        retryLimits: maxRetries,
        timeoutDuration: timeoutSec,
      },
      result: 'SUCCESS',
    });

    // 6. Notification before contacting provider
    try {
      await notificationEngine.send(
        userId,
        'Payment Initiated',
        `A payment of ${data.currency} ${data.amount} is being initiated via ${primaryProviderName}.`,
        'INFO',
        undefined,
        'PAYMENT'
      );
    } catch (e) {
      console.warn('Failed to send initiation notification', e);
    }

    let currentProviderName = primaryProviderName;
    let attempt = 0;
    let lastError: any = null;

    // Execution with optional retry and fallback
    while (attempt < maxRetries) {
      attempt++;
      try {
        const providerInstance = paymentGatewayService.getProviderByName(currentProviderName);

        // Log the selected provider details & retry count
        await auditEngine.logEvent({
          userId,
          action: 'PAYMENT_PROVIDER_CALL',
          details: {
            reference: data.reference,
            providerSelected: currentProviderName,
            attempt,
            maxRetries,
            isFallback: currentProviderName !== primaryProviderName,
            paymentType,
          },
          result: 'SUCCESS',
        });

        // Setup dynamic timeout for provider call
        const responsePromise = providerInstance.initiatePayment(data);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gateway timeout')), timeoutSec * 1000)
        );

        const response = await Promise.race([responsePromise, timeoutPromise]);

        // Audit success
        await auditEngine.logEvent({
          userId,
          action: 'PAYMENT_INITIATION_SUCCESS',
          details: {
            reference: data.reference,
            providerSelected: currentProviderName,
            response,
            attempt,
            paymentType,
          },
          result: 'SUCCESS',
        });

        return { ...response, provider: currentProviderName };

      } catch (error: any) {
        lastError = error;
        console.error(`Attempt ${attempt} on ${currentProviderName} failed:`, error);

        // Audit failure for this attempt
        await auditEngine.logEvent({
          userId,
          action: 'PAYMENT_ATTEMPT_FAILED',
          details: {
            reference: data.reference,
            providerSelected: currentProviderName,
            attempt,
            error: error?.message || 'Unknown error',
            paymentType,
          },
          result: 'FAILURE',
        });

        // Track operational monitoring metrics and trigger alerts if threshold breached
        await monitoringEngine.captureError(error, 'PAYMENT', attempt === maxRetries ? 'HIGH' : 'MEDIUM', {
          userId,
          reference: data.reference,
          provider: currentProviderName,
          attempt,
          paymentType
        });

        // If fallback is allowed and primary failed after retries, switch to backup
        if (attempt >= maxRetries && fallbackAllowed && currentProviderName === primaryProviderName && backupProviderName) {
          await auditEngine.logEvent({
            userId,
            action: 'PAYMENT_FALLBACK_TRIGGERED',
            details: {
              reference: data.reference,
              primaryProvider: primaryProviderName,
              fallbackProvider: backupProviderName,
              reason: error?.message || 'Primary provider failed',
              paymentType,
            },
            result: 'SUCCESS',
          });

          // Switch provider, reset attempt, and try backup
          currentProviderName = backupProviderName;
          attempt = 0;
          lastError = null;
          // Continue loop to try backup provider
          continue;
        }
      }
    }

    // If we get here, all attempts failed
    const finalErrorMessage = isSafePay
      ? `Payment failed. SafePay transactions on ${primaryProviderName} cannot failover. Please retry later.`
      : `Payment failed after multiple attempts. ${lastError?.message || 'Please try again.'}`;

    await auditEngine.logEvent({
      userId,
      action: 'PAYMENT_INITIATION_FAILED',
      details: {
        reference: data.reference,
        primaryProvider: primaryProviderName,
        fallbackUsed: currentProviderName !== primaryProviderName,
        retryCount: attempt,
        failureReason: lastError?.message || 'All attempts failed',
        paymentType,
      },
      result: 'FAILURE',
    });

    try {
      await notificationEngine.send(
        userId,
        'Payment Failed',
        finalErrorMessage,
        'ERROR',
        undefined,
        'PAYMENT'
      );
    } catch (e) {
      console.warn('Failed to send failure notification', e);
    }

    throw new Error(finalErrorMessage);
  }

  /**
   * Wallet Operations
   */
  async getWallet(userId: string): Promise<Wallet | null> {
    return await walletRepository.getByUserId(userId);
  }

  async getTransactions(walletId: string, limit?: number): Promise<Transaction[]> {
    return await transactionRepository.getByWallet(walletId, limit);
  }

  async getTransactionsByUserId(userId: string, limit?: number): Promise<Transaction[]> {
    const wallet = await this.getWallet(userId);
    if (!wallet) return [];
    return await this.getTransactions(wallet.id, limit);
  }

  async getProtectionRecordsByMerchant(merchantId: string): Promise<any[]> {
    return await paymentProtectionRepository.getByMerchantId(merchantId);
  }

  async getCommissionsByCentre(centreId: string): Promise<any[]> {

    return await commissionRecordRepository.getByCentre(centreId);
  }

  async payWithWallet(userId: string, amount: number, description: string, reference: string): Promise<Transaction> {
    const wallet = await this.getWallet(userId);
    if (!wallet) throw new Error('Wallet not found');
    if (wallet.balance < amount) throw new Error('Insufficient wallet balance');

    // Update wallet balance
    const newBalance = wallet.balance - amount;
    await walletRepository.update(wallet.id, {
      balance: newBalance,
      updatedAt: new Date().toISOString()
    });

    // Create transaction record
    const transactionId = `TX-${Date.now()}`;
    const transaction: Transaction = {
      id: transactionId,
      walletId: wallet.id,
      userId,
      amount,
      type: 'DEBIT',
      category: 'SHIPMENT_PAYMENT',
      status: 'COMPLETED',
      description,
      referenceId: reference,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await transactionRepository.create(transactionId, transaction);
    return transaction;
  }

  async creditWallet(userId: string, amount: number, description: string, reference: string, category: 'SHIPMENT_PAYMENT' | 'PAYOUT' | 'COMMISSION' | 'REFUND' | 'PROTECTION_RELEASE' | 'WALLET_FUNDING' | 'REGISTRATION_FEE' | 'PLATFORM_CHARGE' = 'WALLET_FUNDING'): Promise<Transaction> {
    // Check for existing transaction to enforce idempotency
    if (reference) {
      const existingTx = await transactionRepository.getById(reference).catch(() => null);
      if (existingTx && existingTx.status === 'COMPLETED') {
        return existingTx;
      }
    }

    let wallet = await this.getWallet(userId);

    // Auto-create wallet if it doesn't exist for the user
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
        merchantEarnings: 0,
        centreEarnings: 0,
        dispatchEarnings: 0,
        platformEarnings: 0,
        apiPartnerEarnings: 0,
        referralEarnings: 0,
        currency: 'NGN',
        status: 'ACTIVE',
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as Wallet;
      await walletRepository.create(walletId, wallet);
    }

    // Update wallet balance
    const newBalance = wallet.balance + amount;
    await walletRepository.update(wallet.id, {
      balance: newBalance,
      lastUpdated: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Create transaction record
    const transactionId = reference || `TX-${Date.now()}`;
    const transaction: Transaction = {
      id: transactionId,
      walletId: wallet.id,
      userId,
      amount,
      type: 'CREDIT',
      category,
      status: 'COMPLETED',
      description,
      referenceId: reference,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await transactionRepository.create(transactionId, transaction);
    return transaction;
  }

  /**
   * Orchestrate settlement processing
   */
  async processSettlement(userId: string): Promise<void> {
    await settlementService.processSettlement();
  }

  /**
   * Orchestrate withdrawal requesting
   */
  async requestWithdrawal(userId: string, amount: number): Promise<any> {
    return await settlementService.requestWithdrawal(userId, amount);
  }

  /**
   * Orchestrate withdrawal approval by administrator
   */
  async approveWithdrawal(withdrawalId: string, adminId: string): Promise<void> {
    await settlementService.approveWithdrawal(withdrawalId, adminId);
  }

  /**
   * Orchestrate withdrawal rejection by administrator
   */
  async rejectWithdrawal(withdrawalId: string, adminId: string, reason: string): Promise<void> {
    await settlementService.rejectWithdrawal(withdrawalId, adminId, reason);
  }

  /**
   * Authoritative Webhook Event Handler
   */
  async handleWebhookEvent(event: any): Promise<any> {
    const { provider, event: eventName, data } = event;
    const txRef = data.reference || data.tx_ref;

    // 1. Audit Receipt
    await auditEngine.logEvent({
      userId: 'SYSTEM_WEBHOOK',
      action: 'WEBHOOK_EVENT_RECEIVED',
      details: { provider, eventName, txRef, metadata: data },
      result: 'SUCCESS'
    });

    // 2. Route to Business Engine
    if (eventName === 'charge.success' || eventName === 'charge.completed') {
      // Check Payment Protection (SafePay)
      const isSafePay = await this.protection.handleSuccessfulPayment(txRef);
      if (isSafePay) return { processed: 'SafePay' };

      // Check Platform Payments (Wallet/Reg)
      return await this.handlePlatformPayment(txRef, data);
    }

    return { ignored: true };
  }

  async handlePlatformPayment(txRef: string, data: any): Promise<any> {

    const payment = await platformPaymentRepository.getById(txRef);
    if (!payment || payment.status === 'SUCCESS') return { ignored: true };

    // Amount & Currency Validation
    if (data && data.amount !== undefined) {
      const receivedAmountNaira = data.amount > 10000 && data.amount % 100 === 0 && payment.amount < 100000 ? data.amount / 100 : data.amount;
      if (Math.abs(Number(receivedAmountNaira) - Number(payment.amount)) > 0.01) {
        await auditEngine.logEvent({
          userId: payment.userId || 'SYSTEM',
          action: 'PLATFORM_PAYMENT_AMOUNT_MISMATCH_REJECTED',
          details: { txRef, expectedAmount: payment.amount, receivedAmount: receivedAmountNaira },
          result: 'FAILURE'
        });
        return { error: 'Amount mismatch', ignored: true };
      }
    }

    if (data && data.currency && data.currency !== 'NGN') {
      await auditEngine.logEvent({
        userId: payment.userId || 'SYSTEM',
        action: 'PLATFORM_PAYMENT_CURRENCY_MISMATCH_REJECTED',
        details: { txRef, expectedCurrency: 'NGN', receivedCurrency: data.currency },
        result: 'FAILURE'
      });
      return { error: 'Currency mismatch', ignored: true };
    }

    if (payment.type === 'WALLET_FUNDING') {
      await this.creditWallet(payment.userId, payment.amount, `Wallet Funding: ${txRef}`, txRef, 'WALLET_FUNDING');
    }

    await platformPaymentRepository.update(payment.id, {
        status: 'SUCCESS',
        updatedAt: new Date().toISOString()
    });

    return { processed: 'Platform' };
  }

  /**
   * Verification, Refund, and Release Methods
   */
  async verifyExternalPayment(reference: string, providerName?: string): Promise<any> {
    const isProduction = process.env.NODE_ENV === 'production';
    const hasFlutterwaveKey = !!process.env.FLUTTERWAVE_SECRET_KEY;
    const hasPaystackKey = !!process.env.PAYSTACK_SECRET_KEY;

    if (isProduction) {
      if (!hasFlutterwaveKey && !hasPaystackKey) {
        throw new Error('Payment verification failed: Provider credentials missing in production.');
      }
    } else if (!hasFlutterwaveKey && !hasPaystackKey) {
      return { reference, status: 'SUCCESS', rawResponse: { sandbox: true } };
    }

    let provider = providerName;

    if (!provider) {
      try {
        const records = await paymentProtectionRepository.getAll([
          where('flutterwaveRef', '==', reference)
        ]);
        if (records.length > 0 && records[0].provider) {
          provider = records[0].provider;
        }
      } catch (e) {
        console.warn('Failed to retrieve provider from payment protections, attempting auto-detection', e);
      }
    }

    if (!provider) {
      const config = await configurationEngine.getPaymentSettings();
      // If payment starts with WSH-TX, it's typically our generated SafePay reference
      provider = reference.startsWith('WSH-TX-')
        ? (config.primarySafePayProvider || 'FLUTTERWAVE')
        : (config.primaryPlatformProvider || 'PAYSTACK');
    }

    const providerInstance = paymentGatewayService.getProviderByName(provider);
    return await providerInstance.verifyPayment(reference);
  }

  /**
   * Refund Logistics Delivery Charge & Reverse OmorfiHub Logistics Margin
   */
  async refundLogisticsChargeWithMarginReversal(parcelId: string, deliveryCharge: number, wesabiLogisticsMargin: number, userId: string): Promise<any> {
    const providerRefundAmount = Math.max(0, deliveryCharge - wesabiLogisticsMargin);
    const totalRefundToUser = deliveryCharge; // Refund full charge to customer

    await auditEngine.logEvent({
      userId,
      action: 'LOGISTICS_MARGIN_REFUND_REVERSAL',
      details: {
        parcelId,
        deliveryCharge,
        refundedWesabiMargin: wesabiLogisticsMargin,
        providerRefundAmount,
        totalRefundToUser
      },
      result: 'SUCCESS'
    });

    return {
      success: true,
      totalRefundToUser,
      refundedWesabiMargin: wesabiLogisticsMargin,
      providerRefundAmount
    };
  }

  async refundExternalPayment(reference: string, amount: number, providerName?: string): Promise<any> {
    let provider = providerName;

    if (!provider) {
      try {
        const records = await paymentProtectionRepository.getAll([
          where('flutterwaveRef', '==', reference)
        ]);
        if (records.length > 0 && records[0].provider) {
          provider = records[0].provider;
        }
      } catch (e) {
        console.warn('Failed to retrieve provider for refund', e);
      }
    }

    if (!provider) {
      const config = await configurationEngine.getPaymentSettings();
      provider = reference.startsWith('WSH-TX-')
        ? (config.primarySafePayProvider || 'FLUTTERWAVE')
        : (config.primaryPlatformProvider || 'PAYSTACK');
    }

    const providerInstance = paymentGatewayService.getProviderByName(provider);
    if (providerInstance.refundPayment) {
      return await providerInstance.refundPayment(reference, amount);
    }
    throw new Error(`Refund not supported by provider: ${provider}`);
  }

  async releaseExternalPayment(reference: string, providerName?: string): Promise<any> {
    let provider = providerName;

    if (!provider) {
      try {
        const records = await paymentProtectionRepository.getAll([
          where('flutterwaveRef', '==', reference)
        ]);
        if (records.length > 0 && records[0].provider) {
          provider = records[0].provider;
        }
      } catch (e) {
        console.warn('Failed to retrieve provider for release', e);
      }
    }

    if (!provider) {
      const config = await configurationEngine.getPaymentSettings();
      provider = reference.startsWith('WSH-TX-')
        ? (config.primarySafePayProvider || 'FLUTTERWAVE')
        : (config.primaryPlatformProvider || 'PAYSTACK');
    }

    const providerInstance = paymentGatewayService.getProviderByName(provider);
    if (providerInstance.releasePayment) {
      return await providerInstance.releasePayment(reference);
    }
    throw new Error(`Release not supported by provider: ${provider}`);
  }

  /**
   * Protection and SafePay
   */
  get protection() {
    return paymentProtectionEngine;
  }

  async getAllCommissions(): Promise<any[]> {

    return await commissionRecordRepository.getAll();
  }
  async getPaymentMethods(userId: string): Promise<any[]> {

    return await paymentMethodRepository.getByUser(userId);
  }
  async addPaymentMethod(id: string, data: any): Promise<void> {

    await paymentMethodRepository.create(id, data);
  }
  async deletePaymentMethod(id: string): Promise<void> {

    await paymentMethodRepository.delete(id);
  }
  async setDefaultPaymentMethod(userId: string, methodId: string): Promise<void> {

    await paymentMethodRepository.setDefault(userId, methodId);
  }
  async createWallet(userId: string, data: any): Promise<void> {

    await walletRepository.create(userId, data);
  }
  async updateWallet(userId: string, data: any): Promise<void> {

    await walletRepository.update(userId, data);
  }
  async createTransaction(id: string, data: any): Promise<void> {

    await transactionRepository.create(id, data);
  }

}

export const paymentEngine = PaymentEngine.getInstance();
