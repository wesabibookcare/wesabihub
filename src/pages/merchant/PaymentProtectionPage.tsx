import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  AlertCircle,
  Clock,
  ArrowRight,
  HelpCircle,
  TrendingUp,
  FileText,
  User,
  ShieldAlert,
  History,
  Loader2,
  Video
} from 'lucide-react';
import { MerchantLayout } from '@/src/layouts/MerchantLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { paymentEngine } from '@/src/engines';
import { useAuth } from '@/src/context/AuthContext';
import { useSettings } from '@/src/context/SettingsContext';
import { PaymentProtectionRecord } from '@/src/types';
import { toast } from 'sonner';

export const PaymentProtectionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();
  const isSafePayEnabled = settings?.featureFlags?.enableSafePay !== false;
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<PaymentProtectionRecord[]>([]);
  const [summary, setSummary] = useState({
    pending: 0,
    released: 0,
    disputed: 0
  });
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'READY'>('ALL');
  const howItWorksRef = React.useRef<HTMLDivElement>(null);

  const PENDING_PP_STATUSES = ['PENDING_PAYMENT', 'FUNDS_SECURED', 'SHIPMENT_IN_TRANSIT'];
  const READY_PP_STATUSES = ['DELIVERED_AWAITING_CONFIRMATION', 'INSPECTION_IN_PROGRESS'];

  const filteredRecords = records.filter(r => {
    if (statusFilter === 'PENDING') return PENDING_PP_STATUSES.includes(r.status);
    if (statusFilter === 'READY') return READY_PP_STATUSES.includes(r.status);
    return true;
  });

  useEffect(() => {
    if (user) {
      fetchProtectionData();
    }
  }, [user]);

  const fetchProtectionData = async () => {
    try {
      setLoading(true);
      const data = await paymentEngine.getProtectionRecordsByMerchant(user!.uid);
      setRecords(data);

      const pending = data.reduce((sum, r) =>
        (r.status === 'PENDING_PAYMENT' || r.status === 'FUNDS_SECURED' || r.status === 'SHIPMENT_IN_TRANSIT' || r.status === 'DELIVERED_AWAITING_CONFIRMATION' || r.status === 'INSPECTION_IN_PROGRESS') ? sum + r.amount : sum, 0
      );
      const released = data.reduce((sum, r) =>
        (r.status === 'PAYMENT_RELEASED' || r.status === 'PAYMENT_COMPLETED' || r.status === 'TRANSACTION_CLOSED') ? sum + r.amount : sum, 0
      );
      const disputed = data.filter(r => r.status === 'DISPUTE_OPENED' || r.status === 'UNDER_INVESTIGATION').length;

      setSummary({ pending, released, disputed });
    } catch (err) {
      console.error('Failed to fetch protection data:', err);
      toast.error('Failed to load payment protection records');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Pending Release', value: `₦${summary.pending.toLocaleString()}`, icon: Lock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Released (Total)', value: `₦${summary.released.toLocaleString()}`, icon: Unlock, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Active Disputes', value: String(summary.disputed), icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  ];

  return (
    <MerchantLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold dark:text-white font-display flex items-center gap-3">
              Payment Protection
              {!isSafePayEnabled && <Badge variant="warning" className="text-xs">Coming Soon</Badge>}
            </h1>
            <p className="text-slate-800">Track and manage secure, protected payments for your orders.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="rounded-xl flex items-center gap-2" onClick={() => howItWorksRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                <HelpCircle size={18} /> How it works
             </Button>
          </div>
        </div>

        {!isSafePayEnabled && (
          <Card className="p-6 border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 flex items-start gap-4">
             <AlertCircle className="text-amber-600 shrink-0" size={22} />
             <div>
                <p className="font-bold text-sm text-amber-800 dark:text-amber-400">SafePay isn't active yet</p>
                <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                  New SafePay-protected shipments can't be created right now. Any transactions already in progress below can still be tracked, released, or disputed as normal.
                </p>
             </div>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {stats.map((stat, i) => (
             <Card key={i} className="p-6 border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4">
                   <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
                      <stat.icon size={24} />
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">{stat.label}</p>
                      <h3 className="text-2xl font-black dark:text-white font-display">{stat.value}</h3>
                   </div>
                </div>
             </Card>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           {/* Transaction List */}
           <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                 <h2 className="text-xl font-bold dark:text-white font-display">Active Protected Payments</h2>
                 <div className="flex gap-2">
                    <Badge
                      variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
                      className="rounded-lg h-7 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() => setStatusFilter(prev => prev === 'PENDING' ? 'ALL' : 'PENDING')}
                    >
                      Pending
                    </Badge>
                    <Badge
                      variant={statusFilter === 'READY' ? 'default' : 'outline'}
                      className="rounded-lg h-7 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() => setStatusFilter(prev => prev === 'READY' ? 'ALL' : 'READY')}
                    >
                      Ready
                    </Badge>
                 </div>
              </div>

              <div className="space-y-4">
                 {loading ? (
                   <div className="py-20 text-center">
                      <Loader2 className="animate-spin mx-auto text-primary-600 mb-2" size={32} />
                      <p className="text-sm text-slate-800">Syncing protection records...</p>
                   </div>
                 ) : records.length === 0 ? (
                   <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem]">
                      <ShieldCheck className="mx-auto text-slate-300 mb-2" size={48} />
                      <p className="text-sm text-slate-800">No active protected payments found</p>
                   </div>
                 ) : filteredRecords.length === 0 ? (
                   <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem]">
                      <ShieldCheck className="mx-auto text-slate-300 mb-2" size={48} />
                      <p className="text-sm text-slate-800">No {statusFilter === 'PENDING' ? 'pending' : 'ready'} protected payments found</p>
                   </div>
                 ) : (
                   filteredRecords.map((tx, i) => (
                    <Card
                      key={tx.id}
                      className="p-6 border-slate-200 dark:border-slate-800 hover:border-primary-500 transition-all cursor-pointer group"
                      onClick={() => navigate(`/merchant/shipments/track?id=${tx.trackingNumber}`)}
                    >
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800 group-hover:text-primary-600 transition-colors">
                                <ShieldCheck size={24} />
                             </div>
                             <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                   <span className="font-bold text-sm dark:text-white">PRO-{tx.id.substr(-6)}</span>
                                   <Badge variant={(tx.status === 'PAYMENT_RELEASED' || tx.status === 'PAYMENT_COMPLETED') ? 'success' : 'warning'} className="text-[10px] h-5">{tx.status.replace(/_/g, ' ')}</Badge>
                                   {!tx.metadata?.sellerEvidenceVideo && !['PAYMENT_RELEASED', 'REFUND_APPROVED', 'TRANSACTION_CLOSED', 'CANCELLED'].includes(tx.status) ? (
                                     <Badge variant="warning" className="text-[10px] h-5 gap-1"><Video size={10} /> Evidence Needed</Badge>
                                   ) : tx.metadata?.sellerEvidenceVideo ? (
                                     <Badge variant="success" className="text-[10px] h-5 gap-1"><Video size={10} /> Evidence Recorded</Badge>
                                   ) : null}
                                </div>
                                <p className="text-xs text-slate-800">Shipment #{tx.shipmentId ? tx.shipmentId.substr(-6) : 'N/A'} • {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A'}</p>
                             </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-10">
                             <div className="text-right">
                                <p className="text-lg font-black text-primary-600 font-display">₦{tx.amount.toLocaleString()}</p>
                                <div className="flex items-center gap-1 justify-end text-[10px] text-slate-900 uppercase font-bold tracking-widest">
                                   <Clock size={10} /> {tx.inspectionPeriodHours ? `${tx.inspectionPeriodHours}h Inspection` : 'Upon Delivery'}
                                </div>
                             </div>
                             <Button
                               variant="outline"
                               className="rounded-xl h-10 w-10 p-0 text-slate-900 group-hover:text-primary-600"
                               onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/merchant/shipments/track?id=${tx.trackingNumber}`); }}
                             >
                                <ArrowRight size={18} />
                             </Button>
                          </div>
                       </div>
                    </Card>
                  ))
                 )}
              </div>

              <div className="pt-6">
                 <Button variant="text" className="text-primary-600 font-bold flex items-center gap-2" onClick={() => navigate('/merchant/wallet')}>
                    <History size={18} /> View Transaction History
                 </Button>
              </div>
           </div>

           {/* Sidebar Info */}
           <div className="space-y-8">
              <Card ref={howItWorksRef} className="p-6 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 scroll-mt-24">
                 <h4 className="font-bold dark:text-white mb-4 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-primary-600" />
                    How Payment Protection Works
                 </h4>
                 <div className="space-y-6">
                    <div className="flex gap-3">
                       <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                       <p className="text-xs text-slate-800 leading-relaxed">Customer pays via SafePay. Funds are securely held by Flutterwave.</p>
                    </div>
                    <div className="flex gap-3">
                       <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                       <p className="text-xs text-slate-800 leading-relaxed">You record a preparation video, then dispatch via hub drop-off or direct delivery.</p>
                    </div>
                    <div className="flex gap-3">
                       <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                       <p className="text-xs text-slate-800 leading-relaxed">Customer receives the parcel and records an unboxing/inspection video.</p>
                    </div>
                    <div className="flex gap-3">
                       <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">4</div>
                       <p className="text-xs text-slate-800 leading-relaxed">Once the customer accepts, funds are released to your WeSabiHub Wallet.</p>
                    </div>
                 </div>
              </Card>

              <div className="space-y-4">
                 <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Resources</h4>
                 <div className="space-y-3">
                    {[
                      { icon: ShieldCheck, label: 'Full SafePay Guide', to: '/safepay' },
                      { icon: FileText, label: 'Payment Protection Policy', to: '/terms' },
                      { icon: ShieldAlert, label: 'Dispute Resolution', to: '/merchant/support' },
                      { icon: HelpCircle, label: 'Payment Protection FAQs', to: '/faq' },
                    ].map((link, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => navigate(link.to)}
                        className="w-full flex items-center gap-3 text-sm font-medium text-slate-900 dark:text-slate-300 hover:text-primary-600 transition-colors group"
                      >
                         <link.icon size={16} className="text-slate-900 group-hover:text-primary-600 transition-colors" />
                         {link.label}
                      </button>
                    ))}
                 </div>
              </div>

              {/* Infrastructure Note */}
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                 <p className="text-[10px] text-slate-800 leading-relaxed">
                    Payment infrastructure provided by verified global partners. WeSabiHub ensures the integrity of the secure payment protection lifecycle for every transaction.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </MerchantLayout>
  );
};
