import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Package,
  Users,
  Download,
  Calendar,
  ChevronRight,
  FileText,
  PieChart,
  Target,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { PointLayout } from '@/src/layouts/PointLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { centreEngine, parcelEngine } from '@/src/engines';
import { Parcel } from '@/src/types';
import { toast } from 'sonner';

const CATEGORY_COLORS = ['bg-primary-600', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-slate-500'];

export const ReportsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [chartMode, setChartMode] = useState<'Weekly' | 'Monthly'>('Weekly');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        let hubId = (user as any).hubId;
        if (!hubId) {
          const hubs = await centreEngine.getHubsByOwner(user.uid);
          if (hubs.length > 0) hubId = hubs[0].id;
        }
        if (hubId) {
          const data = await parcelEngine.getParcelsByHub(hubId, 'current');
          setParcels(data);
        }
      } catch (err) {
        console.error('Failed to load report data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const stats = useMemo(() => {
    const totalVolume = parcels.length;
    const collected = parcels.filter(p => p.status === 'COLLECTED');
    const efficiency = totalVolume > 0 ? ((collected.length / totalVolume) * 100).toFixed(1) : '0.0';

    const processingTimes: number[] = [];
    parcels.forEach(p => {
      if (p.status === 'COLLECTED' && p.createdAt && p.updatedAt) {
        const mins = (new Date(p.updatedAt).getTime() - new Date(p.createdAt).getTime()) / 60000;
        if (mins > 0 && mins < 60 * 24 * 30) processingTimes.push(mins);
      }
    });
    const avgProcessingMins = processingTimes.length > 0
      ? Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length)
      : null;

    const exceptions = parcels.filter(p => ['DAMAGED', 'LOST', 'DISPUTED'].includes(p.status)).length;

    return { totalVolume, efficiency, avgProcessingMins, exceptions };
  }, [parcels]);

  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    parcels.forEach(p => {
      const cat = p.category || 'Uncategorized';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const total = parcels.length || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count], i) => ({
        label,
        pct: Math.round((count / total) * 100),
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
      }));
  }, [parcels]);

  const volumeTrend = useMemo(() => {
    const days = chartMode === 'Weekly' ? 7 : 30;
    const buckets = Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      return { date: d, count: 0 };
    });
    parcels.forEach(p => {
      if (!p.createdAt) return;
      const created = new Date(p.createdAt);
      const bucket = buckets.find(b => b.date.toDateString() === created.toDateString());
      if (bucket) bucket.count++;
    });
    const max = Math.max(1, ...buckets.map(b => b.count));
    return buckets.map(b => ({
      label: chartMode === 'Weekly' ? b.date.toLocaleDateString(undefined, { weekday: 'short' }) : b.date.getDate().toString(),
      pct: Math.round((b.count / max) * 100),
      count: b.count
    }));
  }, [parcels, chartMode]);

  const handleExportAll = () => {
    if (parcels.length === 0) {
      toast.error('No parcel data to export yet.');
      return;
    }
    const header = 'Tracking Number,Status,Category,Created,Updated\n';
    const rows = parcels.map(p =>
      `${p.trackingNumber || p.id},${p.status},${p.category || ''},${p.createdAt || ''},${p.updatedAt || ''}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hub-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <PointLayout>
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        </div>
      </PointLayout>
    );
  }

  return (
    <PointLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold dark:text-white font-display">Performance Reports</h1>
            <p className="text-slate-900">Analytics and insights for your hub, based on real parcel activity.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button className="rounded-xl px-8 shadow-lg shadow-primary-500/20 flex items-center gap-2" onClick={handleExportAll}>
                <Download size={18} /> Download All
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {[
             { label: 'Parcel Volume', value: stats.totalVolume.toLocaleString(), icon: Package, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20' },
             { label: 'Collection Rate', value: `${stats.efficiency}%`, icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
             { label: 'Avg processing', value: stats.avgProcessingMins != null ? `${stats.avgProcessingMins}m` : '—', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
             { label: 'Open Exceptions', value: stats.exceptions.toString(), icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
           ].map((stat, i) => (
             <Card key={i} className="p-6 border-slate-200 dark:border-slate-800">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", stat.bg, stat.color)}>
                   <stat.icon size={20} />
                </div>
                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-black dark:text-white font-display mt-1">{stat.value}</h3>
             </Card>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Card className="lg:col-span-2 p-8 border-slate-200 dark:border-slate-800 space-y-8">
              <div className="flex items-center justify-between">
                 <h3 className="text-lg font-bold dark:text-white font-display">Parcel Volume Trend</h3>
                 <div className="flex gap-2">
                    <button onClick={() => setChartMode('Weekly')} className={cn("px-3 py-1 rounded-lg text-xs font-bold", chartMode === 'Weekly' ? "bg-slate-100 dark:bg-slate-800 text-primary-600" : "text-slate-900")}>Weekly</button>
                    <button onClick={() => setChartMode('Monthly')} className={cn("px-3 py-1 rounded-lg text-xs font-bold", chartMode === 'Monthly' ? "bg-slate-100 dark:bg-slate-800 text-primary-600" : "text-slate-900")}>Monthly</button>
                 </div>
              </div>
              {parcels.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-slate-500">No parcel activity yet at this hub.</div>
              ) : (
                <div className="h-64 flex items-end justify-between gap-1 pt-4">
                   {volumeTrend.map((day, i) => (
                     <div key={i} className="flex-1 flex flex-col items-center gap-3 group" title={`${day.count} parcels`}>
                        <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-xl relative overflow-hidden h-full">
                           <div
                             style={{ height: `${day.pct}%` }}
                             className="absolute bottom-0 left-0 right-0 bg-primary-600/20 group-hover:bg-primary-600 transition-all rounded-t-xl"
                           />
                        </div>
                        <span className="text-[10px] font-bold text-slate-800 uppercase">{day.label}</span>
                     </div>
                   ))}
                </div>
              )}
           </Card>

           <div className="space-y-6">
              <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-6">
                 <h3 className="font-bold dark:text-white font-display flex items-center gap-2">
                    <PieChart size={18} className="text-primary-600" />
                    Parcel Categories
                 </h3>
                 {categoryBreakdown.length === 0 ? (
                   <p className="text-xs text-slate-500">No categorized parcels yet.</p>
                 ) : (
                   <div className="space-y-4">
                      {categoryBreakdown.map((item, i) => (
                        <div key={i} className="space-y-2">
                           <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-900 uppercase tracking-widest">{item.label}</span>
                              <span className="font-black dark:text-white">{item.pct}%</span>
                           </div>
                           <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div style={{ width: `${item.pct}%` }} className={cn("h-full rounded-full", item.color)} />
                           </div>
                        </div>
                      ))}
                   </div>
                 )}
              </Card>
           </div>
        </div>
      </div>
    </PointLayout>
  );
};
