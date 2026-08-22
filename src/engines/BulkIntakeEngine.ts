import { bulkIntakeSessionRepository } from '../services/db/BulkIntakeSessionRepository';
import { shipmentRepository } from '../services/db/ShipmentRepository';
import { scanLogRepository } from '../services/db/ScanLogRepository';
import { CustodyRecord, Parcel } from '../types';
import {
  BulkIntakeSession,
  ParcelCondition,
  IntakeException,
  IntakeScanItem,
  BulkIntakeSummary
} from '../types/bulkIntake';
import {
  parcelEngine,
  auditEngine,
  notificationEngine,
  inventoryEngine,
  userEngine,
  timelineEngine
} from './index';

/**
 * WeSabiHub Bulk Intake Engine
 * Authoritative engine for orchestrating physical bulk parcel receiving and check-in sessions.
 */
class BulkIntakeEngine {
  private static instance: BulkIntakeEngine;
  private constructor() {}

  public static getInstance(): BulkIntakeEngine {
    if (!BulkIntakeEngine.instance) {
      BulkIntakeEngine.instance = new BulkIntakeEngine();
    }
    return BulkIntakeEngine.instance;
  }

  /**
   * Retrieves or initiates an active Bulk Intake Session for a Hub.
   */
  async startSession(
    hubId: string,
    merchantId: string,
    shipmentId: string,
    operatorId: string,
    operatorName?: string,
    merchantName?: string
  ): Promise<BulkIntakeSession> {
    // 1. Check for existing active session to resume idempotently
    const existing = await bulkIntakeSessionRepository.query([
      { field: 'hubId', operator: '==', value: hubId },
      { field: 'shipmentId', operator: '==', value: shipmentId },
      { field: 'status', operator: '==', value: 'IN_INTAKE_PROGRESS' }
    ]);

    if (existing.length > 0) {
      return existing[0];
    }

    // 2. Count expected parcels associated with this shipment/bulk creation
    let expectedTotal = 1;
    let targetMerchantId = merchantId;
    let targetMerchantName = merchantName || 'Verified Merchant';

    if (shipmentId) {
      const parentShipment = await shipmentRepository.getById(shipmentId);
      if (parentShipment) {
        if (!targetMerchantId) targetMerchantId = parentShipment.senderId;
        // Search all parcels belonging to this parent shipment
        const relatedParcels = await shipmentRepository.query([
          { field: 'shipmentId', operator: '==', value: shipmentId }
        ]);
        if (relatedParcels && relatedParcels.length > 0) {
          expectedTotal = relatedParcels.length;
        } else {
          expectedTotal = (parentShipment as any).totalParcels || 1;
        }
      }
    }

    // 3. Create new Bulk Intake Session
    const sessionId = `INTAKE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const session: BulkIntakeSession = {
      id: sessionId,
      hubId,
      merchantId: targetMerchantId,
      merchantName: targetMerchantName,
      shipmentId,
      status: 'IN_INTAKE_PROGRESS',
      operatorId,
      operatorName: operatorName || 'Hub Operator',
      totalParcels: expectedTotal,
      processedParcels: [],
      exceptions: {},
      scannedItems: [],
      duplicateScansCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await bulkIntakeSessionRepository.create(sessionId, session);

    // 4. Audit & Merchant Notification
    await auditEngine.logEvent({
      userId: operatorId,
      userRole: 'CENTER_STAFF',
      action: 'START_BULK_INTAKE_SESSION',
      details: { sessionId, shipmentId, hubId, merchantId: targetMerchantId },
      result: 'SUCCESS'
    });

    if (targetMerchantId) {
      notificationEngine.sendFromTemplate(
        targetMerchantId,
        'approved',
        { shipmentId },
        'Bulk Intake Started 📦',
        `Hub ${hubId} has initiated physical parcel check-in for shipment ${shipmentId}.`,
        'INFO',
        'SYSTEM'
      ).catch(err => console.error('Failed to notify merchant on intake start:', err));
    }

    return session;
  }

  /**
   * Fetches session details by ID
   */
  async getSession(sessionId: string): Promise<BulkIntakeSession | null> {
    return await bulkIntakeSessionRepository.getById(sessionId);
  }

  /**
   * Lists bulk intake sessions for a specific hub
   */
  async listSessions(hubId: string): Promise<BulkIntakeSession[]> {
    return await bulkIntakeSessionRepository.query([
      { field: 'hubId', operator: '==', value: hubId }
    ]);
  }

  /**
   * Processes a single parcel scan during a Bulk Intake session.
   * Handles non-blocking execution, condition grading, exception logging, and duplicate scans.
   */
  async processParcelScan(
    sessionId: string,
    parcelScanInput: string,
    condition: ParcelCondition = 'GOOD',
    operatorId: string,
    notes?: string,
    evidenceUrl?: string
  ): Promise<{
    success: boolean;
    isDuplicate?: boolean;
    hasException?: boolean;
    message: string;
    parcel?: Parcel;
    scanItem?: IntakeScanItem;
  }> {
    const session = await bulkIntakeSessionRepository.getById(sessionId);
    if (!session || session.status !== 'IN_INTAKE_PROGRESS') {
      throw new Error('Active Bulk Intake Session not found or already finalized.');
    }

    const trimmedInput = parcelScanInput.trim();
    if (!trimmedInput) {
      return { success: false, message: 'Invalid parcel scan input.' };
    }

    // 1. Look up parcel by ID, tracking number, or verification token
    let parcel = await parcelEngine.getParcel(trimmedInput);
    if (!parcel) {
      parcel = await parcelEngine.getParcelByTracking(trimmedInput);
    }
    if (!parcel) {
      parcel = await parcelEngine.getParcelByToken(trimmedInput);
    }

    const parcelId = parcel ? parcel.id : trimmedInput;
    const trackingNumber = parcel ? parcel.trackingNumber : trimmedInput;

    // 2. DUPLICATE SCAN CHECK
    // If parcel is already processed in this session, return duplicate info without duplicate side-effects
    const isAlreadyProcessed = session.processedParcels.includes(parcelId) ||
      (session.scannedItems && session.scannedItems.some(i => i.parcelId === parcelId || i.trackingNumber === trackingNumber));

    if (isAlreadyProcessed) {
      const existingScan = session.scannedItems?.find(i => i.parcelId === parcelId || i.trackingNumber === trackingNumber);
      const duplicateCount = (session.duplicateScansCount || 0) + 1;

      const duplicateScanItem: IntakeScanItem = {
        id: `SCAN-DUP-${Date.now()}`,
        parcelId,
        trackingNumber,
        condition,
        shelfLocation: existingScan?.shelfLocation || parcel?.shelfLocation || 'Assigned Shelf',
        timestamp: new Date().toISOString(),
        operatorId,
        isDuplicate: true,
        notes: `Duplicate scan detected. Previous scan recorded at ${existingScan?.timestamp || 'earlier session'}.`
      };

      session.duplicateScansCount = duplicateCount;
      session.updatedAt = new Date().toISOString();
      await bulkIntakeSessionRepository.update(sessionId, session);

      await auditEngine.logEvent({
        userId: operatorId,
        userRole: 'CENTER_STAFF',
        action: 'BULK_PARCEL_DUPLICATE_SCAN',
        details: { sessionId, parcelId, trackingNumber },
        result: 'SUCCESS'
      });

      return {
        success: true,
        isDuplicate: true,
        message: `Parcel ${trackingNumber} was already processed in this intake session.`,
        parcel: parcel || undefined,
        scanItem: duplicateScanItem
      };
    }

    // 3. PARCEL VALIDATION CHECK
    if (!parcel) {
      // Record exception for unknown parcel identity
      const exceptionEntry: IntakeException = {
        parcelId: trimmedInput,
        trackingNumber: trimmedInput,
        condition,
        reason: 'PARCEL_NOT_FOUND',
        notes: notes || 'Scanned barcode does not match any registered parcel in the system.',
        evidenceUrl,
        operatorId,
        timestamp: new Date().toISOString()
      };

      session.exceptions[trimmedInput] = exceptionEntry;
      session.updatedAt = new Date().toISOString();
      await bulkIntakeSessionRepository.update(sessionId, session);

      await auditEngine.logEvent({
        userId: operatorId,
        userRole: 'CENTER_STAFF',
        action: 'BULK_PARCEL_INTAKE_EXCEPTION',
        details: { sessionId, scanInput: trimmedInput, reason: 'PARCEL_NOT_FOUND' },
        result: 'FAILURE'
      });

      return {
        success: false,
        hasException: true,
        message: `Parcel ${trimmedInput} not found in database. Exception recorded.`,
      };
    }

    // Verify parcel belongs to the session parent shipment
    const matchesShipment = parcel.shipmentId === session.shipmentId || parcel.id === session.shipmentId;
    if (!matchesShipment && session.shipmentId) {
      const exceptionEntry: IntakeException = {
        parcelId: parcel.id,
        trackingNumber: parcel.trackingNumber,
        condition,
        reason: 'WRONG_PARCEL_OR_SHIPMENT',
        notes: notes || `Parcel belongs to a different shipment than session ${session.shipmentId}.`,
        evidenceUrl,
        operatorId,
        timestamp: new Date().toISOString()
      };

      session.exceptions[parcel.id] = exceptionEntry;
      session.updatedAt = new Date().toISOString();
      await bulkIntakeSessionRepository.update(sessionId, session);

      return {
        success: false,
        hasException: true,
        message: `Parcel ${parcel.trackingNumber} does not belong to session shipment ${session.shipmentId}. Exception logged.`,
        parcel
      };
    }

    // 4. CONDITION & EXCEPTION EVALUATION
    const isExceptionCondition = condition !== 'GOOD';
    let exceptionReason: string | undefined;

    if (isExceptionCondition) {
      exceptionReason = `CONDITION_${condition}`;
      const exceptionEntry: IntakeException = {
        parcelId: parcel.id,
        trackingNumber: parcel.trackingNumber,
        condition,
        reason: exceptionReason,
        notes,
        evidenceUrl,
        operatorId,
        timestamp: new Date().toISOString()
      };
      session.exceptions[parcel.id] = exceptionEntry;
    }

    // Compliance check for illegal or dangerous goods
    if (condition === 'ILLEGAL_GOODS' || condition === 'DANGEROUS_GOODS') {
      await parcelEngine.updateParcel(parcel.id, {
        status: 'COMPLIANCE_HOLD' as any,
        condition,
        updatedAt: new Date().toISOString()
      });

      await auditEngine.logEvent({
        userId: operatorId,
        userRole: 'CENTER_STAFF',
        action: 'PARCEL_COMPLIANCE_HOLD',
        details: { sessionId, parcelId: parcel.id, condition, notes },
        result: 'SUCCESS'
      });

      session.processedParcels.push(parcel.id);
      session.updatedAt = new Date().toISOString();
      await bulkIntakeSessionRepository.update(sessionId, session);

      return {
        success: false,
        hasException: true,
        message: `Parcel ${parcel.trackingNumber} flagged for ${condition}. Placed on compliance hold.`,
        parcel
      };
    }

    // 5. INVENTORY & SHELF ALLOCATION
    const shelfLocation = await inventoryEngine.assignShelf(parcel.id, session.hubId, 'STANDARD');

    // 6. CUSTODY TRANSFER & STATUS UPDATE
    const custodyRecord: CustodyRecord = {
      id: `CUST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      parcelId: parcel.id,
      currentHolderId: operatorId,
      previousHolderId: parcel.senderId || 'MERCHANT',
      receivingUserId: operatorId,
      releasingUserId: parcel.senderId || 'MERCHANT',
      locationId: session.hubId,
      condition,
      notes: notes || 'Physical parcel intake complete during bulk session.',
      timestamp: new Date().toISOString()
    };

