import { User, Parcel, ScanLog, TrackingEvent } from '../types';
import { scanValidator } from './ScanValidator';
import { scanLogRepository } from './db/ScanLogRepository';
import { trackingRepository } from './db/TrackingRepository';
import { notificationService } from './NotificationService';
import { shipmentRepository } from './db/ShipmentRepository';

class TrackingEngine {
  async getTrackingHistory(parcelId: string, user?: User | null, parcelParam?: Parcel | null): Promise<TrackingEvent[]> {
    let events = await trackingRepository.getByParcel(parcelId);

    // Filter out internal audit-only events for non-admin users
    const isStaffOrAdmin = user?.role === 'SUPER_ADMIN' || (user?.role as string) === 'OPERATIONS_STAFF' || user?.roles?.includes('SUPER_ADMIN');
    if (!isStaffOrAdmin) {
      events = events.filter(e => !e.isAuditOnly);
    }

    // If no explicit events exist in database, synthesize baseline events from parcel state
    if (events.length === 0) {
      const parcel = parcelParam || await shipmentRepository.getById(parcelId);
      if (parcel) {
        events = this.synthesizeBaselineTimeline(parcel);
      }
    }

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async addTrackingEvent(event: Partial<TrackingEvent> & { parcelId: string; status: any; actorId: string; location: string; remarks: string }): Promise<void> {
    const events = await trackingRepository.getByParcel(event.parcelId);

    // Deduplication check: ignore if exact same status & remarks added in the last 5 seconds
    const now = new Date(event.timestamp || Date.now()).getTime();
    const isDuplicate = events.some(e => {
      const diff = Math.abs(now - new Date(e.timestamp).getTime());
      return e.status === event.status && e.remarks === event.remarks && diff < 5000;
    });

    if (isDuplicate) {
      return;
    }

    const eventId = event.eventId || event.id || crypto.randomUUID();
    const fullEvent: TrackingEvent = {
      id: eventId,
      eventId,
      parcelId: event.parcelId,
      shipmentId: event.shipmentId,
      status: event.status,
      eventType: event.eventType || 'STATUS_CHANGE',
      actorId: event.actorId,
      actorRole: event.actorRole || 'SYSTEM',
      location: event.location,
      locationName: event.locationName || event.location,
      hubId: event.hubId,
      centerId: event.centerId,
      remarks: event.remarks,
      statusDescription: event.statusDescription || event.remarks,
      timestamp: event.timestamp || new Date().toISOString(),
      relatedLogisticsJobId: event.relatedLogisticsJobId,
      relatedShiftId: event.relatedShiftId,
      relatedTransactionId: event.relatedTransactionId,
      metadata: event.metadata,
      isAuditOnly: !!event.isAuditOnly
    };

    await trackingRepository.create(fullEvent.id, fullEvent);
  }

  subscribeToTrackingHistory(
    parcelId: string,
    callback: (events: TrackingEvent[]) => void,
    user?: User | null,
    parcelParam?: Parcel | null
  ) {
    return trackingRepository.subscribeToParcelEvents(parcelId, async (rawEvents) => {
      let events = rawEvents;
      const isStaffOrAdmin = user?.role === 'SUPER_ADMIN' || (user?.role as string) === 'OPERATIONS_STAFF' || user?.roles?.includes('SUPER_ADMIN');
      if (!isStaffOrAdmin) {
        events = events.filter(e => !e.isAuditOnly);
      }

      if (events.length === 0) {
        const parcel = parcelParam || await shipmentRepository.getById(parcelId);
        if (parcel) {
          events = this.synthesizeBaselineTimeline(parcel);
        }
      }

      events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      callback(events);
    });
  }

  private synthesizeBaselineTimeline(parcel: Parcel): TrackingEvent[] {
    const createdDate = parcel.createdAt ? new Date(parcel.createdAt) : new Date();
    const baseTime = createdDate.getTime();

    const events: TrackingEvent[] = [
      {
        id: `SYNTH-1-${parcel.id}`,
        eventId: `SYNTH-1-${parcel.id}`,
        parcelId: parcel.id,
        shipmentId: parcel.shipmentId,
        status: 'AWAITING_PAYMENT',
        eventType: 'STATUS_CHANGE',
        actorId: parcel.senderId || 'SYSTEM',
        actorRole: 'MERCHANT',
        location: parcel.originCenterId || 'Origin Hub',
        remarks: 'Shipment created and registered in OmorfiHub system.',
        statusDescription: 'Shipment Created',
        timestamp: new Date(baseTime).toISOString()
      }
    ];

    if (parcel.status !== 'AWAITING_PAYMENT' && parcel.status !== 'DRAFT' && parcel.status !== 'CANCELLED') {
      events.push({
        id: `SYNTH-2-${parcel.id}`,
        eventId: `SYNTH-2-${parcel.id}`,
        parcelId: parcel.id,
        shipmentId: parcel.shipmentId,
        status: 'PAYMENT_CONFIRMED',
        eventType: 'PAYMENT',
        actorId: parcel.senderId || 'SYSTEM',
        actorRole: 'SYSTEM',
        location: parcel.originCenterId || 'Origin Hub',
        remarks: 'Payment verified and secured via SafePay protection.',
        statusDescription: 'Payment Confirmed',
        timestamp: new Date(baseTime + 300000).toISOString()
      });
    }

    if (['RECEIVED_AT_ORIGIN', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED', 'COLLECTED', 'RELEASED', 'COMPLETED'].includes(parcel.status)) {
      events.push({
        id: `SYNTH-3-${parcel.id}`,
        eventId: `SYNTH-3-${parcel.id}`,
        parcelId: parcel.id,
        shipmentId: parcel.shipmentId,
        status: 'RECEIVED_AT_ORIGIN',
        eventType: 'CUSTODY_TRANSFER',
        actorId: 'HUB_OPERATOR',
        actorRole: 'HUB_STAFF',
        location: parcel.originCenterId || 'Origin Hub Point',
        remarks: `Parcel checked in at Hub Point ${parcel.originCenterId || ''}. Physical intake complete.`,
        statusDescription: 'Arrived at Origin Hub',
        timestamp: new Date(baseTime + 1800000).toISOString()
      });
    }

    if (['READY_FOR_PICKUP', 'DELIVERED', 'COLLECTED', 'RELEASED', 'COMPLETED'].includes(parcel.status) && parcel.fulfillmentMethod === 'HUB_PICKUP') {
      events.push({
        id: `SYNTH-4-${parcel.id}`,
        eventId: `SYNTH-4-${parcel.id}`,
        parcelId: parcel.id,
        shipmentId: parcel.shipmentId,
        status: 'READY_FOR_PICKUP',
        eventType: 'STATUS_CHANGE',
        actorId: 'HUB_OPERATOR',
        actorRole: 'HUB_STAFF',
        location: parcel.destinationCenterId || parcel.originCenterId || 'Hub Point',
        remarks: `Parcel stored on shelf ${parcel.shelfLocation || 'A1'}. Recipient notified for pickup.`,
        statusDescription: 'Stored & Ready for Pickup',
        timestamp: new Date(baseTime + 3600000).toISOString()
      });
    }

    if (['IN_TRANSIT', 'DELIVERED', 'COLLECTED', 'RELEASED', 'COMPLETED'].includes(parcel.status) && parcel.fulfillmentMethod === 'LOGISTICS_DELIVERY') {
      events.push({
        id: `SYNTH-5-${parcel.id}`,
        eventId: `SYNTH-5-${parcel.id}`,
        parcelId: parcel.id,
        shipmentId: parcel.shipmentId,
        status: 'IN_TRANSIT',
        eventType: 'CUSTODY_TRANSFER',
        actorId: 'DISPATCH_RIDER',
        actorRole: 'LOGISTICS_RIDER',
        location: 'In Transit / Logistics Courier',
        remarks: 'Parcel picked up by verified logistics rider and out for delivery.',
        statusDescription: 'Out for Delivery',
        timestamp: new Date(baseTime + 5400000).toISOString()
      });
    }

    if (['DELIVERED', 'COLLECTED', 'RELEASED', 'COMPLETED'].includes(parcel.status)) {
      events.push({
        id: `SYNTH-6-${parcel.id}`,
        eventId: `SYNTH-6-${parcel.id}`,
        parcelId: parcel.id,
        shipmentId: parcel.shipmentId,
        status: parcel.status as any,
        eventType: 'RELEASE',
        actorId: 'RECIPIENT',
        actorRole: 'CUSTOMER',
        location: parcel.destinationCenterId || 'Destination Hub / Recipient Address',
        remarks: 'PIN verified. Parcel handed over to recipient. SafePay payment unlocked.',
        statusDescription: 'Collected / Delivered',
        timestamp: parcel.updatedAt || new Date(baseTime + 7200000).toISOString()
      });
    }

    return events;
  }

  async processScan(
    parcelId: string,
    user: User,
    locationId: string,
    action: 'RECEIVED' | 'RELEASED' | 'TRANSFER_CONFIRMED' | 'PICKUP_CONFIRMED' | 'DELIVERY_CONFIRMED' | 'EXCEPTION',
    remarks?: string
  ): Promise<void> {
    const { valid, message, parcel } = await scanValidator.validate(parcelId, user, locationId);

    const log: ScanLog = {
      id: crypto.randomUUID(),
      parcelId,
      userId: user.uid,
      role: user.role,
      location: locationId,
      action,
      result: (valid ? 'SUCCESS' : 'FAILED') as 'SUCCESS' | 'FAILED',
      remarks: valid ? remarks : message,
      timestamp: new Date().toISOString()
    };

    await scanLogRepository.create(log.id, log);

    if (!valid) {
      throw new Error(message);
    }

    if (parcel) {
      await this.addTrackingEvent({
        parcelId: parcel.id,
        status: parcel.status,
        actorId: user.uid,
        actorRole: user.role as any,
        location: locationId,
        remarks: remarks || `Scan action: ${action}`
      });

      await notificationService.send(
        parcel.senderId,
        'Parcel Update',
        `Your parcel ${parcel.trackingNumber} has been updated: ${action}`,
        'INFO'
      );
    }
  }
}

export const trackingEngine = new TrackingEngine();
