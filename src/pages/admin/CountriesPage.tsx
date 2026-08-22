
import React, { useState, useEffect } from 'react';
import {
  Globe,
  MapPin,
  Plus,
  Search,
  ArrowRight,
  ChevronRight,
  Trash2,
  Edit3,
  Coins,
  Languages,
  Percent
} from 'lucide-react';
import { motion } from 'motion/react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { configurationEngine } from '@/src/engines';
import { Country } from '../../types';

export const CountriesPage = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = configurationEngine.subscribeToCountries((data) => {
      setCountries(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-10 ">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-primary-600 font-bold uppercase tracking-widest text-[10px] mb-2">Regional Operations</p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Geographic Management</h1>
            <p className="text-slate-900 font-medium mt-1">Configure supported countries, regions, and currencies.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button className="rounded-xl font-bold shadow-lg shadow-primary-600/20">
               <Plus size={18} className="mr-2" /> Add Country
             </Button>
          </div>
        </div>

        {/* Quick Config */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
              { label: 'Currencies', icon: Coins, count: '4 Active', color: 'text-amber-600', bg: 'bg-amber-600/10' },
              { label: 'Languages', icon: Languages, count: '2 Official', color: 'text-indigo-600', bg: 'bg-indigo-600/10' },
              { label: 'Tax Zones', icon: Percent, count: '12 Rules', color: 'text-emerald-600', bg: 'bg-emerald-600/10' },
           ].map(item => (
              <Card key={item.label} className="p-6 border-none shadow-xl shadow-slate-200/50 flex items-center gap-4 hover:scale-105 transition-transform cursor-pointer group">
                 <div className={cn("p-4 rounded-2xl", item.bg)}>
                    <item.icon size={24} className={item.color} />
                 </div>
                 <div>
                    <p className="text-xs font-black text-slate-800 uppercase tracking-widest">{item.label}</p>
                    <p className="text-lg font-black text-slate-900">{item.count}</p>
                 </div>
                 <ChevronRight size={18} className="ml-auto text-slate-300 group-hover:text-slate-900 transition-colors" />
              </Card>
           ))}
        </div>

        {/* Country List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {countries.map((country, idx) => (
              <motion.div
                key={country.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                 <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:shadow-2xl transition-all">
                    <div className="flex items-start justify-between mb-8">
                       <div className="flex items-center gap-4">
                          {/* <div className="text-5xl">{country.flag}</div> */}
                          <div>
                             <h3 className="text-2xl font-black tracking-tight text-slate-900">{country.name}</h3>
                             <p className="text-xs font-black text-slate-800 uppercase tracking-widest">ISO Code: {country.code}</p>
                          </div>
                       </div>
                       <Badge className={cn(
                          "border-none px-3 py-1 font-bold text-[10px] rounded-full",
                          country.active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-900"
                       )}>
                          {country.active ? 'OPERATIONAL' : 'DORMANT'}
                       </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                       <div className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-lg font-black text-slate-900">{country.currency}</p>
                          <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Currency</p>
                       </div>
                    </div>

                    <div className="flex items-center gap-3">
                       <Button className="flex-1 bg-slate-900 text-white hover:bg-black font-black text-xs py-3 rounded-xl border-none">
                          Manage
                       </Button>
                       <Button variant="outline" className="p-3 border-slate-200 rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all">
                          <Trash2 size={18} />
                       </Button>
                    </div>
                 </Card>
              </motion.div>
           ))}

           {/* Add Country Button Card */}
           <button className="w-full border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-slate-800 hover:border-primary-400 hover:text-primary-600 transition-all group bg-slate-50/50 min-h-[300px]">
              <div className="p-4 rounded-2xl bg-white shadow-xl shadow-slate-200/50 group-hover:scale-110 transition-transform mb-4">
                 <Globe size={32} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-black uppercase tracking-widest">Expand Operations</p>
           </button>
        </div>
      </div>
    </AdminLayout>
  );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
