import { recoveryRepository, RecoveryRequest } from '../services/db/RecoveryRepository';
export type { RecoveryRequest };
import { parcelEngine } from './ParcelEngine';

import { auditEngine } from './AuditEngine';
import { notificationEngine } from './NotificationEngine';
import { centreEngine } from './CentreEngine';

class RecoveryEngine {
  private static instance: RecoveryEngine;

  private constructor() {}

  public static getInstance(): RecoveryEngine {
    if (!RecoveryEngine.instance) {
      RecoveryEngine.instance = new RecoveryEngine();
    }
    return RecoveryEngine.instance;
  }

  /**
   * Submits a formal recovery request for a long-stay parcel from an authorised Hub.
   */
  public async submitRecoveryRequest(
    parcelId: string,
    hubId: string,
    userId: string,
    userName: string,
    reason: RecoveryRequest['reason'],
    notes?: string
  ): Promise<RecoveryRequest> {
    // 1. Fetch parcel to verify existence and holding duration
    const parcel = await parcelEngine.getParcel(parcelId);
    if (!parcel) {
      throw new Error('Parcel not found for recovery request.');
    }

    // 2. Check if active recovery request already exists
    const existing = await recoveryRepository.getByParcelId(parcelId);
    if (existing) {
      throw new Error('An active recovery request already exists for this parcel.');
    }

    // 3. Fetch Hub info
    const hub = await centreEngine.getHub(hubId);
    const hubName = hub?.name || 'Hub Center';

    // 4. Calculate holding duration in days
    const createdAt = new Date(parcel.createdAt || Date.now()).getTime();
    const holdingDurationDays = Math.max(1, Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24)));

    const requestId = `REC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`.toUpperCase();

    const newRequest: RecoveryRequest = {
      id: requestId,
      parcelId: parcel.id,
      trackingNumber: parcel.trackingNumber,
      hubId,
      hubName,
      submittedBy: userId,
      submitterName: userName,
      reason,
      notes: notes || '',
      holdingDurationDays,
      parcelStatus: parcel.status,
      storageLocation: parcel.destinationCenterId || parcel.originCenterId || 'Main Storage',
      paymentStatus: (parcel as any).paymentStatus || 'PAID',
      customerNotificationStatus: 'NOTIFIED',
      status: 'PENDING_REVIEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 5. Persist via repository
    await recoveryRepository.create(newRequest.id, newRequest);

    // 6. Audit Logging
    await auditEngine.logEvent({
      userId,
      action: 'SUBMIT_RECOVERY_REQUEST',
      targetId: parcelId,
      details: { requestId, reason, holdingDurationDays, hubId },
      result: 'SUCCESS'
    });

    // 7. Send Operational Alert to Super Admin / Operations
    await notificationEngine.send(
      'admin',
      `Long-Stay Recovery Request: ${parcel.trackingNumber}`,
      `Hub ${hubName} submitted recovery request for parcel held for ${holdingDurationDays} days. Reason: ${reason}.`,
      'WARNING',
      undefined,
      'SYSTEM'
    );

    return newRequest;
  }

  /**
   * Reviews a recovery request (Super Admin / Operations Manager).
   */
  public async reviewRecoveryRequest(
    requestId: string,
    decision: 'APPROVED' | 'REJECTED' | 'NEEDS_INFORMATION' | 'RECOVERY_IN_PROGRESS' | 'RECOVERED' | 'CLOSED',
    reviewNotes: string,
    adminId: string
  ): Promise<void> {
    const request = await recoveryRepository.getById(requestId);
    if (!request) {
      throw new Error('Recovery request not found.');
    }

    // Prevent Hub from approving its own request if submitted by them (enforced via RBAC check in UI / backend)
    await recoveryRepository.update(requestId, {
      status: decision,
      reviewedBy: adminId,
      reviewNotes,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Update parcel status and timeline based on decision
    if (decision === 'RECOVERY_IN_PROGRESS') {
      await parcelEngine.parcels.updateStatus(request.parcelId, 'EXCEPTION', adminId, 'SUPER_ADMIN_CENTER', `Recovery in progress: ${reviewNotes}`);
    } else if (decision === 'RECOVERED') {
      await parcelEngine.parcels.updateStatus(request.parcelId, 'RETURNED', adminId, 'SUPER_ADMIN_CENTER', `Parcel recovered by platform: ${reviewNotes}`);
    } else {
      // Just add a tracking event
      await parcelEngine.parcels.addTrackingEvent(request.parcelId, request.parcelStatus as any, adminId, 'SUPER_ADMIN_CENTER', `Recovery request ${decision}: ${reviewNotes}`);
    }

    // Audit Logging
    await auditEngine.logEvent({
      userId: adminId,
      action: 'REVIEW_RECOVERY_REQUEST',
      targetId: request.parcelId,
      details: { requestId, decision, reviewNotes },
      result: 'SUCCESS'
    });

    // Notify Hub submitter
    await notificationEngine.send(
      request.submittedBy,
      `Recovery Request ${decision}`,
      `Your recovery request for parcel ${request.trackingNumber} has been reviewed: ${decision}. Note: ${reviewNotes}`,
      'INFO',
      undefined,
      'SYSTEM'
    );
  }

  public subscribeToRecoveryRequests(callback: (requests: RecoveryRequest[]) => void) {
    return recoveryRepository.subscribeToQuery([], callback);
  }

  public async getAllRecoveryRequests(): Promise<RecoveryRequest[]> {
    return recoveryRepository.getAll();
  }

  public async getRecoveryRequestsByHub(hubId: string): Promise<RecoveryRequest[]> {
    return recoveryRepository.getByHubId(hubId);
  }
}

export const recoveryEngine = RecoveryEngine.getInstance();
