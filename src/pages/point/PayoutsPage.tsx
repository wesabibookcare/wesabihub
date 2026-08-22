import React, { useState, useEffect } from 'react';
import {
  History,
  Wallet as WalletIcon,
  ArrowUpRight,
  Download,
  CheckCircle2,
  Clock,
  Building2,
  AlertCircle,
  Loader2,
  Plus,
  XCircle
} from 'lucide-react';
import { PointLayout } from '@/src/layouts/PointLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Input } from '@/src/components/ui/Input';
import { Modal } from '@/src/components/ui/Modal';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { paymentEngine } from '@/src/engines';
import { Wallet, Transaction } from '@/src/types';
import { apiFetch } from '@/src/lib/apiClient';
import { toast } from 'sonner';

export const PayoutsPage = () => {
  const { user, fbUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [payouts, setPayouts] = useState<Transaction[]>([]);

  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [w, txs] = await Promise.all([
        paymentEngine.getWallet(user!.uid),
        paymentEngine.getTransactionsByUserId(user!.uid, 50)
      ]);
      setWallet(w);
      setPayouts((txs || []).filter(t => t.category === 'PAYOUT'));
    } catch (err) {
      console.error('Failed to load payout data:', err);
      toast.error('Failed to load payout data.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBankModal = () => {
    setBankName(wallet?.bankInfo?.bankName || '');
    setAccountNumber(wallet?.bankInfo?.accountNumber || '');
    setAccountName(wallet?.bankInfo?.accountName || '');
    setIsBankModalOpen(true);
  };

  const handleSaveBankDetails = async () => {
    if (!user) return;
    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      toast.error('Please fill in all bank details.');
      return;
    }
    setIsSavingBank(true);
    try {
      await paymentEngine.updateWallet(user.uid, {
        bankInfo: { bankName: bankName.trim(), accountNumber: accountNumber.trim(), accountName: accountName.trim() }
      });
      toast.success('Settlement account updated');
      setIsBankModalOpen(false);
      await fetchData();
    } catch (err) {
      toast.error('Failed to update settlement account');
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleOpenWithdraw = () => {
    if (!wallet?.bankInfo) {
      toast.error('Please add a settlement bank account before requesting a payout.');
      handleOpenBankModal();
      return;
    }
    if (!wallet || wallet.balance <= 0) {
      toast.error('You have no available balance to pay out.');
      return;
    }
    setWithdrawAmount(wallet.balance.toString());
    setIsWithdrawModalOpen(true);
  };

  const handleConfirmWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!wallet) return;
    if (!amount || amount <= 0) {
      toast.error('Enter a valid payout amount.');
      return;
    }
    if (amount > wallet.balance) {
      toast.error('Payout amount cannot exceed your available balance.');
      return;
    }
    setIsWithdrawing(true);
    try {
      await apiFetch(fbUser, '/api/wallet/withdraw', {
        method: 'POST',
        body: { amount }
      });
      toast.success('Payout requested. It will be sent once approved.');
      setIsWithdrawModalOpen(false);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to request payout.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleExportCSV = () => {
    if (payouts.length === 0) {
      toast.error('No payout history to export yet.');
      return;
    }
    const header = 'Date,Amount,Status,Reference\n';
    const rows = payouts.map(p =>
      `${new Date(p.timestamp).toLocaleDateString()},${p.amount},${p.status},${p.referenceId}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payout-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <PointLayout>
        <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
          <p className="text-slate-900 font-bold uppercase tracking-widest text-[10px]">Loading Payout Data...</p>
        </div>
      </PointLayout>
    );
  }

  return (
    <PointLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold dark:text-white font-display">Payouts</h1>
            <p className="text-slate-900">Manage your settlement account and payout history.</p>
          </div>
          <Button onClick={handleOpenWithdraw} className="rounded-xl px-8 shadow-lg shadow-primary-500/20 flex items-center gap-2">
             <WalletIcon size={18} /> Request Payout
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Card className="lg:col-span-1 p-8 border-slate-200 dark:border-slate-800 space-y-8">
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold dark:text-white font-display">Settlement Method</h3>
                    {!wallet?.bankInfo && (
                      <Badge variant="warning" className="text-[10px]">Not Set Up</Badge>
                    )}
                 </div>
                 {wallet?.bankInfo ? (
                   <div className="p-5 rounded-2xl bg-primary-600 text-white space-y-4 shadow-xl shadow-primary-600/20">
                      <div className="flex items-center justify-between">
                         <Building2 size={24} />
                         <Badge variant="info" className="bg-white/20 text-white border-none">Primary</Badge>
                      </div>
                      <div>
                         <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Bank Name</p>
                         <p className="font-bold">{wallet.bankInfo.bankName}</p>
                      </div>
                      <div>
                         <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Account Number</p>
                         <p className="text-xl font-mono font-black tracking-widest">
                           {wallet.bankInfo.accountNumber.slice(0, -4).replace(/./g, '*')}{wallet.bankInfo.accountNumber.slice(-4)}
                         </p>
                      </div>
                   </div>
                 ) : (
                   <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                      <Building2 className="mx-auto text-slate-300 mb-2" size={28} />
                      <p className="text-xs text-slate-500">No settlement account added yet</p>
                   </div>
                 )}
              </div>
              <div className="space-y-3">
                 <Button variant="outline" onClick={handleOpenBankModal} className="w-full rounded-xl h-12 text-xs font-bold">
                   {wallet?.bankInfo ? 'Edit Details' : 'Add Bank Account'}
                 </Button>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1">
                 <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Available Balance</p>
                 <p className="text-2xl font-black dark:text-white font-display">₦{(wallet?.balance || 0).toLocaleString()}</p>
              </div>
           </Card>

           <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                 <h3 className="text-lg font-bold dark:text-white font-display flex items-center gap-2">
                    <History size={18} className="text-primary-600" />
                    Payout History
                 </h3>
                 <Button variant="text" onClick={handleExportCSV} className="text-primary-600 font-bold text-xs p-0 flex items-center gap-1">
                   <Download size={14} /> Export CSV
                 </Button>
              </div>
              <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
                 {payouts.length === 0 ? (
                   <div className="p-12 text-center space-y-3">
                      <WalletIcon className="mx-auto text-slate-300" size={40} />
                      <p className="text-slate-900 font-bold text-sm">No payouts yet</p>
                      <p className="text-xs text-slate-500">Your payout history will appear here once you request one.</p>
                   </div>
                 ) : (
                   <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {payouts.map((p) => (
                        <div key={p.id} className="p-6 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                           <div className="flex items-center gap-5">
                              <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                                p.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600" :
                                p.status === 'FAILED' ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                              )}>
                                 {p.status === 'COMPLETED' ? <CheckCircle2 size={20} /> : p.status === 'FAILED' ? <XCircle size={20} /> : <Clock size={20} />}
                              </div>
                              <div>
                                 <h4 className="font-bold text-sm dark:text-white">{p.referenceId || p.id}</h4>
                                 <p className="text-xs text-slate-900 mt-1">
                                   {wallet?.bankInfo ? `${wallet.bankInfo.bankName} • ****${wallet.bankInfo.accountNumber.slice(-4)}` : 'Bank transfer'} • {new Date(p.timestamp).toLocaleDateString()}
                                 </p>
                              </div>
                           </div>
                           <div className="text-right space-y-2">
                              <p className="font-black dark:text-white font-display">₦{p.amount.toLocaleString()}</p>
                              <Badge variant={p.status === 'COMPLETED' ? 'success' : p.status === 'FAILED' ? 'error' : 'warning'} className="h-5">{p.status}</Badge>
                           </div>
                        </div>
                      ))}
                   </div>
                 )}
              </Card>
           </div>
        </div>

        {/* Bank Details Modal */}
        <Modal isOpen={isBankModalOpen} onClose={() => setIsBankModalOpen(false)} title="Settlement Bank Account" description="This is where your payouts will be sent.">
           <div className="space-y-4 py-2">
              <Input label="Bank Name" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. Wema Bank" />
              <Input label="Account Number" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="0123456789" />
              <Input label="Account Name" value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="As it appears on your bank account" />
              <Button onClick={handleSaveBankDetails} disabled={isSavingBank} className="w-full rounded-xl h-12 mt-2">
                 {isSavingBank ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                 {isSavingBank ? 'Saving...' : 'Save Account'}
              </Button>
           </div>
        </Modal>

        {/* Withdraw Modal */}
        <Modal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} title="Request Payout" description={`Funds will be sent to ${wallet?.bankInfo ? `${wallet.bankInfo.bankName} • ****${wallet.bankInfo.accountNumber.slice(-4)}` : 'your settlement account'}.`}>
           <div className="space-y-4 py-2">
              <div className="space-y-1">
                 <label className="text-sm font-bold">Amount to Pay Out</label>
                 <Input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="0.00" max={wallet?.balance || 0} />
                 <p className="text-xs text-slate-500">Available balance: ₦{(wallet?.balance || 0).toLocaleString()}</p>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400">
                 <AlertCircle size={16} className="shrink-0 mt-0.5" />
                 <p className="text-xs">Payout requests are reviewed before funds are sent.</p>
              </div>
              <Button onClick={handleConfirmWithdraw} disabled={isWithdrawing} className="w-full rounded-xl h-12 mt-2">
                 {isWithdrawing ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                 {isWithdrawing ? 'Processing...' : 'Confirm Payout Request'}
              </Button>
           </div>
        </Modal>
      </div>
    </PointLayout>
  );
};
