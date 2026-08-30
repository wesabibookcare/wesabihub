import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Download,
  Calendar,
  Filter,
  ChevronRight,
  PieChart,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { PointLayout } from '@/src/layouts/PointLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { centreEngine, paymentEngine } from '@/src/engines';
import { CommissionRecord } from '@/src/services/db/CommissionRecordRepository';
import { toast } from 'sonner';

export const EarningsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hub, setHub] = useState<any>(null);
  const [records, setRecords] = useState<CommissionRecord[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [tierConfig, setTierConfig] = useState({ hubPercent: 60, platformPercent: 40 });

  useEffect(() => {
    if (user) {
      fetchHubData();
      fetchFinancialRules();
    }
  }, [user]);

  const fetchFinancialRules = async () => {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/src/lib/firebase');
      const snap = await getDoc(doc(db, 'systemSettings', 'financialRules'));
      if (snap.exists()) {
        const data = snap.data();
        if (data.tiers && Array.isArray(data.tiers) && data.tiers.length > 0) {
          // Use highest volume tier or average configured tier
          const topTier = data.tiers[data.tiers.length - 1];
          const hubP = topTier.hubPercentage || 60;
          setTierConfig({ hubPercent: hubP, platformPercent: 100 - hubP });
        }
      }
    } catch (e) {
      console.warn('Failed to load financial rules for earnings:', e);
    }
  };

  const fetchHubData = async () => {
    try {
      setLoading(true);
      // Find hubs owned by this user
      const hubs = await centreEngine.getHubsByOwner(user!.uid);
      if (hubs.length > 0) {
        const activeHub = hubs[0]; // Assume first hub for now
        setHub(activeHub);

        // Fetch commission records for this hub
        const fetchedRecords = await paymentEngine.getCommissionsByCentre(activeHub.id);
        setRecords(fetchedRecords);

        // Calculate total earned
        const total = fetchedRecords.reduce((sum, r) => sum + r.centreAmount, 0);
        setTotalEarned(total);
      }
    } catch (error) {
      console.error('Error fetching hub earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (records.length === 0) {
      toast.error('No commission records to export yet.');
      return;
    }
    const header = 'Shipment ID,Service Type,Date,Amount,Status\n';
    const rows = records.map(r =>
      `${r.shipmentId},${r.serviceType},${r.timestamp?.toDate?.()?.toLocaleDateString() || ''},${r.centreAmount},${r.status}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <PointLayout>
        <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
          <p className="text-slate-900 font-bold uppercase tracking-widest text-[10px]">Loading Earnings Data...</p>
        </div>
      </PointLayout>
    );
  }

  return (
    <PointLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold dark:text-white font-display">Hub Earnings: {hub?.name || 'All Hubs'}</h1>
            <p className="text-slate-900">Track your commissions, bonuses, and payouts.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="rounded-xl flex items-center gap-2" onClick={handleExportCSV}>
                <Download size={18} /> Export CSV
             </Button>
             <Button className="rounded-xl px-8 shadow-lg shadow-primary-500/20 flex items-center gap-2" onClick={() => navigate('/point/payouts')}>
                <Wallet size={18} /> Request Payout
             </Button>
          </div>
        </div>

        {/* Finance Header Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <Card className="p-8 border-slate-200 dark:border-slate-800 bg-primary-600 text-white relative overflow-hidden group">
              <div className="relative z-10 space-y-6">
                 <div>
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Available Balance</p>
                    <h3 className="text-4xl font-black font-display mt-1">₦{totalEarned.toLocaleString()}</h3>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="px-3 py-1.5 rounded-lg bg-white/10 flex items-center gap-2 text-xs font-bold">
                       <TrendingUp size={14} className="text-emerald-400" /> Real-time Earnings
                    </div>
                 </div>
              </div>
              <Wallet className="absolute -right-8 -bottom-8 text-white/10 w-48 h-48 pointer-events-none group-hover:scale-110 transition-transform" />
           </Card>

           <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">
              <div>
                 <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Commission Split</p>
                 <h3 className="text-3xl font-black dark:text-white font-display mt-1">{tierConfig.hubPercent}% Centre</h3>
              </div>
              <div className="space-y-3">
                 <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-900">Configured Tier Share</span>
                    <span className="text-xs font-bold dark:text-white">{tierConfig.hubPercent}%</span>
                 </div>
                 <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${tierConfig.hubPercent}%` }} className="h-full bg-primary-600 rounded-full" />
                 </div>
                 <p className="text-[10px] text-slate-800 leading-relaxed italic">
                   Centres receive {tierConfig.hubPercent}% of the hub parcel fee according to Admin pricing rules. Platform fee is {tierConfig.platformPercent}%.
                 </p>
              </div>
           </Card>

           <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">
              <div>
                 <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Next Payout Date</p>
                 <h3 className="text-3xl font-black dark:text-white font-display mt-1 flex items-center gap-3">
                    Every Friday
                 </h3>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 flex items-start gap-3">
                 <AlertCircle size={18} className="text-amber-600 shrink-0" />
                 <p className="text-[10px] text-amber-700 font-medium leading-relaxed uppercase tracking-wider">
                    Payouts are automated every Friday based on settled shipments.
                 </p>
              </div>
           </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           {/* Transaction History */}
           <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                 <h2 className="text-xl font-bold dark:text-white font-display">Commission Records</h2>
                 <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl gap-2 text-xs">
                       <Calendar size={14} /> All Time
                    </Button>
                    <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl gap-2 text-xs">
                       <Filter size={14} /> Filter
                    </Button>
                 </div>
              </div>

              <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
                 <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {records.length === 0 ? (
                      <div className="p-12 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-300">
                          <CheckCircle2 size={32} />
                        </div>
                        <p className="text-slate-900 font-bold">No commission records found yet.</p>
                      </div>
                    ) : (
                      records.map((record, i) => (
                        <div key={i} className="p-6 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                           <div className="flex items-center gap-5">
                              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
                                 <ArrowUpRight size={20} />
                              </div>
                              <div>
                                 <h4 className="font-bold text-sm dark:text-white">Shipment #{record.shipmentId}</h4>
                                 <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">{record.serviceType}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">
                                      {record.timestamp?.toDate?.()?.toLocaleDateString() || 'Recent'}
                                    </span>
                                 </div>
                              </div>
                           </div>
                           <div className="text-right space-y-2">
                              <p className="font-black font-display text-emerald-600">
                                 ₦{record.centreAmount.toLocaleString()}
                              </p>
                              <Badge variant={record.status === 'SETTLED' || record.status === 'COMPLETED' ? 'success' : 'warning'} className="h-5">
                                 {record.status}
                              </Badge>
                           </div>
                        </div>
                      ))
                    )}
                 </div>
                 {records.length > 0 && (
                   <Button variant="text" onClick={() => navigate('/point/payouts')} className="w-full py-4 text-xs font-bold text-primary-600 border-t border-slate-100 dark:border-slate-800 rounded-none hover:bg-slate-50">
                      View Full Statement
                   </Button>
                 )}
              </Card>
           </div>

           {/* Insights */}
           <div className="space-y-8">
              <Card className="p-6 border-slate-200 dark:border-slate-800">
                 <h3 className="font-bold dark:text-white mb-6 font-display flex items-center gap-2">
                    <PieChart size={18} className="text-primary-600" />
                    Revenue Breakdown
                 </h3>
                 <div className="space-y-6">
                    <div className="relative h-48 w-48 mx-auto flex items-center justify-center">
                       <div className="absolute inset-0 rounded-full border-[12px] border-primary-600 border-t-emerald-500 border-l-emerald-500 transform rotate-45 opacity-20" />
                       <div className="text-center">
                          <p className="text-[10px] font-bold text-slate-800 uppercase">Your Share</p>
                          <p className="text-xl font-black dark:text-white">{tierConfig.hubPercent}%</p>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-primary-600" />
                             <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Platform</span>
                          </div>
                          <p className="text-sm font-bold dark:text-white">{tierConfig.platformPercent}%</p>
                       </div>
                       <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500" />
                             <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Centre</span>
                          </div>
                          <p className="text-sm font-bold dark:text-white">{tierConfig.hubPercent}%</p>
                       </div>
                    </div>
                 </div>
              </Card>

              <Card className="p-6 border-slate-200 dark:border-slate-800 bg-slate-900 text-white overflow-hidden relative group cursor-pointer" onClick={() => navigate('/point/reports')}>
                 <div className="relative z-10 space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                       <BarChart3 size={20} className="text-emerald-400" />
                    </div>
                    <h4 className="font-bold font-display">Compliance Report</h4>
                    <p className="text-white/60 text-xs">Verify your weekly settlement and audit reports.</p>
                    <div className="flex items-center gap-2 text-primary-400 font-bold text-xs pt-2">
                       Download Report <ChevronRight size={14} />
                    </div>
                 </div>
                 <BarChart3 className="absolute -right-4 -bottom-4 text-white/5 w-32 h-32" />
              </Card>
           </div>
        </div>
      </div>
    </PointLayout>
  );
};
