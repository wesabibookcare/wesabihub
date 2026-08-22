
import React from 'react';
import {
  Percent,
  CreditCard,
  TrendingUp,
  Calendar,
  Clock,
  Info,
  Save,
  UserCheck,
  Store,
  MapPin,
  Truck,
  ArrowRight,
  Settings,
  AlertCircle
} from 'lucide-react';
import { BusinessRulesLayout } from '../../layouts/BusinessRulesLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '@/src/lib/utils';

export const CommissionPayoutPage = () => {
  const commissions = [
    { entity: 'Platform (WeSabiHub)', share: '10.0', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { entity: 'WeSabiHub Point', share: '35.0', icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-50' },
    { entity: 'Logistics Partner', share: '45.0', icon: Truck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { entity: 'Merchant Retention', share: '10.0', icon: Store, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const payoutSchedules = [
    { id: 'daily', label: 'Daily Settlement', period: '24 Hours', minAmount: '$50.00', status: 'Active' },
    { id: 'weekly', label: 'Weekly Payout', period: 'Every Friday', minAmount: '$250.00', status: 'Active' },
    { id: 'monthly', label: 'Monthly Bulk', period: '1st of Month', minAmount: '$1,000.00', status: 'Inactive' },
  ];

  return (
    <BusinessRulesLayout>
      <div className="space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-primary-600 font-bold uppercase tracking-widest text-[10px] mb-2">Revenue & Settlement</p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Commission & Payouts</h1>
            <p className="text-slate-900 font-medium mt-1">Configure global revenue sharing and automated partner payouts.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button className="rounded-xl font-bold shadow-lg shadow-primary-600/20">
               <Save size={18} className="mr-2" /> Publish Rules
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Commission Distribution */}
          <section className="space-y-6">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                   <Percent size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-900">Revenue Distribution</h3>
                   <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Global Share Allocation</p>
                </div>
             </div>

             <Card className="p-8 border-none shadow-xl shadow-slate-200/50">
                <div className="space-y-8">
                   {commissions.map((comm) => (
                      <div key={comm.entity} className="space-y-4">
                         <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                               <div className={cn("p-2 rounded-xl", comm.bg)}>
                                  <comm.icon size={18} className={comm.color} />
                                </div>
                               <span className="text-sm font-black text-slate-900">{comm.entity}</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <input
                                 type="text"
                                 defaultValue={comm.share}
                                 className="w-16 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-xs font-black text-right"
                               />
                               <span className="text-[10px] font-black text-slate-800">%</span>
                            </div>
                         </div>
                         <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all duration-1000", comm.color.replace('text-', 'bg-'))}
                              style={{ width: `${comm.share}%` }}
                            />
                         </div>
                      </div>
                   ))}

                   <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Total Distribution</span>
                      <span className="text-lg font-black text-slate-900">100.0%</span>
                   </div>
                </div>
             </Card>

             <Card className="p-6 bg-blue-50 border-blue-100 flex gap-4">
                <div className="p-2 bg-blue-600 text-white rounded-xl h-fit">
                   <Info size={20} />
                </div>
                <div>
                   <h4 className="text-sm font-black text-blue-900">Dynamic Adjustments</h4>
                   <p className="text-xs text-blue-700 font-medium mt-0.5">
                      Merchant-specific agreements can override these global defaults. Use the Merchant Hub to configure individual partner contracts.
                   </p>
                </div>
             </Card>
          </section>

          {/* Payout Scheduling */}
          <section className="space-y-6">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                   <CreditCard size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-900">Payout Schedules</h3>
                   <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Partner Settlement Timing</p>
                </div>
             </div>

             <div className="space-y-6">
                {payoutSchedules.map((schedule) => (
                   <Card key={schedule.id} className="p-6 border-none shadow-xl shadow-slate-200/50 bg-white group hover:scale-[1.02] transition-transform">
                      <div className="flex items-center justify-between mb-6">
                         <div className="flex items-center gap-3">
                            <div className="p-3 bg-slate-50 text-slate-800 rounded-2xl group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                               <Calendar size={20} />
                            </div>
                            <div>
                               <h4 className="text-lg font-black text-slate-900">{schedule.label}</h4>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">ID: {schedule.id.toUpperCase()}</p>
                            </div>
                         </div>
                         <Badge className={cn(
                            "border-none px-3 py-1 font-bold text-[10px] rounded-full",
                            schedule.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-900"
                         )}>
                            {schedule.status}
                         </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-6 pb-6 mb-6 border-b border-slate-100">
                         <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Settlement Period</p>
                            <p className="text-sm font-black text-slate-900">{schedule.period}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Min. Payout</p>
                            <p className="text-sm font-black text-slate-900">{schedule.minAmount}</p>
                         </div>
                      </div>

                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 text-xs font-bold text-amber-600">
                            <Clock size={14} />
                            <span>Next Run: T-14h 22m</span>
                         </div>
                         <button className="p-2 text-slate-800 hover:text-slate-900">
                            <Settings size={18} />
                         </button>
                      </div>
                   </Card>
                ))}

                <Card className="p-6 border-none shadow-xl shadow-slate-200/50 bg-slate-900 text-white">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/10 rounded-2xl">
                         <AlertCircle size={24} className="text-amber-400" />
                      </div>
                      <div className="flex-1">
                         <h4 className="text-sm font-black mb-1">Settlement Delay Policy</h4>
                         <p className="text-[10px] text-slate-800 font-medium">Standard 48-hour hold applies for fraud prevention.</p>
                      </div>
                      <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                         <span className="text-lg font-black">48</span>
                         <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Hrs</span>
                      </div>
                   </div>
                </Card>
             </div>
          </section>
        </div>
      </div>
    </BusinessRulesLayout>
  );
};