    await parcelEngine.recordCustodyHandover(custodyRecord);

    // Determine target parcel status based on hub role (origin vs destination)
    const isOrigin = parcel.originCenterId === session.hubId;
    const isDestination = parcel.destinationCenterId === session.hubId;
    const newStatus = isDestination ? 'ARRIVED_AT_DESTINATION' : isOrigin ? 'RECEIVED_AT_ORIGIN' : 'TRANSFERRED_BETWEEN_POINTS';

    await shipmentRepository.update(parcel.id, {
      status: newStatus as any,
      shelfLocation,
      condition,
      updatedAt: new Date().toISOString()
    });

    // Record Timeline Event
    await timelineEngine.recordEvent({
      parcelId: parcel.id,
      shipmentId: parcel.shipmentId || parcel.id,
      status: newStatus as any,
      eventType: 'CUSTODY_TRANSFER',
      actorId: operatorId,
      actorRole: 'HUB_STAFF',
      location: session.hubId,
      remarks: `Parcel intake processed at Hub. Shelved at location ${shelfLocation}. Condition: ${condition}`,
      relatedShiftId: session.id,
      metadata: { shelfLocation, condition, sessionId }
    });

    // Write Scan Log
    await scanLogRepository.create(`SCAN-${Date.now()}`, {
      id: `SCAN-${Date.now()}`,
      parcelId: parcel.id,
      userId: operatorId,
      role: 'CENTER_STAFF',
      location: session.hubId,
      action: 'RECEIVED',
      result: 'SUCCESS',
      remarks: `[BULK INTAKE] Condition: ${condition}, Shelf: ${shelfLocation}`,
      timestamp: new Date().toISOString()
    });

