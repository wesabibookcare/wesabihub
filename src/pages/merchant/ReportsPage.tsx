import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Package,
  Wallet,
  Users,
  Activity,
  Loader2
} from 'lucide-react';
import { MerchantLayout } from '@/src/layouts/MerchantLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { parcelEngine } from '@/src/engines';
import { Parcel } from '@/src/types';
import { toast } from 'sonner';

const DELIVERED_STATUSES = new Set(['DELIVERED', 'COMPLETED', 'COLLECTED']);
const RANGE_OPTIONS = [
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 90 Days', days: 90 },
  { label: 'Last 12 Months', days: 365 },
  { label: 'All Time', days: Infinity },
];

export const ReportsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [rangeIdx, setRangeIdx] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    parcelEngine.getParcelsBySender(user.uid)
      .then(setParcels)
      .catch(() => toast.error('Failed to load report data'))
      .finally(() => setLoading(false));
  }, [user]);

  const range = RANGE_OPTIONS[rangeIdx];
  const cutoff = useMemo(() => {
    if (range.days === Infinity) return null;
    const d = new Date();
    d.setDate(d.getDate() - range.days);
    return d;
  }, [range]);

  const scopedParcels = useMemo(() => {
    if (!cutoff) return parcels;
    return parcels.filter(p => p.createdAt && new Date(p.createdAt) >= cutoff);
  }, [parcels, cutoff]);

  const totalRevenue = scopedParcels.reduce((sum, p) => sum + (p.pricing?.total || 0), 0);
  const totalShipments = scopedParcels.length;
  const deliveredCount = scopedParcels.filter(p => DELIVERED_STATUSES.has(p.status)).length;
  const deliveryRate = totalShipments > 0 ? (deliveredCount / totalShipments) * 100 : 0;
  const activeCustomers = new Set(
    scopedParcels.map(p => p.recipientInfo?.email || p.recipientInfo?.phone).filter(Boolean)
  ).size;

  const summaries = [
    { label: 'Total Revenue', value: `₦${totalRevenue.toLocaleString()}`, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Total Shipments', value: totalShipments.toLocaleString(), icon: Package, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20' },
    { label: 'Active Customers', value: activeCustomers.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Delivery Rate', value: `${deliveryRate.toFixed(1)}%`, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  ];

  // Real monthly revenue for the last 12 months
  const monthlyRevenue = useMemo(() => {
    const months: { label: string; total: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ label: d.toLocaleString('default', { month: 'short' }), total: 0 });
    }
    parcels.forEach(p => {
      if (!p.createdAt || !p.pricing?.total) return;
      const created = new Date(p.createdAt);
      const monthsAgo = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
      if (monthsAgo >= 0 && monthsAgo <= 11) {
        months[11 - monthsAgo].total += p.pricing.total;
      }
    });
    return months;
  }, [parcels]);
  const maxMonthly = Math.max(...monthlyRevenue.map(m => m.total), 1);

  // Real category breakdown
  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    scopedParcels.forEach(p => {
      const cat = p.category || 'Uncategorized';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const total = scopedParcels.length || 1;
    const colors = ['bg-primary-600', 'bg-blue-600', 'bg-emerald-600', 'bg-indigo-600', 'bg-slate-400'];
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count], i) => ({ label, value: Math.round((count / total) * 100), color: colors[i % colors.length] }));
  }, [scopedParcels]);

  const handleExport = () => {
    setIsExporting(true);
    try {
      const rows = [
        ['Metric', 'Value'],
        ['Total Revenue', `₦${totalRevenue.toLocaleString()}`],
        ['Total Shipments', String(totalShipments)],
        ['Active Customers', String(activeCustomers)],
        ['Delivery Rate', `${deliveryRate.toFixed(1)}%`],
        [],
        ['Category', 'Share of Shipments'],
        ...categoryBreakdown.map(c => [c.label, `${c.value}%`]),
      ];
      const csv = rows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `OmorfiHub_Report_${range.label.replace(/\s+/g, '_')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Report exported');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <MerchantLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold dark:text-white font-display">Business Reports</h1>
            <p className="text-slate-800">Analyze your store performance and shipping analytics.</p>
          </div>
          <div className="flex items-center gap-3">
             <select
               value={rangeIdx}
               onChange={(e) => setRangeIdx(Number(e.target.value))}
               className="h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
             >
               {RANGE_OPTIONS.map((r, i) => <option key={r.label} value={i}>{r.label}</option>)}
             </select>
             <Button onClick={handleExport} disabled={isExporting || loading} className="rounded-xl px-8 shadow-lg shadow-primary-500/20 flex items-center gap-2">
                {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} Export CSV
             </Button>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="animate-spin mx-auto mb-3 text-primary-600" size={28} />
            <p className="text-sm text-slate-800">Loading your report data...</p>
          </div>
        ) : (
        <>
        {/* Summaries */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           {summaries.map((stat, i) => (
             <Card key={i} className="p-6 border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                   <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bg, stat.color)}>
                      <stat.icon size={20} />
                   </div>
                </div>
                <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-black dark:text-white font-display mt-1">{stat.value}</h3>
             </Card>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Revenue Chart */}
           <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                 <h3 className="text-lg font-bold dark:text-white font-display">Revenue Overview</h3>
                 <Badge variant="outline">Last 12 Months</Badge>
              </div>
              {totalRevenue === 0 && monthlyRevenue.every(m => m.total === 0) ? (
                <div className="h-64 flex items-center justify-center text-sm text-slate-500 text-center px-6">
                  No revenue yet — completed shipments will populate this chart.
                </div>
              ) : (
              <div className="h-64 flex items-end justify-between gap-2 pt-4">
                 {monthlyRevenue.map((m, i) => (
                   <div key={i} className="flex-1 space-y-2 group relative">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max((m.total / maxMonthly) * 100, m.total > 0 ? 4 : 0)}%` }}
                        className={cn(
                          "w-full rounded-t-lg transition-colors",
                          i === 11 ? "bg-primary-600" : "bg-primary-100 dark:bg-primary-900/30"
                        )}
                        title={`₦${m.total.toLocaleString()}`}
                      />
                   </div>
                 ))}
              </div>
              )}
              <div className="flex justify-between text-[10px] font-bold text-slate-900 uppercase tracking-widest pt-2">
                 <span>{monthlyRevenue[0]?.label}</span>
                 <span>{monthlyRevenue[monthlyRevenue.length - 1]?.label}</span>
              </div>
           </Card>

           {/* Shipment Categories */}
           <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-8">
              <div className="flex items-center justify-between">
                 <h3 className="text-lg font-bold dark:text-white font-display">Shipment Categories</h3>
                 <Badge variant="outline">Top {categoryBreakdown.length}</Badge>
              </div>
              {categoryBreakdown.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">No shipments in this period yet.</div>
              ) : (
              <div className="space-y-6 pt-4">
                 {categoryBreakdown.map((cat, i) => (
                   <div key={i} className="space-y-2">
                      <div className="flex justify-between text-sm">
                         <span className="font-bold dark:text-white">{cat.label}</span>
                         <span className="text-slate-800 font-bold">{cat.value}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                         <motion.div
                           initial={{ width: 0 }}
                           animate={{ width: `${cat.value}%` }}
                           className={cn("h-full rounded-full", cat.color)}
                         />
                      </div>
                   </div>
                 ))}
              </div>
              )}
           </Card>
        </div>
        </>
        )}
      </div>
    </MerchantLayout>
  );
};
