import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { MerchantLayout } from '@/src/layouts/MerchantLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { Parcel, Wallet, MerchantBusiness, Notification as AppNotification } from '@/src/types';
import {
  Plus,
  Files,
  Search,
  MapPin,
  ShieldCheck,
  Wallet as WalletIcon,
  Package,
  Truck,
  Clock,
  Bell,
  ArrowRight,
  TrendingUp,
  Lightbulb,
  HeadphonesIcon,
  Loader2,
  AlertCircle
} from 'lucide-react';
import {
  merchantEngine,
  paymentEngine,
  parcelEngine,
  notificationEngine
} from '@/src/engines';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export const MerchantDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [merchantBus, setMerchantBus] = useState<MerchantBusiness | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [safePayFunds, setSafePayFunds] = useState(0);
  const [shipments, setShipments] = useState<Parcel[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [stats, setStats] = useState({
    totalShipments: 0,
    newOrders: 0,
    droppedOff: 0,
    pendingRelease: 0
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      setLoading(true);

      const [business, userWallet, safePayRecords, userShipments, userNotifs] = await Promise.all([
        merchantEngine.getBusiness(user.uid),
        paymentEngine.getWallet(user.uid),
        paymentEngine.getProtectionRecordsByMerchant(user.uid),
        parcelEngine.getParcelsBySender(user.uid),
        notificationEngine.getUnreadNotifications(user.uid, 10)
      ]);

      setMerchantBus(business);
      setWallet(userWallet);

      const totalSafePay = safePayRecords.reduce((sum, rec) =>
        (rec.status !== 'PAYMENT_COMPLETED' && rec.status !== 'TRANSACTION_CLOSED' && rec.status !== 'REFUND_APPROVED' && rec.status !== 'CANCELLED') ? sum + rec.amount : sum, 0
      );
      setSafePayFunds(totalSafePay);

      setShipments(userShipments.slice(0, 4));
      setNotifications(userNotifs.slice(0, 3));

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayShipments = userShipments.filter(s => new Date(s.createdAt || '').getTime() >= today.getTime());

      setStats({
        totalShipments: userShipments.length,
        newOrders: todayShipments.filter(s => s.status === 'AWAITING_PAYMENT' || s.status === 'PAYMENT_CONFIRMED').length,
        droppedOff: todayShipments.filter(s => s.status !== 'DRAFT' && s.status !== 'AWAITING_PAYMENT' && s.status !== 'AWAITING_DROP_OFF').length,
        pendingRelease: totalSafePay
      });

    } catch (err) {
      console.error('Error fetching merchant dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { icon: Plus, label: 'Create Shipment', color: 'bg-primary-600', href: '/merchant/shipments/create' },
    { icon: Files, label: 'Bulk Upload', color: 'bg-indigo-600', href: '/merchant/shipments/bulk' },
    { icon: Search, label: 'Track Shipment', color: 'bg-slate-800', href: '/merchant/shipments/track' },
    { icon: MapPin, label: 'Find Point', color: 'bg-emerald-600', href: '/merchant/hubs/saved' },
    { icon: ShieldCheck, label: 'View SafePay', color: 'bg-amber-600', href: '/merchant/payment-protection' },
    { icon: WalletIcon, label: 'View Wallet', color: 'bg-blue-600', href: '/merchant/wallet' },
  ];

  return (
    <MerchantLayout>
      <div className="space-y-10">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black dark:text-white font-display uppercase italic tracking-tight">
              {loading ? <span className="animate-pulse">Loading dashboard...</span> : `Welcome back, ${merchantBus?.name || user?.displayName || 'Merchant'}`}
            </h1>
            <p className="text-slate-800 font-medium">
              {loading ? 'Fetching your store updates...' : merchantBus?.status === 'ACTIVE' ? 'Your business is growing!' : 'Complete your setup to start shipping.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right">
                <p className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">Store Status</p>
                <div className="flex items-center gap-2 justify-end">
                   <div className={cn(
                     "w-2 h-2 rounded-full animate-pulse",
                     merchantBus?.status === 'ACTIVE' ? "bg-emerald-500" : "bg-amber-500"
                   )} />
                   <span className="text-sm font-bold dark:text-white">
                     {loading ? 'Checking...' : merchantBus?.status === 'ACTIVE' ? 'Active & Accepting Orders' : merchantBus?.status || 'Inactive'}
                   </span>
                </div>
             </div>
          </div>
        </div>

        {/* Quick Action Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          {quickActions.map((action, i) => (
            <motion.div key={i} variants={item}>
              <Link to={action.href}>
                <Card className="p-4 h-full hover:border-primary-500 transition-all cursor-pointer group hover:shadow-xl hover:shadow-primary-500/10 text-center">
                   <div className={cn(
                     "w-12 h-12 rounded-2xl flex items-center justify-center text-white mx-auto mb-3 shadow-lg transition-transform group-hover:scale-110",
                     action.color
                   )}>
                      <action.icon size={24} />
                   </div>
                   <span className="text-sm font-bold dark:text-white group-hover:text-primary-600 transition-colors">{action.label}</span>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <Link to="/merchant/wallet" className="block">
              <Card className="p-6 border-slate-200 dark:border-slate-800 hover:border-primary-500 transition-all cursor-pointer group">
                 <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 group-hover:scale-110 transition-transform">
                       <WalletIcon size={20} />
                    </div>
                 </div>
                 <p className="text-sm font-black text-slate-700 uppercase tracking-[0.1em]">Available Balance</p>
                 <h3 className="text-3xl font-black dark:text-white font-display mt-1">
                   {loading ? <Loader2 className="animate-spin text-primary-600" /> : `₦${(wallet?.balance || 0).toLocaleString()}`}
                 </h3>
                 <div className="mt-4 flex items-center gap-2 text-xs text-slate-900 font-medium">
                    <Clock size={14} /> Last payout {wallet?.lastUpdated ? new Date(wallet.lastUpdated).toLocaleDateString() : 'N/A'}
                 </div>
              </Card>
           </Link>

           <Link to="/merchant/payment-protection" className="block">
              <Card className="p-6 border-slate-200 dark:border-slate-800 hover:border-amber-500 transition-all cursor-pointer group">
                 <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                       <ShieldCheck size={20} />
                    </div>
                    <Badge variant="info">{loading ? '...' : stats.newOrders} Active</Badge>
                 </div>
                 <p className="text-sm font-black text-slate-700 uppercase tracking-[0.1em]">SafePay Funds</p>
                 <h3 className="text-3xl font-black dark:text-white font-display mt-1">
                   {loading ? <Loader2 className="animate-spin text-amber-600" /> : `₦${safePayFunds.toLocaleString()}`}
                 </h3>
                 <div className="mt-4 flex items-center gap-2 text-xs text-slate-900 font-medium">
                    <TrendingUp size={14} /> Tracking secured transactions
                 </div>
              </Card>
           </Link>

           <Link to="/merchant/shipments/history" className="block">
              <Card className="p-6 border-slate-200 dark:border-slate-800 bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer group">
                 <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                       <Package size={20} />
                    </div>
                    <Badge variant="info" className="bg-white/10 text-white border-none">All Time</Badge>
                 </div>
                 <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Total Shipments</p>
                 <h3 className="text-3xl font-black font-display mt-1">
                   {loading ? <Loader2 className="animate-spin text-white" /> : stats.totalShipments}
                 </h3>
                 <div className="mt-4 flex items-center gap-2 text-xs text-slate-900">
                    <Truck size={14} /> Efficient delivery tracking
                 </div>
              </Card>
           </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Recent Shipments */}
           <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                 <h2 className="text-xl font-bold dark:text-white font-display">Recent Shipments</h2>
                 <Button variant="text" className="text-primary-600 font-bold hover:bg-primary-50" asChild>
                    <Link to="/merchant/shipments/history">View History <ArrowRight size={16} /></Link>
                 </Button>
              </div>
              <Card className="overflow-hidden border-slate-200 dark:border-slate-800 min-h-[200px]">
                 <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                      <div className="p-12 flex flex-col items-center justify-center text-slate-900">
                        <Loader2 className="animate-spin mb-4" size={32} />
                        <p>Loading shipments...</p>
                      </div>
                    ) : shipments.length === 0 ? (
                      <div className="p-8">
                        <EmptyState
                          icon={Package}
                          title="No shipments yet"
                          description="Start your first shipment to see it here."
                          action={
                            <Button className="mt-4 rounded-xl" asChild>
                              <Link to="/merchant/shipments/create">Create Shipment</Link>
                            </Button>
                          }
                        />
                      </div>
                    ) : (
                      shipments.map((shipment) => (
                        <div key={shipment.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800">
                                 <Package size={20} />
                              </div>
                              <div>
                                 <p className="font-bold text-sm dark:text-white">{shipment.trackingNumber}</p>
                                 <p className="text-xs text-slate-800">{shipment.recipientInfo.name} • {shipment.status.replace(/_/g, ' ')}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <Badge variant={
                                 shipment.status === 'DELIVERED' ? 'success' :
                                 shipment.status === 'IN_TRANSIT' ? 'info' :
                                 shipment.status === 'CANCELLED' ? 'error' : 'warning'
                              } className="mb-1">
                                 {shipment.status.replace(/_/g, ' ')}
                              </Badge>
                              <p className="text-[10px] text-slate-900">
                                {shipment.createdAt ? new Date(shipment.createdAt).toLocaleDateString() : 'Recent'}
                              </p>
                           </div>
                        </div>
                      ))
                    )}
                 </div>
              </Card>

              {/* Today's Activity */}
              <div className="pt-6">
                 <h2 className="text-xl font-bold dark:text-white font-display mb-4">Today's Activity</h2>
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'New Orders', value: stats.newOrders, color: 'text-primary-600' },
                      { label: 'Dropped Off', value: stats.droppedOff, color: 'text-emerald-600' },
                      { label: 'Pending Release', value: `₦${(stats.pendingRelease / 1000).toFixed(0)}k`, color: 'text-amber-600' },
                      { label: 'Total Shipments', value: stats.totalShipments, color: 'text-indigo-600' },
                    ].map((stat, i) => (
                      <Card key={i} className="p-4 text-center border-slate-200 dark:border-slate-800">
                         <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-1">{stat.label}</p>
                         <p className={cn("text-xl font-black font-display", stat.color)}>
                           {loading ? '...' : stat.value}
                         </p>
                      </Card>
                    ))}
                 </div>
              </div>
           </div>

           {/* Sidebar Section */}
           <div className="space-y-8">
              {/* Business Tips */}
              <Card className="p-6 bg-primary-600 text-white overflow-hidden relative">
                 <div className="relative z-10 space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                       <Lightbulb size={24} />
                    </div>
                    <div className="space-y-1">
                       <h4 className="font-bold text-lg">Merchant Tip</h4>
                       <p className="text-sm text-primary-100">Using OmorfiHub Points for bulk drops can save you up to 25% on shipping costs.</p>
                    </div>
                    <Button className="w-full bg-white text-primary-600 hover:bg-primary-50 rounded-xl font-bold transition-transform active:scale-95" asChild>
                       <Link to="/merchant/support">Learn More</Link>
                    </Button>
                 </div>
                 <div className="absolute -right-8 -bottom-8 text-white/10 rotate-12">
                    <TrendingUp size={160} />
                 </div>
              </Card>

              {/* Notifications */}
              <div className="space-y-4">
                 <h3 className="font-bold dark:text-white font-display flex items-center justify-between">
                    Recent Alerts
                    <Badge variant="error" className="h-5 w-5 p-0 flex items-center justify-center rounded-full">
                      {notifications.length}
                    </Badge>
                 </h3>
                 <div className="space-y-3">
                    {loading ? (
                      [1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                      ))
                    ) : notifications.length === 0 ? (
                      <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                        <EmptyState
                          icon={Bell}
                          title="No alerts"
                          description="Your alert queue is clear."
                        />
                      </div>
                    ) : (
                      notifications.map((alert) => (
                        <Link to={alert.link || '/merchant/notifications'} key={alert.id} className="block">
                          <div className="flex gap-3 items-start p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-primary-500 transition-colors">
                             <div className={cn(
                               "w-2 h-2 rounded-full mt-2 shrink-0",
                               alert.type === 'SUCCESS' ? "bg-emerald-500" :
                               alert.type === 'ERROR' ? "bg-red-500" : "bg-amber-500"
                             )} />
                             <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                   <p className="font-bold text-xs dark:text-white truncate">{alert.title}</p>
                                   <span className="text-[10px] text-slate-900 shrink-0">
                                     {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   </span>
                                </div>
                                <p className="text-[10px] text-slate-800 line-clamp-1">{alert.message}</p>
                             </div>
                          </div>
                        </Link>
                      ))
                    )}
                 </div>
              </div>

              {/* Support Card */}
              <Card className="p-6 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary-600">
                       <HeadphonesIcon size={20} />
                    </div>
                    <div>
                       <h4 className="font-bold dark:text-white text-sm">Need Help?</h4>
                       <p className="text-[10px] text-slate-800">Merchant support is online</p>
                    </div>
                 </div>
                 <Button variant="outline" className="w-full rounded-xl text-sm h-10 transition-all active:scale-95" asChild>
                    <Link to="/merchant/chat">Start Live Chat</Link>
                 </Button>
              </Card>
           </div>
        </div>
      </div>
    </MerchantLayout>
  );
};