    // 7. RECORD SESSION SCAN ITEM
    const scanItem: IntakeScanItem = {
      id: `SCAN-ITEM-${Date.now()}`,
      parcelId: parcel.id,
      trackingNumber: parcel.trackingNumber,
      condition,
      shelfLocation,
      timestamp: new Date().toISOString(),
      operatorId,
      hasException: isExceptionCondition,
      exceptionReason,
      notes,
      evidenceUrl
    };

    if (!session.scannedItems) session.scannedItems = [];
    session.scannedItems.push(scanItem);
    session.processedParcels.push(parcel.id);
    session.updatedAt = new Date().toISOString();

    await bulkIntakeSessionRepository.update(sessionId, session);

    // 8. AUDIT & MILESTONE NOTIFICATIONS
    await auditEngine.logEvent({
      userId: operatorId,
      userRole: 'CENTER_STAFF',
      action: 'BULK_PARCEL_INTAKE_SUCCESS',
      details: { sessionId, parcelId: parcel.id, trackingNumber: parcel.trackingNumber, shelfLocation, condition },
      result: 'SUCCESS'
    });

    // Milestone customer notification when parcel is ready/arrived
    if (parcel.recipientInfo?.phone || parcel.recipientInfo?.email) {
      const recipientContact = parcel.recipientInfo.phone || parcel.recipientInfo.email;
      if (recipientContact) {
        notificationEngine.sendFromTemplate(
          recipientContact,
          'approved',
          { trackingNumber: parcel.trackingNumber },
          'Parcel Arrived at Hub 📍',
          `Your parcel ${parcel.trackingNumber} has arrived at ${session.hubId}.`,
          'INFO',
          'SYSTEM'
        ).catch(err => console.error('Failed to notify recipient on intake scan:', err));
      }
    }

