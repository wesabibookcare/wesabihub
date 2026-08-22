
import React from 'react';
import {
  Settings,
  Globe,
  Coins,
  Ruler,
  Clock,
  Languages,
  Info,
  Save,
  ShieldCheck,
  Zap,
  Bell
} from 'lucide-react';
import { BusinessRulesLayout } from '../../layouts/BusinessRulesLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '@/src/lib/utils';

export const GlobalConfigPage = () => {
  const configs = [
    { label: 'Default Platform Currency', icon: Coins, value: 'USD ($)', options: ['USD ($)', 'NGN (₦)', 'GHS (₵)', 'KES (KSh)'] },
    { label: 'Primary Language', icon: Languages, value: 'English (US)', options: ['English (US)', 'French', 'Swahili', 'Yoruba'] },
    { label: 'Weight Units', icon: Ruler, value: 'Kilograms (kg)', options: ['Kilograms (kg)', 'Pounds (lb)'] },
    { label: 'Dimension Units', icon: Ruler, value: 'Centimeters (cm)', options: ['Centimeters (cm)', 'Inches (in)'] },
    { label: 'Timezone (Server)', icon: Clock, value: 'UTC (GMT+0)', options: ['UTC (GMT+0)', 'WAT (GMT+1)', 'EAT (GMT+3)'] },
    { label: 'Date Format', icon: Clock, value: 'MMM DD, YYYY', options: ['MMM DD, YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'] },
  ];

  return (
    <BusinessRulesLayout>
      <div className="space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-primary-600 font-bold uppercase tracking-widest text-[10px] mb-2">Platform Infrastructure</p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Global Configuration</h1>
            <p className="text-slate-900 font-medium mt-1">Configure foundational settings and regional formatting defaults.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button className="rounded-xl font-bold shadow-lg shadow-primary-600/20">
               <Save size={18} className="mr-2" /> Save Settings
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <Card className="p-8 border-none shadow-xl shadow-slate-200/50 space-y-8">
              <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
                <div className="p-3 bg-slate-50 text-slate-800 rounded-2xl">
                   <Globe size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-900">Localization & Units</h3>
                   <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Global Measurement Defaults</p>
                </div>
              </div>

              <div className="space-y-6">
                 {configs.map((config) => (
                    <div key={config.label} className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">{config.label}</label>
                       <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 focus-within:border-primary-300 transition-colors">
                          <config.icon size={18} className="text-slate-800" />
                          <select className="flex-1 bg-transparent border-none focus:outline-none font-bold text-sm">
                             {config.options.map(opt => (
                                <option key={opt} selected={opt === config.value}>{opt}</option>
                             ))}
                          </select>
                       </div>
                    </div>
                 ))}
              </div>
           </Card>

           <div className="space-y-8">
              <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-slate-900 text-white overflow-hidden relative">
                 <ShieldCheck size={120} className="absolute -right-8 -bottom-8 opacity-10" />
                 <div className="relative">
                    <h3 className="text-xl font-black tracking-tight mb-2">Security & Access</h3>
                    <p className="text-slate-800 text-xs font-medium mb-8">System-level security rules and admin access policies.</p>

                    <div className="space-y-4">
                       {[
                          { label: 'Admin 2FA Requirement', status: 'Mandatory', active: true },
                          { label: 'Session Auto-Logout', status: '30 Minutes', active: true },
                          { label: 'Maintenance Mode', status: 'Inactive', active: false },
                       ].map(policy => (
                          <div key={policy.label} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                             <div>
                                <p className="text-xs font-bold">{policy.label}</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-900 mt-1">{policy.status}</p>
                             </div>
                             <div className={cn(
                                "w-10 h-5 rounded-full relative transition-colors",
                                policy.active ? "bg-primary-600" : "bg-slate-700"
                             )}>
                                <div className={cn(
                                   "w-3 h-3 bg-white rounded-full absolute top-1 transition-all",
                                   policy.active ? "right-1" : "left-1"
                                )} />
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </Card>

              <Card className="p-8 border-none shadow-xl shadow-slate-200/50 space-y-6">
                 <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                       <Bell size={24} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900">System Notifications</h3>
                       <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Global Communication Rules</p>
                    </div>
                 </div>

                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Push Notification Gateway</span>
                    <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px]">CONNECTED</Badge>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Email SMTP Service</span>
                    <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px]">OPTIMAL</Badge>
                 </div>
              </Card>
           </div>
        </div>
      </div>
    </BusinessRulesLayout>
  );
};
