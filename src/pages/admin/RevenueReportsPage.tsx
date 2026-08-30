import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AdminLayout } from '@/src/layouts/AdminLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { paymentEngine } from '@/src/engines';
import { CommissionRecord } from '@/src/services/db/CommissionRecordRepository';
import {

  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  ArrowUpRight,
  Wallet,
  Building2,
  Globe,
  Search,
  ChevronRight,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

export const RevenueReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<CommissionRecord[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    platformEarnings: 0,
    centrePayouts: 0,
    growth: '+12.5%'
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const allRecords = await paymentEngine.getAllCommissions();
      setRecords(allRecords);

      const total = allRecords.reduce((sum, r) => sum + r.totalFee, 0);
      const platform = allRecords.reduce((sum, r) => sum + r.platformAmount, 0);
      const centre = allRecords.reduce((sum, r) => sum + r.centreAmount, 0);

      setStats({
        totalRevenue: total,
        platformEarnings: platform,
        centrePayouts: centre,
        growth: '+14.2%'
      });
    } catch (error) {
      console.error('Error fetching revenue reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: 'Mon', revenue: 12000, earnings: 4800 },
    { name: 'Tue', revenue: 19000, earnings: 7600 },
    { name: 'Wed', revenue: 15000, earnings: 6000 },
    { name: 'Thu', revenue: 22000, earnings: 8800 },
    { name: 'Fri', revenue: 30000, earnings: 12000 },
    { name: 'Sat', revenue: 25000, earnings: 10000 },
    { name: 'Sun', revenue: 18000, earnings: 7200 },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
          <p className="text-slate-900 font-bold uppercase tracking-widest text-[10px]">Generating Revenue Reports...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold dark:text-white font-display">Revenue Reports</h1>
            <p className="text-slate-900">Comprehensive overview of platform earnings and hub payouts.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="rounded-xl flex items-center gap-2">
                <Download size={18} /> Export PDF
             </Button>
             <Button className="rounded-xl px-8 shadow-lg shadow-primary-500/20 flex items-center gap-2">
                <Filter size={18} /> Custom Range
             </Button>
          </div>
        </div>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {[
             { label: 'Gross Revenue', value: `₦${stats.totalRevenue.toLocaleString()}`, icon: Globe, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', trend: stats.growth },
             { label: 'Platform Earnings', value: `₦${stats.platformEarnings.toLocaleString()}`, icon: TrendingUp, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20', trend: '+8%' },
             { label: 'Hub Payouts', value: `₦${stats.centrePayouts.toLocaleString()}`, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', trend: 'Tier Split' },
             { label: 'Awaiting Settlement', value: '₦12,400', icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', trend: 'Audit Req' },
           ].map((stat, i) => (
             <Card key={i} className="p-6 border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                   <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bg, stat.color)}>
                      <stat.icon size={20} />
                   </div>
                   <Badge variant="success" className="h-6 gap-1 text-[10px]">{stat.trend}</Badge>
                </div>
                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-black dark:text-white font-display mt-1">{stat.value}</h3>
             </Card>
           ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Card className="lg:col-span-2 p-8 border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h3 className="text-lg font-bold dark:text-white font-display">Revenue Performance</h3>
                    <p className="text-xs text-slate-900">Gross revenue vs Platform net earnings.</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 mr-4">
                       <div className="w-3 h-3 rounded-full bg-primary-600" />
                       <span className="text-xs font-medium text-slate-900">Revenue</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-emerald-500" />
                       <span className="text-xs font-medium text-slate-900">Earnings</span>
                    </div>
                 </div>
              </div>
              <div className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                       <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                             <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                       <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                       <Tooltip
                         contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                       />
                       <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                       <Area type="monotone" dataKey="earnings" stroke="#10b981" strokeWidth={3} fillOpacity={0} />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </Card>

           <Card className="p-8 border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold dark:text-white font-display mb-6">Revenue Mix</h3>
              <div className="space-y-8">
                 {[
                   { label: 'Standard Delivery', value: '₦42,000', percentage: 65, color: 'bg-indigo-600' },
                   { label: 'Express Priority', value: '₦18,000', percentage: 25, color: 'bg-primary-600' },
                   { label: 'Same Day Hub', value: '₦8,400', percentage: 10, color: 'bg-emerald-500' },
                 ].map((item, i) => (
                   <div key={i} className="space-y-3">
                      <div className="flex items-center justify-between">
                         <span className="text-sm font-bold dark:text-white">{item.label}</span>
                         <span className="text-sm font-black text-primary-600 font-display">{item.value}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                         <motion.div
                           initial={{ width: 0 }}
                           animate={{ width: `${item.percentage}%` }}
                           className={cn("h-full rounded-full", item.color)}
                         />
                      </div>
                   </div>
                 ))}

                 <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                       <div className="flex items-center gap-3">
                          <CheckCircle2 size={20} className="text-emerald-500" />
                          <span className="text-xs font-bold dark:text-white">Audit Status</span>
                       </div>
                       <Badge variant="success">CLEARED</Badge>
                    </div>
                 </div>
              </div>
           </Card>
        </div>

        {/* Transaction Table */}
        <div className="space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold dark:text-white font-display">Recent Commission Logs</h3>
              <div className="relative w-72">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-800" size={16} />
                 <input
                   type="text"
                   placeholder="Search shipment ID..."
                   className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm outline-none focus:border-primary-500"
                 />
              </div>
           </div>

           <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                       <tr>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-800 uppercase tracking-widest">Shipment</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-800 uppercase tracking-widest">Gross Fee</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-800 uppercase tracking-widest">Platform Share</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-800 uppercase tracking-widest">Centre Share</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-800 uppercase tracking-widest">Status</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-800 uppercase tracking-widest">Timestamp</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                       {records.length === 0 ? (
                         <tr>
                           <td colSpan={6} className="px-6 py-12 text-center text-slate-900 font-bold">No commission logs found.</td>
                         </tr>
                       ) : (
                         records.slice(0, 10).map((record, i) => (
                           <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer">
                              <td className="px-6 py-4">
                                 <span className="text-sm font-bold dark:text-white">#{record.shipmentId}</span>
                              </td>
                              <td className="px-6 py-4">
                                 <span className="text-sm font-bold dark:text-white font-display">₦{record.totalFee.toLocaleString()}</span>
                              </td>
                              <td className="px-6 py-4 text-primary-600 font-bold text-sm">
                                 ₦{record.platformAmount.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-emerald-600 font-bold text-sm">
                                 ₦{record.centreAmount.toLocaleString()}
                              </td>
                              <td className="px-6 py-4">
                                 <Badge variant="success" className="h-6">SETTLED</Badge>
                              </td>
                              <td className="px-6 py-4">
                                 <span className="text-xs text-slate-900">
                                   {record.timestamp?.toDate?.()?.toLocaleString() || 'Recent'}
                                 </span>
                              </td>
                           </tr>
                         ))
                       )}
                    </tbody>
                 </table>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                 <p className="text-xs text-slate-900">Showing {Math.min(10, records.length)} of {records.length} records</p>
                 <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs">Previous</Button>
                    <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs">Next</Button>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </AdminLayout>
  );
};
