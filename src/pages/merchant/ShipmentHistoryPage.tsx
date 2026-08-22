import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  History,
  Search,
  Filter,
  Download,
  ArrowRight,
  Package,
  Clock,
  MoreVertical,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  FileText
} from 'lucide-react';
import { MerchantLayout } from '@/src/layouts/MerchantLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { cn, exportToCsv } from '@/src/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/src/context/AuthContext';
import { parcelEngine, centreEngine } from '@/src/engines';
import { Parcel } from '@/src/types';
import { Link } from 'react-router-dom';

export const ShipmentHistoryPage = () => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRangeIdx, setDateRangeIdx] = useState(0);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;
  const DATE_RANGES = [
    { label: 'All Time', days: Infinity },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
  ];

  const [shipments, setShipments] = useState<Parcel[]>([]);
  const [hubs, setHubs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch hubs to resolve names
      const allHubs = await centreEngine.listNearbyHubs(0, 0, 9999);
      const hubMap: Record<string, string> = {};
      allHubs.forEach(h => { hubMap[h.id] = h.name; });
      setHubs(hubMap);

      // Fetch shipments where user is sender
      const userShipments = await parcelEngine.query([
        { field: 'senderId', operator: '==', value: user.uid }
      ]);

      // Sort by newest
      userShipments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setShipments(userShipments);
    } catch (err) {
      console.error('Failed to load merchant shipments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (shipments.length === 0) {
      toast.success('No shipment history to export');
      return;
    }
    setIsExporting(true);
    try {
      const csvData = shipments.map(s => ({
        TrackingNumber: s.trackingNumber,
        Status: s.status,
        OriginHub: hubs[s.originCenterId] || s.originCenterId,
        DestinationHub: hubs[s.destinationCenterId] || s.destinationCenterId,
        Date: new Date(s.createdAt).toLocaleString(),
        Weight: s.weightKg,
        Amount: s.pricing?.total || 0
      }));

      exportToCsv(`MerchantShipments_${user?.uid}_${new Date().toISOString()}.csv`, csvData);
      toast.success('History exported successfully');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export shipment history');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredShipments = shipments.filter(s => {
    // Search filter
    const matchesSearch = (s.trackingNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.recipientInfo?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Date range filter
    const rangeDays = DATE_RANGES[dateRangeIdx].days;
    if (rangeDays !== Infinity) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - rangeDays);
      if (!s.createdAt || new Date(s.createdAt) < cutoff) return false;
    }

    // Tab active filter
    if (activeFilter === 'all') return true;
    if (activeFilter === 'delivered') return s.status === 'DELIVERED' || s.status === 'COLLECTED' || s.status === 'COMPLETED';
    if (activeFilter === 'in-transit') return ['RECEIVED_AT_ORIGIN', 'AWAITING_DISPATCH', 'IN_TRANSIT', 'TRANSFERRED_BETWEEN_POINTS', 'ARRIVED_AT_DESTINATION', 'READY_FOR_PICKUP'].includes(s.status);
    if (activeFilter === 'cancelled') return s.status === 'CANCELLED';
    return true;
  });

  // Reset to page 1 whenever the visible result set changes shape
  useEffect(() => {
    setPage(1);
  }, [activeFilter, searchTerm, dateRangeIdx]);

  const totalPages = Math.max(1, Math.ceil(filteredShipments.length / PAGE_SIZE));
  const pagedShipments = filteredShipments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <MerchantLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold dark:text-white font-display">Shipment History</h1>
            <p className="text-slate-600 dark:text-slate-400">View, manage, and create parcel flyers for your past shipment records.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="rounded-xl flex items-center gap-2" onClick={handleExport} disabled={isExporting}>
                {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} Export History
             </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
           <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit">
              {['all', 'delivered', 'in-transit', 'cancelled'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={cn(
                    "px-6 py-2 rounded-xl font-bold text-xs capitalize transition-all",
                    activeFilter === tab ? "bg-white dark:bg-slate-800 text-primary-600 shadow-sm" : "text-slate-600 dark:text-slate-400"
                  )}
                >
                   {tab}
                </button>
              ))}
           </div>

           <div className="flex items-center gap-3 flex-1 lg:max-w-md">
              <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                 <Input
                   placeholder="Search by ID or customer..."
                   className="pl-10 h-11"
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
              </div>
              <select
                value={dateRangeIdx}
                onChange={(e) => setDateRangeIdx(Number(e.target.value))}
                className="h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
              >
                {DATE_RANGES.map((r, i) => <option key={r.label} value={i}>{r.label}</option>)}
              </select>
           </div>
        </div>

        {/* History List */}
        <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Shipment ID</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Customer</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Destination</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Date</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Amount</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Status</th>
                       <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                       <tr>
                          <td colSpan={7} className="px-6 py-10 text-center">
                             <div className="flex flex-col items-center justify-center space-y-2">
                                <Loader2 size={24} className="animate-spin text-primary-600" />
                                <p className="text-sm text-slate-600 dark:text-slate-400">Loading shipments...</p>
                             </div>
                          </td>
                       </tr>
                    ) : filteredShipments.length === 0 ? (
                       <tr>
                          <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-600 dark:text-slate-400">
                             No shipments found.
                          </td>
                       </tr>
                    ) : (
                      pagedShipments.map((s) => (
                        <tr key={s.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                           <td className="px-6 py-5 font-bold text-sm dark:text-white font-mono">{s.trackingNumber}</td>
                           <td className="px-6 py-5">
                              <p className="font-bold text-sm dark:text-white">{s.recipientInfo?.name || 'Customer'}</p>
                           </td>
                           <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">{hubs[s.destinationCenterId] || s.destinationCenterId}</td>
                           <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</td>
                           <td className="px-6 py-5 font-bold text-sm text-primary-600">₦{(s.pricing?.total || 0).toLocaleString()}</td>
                           <td className="px-6 py-5">
                              <Badge variant={
                                 s.status === 'DELIVERED' || s.status === 'COLLECTED' ? 'success' :
                                 s.status === 'CANCELLED' ? 'error' : 'info'
                              } className="rounded-lg capitalize">
                                 {s.status.toLowerCase().replace(/_/g, ' ')}
                              </Badge>
                           </td>
                           <td className="px-6 py-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                 <Button variant="outline" className="h-9 w-9 p-0 rounded-lg text-slate-600 dark:text-slate-400 hover:text-primary-600" asChild>
                                    <Link to={`/merchant/track?id=${s.trackingNumber}`} title="Track Shipment">
                                       <Eye size={16} />
                                    </Link>
                                 </Button>
                                 <Button
                                   variant="outline"
                                   className="h-9 px-3 rounded-lg text-primary-600 border-primary-200 hover:bg-primary-50 dark:border-primary-800 dark:hover:bg-primary-950/30 flex items-center gap-1.5 text-xs font-bold"
                                   asChild
                                 >
                                   <Link to={`/merchant/flyer?parcelId=${s.id}`}>
                                      <FileText size={15} /> Parcel Flyer
                                   </Link>
                                 </Button>
                              </div>
                           </td>
                        </tr>
                      ))
                    )}
                 </tbody>
              </table>
           </div>

           {/* Pagination */}
           <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Showing {filteredShipments.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredShipments.length)} of {filteredShipments.length} shipments
              </p>
              <div className="flex items-center gap-2">
                 <Button
                   variant="outline"
                   className="h-9 w-9 p-0 rounded-lg"
                   onClick={() => setPage(p => Math.max(1, p - 1))}
                   disabled={page <= 1}
                 >
                   <ChevronLeft size={18} />
                 </Button>
                 <Button className="h-9 w-9 p-0 rounded-lg bg-primary-600 text-white">{page}</Button>
                 <Button
                   variant="outline"
                   className="h-9 w-9 p-0 rounded-lg"
                   onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                   disabled={page >= totalPages}
                 >
                   <ChevronRight size={18} />
                 </Button>
              </div>
           </div>
        </Card>
      </div>
    </MerchantLayout>
  );
};
