import { disputeRepository } from '../services/db/DisputeRepository';
import { Dispute } from '../types';
import { paymentProtectionRepository } from '../services/db/PaymentProtectionRepository';
import { auditEngine } from './AuditEngine';
import { notificationRepository } from '../services/db/NotificationRepository';
import { orderBy, limit } from 'firebase/firestore';

class DisputeEngine {
  private static instance: DisputeEngine;

  private constructor() {}

  public static getInstance(): DisputeEngine {
    if (!DisputeEngine.instance) {
      DisputeEngine.instance = new DisputeEngine();
    }
    return DisputeEngine.instance;
  }

  subscribeToDisputes(callback: (disputes: Dispute[]) => void) {
    return disputeRepository.subscribeToQuery([], callback);
  }

  async getAllDisputes(): Promise<Dispute[]> {
    return disputeRepository.getAll();
  }

  async resolveDispute(disputeId: string, resolution: any, adminId: string) {
    await disputeRepository.update(disputeId, {
      status: 'RESOLVED',
      resolution: resolution.resolutionNotes,
      updatedAt: new Date().toISOString()
    });

    // In a real flow, update payment protection and notify
    await auditEngine.logEvent({ userId: adminId, action: 'DISPUTE_RESOLVED' as any, details: resolution, targetId: disputeId, result: 'SUCCESS' });
  }

  async takeAction(dispute: Dispute, actionType: string, details: any, adminId: string) {
    if (actionType === 'REQUEST_INFO') {
      await disputeRepository.update(dispute.id, {
        status: 'ESCALATED',
        updatedAt: new Date().toISOString()
      });
      await notificationRepository.create(`notif-${Date.now()}`, {
        id: `notif-${Date.now()}`,
        userId: dispute.merchantId || (dispute as any).customerId,
        title: 'Information Requested',
        message: `Admin requested info for dispute ${dispute.id}`,
        type: 'SYSTEM',
        isRead: false,
        timestamp: new Date().toISOString()
      } as any);
      await auditEngine.logEvent({ userId: adminId, action: 'REQUEST_INFO' as any, details, targetId: dispute.id, result: 'SUCCESS' });
    }
    else if (actionType === 'REFUND_CUSTOMER') {
      await this.resolveDispute(dispute.id, { decisionType: 'REFUND_CUSTOMER', resolutionNotes: details.notes }, adminId);
    }
    else if (actionType === 'RELEASE_FUNDS') {
      await this.resolveDispute(dispute.id, { decisionType: 'RELEASE_TO_MERCHANT', resolutionNotes: details.notes }, adminId);
    }
    else if (actionType === 'SPLIT_FUNDS') {
      await this.resolveDispute(dispute.id, { decisionType: 'SPLIT_FUNDS', resolutionNotes: details.notes }, adminId);
    }
  }

  async updateDispute(id: string, data: any) {
    return disputeRepository.update(id, data);
  }

  async getPaymentProtectionByShipmentId(shipmentId: string) {
    return paymentProtectionRepository.getByShipmentId(shipmentId);
  }

  async getPaymentProtectionByParcelId(parcelId: string) {
    return paymentProtectionRepository.getByParcelId(parcelId);
  }

  async updatePaymentProtection(id: string, data: any) {
    return paymentProtectionRepository.update(id, data);
  }

}

export const disputeEngine = DisputeEngine.getInstance();
