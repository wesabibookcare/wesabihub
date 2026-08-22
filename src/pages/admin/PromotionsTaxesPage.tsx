import React from 'react';
import {
  Tag,
  Globe,
  Percent,
  Plus,
  Search,
  Filter,
  Trash2,
  Save,
  History,
  Megaphone,
  Ticket,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Info
} from 'lucide-react';
import { BusinessRulesLayout } from '../../layouts/BusinessRulesLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

export const PromotionsTaxesPage = () => {
  const promotions = [
    { id: '1', name: 'Welcome Launch', code: 'HELLO24', discount: '20%', type: 'Platform', status: 'Active' },
    { id: '2', name: 'Merchant Bulk Week', code: 'BULK77', discount: '$15.00', type: 'Merchant', status: 'Scheduled' },
    { id: '3', name: 'Free Friday Delivery', code: 'FRIDAY', discount: '100%', type: 'Platform', status: 'Expired' },
  ];

  const taxRules = [
    { country: 'Nigeria', vat: '7.5%', duty: '5.0%', adminFee: '$2.00', status: 'Active' },
    { country: 'Ghana', vat: '12.5%', duty: '3.5%', adminFee: '$1.50', status: 'Active' },
    { country: 'Kenya', vat: '16.0%', duty: '2.0%', adminFee: '$2.50', status: 'Draft' },
  ];

  return (
    <BusinessRulesLayout>
      <div className="space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-primary-600 font-bold uppercase tracking-widest text-[10px] mb-2">Campaigns & Compliance</p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Promotions & Taxes</h1>
            <p className="text-slate-900 font-medium mt-1">Manage global discount campaigns and regional tax compliance rules.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="rounded-xl border-slate-200 font-bold">
               <History size={18} className="mr-2" /> Change Logs
             </Button>
             <Button className="rounded-xl font-bold shadow-lg shadow-primary-600/20">
               <Plus size={18} className="mr-2" /> Create New
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Active Promotions */}
          <section className="space-y-6">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                   <Tag size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-900">Active Promotions</h3>
                   <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Coupons & Campaigns</p>
                </div>
             </div>

             <div className="space-y-4">
                {promotions.map((promo, idx) => (
                   <motion.div
                     key={promo.id}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: idx * 0.1 }}
                   >
                      <Card className="p-6 border-none shadow-xl shadow-slate-200/50 bg-white group hover:scale-[1.02] transition-transform">
                         <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                               <div className="p-3 bg-slate-50 text-slate-800 rounded-2xl group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                  <Ticket size={20} />
                               </div>
                               <div>
                                  <h4 className="text-lg font-black text-slate-900">{promo.name}</h4>
                                  <Badge className="bg-slate-100 text-slate-900 border-none px-2 py-0.5 font-bold text-[9px] uppercase tracking-widest">{promo.type}</Badge>
                               </div>
                            </div>
                            <Badge className={cn(
                               "border-none px-3 py-1 font-bold text-[10px] rounded-full",
                               promo.status === 'Active' ? "bg-emerald-50 text-emerald-600" :
                               promo.status === 'Scheduled' ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-900"
                            )}>
                               {promo.status}
                            </Badge>
                         </div>

                         <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-800 mb-1">Coupon Code</p>
                               <p className="text-sm font-black font-mono text-slate-900">{promo.code}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-800 mb-1">Benefit</p>
                               <p className="text-sm font-black text-primary-600">{promo.discount} OFF</p>
                            </div>
                         </div>
                      </Card>
                   </motion.div>
                ))}
             </div>
          </section>

          {/* Regional Tax Rules */}
          <section className="space-y-6">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                   <Globe size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-900">Taxes & Fees</h3>
                   <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Regional Compliance</p>
                </div>
             </div>

             <Card className="p-8 border-none shadow-xl shadow-slate-200/50">
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">
                            <th className="pb-4">Country</th>
                            <th className="pb-4">VAT/Tax</th>
                            <th className="pb-4">Duty</th>
                            <th className="pb-4">Admin Fee</th>
                            <th className="pb-4 text-right">Action</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {taxRules.map((rule, idx) => (
                            <tr key={idx} className="group">
                               <td className="py-4">
                                  <div className="flex items-center gap-2">
                                     <span className="text-sm font-black text-slate-900">{rule.country}</span>
                                     {rule.status === 'Draft' && <Badge className="bg-slate-100 text-slate-800 border-none px-1.5 py-0.5 text-[8px] font-black">DRAFT</Badge>}
                                  </div>
                               </td>
                               <td className="py-4">
                                  <input type="text" defaultValue={rule.vat} className="w-16 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-xs font-black focus:outline-none" />
                               </td>
                               <td className="py-4">
                                  <input type="text" defaultValue={rule.duty} className="w-16 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-xs font-black focus:outline-none" />
                               </td>
                               <td className="py-4">
                                  <input type="text" defaultValue={rule.adminFee} className="w-20 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-xs font-black focus:outline-none" />
                               </td>
                               <td className="py-4 text-right">
                                  <Button variant="ghost" className="p-2 h-auto text-slate-800 hover:text-red-500">
                                     <Trash2 size={16} />
                                  </Button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>

                <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Info size={18} className="text-slate-800" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Rules apply to all shipment invoices</p>
                   </div>
                   <Button className="bg-slate-900 text-white hover:bg-black font-black text-xs px-6 py-2.5 h-auto rounded-xl">
                      Save Tax Table
                   </Button>
                </div>
             </Card>

             <Card className="p-6 bg-indigo-900 text-white rounded-2xl relative overflow-hidden">
                <Megaphone size={120} className="absolute -right-8 -bottom-8 opacity-10" />
                <div className="relative">
                   <h4 className="text-lg font-black mb-2 tracking-tight">Active Campaigns</h4>
                   <p className="text-indigo-200 text-xs font-medium mb-6">4 Ongoing promotions currently affecting platform revenue by 12.4%.</p>
                   <Button className="bg-white text-indigo-900 hover:bg-indigo-50 font-black text-xs px-6 py-2.5 h-auto rounded-xl border-none">
                      View Performance
                   </Button>
                </div>
             </Card>
          </section>
        </div>
      </div>
    </BusinessRulesLayout>
  );
};
