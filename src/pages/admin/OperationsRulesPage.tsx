
import React from 'react';
import {
  Package,
  Map,
  Star,
  ShieldAlert,
  Info,
  Save,
  Layers,
  Clock,
  ArrowRight,
  Maximize2,
  Trash2,
  Plus,
  Box,
  Truck
} from 'lucide-react';
import { BusinessRulesLayout } from '../../layouts/BusinessRulesLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

export const OperationsRulesPage = () => {
  const parcelRules = [
    { label: 'Max Parcel Weight', value: '50.0', unit: 'KG' },
    { label: 'Storage Duration (Point)', value: '72', unit: 'Hrs' },
    { label: 'Pickup Deadline', value: '48', unit: 'Hrs' },
    { label: 'Max Storage Fee (Daily)', value: '2.50', unit: '$' },
  ];

  const serviceLevels = [
    { id: 'standard', name: 'Standard Delivery', time: '3-5 Days', cost: 'Base', status: 'Active' },
    { id: 'express', name: 'Express Shipping', time: '24-48 Hours', cost: '1.5x Base', status: 'Active' },
    { id: 'same_day', name: 'Same Day Delivery', time: '6-12 Hours', cost: '3.0x Base', status: 'Active' },
  ];

  return (
    <BusinessRulesLayout>
      <div className="space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-primary-600 font-bold uppercase tracking-widest text-[10px] mb-2">Operational Integrity</p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Operations Rules</h1>
            <p className="text-slate-900 font-medium mt-1">Configure parcel limits, storage policies, and service level definitions.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button className="rounded-xl font-bold shadow-lg shadow-primary-600/20">
               <Save size={18} className="mr-2" /> Save Operations
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Parcel & Storage Rules */}
          <section className="lg:col-span-1 space-y-6">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                   <Package size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-900">Parcel & Storage</h3>
                   <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Handling Boundaries</p>
                </div>
             </div>

             <Card className="p-8 border-none shadow-xl shadow-slate-200/50 space-y-6">
                {parcelRules.map((rule) => (
                   <div key={rule.label} className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">{rule.label}</label>
                      <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 group hover:border-primary-200 transition-colors">
                         <input
                           type="text"
                           defaultValue={rule.value}
                           className="flex-1 bg-transparent border-none focus:outline-none font-black text-lg"
                         />
                         <Badge className="bg-slate-200 text-slate-800 border-none font-bold text-[10px]">{rule.unit}</Badge>
                      </div>
                   </div>
                ))}

                <div className="pt-6 border-t border-slate-100">
                   <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                      <ShieldAlert size={20} className="text-amber-600 shrink-0" />
                      <p className="text-xs text-amber-800 font-medium leading-relaxed">
                         Abandoned parcel workflow triggers automatically after storage duration expires.
                      </p>
                   </div>
                </div>
             </Card>
          </section>

          {/* Service Levels */}
          <section className="lg:col-span-2 space-y-6">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                   <Truck size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-900">Service Level Definitions</h3>
                   <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Delivery Offerings</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {serviceLevels.map((service, idx) => (
                   <motion.div
                     key={service.id}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: idx * 0.1 }}
                   >
                      <Card className="p-6 border-none shadow-xl shadow-slate-200/50 bg-white hover:shadow-2xl transition-all group overflow-hidden relative">
                         <div className="flex items-center justify-between mb-8">
                            <div className="p-4 rounded-2xl bg-slate-50 text-slate-800 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                               <Box size={24} />
                            </div>
                            <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-1 font-bold text-[10px] rounded-full">
                               {service.status}
                            </Badge>
                         </div>

                         <div className="mb-8">
                            <h4 className="text-xl font-black text-slate-900 mb-1">{service.name}</h4>
                            <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                               <Clock size={14} className="text-slate-300" /> Promised: {service.time}
                            </p>
                         </div>

                         <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Pricing Logic</p>
                               <p className="text-sm font-black text-primary-600">{service.cost}</p>
                            </div>
                            <button className="text-slate-300 hover:text-slate-900 transition-colors">
                               <ArrowRight size={20} />
                            </button>
                         </div>
                      </Card>
                   </motion.div>
                ))}

                {/* Add Service Card */}
                <button className="border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-slate-800 hover:border-primary-400 hover:text-primary-600 transition-all group bg-slate-50/50 min-h-[260px]">
                   <Plus size={32} strokeWidth={1.5} className="mb-2 group-hover:scale-110 transition-transform" />
                   <p className="text-xs font-black uppercase tracking-widest">New Offering</p>
                </button>
             </div>

             {/* Zone Management Preview */}
             <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-slate-900 text-white overflow-hidden relative">
                <Map size={140} className="absolute -right-8 -bottom-8 opacity-10" />
                <div className="relative">
                   <div className="flex items-center justify-between mb-8">
                      <div>
                         <h3 className="text-xl font-black tracking-tight">Zone Management</h3>
                         <p className="text-xs text-slate-800 font-medium">Define operational boundaries and regional multipliers.</p>
                      </div>
                      <Button className="bg-white text-slate-900 hover:bg-slate-50 font-black text-xs px-6 py-3 rounded-xl h-auto">
                         Open Map Editor
                      </Button>
                   </div>

                   <div className="grid grid-cols-3 gap-6">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-2">Active Zones</p>
                         <p className="text-2xl font-black">124</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-2">Restricted</p>
                         <p className="text-2xl font-black text-red-400">8</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-2">Density (Avg)</p>
                         <p className="text-2xl font-black">8.4</p>
                      </div>
                   </div>
                </div>
             </Card>
          </section>
        </div>
      </div>
    </BusinessRulesLayout>
  );
};
