
import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Save,
  History,
  Plus,
  Globe,
  Briefcase,
  AlertCircle,
  TrendingUp,
  Percent,
  Calendar,
  Layers,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  Settings,
  ArrowRight
} from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { commissionRuleRepository } from '@/src/services/db/CommissionRuleRepository';
import { auditEngine } from '@/src/engines/AuditEngine';
import { configurationEngine } from '@/src/engines/ConfigurationEngine';
import { useAuth } from '@/src/context/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';



interface CommissionRule {
  id: string;
  platformPercentage: number;
  centrePercentage: number;
  futureLogisticsPercentage: number;
  effectiveFrom: string;
  effectiveTo?: string;
  country: string;
  serviceType: string;
  merchantOverrides?: Record<string, number>;
  hubOverrides?: Record<string, number>;
  version: number;
  isActive: boolean;
  createdAt: any;
}

export const CommissionManagementPage = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'RULES' | 'TIERS' | 'REPORTS' | 'AUDIT'>('RULES');
  const [monthlyTiers, setMonthlyTiers] = useState<Array<{ id: string; minParcels: number; maxParcels: number | null; hubPercentage: number; wesabiPercentage: number; isActive: boolean }>>([
    { id: 'tier-1', minParcels: 1, maxParcels: 500, hubPercentage: 50, wesabiPercentage: 50, isActive: true },
    { id: 'tier-2', minParcels: 501, maxParcels: 1000, hubPercentage: 55, wesabiPercentage: 45, isActive: true },
    { id: 'tier-3', minParcels: 1001, maxParcels: null, hubPercentage: 60, wesabiPercentage: 40, isActive: true },
  ]);
  const [tierError, setTierError] = useState<string>('');
  const [newRule, setNewRule] = useState<Partial<CommissionRule>>({
    platformPercentage: 40,
    centrePercentage: 60,
    futureLogisticsPercentage: 0,
    country: 'Nigeria',
    serviceType: 'all',
    isActive: true
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const fetchedRules = await commissionRuleRepository.query([]);
fetchedRules.sort((a, b) => b.version - a.version);
      setRules(fetchedRules);
    } catch (error) {
      console.error('Error fetching commission rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async () => {
    try {
      const version = rules.length > 0 ? Math.max(...rules.map(r => r.version)) + 1 : 1;

      // Deactivate old rules for same country/type if needed
      // For now, just add new versioned rule

      const ruleData = {
        ...newRule,
        version,
        createdAt: new Date().toISOString(),
        isActive: true
      };

      await commissionRuleRepository.create(Date.now().toString(), ruleData as any);

      // Log the change
      await auditEngine.logEvent({
        userId: user?.uid || 'system',
        action: 'CREATE_RULE',
        details: { ruleVersion: version, message: 'New commission rule version created' },
        result: 'SUCCESS'
      });

      setShowAddModal(false);
      fetchRules();
    } catch (error) {
      console.error('Error saving rule:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-10 ">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-primary-600 font-bold uppercase tracking-widest text-[10px] mb-2">Platform Economics</p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Commission Engine</h1>
            <p className="text-slate-900 font-medium mt-1">Configure revenue distribution and automated settlements.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="rounded-xl border-slate-200 font-bold" onClick={() => setActiveTab('AUDIT')}>
               <History size={18} className="mr-2" /> Audit Trail
             </Button>
             <Button className="rounded-xl font-bold shadow-lg shadow-primary-600/20" onClick={() => setShowAddModal(true)}>
               <Plus size={18} className="mr-2" /> Create New Rule
             </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
          {[
            { id: 'RULES', label: 'Distribution Rules', icon: Settings },
            { id: 'TIERS', label: 'Monthly Volume Split Tiers', icon: Layers },
            { id: 'REPORTS', label: 'Revenue Reports', icon: TrendingUp },
            { id: 'AUDIT', label: 'Audit Logs', icon: History },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all",
                activeTab === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-900 hover:text-slate-900"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'RULES' && (
          <div className="space-y-8">
            {/* Active Rules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <Card className="p-6 border-none shadow-xl shadow-slate-200/50 bg-slate-900 text-white">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-white/10 rounded-2xl">
                      <Percent size={20} className="text-primary-400" />
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none">ACTIVE</Badge>
                  </div>
                  <h3 className="text-lg font-black tracking-tight mb-4">Default Global Distribution</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">Platform</span>
                      <span className="text-xl font-black">40%</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">Centre</span>
                      <span className="text-xl font-black">60%</span>
                    </div>
                  </div>
               </Card>

               <Card className="p-6 border-none shadow-xl shadow-slate-200/50">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-blue-50 rounded-2xl">
                      <Globe size={20} className="text-blue-600" />
                    </div>
                    <Badge className="bg-blue-50 text-blue-600 border-none">SYSTEM</Badge>
                  </div>
                  <h3 className="text-lg font-black tracking-tight text-slate-900 mb-4">Regional Overrides</h3>
                  <p className="text-sm text-slate-900 font-medium mb-6">Specific rules applied to cross-border shipments and selected countries.</p>
                  <Button variant="ghost" className="w-full justify-between font-bold text-primary-600 p-0">
                    View 4 Overrides <ArrowRight size={16} />
                  </Button>
               </Card>

               <Card className="p-6 border-none shadow-xl shadow-slate-200/50">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-amber-50 rounded-2xl">
                      <Briefcase size={20} className="text-amber-600" />
                    </div>
                    <Badge className="bg-amber-50 text-amber-600 border-none">OPTIONAL</Badge>
                  </div>
                  <h3 className="text-lg font-black tracking-tight text-slate-900 mb-4">Merchant Overrides</h3>
                  <p className="text-sm text-slate-900 font-medium mb-6">Special commission rates negotiated with high-volume merchants.</p>
                  <Button variant="ghost" className="w-full justify-between font-bold text-primary-600 p-0">
                    Manage Contracts <ArrowRight size={16} />
                  </Button>
               </Card>
            </div>

            {/* Rules Table */}
            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 overflow-hidden">
               <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black tracking-tight text-slate-900">Commission Rule History</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl font-bold">
                       <Filter size={14} className="mr-2" /> Filter
                    </Button>
                  </div>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 border-b border-slate-100">
                        <th className="pb-4 text-left">Version</th>
                        <th className="pb-4 text-left">Country</th>
                        <th className="pb-4 text-left">Platform %</th>
                        <th className="pb-4 text-left">Centre %</th>
                        <th className="pb-4 text-left">Future %</th>
                        <th className="pb-4 text-left">Status</th>
                        <th className="pb-4 text-left">Created At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rules.map((rule) => (
                        <tr key={rule.id} className="group hover:bg-slate-50 transition-colors">
                          <td className="py-4">
                            <span className="text-sm font-black text-slate-900">v{rule.version}</span>
                          </td>
                          <td className="py-4 text-sm font-bold text-slate-800">{rule.country}</td>
                          <td className="py-4 text-sm font-black text-primary-600">{rule.platformPercentage}%</td>
                          <td className="py-4 text-sm font-black text-emerald-600">{rule.centrePercentage}%</td>
                          <td className="py-4 text-sm font-black text-indigo-600">{rule.futureLogisticsPercentage}%</td>
                          <td className="py-4">
                            <Badge className={cn(
                              "border-none px-2 py-0.5 font-bold text-[10px]",
                              rule.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-800"
                            )}>
                              {rule.isActive ? 'Active' : 'Archived'}
                            </Badge>
                          </td>
                          <td className="py-4 text-xs font-bold text-slate-800">
                            {rule.createdAt?.toDate?.()?.toLocaleDateString() || 'Just now'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </Card>
          </div>
        )}

        {activeTab === 'TIERS' && (
          <div className="space-y-8">
            <Card className="p-8 border-none shadow-xl shadow-slate-200/50">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900">Hub Monthly Volume Tier Splits</h2>
                  <p className="text-slate-500 text-sm font-medium mt-1">Configure progressive revenue share splits based on qualifying collected & paid parcels per calendar month.</p>
                </div>
                <Button
                  className="rounded-xl font-bold"
                  onClick={() => {
                    const lastTier = monthlyTiers[monthlyTiers.length - 1];
                    const nextMin = lastTier ? (lastTier.maxParcels ? lastTier.maxParcels + 1 : lastTier.minParcels + 500) : 1;
                    setMonthlyTiers([
                      ...monthlyTiers,
                      { id: `tier-${Date.now()}`, minParcels: nextMin, maxParcels: nextMin + 499, hubPercentage: 50, wesabiPercentage: 50, isActive: true }
                    ]);
                  }}
                >
                  <Plus size={16} className="mr-2" /> Add Tier
                </Button>
              </div>

              {tierError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-bold flex items-center gap-2">
                  <AlertCircle size={18} />
                  {tierError}
                </div>
              )}

              <div className="space-y-4">
                {monthlyTiers.map((tier, idx) => (
                  <div key={tier.id} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">T{idx + 1}</span>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Qualifying Parcel Range</p>
                        <p className="text-sm font-black text-slate-900">
                          {tier.minParcels} – {tier.maxParcels ? tier.maxParcels : '∞'} parcels / month
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hub Share %</label>
                        <input
                          type="number"
                          value={tier.hubPercentage}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updated = [...monthlyTiers];
                            updated[idx].hubPercentage = val;
                            updated[idx].wesabiPercentage = 100 - val;
                            setMonthlyTiers(updated);
                          }}
                          className="w-24 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-black text-emerald-600"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">OmorfiHub Share %</label>
                        <input
                          type="number"
                          disabled
                          value={tier.wesabiPercentage}
                          className="w-24 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm font-black text-indigo-600 cursor-not-allowed"
                        />
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 rounded-xl font-bold"
                        onClick={() => {
                          setMonthlyTiers(monthlyTiers.filter(t => t.id !== tier.id));
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                <Button
                  className="rounded-xl font-bold shadow-lg shadow-primary-600/20"
                  onClick={async () => {
                    // Validation
                    setTierError('');
                    for (const t of monthlyTiers) {
                      if (t.hubPercentage + t.wesabiPercentage !== 100 || t.hubPercentage < 0 || t.hubPercentage > 100) {
                        setTierError(`Invalid tier percentages for range ${t.minParcels}-${t.maxParcels || '∞'}. Must total 100%.`);
                        return;
                      }
                    }
                    try {
                      await configurationEngine.updateSystemSettings('global', {
                        hubMonthlyTiers: monthlyTiers
                      } as any);

                      await auditEngine.logEvent({
                        userId: user?.uid || 'system',
                        action: 'UPDATE_HUB_MONTHLY_TIERS',
                        details: { monthlyTiers },
                        result: 'SUCCESS'
                      });
                      toast.success('Hub Monthly Volume Tiers persisted successfully.');
                    } catch (err: any) {
                      setTierError('Failed to persist tier configuration: ' + err.message);
                      toast.error('Failed to save tier configuration.');
                    }
                  }}
                >
                  <Save size={18} className="mr-2" /> Save Tier Configuration
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'REPORTS' && (
          <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Platform Revenue', value: '₦4,289,500', sub: '+12% from last month', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Centre Payouts', value: '₦2,573,700', sub: '60% of total revenue', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Platform Net', value: '₦1,715,800', sub: '40% of total revenue', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Future Logistics Fund', value: '₦0', sub: 'Projected next phase', icon: Layers, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map(stat => (
                  <Card key={stat.label} className="p-6 border-none shadow-xl shadow-slate-200/50">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", stat.bg)}>
                      <stat.icon size={20} className={stat.color} />
                    </div>
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-1">{stat.label}</p>
                    <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
                    <p className="text-[10px] font-bold text-slate-900 mt-2">{stat.sub}</p>
                  </Card>
                ))}
             </div>

             <Card className="p-8 border-none shadow-xl shadow-slate-200/50">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black tracking-tight text-slate-900">Revenue Distribution by Hub</h2>
                  <Button variant="outline" size="sm" className="rounded-xl font-bold">
                    <Calendar size={14} className="mr-2" /> This Month
                  </Button>
                </div>
                <div className="space-y-6">
                   {[
                      { name: 'Lagos Main Hub', total: 1200000, comm: 720000, plat: 480000 },
                      { name: 'Abuja Central Point', total: 850000, comm: 510000, plat: 340000 },
                      { name: 'Port Harcourt Hub', total: 640000, comm: 384000, plat: 256000 },
                   ].map(hub => (
                      <div key={hub.name} className="space-y-2">
                         <div className="flex justify-between items-end">
                            <div>
                               <p className="text-sm font-black text-slate-900">{hub.name}</p>
                               <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mt-0.5">Total Generated: ₦{hub.total.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-xs font-black text-emerald-600">₦{hub.comm.toLocaleString()} (60%)</p>
                               <p className="text-[9px] font-bold text-slate-800 uppercase tracking-widest">Platform: ₦{hub.plat.toLocaleString()}</p>
                            </div>
                         </div>
                         <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                            <div className="h-full bg-emerald-500" style={{ width: '60%' }} />
                            <div className="h-full bg-indigo-500" style={{ width: '40%' }} />
                         </div>
                      </div>
                   ))}
                </div>
             </Card>
          </div>
        )}

        {activeTab === 'AUDIT' && (
           <Card className="p-8 border-none shadow-xl shadow-slate-200/50">
              <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black tracking-tight text-slate-900">Audit Trail</h2>
                  <div className="flex gap-2 text-xs font-bold text-slate-800">
                    Total Logs: 124
                  </div>
              </div>
              <div className="space-y-6">
                 {[
                    { action: 'UPDATE_RULE', user: 'Admin (wesabibookcare@gmail.com)', time: '2 hours ago', details: 'Updated Lagos Express rate to 45%', icon: ShieldCheck, color: 'text-blue-600' },
                    { action: 'CALC_COMMISSION', user: 'System Engine', time: '5 mins ago', details: 'Shipment #WSH-90123: ₦1,200 Dist: Platform 480 | Centre 720', icon: CheckCircle2, color: 'text-emerald-600' },
                    { action: 'NEW_VERSION', user: 'Admin', time: '1 day ago', details: 'Version 4 Published for Global Nigeria', icon: Layers, color: 'text-indigo-600' },
                 ].map((log, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
                       <div className={cn("p-2 rounded-xl h-fit", log.color.replace('text', 'bg').replace('600', '100'))}>
                          <log.icon size={18} className={log.color} />
                       </div>
                       <div className="flex-1">
                          <div className="flex justify-between items-start">
                             <h4 className="text-sm font-black text-slate-900">{log.action}</h4>
                             <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{log.time}</span>
                          </div>
                          <p className="text-xs font-bold text-slate-900 mt-1">{log.details}</p>
                          <p className="text-[9px] font-black text-slate-800 uppercase tracking-[0.2em] mt-2">EXECUTED BY: {log.user}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </Card>
        )}

        {/* Create Rule Modal */}
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
               />
               <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden"
               >
                 <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-xl font-black tracking-tight text-slate-900">New Distribution Rule</h3>
                    <button onClick={() => setShowAddModal(false)} className="text-slate-800 hover:text-slate-900">
                      <ChevronRight className="rotate-90" />
                    </button>
                 </div>
                 <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Platform (%)</label>
                          <input
                            type="number"
                            value={newRule.platformPercentage}
                            onChange={(e) => setNewRule({...newRule, platformPercentage: Number(e.target.value)})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-primary-600 focus:outline-none"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Centre (%)</label>
                          <input
                            type="number"
                            value={newRule.centrePercentage}
                            onChange={(e) => setNewRule({...newRule, centrePercentage: Number(e.target.value)})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-primary-600 focus:outline-none"
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Target Country</label>
                       <select
                        value={newRule.country}
                        onChange={(e) => setNewRule({...newRule, country: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-primary-600 focus:outline-none"
                       >
                         <option>Nigeria</option>
                         <option>Ghana</option>
                         <option>Kenya</option>
                       </select>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                       <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                       <div>
                          <p className="text-xs font-black text-amber-900 uppercase tracking-widest mb-1">Impact Warning</p>
                          <p className="text-[10px] font-medium text-amber-700 leading-relaxed">
                            Publishing this rule will immediately affect all new shipments calculated after publication. Version control will automatically archive current active rules for this country.
                          </p>
                       </div>
                    </div>
                 </div>
                 <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-xl font-bold" onClick={() => setShowAddModal(false)}>Cancel</Button>
                    <Button className="flex-1 rounded-xl font-bold shadow-lg shadow-primary-600/20" onClick={handleSaveRule}>Publish Rule v{rules.length + 1}</Button>
                 </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};
