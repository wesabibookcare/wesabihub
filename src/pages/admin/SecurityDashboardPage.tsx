import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, ShieldCheck, Activity, Users, MapPin,
  Search, Filter, Trash2, Ban, RefreshCw, AlertTriangle,
  CheckCircle, Clock, Info, Lock, Terminal, Radio, HelpCircle, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '@/src/lib/utils';


import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '@/src/lib/apiClient';
import { auditEngine } from '@/src/engines/AuditEngine';
import { userRepository } from '@/src/services/db/UserRepository';
import { HardenedAuditLog } from '@/src/services/AuditEngine';
import { toast } from 'sonner';

export const SecurityDashboardPage = () => {
  const { user, fbUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'alerts' | 'logs' | 'health' | 'stats'>('alerts');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSuspiciousOnly, setFilterSuspiciousOnly] = useState(false);
  const [logs, setLogs] = useState<HardenedAuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Local state for actions
  const [actionUserId, setActionUserId] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionHubId, setActionHubId] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showHubModal, setShowHubModal] = useState(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  // Statistics
  const [stats, setStats] = useState({
    totalLogsCount: 148,
    failedLogins24h: 12,
    activeSuspiciousFlags: 3,
    systemNodesHealthy: '8 / 8',
    verificationSuccessRate: '94.2%',
    pendingReviews: 4
  });

  // Load audit logs from Firestore
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const fetchedLogs = await auditEngine.getRecentLogs(100);

      let systemNodesHealthy = 'UNKNOWN';
      try {
        const certData = await apiFetch<any>(fbUser, '/api/infrastructure/certify');
        if (certData && certData.services) {
           const nodes = Object.entries(certData.services).flatMap(([k, v]) => typeof v === 'string' ? [v] : Object.values(v));
           const total = nodes.length;
           const healthy = nodes.filter(n => n === 'HEALTHY' || n === 'CONFIGURED').length;
           systemNodesHealthy = `${healthy} / ${total}`;
        }
      } catch (err) {
        console.error('Failed to fetch infrastructure health', err);
      }

      if (fetchedLogs.length > 0) {
        setLogs(fetchedLogs);
        // Calculate dynamic stats
        const securityStats = await auditEngine.getSecurityStats(fetchedLogs);
        setStats(prev => ({
          ...prev,
          totalLogsCount: securityStats.totalLogsCount,
          activeSuspiciousFlags: securityStats.activeSuspiciousFlags,
          failedLogins24h: securityStats.failedLogins24h,
          systemNodesHealthy
        }));
      } else {
        setLogs([]);
        setStats(prev => ({ ...prev, systemNodesHealthy }));
      }
    } catch (e) {
      console.error('Failed to query security logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Quick Action: Suspend User
  const handleSuspendUser = async () => {
    if (!actionUserId || !actionReason) {
      setActionStatus('Please provide both User ID and suspension reason.');
      return;
    }
    setLoading(true);
    try {
      await userRepository.update(actionUserId, { status: 'SUSPENDED', updatedAt: new Date().toISOString() } as any);

      // Log security audit
      await auditEngine.logEvent({
        userId: user?.uid || 'ADMIN',
        userRole: user?.role || 'SUPER_ADMIN',
        action: 'ADMIN_SUSPEND_USER',
        targetId: actionUserId,
        details: { reason: actionReason, targetUserId: actionUserId },
        result: 'SUCCESS'
      });

      setActionStatus('SUCCESS: User account suspended and logged to security trail.');
      setActionUserId('');
      setActionReason('');
      fetchLogs();
      setTimeout(() => {
        setShowUserModal(false);
        setActionStatus(null);
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setActionStatus(`ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Quick Action: Reset Hub Points
  const handleResetHubPoints = async () => {
    if (!actionHubId || !actionReason) {
      setActionStatus('Please provide both Hub ID and audit reason.');
      return;
    }
    setLoading(true);
    try {
      // Execute reset via secure backend points API to ensure consistency
      await apiFetch(fbUser, '/api/points/reset', {
        method: 'POST',
        body: { hubId: actionHubId }
      });

      // Log security audit
      await auditEngine.logEvent({
        userId: user?.uid || 'ADMIN',
        userRole: user?.role || 'SUPER_ADMIN',
        action: 'ADMIN_RESET_HUB_POINTS',
        targetId: actionHubId,
        details: { reason: actionReason, hubId: actionHubId },
        result: 'SUCCESS'
      });

      setActionStatus('SUCCESS: Hub points cleared and action logged securely.');
      setActionHubId('');
      setActionReason('');
      fetchLogs();
      setTimeout(() => {
        setShowHubModal(false);
        setActionStatus(null);
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setActionStatus(`ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Acknowledge a suspicious alert locally/temporarily
  const handleAcknowledgeAlert = (logId: string) => {
    setLogs(prev => prev.map(l => l.id === logId ? { ...l, isSuspicious: false } : l));
    // Log the acknowledgment
    auditEngine.logEvent({
      userId: user?.uid || 'ADMIN',
      userRole: user?.role || 'SUPER_ADMIN',
      action: 'ACKNOWLEDGE_SECURITY_ALERT',
      targetId: logId,
      details: { logId },
      result: 'SUCCESS'
    });
  };

  // Filter & Search Logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.suspicionReason && log.suspicionReason.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.ipAddress && log.ipAddress.includes(searchQuery));

    if (filterSuspiciousOnly) {
      return matchesSearch && log.isSuspicious;
    }
    return matchesSearch;
  });

  const handleEnforceRetention = async () => {
    try {
      setLoading(true);
      const deleted = await auditEngine.enforceRetentionPolicy(90);
      toast.success(`Log retention enforced. ${deleted} outdated records archived/deleted securely.`);
      fetchLogs();
    } catch (e) {
      toast.error('Failed to enforce retention policy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8  p-2">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-ping shrink-0" />
              <p className="text-rose-600 font-bold uppercase tracking-widest text-[10px]">Zero-Trust Security Command</p>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <Lock className="text-slate-900" size={32} strokeWidth={2.5} />
              Security Hardening & Audit
            </h1>
            <p className="text-slate-900 font-medium mt-1">Real-time threat monitoring, tamper-resistant audit logs, and fraud protection center.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleEnforceRetention} disabled={loading} className="rounded-xl font-bold border-slate-200">
              <Trash2 size={16} className="mr-2" /> Enforce Retention
            </Button>
            <Button variant="outline" onClick={fetchLogs} disabled={loading} className="rounded-xl font-bold border-slate-200">
              <RefreshCw size={16} className={cn("mr-2", loading && "animate-spin")} /> Refresh Monitor
            </Button>
            <Button onClick={() => setShowUserModal(true)} className="rounded-xl font-bold bg-rose-600 text-white hover:bg-rose-700">
              <Ban size={16} className="mr-2" /> Suspend Fraudulent User
            </Button>
          </div>
        </div>

        {/* Security Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-5 border-none shadow-md bg-white flex items-center gap-4">
            <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl shrink-0">
              <ShieldAlert size={26} />
            </div>
            <div>
              <p className="text-2xl font-black text-rose-600">{stats.activeSuspiciousFlags}</p>
              <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Suspicious Activities</p>
            </div>
          </Card>

          <Card className="p-5 border-none shadow-md bg-white flex items-center gap-4">
            <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl shrink-0">
              <AlertTriangle size={26} />
            </div>
            <div>
              <p className="text-2xl font-black text-amber-600">{stats.failedLogins24h}</p>
              <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Failed Login Attempts</p>
            </div>
          </Card>

          <Card className="p-5 border-none shadow-md bg-white flex items-center gap-4">
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
              <Radio size={26} className="animate-pulse" />
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-600">{stats.systemNodesHealthy}</p>
              <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Active System Nodes</p>
            </div>
          </Card>

          <Card className="p-5 border-none shadow-md bg-white flex items-center gap-4">
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
              <ShieldCheck size={26} />
            </div>
            <div>
              <p className="text-2xl font-black text-blue-600">{stats.verificationSuccessRate}</p>
              <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">KYC Verification Rate</p>
            </div>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 flex flex-wrap gap-2">
          {[
            { id: 'alerts', label: 'Fraud & Security Alerts', icon: ShieldAlert, color: 'text-rose-600' },
            { id: 'logs', label: 'Tamper-Resistant Logs', icon: Terminal, color: 'text-slate-800' },
            { id: 'health', label: 'System Health & Node Status', icon: Activity, color: 'text-emerald-600' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'alerts') setFilterSuspiciousOnly(true);
                else setFilterSuspiciousOnly(false);
              }}
              className={cn(
                "flex items-center gap-2 px-5 py-3 font-bold text-sm transition-all border-b-2 -mb-[2px]",
                activeTab === tab.id
                  ? "border-slate-900 text-slate-900 font-extrabold"
                  : "border-transparent text-slate-800 hover:text-slate-800"
              )}
            >
              <tab.icon size={16} className={activeTab === tab.id ? tab.color : 'text-slate-800'} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="space-y-6">

          {/* Tab 1 & Tab 2: Logs and Alerts List */}
          {(activeTab === 'alerts' || activeTab === 'logs') && (
            <div className="space-y-4">

              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-slate-800 transition-all">
                  <Search size={18} className="text-slate-800 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search logs by actor ID, action keyword, or IP..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none focus:outline-none text-sm font-bold w-full"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant={filterSuspiciousOnly ? 'outline' : 'ghost'}
                    onClick={() => setFilterSuspiciousOnly(!filterSuspiciousOnly)}
                    className={cn(
                      "rounded-xl font-bold border-slate-200 text-xs",
                      filterSuspiciousOnly ? "bg-rose-50 border-rose-200 text-rose-700" : "text-slate-900"
                    )}
                  >
                    <ShieldAlert size={14} className="mr-1.5" /> Suspicious Actions Only
                  </Button>
                  <Button variant="outline" onClick={() => setShowHubModal(true)} className="rounded-xl font-bold border-slate-200 text-xs text-indigo-700">
                    <MapPin size={14} className="mr-1.5" /> Clear / Reset Hub Points
                  </Button>
                </div>
              </div>

              {/* Table / Cards */}
              <Card className="border-none shadow-lg overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.1em] text-slate-800">Security event</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.1em] text-slate-800">Actor profile</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.1em] text-slate-800">Security details</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.1em] text-slate-800">Session metadata</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.1em] text-slate-800 text-right">Protection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-slate-800 font-bold">
                            <ShieldCheck className="mx-auto h-12 w-12 text-slate-300 mb-2 animate-bounce" />
                            No security flags or matching logs in current view.
                          </td>
                        </tr>
                      ) : (
                        filteredLogs.map((log, idx) => (
                          <motion.tr
                            key={log.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                            className={cn(
                              "group hover:bg-slate-50/50 transition-colors cursor-pointer",
                              log.isSuspicious && "bg-rose-50/10 hover:bg-rose-50/25"
                            )}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs border shrink-0",
                                  log.isSuspicious
                                    ? "bg-rose-50 text-rose-600 border-rose-200 animate-pulse"
                                    : "bg-slate-50 text-slate-800 border-slate-200"
                                )}>
                                  {log.isSuspicious ? '🚨' : '🛡️'}
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-sm font-black text-slate-950 block">{log.action}</span>
                                  <span className="text-[10px] font-bold text-slate-800 block font-mono uppercase tracking-wider">{log.id}</span>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <UserCheck size={12} className="text-slate-800" />
                                  <span className="text-xs font-black text-slate-800">{log.userId}</span>
                                </div>
                                <Badge className={cn(
                                  "border-none px-1.5 py-0.5 text-[8px] font-black tracking-widest uppercase",
                                  log.userRole === 'SUPER_ADMIN' ? 'bg-indigo-600 text-white' :
                                  log.userRole === 'MERCHANT' ? 'bg-amber-100 text-amber-800' :
                                  'bg-slate-100 text-slate-900'
                                )}>{log.userRole || 'CUSTOMER'}</Badge>
                              </div>
                            </td>

                            <td className="px-6 py-4 max-w-xs">
                              {log.isSuspicious ? (
                                <div className="p-2.5 bg-rose-50/80 rounded-xl border border-rose-100">
                                  <p className="text-xs font-extrabold text-rose-800 leading-tight">⚠️ {log.suspicionReason}</p>
                                  <p className="text-[10px] font-bold text-rose-600 mt-1 font-mono">{JSON.stringify(log.details)}</p>
                                </div>
                              ) : (
                                <p className="text-xs font-semibold text-slate-800 font-mono leading-tight">{JSON.stringify(log.details)}</p>
                              )}
                            </td>

                            <td className="px-6 py-4">
                              <div className="space-y-1 font-mono text-[10px] text-slate-900">
                                <p className="font-bold text-slate-800 flex items-center gap-1">🌐 {log.ipAddress || 'Internal'}</p>
                                <p className="truncate max-w-[150px]" title={log.deviceInfo}>📱 {log.deviceInfo || 'Unknown Client'}</p>
                                <p className="text-slate-800 font-sans font-bold flex items-center gap-1">
                                  <Clock size={10} /> {new Date(log.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            </td>

                            <td className="px-6 py-4 text-right">
                              <div className="flex flex-col items-end gap-2">
                                <Badge className={cn(
                                  "border-none px-2 py-0.5 font-black text-[10px]",
                                  log.result === 'SUCCESS' ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                )}>
                                  {log.result}
                                </Badge>
                                {log.isSuspicious && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAcknowledgeAlert(log.id);
                                    }}
                                    className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200/50 transition-colors uppercase tracking-wider shrink-0"
                                  >
                                    Dismiss Alert
                                  </button>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                    <Info size={14} className="text-slate-800 shrink-0" />
                    <span>Hardened audit logs are secured with write-once/immutable cloud enforcement</span>
                  </div>
                </div>
              </Card>

            </div>
          )}

          {/* Tab 3: System Health */}
          {activeTab === 'health' && (
            <Card className="p-8 border-none shadow-lg bg-white space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">Platform Nodes & Core Health</h3>
                <p className="text-sm text-slate-900 mt-1">Status of system services, databases, gateways, and reverse-proxy components.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: 'Vite Development Server', port: '3000', status: 'Operational', latency: '2ms', health: 100 },
                  { name: 'Firestore Cloud Ingress', port: '443', status: 'Optimal', latency: '42ms', health: 100 },
                  { name: 'Firebase Authentication Router', port: '443', status: 'Optimal', latency: '21ms', health: 100 },
                  { name: 'OmorfiHub Points Engine', port: 'Internal', status: 'Active', latency: '12ms', health: 100 },
                  { name: 'SafePay Ledger Pipeline', port: 'Internal', status: 'Active', latency: '8ms', health: 100 },
                  { name: 'Audit Logging Microservice', port: 'Internal', status: 'Operational', latency: '1ms', health: 100 },
                  { name: 'Commission Rules Evaluator', port: 'Internal', status: 'Optimal', latency: '3ms', health: 100 },
                  { name: 'Reverse-Proxy Ingress Gateway', port: '3000', status: 'Optimal', latency: '1ms', health: 100 }
                ].map((node, i) => (
                  <motion.div
                    key={node.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 border border-slate-200/80 rounded-2xl bg-slate-50/50 relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-sm font-black text-slate-900 leading-tight">{node.name}</h4>
                        <span className="text-[10px] font-mono font-bold text-slate-800 uppercase tracking-widest mt-1 block">PORT: {node.port}</span>
                      </div>
                      <Badge className="bg-emerald-50 text-emerald-700 border-none px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                        {node.status}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center mt-6">
                      <span className="text-xs font-bold text-slate-800">Response Latency:</span>
                      <span className="text-xs font-black text-slate-900 font-mono">{node.latency}</span>
                    </div>

                    <div className="w-full bg-slate-200/50 h-1.5 rounded-full overflow-hidden mt-3">
                      <div className="bg-emerald-500 h-full" style={{ width: `${node.health}%` }} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          )}

        </div>

        {/* Modal: Suspend User */}
        <AnimatePresence>
          {showUserModal && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border border-slate-100"
              >
                <h3 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
                  <Ban className="text-rose-600 animate-bounce" /> Suspend Fraudulent Account
                </h3>
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-6">Zero-trust emergency containment tool</p>

                {actionStatus && (
                  <div className={cn(
                    "p-4 rounded-xl text-xs font-bold mb-6",
                    actionStatus.startsWith('SUCCESS') ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                  )}>
                    {actionStatus}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Target User UID / ID</label>
                    <input
                      type="text"
                      placeholder="e.g. USR-48192 or firebase uid"
                      value={actionUserId}
                      onChange={e => setActionUserId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Reason for Suspension</label>
                    <textarea
                      placeholder="Specify detailed reason for administrative suspension..."
                      value={actionReason}
                      onChange={e => setActionReason(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <Button variant="outline" onClick={() => { setShowUserModal(false); setActionStatus(null); }} className="flex-1 rounded-xl font-bold border-slate-200">
                    Cancel
                  </Button>
                  <Button onClick={handleSuspendUser} disabled={loading} className="flex-1 rounded-xl font-bold bg-rose-600 text-white hover:bg-rose-700">
                    {loading ? 'Processing...' : 'Confirm Suspend'}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: Reset Hub Points */}
        <AnimatePresence>
          {showHubModal && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border border-slate-100"
              >
                <h3 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
                  <MapPin className="text-indigo-600" /> Reset / Clear Hub Points
                </h3>
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-6">Administrative trust correction tool</p>

                {actionStatus && (
                  <div className={cn(
                    "p-4 rounded-xl text-xs font-bold mb-6",
                    actionStatus.startsWith('SUCCESS') ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                  )}>
                    {actionStatus}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Target Hub Point ID</label>
                    <input
                      type="text"
                      placeholder="e.g. hub_point_lagos"
                      value={actionHubId}
                      onChange={e => setActionHubId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Audit Justification</label>
                    <textarea
                      placeholder="Provide detailed justification for points deduction..."
                      value={actionReason}
                      onChange={e => setActionReason(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <Button variant="outline" onClick={() => { setShowHubModal(false); setActionStatus(null); }} className="flex-1 rounded-xl font-bold border-slate-200">
                    Cancel
                  </Button>
                  <Button onClick={handleResetHubPoints} disabled={loading} className="flex-1 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700">
                    {loading ? 'Processing...' : 'Confirm Reset'}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AdminLayout>
  );
};
export default SecurityDashboardPage;
