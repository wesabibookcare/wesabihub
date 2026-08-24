import { UserRole, User, Parcel, ParcelStatus, RegistrationPayload } from '../types';
import {
  auditEngine,
  notificationEngine,
  userEngine,
  parcelEngine,
  paymentEngine,
  riskEngine,
  intelligenceEngine,
  configurationEngine,
  complianceEngine,
  bulkIntakeEngine,
  merchantCustomerEngine
} from './index';
import { monitoringEngine } from './MonitoringEngine';
import { WOSResponse, createWOSResponse } from './types';

/**
 * OmorfiHub Workflow Engine (WOS Coordinator)
 * Orchestrates high-level business processes across multiple domains.
 */
class WorkflowEngine {
  private static instance: WorkflowEngine;

  private constructor() {}

  public static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine();
    }
    return WorkflowEngine.instance;
  }

  /**
   * Orchestrates the User Registration & Verification journey
   */
  async runRegistrationWorkflow(payload: RegistrationPayload): Promise<WOSResponse<User>> {
    const auditId = `AUDIT-${Date.now()}`;
    try {
      // 1. Validate Business Rules & Configuration
      const config = await configurationEngine.getGlobalSettings();
      if (config.maintenanceMode) {
        return createWOSResponse(false, 'Platform is currently under maintenance. Registration is disabled.');
      }

      // 2. Compliance Check (Optional: check if latest terms are agreed if payload includes it)

      // 3. Execute Registration logic via User Engine
      const user = await userEngine.registerUser(payload);

      // 4. Intelligence Event (Non-blocking)
      intelligenceEngine.processEvent('USER_REGISTRATION', { userId: user.id, role: user.role });

      // 5. Audit the entire workflow completion
      await auditEngine.logEvent({
        userId: user.id,
        action: 'WORKFLOW_REGISTRATION_COMPLETE',
        details: { role: user.role, status: user.status, auditId },
        result: 'SUCCESS'
      });

      // 6. Notify relevant parties
      await notificationEngine.sendFromTemplate(
        user.id,
        'approved', // Use existing template if available or generic
        { role: user.role },
        'Welcome to OmorfiHub! 🎉',
        `Your registration as a ${user.role} has been successful.`,
        'SUCCESS',
        'SYSTEM'
      );

      return createWOSResponse(true, 'Registration successful', user, { auditRef: auditId });
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during registration';

      await monitoringEngine.captureError(error, 'AUTH', 'HIGH', {
        userId: payload.uid,
        auditId,
        role: payload.role
      });

      await auditEngine.logEvent({
        userId: payload.uid,
        action: 'WORKFLOW_REGISTRATION_FAILED',
        details: { role: payload.role, error: errorMessage, auditId },
        result: 'FAILURE'
      });

      return createWOSResponse(false, errorMessage, undefined, { auditRef: auditId });
    }
  }

  /**
   * Orchestrates the Parcel Creation Workflow
   */
  async runParcelCreationWorkflow(userId: string, parcelData: Partial<Parcel>, paymentMethod: 'WALLET' | 'CARD' | 'BANK' | 'FLUTTERWAVE'): Promise<WOSResponse<Parcel>> {
    const auditId = `AUDIT-${Date.now()}`;
    let user: User | null = null;
    try {
      const methodUpper = String(paymentMethod || '').toUpperCase();
      if (methodUpper === 'CARD' || methodUpper === 'CREDIT_CARD' || methodUpper === 'DEBIT_CARD' || methodUpper.includes('CARD')) {
        await auditEngine.logEvent({
          userId,
          action: 'PARCEL_CREATION_CARD_PAYMENT_REJECTED',
          details: { userId, reason: 'Card payments are temporarily disabled for platform payments. Please pay via Wallet or Bank Transfer.' },
          result: 'FAILURE'
        });
        return createWOSResponse(false, 'Card payments are temporarily disabled for platform payments. Please pay via Wallet or Bank Transfer.');
      }
      // 1. Validate User & Permissions
      user = await userEngine.getUser(userId);
      if (!user) return createWOSResponse(false, 'User not found');

      const isCustomer = user.role === 'CUSTOMER' && (!user.roles || !user.roles.includes('MERCHANT'));
      const isLogistics = user.role === 'DRIVER' || user.role === 'LOGISTICS_COMPANY' || (user.role as string) === 'LOGISTICS_OWNER' || user.roles?.includes('DRIVER') || user.roles?.includes('LOGISTICS_COMPANY');

      if (isCustomer) {
        return createWOSResponse(false, 'Customers are not permitted to create shipments directly. To send parcels, please apply for a Merchant account and complete verification.');
      }

      if (isLogistics) {
        return createWOSResponse(false, 'Logistics companies and dispatch riders are not permitted to create shipments.');
      }

      let senderUser = user;
      const isHubOwner = user.role === 'CENTER_OWNER' || (user.role as string) === 'HUB_OWNER' || user.roles?.includes('CENTER_OWNER');
      const isHubStaff = user.role === 'CENTER_STAFF' || (user.role as string) === 'POINT_STAFF' || user.roles?.includes('CENTER_STAFF');
      const isHub = isHubOwner || isHubStaff;

      if (isHub) {
        if (isHubStaff) {
          const hasDelegatedPermission = user.delegatedPermissions?.canBookShipments === true || (user as any).canBookShipments === true;
          if (!hasDelegatedPermission) {
            return createWOSResponse(false, 'Hub Staff member has not been granted delegated permission by the Hub Owner to book shipments on behalf of merchants.');
          }
        }

        const merchantId = parcelData.senderId;
        if (!merchantId) {
          return createWOSResponse(false, 'Merchant senderId is required when a Hub creates a shipment on behalf of a merchant.');
        }
        const merchant = await userEngine.getUser(merchantId);
        if (!merchant) {
          return createWOSResponse(false, 'Merchant account not found.');
        }
        if (merchant.role !== 'MERCHANT' && !merchant.roles?.includes('MERCHANT')) {
          return createWOSResponse(false, 'Shipments can only be created on behalf of verified Merchants. Selected sender is not a Merchant.');
        }
        const isMerchantVerified = merchant.verificationStatus?.kyc === true || merchant.status === 'APPROVED' || merchant.status === 'ACTIVE';
        if (!isMerchantVerified) {
          return createWOSResponse(false, 'The designated Merchant profile is not verified or active.');
        }
        senderUser = merchant;
      } else {
        const isMerchant = user.role === 'MERCHANT' || user.roles?.includes('MERCHANT');
        const isAdminUser = user.role === 'SUPER_ADMIN' || user.roles?.includes('SUPER_ADMIN');

        if (!isMerchant && !isAdminUser) {
          return createWOSResponse(false, 'Only verified Merchants or authorized Hub Points (on behalf of Merchants) can create shipments.');
        }

        if (isMerchant) {
          const isMerchantVerified = user.verificationStatus?.kyc === true || user.status === 'APPROVED' || user.status === 'ACTIVE';
          if (!isMerchantVerified) {
            return createWOSResponse(false, 'Your merchant account must be verified before you can create a shipment.');
          }
        }
      }

      // 2. Risk Check
      const trustScore = await riskEngine.getTrustScore(userId);
      if (trustScore < 40) return createWOSResponse(false, 'Trust score too low to create parcel. Please complete profile verification.');

      // 3. Create Parcel via Logistics Engine (Awaiting Payment)
      const parcel = await parcelEngine.parcels.createShipment(senderUser, parcelData as any, { serviceType: (parcelData as any).deliveryMethod === 'express' ? 'EXPRESS' : 'STANDARD' });

      // 4. Handle Wallet Payment if applicable
      if (paymentMethod === 'WALLET') {
        try {
          // Charge the actual sender's wallet -- when a Hub creates a
          // shipment on behalf of a merchant, senderUser was reassigned to
          // that merchant above. Using the raw userId here (the hub staff
          // member who performed the action) would incorrectly charge the
          // hub staff's own personal wallet for a merchant's shipment.
          await paymentEngine.payWithWallet(senderUser.uid, parcel.pricing.total, `Payment for Shipment ${parcel.trackingNumber}`, parcel.id);
          // Update status after successful payment
          await parcelEngine.parcels.updateStatus(parcel.id, 'AWAITING_DROP_OFF', userId, 'SYSTEM', 'Payment completed via wallet.');
        } catch (walletErr) {
          return createWOSResponse(false, `Wallet Payment Failed: ${walletErr instanceof Error ? walletErr.message : 'Unknown error'}`);
        }
      } else if (paymentMethod === 'FLUTTERWAVE') {
        // Assume verified externally by webhook or frontend check before calling this
        await parcelEngine.parcels.updateStatus(parcel.id, 'AWAITING_DROP_OFF', userId, 'SYSTEM', 'Payment confirmed via Flutterwave.');
      }

      // 5. Intelligence & Audit
      intelligenceEngine.processEvent('PARCEL_CREATED', { parcelId: parcel.id, userId, paymentMethod });

      // Update Merchant Customer list automatically
      if (user.role === 'MERCHANT' || user.roles?.includes('MERCHANT')) {
        merchantCustomerEngine.recordCustomerFromShipment(userId, parcel).catch(e => console.error('Failed to auto-sync merchant customer:', e));
      } else if (parcel.senderId) {
        // Hub booking on behalf of merchant
        merchantCustomerEngine.recordCustomerFromShipment(parcel.senderId, parcel).catch(e => console.error('Failed to auto-sync merchant customer:', e));
      }

      await auditEngine.logEvent({
        userId,
        action: 'PARCEL_CREATION_SUCCESS',
        details: {
          actorUid: userId,
          actorRole: user.role,
          representedMerchantUid: senderUser.uid,
          hubUid: parcel.originCenterId,
          actingHubStaffUid: isHubStaff ? userId : undefined,
          shipmentId: parcel.shipmentId || parcel.id,
          parcelId: parcel.id,
          trackingNumber: parcel.trackingNumber,
          paymentMethod
        },
        result: 'SUCCESS'
      });

      // 6. Notify Hub about incoming parcel (Optional non-blocking)
      notificationEngine.sendOperationalAlert(
        'New Parcel Booked',
        `Parcel ${parcel.trackingNumber} is expected at hub ${parcel.originCenterId}`,
        'NORMAL'
      ).catch(e => console.error('Failed to send ops alert:', e));

      return createWOSResponse(true, 'Parcel created successfully', parcel, { auditRef: auditId });
    } catch (error: any) {
      await auditEngine.logEvent({
        userId,
        action: 'PARCEL_CREATION_FAILED',
        details: {
          actorUid: userId,
          actorRole: user?.role,
          representedMerchantUid: parcelData?.senderId,
          failureReason: error instanceof Error ? error.message : 'Failed to create parcel'
        },
        result: 'FAILURE'
      });
      await monitoringEngine.captureError(error, 'API', 'HIGH', {
        userId,
        auditId,
        parcelData
      });
      console.error('Workflow Engine Error (Parcel Creation):', error);
      return createWOSResponse(false, error instanceof Error ? error.message : 'Failed to create parcel');
    }
  }

  /**
   * Orchestrates Bulk Shipment Creation Workflow for Verified Merchants / Delegated Hub Points
   */
  async runBulkParcelCreationWorkflow(
    userId: string,
    parcelsData: Partial<Parcel>[],
    paymentMethod: 'WALLET' | 'CARD' | 'BANK' | 'FLUTTERWAVE'
  ): Promise<WOSResponse<{ batchId: string; parcels: Parcel[]; totalCount: number; totalCost: number }>> {
    const auditId = `AUDIT-BULK-${Date.now()}`;
    let user: User | null = null;
    try {
      const methodUpper = String(paymentMethod || '').toUpperCase();
      if (methodUpper === 'CARD' || methodUpper === 'CREDIT_CARD' || methodUpper === 'DEBIT_CARD' || methodUpper.includes('CARD')) {
        await auditEngine.logEvent({
          userId,
          action: 'BULK_PARCEL_CREATION_CARD_PAYMENT_REJECTED',
          details: { userId, reason: 'Card payments are temporarily disabled for platform payments. Please pay via Wallet or Bank Transfer.' },
          result: 'FAILURE'
        });
        return createWOSResponse(false, 'Card payments are temporarily disabled for platform payments. Please pay via Wallet or Bank Transfer.');
      }
      if (!parcelsData || parcelsData.length === 0) {
        return createWOSResponse(false, 'At least one parcel record is required for bulk creation.');
      }

      // 1. Validate User & Role Permissions
      user = await userEngine.getUser(userId);
      if (!user) return createWOSResponse(false, 'User not found');

      const isCustomer = user.role === 'CUSTOMER' && (!user.roles || !user.roles.includes('MERCHANT'));
      const isLogistics = user.role === 'DRIVER' || user.role === 'LOGISTICS_COMPANY' || (user.role as string) === 'LOGISTICS_OWNER' || user.roles?.includes('DRIVER') || user.roles?.includes('LOGISTICS_COMPANY');

      if (isCustomer) {
        return createWOSResponse(false, 'Customers are not permitted to create shipments directly. To send parcels, please apply for a Merchant account and complete verification.');
      }

      if (isLogistics) {
        return createWOSResponse(false, 'Logistics companies and dispatch riders are not permitted to create shipments.');
      }

      let senderUser = user;
      const isHubOwner = user.role === 'CENTER_OWNER' || (user.role as string) === 'HUB_OWNER' || user.roles?.includes('CENTER_OWNER');
      const isHubStaff = user.role === 'CENTER_STAFF' || (user.role as string) === 'POINT_STAFF' || user.roles?.includes('CENTER_STAFF');
      const isHub = isHubOwner || isHubStaff;

      if (isHub) {
        if (isHubStaff) {
          const hasDelegatedPermission = user.delegatedPermissions?.canBookShipments === true || (user as any).canBookShipments === true;
          if (!hasDelegatedPermission) {
            return createWOSResponse(false, 'Hub Staff member has not been granted delegated permission by the Hub Owner to book shipments on behalf of merchants.');
          }
        }

        const merchantId = parcelsData[0]?.senderId;
        if (!merchantId) {
          return createWOSResponse(false, 'Merchant senderId is required when a Hub creates shipments on behalf of a merchant.');
        }
        const merchant = await userEngine.getUser(merchantId);
        if (!merchant) {
          return createWOSResponse(false, 'Merchant account not found.');
        }
        if (merchant.role !== 'MERCHANT' && !merchant.roles?.includes('MERCHANT')) {
          return createWOSResponse(false, 'Shipments can only be created on behalf of verified Merchants.');
        }
        const isMerchantVerified = merchant.verificationStatus?.kyc === true || merchant.status === 'APPROVED' || merchant.status === 'ACTIVE';
        if (!isMerchantVerified) {
          return createWOSResponse(false, 'The designated Merchant profile is not verified or active.');
        }
        senderUser = merchant;
      } else {
        const isMerchant = user.role === 'MERCHANT' || user.roles?.includes('MERCHANT');
        const isAdminUser = user.role === 'SUPER_ADMIN' || user.roles?.includes('SUPER_ADMIN');

        if (!isMerchant && !isAdminUser) {
          return createWOSResponse(false, 'Only verified Merchants or authorized Hub Points (on behalf of Merchants) can create shipments.');
        }

        if (isMerchant) {
          const isMerchantVerified = user.verificationStatus?.kyc === true || user.status === 'APPROVED' || user.status === 'ACTIVE';
          if (!isMerchantVerified) {
            return createWOSResponse(false, 'Your merchant account must be verified before you can create bulk shipments.');
          }
        }
      }

      // 2. Risk Check
      const trustScore = await riskEngine.getTrustScore(userId);
      if (trustScore < 40) return createWOSResponse(false, 'Trust score too low to create bulk shipments. Please complete profile verification.');

      // 3. Create all child parcels
      const createdParcels: Parcel[] = [];
      const batchId = `BULK-${Date.now()}`;
      let totalCost = 0;

      for (const itemData of parcelsData) {
        const parcel = await parcelEngine.parcels.createShipment(
          senderUser,
          {
            ...itemData,
            fulfillmentMethod: itemData.fulfillmentMethod || 'HUB_PICKUP'
          } as any,
          { serviceType: itemData.deliveryMethod === 'express' ? 'EXPRESS' : 'STANDARD' }
        );
        createdParcels.push(parcel);
        totalCost += parcel.pricing.total;
      }

      // 4. Handle Payment
      if (paymentMethod === 'WALLET') {
        try {
          await paymentEngine.payWithWallet(userId, totalCost, `Bulk Shipment Batch Payment (${createdParcels.length} parcels)`, batchId);
          for (const p of createdParcels) {
            await parcelEngine.parcels.updateStatus(p.id, 'AWAITING_DROP_OFF', userId, 'SYSTEM', 'Bulk payment completed via wallet.');
          }
        } catch (walletErr) {
          return createWOSResponse(false, `Wallet Payment Failed: ${walletErr instanceof Error ? walletErr.message : 'Unknown error'}`);
        }
      } else if (paymentMethod === 'FLUTTERWAVE') {
        for (const p of createdParcels) {
          await parcelEngine.parcels.updateStatus(p.id, 'AWAITING_DROP_OFF', userId, 'SYSTEM', 'Bulk payment confirmed via Flutterwave.');
        }
      }

      // 5. Intelligence & Audit
      intelligenceEngine.processEvent('BULK_PARCEL_CREATED', { batchId, count: createdParcels.length, userId, totalCost });

      // Update Merchant Customer list automatically for each parcel in bulk
      const merchantUid = senderUser.uid;
      for (const p of createdParcels) {
        merchantCustomerEngine.recordCustomerFromShipment(merchantUid, p).catch(e => console.warn('Failed to sync bulk merchant customer:', e));
      }

      await auditEngine.logEvent({
        userId,
        action: 'BULK_PARCEL_CREATION_SUCCESS',
        details: {
          actorUid: userId,
          actorRole: user.role,
          representedMerchantUid: senderUser.uid,
          batchId,
          totalCount: createdParcels.length,
          totalCost,
          paymentMethod
        },
        result: 'SUCCESS'
      });

      return createWOSResponse(true, `Successfully created ${createdParcels.length} shipments in batch ${batchId}`, {
        batchId,
        parcels: createdParcels,
        totalCount: createdParcels.length,
        totalCost
      }, { auditRef: auditId });
    } catch (error: any) {
      await auditEngine.logEvent({
        userId,
        action: 'BULK_PARCEL_CREATION_FAILED',
        details: {
          actorUid: userId,
          actorRole: user?.role,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        result: 'FAILURE'
      });
      return createWOSResponse(false, error instanceof Error ? error.message : 'Failed to create bulk shipments');
    }
  }

  /**
   * Orchestrates the Dispute Resolution Workflow
   */
  async runDisputeWorkflow(disputeId: string, action: 'RESOLVE' | 'REJECT' | 'ESCALATE', actorId: string): Promise<WOSResponse> {
    try {
      // Logic for coordinating resolution, refund (FinanceEngine), and notifications
      await auditEngine.logEvent({
        userId: actorId,
        action: `DISPUTE_${action}`,
        details: { disputeId },
        result: 'SUCCESS'
      });

      return createWOSResponse(true, `Dispute ${action.toLowerCase()}d successfully`);
    } catch (error) {
      return createWOSResponse(false, 'Dispute workflow failed');
    }
  }

  /**
   * Orchestrates Bulk Intake Session Initialization
   */
  async startBulkIntakeWorkflow(
    actor: { id: string; role: string; name?: string; hubId?: string },
    hubId: string,
    merchantId: string,
    shipmentId: string
  ): Promise<WOSResponse> {
    try {
      // RBAC Check
      const allowedRoles = ['CENTER_STAFF', 'HUB_OWNER', 'POINT_ADMIN', 'POINT_STAFF', 'ADMIN', 'SUPER_ADMIN'];
      if (!allowedRoles.includes(actor.role)) {
        return createWOSResponse(false, `Role '${actor.role}' is not authorized to operate Hub Intake sessions.`);
      }

      if (!hubId) {
        return createWOSResponse(false, 'Target Hub ID is required to initiate bulk check-in.');
      }

      const session = await bulkIntakeEngine.startSession(
        hubId,
        merchantId,
        shipmentId,
        actor.id,
        actor.name,
        'Merchant'
      );

      return createWOSResponse(true, 'Bulk Intake Session initialized successfully', session);
    } catch (error: any) {
      console.error('Bulk Intake Workflow Start Error:', error);
      return createWOSResponse(false, error.message || 'Failed to start Bulk Intake Session');
    }
  }

  /**
   * Orchestrates Individual Parcel Scan within Bulk Intake Session
   */
  async processBulkParcelScanWorkflow(
    actor: { id: string; role: string },
    sessionId: string,
    parcelInput: string,
    condition: any = 'GOOD',
    notes?: string,
    evidenceUrl?: string
  ): Promise<WOSResponse> {
    try {
      const allowedRoles = ['CENTER_STAFF', 'HUB_OWNER', 'POINT_ADMIN', 'POINT_STAFF', 'ADMIN', 'SUPER_ADMIN'];
      if (!allowedRoles.includes(actor.role)) {
        return createWOSResponse(false, `Role '${actor.role}' is not authorized to scan parcels during Hub Intake.`);
      }

      const result = await bulkIntakeEngine.processParcelScan(
        sessionId,
        parcelInput,
        condition,
        actor.id,
        notes,
        evidenceUrl
      );

      return createWOSResponse(result.success, result.message, result);
    } catch (error: any) {
      console.error('Bulk Intake Scan Workflow Error:', error);
      return createWOSResponse(false, error.message || 'Error processing parcel intake scan');
    }
  }

  /**
   * Orchestrates Finalization of Bulk Intake Session
   */
  async finalizeBulkIntakeWorkflow(
    actor: { id: string; role: string },
    sessionId: string
  ): Promise<WOSResponse> {
    try {
      const allowedRoles = ['CENTER_STAFF', 'HUB_OWNER', 'POINT_ADMIN', 'POINT_STAFF', 'ADMIN', 'SUPER_ADMIN'];
      if (!allowedRoles.includes(actor.role)) {
        return createWOSResponse(false, `Role '${actor.role}' is not authorized to finalize Hub Intake sessions.`);
      }

      const summary = await bulkIntakeEngine.finalizeSession(sessionId, actor.id);
      return createWOSResponse(true, 'Bulk Intake Session completed successfully', summary);
    } catch (error: any) {
      console.error('Bulk Intake Finalize Workflow Error:', error);
      return createWOSResponse(false, error.message || 'Failed to finalize Bulk Intake session');
    }
  }
}

export const workflowEngine = WorkflowEngine.getInstance();