    return {
      success: true,
      hasException: isExceptionCondition,
      message: `Parcel ${parcel.trackingNumber} received. Assigned to ${shelfLocation}.`,
      parcel,
      scanItem
    };
  }

  /**
   * Finalizes an active Bulk Intake Session idempotently.
   */
  async finalizeSession(sessionId: string, operatorId: string): Promise<BulkIntakeSummary> {
    const session = await bulkIntakeSessionRepository.getById(sessionId);
    if (!session) {
      throw new Error('Bulk Intake Session not found.');
    }

    const now = new Date().toISOString();

    // Idempotent completion check
    if (session.status === 'COMPLETED') {
      const accepted = session.processedParcels.filter(id => !session.exceptions[id]);
      const exceptions = Object.keys(session.exceptions);
      return {
        sessionId: session.id,
        hubId: session.hubId,
        merchantId: session.merchantId,
        shipmentId: session.shipmentId,
        totalExpected: session.totalParcels,
        acceptedCount: accepted.length,
        exceptionCount: exceptions.length,
        duplicateCount: session.duplicateScansCount || 0,
        unprocessedCount: Math.max(0, session.totalParcels - accepted.length - exceptions.length),
        completedAt: session.completedAt || session.updatedAt,
        operatorId: session.operatorId
      };
    }

    const acceptedParcels = session.processedParcels.filter(id => !session.exceptions[id]);
    const exceptionCount = Object.keys(session.exceptions).length;
    const unprocessedCount = Math.max(0, session.totalParcels - acceptedParcels.length - exceptionCount);

    session.status = 'COMPLETED';
    session.completedAt = now;
    session.updatedAt = now;

    await bulkIntakeSessionRepository.update(sessionId, session);

    // Update parent shipment state if applicable
    if (session.shipmentId) {
      const parentShipment = await shipmentRepository.getById(session.shipmentId);
      if (parentShipment && parentShipment.status === 'AWAITING_DROP_OFF') {
        await shipmentRepository.update(session.shipmentId, {
          status: 'RECEIVED_AT_ORIGIN',
          updatedAt: now
        });
      }
    }

    // Write Audit Log
    await auditEngine.logEvent({
      userId: operatorId,
      userRole: 'CENTER_STAFF',
      action: 'FINALIZE_BULK_INTAKE_SESSION',
      details: {
        sessionId,
        acceptedCount: acceptedParcels.length,
        exceptionCount,
        unprocessedCount,
        duplicates: session.duplicateScansCount || 0
      },
      result: 'SUCCESS'
    });

    // Notify Merchant with complete summary
    if (session.merchantId) {
      notificationEngine.sendFromTemplate(
        session.merchantId,
        'approved',
        { shipmentId: session.shipmentId },
        'Bulk Intake Completed ✅',
        `Bulk Intake Session for shipment ${session.shipmentId} complete. ${acceptedParcels.length} accepted, ${exceptionCount} exceptions logged.`,
        'SUCCESS',
        'SYSTEM'
      ).catch(err => console.error('Failed to send merchant bulk intake final summary:', err));
    }

    return {
      sessionId: session.id,
      hubId: session.hubId,
      merchantId: session.merchantId,
      shipmentId: session.shipmentId,
      totalExpected: session.totalParcels,
      acceptedCount: acceptedParcels.length,
      exceptionCount,
      duplicateCount: session.duplicateScansCount || 0,
      unprocessedCount,
      completedAt: now,
      operatorId
    };
  }
}

export const bulkIntakeEngine = BulkIntakeEngine.getInstance();
