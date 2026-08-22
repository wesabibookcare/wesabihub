import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Package,
  Search,
  Filter,
  ChevronRight,
  Clock,
  CheckCircle2,
  MapPin,
  History,
  Boxes,
  Truck,
  MoreVertical,
  Calendar,
  ArrowRight,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { LogisticsLayout } from '@/src/layouts/LogisticsLayout';
import { logisticsEngine, parcelEngine } from '@/src/engines';
import { useAuth } from '@/src/context/AuthContext';
import { Parcel } from '@/src/types';
import { toast } from 'sonner';

export const ShipmentsPage = () => {
  const { user } = useAuth();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchShipments();
    }
  }, [user]);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const company = await logisticsEngine.getCompanyByOwner(user!.uid);
      if (!company) return;

      const jobs = await logisticsEngine.getJobs(company.id);

      const parcelIds = new Set<string>();
      jobs.forEach(job => {
        job.parcelIds?.forEach(id => parcelIds.add(id));
      });

      if (parcelIds.size > 0) {
        const parcelData = await Promise.all(
          Array.from(parcelIds).map(id => parcelEngine.getParcel(id))
        );
        setParcels(parcelData.filter(p => p !== null) as Parcel[]);
      } else {
        // Mock fallback if no job links exist yet for a better preview,
        // but typically would be empty in production
        setParcels([]);
      }
    } catch (error) {
      console.error('Error fetching shipments:', error);
      toast.error('Failed to load shipment records');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LogisticsLayout>
      <div className="space-y-8 ">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <p className="text-primary-600 font-bold uppercase tracking-widest text-[10px] mb-2">Inventory Control</p>
           <h1 className="text-4xl font-black tracking-tight dark:text-white">Global Shipments</h1>
           <p className="text-slate-900 font-medium mt-1">Track every parcel handled by your logistics network.</p>
        </div>
      </div>

      {/* Control Bar */}
      <Card className="p-4 border-none shadow-sm bg-white dark:bg-slate-900 rounded-3xl flex flex-wrap items-center gap-4">
         <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-800" size={18} />
            <input
              type="text"
              placeholder="Search by Parcel ID, Point, or Carrier..."
              className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary-500/50 transition-all"
            />
         </div>
         <Button variant="outline" className="rounded-xl h-12 border-slate-200 dark:border-slate-800 font-bold gap-2">
            <Calendar size={18} />
            Today
         </Button>
         <Button variant="outline" className="rounded-xl h-12 border-slate-200 dark:border-slate-800 font-bold gap-2">
            <Filter size={18} />
            Filters
         </Button>
      </Card>

      {/* Shipments List */}
      <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                     <th className="px-8 py-6 text-[10px] font-black text-slate-800 uppercase tracking-widest">Shipment ID</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-800 uppercase tracking-widest">Route (Origin → Dest)</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-800 uppercase tracking-widest">Status</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-800 uppercase tracking-widest">Carrier</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-800 uppercase tracking-widest text-right">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <Loader2 className="animate-spin mx-auto text-primary-600" size={40} />
                      </td>
                    </tr>
                  ) : parcels.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <p className="text-slate-900 font-bold">No operational shipments found.</p>
                        <p className="text-xs text-slate-800 mt-1">Parcels assigned to your transport jobs will appear here.</p>
                      </td>
                    </tr>
                  ) : parcels.map((s) => (
                     <tr key={s.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-8 py-6">
                           <p className="text-sm font-black dark:text-white leading-tight">{s.trackingNumber}</p>
                           <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mt-1">{s.deliveryMethod || 'Standard'}</p>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                              <span className="text-xs font-black dark:text-white">{s.originCenterId.slice(0, 8)}</span>
                              <ArrowRight size={12} className="text-slate-300" />
                              <span className="text-xs font-black dark:text-white">{s.destinationCenterId.slice(0, 8)}</span>
                           </div>
                           <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1 flex items-center gap-1">
                              <Clock size={10} /> Updated {s.updatedAt ? new Date(s.updatedAt).toLocaleTimeString() : 'Just now'}
                           </p>
                        </td>
                        <td className="px-8 py-6">
                           <Badge className={cn(
                             "rounded-full px-3 py-1 font-black text-[10px] tracking-widest uppercase",
                             s.status === 'DELIVERED' || s.status === 'COMPLETED' ? "bg-emerald-500/10 text-emerald-600" :
                             s.status === 'IN_TRANSIT' ? "bg-blue-500/10 text-blue-600" : "bg-slate-100 text-slate-900"
                           )}>
                              {s.status.replace('_', ' ')}
                           </Badge>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                                 P
                              </div>
                              <span className="text-xs font-bold dark:text-white">Partner Node</span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <Button variant="ghost" size="icon" className="rounded-xl group-hover:bg-primary-600 group-hover:text-white transition-all">
                              <ChevronRight size={18} />
                           </Button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="p-8 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem]">
            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-4">Transfer Efficiency</p>
            <div className="flex items-center justify-between mb-4">
               <h4 className="text-3xl font-black dark:text-white">98.4%</h4>
               <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-600">
                  <TrendingUp size={24} />
               </div>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 w-[98.4%]" />
            </div>
         </Card>
         <Card className="p-8 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem]">
            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-4">Average Transit</p>
            <div className="flex items-center justify-between mb-4">
               <h4 className="text-3xl font-black dark:text-white">4.2 hrs</h4>
               <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
                  <Clock size={24} />
               </div>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 w-[65%]" />
            </div>
         </Card>
         <Card className="p-8 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem]">
            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-4">Network Reach</p>
            <div className="flex items-center justify-between mb-4">
               <h4 className="text-3xl font-black dark:text-white">12 Points</h4>
               <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-600">
                  <MapPin size={24} />
               </div>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-indigo-500 w-[45%]" />
            </div>
         </Card>
      </div>
      </div>
    </LogisticsLayout>
  );
};
