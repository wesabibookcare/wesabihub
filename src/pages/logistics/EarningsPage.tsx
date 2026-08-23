import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  Package,
  Calendar,
  ChevronRight,
  Info,
  ShieldCheck,
  CheckCircle2,
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

export const EarningsPage = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

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
      toast.error('Failed to load earnings records');
    } finally {
      setLoading(false);
    }
  };

  const creditTransactions = transactions.filter(t => t.type === 'CREDIT');

  return (
    <LogisticsLayout>
      <div className="space-y-8 ">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <p className="text-emerald-600 font-bold uppercase tracking-widest text-[10px] mb-2">Financial Records</p>
           <h1 className="text-4xl font-black tracking-tight dark:text-white">Transport Earnings</h1>
           <p className="text-slate-900 font-medium mt-1">Real-time earnings calculated by the WeSabiHub Rules Engine.</p>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 max-w-md">
           <Info className="text-amber-600 shrink-0" size={20} />
           <p className="text-[10px] font-bold text-amber-800 dark:text-amber-500 uppercase tracking-widest leading-relaxed">
             Note: All transport earnings are read-only and automatically determined by platform business rules.
           </p>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <Card className="lg:col-span-2 p-10 border-none shadow-2xl bg-slate-900 text-white rounded-[3rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row justify-between gap-10">
               <div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-3">Total Transport Earnings</p>
                  <h2 className="text-6xl font-black tracking-tighter mb-4">₦{wallet?.totalEarned.toLocaleString() || '0'}</h2>
                  <div className="flex items-center gap-3">
                     <Badge className="bg-emerald-500 text-white border-none rounded-full px-4 py-1.5 font-black text-xs">
                        Verified Revenue
                     </Badge>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-8 md:border-l md:border-slate-800 md:pl-10">
                  <div>
                     <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">Total Volume</p>
                     <p className="text-3xl font-black">{transactions.length}</p>
                  </div>
                  <div>
                     <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">Pending</p>
                     <p className="text-3xl font-black text-amber-500">₦{wallet?.pendingBalance.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                     <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">Settled</p>
                     <p className="text-3xl font-black text-primary-500">₦{wallet?.balance.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                     <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">Available Payout</p>
                     <p className="text-3xl font-black text-emerald-500">₦{(wallet?.balance || 0).toLocaleString()}</p>
                  </div>
               </div>
            </div>
         </Card>

         <Card className="p-8 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[3rem] flex flex-col justify-between">
            <div>
               <h3 className="text-xl font-black dark:text-white mb-2 flex items-center gap-3">
                  <TrendingUp className="text-primary-600" size={24} />
                  Performance
               </h3>
               <p className="text-sm font-medium text-slate-900 mb-8">Monthly earning projection based on current fleet activity.</p>

               <div className="space-y-6">
                  <div>
                     <div className="flex justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-800">Current Progress</span>
                        <span className="text-sm font-black dark:text-white">₦1.4M / ₦2M</span>
                     </div>
                     <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "70%" }}
                          className="h-full bg-primary-600 rounded-full"
                        />
                     </div>
                  </div>
               </div>
            </div>

            <Button className="mt-8 w-full h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 font-black gap-2 border border-slate-200 dark:border-slate-700">
               <Calendar size={18} />
               View History
            </Button>
         </Card>
      </div>

      {/* Recent Earnings Table */}
      <Card className="p-8 border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[3rem]">
         <div className="flex items-center justify-between mb-10">
            <h3 className="text-2xl font-black dark:text-white">Transaction History</h3>
            <div className="flex items-center gap-4">
               <Button variant="outline" className="rounded-xl h-11 border-slate-200">Date Range</Button>
               <Button variant="outline" className="rounded-xl h-11 border-slate-200">Filter</Button>
            </div>
         </div>

         <div className="space-y-4">
            {loading ? (
               <div className="py-20 text-center">
                  <Loader2 size={40} className="animate-spin mx-auto text-primary-600" />
               </div>
            ) : creditTransactions.length === 0 ? (
               <div className="py-20 text-center">
                  <p className="text-slate-900 font-bold">No earnings history found.</p>
                  <p className="text-[10px] text-slate-800 uppercase mt-1">Earnings from transport jobs will appear here.</p>
               </div>
            ) : creditTransactions.map((tx) => (
               <div key={tx.id} className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between group hover:border-primary-500/30 transition-all">
                  <div className="flex items-center gap-6">
                     <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-primary-600">
                        <Wallet size={24} />
                     </div>
                     <div>
                        <p className="text-sm font-black dark:text-white">{tx.category.replace(/_/g, ' ')} • {tx.referenceId?.slice(0, 8)}</p>
                        <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mt-1">{new Date(tx.timestamp).toLocaleString()} • {tx.id.slice(0, 8)}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-xl font-black text-emerald-600">₦{tx.amount.toLocaleString()}</p>
                     <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest flex items-center justify-end gap-1 mt-1">
                        <CheckCircle2 size={10} /> {tx.status}
                     </p>
                  </div>
               </div>
            ))}
         </div>
      </Card>
    </div>
    </LogisticsLayout>
  );
};
