import {
  Parcel,
  ParcelStatus,
  TrackingEvent,
  ParcelTransfer,
  CustodyRecord,
  User
} from '../types';
import { shipmentRepository } from './db/ShipmentRepository';
import { trackingRepository } from './db/TrackingRepository';
import { transferRepository } from './db/TransferRepository';
import { custodyRepository } from './db/CustodyRepository';
import { auditRepository } from './db/AuditRepository';
import { isValidStatusTransition } from './StatusValidator';
import { pricingEngine } from './PricingEngine';
import { paymentProtectionEngine } from './PaymentProtectionEngine';
import { paymentProtectionRepository } from './db/PaymentProtectionRepository';
import { notificationEngine } from '../engines/NotificationEngine';
import { timelineEngine } from '../engines/TimelineEngine';
import { getApiUrl } from '../lib/apiClient';

export class ParcelEngine {
  async createShipment(
    sender: User,
    data: Omit<Parcel, keyof import('../types').BaseEntity | 'shipmentId' | 'parcelId' | 'trackingNumber' | 'status' | 'protectionStatus' | 'pricing' | 'senderId'> & { fulfillmentMethod: 'HUB_PICKUP' | 'LOGISTICS_DELIVERY' },
    options: { serviceType: 'STANDARD' | 'EXPRESS' | 'SAME_DAY' }
  ): Promise<Parcel> {
    const isMerchant = sender.role === 'MERCHANT' || sender.roles?.includes('MERCHANT');
    const isAdmin = sender.role === 'SUPER_ADMIN' || sender.roles?.includes('SUPER_ADMIN');
    const isCustomer = sender.role === 'CUSTOMER' && !sender.roles?.includes('MERCHANT');

    if (isCustomer) {
      throw new Error('Customers are not permitted to create shipments. To send parcels, please apply for a Merchant account and complete verification.');
    }

    if (!isMerchant && !isAdmin) {
      throw new Error('Only verified Merchants or authorized Hub Points (on behalf of Merchants) can create shipments.');
    }

    if (isMerchant) {
      const isVerified = sender.verificationStatus?.kyc === true || sender.status === 'APPROVED' || sender.status === 'ACTIVE';
      if (!isVerified) {
        throw new Error('Merchant profile is not verified or active.');
      }
    }

    const shipmentId = `SHP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
    const parcelId = `PCL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
    const trackingNumber = `WSH-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;

    // Calculate Pricing via Secure Backend API
    const response = await fetch(getApiUrl('/api/calculate-price'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weight: data.weightKg,
        dimensions: data.dimensions,
        serviceType: options.serviceType,
        fulfillmentMethod: data.fulfillmentMethod,
        country: sender.country || 'Nigeria'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to calculate pricing and commission via backend engine');
    }

    const pricingData = await response.json();
    const { pricing, commissionRecordId } = pricingData;

    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomUUID();
    const expiryMinutes = 1440; // 24 hours default
    const qrExpiryMinutes = 60; // 1 hour default

    const parcel: Parcel = {
      id: parcelId,
      shipmentId,
      parcelId,
      trackingNumber,
      senderId: sender.uid,
      status: 'AWAITING_PAYMENT',
      protectionStatus: 'HELD',
      commissionRecordId,
      fulfillmentMethod: data.fulfillmentMethod,
      pickupPin: pin,
      pickupPinExpiry: new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString(),
      pickupPinAttempts: 0,
      pickupPinVerified: false,
      verificationToken: token,
      qrExpiry: new Date(Date.now() + qrExpiryMinutes * 60 * 1000).toISOString(),
      pricing: {
        baseFee: pricing.subtotal - pricing.tax, // Use subtotal as base for parcel record
        taxes: pricing.tax,
        commission: pricing.commissions.platform + pricing.commissions.hubPoint,
        total: pricing.total,
        currency: pricing.currency,
        transferDiscount: pricing.transferAdjustment
      },
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await shipmentRepository.create(parcelId, parcel);

    await this.addTrackingEvent(parcelId, 'AWAITING_PAYMENT', sender.uid, 'SYSTEM', 'Shipment created and awaiting payment');
    await auditRepository.logAction(sender.uid, 'CREATE_SHIPMENT', { parcelId, shipmentId }, parcelId);

    return parcel;
  }

  async updateStatus(
    parcelId: string,
    nextStatus: ParcelStatus,
    actorId: string,
    location: string,
    remarks: string,
    idToken?: string
  ): Promise<void> {
    const parcel = await shipmentRepository.getById(parcelId);
    if (!parcel) throw new Error('Parcel not found');

    if (!isValidStatusTransition(parcel.status, nextStatus)) {
      throw new Error(`Invalid status transition from ${parcel.status} to ${nextStatus}`);
    }

    await shipmentRepository.update(parcelId, {
      status: nextStatus,
      updatedAt: new Date().toISOString()
    });

    await this.addTrackingEvent(parcelId, nextStatus, actorId, location, remarks);
    await auditRepository.logAction(actorId, 'UPDATE_PARCEL_STATUS', { parcelId, from: parcel.status, to: nextStatus, remarks }, parcelId);

    // Let the merchant know when their shipment reaches a hub -- this was
    // previously claimed by the Point intake UI ("the merchant has been
    // notified") but no notification was actually ever sent.
    if (parcel.senderId && (nextStatus === 'RECEIVED_AT_ORIGIN' || nextStatus === 'ARRIVED_AT_DESTINATION')) {
      try {
        await notificationEngine.send(
          parcel.senderId,
          nextStatus === 'RECEIVED_AT_ORIGIN' ? 'Parcel Received at Hub' : 'Parcel Arrived at Destination',
          `Your shipment ${parcel.trackingNumber} has ${nextStatus === 'RECEIVED_AT_ORIGIN' ? 'been received at the origin hub' : 'arrived at the destination hub'} and is being processed.`,
          'INFO',
          undefined,
          'SHIPMENT'
        );
      } catch (notifErr) {
        console.error('Failed to notify sender of intake status:', notifErr);
      }
    }

    // If Hub Pickup, automatically transition from RECEIVED_AT_ORIGIN to READY_FOR_PICKUP
    if (nextStatus === 'RECEIVED_AT_ORIGIN' && parcel.fulfillmentMethod === 'HUB_PICKUP') {
      await shipmentRepository.update(parcelId, {
        status: 'READY_FOR_PICKUP',
        updatedAt: new Date().toISOString()
      });
      await this.addTrackingEvent(parcelId, 'READY_FOR_PICKUP', actorId, location, 'Hub Pickup: Parcel is stored on shelf and ready for recipient collection.');
      await auditRepository.logAction(actorId, 'UPDATE_PARCEL_STATUS', { parcelId, from: 'RECEIVED_AT_ORIGIN', to: 'READY_FOR_PICKUP', remarks: 'Hub Pickup automatic transition' }, parcelId);
    }

    // Payment Protection Lifecycle Hooks
    try {
      const pp = await paymentProtectionRepository.getByParcelId(parcelId);
      if (pp) {
        if (nextStatus === 'IN_TRANSIT') {
          await paymentProtectionEngine.markInTransit(pp.id, actorId);
        } else if (nextStatus === 'DELIVERED') {
          // Require recipient OTP verification before advancing SafePay to inspection
          if (parcel.pickupPinVerified) {
            await paymentProtectionEngine.triggerDelivery(pp.id, actorId);
          }
        }
      }
    } catch (ppErr) {
      console.error('Failed to trigger Payment Protection Engine hook:', ppErr);
    }

    // Secure Backend Points Awarding Hooks
    try {
      let activityKey = '';
      let reason = '';
      if (nextStatus === 'RECEIVED_AT_ORIGIN') {
        activityKey = 'parcel_acceptance';
        reason = `Successful parcel intake for parcel ${parcelId}`;
      } else if (nextStatus === 'IN_TRANSIT') {
        activityKey = 'parcel_handover';
        reason = `Successful parcel handover/dispatch for parcel ${parcelId}`;
      } else if (nextStatus === 'DELIVERED') {
        activityKey = 'customer_pickup';
        reason = `Successful customer pickup/release for parcel ${parcelId}`;
      }

      const hubId = parcel.destinationCenterId || parcel.originCenterId || location;
      if (activityKey && hubId && hubId !== 'SYSTEM') {
        if (!idToken) {
          console.warn('Skipping points-award hook: no auth token available for this action.');
        } else {
          fetch(getApiUrl('/api/points/award'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              hubId,
              activityKey,
              reason,
              metadata: { parcelId, actorId }
            })
          }).catch(err => console.error('Points awarding hook background request failed:', err));
        }
      }
    } catch (hookError) {
      console.error('Failed to trigger Points Engine hook:', hookError);
    }
  }

  async initiateTransfer(
    parcelId: string,
    from: { id: string; type: ParcelTransfer['fromType'] },
    to: { id: string; type: ParcelTransfer['toType'] },
    actorId: string
  ): Promise<string> {
    const transferId = `TRF-${Date.now()}`.toUpperCase();

    const transfer: ParcelTransfer = {
      id: crypto.randomUUID(),
      parcelId,
      transferId,
      fromId: from.id,
      toId: to.id,
      fromType: from.type,
      toType: to.type,
      status: 'PENDING',
      timestamp: new Date().toISOString()
    };

    await transferRepository.create(transfer.id, transfer);
    await auditRepository.logAction(actorId, 'INITIATE_TRANSFER', { parcelId, transferId }, parcelId);

    return transferId;
  }

  async completeTransfer(
    transferId: string,
    receivingUser: User,
    releasingUserId: string,
    locationId: string,
    custodyData: Omit<CustodyRecord, keyof import('../types').BaseEntity | 'parcelId' | 'receivingUserId' | 'releasingUserId' | 'locationId' | 'timestamp'>
  ): Promise<void> {
    const transfer = await transferRepository.getByTransferId(transferId);
    if (!transfer) throw new Error('Transfer record not found');

    const parcelId = transfer.parcelId;

    // Update transfer status
    await transferRepository.update(transfer.id, {
      status: 'COMPLETED',
      updatedAt: new Date().toISOString()
    });

    // Create Custody Record
    const custodyRecord: CustodyRecord = {
      id: crypto.randomUUID(),
      parcelId,
      receivingUserId: receivingUser.uid,
      releasingUserId,
      locationId,
      timestamp: new Date().toISOString(),
      ...custodyData
    };

    await custodyRepository.create(custodyRecord.id, custodyRecord);

    // Record tracking event
    await this.addTrackingEvent(
      parcelId,
      'TRANSFERRED_BETWEEN_POINTS',
      receivingUser.uid,
      locationId,
      `Transfer completed: ${transferId}. Condition: ${custodyData.condition}`
    );

    await auditRepository.logAction(receivingUser.uid, 'COMPLETE_TRANSFER', { parcelId, transferId }, parcelId);
  }

  async verifyMeasurements(
    parcelId: string,
    verifiedWeightKg: number,
    verifiedDimensions: { l: number; w: number; h: number },
    actorId: string,
    hubId: string,
    notes: string
  ): Promise<void> {
    const parcel = await shipmentRepository.getById(parcelId);
    if (!parcel) throw new Error('Parcel not found');

    const discrepancy = {
      originalWeight: parcel.weightKg,
      verifiedWeight: verifiedWeightKg,
      originalDimensions: parcel.dimensions || { l: 0, w: 0, h: 0 },
      verifiedDimensions: verifiedDimensions,
      notes: notes
    };

    const hasDiscrepancy = parcel.weightKg !== verifiedWeightKg ||
      (parcel.dimensions && (parcel.dimensions.l !== verifiedDimensions.l || parcel.dimensions.w !== verifiedDimensions.w || parcel.dimensions.h !== verifiedDimensions.h));

    await shipmentRepository.update(parcelId, {
      verifiedWeightKg,
      verifiedDimensions,
      measurementSource: 'HUB',
      measurementVerifiedBy: actorId,
      measurementVerifiedAt: new Date().toISOString(),
      measurementDiscrepancy: hasDiscrepancy ? discrepancy : undefined,
      updatedAt: new Date().toISOString()
    });

    await this.addTrackingEvent(
      parcelId,
      parcel.status,
      actorId,
      hubId,
      `Parcel measurements verified. Weight: ${verifiedWeightKg}kg. Discrepancy: ${hasDiscrepancy ? 'Yes' : 'No'}.`
    );
    await auditRepository.logAction(actorId, 'VERIFY_PARCEL_MEASUREMENTS', { parcelId, verifiedWeightKg, hasDiscrepancy }, parcelId);

    if (hasDiscrepancy) {
      // Recalculate price
      const newPricing = await pricingEngine.calculatePrice({
        country: 'Nigeria', // Should be dynamic
        weightKg: verifiedWeightKg,
        dimensions: verifiedDimensions,
        serviceType: parcel.deliveryMethod === 'express' ? 'EXPRESS' : 'STANDARD'
      });

      if (newPricing.total !== parcel.pricing.total) {
        // Trigger discrepancy management
        const updatedPricing = {
          ...parcel.pricing,
          total: newPricing.total,
          baseFee: newPricing.subtotal - newPricing.tax,
          taxes: newPricing.tax
        };
        await shipmentRepository.update(parcelId, {
          pricing: updatedPricing,
          updatedAt: new Date().toISOString()
        });

        // Notify user about discrepancy charge adjustment
        notificationEngine.sendFromTemplate(
          parcel.senderId,
          'approved', // Need a proper template for discrepancy
          { trackingNumber: parcel.trackingNumber },
          'Parcel Measurement Adjustment',
          `Your parcel ${parcel.trackingNumber} measurements were verified, leading to a pricing adjustment. New total: ₦${newPricing.total.toLocaleString()}.`,
          'WARNING',
          'SYSTEM'
        );
      }
    }
  }

  public async addTrackingEvent(
    parcelId: string,
    status: ParcelStatus,
    actorId: string,
    location: string,
    remarks: string
  ): Promise<void> {
    await timelineEngine.recordEvent({
      parcelId,
      status,
      eventType: 'STATUS_CHANGE',
      actorId,
      location,
      remarks
    });
  }

  async getTrackingHistory(parcelId: string, userRole: string = 'CUSTOMER'): Promise<TrackingEvent[]> {
    return timelineEngine.getTimelineForUser(parcelId, userRole);
  }

  async getCustodyChain(parcelId: string): Promise<CustodyRecord[]> {
    return custodyRepository.getByParcel(parcelId);
  }

  async listUserShipments(userId: string): Promise<Parcel[]> {
    return shipmentRepository.getBySender(userId);
  }
}

export const parcelEngine = new ParcelEngine();
