import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  MapPin,
  AlertTriangle,
  Package,
  ShieldCheck,
  Truck,
  Store,
  UserCheck,
  FileText,
  RefreshCw,
  Info,
  Lock
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Parcel, TrackingEvent, ParcelMilestone } from '../../types';
import { timelineEngine } from '../../engines/TimelineEngine';
import { cn } from '../../lib/utils';

interface ParcelTimelineProps {
  parcel: Parcel;
  userRole?: 'CUSTOMER' | 'MERCHANT' | 'HUB_STAFF' | 'LOGISTICS_RIDER' | 'SUPER_ADMIN' | 'PUBLIC';
  className?: string;
  onRefresh?: () => void;
}

export const ParcelTimeline: React.FC<ParcelTimelineProps> = ({
  parcel,
  userRole = 'CUSTOMER',
  className,
  onRefresh
}) => {
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [milestones, setMilestones] = useState<ParcelMilestone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'MILESTONES' | 'DETAILED_LOG'>('MILESTONES');

  const loadTimeline = async () => {
    if (!parcel?.id) return;
    setLoading(true);
    try {
      const fetchedEvents = await timelineEngine.getTimelineForUser(
        parcel.id || parcel.shipmentId,
        userRole,
        'asc'
      );
      setEvents(fetchedEvents);

      const computedMilestones = timelineEngine.generateMilestones(parcel, fetchedEvents);
      setMilestones(computedMilestones);
    } catch (err) {
      console.error('Failed to load parcel timeline events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, [parcel?.id, parcel?.status, userRole]);

  const handleManualRefresh = async () => {
    await loadTimeline();
    if (onRefresh) onRefresh();
  };

  const getEventIcon = (evt: TrackingEvent) => {
    switch (evt.eventType) {
      case 'PAYMENT':
        return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      case 'CUSTODY_TRANSFER':
        return <Store className="w-5 h-5 text-indigo-600" />;
      case 'RELEASE':
        return <UserCheck className="w-5 h-5 text-emerald-600" />;
      case 'HOLD':
      case 'EXCEPTION':
      case 'DISPUTE':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      default:
        if (evt.status === 'IN_TRANSIT') return <Truck className="w-5 h-5 text-blue-600" />;
        return <Package className="w-5 h-5 text-primary-600" />;
    }
  };

  if (loading) {
    return (
      <Card className={cn("p-8 text-center space-y-4", className)}>
        <RefreshCw className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
        <p className="text-sm text-slate-500 font-medium">Loading authoritative parcel timeline...</p>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold dark:text-white font-display">Parcel Tracking & Custody Timeline</h3>
            <Badge variant="info" className="text-[10px] uppercase font-mono">
              Authoritative
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Tracking #: {parcel.trackingNumber} • Method: {parcel.fulfillmentMethod?.replace('_', ' ')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center text-xs font-bold">
            <button
              onClick={() => setActiveTab('MILESTONES')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all",
                activeTab === 'MILESTONES' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Milestones Progress
            </button>
            <button
              onClick={() => setActiveTab('DETAILED_LOG')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all",
                activeTab === 'DETAILED_LOG' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Audit & Activity Log ({events.length})
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualRefresh}
            className="h-8 w-8 p-0 rounded-xl"
            title="Refresh Timeline"
          >
            <RefreshCw size={14} className="text-slate-600 dark:text-slate-400" />
          </Button>
        </div>
      </div>

      {/* View Mode 1: Milestones Progress */}
      {activeTab === 'MILESTONES' && (
        <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-6">
          <div className="space-y-8 relative">
            <div className="absolute left-6 top-3 bottom-3 w-0.5 bg-slate-200 dark:bg-slate-800" />

            {milestones.map((m, idx) => {
              const isCompleted = m.status === 'COMPLETED';
              const isCurrent = m.status === 'CURRENT';
              const isException = m.status === 'EXCEPTION';

              return (
                <div key={m.key} className="flex gap-6 relative z-10 items-start group">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 border-white dark:border-slate-900 transition-all shadow-sm font-bold text-sm",
                    isCompleted ? "bg-emerald-500 text-white" :
                    isCurrent ? "bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900/40 animate-pulse" :
                    isException ? "bg-amber-500 text-white" :
                    "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  )}>
                    {isCompleted ? <CheckCircle2 size={22} /> :
                     isException ? <AlertTriangle size={22} /> :
                     isCurrent ? <Clock size={22} /> :
                     <span className="font-mono text-xs">{idx + 1}</span>}
                  </div>

                  <div className="flex-1 space-y-1 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-bold text-sm",
                          isCompleted ? "text-slate-900 dark:text-white" :
                          isCurrent ? "text-primary-600 dark:text-primary-400 font-extrabold" :
                          "text-slate-500"
                        )}>
                          {m.title}
                        </span>

                        {isCurrent && (
                          <Badge variant="info" className="text-[10px] uppercase font-mono animate-pulse">
                            Active State
                          </Badge>
                        )}
                      </div>

                      {m.timestamp && (
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          {new Date(m.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {m.description}
                    </p>

                    {m.location && (
                      <div className="flex items-center gap-1.5 pt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        <MapPin size={12} className="text-primary-600" />
                        <span>{m.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* View Mode 2: Detailed Audit & Activity Log */}
      {activeTab === 'DETAILED_LOG' && (
        <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-6">
          {events.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Info className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm text-slate-600 dark:text-slate-400">No detailed timeline logs found for this parcel.</p>
            </div>
          ) : (
            <div className="space-y-6 relative">
              <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-800" />

              {events.map((evt) => (
                <div key={evt.id} className="flex gap-4 relative z-10 items-start">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center shrink-0 shadow-sm">
                    {getEventIcon(evt)}
                  </div>

                  <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm dark:text-white">
                          {evt.statusDescription || evt.remarks || evt.status}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono uppercase">
                          {evt.eventType || 'STATUS'}
                        </Badge>
                      </div>

                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(evt.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {evt.remarks}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono border-t border-slate-100 dark:border-slate-800/80">
                      {evt.locationName && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-primary-600" /> {evt.locationName}
                        </span>
                      )}

                      {evt.actorRole && (
                        <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px]">
                          Actor: {evt.actorRole}
                        </span>
                      )}

                      {evt.metadata?.shelfLocation && (
                        <span className="text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                          Shelf: #{evt.metadata.shelfLocation}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
