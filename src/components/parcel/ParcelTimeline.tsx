import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  MapPin,
  ShieldAlert,
  PackageCheck,
  Truck,
  UserCheck,
  Key,
  RefreshCw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Building2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Parcel, TrackingEvent, CustodyRecord, ParcelStatus } from '@/src/types';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { cn } from '@/src/lib/utils';

interface ParcelTimelineProps {
  parcel?: Parcel | null;
  events: TrackingEvent[];
  custodyChain?: CustodyRecord[];
  userRole?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

interface MilestoneStep {
  id: string;
  label: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
  timestamp?: string;
  location?: string;
}

export const ParcelTimeline: React.FC<ParcelTimelineProps> = ({
  parcel,
  events = [],
  custodyChain = [],
  userRole = 'CUSTOMER',
  isLoading = false,
  onRefresh,
  className
}) => {
  const [showCustody, setShowCustody] = useState(false);
  const [sortAscending, setSortAscending] = useState(false);

  // RBAC Filter: Customers/Merchants don't see private internal audit events
  const isOperationalRole = ['HUB_STAFF', 'CENTER_STAFF', 'HUB_OWNER', 'LOGISTICS_RIDER', 'LOGISTICS_PARTNER', 'SUPER_ADMIN', 'DISPATCHER'].includes(userRole?.toUpperCase() || '');

  const visibleEvents = events.filter(e => {
    if (isOperationalRole) return true;
    return !e.isPrivateInternal && !e.isAuditOnly;
  });

  const sortedEvents = [...visibleEvents].sort((a, b) => {
    const timeA = new Date(a.timestamp || 0).getTime();
    const timeB = new Date(b.timestamp || 0).getTime();
    return sortAscending ? timeA - timeB : timeB - timeA;
  });

  // Calculate dynamic milestones based on parcel fulfillment method & current status
  const currentStatus: ParcelStatus = parcel?.status || (events.length > 0 ? events[0].status : 'DRAFT');
  const isHubPickup = parcel?.fulfillmentMethod === 'HUB_PICKUP' || parcel?.deliveryOption === 'HUB_PICKUP';

  const milestones: MilestoneStep[] = [
    {
      id: 'CREATED',
      label: 'Shipment Created',
      description: 'Shipment registered & payment confirmed in payment protection vault',
      status: ['DRAFT', 'AWAITING_PAYMENT'].includes(currentStatus)
        ? 'current'
        : 'completed'
    },
    {
      id: 'INTAKE',
      label: 'Origin Hub Intake',
      description: 'Parcel dropped off, scanned, and placed in secure hub inventory',
      status: ['RECEIVED_AT_ORIGIN', 'IN_INVENTORY', 'AWAITING_DROP_OFF'].includes(currentStatus)
        ? 'current'
        : ['DRAFT', 'AWAITING_PAYMENT'].includes(currentStatus)
        ? 'upcoming'
        : 'completed'
    }
  ];

  if (isHubPickup) {
    milestones.push(
      {
        id: 'READY',
        label: 'Ready for Collection',
        description: 'Stored on hub shelf & collection PIN issued to recipient',
        status: currentStatus === 'READY_FOR_PICKUP'
          ? 'current'
          : ['COLLECTED', 'RELEASED', 'DELIVERED', 'COMPLETED'].includes(currentStatus)
          ? 'completed'
          : 'upcoming'
      },
      {
        id: 'RELEASED',
        label: 'Collected & Completed',
        description: 'Recipient verified via OTP/PIN & parcel custody handed over',
        status: ['COLLECTED', 'RELEASED', 'DELIVERED', 'COMPLETED'].includes(currentStatus)
          ? 'completed'
          : 'upcoming'
      }
    );
  } else {
    // Doorstep / Logistics Delivery
    milestones.push(
      {
        id: 'DISPATCH',
        label: 'Logistics Pickup & Transit',
        description: 'Assigned to verified rider and in transit to destination zone',
        status: ['IN_TRANSIT', 'ASSIGNED_TO_RIDER', 'AWAITING_DISPATCH'].includes(currentStatus)
          ? 'current'
          : ['ARRIVED_AT_DESTINATION', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COLLECTED', 'COMPLETED'].includes(currentStatus)
          ? 'completed'
          : 'upcoming'
      },
      {
        id: 'DESTINATION_HUB',
        label: 'Destination Hub Arrival',
        description: 'Arrived at destination hub for final mile clearance',
        status: currentStatus === 'ARRIVED_AT_DESTINATION'
          ? 'current'
          : ['OUT_FOR_DELIVERY', 'DELIVERED', 'COLLECTED', 'COMPLETED'].includes(currentStatus)
          ? 'completed'
          : 'upcoming'
      },
      {
        id: 'DELIVERED',
        label: 'Delivered & Released',
        description: 'Delivered to doorstep and signed off by recipient',
        status: ['DELIVERED', 'COLLECTED', 'COMPLETED'].includes(currentStatus)
          ? 'completed'
          : 'upcoming'
      }
    );
  }

  // Calculate Progress Percentage
  const completedCount = milestones.filter(m => m.status === 'completed').length;
  const progressPercent = Math.round((completedCount / milestones.length) * 100);

  // Helper for status badge styling
  const getEventBadge = (evt: TrackingEvent) => {
    if (evt.status?.includes('HOLD') || evt.eventType === 'HOLD' || evt.eventType === 'EXCEPTION') {
      return <Badge variant="warning" className="flex items-center gap-1"><AlertTriangle size={12} /> Hold / Exception</Badge>;
    }
    if (['COLLECTED', 'DELIVERED', 'RELEASED', 'COMPLETED'].includes(evt.status)) {
      return <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 size={12} /> Released</Badge>;
    }
    if (['IN_TRANSIT', 'ASSIGNED_TO_RIDER'].includes(evt.status)) {
      return <Badge variant="info" className="flex items-center gap-1"><Truck size={12} /> In Transit</Badge>;
    }
    if (evt.status === 'READY_FOR_PICKUP') {
      return <Badge variant="warning" className="flex items-center gap-1"><PackageCheck size={12} /> Ready for Pickup</Badge>;
    }
    return <Badge variant="outline" className="flex items-center gap-1"><Clock size={12} /> {evt.status?.replace(/_/g, ' ')}</Badge>;
  };

  const isHoldStatus = currentStatus.includes('HOLD') || currentStatus.includes('DISPUTE') || currentStatus.includes('EXCEPTION');

  return (
    <div className={cn("space-y-6", className)}>
      {/* Top Header Card with Milestone Stepper */}
      <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl bg-white dark:bg-slate-900 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white font-display">Unified Parcel Timeline</h2>
              <Badge variant="info" className="text-[10px] uppercase font-mono">Real-Time Sync</Badge>
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Waybill: <span className="font-mono text-slate-900 dark:text-white">{parcel?.trackingNumber || parcel?.id || 'N/A'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onRefresh && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRefresh}
                disabled={isLoading}
                className="h-9 font-bold border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <RefreshCw size={14} className={cn("mr-1.5", isLoading && "animate-spin")} /> Refresh
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSortAscending(!sortAscending)}
              className="h-9 font-bold text-xs"
            >
              Order: {sortAscending ? 'Oldest First' : 'Newest First'}
            </Button>
          </div>
        </div>

        {/* Exception / Hold Notice */}
        {isHoldStatus && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/50 flex items-start gap-3">
            <ShieldAlert size={22} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300">
                Action Required / Operational Hold
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-400">
                This parcel is currently under status <strong className="font-mono">{currentStatus}</strong>. Our logistics and compliance operations team is verifying details.
              </p>
            </div>
          </div>
        )}

        {/* Milestone Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
            <span>Workflow Completion Progress</span>
            <span className="text-primary-600 font-mono text-sm">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Stepper Dots */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {milestones.map((m) => (
              <div key={m.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
                  m.status === 'completed' && "bg-emerald-500 text-white",
                  m.status === 'current' && "bg-primary-600 text-white animate-pulse ring-4 ring-primary-100 dark:ring-primary-950",
                  m.status === 'upcoming' && "bg-slate-200 dark:bg-slate-700 text-slate-800"
                )}>
                  {m.status === 'completed' ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-current" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{m.label}</p>
                  <p className="text-[10px] text-slate-800 dark:text-slate-200 uppercase font-mono tracking-wider">{m.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Main Events Feed & Custody Section */}
      <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl bg-white dark:bg-slate-900 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
            Activity & Event Log ({sortedEvents.length})
          </h3>

          {isOperationalRole && custodyChain.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCustody(!showCustody)}
              className="font-bold text-xs flex items-center gap-1.5"
            >
              <ShieldCheck size={14} className="text-emerald-600" />
              Custody Chain ({custodyChain.length})
              {showCustody ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </Button>
          )}
        </div>

        {/* Operational Custody Chain Panel */}
        {showCustody && isOperationalRole && custodyChain.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Lock size={12} className="text-amber-500" /> Physical Chain of Custody (Authoritative)
              </span>
              <span className="text-[10px] font-mono text-slate-800 dark:text-slate-200">RESTRICTED OPERATIONAL VIEW</span>
            </div>

            <div className="space-y-2">
              {custodyChain.map((custody, idx) => (
                <div key={custody.id || idx} className="p-3 bg-white dark:bg-slate-900 rounded-lg text-xs space-y-1.5 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                      <span>Holder: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] font-mono">{custody.currentHolderId}</code></span>
                      <ArrowRight size={12} className="text-slate-800" />
                      <span>Prev: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] font-mono">{custody.previousHolderId}</code></span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-800 dark:text-slate-200">
                      {new Date(custody.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-800 dark:text-slate-200">
                    <span>Condition: <strong className="text-slate-900 dark:text-white">{custody.condition}</strong></span>
                    <span>Hub: <strong className="text-slate-900 dark:text-white">{custody.locationId}</strong></span>
                    {custody.verificationMethod && <span>Verification: <strong className="text-emerald-600 dark:text-emerald-400">{custody.verificationMethod}</strong></span>}
                  </div>

                  {custody.notes && (
                    <p className="text-[11px] italic text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 p-2 rounded">
                      "{custody.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline List */}
        {sortedEvents.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <PackageCheck size={40} className="mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No tracking history recorded yet.</p>
            <p className="text-xs text-slate-800 dark:text-slate-200 max-w-sm mx-auto">
              Events will automatically appear here as the parcel moves through our verified network.
            </p>
          </div>
        ) : (
          <div className="relative space-y-8 pl-4 sm:pl-6">
            {/* Timeline Vertical Bar */}
            <div className="absolute left-[19px] sm:left-[27px] top-3 bottom-3 w-0.5 bg-slate-200 dark:bg-slate-800" />

            {sortedEvents.map((evt, idx) => (
              <div key={evt.id || idx} className="flex items-start gap-4 sm:gap-6 relative z-10">
                {/* Event Marker Node */}
                <div className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 border-4 border-white dark:border-slate-900 shadow-sm font-bold text-xs",
                  evt.status?.includes('HOLD') || evt.eventType === 'HOLD' || evt.eventType === 'EXCEPTION'
                    ? "bg-amber-500 text-white"
                    : ['COLLECTED', 'DELIVERED', 'RELEASED', 'COMPLETED'].includes(evt.status)
                    ? "bg-emerald-500 text-white"
                    : ['IN_TRANSIT', 'ASSIGNED_TO_RIDER'].includes(evt.status)
                    ? "bg-primary-600 text-white"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                )}>
                  {['COLLECTED', 'DELIVERED', 'RELEASED', 'COMPLETED'].includes(evt.status) ? (
                    <CheckCircle2 size={18} />
                  ) : ['IN_TRANSIT', 'ASSIGNED_TO_RIDER'].includes(evt.status) ? (
                    <Truck size={18} />
                  ) : evt.status?.includes('HOLD') || evt.eventType === 'HOLD' ? (
                    <ShieldAlert size={18} />
                  ) : (
                    <PackageCheck size={18} />
                  )}
                </div>

                {/* Event Content Body */}
                <div className="flex-1 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900 dark:text-white font-display">
                        {evt.statusDescription || evt.remarks || evt.status?.replace(/_/g, ' ')}
                      </span>
                      {getEventBadge(evt)}
                    </div>

                    <div className="text-left sm:text-right shrink-0 text-xs font-medium text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-1 sm:justify-end font-bold text-slate-900 dark:text-white">
                        <Clock size={12} className="text-slate-800" />
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <span className="text-[11px] text-slate-800 dark:text-slate-200">{new Date(evt.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Location & Actor Details */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-800 dark:text-slate-200 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                    <span className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
                      <MapPin size={13} className="text-primary-600 shrink-0" />
                      {evt.locationName || evt.location || 'WeSabiHub Logistics Point'}
                    </span>

                    {evt.actorRole && (
                      <span className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px]">
                        <UserCheck size={12} className="text-slate-800" />
                        {evt.actorRole.replace(/_/g, ' ')}
                      </span>
                    )}

                    {isOperationalRole && evt.hubId && (
                      <span className="flex items-center gap-1 font-mono text-[10px] text-slate-800 dark:text-slate-200">
                        <Building2 size={12} /> Hub: {evt.hubId}
                      </span>
                    )}
                  </div>

                  {/* Operational details if logged in as staff */}
                  {isOperationalRole && (evt.relatedLogisticsJobId || evt.relatedShiftId || evt.metadata) && (
                    <div className="pt-2 text-[10px] font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-wrap gap-3">
                      {evt.relatedLogisticsJobId && <span>Job: <strong>{evt.relatedLogisticsJobId}</strong></span>}
                      {evt.relatedShiftId && <span>Shift: <strong>{evt.relatedShiftId}</strong></span>}
                      {evt.metadata?.shelfLocation && <span>Shelf: <strong className="text-amber-600 dark:text-amber-400">{evt.metadata.shelfLocation}</strong></span>}
                      {evt.metadata?.otpVerified && <span className="text-emerald-600 font-bold">✓ OTP Verified</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
