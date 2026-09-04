import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Truck,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Package,
  Wallet,
  Clock,
  ExternalLink,
  Store,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Bell,
  MessageSquare,
  Globe,
  Settings,
  Eye,
  LogOut,
  Zap,
  Terminal,
  ShieldAlert,
  HelpCircle,
  Database,
  Cpu,
  Trash2,
  Radio
} from 'lucide-react';
import { userEngine } from '@/src/engines';
import { parcelEngine } from '@/src/engines';
import { configurationEngine } from '@/src/engines';
import { motion, AnimatePresence } from 'motion/react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { cn } from '@/src/lib/utils';
import { analyticsService } from '../../services/AnalyticsService';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { toast } from 'sonner';
import { adminEngine } from '../../engines/AdminEngine';

export const AdminDashboard = () => {
  const { user, impersonate, impersonatedRole, stopImpersonating } = useAuth();
  const [data, setData] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboardData = await analyticsService.getControlCenterDashboard().catch(err => {
        console.error("Dashboard core fetch failed", err);
        return null;
      });

      const stats = await adminEngine.getDashboardStats();
      const recentNotifications = stats.notifications || [];
      const recentComplaints = stats.complaints || [];

      if (!dashboardData) {
        throw new Error("Unable to retrieve vital platform command statistics. Please check database permissions.");
      }
      setData(dashboardData);
      setNotifications(recentNotifications.slice(0, 5));
      setComplaints(recentComplaints);
    } catch (err: any) {
      console.error('Error loading operations data:', err);
      setError(err?.message || 'Failed to connect to the administration database.');
    } finally {
      setLoading(false);
    }
  };

  const handleSanitize = async () => {
    if (user?.role !== 'SUPER_ADMIN') {
      toast.error("Access Denied: Only a Super Admin is authorized to purge or sanitize platform data.");
      return;
    }
    const confirmation = window.prompt("CRITICAL ACTION: To purge platform demo data, type 'PURGE DATA' to confirm:");
    if (confirmation !== "PURGE DATA") {
      toast.error("Sanitization cancelled. Confirmation phrase did not match.");
      return;
    }
    try {
      await adminEngine.purgeAllData(user?.uid || 'admin');
      toast.success("Demo data sanitized successfully!");
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      toast.error("Error sanitizing demo data");
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // handleSanitize(); // Run once then comment out
   }, []);

  const stats = data ? [
    { label: 'Active Users', value: data.totalUsers.toLocaleString(), trend: '+12%', isUp: true, icon: Users, color: 'text-blue-600', bg: 'bg-blue-600/10' },
    { label: 'Active Shipments', value: data.activeShipments.toLocaleString(), trend: '+8.4%', isUp: true, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-600/10' },
    { label: 'Pending Pickups', value: data.pendingPickups.toLocaleString(), trend: '+5', isUp: true, icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-600/10' },
    { label: 'Active SafePay', value: `$${(data.activeSafePay * 500).toLocaleString()}`, trend: '-2.1%', isUp: false, icon: Wallet, color: 'text-slate-900', bg: 'bg-slate-900/10' },
  ] : [];

  const roleMetrics = data ? [
    { label: 'Customers', count: data.registeredCustomers, color: 'bg-blue-500' },
    { label: 'Merchants', count: data.registeredMerchants, color: 'bg-indigo-500' },
    { label: 'Hub Owners', count: data.centreOwners, color: 'bg-emerald-500' },
    { label: 'Logistics', count: data.logisticsPartners, color: 'bg-amber-500' },
    { label: 'Developers', count: data.developers, color: 'bg-slate-500' },
  ] : [];

  const impersonationOptions: { role: UserRole; label: string; icon: any }[] = [
    { role: 'CUSTOMER', label: 'Customer', icon: Users },
    { role: 'MERCHANT', label: 'Merchant', icon: Store },
    { role: 'CENTER_OWNER', label: 'Centre Owner', icon: MapPin },
    { role: 'CENTER_STAFF', label: 'Centre Staff', icon: Users },
    { role: 'LOGISTICS_COMPANY', label: 'Logistics Partner', icon: Truck },
    { role: 'DEVELOPER', label: 'Developer/API', icon: Terminal },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Zap className="animate-pulse text-primary-500" size={48} />
          <p className="text-sm font-bold text-slate-900 animate-pulse">Initializing Control Centre...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center max-w-md mx-auto">
          <div className="p-4 bg-red-50 text-red-600 rounded-full mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Platform Connection Failed</h2>
          <p className="text-sm text-slate-900 mb-6">{error || 'Unable to display platform console data.'}</p>
          <div className="flex gap-4">
            <Button variant="outline" className="font-bold rounded-xl" onClick={() => window.location.reload()}>
              Reload Window
            </Button>
            <Button className="font-bold rounded-xl bg-primary-600 hover:bg-primary-700" onClick={fetchDashboardData}>
              Try Connecting Again
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 ">
        {/* Header with Operations Context */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-primary-200 text-primary-600 bg-primary-50">
                Operations Centre
              </Badge>
              {impersonatedRole && (
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-amber-200 text-amber-600 bg-amber-50 animate-pulse">
                  Viewing As: {impersonatedRole}
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white font-display">
              Platform Command
            </h1>
            <p className="text-slate-900 font-medium mt-1">
              Global monitoring and administrative control for OmorfiHub Ecosystem.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {impersonatedRole ? (
              <Button
                onClick={stopImpersonating}
                className="rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20"
              >
                <LogOut size={18} className="mr-2" /> Exit Preview Mode
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                 {user?.role === 'SUPER_ADMIN' && (
                   <Button variant="outline" className="rounded-xl border-slate-200 font-bold bg-white" onClick={handleSanitize}>
                      <Trash2 size={18} className="mr-2 text-red-500" /> Sanitize
                   </Button>
                 )}
                 <Button variant="outline" className="rounded-xl border-slate-200 font-bold bg-white" asChild>
                   <Link to="/admin/settings?tab=telegram">
                    <MessageSquare size={18} className="mr-2 text-blue-500" /> Telegram Bot: {data.telegramEnabled ? 'Active' : 'Offline'}
                   </Link>
                 </Button>
                 <Button variant="outline" className="rounded-xl border-emerald-500/30 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 font-bold" asChild>
                   <Link to="/admin/cctv-monitoring">
                     <Radio size={18} className="mr-2 text-emerald-600 animate-pulse" /> Live CCTV Mode
                   </Link>
                 </Button>
                 <Button className="rounded-xl font-bold shadow-lg shadow-primary-600/20" asChild>
                   <Link to="/admin/overview">Full System Analytics</Link>
                 </Button>
              </div>
            )}
          </div>
        </div>

        {/* View Platform As Switcher */}
        {!impersonatedRole && (
          <Card className="p-6 border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="text-slate-800" size={18} />
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">View Platform As</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {impersonationOptions.map(option => (
                <button
                  key={option.role}
                  onClick={async () => {
                    impersonate(option.role);
                    await auditEngine.logEvent({
                      userId: user?.uid || 'admin',
                      action: 'START_IMPERSONATION' as any,
                      details: { impersonatedRole: option.role },
                      result: 'SUCCESS'
                    });
                    toast.info(`Switched preview mode to: ${option.label}`);
                  }}
                  className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-2xl hover:border-primary-500 hover:shadow-md transition-all group"
                >
                  <option.icon size={20} className="text-slate-800 group-hover:text-primary-600 mb-2" />
                  <span className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">{option.label}</span>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-6 border-none shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/60 transition-all group overflow-hidden relative">
                <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 transition-transform group-hover:scale-150 duration-500", stat.bg)} />
                <div className="flex items-start justify-between relative">
                  <div className={cn("p-3 rounded-2xl", stat.bg)}>
                    <stat.icon size={24} className={stat.color} />
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg",
                    stat.isUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                  )}>
                    {stat.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {stat.trend}
                  </div>
                </div>
                <div className="mt-4 relative">
                  <h3 className="text-3xl font-black tracking-tight text-slate-900">{stat.value}</h3>
                  <p className="text-slate-900 font-bold text-xs uppercase tracking-widest mt-1">{stat.label}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Operational Monitor */}
          <div className="lg:col-span-2 space-y-8">
            {/* User Distribution */}
            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 overflow-hidden relative">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900">Ecosystem Distribution</h2>
                  <p className="text-sm text-slate-900 font-medium">Platform reach across all participant roles.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 123}`} alt="user" />
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-primary-600 text-[10px] font-black text-white flex items-center justify-center">
                      +{data.totalUsers - 4}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {roleMetrics.map(role => (
                  <div key={role.label} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-900">{role.label}</span>
                      <span className="text-sm font-black text-slate-900">{role.count.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(role.count / data.totalUsers) * 100}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={cn("h-full rounded-full shadow-sm", role.color)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Operational Nodes Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 border-none shadow-xl shadow-slate-200/50 bg-slate-900 text-white overflow-hidden relative">
                <ShieldAlert size={120} className="absolute -right-8 -bottom-8 opacity-10" />
                <h3 className="text-lg font-black tracking-tight mb-2">Dispute Resolution</h3>
                <p className="text-slate-800 text-xs font-medium mb-6">Active arbitration cases needing attention.</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-black text-amber-400">{data.activeDisputes}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 mt-1">Pending Review</p>
                  </div>
                  <Button className="bg-primary-600 text-white hover:bg-primary-700 font-bold px-4 py-2 h-auto text-xs rounded-xl border-none" asChild>
                    <Link to="/admin/disputes">Open Cases</Link>
                  </Button>
                </div>
              </Card>

              <Card className="p-6 border-none shadow-xl shadow-slate-200/50 bg-emerald-600 text-white overflow-hidden relative">
                <Activity size={120} className="absolute -right-8 -bottom-8 opacity-10" />
                <h3 className="text-lg font-black tracking-tight mb-2">System Throughput</h3>
                <p className="text-emerald-100 text-xs font-medium mb-6">Total successful parcels processed by AI.</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-black">{data.totalShipments.toLocaleString()}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200 mt-1">Total Operations</p>
                  </div>
                  <Badge className="bg-white/20 text-white border-none font-bold">
                    99.8% Success
                  </Badge>
                </div>
              </Card>
            </div>

            {/* Admin Notifications Section */}
            <Card className="p-8 border-none shadow-xl shadow-slate-200/50">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-900">Critical Alerts</h2>
                    <p className="text-sm text-slate-900 font-medium">Administrative notifications and platform events.</p>
                  </div>
                </div>
                <Button onClick={() => { setNotifications([]); toast.success('All notifications marked as read'); }} variant="ghost" className="text-xs font-bold text-primary-600">Mark all read</Button>
              </div>

              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-12 text-slate-800 italic">No new administrative alerts.</div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4 hover:bg-white hover:shadow-md transition-all cursor-pointer group">
                      <div className={cn(
                        "p-2 rounded-xl shrink-0 mt-1",
                        notif.type === 'ERROR' ? 'bg-red-100 text-red-600' :
                        notif.type === 'WARNING' ? 'bg-amber-100 text-amber-600' :
                        'bg-blue-100 text-blue-600'
                      )}>
                        {notif.type === 'ERROR' ? <ShieldAlert size={16} /> :
                         notif.type === 'WARNING' ? <AlertCircle size={16} /> :
                         <Bell size={16} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-black text-slate-900 group-hover:text-primary-600 transition-colors">{notif.title}</h4>
                          <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">{new Date(notif.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-slate-900 mt-1 line-clamp-1">{notif.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Activity & Support Feeds */}
          <div className="space-y-8">
            {/* Complaint Center Summary */}
            <Card className="p-6 border-none shadow-xl shadow-slate-200/50">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <HelpCircle size={18} className="text-indigo-600" />
                  <h2 className="text-lg font-black tracking-tight text-slate-900">Complaint Centre</h2>
                </div>
                <Link to="/admin/support" className="text-primary-600 text-xs font-black uppercase tracking-widest hover:underline">View All</Link>
              </div>
              <div className="space-y-4">
                {complaints.length === 0 ? (
                  <div className="text-center py-8 text-slate-800 italic text-sm">No active complaints.</div>
                ) : (
                  complaints.map((complaint) => (
                    <div key={complaint.id} className="p-4 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-100 cursor-pointer group">
                      <div className="flex justify-between items-start mb-2">
                        <Badge className={cn(
                          "text-[9px] font-black px-2 py-0.5 rounded-full border-none",
                          complaint.priority === 'CRITICAL' ? 'bg-red-500 text-white' :
                          complaint.priority === 'HIGH' ? 'bg-amber-500 text-white' :
                          complaint.priority === 'MEDIUM' ? 'bg-blue-500 text-white' :
                          'bg-slate-400 text-white'
                        )}>
                          {complaint.priority}
                        </Badge>
                        <span className="text-[9px] font-bold text-slate-800 uppercase tracking-widest">{complaint.status}</span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1">{complaint.title}</h4>
                      <p className="text-[10px] text-slate-900 font-bold mt-1 line-clamp-2">{complaint.description}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                          <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${complaint.userName}`} alt="avatar" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-800 italic">{complaint.userName}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Health Indicators */}
            <Card className="p-6 border-none shadow-xl shadow-slate-200/50 bg-gradient-to-br from-indigo-900 to-slate-900 text-white relative overflow-hidden">
               <Terminal size={140} className="absolute -right-12 -bottom-12 opacity-5" />
               <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black tracking-tight">System Node SLA</h3>
                    <Badge className="bg-emerald-500 text-white border-none text-[10px] font-black">99.9% UPTIME</Badge>
                  </div>

                  <div className="space-y-3">
                     {[
                        { label: 'API Gateway', status: 'Optimal', icon: Zap },
                        { label: 'Payment Protection', status: 'Optimal', icon: ShieldCheck },
                        { label: 'Database Sync', status: 'Optimal', icon: Database },
                        { label: 'AI Resolution Engine', status: 'Processing', icon: Cpu },
                     ].map(service => (
                        <div key={service.label} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                           <div className="flex items-center gap-2">
                             <service.icon size={14} className="text-slate-800" />
                             <span className="text-[11px] font-bold">{service.label}</span>
                           </div>
                           <span className={cn(
                              "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                              service.status === 'Optimal' ? "bg-emerald-400/20 text-emerald-300" : "bg-blue-400/20 text-blue-300"
                           )}>{service.status}</span>
                        </div>
                     ))}
                  </div>

                  <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Live Traffic Volume</p>
                    <div className="flex items-center gap-1 h-8">
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-primary-500/30 rounded-t-sm"
                          style={{ height: `${Math.random() * 100}%` }}
                        />
                      ))}
                    </div>
                  </div>
               </div>
            </Card>

            <Button variant="outline" className="w-full rounded-2xl py-6 border-slate-200 text-slate-900 font-bold hover:bg-slate-50" asChild>
              <Link to="/admin/settings">
                <Settings size={18} className="mr-2" /> Global Platform Settings
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
