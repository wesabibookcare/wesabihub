import React from 'react';
import {
  ShieldCheck,
  Clock,
  Lock,
  Unlock,
  AlertTriangle,
  RefreshCcw,
  Info,
  Save,
  History,
  CheckCircle2,
  XCircle,
  FileText,
  Truck
} from 'lucide-react';
import { BusinessRulesLayout } from '../../layouts/BusinessRulesLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

export const PaymentProtectionRulesPage = () => {
  const paymentProtectionPolicies = [
    { label: 'Default Inspection Period', value: '48', unit: 'Hrs', description: 'Default time funds are held after delivery for buyer inspection.' },
    { label: 'Max Extension Limits', value: '24', unit: 'Hrs', description: 'Maximum time a buyer can extend the inspection period.' },
    { label: 'Auto Release Rule', value: 'Enabled', unit: '', description: 'Automatically release funds if inspection period expires with no action.' },
    { label: 'Supported Payment Providers', value: 'Flutterwave', unit: '', description: 'Payment gateways enabled for secure payment funding.' },
  ];


  return (
    <BusinessRulesLayout>
      <div className="space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-primary-600 font-bold uppercase tracking-widest text-[10px] mb-2">Financial Integrity</p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Payment Protection Rules</h1>
            <p className="text-slate-900 font-medium mt-1">Configure secure fund holding and automated release conditions.</p>

          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="rounded-xl border-slate-200 font-bold">
               <History size={18} className="mr-2" /> Audit Trail
             </Button>
             <Button className="rounded-xl font-bold shadow-lg shadow-primary-600/20">
               <Save size={18} className="mr-2" /> Save Policies
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Holding & Release Configuration */}
          <section className="space-y-6">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                   <Lock size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-900">Holding & Release</h3>
                   <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Time-based Controls</p>
                </div>
             </div>

             <Card className="p-8 border-none shadow-xl shadow-slate-200/50 space-y-6">
                {paymentProtectionPolicies.map((policy) => (
                   <div key={policy.label} className="space-y-3">
                      <div className="flex justify-between items-start">
                         <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">{policy.label}</label>
                            <p className="text-xs text-slate-900 font-medium">{policy.description}</p>
                         </div>
                         <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100 min-w-[100px]">
                            <input
                               type="text"
                               defaultValue={policy.value}
                               className="bg-transparent border-none focus:outline-none font-black text-right w-full text-sm"
                            />
                            <span className="text-[10px] font-black text-slate-800">{policy.unit}</span>
                         </div>
                      </div>
                   </div>
                ))}
             </Card>

             <Card className="p-6 bg-amber-50 border-amber-100 flex gap-4">
                <div className="p-2 bg-amber-600 text-white rounded-xl h-fit">
                   <AlertTriangle size={20} />
                </div>
                <div>
                   <h4 className="text-sm font-black text-amber-900">Manual Review Required</h4>
                   <p className="text-xs text-amber-700 font-medium mt-0.5">
                      Transactions flagged by the Fraud Engine or exceeding $5,000 always require administrator sign-off before release.
                   </p>
                </div>
             </Card>
          </section>

          {/* Refund & Cancellation Rules */}
          <section className="space-y-6">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                   <RefreshCcw size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-900">Refund & Cancellation</h3>
                   <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Dispute Resolution Logic</p>
                </div>
             </div>

             <Card className="p-8 border-none shadow-xl shadow-slate-200/50 space-y-8">
                <div className="space-y-6">
                   <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                         <XCircle size={18} className="text-red-500" />
                         <span className="text-sm font-bold text-slate-900">Pre-Pickup Cancellation Refund Policy</span>
                      </div>
                      <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px]">100% REFUND</Badge>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                         <CheckCircle2 size={18} className="text-emerald-500" />
                         <span className="text-sm font-bold text-slate-900">Partial Refund Rules (Damaged Goods)</span>
                      </div>
                      <Badge className="bg-amber-50 text-amber-600 border-none font-bold text-[10px]">UP TO 50%</Badge>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                         <Truck size={18} className="text-slate-800" />
                         <span className="text-sm font-bold text-slate-900">In-Transit Cancellation</span>
                      </div>
                      <Badge className="bg-amber-50 text-amber-600 border-none font-bold text-[10px]">PARTIAL (50%)</Badge>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                         <CheckCircle2 size={18} className="text-emerald-500" />
                         <span className="text-sm font-bold text-slate-900">Delivered - No Dispute</span>
                      </div>
                      <Badge className="bg-slate-200 text-slate-800 border-none font-bold text-[10px]">NO REFUND</Badge>
                   </div>
                </div>

                <div className="p-6 bg-slate-900 text-white rounded-2xl relative overflow-hidden">
                   <ShieldCheck size={80} className="absolute -right-4 -bottom-4 opacity-10" />
                   <div className="relative">
                      <h4 className="text-sm font-black mb-4">Payout Provider (Flutterwave)</h4>
                      <div className="flex items-center justify-between mb-4">
                         <span className="text-xs text-slate-800 font-bold">API Connectivity</span>
                         <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-black text-[10px]">OPERATIONAL</Badge>
                      </div>
                      <Button className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs h-auto py-2.5 rounded-xl">
                        Configure Webhooks
                      </Button>
                   </div>
                </div>
             </Card>
          </section>
        </div>
      </div>
    </BusinessRulesLayout>
  );
};
