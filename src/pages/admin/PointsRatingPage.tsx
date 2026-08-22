import { toast } from "sonner";

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Star,
  Award,
  ShieldAlert,
  Info,
  Save,
  Plus,
  Package,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Search
} from 'lucide-react';
import { BusinessRulesLayout } from '../../layouts/BusinessRulesLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';
import { pointsEngine } from '@/src/engines/PointsEngine';
import { useAuth } from '@/src/context/AuthContext';
import { apiFetch } from '@/src/lib/apiClient';

import { PointRule, StarThreshold } from '@/src/types';

export const PointsRatingPage = () => {
  const { fbUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [rules, setRules] = useState<PointRule[]>([]);
  const [thresholds, setThresholds] = useState<StarThreshold[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedRules, fetchedThresholds] = await Promise.all([
        pointsEngine.getAllRules(),
        pointsEngine.getAllThresholds()
      ]);
      setRules(fetchedRules);

      // Sort thresholds by minPoints
      fetchedThresholds.sort((a, b) => a.minPoints - b.minPoints);
      setThresholds(fetchedThresholds);
    } catch (error) {
      console.error('Failed to load points and thresholds rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRuleChange = (id: string, value: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, points: parseInt(value) || 0 } : r));
  };

  const handleThresholdChange = (id: string, field: keyof StarThreshold, value: any) => {
    setThresholds(prev => prev.map(t => {
      if (t.id === id) {
        if (field === 'minPoints' || field === 'maxPoints' || field === 'stars') {
          return { ...t, [field]: parseInt(value) || 0 };
        }
        return { ...t, [field]: value };
      }
      return t;
    }));
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      // Save rules
      const rulePromises = rules.map(rule => pointsEngine.updateRule(rule.id, { points: rule.points }, 'admin'));
      // Save thresholds
      const thresholdPromises = thresholds.map(t => pointsEngine.updateThreshold(t.id, {
        minPoints: t.minPoints,
        maxPoints: t.maxPoints,
        boost: t.boost,
        visibility: t.visibility
      }, 'admin'));

      await Promise.all([...rulePromises, ...thresholdPromises]);
      toast.success('Points thresholds and earning rules updated successfully!');
    } catch (e) {
      console.error('Error saving configurations:', e);
      toast.error('Failed to save rules configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculateAll = async () => {
    try {
      setRecalculating(true);
      await apiFetch(fbUser, '/api/points/recalculate-all', { method: 'POST' });
      toast.success('Successfully triggered global recalculation for all hubs!');
    } catch (e: any) {
      console.error('Failed to recalculate:', e);
      toast.error(e.message || 'Failed to connect to the backend recalculation services.');
    } finally {
      setRecalculating(false);
    }
  };

  const handleAddThreshold = async () => {
    const name = prompt('Enter name of new tier:');
    if (!name) return;
    const stars = parseInt(prompt('Enter star rank level (1-5):') || '1') || 1;
    const minPoints = parseInt(prompt('Enter minimum points required:') || '0') || 0;
    const maxPoints = parseInt(prompt('Enter maximum points range:') || '9999999') || 9999999;

    const newId = `level_${thresholds.length + 1}`;
    const newT: StarThreshold = {
      id: newId,
      name,
      minPoints,
      maxPoints,
      boost: '1.0x',
      visibility: 'Standard',
      stars,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false
    };

    try {
      await pointsEngine.createThreshold(newId, newT, 'admin');
      setThresholds(prev => [...prev, newT].sort((a, b) => a.minPoints - b.minPoints));
    } catch (e) {
      console.error('Failed to create new threshold:', e);
    }
  };

  if (loading) {
    return (
      <BusinessRulesLayout>
        <div className="flex items-center justify-center h-96">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </BusinessRulesLayout>
    );
  }

  const baseRules = rules.filter(r => r.points >= 0);
  const deductionRules = rules.filter(r => r.points < 0);

  return (
    <BusinessRulesLayout>
      <div className="space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-primary-600 font-bold uppercase tracking-widest text-[10px] mb-2">Incentive System</p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Points & Star Ratings</h1>
            <p className="text-slate-900 font-medium mt-1">Configure the reward structures that drive partner performance.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button
               variant="outline"
               onClick={handleRecalculateAll}
               disabled={recalculating}
               className="rounded-xl font-bold border-slate-200"
             >
               <RefreshCw size={18} className={cn("mr-2", recalculating && "animate-spin")} />
               {recalculating ? "Recalculating..." : "Force Recalculate"}
             </Button>
             <Button
               onClick={handleSaveAll}
               disabled={saving}
               isLoading={saving}
               className="rounded-xl font-bold shadow-lg shadow-primary-600/20"
             >
               <Save size={18} className="mr-2" />
               Save Thresholds
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          {/* Earning Rules */}
          <div className="xl:col-span-1 space-y-6">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                   <Zap size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-900">Earning Rules</h3>
                   <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Base Points Logic</p>
                </div>
             </div>

             <Card className="p-8 border-none shadow-xl shadow-slate-200/50 space-y-4">
                {baseRules.map((rule) => (
                   <div key={rule.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-primary-200 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
                            <Zap size={18} />
                         </div>
                         <span className="text-xs font-black text-slate-900">{rule.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <input
                           type="number"
                           value={rule.points}
                           onChange={(e) => handleRuleChange(rule.id, e.target.value)}
                           className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-black text-center focus:ring-2 focus:ring-primary-500"
                         />
                      </div>
                   </div>
                ))}

                {deductionRules.length > 0 && (
                  <div className="pt-6 border-t border-slate-100 mt-6">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800 mb-4">Penalties (Deductions)</h4>
                     <div className="space-y-4">
                       {deductionRules.map((rule) => (
                         <div key={rule.id} className="flex items-center justify-between p-4 bg-red-50/50 rounded-2xl border border-red-100 group hover:border-red-200 transition-colors">
                            <div className="flex items-center gap-3">
                               <div className="p-2 rounded-xl bg-red-100 text-red-600">
                                  <ShieldAlert size={18} />
                               </div>
                               <span className="text-xs font-black text-red-700">{rule.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <input
                                 type="number"
                                 value={rule.points}
                                 onChange={(e) => handleRuleChange(rule.id, e.target.value)}
                                 className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-black text-center focus:ring-2 focus:ring-red-500 text-red-600"
                               />
                            </div>
                         </div>
                       ))}
                     </div>
                  </div>
                )}
             </Card>
          </div>

          {/* Star Rating Thresholds */}
          <div className="xl:col-span-2 space-y-6">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-50 text-yellow-600 rounded-2xl">
                   <Star size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-900">Star Rating Thresholds</h3>
                   <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Growth Levels & Benefits</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {thresholds.map((level, idx) => (
                   <motion.div
                     key={level.id}
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: idx * 0.1 }}
                   >
                      <Card className="p-6 border-none shadow-xl shadow-slate-200/50 group relative overflow-hidden">
                         <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-5 bg-yellow-500 group-hover:scale-150 transition-transform duration-500" />

                         <div className="flex items-center justify-between mb-6 relative">
                            <div className="flex items-center gap-3">
                               <div className="p-3 rounded-2xl bg-yellow-50 text-yellow-600">
                                  <Star size={20} />
                               </div>
                               <div>
                                  <h4 className="text-lg font-black text-slate-900">{level.name}</h4>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Level {idx + 1}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-xs font-black text-primary-600">{level.boost} Boost</p>
                               <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest">{level.visibility} Visibility</p>
                            </div>
                         </div>

                         <div className="space-y-4 relative">
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-1">
                                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-800">Min Points</label>
                                  <input
                                    type="number"
                                    value={level.minPoints}
                                    onChange={(e) => handleThresholdChange(level.id, 'minPoints', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 font-bold text-xs"
                                  />
                               </div>
                               <div className="space-y-1">
                                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-800">Max Points</label>
                                  <input
                                    type="number"
                                    value={level.maxPoints}
                                    onChange={(e) => handleThresholdChange(level.id, 'maxPoints', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 font-bold text-xs"
                                  />
                               </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-1">
                                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-800">Search Boost</label>
                                  <input
                                    type="text"
                                    value={level.boost}
                                    onChange={(e) => handleThresholdChange(level.id, 'boost', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 font-bold text-xs"
                                  />
                               </div>
                               <div className="space-y-1">
                                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-800">Search Visibility</label>
                                  <input
                                    type="text"
                                    value={level.visibility}
                                    onChange={(e) => handleThresholdChange(level.id, 'visibility', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 font-bold text-xs"
                                  />
                               </div>
                            </div>

                            <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                               <div className="flex -space-x-2">
                                  {[...Array(level.stars)].map((_, i) => (
                                     <div key={i} className="w-5 h-5 rounded-full bg-yellow-400 border-2 border-white flex items-center justify-center text-[10px]">★</div>
                                  ))}
                                </div>
                               <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest ml-2">Tier Stars</span>
                            </div>
                         </div>
                      </Card>
                   </motion.div>
                ))}

                {/* Add Level Card */}
                <button
                  onClick={handleAddThreshold}
                  className="border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-slate-800 hover:border-primary-400 hover:text-primary-600 transition-all group bg-slate-50/50 min-h-[220px]"
                >
                   <Plus size={32} strokeWidth={1.5} className="mb-2 group-hover:scale-110 transition-transform" />
                   <p className="text-xs font-black uppercase tracking-widest">New Tier</p>
                </button>
             </div>
          </div>
        </div>
      </div>
    </BusinessRulesLayout>
  );
};
