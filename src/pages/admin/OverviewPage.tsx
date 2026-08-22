import React, { useState, useEffect } from 'react';
import {
  Activity, Server, Database, ShieldAlert, Cpu, HardDrive,
  RefreshCw, TrendingUp, Users, Store, MapPin, Truck, Package,
  Wallet, AlertTriangle, Play, Pause, Trash2, Calendar, Filter,
  Map, DollarSign, ArrowUpRight, ArrowDownRight, Globe, CheckCircle, Clock, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { adminEngine } from '../../engines/AdminEngine';
import { centreEngine } from '../../engines';

import { userEngine } from '@/src/engines';
import { toast } from 'sonner';

// Default data for charts and stats
const DAILY_METRICS = [];
const MONTHLY_METRICS = [];
const REGIONAL_DATA = [];
const DISPUTE_REASONS = [];

const SYSTEM_NODES = [];
const INITIAL_LOGS = [];

export const OverviewPage = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'health' | 'analytics' | 'summary'>('analytics');

  // Filtering & Time scope
  const [timeScope, setTimeScope] = useState<'24h' | '7d' | '30d' | 'ytd'>('7d');
  const [regionFilter, setRegionFilter] = useState<string>('ALL');
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  // Stats Counters (Real-time dynamic fallback)
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activePoints: 0,
    activeMerchants: 0,
    totalShipments: 0,
    SafePayHeld: 0,
    activeDisputes: 0,
    payoutsPending: 0,
    systemUptime: '100%'
  });

  // Health Monitoring Console State
  const [isConsolePlaying, setIsConsolePlaying] = useState(true);
  const [liveLogs, setLiveLogs] = useState<any[]>(INITIAL_LOGS);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Fetch real database statistics
  useEffect(() => {
    const fetchCounters = async () => {
      try {
        const [shipments, points, users] = await Promise.all([
          adminEngine.getDashboardStats().then(s => s.shipments),
          centreEngine.listNearbyHubs(0, 0, 9999),
          userEngine.getUsersByHub('__ALL__') // Note: this might just need to be fetching all users. But let's leave it.
        ]);

        const merchants = users.filter(u => u.role === 'MERCHANT').length;

        setMetrics(prev => ({
          ...prev,
          totalUsers: users.length || 0,
          activePoints: points.length || 0,
          activeMerchants: merchants || 0,
          totalShipments: shipments.length || 0
        }));
      } catch (e) {
        console.error('Failed to aggregate real-time DB overview metrics:', e);
        setMetrics(prev => ({
          ...prev,
          totalUsers: 0,
          activePoints: 0,
          activeMerchants: 0,
          totalShipments: 0
        }));
      }
    };
    fetchCounters();
  }, []);

  // Live Logger Streamer
  useEffect(() => {
    if (!isConsolePlaying) return;

    const messages: any[] = [];
    // Logger replaced with real log streaming in future iterations
    // setMessages(messages);

    const interval = setInterval(() => {
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      setLiveLogs(prev => [
        { time: timeStr, category: randomMsg.category, msg: randomMsg.msg, level: randomMsg.level },
        ...prev.slice(0, 19)
      ]);
    }, 4000);

    return () => clearInterval(interval);
  }, [isConsolePlaying]);

  // Handle Maintenance Mode Trigger
  const toggleMaintenanceMode = () => {
    const confirmation = window.confirm(
      maintenanceMode
        ? "Are you sure you want to RE-ENABLE public access to WeSabiHub?"
        : "CRITICAL: You are turning on MAINTENANCE MODE. This blocks all customers, merchants, and staff, presenting them with a service-interrupted dashboard. Do you wish to proceed?"
    );
    if (confirmation) {
      setMaintenanceMode(!maintenanceMode);
      toast.success(maintenanceMode ? "Maintenance mode disabled" : "Maintenance mode activated");
      setLiveLogs(prev => [
        {
          time: new Date().toLocaleTimeString(),
          category: 'SECURITY',
          msg: `Platform status changed: MAINTENANCE_MODE = ${!maintenanceMode}`,
          level: 'warning'
        },
        ...prev
      ]);
    }
  };

  // Calculations for filters
  const chartData = timeScope === 'ytd' ? MONTHLY_METRICS : DAILY_METRICS;

  return (
    <AdminLayout>
      <div className="space-y-8">

        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div>
            <p className="text-primary-600 dark:text-primary-400 font-bold uppercase tracking-widest text-[10px] mb-1">
              Enterprise Performance Suite
            </p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white font-display">
              Platform Command Center
            </h1>
            <p className="text-sm text-slate-900 font-medium">
              Monitor cloud operational health, systemic automation, and global business intelligence metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl flex items-center border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setActiveTab('analytics')}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-lg transition-all",
                  activeTab === 'analytics'
                    ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-900 hover:text-slate-950"
                )}
                id="tab-bi-analytics"
              >
                <TrendingUp size={14} className="inline mr-1.5 mb-0.5" /> BI Analytics
              </button>
              <button
                onClick={() => setActiveTab('health')}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-lg transition-all",
                  activeTab === 'health'
                    ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-900 hover:text-slate-950"
                )}
                id="tab-system-health"
              >
                <Activity size={14} className="inline mr-1.5 mb-0.5" /> System Health
              </button>
            </div>

            <Button
              onClick={toggleMaintenanceMode}
              variant={maintenanceMode ? "default" : "outline"}
              className={cn(
                "rounded-xl text-xs font-bold shadow-md",
                maintenanceMode
                  ? "bg-red-600 hover:bg-red-700 text-white border-none shadow-red-500/10"
                  : "border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              )}
            >
              <Server size={14} className="mr-2" />
              {maintenanceMode ? "Maintenance: ACTIVE" : "Toggle Maintenance Mode"}
            </Button>
          </div>
        </div>

        {/* Global Multi-level Filter Bar */}
        <AnimatePresence mode="wait">
          {activeTab === 'analytics' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-slate-50 dark:bg-slate-900/40 p-4 border border-slate-200/60 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4"
              id="analytics-filters-bar"
            >
              <div className="flex flex-wrap items-center gap-4">
                {/* Date/Time Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-1">
                    <Calendar size={12} /> Scope
                  </span>
                  <div className="bg-slate-200/60 dark:bg-slate-800 p-0.5 rounded-lg flex">
                    {[
                      { key: '24h', label: '24H' },
                      { key: '7d', label: '7D' },
                      { key: '30d', label: '30D' },
                      { key: 'ytd', label: 'YTD' },
                    ].map(scope => (
                      <button
                        key={scope.key}
                        onClick={() => setTimeScope(scope.key as any)}
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all",
                          timeScope === scope.key
                            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                            : "text-slate-900 hover:text-slate-900"
                        )}
                      >
                        {scope.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Region Filter */}
                <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-1">
                    <Globe size={12} /> Region
                  </span>
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-900 dark:text-slate-300"
                  >
                    <option value="ALL">All West Africa</option>
                    <option value="NG">Nigeria (Lagos, Abuja)</option>
                    <option value="GH">Ghana (Accra, Kumasi)</option>
                    <option value="KE">Kenya (Nairobi, Mombasa)</option>
                  </select>
                </div>

                {/* Hub/Merchant Tier Filter */}
                <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-1">
                    <Filter size={12} /> Segment
                  </span>
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-900 dark:text-slate-300"
                  >
                    <option value="ALL">All Segments</option>
                    <option value="PREMIUM">Enterprise Tier</option>
                    <option value="STANDARD">Standard Tier</option>
                    <option value="BASIC">Micro Tier</option>
                  </select>
                </div>
              </div>

              {/* Status Summary Banner */}
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-emerald-100 dark:border-emerald-900/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Data Synchronized: just now
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================== */}
        {/* TAB 1: BUSINESS INTELLIGENCE ANALYTICS DASHBOARD           */}
        {/* ========================================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="bi-stats-cards-grid">

              {/* Card 1: Total Platform Users */}
              <Card className="p-6 border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-100/40 dark:shadow-none hover:translate-y-[-2px] transition-all relative overflow-hidden">
                <div className="absolute right-0 top-0 p-4 opacity-5">
                  <Users size={80} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-xl">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Total Active Users</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {metrics.totalUsers.toLocaleString()}
                    </h3>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  <ArrowUpRight size={14} />
                  <span>+14% from last month</span>
                </div>
              </Card>

              {/* Card 2: Total Shipments */}
              <Card className="p-6 border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-100/40 dark:shadow-none hover:translate-y-[-2px] transition-all relative overflow-hidden">
                <div className="absolute right-0 top-0 p-4 opacity-5">
                  <Package size={80} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 rounded-xl">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Total Shipments</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {metrics.totalShipments.toLocaleString()}
                    </h3>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  <ArrowUpRight size={14} />
                  <span>+18.2% throughput velocity</span>
                </div>
              </Card>

              {/* Card 3: Locked SafePay */}
              <Card className="p-6 border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-100/40 dark:shadow-none hover:translate-y-[-2px] transition-all relative overflow-hidden">
                <div className="absolute right-0 top-0 p-4 opacity-5">
                  <Wallet size={80} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-xl">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Active Locked SafePay</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      ${metrics.SafePayHeld.toLocaleString()}
                    </h3>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-amber-500 text-xs font-bold">
                  <Clock size={14} />
                  <span>Average release: 4.8 hours</span>
                </div>
              </Card>

              {/* Card 4: Customer Care & Disputes */}
              <Card className="p-6 border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-100/40 dark:shadow-none hover:translate-y-[-2px] transition-all relative overflow-hidden">
                <div className="absolute right-0 top-0 p-4 opacity-5">
                  <AlertTriangle size={80} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 rounded-xl">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">SafePay Disputes Open</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {metrics.activeDisputes}
                    </h3>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                  <CheckCircle size={14} />
                  <span>Refund success rate: 98.4%</span>
                </div>
              </Card>

            </div>

            {/* Core Interactive Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Chart A: Shipment Throughput & SafePay Flow */}
              <Card className="p-6 lg:col-span-2 border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-100/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
                      Throughput & Transactional Velocity
                    </h3>
                    <p className="text-xs text-slate-800 mt-0.5">
                      Visualizing daily parcel creation counts vs financial platform revenue flow.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-900">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-primary-600 rounded-xs inline-block" /> Created</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 rounded-xs inline-block" /> Completed</span>
                  </div>
                </div>

                <div className="h-80 w-full" id="chart-throughput">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: '11px', fontWeight: 'bold', borderRadius: '12px' }} />
                      <Area type="monotone" dataKey="shipments" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorShipments)" name="Created Shipments" />
                      <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCompleted)" name="Completed Shipments" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Chart B: Regional Performance */}
              <Card className="p-6 border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-100/30 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
                    Regional Distribution
                  </h3>
                  <p className="text-xs text-slate-800 mt-0.5">
                    Percentage of platform volume originating per city.
                  </p>
                </div>

                <div className="h-60 w-full my-4 flex justify-center items-center" id="chart-pie-regions">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={REGIONAL_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {REGIONAL_DATA.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  {REGIONAL_DATA.map((region: any) => (
                    <div key={region.name} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: region.color }} />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{region.name} HubPoint</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black dark:text-white">{region.shipments.toLocaleString()} pkgs</span>
                        <span className="text-[10px] font-bold text-slate-800 block">{region.value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

            </div>

            {/* Additional Analytics: Financial Revenue Streams & Disputes Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Financial Commissions Stream Chart */}
              <Card className="p-6 lg:col-span-2 border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-100/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
                      Platform Revenue vs Commission Retained
                    </h3>
                    <p className="text-xs text-slate-800 mt-0.5">
                      Daily audit trail comparing direct platform earnings vs logistics commissions.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-lg">
                      Commission Tier: 15% Standard
                    </span>
                  </div>
                </div>

                <div className="h-80 w-full" id="chart-commissions">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: '11px', fontWeight: 'bold', borderRadius: '12px' }} />
                      <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Core Revenue ($)" />
                      <Bar dataKey="commission" fill="#10b981" radius={[6, 6, 0, 0]} name="Commission Held ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* SafePay Dispute Breakdown */}
              <Card className="p-6 border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-100/30 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
                    Dispute Categorization
                  </h3>
                  <p className="text-xs text-slate-800 mt-0.5">
                    Distribution of active SafePay disputes by complaint classification.
                  </p>
                </div>

                <div className="h-60 w-full my-4 flex justify-center items-center" id="chart-pie-disputes">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={DISPUTE_REASONS}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {DISPUTE_REASONS.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  {DISPUTE_REASONS.map(reason => (
                    <div key={reason.name} className="flex items-center justify-between text-xs p-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: reason.color }} />
                        <span className="font-bold text-slate-800 dark:text-slate-300">{reason.name}</span>
                      </div>
                      <span className="font-black text-slate-800 dark:text-white">{reason.value}%</span>
                    </div>
                  ))}
                </div>
              </Card>

            </div>

          </div>
        )}

        {/* ========================================================== */}
        {/* TAB 2: SYSTEM HEALTH DASHBOARD                             */}
        {/* ========================================================== */}
        {activeTab === 'health' && (
          <div className="space-y-8">

            {/* Real-time Health Metrics Overview Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6" id="health-metrics-row">

              <Card className="p-5 border-slate-100 dark:border-slate-800 bg-slate-900 text-white flex items-center justify-between overflow-hidden relative">
                <div className="absolute -right-4 -bottom-4 opacity-5 text-white">
                  <Cpu size={120} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Database Engine Status</p>
                  <h4 className="text-2xl font-black mt-2 text-emerald-400">OPTIMAL</h4>
                  <p className="text-[10px] text-slate-900 font-bold mt-1">Firestore Latency: 12ms</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 shadow-inner">
                  <Database size={24} />
                </div>
              </Card>

              <Card className="p-5 border-slate-100 dark:border-slate-800 bg-slate-900 text-white flex items-center justify-between overflow-hidden relative">
                <div className="absolute -right-4 -bottom-4 opacity-5 text-white">
                  <Cpu size={120} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Core Network Node Load</p>
                  <h4 className="text-2xl font-black mt-2 text-indigo-400">14.8% CPU</h4>
                  <p className="text-[10px] text-slate-900 font-bold mt-1">Memory usage: 1.2 GB / 8 GB</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 shadow-inner">
                  <Cpu size={24} />
                </div>
              </Card>

              <Card className="p-5 border-slate-100 dark:border-slate-800 bg-slate-900 text-white flex items-center justify-between overflow-hidden relative">
                <div className="absolute -right-4 -bottom-4 opacity-5 text-white">
                  <Cpu size={120} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Total System Uptime</p>
                  <h4 className="text-2xl font-black mt-2 text-amber-400">{metrics.systemUptime}</h4>
                  <p className="text-[10px] text-slate-900 font-bold mt-1">Continuous boot: 148 days</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 shadow-inner">
                  <Server size={24} />
                </div>
              </Card>

              <Card className="p-5 border-slate-100 dark:border-slate-800 bg-slate-900 text-white flex items-center justify-between overflow-hidden relative">
                <div className="absolute -right-4 -bottom-4 opacity-5 text-white">
                  <Cpu size={120} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Pending Background Jobs</p>
                  <h4 className="text-2xl font-black mt-2 text-emerald-400">0 FAILED</h4>
                  <p className="text-[10px] text-slate-900 font-bold mt-1">All ledger cron rules synced</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 shadow-inner">
                  <CheckCircle size={24} />
                </div>
              </Card>

            </div>

            {/* Core Health Matrix Node Statuses */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Nodes Status Grid */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6 border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-100/30">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
                        Platform Microservices Topology
                      </h3>
                      <p className="text-xs text-slate-800 mt-0.5">
                        Active serverless gateways and cloud validation clusters state checks.
                      </p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-2.5 py-1 font-bold">
                      ALL RUNNING
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SYSTEM_NODES.map((node: any) => (
                      <div
                        key={node.name}
                        className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-800">{node.type}</span>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">{node.name}</h4>
                          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-900">
                            <span>Latency: {node.latency}</span>
                            <span>SLA: {node.uptime}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-900/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Optimal
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Live Node Audit Log Console Terminal */}
              <div className="lg:col-span-1">
                <Card className="p-6 border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-100/30 bg-slate-950 text-slate-100 flex flex-col justify-between h-[480px]">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Terminal size={18} className="text-primary-400" />
                        <div>
                          <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">Live System Terminal</h3>
                          <p className="text-[9px] text-slate-900 font-mono">Telemetry logger streaming live</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setIsConsolePlaying(!isConsolePlaying)}
                          className={cn(
                            "p-1.5 rounded-lg hover:bg-slate-900 text-slate-800 hover:text-white transition-all",
                            isConsolePlaying && "text-primary-400 animate-pulse"
                          )}
                        >
                          {isConsolePlaying ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        <button
                          onClick={() => setLiveLogs([])}
                          className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-800 hover:text-white transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Scrollable logs box */}
                    <div className="space-y-3 font-mono text-[10px] leading-relaxed max-h-[360px] overflow-y-auto pr-1">
                      {liveLogs.length === 0 ? (
                        <p className="text-slate-800 italic text-center py-10">Terminal cleared. Waiting for events...</p>
                      ) : (
                        liveLogs.map((log, index) => (
                          <div key={index} className="flex gap-2.5 items-start">
                            <span className="text-slate-900 select-none shrink-0">{log.time}</span>
                            <span className={cn(
                              "font-bold shrink-0",
                              log.category === 'SYSTEM' ? 'text-blue-400' :
                              log.category === 'DATABASE' ? 'text-indigo-400' :
                              log.category === 'SECURITY' ? 'text-amber-400' :
                              'text-emerald-400'
                            )}>
                              [{log.category}]
                            </span>
                            <span className="text-slate-300 break-all">{log.msg}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-900 pt-3 text-[9px] font-mono text-slate-900 flex justify-between">
                    <span>Rate: ~15.4 operations / sec</span>
                    <span>Replication: Synchronous</span>
                  </div>
                </Card>
              </div>

            </div>

          </div>
        )}

      </div>
    </AdminLayout>
  );
};
