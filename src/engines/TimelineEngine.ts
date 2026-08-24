import { trackingRepository } from '../services/db/TrackingRepository';
import { shipmentRepository } from '../services/db/ShipmentRepository';
import { centreEngine } from './CentreEngine';
import { auditEngine } from './AuditEngine';
import { TrackingEvent, Parcel, ParcelMilestone, ParcelStatus, UserRole } from '../types';

/**
 * OmorfiHub Authoritative Timeline Engine (Step 7.13)
 * Orchestrates unified, immutable parcel timeline events, custody history,
 * milestone calculation, and RBAC privacy controls.
 */
class TimelineEngine {
  private static instance: TimelineEngine;
  private constructor() {}

  public static getInstance(): TimelineEngine {
    if (!TimelineEngine.instance) {
      TimelineEngine.instance = new TimelineEngine();
    }
    return TimelineEngine.instance;
  }

  /**
   * Append an authoritative timeline event.
   */
  async recordEvent(params: {
    parcelId: string;
    shipmentId?: string;
    status: ParcelStatus;
    eventType?: TrackingEvent['eventType'];
    actorId: string;
    actorRole?: UserRole | string;
    location: string;
    remarks: string;
    statusDescription?: string;
    relatedLogisticsJobId?: string;
    relatedShiftId?: string;
    relatedTransactionId?: string;
    metadata?: Record<string, any>;
    isPrivateInternal?: boolean;
  }): Promise<TrackingEvent> {
    const {
      parcelId,
      shipmentId,
      status,
      eventType = 'STATUS_CHANGE',
      actorId,
      actorRole = 'SYSTEM',
      location,
      remarks,
      statusDescription,
      relatedLogisticsJobId,
      relatedShiftId,
      relatedTransactionId,
      metadata = {},
      isPrivateInternal = false
    } = params;

    // 1. Resolve human readable location name
    let locationName = location;
    try {
      if (location && location !== 'SYSTEM') {
        const hub = await centreEngine.getHub(location);
        if (hub) {
          locationName = hub.name;
        }
      }
    } catch {
      // Keep default location string
    }

    // 2. Check latest event to prevent rapid duplicate logging
    const recentEvents = await trackingRepository.getByParcel(parcelId);
    if (recentEvents.length > 0) {
      const latest = recentEvents[recentEvents.length - 1];
      const timeDiff = Date.now() - new Date(latest.timestamp).getTime();
      if (latest.status === status && latest.remarks === remarks && timeDiff < 3000) {
        return latest;
      }
    }

    // 3. Construct event object
    const eventId = `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const event: TrackingEvent = {
      id: eventId,
      eventId,
      parcelId,
      shipmentId: shipmentId || parcelId,
      status,
      eventType,
      actorId,
      actorRole: actorRole as any,
      location,
      locationName,
      remarks,
      statusDescription: statusDescription || remarks,
      relatedLogisticsJobId,
      relatedShiftId,
      relatedTransactionId,
      metadata,
      isAuditOnly: isPrivateInternal,
      timestamp: new Date().toISOString()
    };

    // 4. Persist to Firestore
    await trackingRepository.create(eventId, event);

    // 5. Audit Log
    await auditEngine.logEvent({
      userId: actorId,
      userRole: actorRole as any,
      action: 'TIMELINE_EVENT_CREATED',
      details: { eventId, parcelId, status, eventType, location },
      result: 'SUCCESS'
    });

    return event;
  }

  /**
   * Retrieves parcel timeline events formatted for the specified user role (RBAC & Privacy).
   */
  async getTimelineForUser(
    parcelId: string,
    userRole: string = 'CUSTOMER',
    order: 'asc' | 'desc' = 'asc'
  ): Promise<TrackingEvent[]> {
    const rawEvents = await trackingRepository.getByParcel(parcelId);

    // Sort events
    const sorted = [...rawEvents].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return order === 'asc' ? timeA - timeB : timeB - timeA;
    });

    // Resolve location names dynamically if missing
    const hubs = await centreEngine.listNearbyHubs(0, 0, 9999).catch(() => []);
    const hubMap = new Map<string, string>();
    hubs.forEach((h: any) => {
      if (h.id && h.name) hubMap.set(h.id, h.name);
    });

    const filtered = sorted.map(evt => {
      const copy = { ...evt };
      if (!copy.locationName && copy.location) {
        copy.locationName = hubMap.get(copy.location) || copy.location;
      }

      // Privacy sanitization for Customer view
      if (userRole === 'CUSTOMER' || userRole === 'PUBLIC') {
        if (copy.isPrivateInternal) return null; // Strip internal-only events
        // Anonymize internal staff IDs/roles
        if (copy.actorRole === 'HUB_STAFF') {
          copy.actorId = 'Hub Operations Staff';
        } else if (copy.actorRole === 'LOGISTICS_RIDER') {
          copy.actorId = 'Logistics Courier';
        }
        // Remove internal metadata details
        if (copy.metadata) {
          const { internalNotes, shiftId, securityFlags, ...publicMeta } = copy.metadata;
          copy.metadata = publicMeta;
        }
      }

      // Privacy sanitization for Merchant view
      if (userRole === 'MERCHANT') {
        if (copy.isPrivateInternal && copy.eventType === 'HOLD') {
          // Keep hold notice but sanitize internal notes
          copy.remarks = 'Parcel on administrative hold for verification.';
        }
      }

      return copy;
    }).filter(Boolean) as TrackingEvent[];

    return filtered;
  }

  /**
   * Calculate milestone progression for a parcel.
   */
  generateMilestones(parcel: Parcel, events: TrackingEvent[]): ParcelMilestone[] {
    const isHubPickup = parcel.fulfillmentMethod === 'HUB_PICKUP';
    const status = parcel.status;

    // Define standard milestone definitions based on fulfillment method
    const definitions = isHubPickup ? [
      {
        key: 'CREATED',
        title: 'Shipment Created',
        description: 'Shipment manifest registered by sender.',
        statuses: ['DRAFT', 'AWAITING_PAYMENT', 'PAYMENT_CONFIRMED', 'AWAITING_DROP_OFF', 'RECEIVED_AT_ORIGIN', 'READY_FOR_PICKUP', 'COLLECTED', 'RELEASED', 'COMPLETED']
      },
      {
        key: 'PAYMENT_CONFIRMED',
        title: 'Payment Confirmed',
        description: 'Funds secured under SafePay protection.',
        statuses: ['PAYMENT_CONFIRMED', 'AWAITING_DROP_OFF', 'RECEIVED_AT_ORIGIN', 'READY_FOR_PICKUP', 'COLLECTED', 'RELEASED', 'COMPLETED']
      },
      {
        key: 'RECEIVED_AT_HUB',
        title: 'Received at Hub',
        description: 'Parcel physically received and checked-in at hub.',
        statuses: ['RECEIVED_AT_ORIGIN', 'READY_FOR_PICKUP', 'COLLECTED', 'RELEASED', 'COMPLETED']
      },
      {
        key: 'READY_FOR_PICKUP',
        title: 'Ready for Pickup',
        description: 'Parcel stored on shelf and ready for recipient collection.',
        statuses: ['READY_FOR_PICKUP', 'COLLECTED', 'RELEASED', 'COMPLETED']
      },
      {
        key: 'RELEASED',
        title: 'Picked Up / Released',
        description: 'Identity verified with OTP/PIN and parcel released.',
        statuses: ['COLLECTED', 'RELEASED', 'DELIVERED', 'COMPLETED']
      },
      {
        key: 'COMPLETED',
        title: 'Transaction Completed',
        description: 'SafePay protection released and transaction closed.',
        statuses: ['COMPLETED']
      }
    ] : [
      {
        key: 'CREATED',
        title: 'Shipment Created',
        description: 'Shipment manifest registered by sender.',
        statuses: ['DRAFT', 'AWAITING_PAYMENT', 'PAYMENT_CONFIRMED', 'AWAITING_DROP_OFF', 'RECEIVED_AT_ORIGIN', 'AWAITING_DISPATCH', 'IN_TRANSIT', 'ARRIVED_AT_DESTINATION', 'READY_FOR_PICKUP', 'DELIVERED', 'COLLECTED', 'RELEASED', 'COMPLETED']
      },
      {
        key: 'PAYMENT_CONFIRMED',
        title: 'Payment Confirmed',
        description: 'Funds secured under SafePay protection.',
        statuses: ['PAYMENT_CONFIRMED', 'AWAITING_DROP_OFF', 'RECEIVED_AT_ORIGIN', 'AWAITING_DISPATCH', 'IN_TRANSIT', 'ARRIVED_AT_DESTINATION', 'READY_FOR_PICKUP', 'DELIVERED', 'COLLECTED', 'RELEASED', 'COMPLETED']
      },
      {
        key: 'RECEIVED_AT_ORIGIN',
        title: 'Received at Origin Hub',
        description: 'Parcel checked-in at origin hub center.',
        statuses: ['RECEIVED_AT_ORIGIN', 'AWAITING_DISPATCH', 'IN_TRANSIT', 'ARRIVED_AT_DESTINATION', 'READY_FOR_PICKUP', 'DELIVERED', 'COLLECTED', 'RELEASED', 'COMPLETED']
      },
      {
        key: 'IN_TRANSIT',
        title: 'In Transit',
        description: 'Dispatched with logistics carrier to destination.',
        statuses: ['IN_TRANSIT', 'ARRIVED_AT_DESTINATION', 'READY_FOR_PICKUP', 'DELIVERED', 'COLLECTED', 'RELEASED', 'COMPLETED']
      },
      {
        key: 'ARRIVED_AT_DESTINATION',
        title: 'Arrived at Destination Hub',
        description: 'Parcel processed at destination hub center.',
        statuses: ['ARRIVED_AT_DESTINATION', 'READY_FOR_PICKUP', 'DELIVERED', 'COLLECTED', 'RELEASED', 'COMPLETED']
      },
      {
        key: 'READY_FOR_DELIVERY',
        title: 'Ready for Collection / Out for Delivery',
        description: 'Parcel ready for customer handover.',
        statuses: ['READY_FOR_PICKUP', 'DELIVERED', 'COLLECTED', 'RELEASED', 'COMPLETED']
      },
      {
        key: 'RELEASED',
        title: 'Delivered / Handed Over',
        description: 'Recipient verified and parcel delivered.',
        statuses: ['DELIVERED', 'COLLECTED', 'RELEASED', 'COMPLETED']
      },
      {
        key: 'COMPLETED',
        title: 'Transaction Completed',
        description: 'SafePay protection released and transaction closed.',
        statuses: ['COMPLETED']
      }
    ];

    const isHoldStatus = ['COMPLIANCE_HOLD', 'INVESTIGATION_HOLD', 'DISPUTE_RAISED', 'DAMAGED', 'LOST', 'RETURNED'].includes(status as string);

    return definitions.map((def) => {
      // Find matching real event from history
      const matched = events.find(e =>
        (e.status as string) === def.key ||
        def.statuses.includes(e.status as string) ||
        (def.key === 'CREATED' && (e.status === 'DRAFT' || e.status === 'AWAITING_PAYMENT')) ||
        (def.key === 'RELEASED' && (e.status === 'COLLECTED' || e.status === 'DELIVERED' || (e.status as string) === 'RELEASED'))
      );

      let milestoneStatus: ParcelMilestone['status'] = 'PENDING';

      if (def.statuses.includes(status as string)) {
        if ((status as string) === def.key || (def.key === 'RELEASED' && ['COLLECTED', 'DELIVERED', 'RELEASED'].includes(status as string)) || (def.key === 'READY_FOR_PICKUP' && status === 'READY_FOR_PICKUP')) {
          milestoneStatus = 'CURRENT';
        } else {
          milestoneStatus = 'COMPLETED';
        }
      }

      if (isHoldStatus && ((status as string) === 'COMPLIANCE_HOLD' || (status as string) === 'INVESTIGATION_HOLD') && def.key === 'READY_FOR_PICKUP') {
        milestoneStatus = 'EXCEPTION';
      }

      return {
        key: def.key,
        title: def.title,
        description: def.description,
        status: milestoneStatus,
        timestamp: matched?.timestamp,
        location: matched?.locationName || matched?.location,
        matchedEvent: matched
      };
    });
  }
}

export const timelineEngine = TimelineEngine.getInstance();
