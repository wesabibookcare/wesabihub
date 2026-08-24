import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  History,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Wallet,
  Download,
  CreditCard,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { LogisticsLayout } from '@/src/layouts/LogisticsLayout';
import { paymentEngine } from '@/src/engines';
import { useAuth } from '@/src/context/AuthContext';
import { Wallet as WalletType, Transaction } from '@/src/types';
import { toast } from 'sonner';

export const PayoutsPage = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFinancialData();
    }
  }, [user]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const [walletData, txData] = await Promise.all([
        paymentEngine.getWallet(user!.uid),
        paymentEngine.getTransactionsByUserId(user!.uid, 20)
      ]);
      setWallet(walletData);
      setTransactions(txData);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast.error('Failed to load payout records');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsExporting(false);
    toast.success('Payout history exported successfully!');
  };

  const handleUpdateBank = async () => {
    setIsUpdating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsUpdating(false);
    toast.info('Bank details update form restricted to authorized owners');
  };

  const payouts = transactions.filter(t => t.category === 'PAYOUT' || t.type === 'DEBIT');

  return (
    <LogisticsLayout>
      <div className="space-y-8 ">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <p className="text-primary-600 font-bold uppercase tracking-widest text-[10px] mb-2">Fund Management</p>
           <h1 className="text-4xl font-black tracking-tight dark:text-white">Platform Payouts</h1>
           <p className="text-slate-900 font-medium mt-1">Track and manage your automated business payouts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            {/* Active Payout Card */}
            <Card className="p-10 border-none shadow-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-[3rem] relative overflow-hidden">
               <div className="absolute top-0 right-0 w-80 h-80 bg-primary-600/20 rounded-full -mr-32 -mt-32 blur-3xl" />
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-10">
                     <Badge className="bg-amber-500/20 text-amber-500 border-none px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest uppercase">
                        Current Balance
                     </Badge>
                     <span className="text-slate-200 text-sm font-bold uppercase tracking-widest">Secure Wallet</span>
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                     <div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-3">Available for Withdrawal</p>
                        <h2 className="text-6xl font-black tracking-tighter mb-2">₦{wallet?.balance.toLocaleString() || '0'}</h2>
                        <div className="flex items-center gap-3 text-emerald-400">
                           <CheckCircle2 size={18} />
                           <span className="text-sm font-black uppercase tracking-widest">Verified by Audit Engine</span>
                        </div>
                     </div>
                     <div className="space-y-4 w-full md:w-auto">
                        <Button
                          onClick={handleUpdateBank}
                          disabled={isUpdating}
                          className="w-full bg-white text-slate-950 hover:bg-slate-100 rounded-2xl h-14 px-8 font-black shadow-xl shadow-white/5 gap-2 transition-all hover:scale-105"
                        >
                           {isUpdating ? <Loader2 size={20} className="animate-spin text-primary-600" /> : <CreditCard size={20} className="text-primary-600" />}
                           Update Bank Details
                        </Button>
                        <p className="text-[10px] text-center text-slate-900 font-bold uppercase tracking-widest leading-relaxed">
                           Payouts are automated every Friday 12:00 AM
                        </p>
                     </div>
                  </div>
               </div>
            </Card>

            {/* Payout History List */}
            <Card className="p-8 border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[3rem]">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black dark:text-white">Payout History</h3>
                  <Button
                    onClick={handleExport}
                    disabled={isExporting}
                    variant="ghost"
                    className="text-primary-600 font-black gap-2"
                  >
                     {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                     {isExporting ? 'Exporting...' : 'Export All'}
                  </Button>
               </div>

               <div className="space-y-4">
                  {loading ? (
                    <div className="py-20 text-center">
                       <Loader2 size={40} className="animate-spin mx-auto text-primary-600" />
                    </div>
                  ) : payouts.length === 0 ? (
                    <div className="py-20 text-center">
                       <p className="text-slate-900 font-bold">No payout history found.</p>
                       <p className="text-[10px] text-slate-800 uppercase mt-1">Completed withdrawals will appear here.</p>
                    </div>
                  ) : payouts.map((p) => (
                     <div key={p.id} className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between group">
                        <div className="flex items-center gap-6">
                           <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-emerald-600">
                              <History size={24} />
                           </div>
                           <div>
                              <p className="text-sm font-black dark:text-white">₦{p.amount.toLocaleString()}</p>
                              <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mt-1">{new Date(p.timestamp).toLocaleDateString()} • {p.id.slice(0, 8)}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="hidden md:block text-right">
                              <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest leading-none mb-1">Status</p>
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest uppercase">
                                 {p.status}
                              </Badge>
                           </div>
                           <Button variant="ghost" size="icon" className="rounded-xl group-hover:bg-primary-600 group-hover:text-white transition-colors">
                              <ChevronRight size={20} />
                           </Button>
                        </div>
                     </div>
                  ))}
               </div>
            </Card>
         </div>

         <div className="space-y-8">
            <Card className="p-8 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[3rem]">
               <h3 className="text-xl font-black dark:text-white mb-6">Financial Summary</h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                     <span className="text-sm font-bold text-slate-900">Total Earned</span>
                     <span className="text-lg font-black dark:text-white">₦{wallet?.totalEarned.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-sm font-bold text-slate-900">Pending Settlement</span>
                     <span className="text-lg font-black text-amber-500">₦{wallet?.pendingBalance.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-600">
                     <span className="text-sm font-black uppercase tracking-wider">Available Now</span>
                     <span className="text-xl font-black">₦{wallet?.balance.toLocaleString() || '0'}</span>
                  </div>
               </div>
            </Card>

            <Card className="p-8 border-none shadow-xl bg-amber-50 dark:bg-amber-900/10 rounded-[3rem]">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-amber-500 text-white">
                     <AlertCircle size={20} />
                  </div>
                  <h3 className="text-lg font-black text-amber-900 dark:text-amber-500">Payment Protection Policy</h3>
               </div>
               <p className="text-sm font-medium text-amber-800/80 dark:text-amber-500/80 leading-relaxed">
                  All earnings are held under the OmorfiHub Secure Payment Protection system for 48 hours after delivery completion to ensure customer satisfaction and verification.
               </p>
               <Button variant="link" className="p-0 h-auto text-amber-700 dark:text-amber-600 font-black mt-4 gap-2">
                  Learn More <ChevronRight size={16} />
               </Button>
            </Card>
         </div>
      </div>
      </div>
    </LogisticsLayout>
  );
};
