
import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Calculator,
  Info,
  Save,
  History,
  Globe,
  Truck,
  Layers,
  Maximize2,
  AlertCircle,
  Zap,
  Package,
  ShieldCheck
} from 'lucide-react';
import { BusinessRulesLayout } from '../../layouts/BusinessRulesLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

export const PricingRulesPage = () => {
  const [activeTab, setActiveTab] = useState<'CONFIG' | 'SIMULATOR'>('CONFIG');

  return (
    <BusinessRulesLayout>
      <div className="space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-primary-600 font-bold uppercase tracking-widest text-[10px] mb-2">Platform Control</p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Pricing Configuration</h1>
            <p className="text-slate-900 font-medium mt-1">Define the core economic rules for all shipping operations.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="rounded-xl border-slate-200 font-bold">
               <History size={18} className="mr-2" /> Version History
             </Button>
             <Button className="rounded-xl font-bold shadow-lg shadow-primary-600/20">
               <Save size={18} className="mr-2" /> Publish Changes
             </Button>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('CONFIG')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-black transition-all",
              activeTab === 'CONFIG' ? "bg-white text-slate-900 shadow-sm" : "text-slate-900 hover:text-slate-900"
            )}
          >
            Rule Configuration
          </button>
          <button
            onClick={() => setActiveTab('SIMULATOR')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-black transition-all",
              activeTab === 'SIMULATOR' ? "bg-white text-slate-900 shadow-sm" : "text-slate-900 hover:text-slate-900"
            )}
          >
            Price Simulator
          </button>
        </div>

        {activeTab === 'CONFIG' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Global Base Rules */}
            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 space-y-8">
              <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <DollarSign size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-slate-900">Base Logistics Rules</h3>
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-widest mt-0.5">Global Default Settings</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Minimum Shipping Fee</label>
                  <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-800 font-black">$</span>
                    <input type="number" defaultValue={5.00} className="bg-transparent border-none focus:outline-none font-bold w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Base Weight (kg)</label>
                  <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <input type="number" defaultValue={1.0} className="bg-transparent border-none focus:outline-none font-bold w-full" />
                    <span className="text-slate-800 font-bold text-xs">KG</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Maximum Weight (kg)</label>
                  <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <input type="number" defaultValue={50.0} className="bg-transparent border-none focus:outline-none font-bold w-full" />
                    <span className="text-slate-800 font-bold text-xs">KG</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Weight Multiplier</label>
                  <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <input type="number" defaultValue={1.5} className="bg-transparent border-none focus:outline-none font-bold w-full" />
                    <span className="text-slate-800 font-bold text-xs">x</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Surcharges & Modifiers */}
            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 space-y-8">
              <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <Zap size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-slate-900">Surcharges & Modifiers</h3>
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-widest mt-0.5">Special Handling Fees</p>
                </div>
              </div>

              <div className="space-y-4">
                 {[
                    { label: 'Oversized Parcel Fee', icon: Maximize2, value: '25.00', type: 'FLAT' },
                    { label: 'Fragile Handling Fee', icon: Package, value: '10.00', type: 'FLAT' },
                    { label: 'Insurance (per $100)', icon: ShieldCheck, value: '2.50', type: 'FLAT' },
                    { label: 'Weekend/Holiday Surcharge', icon: Globe, value: '15', type: 'PERCENT' },
                 ].map(mod => (
                    <div key={mod.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <div className="flex items-center gap-3">
                          <mod.icon size={18} className="text-slate-800" />
                          <span className="text-sm font-bold text-slate-900">{mod.label}</span>
                       </div>
                       <div className="flex items-center gap-2 w-32">
                          <input
                            type="text"
                            defaultValue={mod.value}
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-black text-right w-full"
                          />
                          <span className="text-[10px] font-black text-slate-800">{mod.type === 'FLAT' ? '$' : '%'}</span>
                       </div>
                    </div>
                 ))}
              </div>
            </Card>

            {/* Regional Rules */}
            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 lg:col-span-2 space-y-8">
               <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                      <Globe size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight text-slate-900">Regional Pricing Overrides</h3>
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-widest mt-0.5">Country & City Specific Rules</p>
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-xl border-slate-200 font-bold text-xs h-auto py-2">
                    <Plus size={16} className="mr-2" /> Add Override
                  </Button>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">
                           <th className="pb-4">Region</th>
                           <th className="pb-4">Service Type</th>
                           <th className="pb-4">Base Modifier</th>
                           <th className="pb-4">Status</th>
                           <th className="pb-4 text-right">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {[
                           { region: 'Nigeria / Lagos', service: 'Express', modifier: '+15%', status: 'Active' },
                           { region: 'Ghana / Accra', service: 'Same Day', modifier: '+$12.00', status: 'Active' },
                           { region: 'Kenya / Nairobi', service: 'Standard', modifier: '-5%', status: 'Scheduled' },
                        ].map((row, idx) => (
                           <tr key={idx} className="group">
                              <td className="py-4">
                                 <p className="text-sm font-black text-slate-900">{row.region}</p>
                              </td>
                              <td className="py-4">
                                 <Badge className="bg-slate-100 text-slate-800 border-none px-2 py-0.5 font-bold text-[10px]">{row.service}</Badge>
                              </td>
                              <td className="py-4">
                                 <span className="text-sm font-black text-primary-600">{row.modifier}</span>
                              </td>
                              <td className="py-4">
                                 <Badge className={cn(
                                    "border-none px-2 py-0.5 font-bold text-[10px]",
                                    row.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                 )}>{row.status}</Badge>
                              </td>
                              <td className="py-4 text-right">
                                 <Button variant="ghost" className="p-2 h-auto text-slate-800 hover:text-slate-900">
                                    <Plus size={18} className="rotate-45" />
                                 </Button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Simulator Inputs */}
            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 space-y-8 lg:col-span-1">
               <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
                <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl">
                  <Calculator size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-slate-900">Pricing Simulator</h3>
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-widest mt-0.5">Test Rule Logic</p>
                </div>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Origin Region</label>
                    <select className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-bold text-sm">
                       <option>Nigeria / Lagos</option>
                       <option>Ghana / Accra</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Destination Region</label>
                    <select className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-bold text-sm">
                       <option>Nigeria / Abuja</option>
                       <option>Nigeria / Port Harcourt</option>
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Weight (KG)</label>
                       <input type="number" defaultValue={2.5} className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-bold text-sm" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Service</label>
                       <select className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-bold text-sm">
                          <option>Express</option>
                          <option>Standard</option>
                       </select>
                    </div>
                 </div>
                 <div className="space-y-4 pt-4 border-t border-slate-100">
                    <label className="flex items-center gap-3 cursor-pointer group">
                       <input type="checkbox" className="w-5 h-5 rounded-lg border-2 border-slate-200 checked:bg-primary-600 transition-all" />
                       <span className="text-sm font-bold text-slate-800 group-hover:text-slate-900">Fragile Handling</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                       <input type="checkbox" className="w-5 h-5 rounded-lg border-2 border-slate-200 checked:bg-primary-600 transition-all" />
                       <span className="text-sm font-bold text-slate-800 group-hover:text-slate-900">High-Value Insurance</span>
                    </label>
                 </div>

                 <Button className="w-full rounded-2xl py-6 font-black tracking-tight shadow-xl shadow-primary-600/20 mt-4">
                    Calculate Preview Price
                 </Button>
              </div>
            </Card>

            {/* Simulation Results */}
            <div className="lg:col-span-2 space-y-8">
               <Card className="p-10 border-none shadow-2xl shadow-slate-200/60 bg-slate-900 text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                  <div className="relative">
                     <p className="text-primary-400 font-black uppercase tracking-[0.3em] text-[10px] mb-4">Estimated Shipping Cost</p>
                     <div className="flex items-end gap-2">
                        <span className="text-6xl font-black tracking-tighter">$42.50</span>
                        <span className="text-slate-800 font-bold mb-2 uppercase tracking-widest text-xs">USD</span>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 pt-12 border-t border-white/10">
                        <div>
                           <p className="text-slate-800 font-black uppercase tracking-widest text-[9px] mb-2">Base Logistics</p>
                           <p className="text-xl font-black">$25.00</p>
                        </div>
                        <div>
                           <p className="text-slate-800 font-black uppercase tracking-widest text-[9px] mb-2">Surcharges</p>
                           <p className="text-xl font-black">$12.50</p>
                        </div>
                        <div>
                           <p className="text-slate-800 font-black uppercase tracking-widest text-[9px] mb-2">Taxes (VAT 5%)</p>
                           <p className="text-xl font-black">$5.00</p>
                        </div>
                     </div>
                  </div>
               </Card>

               <Card className="p-8 border-none shadow-xl shadow-slate-200/50">
                  <h3 className="text-lg font-black text-slate-900 mb-6">Price Calculation Breakdown</h3>
                  <div className="space-y-4">
                     {[
                        { label: 'Minimum Base Fee', value: '$5.00' },
                        { label: 'Weight Adder (2.5kg @ $1.50/kg)', value: '$3.75' },
                        { label: 'Express Service Multiplier (1.5x)', value: '$13.12' },
                        { label: 'Fragile Handling Fixed Surcharge', value: '$10.00' },
                        { label: 'Insurance (declared $500)', value: '$12.50' },
                     ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-none">
                           <span className="text-sm font-bold text-slate-900">{item.label}</span>
                           <span className="text-sm font-black text-slate-900">{item.value}</span>
                        </div>
                     ))}
                  </div>
               </Card>
            </div>
          </div>
        )}
      </div>
    </BusinessRulesLayout>
  );
};
