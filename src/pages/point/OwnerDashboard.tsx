import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { PointLayout } from '@/src/layouts/PointLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Input } from '@/src/components/ui/Input';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { useSettings } from '@/src/context/SettingsContext';
import { BannerPreview } from '@/src/components/marketing/BannerPreview';
import { Parcel } from '@/src/types';
import {
  Package,
  PackagePlus,
  PackageCheck,
  Boxes,
  TrendingUp,
  Wallet,
  Users,
  Clock,
  AlertCircle,
  ArrowRight,
  Plus,
  Search,
  CheckCircle2,
  Zap,
  Star,
  Scale,
  Award,
  History,
  ShieldCheck,
  ChevronRight,
  Filter,
  Camera,
  Signature as SigIcon,
  X,
  FileText,
  MapPin,
  Laptop,
  Key,
  Info,
  Activity
} from 'lucide-react';
import {
  centreEngine,
  parcelEngine,
  auditEngine
} from '@/src/engines';

export const PointOwnerDashboard = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<'overview' | 'collections'>('overview');
  const [loading, setLoading] = useState(true);
  const [hub, setHub] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);

  // Real dynamic parcel state
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [filteredParcels, setFilteredParcels] = useState<Parcel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COLLECTED' | 'PENDING' | 'FAILED'>('ALL');

  // Selection drawer for collection details
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);

  useEffect(() => {
    if (user) {
      fetchHubData();
    }
  }, [user]);

  const fetchHubData = async () => {
    try {
      setLoading(true);
      const activeHub = await centreEngine.getHubByOwner(user!.uid);
      setHub(activeHub);

      const hubId = activeHub?.id || 'NO_HUB';

      // Fetch dynamic parcels
      const hubParcels = await parcelEngine.getParcelsByHub(hubId, 'destination');

      setParcels(hubParcels);
      setFilteredParcels(hubParcels);

      // Fetch audit logs
      const logs = await auditEngine.getAuditLogs(user!.uid, 10);
      setAuditLogs(logs);

      // Fetch staff
      const staff = await centreEngine.getHubStaff(hubId);
      setStaffList(staff);

    } catch (error) {
      console.error('Error fetching Point owner dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic filter handler
  useEffect(() => {
    let result = parcels;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        p.trackingNumber.toLowerCase().includes(q) ||
        p.recipientInfo.name.toLowerCase().includes(q) ||
        (p.recipientInfo.phone && p.recipientInfo.phone.includes(q))
      );
    }

    // Status filter
    if (statusFilter === 'COLLECTED') {
      result = result.filter(p => p.status === 'COLLECTED');
    } else if (statusFilter === 'PENDING') {
      result = result.filter(p => p.status === 'READY_FOR_PICKUP' || p.status === 'ARRIVED_AT_DESTINATION');
    } else if (statusFilter === 'FAILED') {
      result = result.filter(p => (p.pickupPinAttempts && p.pickupPinAttempts >= 3) || ['DAMAGED', 'LOST', 'DISPUTED'].includes(p.status));
    }

    setFilteredParcels(result);
  }, [searchQuery, statusFilter, parcels]);

  // Dynamic metrics computations
  const totalParcelsCount = parcels.length;
  const todayDateString = new Date().toDateString();

  const todayCollections = parcels.filter(p =>
    p.status === 'COLLECTED' &&
    p.collectionStaff?.timestamp &&
    new Date(p.collectionStaff.timestamp).toDateString() === todayDateString
  ).length;

  const pendingPickups = parcels.filter(p =>
    p.status === 'AWAITING_PICKUP' || p.status === 'ARRIVED'
  ).length;

  const failedAttemptsCount = parcels.filter(p =>
    p.pickupPinAttempts && p.pickupPinAttempts > 0
  ).length;

  const signatureComplianceRate = totalParcelsCount > 0
    ? Math.round((parcels.filter(p => p.signatureUrl).length / parcels.filter(p => p.status === 'COLLECTED').length || 1) * 100)
    : 100;

  const stats = [
    { label: 'Parcels in Stock', value: String(pendingPickups + parcels.filter(p => p.status === 'COLLECTED').length), icon: Boxes, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', trend: 'Live Inventory' },
    { label: 'Released Today', value: String(todayCollections), icon: PackageCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', trend: 'Collected' },
    { label: 'Pending Collections', value: String(pendingPickups), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', trend: 'Awaiting Pickup' },
    { label: 'Verification Failures', value: String(failedAttemptsCount), icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', trend: 'Security Logs' },
  ];

  const inventorySummary = [
    { label: 'Awaiting Pickup', value: pendingPickups, color: 'bg-amber-500' },
    { label: 'Awaiting Dispatch', value: parcels.filter(p => p.status === 'TRANSITING').length, color: 'bg-blue-500' },
    { label: 'In Storage', value: parcels.filter(p => p.status === 'RECEIVED').length, color: 'bg-primary-600' },
  ];

  if (loading) {
    return (
      <PointLayout>
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-900 font-medium">Analyzing dashboard datasets...</p>
          </div>
        </div>
      </PointLayout>
    );
  }

  if (!hub) {
    return (
      <PointLayout>
        <div className="p-8 flex items-center justify-center min-h-[400px]">
           <Card className="p-10 max-w-lg text-center flex flex-col items-center border-dashed border-2 border-slate-200">
             <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <ShieldCheck size={32} className="text-slate-600" />
             </div>
             <h2 className="text-2xl font-black font-display dark:text-white mb-2">No Hub Configured</h2>
             <p className="text-slate-900 mb-8 font-medium">Your account is registered as a Center Owner, but there is no active hub profile associated with your user ID. Please complete your hub registration or contact the platform administrator to map your account to a Hub.</p>
             <Button asChild className="h-12 px-8 rounded-xl font-bold bg-primary-600 hover:bg-primary-700 text-white">
               <Link to="/point/profile">Complete Hub Profile</Link>
             </Button>
           </Card>
        </div>
      </PointLayout>
    );
  }

  return (
    <PointLayout>
      <div className="space-y-8 pb-16">

        {/* Header Branding */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-black dark:text-white font-display flex items-center gap-2.5">
              {hub?.name || 'Loading Hub...'}
            </h1>
            <p className="text-slate-900 text-sm">Review hub capacity, parcel collection histories, and employee custody records.</p>
          </div>

          <div className="flex items-center gap-3">
             <Button variant="outline" className="rounded-xl flex items-center gap-2" asChild>
                <Link to="/point/shifts">
                   <Clock size={16} /> Schedule
                </Link>
             </Button>
             <Button className="rounded-xl px-6 shadow-lg shadow-primary-500/10 flex items-center gap-2" asChild>
                <Link to="/point/employees">
                   <Plus size={16} /> Add Staff
                </Link>
             </Button>
          </div>
        </div>

        {/* Pending Application Banner */}
        {(user?.pendingRoleApplication || hub?.status === 'PENDING') && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Hub Center Application Under Review</h4>
                <p className="text-xs text-amber-800 dark:text-amber-300">Your Hub application is currently being audited by the Verification Desk. You can configure your profile, business details, and staff while Admin completes verification.</p>
              </div>
            </div>
            <Badge variant="warning" className="shrink-0 bg-amber-500 text-slate-950 font-black">
              UNDER REVIEW
            </Badge>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              "px-6 py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
              activeTab === 'overview'
                ? "border-primary-600 text-primary-600 dark:text-primary-400"
                : "border-transparent text-slate-800 hover:text-slate-800"
            )}
          >
            <Boxes size={16} /> General Overview
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={cn(
              "px-6 py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
              activeTab === 'collections'
                ? "border-primary-600 text-primary-600 dark:text-primary-400"
                : "border-transparent text-slate-800 hover:text-slate-800"
            )}
          >
            <PackageCheck size={16} /> Parcel Collection Dashboard
          </button>
        </div>

        {/* Tab Content: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            {/* Dynamic Performance Header */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <Card className="p-6 border-slate-200 dark:border-slate-800 bg-slate-900 text-white flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-primary-600/10 rounded-full blur-3xl" />
                  <div className="relative z-10 space-y-4">
                     <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary-400 uppercase tracking-widest flex items-center gap-1.5">
                           <Scale size={14} /> Trust Performance
                        </span>
                        <Badge variant="success" className="bg-primary-600 text-white font-black text-[10px]">
                           {hub?.tier || 'Standard'} Tier
                        </Badge>
                     </div>
                     <div className="flex items-end justify-between">
                        <div>
                           <span className="text-4xl font-black font-display text-white">
                              {hub?.trustScore || 0}
                           </span>
                           <span className="text-sm font-bold text-slate-800">/100</span>
                        </div>
                        <div className="flex flex-col items-end">
                           <div className="flex gap-0.5 mb-1 text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                 <Star
                                   key={i}
                                   size={16}
                                   fill={i < (hub?.starRating || 0) ? "currentColor" : "none"}
                                   className={i < (hub?.starRating || 0) ? "text-yellow-400" : "text-slate-800"}
                                 />
                              ))}
                           </div>
                           <span className="text-[10px] text-slate-800 font-bold uppercase tracking-widest">
                              {hub?.starRating || 0} Star Rating
                           </span>
                        </div>
                     </div>
                     <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all duration-1000"
                          style={{ width: `${hub?.trustScore || 0}%` }}
                        />
                     </div>
                     <p className="text-xs text-slate-800">
                        High Trust Scores grant up to <strong>1.8x visibility</strong> on search priority.
                     </p>
                  </div>
               </Card>

               <Card className="p-6 border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                           <Zap size={14} /> OmorfiHubPoints Progress
                        </span>
                        <span className="text-[10px] font-bold text-slate-800">
                           25% to Gold
                        </span>
                     </div>
                     <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black font-display text-slate-900 dark:text-white">
                           {hub?.totalPoints || 0}
                        </span>
                        <span className="text-xs font-bold text-slate-800">Points Accumulated</span>
                     </div>
                     <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: '25%' }}
                        />
                     </div>
                     <p className="text-xs text-slate-900">
                        Earn <strong>3,750</strong> more points to promote to <strong className="text-primary-600">Gold</strong>.
                     </p>
                  </div>
               </Card>

               <Card className="p-6 border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                           <Award size={14} /> Platform Standings
                        </span>
                        <Badge variant="info" className="text-[10px]">Lagos State</Badge>
                     </div>
                     <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                           <span className="text-[9px] font-black uppercase tracking-widest text-slate-800 block mb-0.5">National Rank</span>
                           <span className="text-2xl font-black font-display text-slate-900 dark:text-white">
                              {hub?.nationalRanking ? `#${hub.nationalRanking}` : 'N/A'}
                           </span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                           <span className="text-[9px] font-black uppercase tracking-widest text-slate-800 block mb-0.5">Local Rank</span>
                           <span className="text-2xl font-black font-display text-slate-900 dark:text-white">
                              {hub?.localRanking ? `#${hub.localRanking}` : 'N/A'}
                           </span>
                        </div>
                     </div>
                     <p className="text-xs text-slate-900">
                        Calculated in real-time across all active logistics points.
                     </p>
                  </div>
               </Card>
            </div>

            {/* Metrics block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               {stats.map((stat, i) => (
                  <Card key={i} className="p-6 border-slate-200 dark:border-slate-800">
                     <div className="flex items-center justify-between mb-4">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bg, stat.color)}>
                           <stat.icon size={20} />
                        </div>
                        <Badge variant="info" className="h-6 text-[9px]">{stat.trend}</Badge>
                     </div>
                     <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">{stat.label}</p>
                     <h3 className="text-2xl font-black dark:text-white font-display mt-1">{stat.value}</h3>
                  </Card>
               ))}
            </div>

            {/* Banner Preview Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <BannerPreview
                        centerName={hub?.name}
                        centerLogoUrl={hub?.logoUrl}
                        platformName={settings?.platformName || 'OmorfiHub'}
                        platformLogoUrl={settings?.branding?.logoUrl}
                    />
                </div>
                <div className="lg:col-span-1">
                    <Card className="p-6 border-slate-200 dark:border-slate-800 h-full flex flex-col justify-center items-center text-center">
                        <h4 className="font-bold mb-2">Ready to Print?</h4>
                        <p className="text-xs text-slate-900 mb-6">Preview your custom hub banner asset above and use the download button to get the PDF for your local print shop.</p>
                    </Card>
                </div>
            </div>

            {/* Inventory Status & Quick actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <Card className="lg:col-span-2 p-8 border-slate-200 dark:border-slate-800 space-y-8">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                     <div>
                        <h3 className="text-lg font-bold dark:text-white font-display">Current Inventory</h3>
                        <p className="text-xs text-slate-900">Real-time parcel stock capacity.</p>
                     </div>
                     <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs" asChild>
                        <Link to="/point/inventory">Full Inventory</Link>
                     </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     {inventorySummary.map((item, i) => (
                       <div key={i} className="space-y-4">
                          <div className="flex items-end justify-between">
                             <span className="text-sm font-bold dark:text-white">{item.label}</span>
                             <span className="text-2xl font-black text-primary-600 font-display">{item.value}</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                             <div className={cn("h-full rounded-full", item.color)} style={{ width: `${(item.value / 40) * 100}%` }} />
                          </div>
                       </div>
                     ))}
                  </div>
               </Card>

               <div className="space-y-4">
                  <Link to="/point/parcels/release" className="block">
                    <Card className="p-6 border-slate-200 dark:border-slate-800 bg-primary-600 text-white overflow-hidden relative group cursor-pointer">
                       <div className="relative z-10 space-y-4">
                          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                             <PackageCheck size={24} />
                          </div>
                          <div>
                             <h4 className="text-xl font-bold font-display">Release Verification</h4>
                             <p className="text-white/60 text-sm">Two-step QR & PIN release process</p>
                          </div>
                          <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                       </div>
                    </Card>
                  </Link>

                  <Link to="/point/parcels/receive" className="block">
                    <Card className="p-6 border-slate-200 dark:border-slate-800 hover:border-primary-500 transition-all cursor-pointer group">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                             <PackagePlus size={24} />
                          </div>
                          <div>
                             <h4 className="font-bold dark:text-white">Receive Shipment</h4>
                             <p className="text-xs text-slate-900">Log inward parcel shipments</p>
                          </div>
                       </div>
                    </Card>
                  </Link>
               </div>
            </div>

            {/* Staff & Points Log */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <Card className="p-6 border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="font-bold dark:text-white font-display flex items-center gap-2">
                        <Users size={18} className="text-primary-600" />
                        Staff On Duty
                     </h3>
                     <Badge variant="info">Morning Shift</Badge>
                  </div>
                  <div className="space-y-4">
                     {staffList.length === 0 ? (
                        <p className="text-xs text-slate-800 text-center py-4">No staff members currently linked to this hub.</p>
                     ) : staffList.slice(0, 3).map((staff, i) => (
                       <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-900 dark:text-white">
                                {staff.displayName?.charAt(0) || 'U'}
                             </div>
                             <div>
                                <p className="font-bold text-sm dark:text-white">{staff.displayName || 'Unnamed Staff'}</p>
                                <p className="text-[10px] text-slate-900 font-bold uppercase tracking-widest">{staff.role || 'Staff'}</p>
                             </div>
                          </div>
                          <Badge variant={staff.status === 'ACTIVE' ? "success" : "info"} className="h-6">{staff.status || 'ACTIVE'}</Badge>
                       </div>
                     ))}
                  </div>
               </Card>

               <Card className="p-6 border-slate-200 dark:border-slate-800 flex flex-col h-[300px]">
                  <div className="flex items-center justify-between mb-6 shrink-0">
                     <h3 className="font-bold dark:text-white font-display flex items-center gap-2">
                        <History size={18} className="text-primary-600" />
                        Recent Trust Audits
                     </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-4">
                     {auditLogs.length === 0 ? (
                        <p className="text-xs text-slate-800 text-center py-10">No recent trust audits recorded.</p>
                     ) : auditLogs.map((log) => (
                       <div key={log.id} className="flex items-start gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                             <Zap size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center justify-between">
                                <h4 className="font-bold text-xs dark:text-white truncate">{log.action || log.reason}</h4>
                                <span className="text-xs font-bold text-emerald-600">+{log.points || 0}</span>
                             </div>
                             <p className="text-[9px] text-slate-800 mt-1">{new Date(log.timestamp).toLocaleDateString()} • {log.userRole || log.type}</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </Card>
            </div>

          </div>
        )}

        {/* Tab Content: COLLECTIONS (DEDICATED CUSTODY REGISTRY) */}
        {activeTab === 'collections' && (
          <div className="space-y-8 animate-fade-in">

            {/* Collection performance metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-5 border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Today's Collections</span>
                <h3 className="text-3xl font-black dark:text-white mt-1 font-display text-emerald-600">{todayCollections}</h3>
                <p className="text-[10px] text-slate-900 mt-1">Confirmed handovers today</p>
              </Card>

              <Card className="p-5 border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Awaiting Verification</span>
                <h3 className="text-3xl font-black dark:text-white mt-1 font-display text-amber-500">{pendingPickups}</h3>
                <p className="text-[10px] text-slate-900 mt-1">Awaiting QR and PIN scan</p>
              </Card>

              <Card className="p-5 border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Verification Failures</span>
                <h3 className="text-3xl font-black dark:text-white mt-1 font-display text-red-500">{failedAttemptsCount}</h3>
                <p className="text-[10px] text-slate-900 mt-1">Failed validation counts</p>
              </Card>

              <Card className="p-5 border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Signature Compliance</span>
                <h3 className="text-3xl font-black dark:text-white mt-1 font-display text-primary-600">{signatureComplianceRate}%</h3>
                <p className="text-[10px] text-slate-900 mt-1">Signed releases with proofs</p>
              </Card>
            </div>

            {/* Search and Filters */}
            <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-800" size={16} />
                  <Input
                    placeholder="Search by Tracking Number, Recipient Name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 rounded-xl"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl">
                    <button
                      onClick={() => setStatusFilter('ALL')}
                      className={cn("px-3 py-1.5 text-xs font-bold rounded-lg transition-all", statusFilter === 'ALL' ? "bg-white dark:bg-slate-950 text-primary-600 dark:text-primary-400 shadow-sm" : "text-slate-800")}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setStatusFilter('COLLECTED')}
                      className={cn("px-3 py-1.5 text-xs font-bold rounded-lg transition-all", statusFilter === 'COLLECTED' ? "bg-white dark:bg-slate-950 text-emerald-600 shadow-sm" : "text-slate-800")}
                    >
                      Collected
                    </button>
                    <button
                      onClick={() => setStatusFilter('PENDING')}
                      className={cn("px-3 py-1.5 text-xs font-bold rounded-lg transition-all", statusFilter === 'PENDING' ? "bg-white dark:bg-slate-950 text-amber-600 shadow-sm" : "text-slate-800")}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => setStatusFilter('FAILED')}
                      className={cn("px-3 py-1.5 text-xs font-bold rounded-lg transition-all", statusFilter === 'FAILED' ? "bg-white dark:bg-slate-950 text-red-600 shadow-sm" : "text-slate-800")}
                    >
                      Failed
                    </button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Collection Records list */}
            <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 font-bold uppercase tracking-wider text-[9px]">
                      <th className="p-4 pl-6">Tracking Details</th>
                      <th className="p-4">Recipient Collector</th>
                      <th className="p-4">Verifications</th>
                      <th className="p-4">Compliance Check</th>
                      <th className="p-4 text-right pr-6">Handover Log</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredParcels.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-10 text-center text-slate-800 font-bold">No matching parcel collection records found.</td>
                      </tr>
                    ) : (
                      filteredParcels.map((parcel) => (
                        <tr
                          key={parcel.id}
                          onClick={() => setSelectedParcel(parcel)}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 cursor-pointer transition-colors"
                        >
                          <td className="p-4 pl-6">
                            <div className="font-mono font-bold text-slate-900 dark:text-white mb-0.5">{parcel.trackingNumber}</div>
                            <span className="text-[10px] text-slate-800">Shipment: {parcel.shipmentId}</span>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-800 dark:text-slate-200">{parcel.recipientInfo.name}</div>
                            <span className="text-[10px] text-slate-800">{parcel.recipientInfo.phone}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Badge variant={parcel.pickupPinVerified ? "success" : "warning"} className="flex items-center gap-0.5 text-[9px] px-1.5 py-0">
                                <Key size={10} /> PIN
                              </Badge>
                              {parcel.pickupPinAttempts && parcel.pickupPinAttempts > 0 ? (
                                <Badge variant="error" className="text-[9px] px-1.5 py-0">
                                  {parcel.pickupPinAttempts} Failed
                                </Badge>
                              ) : null}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3 text-[10px] text-slate-900">
                              <span className="flex items-center gap-1">
                                <SigIcon size={12} className={parcel.signatureUrl ? "text-emerald-500" : "text-slate-300"} />
                                Sign
                              </span>
                              <span className="flex items-center gap-1">
                                <Camera size={12} className={(parcel.parcelPhotos && parcel.parcelPhotos.length > 0) ? "text-emerald-500" : "text-slate-300"} />
                                Photos
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-right pr-6">
                            {parcel.status === 'COLLECTED' ? (
                              <div className="space-y-0.5">
                                <Badge variant="success">COLLECTED</Badge>
                                <div className="text-[9px] text-slate-800 font-mono">
                                  {parcel.collectionStaff?.timestamp ? new Date(parcel.collectionStaff.timestamp).toLocaleDateString() : ''}
                                </div>
                              </div>
                            ) : (
                              <Badge variant="warning">AWAITING PICKUP</Badge>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

          </div>
        )}

        {/* CUSTODY HANDOVER AUDIT DRAWER / MODAL */}
        <AnimatePresence>
          {selectedParcel && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full max-w-lg bg-white dark:bg-slate-950 h-full shadow-2xl p-6 overflow-y-auto space-y-6"
              >

                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary-600">Custody Audit Ledger</span>
                    <h3 className="text-xl font-black dark:text-white font-display mt-0.5">{selectedParcel.trackingNumber}</h3>
                  </div>
                  <button onClick={() => setSelectedParcel(null)} className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 hover:text-slate-800 flex items-center justify-center">
                    <X size={18} />
                  </button>
                </div>

                {/* Audit Evidence Content */}
                <div className="space-y-6 text-xs text-slate-800 dark:text-slate-300">

                  {/* Status Block */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-800 uppercase tracking-widest block font-bold">Parcel Status</span>
                      <Badge variant={selectedParcel.status === 'COLLECTED' ? 'success' : 'warning'} className="mt-1">{selectedParcel.status}</Badge>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-800 uppercase tracking-widest block font-bold text-right">SafePay Status</span>
                      <Badge variant={selectedParcel.SafePayStatus === 'RELEASED' ? 'success' : 'warning'} className="mt-1 float-right">{selectedParcel.SafePayStatus}</Badge>
                    </div>
                  </div>

                  {/* Recipient collector */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase text-[10px] tracking-wider">Receiver Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-800">Recipient Name:</span>
                        <p className="font-bold dark:text-white mt-0.5">{selectedParcel.recipientInfo.name}</p>
                      </div>
                      <div>
                        <span className="text-slate-800">Phone Connection:</span>
                        <p className="font-bold dark:text-white mt-0.5">{selectedParcel.recipientInfo.phone}</p>
                      </div>
                      {selectedParcel.collectedBy && (
                        <>
                          <div>
                            <span className="text-slate-800">Actual Collector:</span>
                            <p className="font-bold dark:text-white mt-0.5">{selectedParcel.collectedBy.name}</p>
                          </div>
                          <div>
                            <span className="text-slate-800">Authority Relation:</span>
                            <p className="font-bold dark:text-white mt-0.5">{selectedParcel.collectedBy.relation}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Staff Responsibility */}
                  {selectedParcel.collectionStaff && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase text-[10px] tracking-wider">Handover Point Staff</h4>
                      <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between">
                          <span className="text-slate-800">Authorized Employee:</span>
                          <strong className="text-slate-800 dark:text-white">{selectedParcel.collectionStaff.staffName}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-800">Staff Role Level:</span>
                          <strong className="text-slate-800 dark:text-white">{selectedParcel.collectionStaff.staffRole}</strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-800">Verification Terminal:</span>
                          <span className="flex items-center gap-1 text-slate-800 dark:text-white text-[11px]">
                            <Laptop size={12} className="text-slate-800" />
                            <span className="truncate max-w-[200px]">{selectedParcel.collectionStaff.device}</span>
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-800">GPS Release Location:</span>
                          <strong className="text-slate-800 dark:text-white flex items-center gap-1">
                            <MapPin size={12} className="text-emerald-500" />
                            6.4281° N, 3.4219° E
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Evidence Assets: Signature & Photos */}
                  {selectedParcel.signatureUrl && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase text-[10px] tracking-wider">Digital Signature Receipt</h4>
                      <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                        {/* Signature fallback if captured data is insufficient or invalid */}
                        {selectedParcel.signatureUrl.length < 50 ? (
                          <div className="h-14 font-serif italic text-2xl tracking-widest text-slate-800 dark:text-white select-none">{selectedParcel.collectedBy?.name || 'Customer'}</div>
                        ) : (
                          <img src={selectedParcel.signatureUrl} className="max-h-24 object-contain invert dark:invert-0" alt="Customer Signature" />
                        )}
                      </div>
                    </div>
                  )}

                  {selectedParcel.parcelPhotos && selectedParcel.parcelPhotos.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase text-[10px] tracking-wider">Custody Photo Evidence</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedParcel.parcelPhotos.map((photo, index) => (
                          <div key={index} className="aspect-video bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
                            {photo.startsWith('data:') ? (
                              <img src={photo} className="w-full h-full object-cover" alt={`Evidence ${index + 1}`} />
                            ) : (
                              <div className="flex flex-col items-center gap-1 text-slate-800">
                                <Camera size={20} />
                                <span className="text-[10px] font-bold">Evidence Thumbnail</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </PointLayout>
  );
};
