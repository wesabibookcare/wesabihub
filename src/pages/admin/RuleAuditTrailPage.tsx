import React from 'react';
import {
  ClipboardList,
  Search,
  Filter,
  History,
  User,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  DollarSign,
  Info,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { BusinessRulesLayout } from '../../layouts/BusinessRulesLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

export const RuleAuditTrailPage = () => {
  const logs = [
    { id: '1', admin: 'Chief Admin', action: 'Modified Pricing Base Fee', date: 'Jul 07, 2026', time: '09:42 AM', module: 'Pricing', status: 'Success', reason: 'Annual regional adjustment' },
    { id: '2', admin: 'Ops Manager', action: 'Updated Trust Score Weights', date: 'Jul 06, 2026', time: '02:15 PM', module: 'Trust Score', status: 'Success', reason: 'Quality improvement initiative' },
    { id: '3', admin: 'Chief Admin', action: 'Created Welcome Launch Promo', date: 'Jul 05, 2026', time: '11:30 AM', module: 'Promotions', status: 'Success', reason: 'Marketing campaign launch' },
    { id: '4', admin: 'Sys System', action: 'Auto-Updated Tax Rule (Kenya)', date: 'Jul 04, 2026', time: '12:00 AM', module: 'Taxes', status: 'Success', reason: 'Regulatory compliance sync' },
    { id: '5', admin: 'Financial Lead', action: 'Adjusted SafePay Hold Time', date: 'Jul 03, 2026', time: '04:50 PM', module: 'SafePay', status: 'Success', reason: 'Liquidity optimization' },
  ];

  return (
    <BusinessRulesLayout>
      <div className="space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-primary-600 font-bold uppercase tracking-widest text-[10px] mb-2">Change Management</p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Rule Audit Trail</h1>
            <p className="text-slate-900 font-medium mt-1">Detailed history of all modifications to the Business Rules Engine.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="rounded-xl border-slate-200 font-bold">
               <Calendar size={18} className="mr-2" /> Select Range
             </Button>
             <Button className="rounded-xl font-bold shadow-lg shadow-primary-600/20">
               Export Audit Report
             </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
           <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-primary-500 transition-all">
              <Search size={18} className="text-slate-800" />
              <input
                type="text"
                placeholder="Search logs by admin, module, or action..."
                className="bg-transparent border-none focus:outline-none text-sm font-bold w-full"
              />
           </div>
           <div className="flex items-center gap-3">
              <select className="bg-white border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary-500 shadow-sm">
                 <option>All Modules</option>
                 <option>Pricing</option>
                 <option>Trust Score</option>
                 <option>Promotions</option>
                 <option>SafePay</option>
              </select>
              <Button variant="outline" className="p-2.5 border-slate-200 rounded-xl bg-white shadow-sm">
                 <Filter size={18} />
              </Button>
           </div>
        </div>

        {/* Audit Table */}
        <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Administrator</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Action & Module</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Reason for Change</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Date & Time</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 text-right">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {logs.map((log, idx) => (
                       <motion.tr
                        key={log.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                       >
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800 font-black text-[10px] border border-slate-200">
                                   {log.admin.split(' ').map(n => n[0]).join('')}
                                </div>
                                <span className="text-sm font-black text-slate-900">{log.admin}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="space-y-1">
                                <p className="text-sm font-bold text-slate-900">{log.action}</p>
                                <Badge className="bg-primary-50 text-primary-600 border-none px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest">{log.module}</Badge>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <p className="text-xs text-slate-900 font-medium max-w-[200px] italic">"{log.reason}"</p>
                          </td>
                          <td className="px-6 py-4">
                             <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-900">{log.date}</p>
                                <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{log.time}</p>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <Badge className="bg-emerald-50 text-emerald-600 border-none px-2 py-0.5 font-bold text-[10px]">{log.status}</Badge>
                          </td>
                       </motion.tr>
                    ))}
                 </tbody>
              </table>
           </div>

           <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3 text-slate-800">
                 <Info size={16} />
                 <p className="text-xs font-bold uppercase tracking-widest">Logs are retained for 7 years for compliance</p>
              </div>
              <Button variant="ghost" className="text-primary-600 font-black text-xs uppercase tracking-[0.2em] hover:bg-white px-6">
                 Load More Activity
              </Button>
           </div>
        </Card>
      </div>
    </BusinessRulesLayout>
  );
};
