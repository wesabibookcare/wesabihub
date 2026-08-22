import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Boxes,
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Package,
  Clock,
  MapPin,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutGrid,
  List as ListIcon,
  Loader2
} from 'lucide-react';
import { PointLayout } from '@/src/layouts/PointLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { cn, exportToCsv } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { centreEngine, parcelEngine } from '@/src/engines';
import { recoveryEngine } from '@/src/engines/RecoveryEngine';
import { Parcel } from '@/src/types';
import { toast } from 'sonner';

export const InventoryPage = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [hubId, setHubId] = useState<string | null>(null);

  const [selectedRecoveryParcel, setSelectedRecoveryParcel] = useState<Parcel | null>(null);
  const [recoveryReason, setRecoveryReason] = useState<'CUSTOMER_NOT_COLLECTED' | 'CUSTOMER_UNREACHABLE' | 'MAX_STORAGE_EXCEEDED' | 'CUSTOMER_REQUESTED' | 'PLATFORM_INTERVENTION_REQUIRED' | 'OTHER'>('CUSTOMER_NOT_COLLECTED');
  const [recoveryNotes, setRecoveryNotes] = useState('');
  const [submittingRecovery, setSubmittingRecovery] = useState(false);

  const handleRequestRecovery = async () => {
    if (!selectedRecoveryParcel || !user || !hubId) return;
    try {
      setSubmittingRecovery(true);
      await recoveryEngine.submitRecoveryRequest(
        selectedRecoveryParcel.id,
        hubId,
        user.uid,
        user.displayName || user.email || 'Hub Staff',
        recoveryReason,
        recoveryNotes
      );
      toast.success(`Recovery request submitted successfully for parcel ${selectedRecoveryParcel.trackingNumber}`);
      setSelectedRecoveryParcel(null);
      setRecoveryNotes('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit recovery request.');
    } finally {
      setSubmittingRecovery(false);
    }
  };

  const getHoldingDays = (createdAt: string) => {
    return Math.max(1, Math.floor((Date.now() - new Date(createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)));
  };
  useEffect(() => {
    const fetchInventory = async () => {
      if (!user) return;
      try {
        setLoading(true);
        let id = (user as any).hubId;

        if (!id && user.role === 'CENTER_OWNER') {
          const hubs = await centreEngine.getHubsByOwner(user.uid);
          if (hubs.length > 0) id = hubs[0].id;
        }

        if (id) {
          setHubId(id);
          const data = await parcelEngine.getParcelsByHub(id, 'current');
          setParcels(data);
        }
      } catch (err) {
        console.error('Error fetching inventory:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [user]);

  const filteredParcels = parcels.filter(p => {
    const matchesSearch = p.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.recipientInfo.name.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'awaiting pickup') return matchesSearch && (p.status === 'READY_FOR_PICKUP' || p.status === 'ARRIVED_AT_DESTINATION');
    if (activeTab === 'awaiting dispatch') return matchesSearch && (p.status === 'RECEIVED_AT_ORIGIN');
    if (activeTab === 'long stay') {
      const addedDate = new Date(p.createdAt);
      const daysSince = (Date.now() - addedDate.getTime()) / (1000 * 60 * 60 * 24);
      return matchesSearch && daysSince > 3;
    }
    return matchesSearch;
  });

const handleExport = async () => {
    // We'll use the filteredParcels state that is defined lower in the component
    // by calling this via a wrapper or directly using the closure when it's clicked.
    // Wait, let's just make it a normal function that uses the closure.
    // Since it's defined here, it has access to filteredParcels because of hoisting? No, it's a const.
    // Wait, if it's an arrow function, it captures the reference to the lexical environment. It will be called later, so it's fine.
    if (filteredParcels.length === 0) {
      toast.error('No inventory to export');
      return;
    }
    setIsExporting(true);
    try {
      const csvData = filteredParcels.map(p => ({
        TrackingNumber: p.trackingNumber,
        RecipientName: p.recipientInfo.name,
        RecipientPhone: p.recipientInfo.phone,
        Status: p.status,
        AddedDate: new Date(p.createdAt).toLocaleString(),
        Weight: p.weightKg,
        Value: p.value
      }));

      exportToCsv(`HubInventory_${hubId || 'Hub'}_${new Date().toISOString()}.csv`, csvData);

      toast.success('Inventory exported successfully');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export inventory');
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'READY_FOR_PICKUP':
      case 'ARRIVED':
        return <Badge variant="info">Awaiting Pickup</Badge>;
      case 'RECEIVED_AT_ORIGIN':
        return <Badge variant="warning">Awaiting Dispatch</Badge>;
      case 'COLLECTED':
        return <Badge variant="success">Collected</Badge>;
      case 'EXCEPTION':
        return <Badge variant="error">Exception</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <PointLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="animate-spin text-primary-600" size={40} />
          <p className="text-slate-900 font-medium">Syncing hub inventory...</p>
        </div>
      </PointLayout>
    );
  }

  return (
    <PointLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold dark:text-white font-display">Hub Inventory</h1>
            <p className="text-slate-900">Manage all parcels currently stored at hub <span className="font-mono font-bold text-slate-900 dark:text-slate-300">{hubId || 'Unknown'}</span></p>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    viewMode === 'grid' ? "bg-white dark:bg-slate-800 text-primary-600 shadow-sm" : "text-slate-800"
                  )}
                >
                   <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    viewMode === 'list' ? "bg-white dark:bg-slate-800 text-primary-600 shadow-sm" : "text-slate-800"
                  )}
                >
                   <ListIcon size={18} />
                </button>
             </div>
             <Button variant="outline" className="rounded-xl flex items-center gap-2" onClick={handleExport} disabled={isExporting}>
                {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} Export List
             </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
           <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit overflow-x-auto no-scrollbar">
              {['all', 'awaiting pickup', 'awaiting dispatch', 'long stay'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-5 py-2 rounded-xl font-bold text-xs capitalize transition-all shrink-0",
                    activeTab === tab ? "bg-white dark:bg-slate-800 text-primary-600 shadow-sm" : "text-slate-900"
                  )}
                >
                   {tab}
                </button>
              ))}
           </div>

           <div className="flex items-center gap-3 flex-1 lg:max-w-md">
              <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-800 w-4 h-4" />
                 <Input
                   placeholder="Search parcel ID or customer..."
                   className="pl-10 h-11"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>
           </div>
        </div>

        {viewMode === 'list' ? (
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                         <th className="px-6 py-4 text-[10px] font-bold text-slate-800 uppercase tracking-widest">Tracking Number</th>
                         <th className="px-6 py-4 text-[10px] font-bold text-slate-800 uppercase tracking-widest">Recipient</th>
                         <th className="px-6 py-4 text-[10px] font-bold text-slate-800 uppercase tracking-widest">Storage Info</th>
                         <th className="px-6 py-4 text-[10px] font-bold text-slate-800 uppercase tracking-widest">Added</th>
                         <th className="px-6 py-4 text-[10px] font-bold text-slate-800 uppercase tracking-widest">Status</th>
                         <th className="px-6 py-4"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredParcels.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-10 text-center text-slate-800 italic">No parcels found in inventory.</td>
                        </tr>
                      ) : (
                        filteredParcels.map((p, i) => (
                          <tr key={p.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                             <td className="px-6 py-5 font-bold text-sm dark:text-white font-mono">{p.trackingNumber}</td>
                             <td className="px-6 py-5">
                                <p className="font-bold text-sm dark:text-white">{p.recipientInfo.name}</p>
                                <p className="text-[10px] text-slate-900 font-bold uppercase tracking-widest">{p.recipientInfo.phone}</p>
                             </td>
                             <td className="px-6 py-5">
                                <Badge variant="outline" className="rounded-lg h-7 gap-2 bg-slate-100 dark:bg-slate-800 border-none font-bold">
                                   <MapPin size={12} className="text-primary-600" /> {p.status === 'RECEIVED_AT_ORIGIN' ? 'Origin Storage' : 'Destination Storage'}
                                </Badge>
                             </td>
                             <td className="px-6 py-5 text-sm text-slate-900">{new Date(p.createdAt).toLocaleDateString()}</td>
                             <td className="px-6 py-5">
                                {getStatusBadge(p.status)}
                             </td>
                              <td className="px-6 py-5 text-right flex items-center justify-end gap-2">
                                {getHoldingDays(p.createdAt) >= 3 && (
                                  <Button
                                    onClick={() => setSelectedRecoveryParcel(p)}
                                    className="h-8 px-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold gap-1 shadow-sm"
                                  >
                                    <Clock size={12} /> Request Recovery
                                  </Button>
                                )}
                                <span className="text-[10px] text-slate-400 font-mono">({getHoldingDays(p.createdAt)}d)</span>
                              </td>
                           </tr>
                         ))
                       )}
                    </tbody>
                 </table>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                 <p className="text-xs text-slate-900">Showing {filteredParcels.length} of {parcels.length} parcels</p>
                 <div className="flex items-center gap-2">
                    <Button variant="outline" className="h-9 w-9 p-0 rounded-lg"><ChevronLeft size={18} /></Button>
                    <Button className="h-9 w-9 p-0 rounded-lg bg-primary-600">1</Button>
                    <Button variant="outline" className="h-9 w-9 p-0 rounded-lg"><ChevronRight size={18} /></Button>
                 </div>
              </div>
           </Card>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredParcels.map((p, i) => (
                <Card key={p.id} className="p-6 border-slate-200 dark:border-slate-800 hover:border-primary-500 transition-all group relative overflow-hidden">
                   <div className="space-y-6 relative z-10">
                      <div className="flex items-center justify-between">
                         <Badge variant="outline" className="h-7 rounded-lg font-mono font-bold">{p.trackingNumber}</Badge>
                         {getHoldingDays(p.createdAt) >= 3 && (
                           <Badge variant="warning" className="text-[10px] font-bold">
                             {getHoldingDays(p.createdAt)}d Long-Stay
                           </Badge>
                         )}
                      </div>

                      <div className="space-y-1">
                         <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Recipient</p>
                         <h4 className="font-bold text-lg dark:text-white">{p.recipientInfo.name}</h4>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                         <div>
                            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Type</p>
                            <p className="text-sm font-black text-primary-600">{p.weightKg} kg</p>
                         </div>
                         <div>
                            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Added</p>
                            <p className="text-sm font-bold dark:text-white">{new Date(p.createdAt).toLocaleDateString()}</p>
                         </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                         {getStatusBadge(p.status)}
                         {getHoldingDays(p.createdAt) >= 3 && (
                           <Button
                             onClick={() => setSelectedRecoveryParcel(p)}
                             className="h-8 px-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold gap-1 shadow-sm"
                           >
                             <Clock size={12} /> Recovery
                           </Button>
                         )}
                      </div>
                   </div>
                   <div className="absolute -right-4 -bottom-4 text-slate-100 dark:text-slate-800/50 pointer-events-none">
                      <Package size={120} />
                   </div>
                </Card>
              ))}
           </div>
         )}

        {/* Recovery Request Modal */}
        <AnimatePresence>
          {selectedRecoveryParcel && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <Badge className="bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30 text-[10px] font-black uppercase mb-1">
                      Long-Stay Parcel Recovery Request
                    </Badge>
                    <h3 className="text-xl font-bold dark:text-white font-mono">{selectedRecoveryParcel.trackingNumber}</h3>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedRecoveryParcel(null)} className="h-9 w-9 p-0 rounded-full">
                    ✕
                  </Button>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 flex items-center gap-3">
                    <Clock size={24} className="text-orange-600 shrink-0" />
                    <div>
                      <p className="font-bold text-orange-800 dark:text-orange-300">Held for {getHoldingDays(selectedRecoveryParcel.createdAt)} days</p>
                      <p className="text-[11px] text-orange-700/80 dark:text-orange-400">This parcel has exceeded normal storage duration without recipient collection.</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Structured Reason for Recovery</label>
                    <select
                      value={recoveryReason}
                      onChange={(e) => setRecoveryReason(e.target.value as any)}
                      className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-bold dark:text-white"
                    >
                      <option value="CUSTOMER_NOT_COLLECTED">Customer has not collected parcel within permitted period</option>
                      <option value="CUSTOMER_UNREACHABLE">Customer cannot be contacted</option>
                      <option value="MAX_STORAGE_EXCEEDED">Parcel exceeded maximum storage period</option>
                      <option value="CUSTOMER_REQUESTED">Customer requested return or intervention</option>
                      <option value="PLATFORM_INTERVENTION_REQUIRED">Platform intervention required</option>
                      <option value="OTHER">Other operational reason</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Hub Operator Notes / Audit Comments</label>
                    <textarea
                      value={recoveryNotes}
                      onChange={(e) => setRecoveryNotes(e.target.value)}
                      placeholder="Provide additional details regarding customer contact attempts or storage status..."
                      className="w-full h-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setSelectedRecoveryParcel(null)} className="rounded-xl px-5 h-10 font-bold">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRequestRecovery}
                    disabled={submittingRecovery}
                    className="bg-primary-600 hover:bg-primary-500 text-white rounded-xl px-6 h-10 font-bold shadow-lg shadow-primary-950/50 flex items-center gap-2"
                  >
                    {submittingRecovery && <Loader2 size={14} className="animate-spin" />}
                    Submit Recovery Request
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Capacity Warning */}
        <div className="flex items-center gap-4 p-5 rounded-2xl bg-primary-600 text-white shadow-xl shadow-primary-600/20">
           <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Boxes size={24} />
           </div>
           <div className="flex-1">
              <h4 className="font-bold font-display">Inventory Capacity: 82%</h4>
              <p className="text-white/70 text-xs">You have space for approximately 35 more standard parcels.</p>
           </div>
           <Button className="bg-white text-primary-600 hover:bg-slate-50 font-bold rounded-xl h-10 px-6">Optimize Storage</Button>
        </div>
      </div>
    </PointLayout>
  );
};
