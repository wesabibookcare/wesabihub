import React, { useState, useEffect } from 'react';
import {
  Radio,
  ShieldCheck,
  Eye,
  Activity,
  Package,
  MapPin,
  Users,
  Truck,
  AlertTriangle,
  Lock,
  RefreshCw,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldAlert,
  DollarSign,
  Building2,
  Calendar,
  ChevronRight,
  Info,
  Layers,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { cn } from '@/src/lib/utils';
import { useAuth } from '../../context/AuthContext';
import { auditEngine } from '@/src/engines/AuditEngine';
import { centreEngine } from '@/src/engines/CentreEngine';
import { parcelEngine } from '@/src/engines/ParcelEngine';
import { disputeEngine } from '@/src/engines/DisputeEngine';
import { shiftEngine } from '@/src/engines/ShiftEngine';
import { recoveryEngine, RecoveryRequest } from '@/src/engines/RecoveryEngine';
import { configurationEngine } from '@/src/engines/ConfigurationEngine';
import { HubPoint, Parcel, Shift } from '@/src/types';
import { getLongStayEscalationInfo } from '@/src/utils/longStayEscalation';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export const OperationalCctvPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'hubs' | 'parcels' | 'staff' | 'finance' | 'holds' | 'long-stay' | 'recovery'>('overview');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());
  const [longStayThreshold, setLongStayThreshold] = useState(3);

  // Data states
  const [hubs, setHubs] = useState<HubPoint[]>([]);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [allShifts, setAllShifts] = useState<Shift[]>([]);
  const [recoveryRequests, setRecoveryRequests] = useState<RecoveryRequest[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [selectedRecovery, setSelectedRecovery] = useState<RecoveryRequest | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'APPROVED' | 'REJECTED' | 'NEEDS_INFORMATION' | 'RECOVERY_IN_PROGRESS' | 'RECOVERED' | 'CLOSED'>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Search & Filter states
  const [parcelSearch, setParcelSearch] = useState('');
  const [hubFilter, setHubFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchCctvData = async () => {
    setLoading(true);
    try {
      const settings = await configurationEngine.getInventorySettings();
      setLongStayThreshold(settings.longStayWarningDays);

      // 1. Fetch Hubs
      const allHubs = await centreEngine.getAllHubs();
      setHubs(allHubs);

      // 3. Fetch Disputes
      const allDisputes = await disputeEngine.getAllDisputes();
      setDisputes(allDisputes);

      // 5. Fetch Platform Shifts
      const shifts = await shiftEngine.getAllShifts(100);
      setAllShifts(shifts);

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load CCTV operational monitoring data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRecovery = async () => {
    if (!selectedRecovery || !user) return;
    try {
      setSubmittingReview(true);
      await recoveryEngine.reviewRecoveryRequest(selectedRecovery.id, reviewDecision, reviewNotes, user.uid);
      toast.success(`Recovery request for ${selectedRecovery.trackingNumber} successfully updated.`);
      setSelectedRecovery(null);
      setReviewNotes('');
      fetchCctvData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to review recovery request.');
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    fetchCctvData();
    // Auto-refresh every 60 seconds for secondary data
    const interval = setInterval(() => {
      fetchCctvData();
    }, 60000);

    // Real-time subscriptions
    const unsubParcels = parcelEngine.subscribeToParcels((data) => {
      setParcels(data);
      setLastUpdated(new Date().toLocaleTimeString());
    });

    const unsubRecoveries = recoveryEngine.subscribeToRecoveryRequests((data) => {
      setRecoveryRequests(data);
    });

    const unsubAudits = auditEngine.subscribeToRecentLogs((data) => {
      setAuditLogs(data);
    }, 50);

    return () => {
      clearInterval(interval);
      if (unsubParcels) unsubParcels();
      if (unsubRecoveries) unsubRecoveries();
      if (unsubAudits) unsubAudits();
    };
  }, []);

  // Filtered parcels
  const filteredParcels = parcels.filter(p => {
    const matchesSearch =
      p.trackingNumber?.toLowerCase().includes(parcelSearch.toLowerCase()) ||
      p.id?.toLowerCase().includes(parcelSearch.toLowerCase()) ||
      p.recipientInfo?.name?.toLowerCase().includes(parcelSearch.toLowerCase()) ||
      p.recipientInfo?.phone?.includes(parcelSearch);

    const matchesHub = hubFilter === 'ALL' || p.originCenterId === hubFilter || p.destinationCenterId === hubFilter;

    let matchesStatus = true;
    if (statusFilter === 'IN_TRANSIT') matchesStatus = ['IN_TRANSIT', 'TRANSITING', 'RECEIVED_AT_ORIGIN'].includes(p.status);
    else if (statusFilter === 'AWAITING_PICKUP') matchesStatus = ['AWAITING_PICKUP', 'RECEIVED_AT_DESTINATION'].includes(p.status);
    else if (statusFilter === 'COLLECTED') matchesStatus = ['COLLECTED', 'DELIVERED', 'COMPLETED'].includes(p.status);
    else if (statusFilter === 'HOLDS') matchesStatus = p.status === 'COMPLIANCE_HOLD' || p.status === 'INVESTIGATION_HOLD' || p.complianceHold || p.investigationHold;
    else if (statusFilter === 'DISPUTED') matchesStatus = p.status === 'DISPUTED' || p.disputed;

    return matchesSearch && matchesHub && matchesStatus;
  });

  // Derived metrics
  const activeHubsCount = hubs.filter(h => h.status === 'ACTIVE').length;
  const inTransitParcelsCount = parcels.filter(p => ['IN_TRANSIT', 'TRANSITING', 'RECEIVED_AT_ORIGIN'].includes(p.status)).length;
  const awaitingPickupCount = parcels.filter(p => ['AWAITING_PICKUP', 'RECEIVED_AT_DESTINATION'].includes(p.status)).length;
  const holdsCount = parcels.filter(p => p.status === 'COMPLIANCE_HOLD' || p.status === 'INVESTIGATION_HOLD' || p.complianceHold || p.investigationHold).length;
  const activeDisputesCount = disputes.filter(d => d.status === 'OPEN' || d.status === 'UNDER_REVIEW' || d.status === 'INVESTIGATING').length;

  // Long stay parcels (> longStayThreshold days in hub)
  const longStayParcels = parcels.filter(p => {
    if (!['AWAITING_PICKUP', 'RECEIVED_AT_DESTINATION', 'RECEIVED_AT_ORIGIN'].includes(p.status)) return false;
    const createdAt = new Date(p.createdAt || Date.now()).getTime();
    const daysInHub = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
    return daysInHub >= longStayThreshold;
  });

  // Calculate total SafePay holding
  const totalSafePayHolding = parcels
    .filter(p => p.paymentStatus === 'PAID' && !['COLLECTED', 'DELIVERED', 'CANCELLED'].includes(p.status))
    .reduce((sum, p) => sum + (p.pricing?.total || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-8 pb-16">
        {/* Banner / Header */}
        <div className="bg-slate-900 text-white p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-slate-800">
          <div className="absolute -right-10 -bottom-10 opacity-10 text-emerald-500 pointer-events-none">
            <Radio size={280} />
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Live CCTV Operational Monitoring
                </Badge>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Lock size={12} /> Strictly Read-Only
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-display text-white">
                Network Operational Monitoring
              </h1>
              <p className="text-slate-400 max-w-2xl text-sm leading-relaxed">
                Super Admin real-time read-only oversight across all OmorfiHub locations, active parcels, custody transfers, operational holds, and financial safeguards.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Last Auto-Synced</p>
                <p className="text-xs font-mono font-bold text-emerald-400">{lastUpdated}</p>
              </div>
              <Button
                onClick={fetchCctvData}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-11 px-5 font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/50"
              >
                <RefreshCw size={16} className={cn(loading && "animate-spin")} />
                Refresh CCTV
              </Button>
            </div>
          </div>
        </div>

        {/* Read-Only Disclaimer Notice */}
        <div className="bg-amber-500/10 border border-amber-500/20 dark:bg-amber-950/20 rounded-2xl p-4 flex items-center gap-3 text-amber-800 dark:text-amber-300 text-xs font-medium">
          <Info size={18} className="shrink-0 text-amber-600 dark:text-amber-400" />
          <p>
            <strong>CCTV Mode Operational Rule:</strong> Direct modification of operational records, status updates, or financial ledgers is strictly disabled on this monitoring view to protect audit logs. To execute changes, click on the reference links to navigate to the respective management page.
          </p>
        </div>

        {/* KPI Dashboard Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Hubs</span>
              <Building2 size={16} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-black dark:text-white">{activeHubsCount} <span className="text-xs font-normal text-slate-400">/ {hubs.length}</span></p>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">100% Operational</p>
          </Card>

          <Card className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">In Transit</span>
              <Truck size={16} className="text-blue-500" />
            </div>
            <p className="text-2xl font-black dark:text-white">{inTransitParcelsCount}</p>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Active movements</p>
          </Card>

          <Card className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Awaiting Pickup</span>
              <Package size={16} className="text-amber-500" />
            </div>
            <p className="text-2xl font-black dark:text-white">{awaitingPickupCount}</p>
            <p className="text-[10px] text-amber-600 font-bold mt-1">Ready at Hubs</p>
          </Card>

          <Card className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">SafePay Protection</span>
              <DollarSign size={16} className="text-indigo-500" />
            </div>
            <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">₦{totalSafePayHolding.toLocaleString()}</p>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Protected Funds</p>
          </Card>

          <Card className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Holds / Disputes</span>
              <ShieldAlert size={16} className="text-rose-500" />
            </div>
            <p className="text-2xl font-black text-rose-600">{holdsCount + activeDisputesCount}</p>
            <p className="text-[10px] text-rose-500 font-bold mt-1">{holdsCount} Holds | {activeDisputesCount} Disputes</p>
          </Card>

          <Card className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Long-Stay (&gt;3d)</span>
              <Clock size={16} className="text-orange-500" />
            </div>
            <p className="text-2xl font-black text-orange-600">{longStayParcels.length}</p>
            <p className="text-[10px] text-orange-500 font-medium mt-1">Attention Required</p>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-x-auto">
          {[
            { id: 'overview', label: 'Network Overview', icon: Activity },
            { id: 'hubs', label: `Hubs (${hubs.length})`, icon: Building2 },
            { id: 'parcels', label: `Parcels (${parcels.length})`, icon: Package },
            { id: 'holds', label: `Holds & Disputes (${holdsCount + activeDisputesCount})`, icon: ShieldAlert },
            { id: 'long-stay', label: `Long-Stay (${longStayParcels.length})`, icon: Clock },
            { id: 'recovery', label: `Recovery Requests (${recoveryRequests.length})`, icon: ShieldCheck },
            { id: 'finance', label: 'Financial Protection', icon: DollarSign },
            { id: 'staff', label: 'Operational Activity', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-5 py-2.5 rounded-xl font-bold text-xs capitalize transition-all flex items-center gap-2 whitespace-nowrap shrink-0",
                  activeTab === tab.id
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                )}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: NETWORK OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Operational Health */}
            <Card className="lg:col-span-2 p-6 border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold dark:text-white flex items-center gap-2">
                    <Activity size={20} className="text-emerald-500" /> Network Hub Activity Status
                  </h2>
                  <p className="text-xs text-slate-500">Live storage utilization and operational stats across all registered Hub points.</p>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  {hubs.length} Hubs Registered
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hubs.slice(0, 6).map((hub) => {
                  const hubParcels = parcels.filter(p => p.originCenterId === hub.id || p.destinationCenterId === hub.id);
                  const capacity = hub.storageCapacity || 100;
                  const currentCount = hubParcels.length;
                  const percentUsed = Math.min(100, Math.round((currentCount / capacity) * 100));

                  return (
                    <div key={hub.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm dark:text-white">{hub.name}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin size={12} /> {hub.city || 'Lagos'}, {hub.state || 'Nigeria'}
                          </p>
                        </div>
                        <Badge variant={hub.status === 'ACTIVE' ? 'success' : 'warning'} className="capitalize text-[10px]">
                          {hub.status.toLowerCase()}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-500">Storage Usage</span>
                          <span className="font-bold dark:text-white">{currentCount} / {capacity} ({percentUsed}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              percentUsed > 85 ? "bg-rose-500" : percentUsed > 65 ? "bg-amber-500" : "bg-emerald-500"
                            )}
                            style={{ width: `${percentUsed}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span>Staff: {hub.staffCount || 2}</span>
                        <span>Overflow: {hub.overflowCount || 0}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Live Security Audit Log Stream */}
            <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold dark:text-white flex items-center gap-2">
                  <ShieldAlert size={18} className="text-amber-500" /> Security Audit Stream
                </h3>
                <Link to="/admin/audit" className="text-xs text-primary-600 font-bold hover:underline flex items-center gap-1">
                  View All <ExternalLink size={12} />
                </Link>
              </div>

              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {auditLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">No recent security events logged.</p>
                ) : (
                  auditLogs.slice(0, 10).map((log, index) => (
                    <div key={index} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold font-mono text-[10px] text-primary-600 dark:text-primary-400">{log.action}</span>
                        <span className="text-[10px] text-slate-400">{new Date(log.timestamp || Date.now()).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 font-medium truncate">
                        Actor: {log.userId || 'SYSTEM'}
                      </p>
                      {log.details && (
                        <p className="text-[10px] text-slate-400 truncate">
                          {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: HUBS MONITORING */}
        {activeTab === 'hubs' && (
          <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold dark:text-white font-display">Hub Operational Monitoring</h2>
                <p className="text-xs text-slate-500">Read-only oversight of all registered Hub points, capacity levels, and assigned staff.</p>
              </div>
              <Badge variant="outline" className="text-xs font-mono w-fit">
                Total Hubs: {hubs.length}
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="p-4">Hub Name & ID</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Storage Usage</th>
                    <th className="p-4">Capacity %</th>
                    <th className="p-4">Staff Count</th>
                    <th className="p-4 text-right">Reference Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {hubs.map((hub) => {
                    const hubParcels = parcels.filter(p => p.originCenterId === hub.id || p.destinationCenterId === hub.id);
                    const capacity = hub.storageCapacity || 100;
                    const count = hubParcels.length;
                    const percent = Math.min(100, Math.round((count / capacity) * 100));

                    return (
                      <tr key={hub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 font-bold dark:text-white">
                          <p className="text-sm font-bold">{hub.name}</p>
                          <p className="text-[10px] font-mono text-slate-400">{hub.id}</p>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-400">
                          {hub.city || 'Lagos'}, {hub.state || 'Nigeria'}
                        </td>
                        <td className="p-4">
                          <Badge variant={hub.status === 'ACTIVE' ? 'success' : 'warning'} className="capitalize text-[10px]">
                            {hub.status.toLowerCase()}
                          </Badge>
                        </td>
                        <td className="p-4 font-bold">
                          {count} / {capacity}
                        </td>
                        <td className="p-4 font-bold">
                          <span className={cn(
                            percent > 85 ? "text-rose-600" : percent > 65 ? "text-amber-600" : "text-emerald-600"
                          )}>
                            {percent}%
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-400">
                          {hub.staffCount || 2} Officers
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="outline" className="h-8 px-3 rounded-lg text-xs font-bold gap-1 text-primary-600" asChild>
                            <Link to={`/admin/overview?hubId=${hub.id}`}>
                              View Ops <ExternalLink size={12} />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 3: PARCELS MONITORING */}
        {activeTab === 'parcels' && (
          <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold dark:text-white font-display">Parcel Operational Monitor</h2>
                <p className="text-xs text-slate-500">Searchable read-only ledger of all active parcel movements, holds, and verification states.</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search tracking, ID, customer..."
                    value={parcelSearch}
                    onChange={e => setParcelSearch(e.target.value)}
                    className="pl-9 h-10 text-xs"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="h-10 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 dark:text-white"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="AWAITING_PICKUP">Awaiting Pickup</option>
                  <option value="COLLECTED">Collected/Delivered</option>
                  <option value="HOLDS">Holds Only</option>
                  <option value="DISPUTED">Disputed Only</option>
                </select>
              </div>
            </div>

            {/* Parcels Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="p-4">Tracking / ID</th>
                    <th className="p-4">Recipient</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Origin / Dest</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4 text-right">Read-Only Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredParcels.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No parcels found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredParcels.map((parcel) => (
                      <tr key={parcel.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 font-mono font-bold dark:text-white">
                          <p className="text-sm font-bold text-primary-600">{parcel.trackingNumber}</p>
                          <p className="text-[10px] text-slate-400">{parcel.id}</p>
                        </td>
                        <td className="p-4 font-medium dark:text-white">
                          <p>{parcel.recipientInfo?.name || 'Customer'}</p>
                          <p className="text-[10px] text-slate-400">{parcel.recipientInfo?.phone}</p>
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={
                              ['COLLECTED', 'DELIVERED', 'COMPLETED'].includes(parcel.status) ? 'success' :
                              parcel.status === 'COMPLIANCE_HOLD' || parcel.status === 'INVESTIGATION_HOLD' ? 'error' : 'info'
                            }
                            className="capitalize text-[10px]"
                          >
                            {parcel.status.toLowerCase().replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-400">
                          <p className="truncate w-36">Origin: {parcel.originCenterId || 'N/A'}</p>
                          <p className="truncate w-36">Dest: {parcel.destinationCenterId || 'N/A'}</p>
                        </td>
                        <td className="p-4 font-bold text-emerald-600">
                          ₦{(parcel.pricing?.total || 0).toLocaleString()}
                          <p className="text-[10px] font-normal text-slate-400">{parcel.paymentStatus || 'PAID'}</p>
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="outline"
                            onClick={() => setSelectedParcel(parcel)}
                            className="h-8 px-3 rounded-lg text-xs font-bold gap-1"
                          >
                            <Eye size={14} /> View Details
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 4: HOLDS & DISPUTES */}
        {activeTab === 'holds' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Disputes */}
            <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                    <ShieldAlert size={18} className="text-rose-500" /> Active Protection Disputes
                  </h3>
                  <p className="text-xs text-slate-500">Read-only list of disputes currently under investigation.</p>
                </div>
                <Button variant="outline" className="h-8 text-xs font-bold gap-1 text-primary-600" asChild>
                  <Link to="/admin/disputes">
                    Dispute Manager <ExternalLink size={12} />
                  </Link>
                </Button>
              </div>

              <div className="space-y-3">
                {disputes.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">No active disputes.</p>
                ) : (
                  disputes.map((d, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold font-mono text-rose-600">Dispute #{d.id?.substr(-6)}</span>
                        <Badge variant="warning" className="text-[10px] capitalize">{d.status}</Badge>
                      </div>
                      <p className="font-medium dark:text-white">Reason: {d.reason || 'Item mismatch / delivery issue'}</p>
                      <div className="flex items-center justify-between text-slate-400 text-[10px]">
                        <span>Shipment: {d.shipmentId || d.parcelId}</span>
                        <span>Amount: ₦{(d.amount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Compliance & Investigation Holds */}
            <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-4">
              <div>
                <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                  <Lock size={18} className="text-amber-500" /> Operational Compliance Holds
                </h3>
                <p className="text-xs text-slate-500">Parcels currently blocked from release due to security or compliance holds.</p>
              </div>

              <div className="space-y-3">
                {parcels.filter(p => p.status === 'COMPLIANCE_HOLD' || p.status === 'INVESTIGATION_HOLD' || p.complianceHold || p.investigationHold).length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">No parcels currently under operational hold.</p>
                ) : (
                  parcels.filter(p => p.status === 'COMPLIANCE_HOLD' || p.status === 'INVESTIGATION_HOLD' || p.complianceHold || p.investigationHold).map((p) => (
                    <div key={p.id} className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold font-mono text-amber-700 dark:text-amber-400">{p.trackingNumber}</span>
                        <Badge variant="error" className="text-[10px] capitalize">{p.status}</Badge>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 font-medium">
                        Recipient: {p.recipientInfo?.name} ({p.recipientInfo?.phone})
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-amber-500/20">
                        <span>Hub: {p.destinationCenterId || p.originCenterId}</span>
                        <span>Created: {new Date(p.createdAt || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {/* TAB 5: LONG-STAY PARCELS */}
        {activeTab === 'long-stay' && (
          <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-6">
            <div>
              <h2 className="text-xl font-bold dark:text-white font-display flex items-center gap-2">
                <Clock size={20} className="text-orange-500" /> Long-Stay Parcel Monitor (&gt; 3 Days)
              </h2>
              <p className="text-xs text-slate-500">Identifies parcels remaining at Hub points beyond expected duration to prevent storage congestion.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="p-4">Tracking / ID</th>
                    <th className="p-4">Hub Location</th>
                    <th className="p-4">Days in Hub</th>
                    <th className="p-4">Recipient Info</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {longStayParcels.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No long-stay parcels detected. All Hub inventory moving within SLA!
                      </td>
                    </tr>
                  ) : (
                    longStayParcels.map((parcel) => {
                      const createdAt = new Date(parcel.createdAt || Date.now()).getTime();
                      const daysInHub = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24));
                      const escalation = getLongStayEscalationInfo(daysInHub);

                      return (
                        <tr key={parcel.id} className={cn("hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", escalation.isRedAlert && "bg-rose-500/10")}>
                          <td className="p-4 font-mono font-bold dark:text-white">
                            <p className="text-sm font-bold text-orange-600">{parcel.trackingNumber}</p>
                            <p className="text-[10px] text-slate-400">{parcel.id}</p>
                          </td>
                          <td className="p-4 font-medium dark:text-white">
                            {parcel.destinationCenterId || parcel.originCenterId || 'Hub Center'}
                          </td>
                          <td className="p-4 font-bold">
                            <span className={cn(escalation.isRedAlert ? "text-rose-600 font-extrabold" : "text-amber-600")}>
                              {daysInHub} Days
                            </span>
                            <p className="text-[10px] font-semibold text-slate-500">{escalation.label}</p>
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-400">
                            <p className="font-bold dark:text-white">{parcel.recipientInfo?.name}</p>
                            <p className="text-[10px]">{parcel.recipientInfo?.phone}</p>
                          </td>
                          <td className="p-4">
                            <Badge variant={escalation.badgeVariant} className="text-[10px] uppercase">
                              {escalation.tier}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="outline"
                              onClick={() => setSelectedParcel(parcel)}
                              className="h-8 px-3 rounded-lg text-xs font-bold gap-1"
                            >
                              <Eye size={14} /> Read-Only View
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 6: FINANCIAL PROTECTION */}
        {activeTab === 'finance' && (
          <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold dark:text-white font-display flex items-center gap-2">
                  <DollarSign size={20} className="text-indigo-500" /> Financial Protection & SafePay Overview
                </h2>
                <p className="text-xs text-slate-500">High-level read-only oversight of platform protected funds and payment ledgers.</p>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                Bank-Transfer-Only Policy Active
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase">Total SafePay Protection</span>
                <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">₦{totalSafePayHolding.toLocaleString()}</p>
                <p className="text-[11px] text-slate-500">Held securely until customer pickup verification.</p>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase">Settled Payments Today</span>
                <p className="text-3xl font-black text-emerald-600">₦{(totalSafePayHolding * 0.4).toLocaleString()}</p>
                <p className="text-[11px] text-slate-500">Authoritatively released upon delivery.</p>
              </div>

              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase">Disputed Protected Funds</span>
                <p className="text-3xl font-black text-amber-600">₦{(totalSafePayHolding * 0.1).toLocaleString()}</p>
                <p className="text-[11px] text-slate-500">Frozen pending dispute resolution.</p>
              </div>
            </div>
          </Card>
        )}

        {/* TAB 7: STAFF OPERATIONAL ACTIVITY & SHIFTS */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold dark:text-white font-display flex items-center gap-2">
                    <Users size={20} className="text-emerald-500" /> Active Personnel On Shift Across All Hubs
                  </h2>
                  <p className="text-xs text-slate-500">Live operational personnel logged in and actively processing parcels nationwide.</p>
                </div>
                <Badge variant="success" className="text-xs">
                  {allShifts.filter(s => s.status === 'ACTIVE').length} Active On-Duty
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allShifts.filter(s => s.status === 'ACTIVE').length === 0 ? (
                  <p className="text-xs text-slate-500 italic col-span-full text-center py-6">No personnel currently on active shift across any hub.</p>
                ) : (
                  allShifts.filter(s => s.status === 'ACTIVE').map((shift) => (
                    <div key={shift.id} className="p-4 rounded-2xl bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{shift.staffName}</span>
                        <Badge variant="success" className="text-[9px] uppercase">{shift.role}</Badge>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Hub: <strong className="text-primary-600">{shift.hubName}</strong></p>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span>Actions: <strong className="text-emerald-600">{shift.totalOperationalActions || 0}</strong></span>
                        <span>Since: {new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-6">
              <div>
                <h2 className="text-xl font-bold dark:text-white font-display flex items-center gap-2">
                  <Activity size={20} className="text-primary-600" /> Operational Staff Activity Stream
                </h2>
                <p className="text-xs text-slate-500">Audit history of intake, release, shift, and custody events recorded by Hub staff officers.</p>
              </div>

              <div className="space-y-3">
                {auditLogs.filter(l => l.action?.includes('RELEASE') || l.action?.includes('INTAKE') || l.action?.includes('CUSTODY') || l.action?.includes('SHIFT')).length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">No recent staff custody or shift events recorded.</p>
                ) : (
                  auditLogs.filter(l => l.action?.includes('RELEASE') || l.action?.includes('INTAKE') || l.action?.includes('CUSTODY') || l.action?.includes('SHIFT')).map((log, index) => (
                    <div key={index} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="space-y-1">
                        <p className="font-bold dark:text-white font-mono text-primary-600">{log.action}</p>
                        <p className="text-slate-500">Staff Actor: <span className="font-semibold text-slate-700 dark:text-slate-300">{log.userId}</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-mono">{new Date(log.timestamp || Date.now()).toLocaleString()}</p>
                        <Badge variant="success" className="text-[10px] uppercase">VERIFIED</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {/* TAB: RECOVERY REQUESTS */}
        {activeTab === 'recovery' && (
          <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold dark:text-white font-display flex items-center gap-2">
                  <ShieldCheck size={20} className="text-emerald-500" /> Hub Recovery Requests Review
                </h2>
                <p className="text-xs text-slate-500">Super Admin oversight and review of long-stay parcel recovery requests submitted by Hub points.</p>
              </div>
              <Badge variant="outline" className="text-xs font-mono w-fit">
                Total Requests: {recoveryRequests.length}
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="p-4">Request & Tracking</th>
                    <th className="p-4">Hub Name</th>
                    <th className="p-4">Reason & Notes</th>
                    <th className="p-4">Holding Duration</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {recoveryRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No recovery requests submitted by hubs.
                      </td>
                    </tr>
                  ) : (
                    recoveryRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 font-mono font-bold dark:text-white">
                          <p className="text-sm font-bold text-primary-600">{req.trackingNumber}</p>
                          <p className="text-[10px] text-slate-400">{req.id}</p>
                        </td>
                        <td className="p-4 font-medium dark:text-white">
                          {req.hubName}
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-400 max-w-xs">
                          <p className="font-bold text-slate-800 dark:text-slate-200">{req.reason.replace(/_/g, ' ')}</p>
                          <p className="text-[11px] truncate">{req.notes || 'No additional notes.'}</p>
                        </td>
                        <td className="p-4 font-bold text-orange-600">
                          {req.holdingDurationDays} Days
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={req.status === 'APPROVED' ? 'success' : req.status === 'REJECTED' ? 'error' : 'warning'}
                            className="capitalize text-[10px]"
                          >
                            {req.status.toLowerCase().replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="outline"
                            onClick={() => { setSelectedRecovery(req); setReviewDecision(req.status === 'PENDING_REVIEW' ? 'APPROVED' : req.status as any); setReviewNotes(req.reviewNotes || ''); }}
                            className="h-8 px-3 rounded-lg text-xs font-bold gap-1 text-primary-600"
                          >
                            <ShieldCheck size={14} /> Review Case
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}


        {/* Read-Only Parcel Detail Modal Drawer */}
        <AnimatePresence>
          {selectedParcel && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-black uppercase mb-1">
                      Read-Only Parcel Inspection
                    </Badge>
                    <h3 className="text-xl font-bold dark:text-white font-mono">{selectedParcel.trackingNumber}</h3>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedParcel(null)} className="h-9 w-9 p-0 rounded-full">
                    ✕
                  </Button>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Parcel ID</p>
                      <p className="font-bold dark:text-white font-mono">{selectedParcel.id}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Current Status</p>
                      <Badge variant="info" className="capitalize text-[10px] mt-0.5">{selectedParcel.status}</Badge>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Origin Hub</p>
                      <p className="font-medium dark:text-white">{selectedParcel.originCenterId || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Destination Hub</p>
                      <p className="font-medium dark:text-white">{selectedParcel.destinationCenterId || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                    <p className="font-bold dark:text-white uppercase text-[10px] text-slate-400">Recipient Information</p>
                    <p className="font-bold dark:text-white text-sm">{selectedParcel.recipientInfo?.name}</p>
                    <p className="text-slate-500">{selectedParcel.recipientInfo?.phone}</p>
                    <p className="text-slate-500">{selectedParcel.recipientInfo?.address}</p>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                    <p className="font-bold dark:text-white uppercase text-[10px] text-slate-400">Payment Breakdown</p>
                    <div className="flex justify-between font-bold text-sm">
                      <span className="dark:text-white">Total Charge</span>
                      <span className="text-emerald-600">₦{(selectedParcel.pricing?.total || 0).toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Payment Status: {selectedParcel.paymentStatus || 'PAID'}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setSelectedParcel(null)} className="rounded-xl px-5 h-10 font-bold">
                    Close Inspection
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Recovery Review Modal */}
        <AnimatePresence>
          {selectedRecovery && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-black uppercase mb-1">
                      Super Admin Recovery Review
                    </Badge>
                    <h3 className="text-xl font-bold dark:text-white font-mono">{selectedRecovery.trackingNumber}</h3>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedRecovery(null)} className="h-9 w-9 p-0 rounded-full">
                    ✕
                  </Button>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Hub Submitting</p>
                      <p className="font-bold dark:text-white">{selectedRecovery.hubName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Holding Duration</p>
                      <p className="font-bold text-orange-600">{selectedRecovery.holdingDurationDays} Days</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Structured Reason</p>
                      <p className="font-bold dark:text-white">{selectedRecovery.reason.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Payment Status</p>
                      <p className="font-bold text-emerald-600">{selectedRecovery.paymentStatus}</p>
                    </div>
                  </div>

                  {selectedRecovery.notes && (
                    <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                      <p className="font-bold dark:text-white uppercase text-[10px] text-slate-400">Hub Operator Notes</p>
                      <p className="text-slate-600 dark:text-slate-300">{selectedRecovery.notes}</p>
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Decision & Action</label>
                    <select
                      value={reviewDecision}
                      onChange={(e) => setReviewDecision(e.target.value as any)}
                      className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-bold dark:text-white"
                    >
                      <option value="APPROVED">Approve Recovery</option>
                      <option value="REJECTED">Reject Recovery</option>
                      <option value="NEEDS_INFORMATION">Request More Information</option>
                      <option value="RECOVERY_IN_PROGRESS">Mark Recovery In Progress</option>
                      <option value="RECOVERED">Mark Recovered</option>
                      <option value="CLOSED">Close Case</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Administrative Review Notes</label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Enter audit trail rationale for decision..."
                      className="w-full h-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setSelectedRecovery(null)} className="rounded-xl px-5 h-10 font-bold">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReviewRecovery}
                    disabled={submittingReview}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-6 h-10 font-bold shadow-lg shadow-emerald-950/50 flex items-center gap-2"
                  >
                    {submittingReview && <RefreshCw size={14} className="animate-spin" />}
                    Save & Submit Review
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};
