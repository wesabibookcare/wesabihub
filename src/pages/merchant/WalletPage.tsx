import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Download,
  History,
  CreditCard,
  Building,
  ShieldCheck,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { MerchantLayout } from '@/src/layouts/MerchantLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { cn, exportToCsv } from '@/src/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/src/context/AuthContext';
import { paymentEngine } from '@/src/engines';
import { apiFetch } from '@/src/lib/apiClient';
import { Wallet, Transaction } from '@/src/types';
import { Modal } from '@/src/components/ui/Modal';

export const WalletPage = () => {
  const { user, fbUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'credit' | 'debit'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [safePayFunds, setSafePayFunds] = useState(0);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [userWallet, userTransactions, safePayRecords] = await Promise.all([
        paymentEngine.getWallet(user.uid),
        paymentEngine.getTransactionsByUserId(user.uid, 50),
        paymentEngine.getProtectionRecordsByMerchant(user.uid)
      ]);

      setWallet(userWallet);
      setTransactions(userTransactions);

      const totalSafePay = safePayRecords.reduce((sum, rec) =>
        (rec.status !== 'PAYMENT_COMPLETED' && rec.status !== 'TRANSACTION_CLOSED' && rec.status !== 'REFUND_APPROVED' && rec.status !== 'CANCELLED') ? sum + rec.amount : sum, 0
      );
      setSafePayFunds(totalSafePay);

    } catch (err) {
      console.error('Failed to fetch wallet data:', err);
      toast.error('Failed to load wallet information');
    } finally {
      setLoading(false);
    }
  };

  const balances = [
    {
      label: 'Available Balance',
      value: `₦${(wallet?.balance || 0).toLocaleString()}`,
      icon: WalletIcon,
      color: 'text-primary-600',
      bg: 'bg-primary-50 dark:bg-primary-900/20'
    },
    {
      label: 'SafePay Balance',
      value: `₦${safePayFunds.toLocaleString()}`,
      icon: ShieldCheck,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20'
    },
    {
      label: 'Pending Payouts',
      value: `₦${(wallet?.pendingBalance || 0).toLocaleString()}`,
      icon: CreditCard,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20'
    },
  ];

  const handleExport = async () => {
    if (transactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }
    setIsExporting(true);
    try {
      const csvData = transactions.map(tx => ({
        ID: tx.id,
        Description: tx.description,
        Type: tx.type,
        Category: tx.category,
        Amount: tx.amount,
        Status: tx.status,
        Date: new Date(tx.timestamp).toLocaleString()
      }));

      exportToCsv(`Transactions_${new Date().toISOString()}.csv`, csvData);

      toast.success('Statement exported successfully');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export statement');
    } finally {
      setIsExporting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!wallet || wallet.balance <= 0) {
      toast.error('Insufficient balance for withdrawal');
      return;
    }
    if (!wallet.bankInfo) {
      toast.error('Please add a payout bank account before withdrawing.');
      handleOpenBankModal();
      return;
    }
    setWithdrawAmount(wallet.balance.toString());
    setIsWithdrawModalOpen(true);
  };

  const handleConfirmWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!wallet) return;
    if (!amount || amount <= 0) {
      toast.error('Enter a valid withdrawal amount.');
      return;
    }
    if (amount > wallet.balance) {
      toast.error('Withdrawal amount cannot exceed your available balance.');
      return;
    }

    setIsWithdrawing(true);
    try {
      await apiFetch(fbUser, '/api/wallet/withdraw', {
        method: 'POST',
        body: { amount }
      });
      setIsWithdrawModalOpen(false);
      setWithdrawSuccess(true);
      toast.success('Withdrawal initiated successfully');
      await fetchWalletData(); // Refresh data
      setTimeout(() => setWithdrawSuccess(false), 3000);
    } catch (err: any) {
      console.error('Withdrawal failed:', err);
      toast.error(err.message || 'Failed to initiate withdrawal');
    } finally {
      setIsWithdrawing(false);
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
      toast.success('Payout account updated');
      setIsBankModalOpen(false);
      await fetchWalletData();
    } catch (err) {
      toast.error('Failed to update payout account');
    } finally {
      setIsSavingBank(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch =
      !searchQuery ||
      tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'credit') return matchesSearch && tx.type === 'CREDIT';
    if (activeTab === 'debit') return matchesSearch && tx.type !== 'CREDIT';
    return matchesSearch;
  });

  return (
    <MerchantLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold dark:text-white font-display">Wallet</h1>
            <p className="text-slate-800">Manage your earnings, payouts, and transaction history.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="rounded-xl flex items-center gap-2" onClick={handleExport} disabled={isExporting}>
                {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} Export Statement
             </Button>
             <Button className="rounded-xl px-8 shadow-lg shadow-primary-500/20 flex items-center gap-2" onClick={handleWithdraw} disabled={isWithdrawing}>
                {isWithdrawing ? <Loader2 size={18} className="animate-spin" /> : (withdrawSuccess ? <CheckCircle2 size={18} /> : <Plus size={18} />)}
                {isWithdrawing ? 'Processing...' : (withdrawSuccess ? 'Initiated' : 'Withdraw Funds')}
             </Button>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {balances.map((balance, i) => (
             <Card key={i} className="p-6 border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                   <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", balance.bg, balance.color)}>
                      <balance.icon size={20} />
                   </div>
                </div>
                <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">{balance.label}</p>
                <h3 className="text-2xl font-black dark:text-white font-display mt-1">{balance.value}</h3>
             </Card>
           ))}
        </div>

        {/* Payout Bank Account */}
        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-900">
                    <Building size={24} />
                 </div>
                 <div>
                    <h4 className="font-bold dark:text-white">Linked Payout Account</h4>
                    <p className="text-sm text-slate-800">
                      {wallet?.bankInfo
                        ? `${wallet.bankInfo.bankName} • **** ${wallet.bankInfo.accountNumber.slice(-4)} • ${wallet.bankInfo.accountName}`
                        : 'No payout account linked yet'}
                    </p>
                 </div>
              </div>
              <Button variant="outline" className="rounded-xl text-sm font-bold" onClick={handleOpenBankModal}>
                {wallet?.bankInfo ? 'Edit Bank Details' : 'Add Bank Details'}
              </Button>
           </div>
        </Card>

        {/* Transactions Section */}
        <div className="space-y-6">
           <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <h2 className="text-xl font-bold dark:text-white font-display">Transaction History</h2>
              <div className="flex items-center gap-3 flex-1 lg:max-w-md">
                 <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-900 w-4 h-4" />
                    <Input
                      placeholder="Search transactions..."
                      className="pl-10 h-11"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </div>
              </div>
           </div>

           <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit">
              {(['all', 'credit', 'debit'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-6 py-2 rounded-xl font-bold text-xs capitalize transition-all",
                    activeTab === tab ? "bg-white dark:bg-slate-800 text-primary-600 shadow-sm" : "text-slate-600 dark:text-slate-400"
                  )}
                >
                   {tab === 'all' ? 'All' : tab === 'credit' ? 'Money In' : 'Money Out'}
                </button>
              ))}
           </div>

           <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-900 uppercase tracking-widest">Transaction</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-900 uppercase tracking-widest">Type</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-900 uppercase tracking-widest">Date</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-900 uppercase tracking-widest">Amount</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-900 uppercase tracking-widest">Status</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                       {loading ? (
                         <tr>
                            <td colSpan={5} className="px-6 py-12 text-center">
                               <Loader2 className="animate-spin mx-auto mb-2 text-primary-600" size={24} />
                               <p className="text-sm text-slate-800">Loading transactions...</p>
                            </td>
                         </tr>
                       ) : filteredTransactions.length === 0 ? (
                         <tr>
                            <td colSpan={5} className="px-6 py-12 text-center">
                               <AlertCircle className="mx-auto mb-2 text-slate-900" size={24} />
                               <p className="text-sm text-slate-800">No transactions found</p>
                            </td>
                         </tr>
                       ) : (
                         filteredTransactions.map((tx) => (
                          <tr key={tx.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                             <td className="px-6 py-4">
                                <p className="font-bold text-sm dark:text-white">{tx.description}</p>
                                <p className="text-[10px] text-slate-800 font-mono">{tx.id}</p>
                             </td>
                             <td className="px-6 py-4 text-sm dark:text-white">{tx.category.replace(/_/g, ' ')}</td>
                             <td className="px-6 py-4 text-sm text-slate-800">
                                {new Date(tx.timestamp).toLocaleDateString()}
                             </td>
                             <td className={cn(
                               "px-6 py-4 font-black text-sm",
                               tx.type === 'CREDIT' ? "text-emerald-500" : "text-slate-900 dark:text-white"
                             )}>
                                {tx.type === 'CREDIT' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                             </td>
                             <td className="px-6 py-4">
                                <Badge variant={tx.status === 'COMPLETED' ? 'success' : 'warning'} className="rounded-lg">{tx.status}</Badge>
                             </td>
                          </tr>
                        ))
                       )}
                    </tbody>
                 </table>
              </div>
           </Card>
        </div>

        {/* Bank Details Modal */}
        <Modal
          isOpen={isBankModalOpen}
          onClose={() => setIsBankModalOpen(false)}
          title={wallet?.bankInfo ? 'Edit Bank Details' : 'Add Bank Details'}
          description="This account will receive your withdrawn funds."
        >
          <div className="space-y-4 py-2">
             <div className="space-y-1">
                <label className="text-sm font-bold">Bank Name</label>
                <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. Access Bank" />
             </div>
             <div className="space-y-1">
                <label className="text-sm font-bold">Account Number</label>
                <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="10-digit account number" />
             </div>
             <div className="space-y-1">
                <label className="text-sm font-bold">Account Name</label>
                <Input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Name on the account" />
             </div>
             <Button onClick={handleSaveBankDetails} disabled={isSavingBank} className="w-full rounded-xl h-12 mt-2">
                {isSavingBank ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                {isSavingBank ? 'Saving...' : 'Save Bank Details'}
             </Button>
          </div>
        </Modal>

        {/* Withdraw Funds Modal */}
        <Modal
          isOpen={isWithdrawModalOpen}
          onClose={() => setIsWithdrawModalOpen(false)}
          title="Withdraw Funds"
          description={`Funds will be sent to ${wallet?.bankInfo ? `${wallet.bankInfo.bankName} • **** ${wallet.bankInfo.accountNumber.slice(-4)}` : 'your linked payout account'}.`}
        >
          <div className="space-y-4 py-2">
             <div className="space-y-1">
                <label className="text-sm font-bold">Amount to Withdraw</label>
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  max={wallet?.balance || 0}
                />
                <p className="text-xs text-slate-500">Available balance: ₦{(wallet?.balance || 0).toLocaleString()}</p>
             </div>
             <Button onClick={handleConfirmWithdraw} disabled={isWithdrawing} className="w-full rounded-xl h-12 mt-2">
                {isWithdrawing ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                {isWithdrawing ? 'Processing...' : 'Confirm Withdrawal'}
             </Button>
          </div>
        </Modal>
      </div>
    </MerchantLayout>
  );
};
