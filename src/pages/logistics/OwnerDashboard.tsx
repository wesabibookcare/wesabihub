import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { LogisticsLayout } from '@/src/layouts/LogisticsLayout';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/src/context/AuthContext';
import {
  logisticsEngine,
  auditEngine,
  notificationEngine
} from '@/src/engines';
import {
  Users,
  Truck,
  Package,
  CheckCircle2,
  Clock,
  TrendingUp,
  Wallet,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  FileText,
  Loader2,
  Star,
  ShieldCheck,
  Activity,
  Award,
  AlertCircle
} from 'lucide-react';

export const OwnerDashboard = () => {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await logisticsEngine.getCompanyByOwner(user!.uid);
      setCompany(data);

      const logs = await auditEngine.getAuditLogs(user!.uid, 10);
      setAuditLogs(logs);
    } catch (error) {
      console.error('Error fetching Logistics owner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);

      // Fetch fresh data for export
      const jobs = await logisticsEngine.getJobs(company.id);
      const fleet = await logisticsEngine.getFleet(company.id);

      const exportData = [
        ...jobs.map(j => ({
          Type: 'JOB',
          ID: j.jobNumber,
          Status: j.status,
          Origin: j.origin,
          Destination: j.destination,
          Driver: j.driverName || 'Unassigned',
          Parcels: j.parcelCount,
          Date: new Date(j.createdAt || '').toLocaleString()
        })),
        ...fleet.map(v => ({
          Type: 'VEHICLE',
          ID: v.plateNumber,
          Status: v.status,
          Model: v.model,
          TypeInfo: v.type,
          Company: company.name
        }))
      ];

      if (exportData.length === 0) {
        toast.error('No operational data available for export');
        return;
      }

      // Convert to CSV
      const headers = Object.keys(exportData[0]).join(',');
      const rows = exportData.map(row =>
        Object.values(row).map(value => `"${value}"`).join(',')
      ).join('\n');
      const csv = `${headers}\n${rows}`;

      // Download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `omorfihub_logistics_report_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Logistics report exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const stats = [
    { label: "Today's Assignments", value: String(company?.dailyAssignments || 0), icon: Package, color: "text-blue-600", bg: "bg-blue-100", trend: "+0%", up: true },
    { label: "Active Drivers", value: String(company?.activeDrivers || 0), icon: Users, color: "text-emerald-600", bg: "bg-emerald-100", trend: "Live", up: true },
    { label: "Parcels In Transit", value: String(company?.parcelsInTransit || 0), icon: Truck, color: "text-amber-600", bg: "bg-amber-100", trend: "+0%", up: true },
    { label: "Completed Today", value: String(company?.completedToday || 0), icon: CheckCircle2, color: "text-purple-600", bg: "bg-purple-100", trend: "+0%", up: true },
  ];

  const secondaryStats = [
    { label: "Pending Pickups", value: String(company?.pendingPickups || 0), color: "text-slate-800" },
    { label: "Pending Drop-offs", value: String(company?.pendingDropoffs || 0), color: "text-slate-800" },
    { label: "Today's Earnings", value: `₦${company?.todayEarnings || 0}`, color: "text-emerald-600" },
    { label: "Upcoming Payout", value: `₦${company?.upcomingPayout || 0}`, color: "text-primary-600" },
  ];

  if (loading) {
    return (
      <LogisticsLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="animate-spin text-primary-600" size={40} />
        </div>
      </LogisticsLayout>
    );
  }

  return (
    <LogisticsLayout>
      <div className="space-y-8 ">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <p className="text-emerald-600 font-bold uppercase tracking-widest text-[10px] mb-2">Logistics Overview</p>
           <h1 className="text-4xl font-black tracking-tight dark:text-white">Business Dashboard</h1>
           <p className="text-slate-900 font-medium mt-1">Manage your fleet and track real-time delivery performance.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold border-slate-200 gap-2" onClick={handleExport} disabled={isExporting}>
              {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
              {isExporting ? 'Exporting...' : 'Export Reports'}
           </Button>
           <Button className="rounded-2xl h-12 px-8 font-black bg-primary-600 shadow-lg shadow-primary-500/20 gap-2 hover:scale-105 transition-transform" asChild>
              <Link to="/logistics/reports">
                 <TrendingUp size={18} />
                 View Insights
              </Link>
           </Button>
        </div>
      </div>

      {/* Pending Application Banner */}
      {(user?.pendingRoleApplication || company?.status === 'PENDING' || company?.status === 'SUBMITTED') && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Logistics Partner Application Under Review</h4>
              <p className="text-xs text-amber-800 dark:text-amber-300">Your partner registration application is under review by the Verification Desk. You can configure fleet, assign drivers, and manage settings while Admin completes verification.</p>
            </div>
          </div>
          <Badge variant="warning" className="shrink-0 bg-amber-500 text-slate-950 font-black">
            UNDER REVIEW
          </Badge>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="p-6 border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-slate-900 overflow-hidden relative group">
               <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 opacity-5 transition-transform group-hover:scale-150", stat.bg)} />
               <div className="flex items-start justify-between mb-4">
                  <div className={cn("p-3 rounded-2xl shadow-inner", stat.bg)}>
                    <stat.icon size={24} className={stat.color} />
                  </div>
                  <Badge className={cn("rounded-full px-2 py-1 text-[10px] font-black", stat.up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                    {stat.up ? <ArrowUpRight size={10} className="mr-1 inline" /> : <ArrowDownRight size={10} className="mr-1 inline" />}
                    {stat.trend}
                  </Badge>
               </div>
               <div>
                  <h3 className="text-3xl font-black dark:text-white mb-1">{stat.value}</h3>
                  <p className="text-sm font-bold text-slate-800 uppercase tracking-wider">{stat.label}</p>
               </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Secondary Stats & Quick Glance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           {/* Recent Jobs Table-like view */}
           <Card className="p-8 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem]">
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h2 className="text-2xl font-black dark:text-white">Recent Operations</h2>
                    <p className="text-sm font-medium text-slate-900 mt-1">Live tracking of your latest transport assignments.</p>
                 </div>
                 <Button variant="link" className="text-primary-600 font-black gap-2 group" asChild>
                    <Link to="/logistics/jobs">
                       View All Jobs <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                 </Button>
              </div>

              <div className="space-y-4">
                 {auditLogs.length === 0 ? (
                    <p className="text-xs text-slate-800 text-center py-10">No recent operational logs found.</p>
                 ) : auditLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-primary-500/30 transition-all group">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary-500 shadow-primary-500/20 flex items-center justify-center text-white font-black shadow-lg">
                             {log.action?.charAt(0) || 'A'}
                          </div>
                          <div>
                             <p className="text-sm font-black dark:text-white">{log.action}</p>
                             <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">{log.id.slice(0, 8)}</span>
                                <span className="text-[10px] font-bold text-slate-300">•</span>
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1">
                                   {new Date(log.timestamp).toLocaleString()}
                                </span>
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <Badge className="rounded-xl px-3 py-1 font-bold text-[10px] bg-emerald-500/10 text-emerald-600">
                             {log.result}
                          </Badge>
                       </div>
                    </div>
                 ))}
              </div>
           </Card>

           {/* Fleet Status */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-8 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem]">
                 <h3 className="text-xl font-black dark:text-white mb-6 flex items-center gap-2">
                    <Truck className="text-primary-600" size={24} />
                    Fleet Status
                 </h3>
                 <div className="space-y-6">
                    <div>
                       <div className="flex justify-between items-end mb-2">
                          <span className="text-sm font-bold text-slate-800">Delivery Success Rate</span>
                          <span className="text-xl font-black text-emerald-600">{company?.successRate || 0}%</span>
                       </div>
                       <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${company?.successRate || 0}%` }}
                            className="h-full bg-emerald-500 rounded-full"
                          />
                       </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                       <div className="text-center">
                          <p className="text-2xl font-black dark:text-white">{company?.activeFleet || 0}</p>
                          <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Active</p>
                       </div>
                       <div className="text-center">
                          <p className="text-2xl font-black dark:text-white">{company?.inService || 0}</p>
                          <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">In Service</p>
                       </div>
                       <div className="text-center">
                          <p className="text-2xl font-black dark:text-white">{company?.grounded || 0}</p>
                          <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Grounded</p>
                       </div>
                    </div>
                 </div>
              </Card>

              <Card className="p-8 border-none shadow-xl bg-gradient-to-br from-primary-600 to-indigo-700 rounded-[2.5rem] text-white overflow-hidden relative">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                 <div className="relative z-10">
                    <p className="text-primary-100 font-bold uppercase tracking-widest text-[10px] mb-2">Upcoming Payout</p>
                    <h3 className="text-4xl font-black mb-1">₦{company?.upcomingPayout?.toLocaleString() || '0'}</h3>
                    <p className="text-primary-200 text-sm font-medium">Next scheduled settlement cycle</p>
                    <Button className="mt-8 w-full bg-white text-primary-600 hover:bg-primary-50 rounded-2xl h-12 font-black transition-all" asChild>
                       <Link to="/logistics/payouts">Manage Finances</Link>
                    </Button>
                 </div>
              </Card>
           </div>
        </div>

        <div className="space-y-8">
           <Card className="p-8 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem]">
              <h3 className="text-xl font-black dark:text-white mb-6">Performance Summary</h3>
              <div className="space-y-6">
                 {secondaryStats.map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between">
                       <span className="text-sm font-bold text-slate-900">{stat.label}</span>
                       <span className={cn("text-lg font-black", stat.color)}>{stat.value}</span>
                    </div>
                 ))}
              </div>
              <div className="mt-8 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700">
                 <p className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4">Announcements</p>
                 <div className="space-y-4">
                    <div className="flex gap-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                       <p className="text-xs font-medium dark:text-slate-300">New route expansion into Ibadan Central starts next week.</p>
                    </div>
                    <div className="flex gap-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                       <p className="text-xs font-medium dark:text-slate-300">System maintenance on Payout engine: Sunday 2AM-4AM.</p>
                    </div>
                 </div>
              </div>
           </Card>

           <Card className="p-8 border-none shadow-xl bg-slate-950 rounded-[2.5rem] text-white">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 rounded-xl bg-red-500/20 text-red-500">
                    <AlertTriangle size={20} />
                 </div>
                 <h3 className="text-lg font-black">Issue Reports</h3>
              </div>
              <p className="text-slate-800 text-sm font-medium mb-6">There are 2 open exceptions requiring your immediate attention.</p>
              <div className="space-y-3">
                 <Link to="/logistics/exception" className="block">
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between group cursor-pointer hover:border-red-500/50 transition-colors">
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="text-xs font-bold">Vehicle Breakdown #VD-09</span>
                       </div>
                       <ChevronRight size={14} className="text-slate-800 group-hover:translate-x-1 transition-transform" />
                    </div>
                 </Link>
              </div>
           </Card>
        </div>
      </div>
      </div>
    </LogisticsLayout>
  );
};
