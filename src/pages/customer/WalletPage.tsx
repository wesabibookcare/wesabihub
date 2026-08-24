import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet as WalletIcon,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  History,
  ShieldCheck,
  Zap,
  MoreHorizontal,
  ChevronRight,
  TrendingUp,
  Lock,
  Loader2,
  X,
  CheckCircle2
} from 'lucide-react';
import { CustomerLayout } from '@/src/layouts/CustomerLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Input } from '@/src/components/ui/Input';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { paymentEngine } from '@/src/engines';
import { apiFetch } from '@/src/lib/apiClient';
import { Wallet, Transaction } from '@/src/types';

export const WalletPage = () => {
  const { user, fbUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, [user]);

  // If we've just been returned from the wallet-funding checkout, confirm it.
  useEffect(() => {
    const returnedTxRef = searchParams.get('tx_ref');
    const returnedStatus = searchParams.get('status');
    if (!returnedTxRef || !fbUser) return;

    const confirmFunding = async () => {
      if (returnedStatus !== 'successful') {
        toast.error("It looks like the payment was cancelled or didn't complete.");
        setSearchParams({}, { replace: true });
        return;
      }
      setIsProcessing(true);
      try {
        await apiFetch(fbUser, '/api/wallet/fund/verify', {
          method: 'POST',
          body: { reference: returnedTxRef }
        });
        toast.success('Wallet funded successfully!');
        await fetchWalletData();
      } catch (err: any) {
        toast.error(err.message || 'We could not confirm this payment. Please contact support if money left your account.');
      } finally {
        setIsProcessing(false);
        setSearchParams({}, { replace: true });
      }
    };
    confirmFunding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fbUser]);

  const fetchWalletData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      let userWallet = await paymentEngine.getWallet(user.uid);

      // Auto-create wallet if it doesn't exist
      if (!userWallet) {
        userWallet = {
          id: user.uid,
          userId: user.uid,
          balance: 0,
          currency: 'NGN',
          SafePayBalance: 0,
          isActive: true,
          lastUpdated: new Date().toISOString()
        } as unknown as Wallet;
        await paymentEngine.createWallet(user.uid, userWallet);
      }
      setWallet(userWallet);

      const txs = await paymentEngine.getTransactions(user.uid);
      setTransactions(txs);
    } catch (err) {
      console.error('Failed to load wallet data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    if (!user || !fbUser || !wallet || !topUpAmount || isNaN(Number(topUpAmount))) return;
    const amount = Number(topUpAmount);
    if (amount <= 0) return;

    setIsProcessing(true);

    try {
      const data = await apiFetch<{ checkoutUrl: string; isSandbox: boolean; txRef: string }>(fbUser, '/api/wallet/fund/initialize', {
        method: 'POST',
        body: {
          amount,
          email: user.email || 'user@omorfihub.com',
          paymentMethod: 'BANK_TRANSFER',
          redirectUrl: `${window.location.origin}/customer/wallet`
        }
      });

      if (!data.checkoutUrl) {
        throw new Error('Could not start wallet funding. Please try again.');
      }

      if (data.isSandbox) {
        toast.info('Opening the sandbox payment simulator (no real API keys configured yet)...');
      }

      // Full-page redirect to the hosted checkout (real Flutterwave, or the
      // sandbox simulator). The wallet balance only updates once the payment
      // is actually verified server-side -- never optimistically here.
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      console.error('Top up failed:', err);
      toast.error(err.message || 'Top up failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <CustomerLayout>
      <div className="space-y-10 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold dark:text-white font-display">My Wallet</h1>
            <p className="text-slate-600 dark:text-slate-300">Manage your funds and view payment history.</p>
          </div>
          <Button
            className="rounded-xl h-12 px-6 shadow-md transition-transform active:scale-95"
            onClick={() => setIsTopUpModalOpen(true)}
          >
            <Plus size={18} className="mr-2" /> Top Up Wallet
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
           {/* Left Column */}
           <div className="lg:col-span-2 space-y-10">
              {/* Balance Cards */}
              <div className="grid sm:grid-cols-2 gap-6">
                 <Card className="p-8 bg-slate-900 border-none text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-full bg-primary-600/20 blur-3xl group-hover:bg-primary-600/30 transition-all" />
                    <div className="space-y-6 relative z-10">
                       <div className="flex justify-between items-center">
                          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-primary-400">
                             <WalletIcon size={24} />
                          </div>
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Available</Badge>
                       </div>
                       <div className="space-y-1">
                          <p className="text-sm text-slate-300 font-medium">Available Balance</p>
                          <h2 className="text-4xl font-black font-display">
                            {loading ? <Loader2 className="animate-spin text-primary-400" /> : `₦${(wallet?.balance || 0).toLocaleString()}`}
                          </h2>
                       </div>
                    </div>
                 </Card>

                 <Card className="p-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 relative overflow-hidden group">
                    <div className="space-y-6 relative z-10">
                       <div className="flex justify-between items-center">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-amber-500">
                             <Lock size={24} />
                          </div>
                          <Badge variant="info">Escrow Protection</Badge>
                       </div>
                       <div className="space-y-1">
                          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">SafePay Protected Transactions</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                             Protected buyer–seller transaction funds are held externally by Flutterwave Escrow until delivery inspection completion.
                          </p>
                       </div>
                    </div>
                 </Card>
              </div>

              {/* Transactions */}
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold dark:text-white font-display">Recent Transactions</h2>
                    {transactions.length > 0 && (
                      <Button variant="text" size="sm" className="text-primary-600 hover:bg-primary-50">See All <History size={16} className="ml-1" /></Button>
                    )}
                 </div>
                 <Card className="divide-y divide-slate-100 dark:divide-slate-800 border-slate-200 dark:border-slate-800 min-h-[200px]">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center h-48 text-slate-500 dark:text-slate-400">
                        <Loader2 className="animate-spin mb-2" size={24} />
                        <p>Loading transactions...</p>
                      </div>
                    ) : transactions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 text-slate-500 dark:text-slate-400">
                        <History size={32} className="mb-2 text-slate-300 dark:text-slate-600" />
                        <p>No recent transactions</p>
                      </div>
                    ) : (
                      transactions.map((tx) => (
                        <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                           <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                                tx.type === 'CREDIT' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                              )}>
                                 {tx.type === 'CREDIT' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                              </div>
                              <div>
                                 <p className="font-bold dark:text-white">
                                   {tx.category === 'SHIPMENT_PAYMENT' ? 'Shipment Payment' :
                                    tx.category === 'PAYOUT' ? 'Wallet Top-up' :
                                    tx.category === 'PROTECTION_RELEASE' ? 'SafePay Release' : tx.category}
                                 </p>
                                 <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(tx.timestamp).toLocaleDateString()}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className={cn("font-bold text-lg", tx.type === 'CREDIT' ? "text-emerald-600" : "dark:text-white")}>
                                 {tx.type === 'CREDIT' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                              </p>
                              <Badge
                                variant={tx.status === 'COMPLETED' ? 'success' : tx.status === 'PENDING' ? 'warning' : 'error'}
                                className="text-[10px] py-0"
                              >
                                {tx.status}
                              </Badge>
                           </div>
                        </div>
                      ))
                    )}
                 </Card>
              </div>
           </div>

           {/* Sidebar Column */}
           <div className="space-y-10">
              {/* Payment Methods Shortcut */}

              {/* Future Functionality Banner */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-8 rounded-3xl bg-primary-600 text-white relative overflow-hidden cursor-pointer"
              >
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                 <div className="space-y-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                       <TrendingUp size={24} />
                    </div>
                    <div className="space-y-1">
                       <h3 className="text-xl font-bold font-display">Coming Soon: Wallet Rewards</h3>
                       <p className="text-xs text-primary-100 leading-relaxed">
                          Earn cashback on every shipment and unlock premium discounts with our upcoming loyalty program.
                       </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-primary-100">
                       Learn More <ChevronRight size={14} />
                    </div>
                 </div>
              </motion.div>

              {/* Security Banner */}
              <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex gap-4">
                 <ShieldCheck className="text-emerald-500 shrink-0" />
                 <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Your wallet is secured with bank-grade encryption. Funds in SafePay are only released once shipment delivery is confirmed.
                 </p>
              </div>
           </div>
        </div>

        {/* Top-up Modal */}
        <AnimatePresence>
          {isTopUpModalOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
                onClick={() => !isProcessing && setIsTopUpModalOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 z-50 shadow-2xl border border-slate-200 dark:border-slate-800"
              >
                {!showSuccess ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-bold dark:text-white font-display">Top Up Wallet</h3>
                      <button
                        onClick={() => setIsTopUpModalOpen(false)}
                        disabled={isProcessing}
                        className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors disabled:opacity-50"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Amount (₦)</label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={topUpAmount}
                          onChange={(e) => setTopUpAmount(e.target.value)}
                          className="h-14 text-lg font-bold"
                          disabled={isProcessing}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {[1000, 5000, 10000].map(amt => (
                          <button
                            key={amt}
                            onClick={() => setTopUpAmount(amt.toString())}
                            disabled={isProcessing}
                            className="h-10 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-colors disabled:opacity-50"
                          >
                            +₦{amt.toLocaleString()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button
                        className="w-full h-14 rounded-xl text-lg shadow-md transition-all active:scale-95"
                        onClick={handleTopUp}
                        disabled={!topUpAmount || Number(topUpAmount) <= 0 || isProcessing}
                      >
                        {isProcessing ? (
                          <><Loader2 className="animate-spin mr-2" size={20} /> Processing...</>
                        ) : (
                          'Pay via Bank Transfer'
                        )}
                      </Button>
                      <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4 flex items-center justify-center gap-1">
                        <Lock size={12} /> Bank Transfer via Paystack • Card Payments Temporarily Disabled
                      </p>
                    </div>
                  </div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="flex flex-col items-center justify-center py-8 text-center space-y-4"
                  >
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-2">
                      <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Top Up Successful!</h3>
                    <p className="text-slate-600 dark:text-slate-300">Your wallet has been credited with ₦{Number(topUpAmount).toLocaleString()}</p>
                  </motion.div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </CustomerLayout>
  );
};
