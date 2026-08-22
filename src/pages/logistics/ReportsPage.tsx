import React from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  BarChart3,
  PieChart,
  ArrowUpRight,
  Calendar,
  Download,
  CheckCircle2,
  Clock,
  Package,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { LogisticsLayout } from '@/src/layouts/LogisticsLayout';

export const ReportsPage = () => {
  const metrics = [
    { label: "Delivery Success Rate", value: "99.2%", icon: CheckCircle2, color: "text-emerald-600", trend: "+0.5%" },
    { label: "Avg. Completion Time", value: "32 mins", icon: Clock, color: "text-blue-600", trend: "-2 mins" },
    { label: "Total Parcels Moved", value: "2,482", icon: Package, color: "text-primary-600", trend: "+12%" },
    { label: "Profitability Index", value: "0.84", icon: TrendingUp, color: "text-indigo-600", trend: "+0.02" },
  ];

  return (
    <LogisticsLayout>
      <div className="space-y-8 ">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <p className="text-primary-600 font-bold uppercase tracking-widest text-[10px] mb-2">Business Intelligence</p>
           <h1 className="text-4xl font-black tracking-tight dark:text-white">Performance Reports</h1>
           <p className="text-slate-900 font-medium mt-1">Deep dive into your logistics operations and efficiency.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold border-slate-200">
              <Download size={18} className="mr-2" />
              Download Full PDF
           </Button>
           <Button className="rounded-2xl h-12 px-8 font-black bg-primary-600 shadow-lg shadow-primary-500/20 gap-2">
              <Calendar size={18} />
              Set Range
           </Button>
        </div>
      </div>

      {/* High Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {metrics.map((m, idx) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
               <Card className="p-8 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] hover:-translate-y-1 transition-all group">
                  <div className={cn("p-4 rounded-2xl bg-opacity-10 mb-6 inline-flex", m.color.replace('text', 'bg'))}>
                     <m.icon size={28} className={m.color} />
                  </div>
                  <h3 className="text-3xl font-black dark:text-white mb-1">{m.value}</h3>
                  <div className="flex items-center justify-between">
                     <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">{m.label}</p>
                     <span className={cn("text-[10px] font-black", m.trend.startsWith('+') ? "text-emerald-600" : "text-blue-600")}>
                        {m.trend}
                     </span>
                  </div>
               </Card>
            </motion.div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <Card className="lg:col-span-2 p-10 border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[3rem]">
            <div className="flex items-center justify-between mb-10">
               <div>
                  <h3 className="text-2xl font-black dark:text-white">Job Completion Efficiency</h3>
                  <p className="text-sm font-medium text-slate-900 mt-1">Comparison between estimated vs actual delivery time.</p>
               </div>
               <div className="flex items-center gap-2">
                  <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-800 font-bold px-3 py-1 rounded-full border-none">Weekly</Badge>
               </div>
            </div>

            {/* Chart Placeholder */}
            <div className="h-64 w-full bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-700">
               <div className="text-center">
                  <BarChart3 size={48} className="text-slate-200 dark:text-slate-300 mx-auto mb-4" />
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Interactive Visualization Layer Placeholder</p>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-8 mt-10">
               <div className="text-center p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-1">On Time</p>
                  <p className="text-2xl font-black text-emerald-600">92%</p>
               </div>
               <div className="text-center p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-1">Delayed</p>
                  <p className="text-2xl font-black text-amber-500">6%</p>
               </div>
               <div className="text-center p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-1">Exception</p>
                  <p className="text-2xl font-black text-red-500">2%</p>
               </div>
            </div>
         </Card>

         <Card className="p-10 border-none shadow-2xl bg-slate-900 text-white rounded-[3rem] flex flex-col">
            <h3 className="text-2xl font-black mb-10">Market Share</h3>
            <div className="flex-1 flex flex-col justify-center items-center">
               <div className="w-48 h-48 rounded-full border-[12px] border-slate-800 flex items-center justify-center relative">
                  <div className="absolute inset-0 border-[12px] border-primary-600 rounded-full border-t-transparent animate-pulse" />
                  <div className="text-center">
                     <p className="text-4xl font-black">74%</p>
                     <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Efficiency</p>
                  </div>
               </div>
            </div>

            <div className="mt-10 space-y-6">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-3 h-3 rounded-full bg-primary-600" />
                     <span className="text-sm font-bold text-slate-800">Mainland Hubs</span>
                  </div>
                  <span className="text-sm font-black">45%</span>
               </div>
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-3 h-3 rounded-full bg-indigo-500" />
                     <span className="text-sm font-bold text-slate-800">Island Express</span>
                  </div>
                  <span className="text-sm font-black">30%</span>
               </div>
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-3 h-3 rounded-full bg-slate-700" />
                     <span className="text-sm font-bold text-slate-800">Outskirts</span>
                  </div>
                  <span className="text-sm font-black">25%</span>
               </div>
            </div>
         </Card>
      </div>

      {/* Reports Archive */}
      <Card className="p-8 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[3rem]">
         <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black dark:text-white">Archived Summaries</h3>
            <Button variant="ghost" className="text-primary-600 font-black gap-2">
               View All Reports <ChevronRight size={18} />
            </Button>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['June 2026 Monthly Performance', 'May 2026 Monthly Performance'].map((report) => (
               <div key={report} className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between group cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700 shadow-sm hover:shadow-lg">
                  <div className="flex items-center gap-4">
                     <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/10 text-primary-600">
                        <Download size={20} />
                     </div>
                     <span className="text-sm font-black dark:text-white">{report}</span>
                  </div>
                  <Badge className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-300 font-bold px-3 py-1 rounded-full border-none uppercase tracking-tighter text-[10px]">
                     Ready
                  </Badge>
               </div>
            ))}
         </div>
      </Card>
    </div>
    </LogisticsLayout>
  );
};
