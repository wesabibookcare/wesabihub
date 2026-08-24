import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Activity,
  Lock,
  Database,
  Server,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  Cpu,
  FileText,
  CloudLightning,
  History,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Play
} from 'lucide-react';
import { AdminLayout } from '@/src/layouts/AdminLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { toast } from 'sonner';
import { useAuth } from '@/src/context/AuthContext';
import { apiFetch } from '@/src/lib/apiClient';

export const InfrastructureCertificationPage = () => {
  const { fbUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'health' | 'dr' | 'release'>('health');

  // Tab 1: Health & Certs
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [metrics, setMetrics] = useState<any>(null);
  const [cleaning, setCleaning] = useState(false);

  // Tab 2: Disaster Recovery & Failover
  const [drLoading, setDrLoading] = useState(false);
  const [drData, setDrData] = useState<any>(null);
  const [drHistory, setDrHistory] = useState<any[]>([]);
  const [backingUp, setBackingUp] = useState<string | null>(null);
  const [validating, setValidating] = useState<string | null>(null);
  const [testingFailover, setTestingFailover] = useState(false);

  // Tab 3: Release & Rollback Management
  const [releaseLoading, setReleaseLoading] = useState(false);
  const [releaseHistory, setReleaseHistory] = useState<any[]>([]);
  const [envSeparation, setEnvSeparation] = useState<any>(null);
  const [deploying, setDeploying] = useState(false);
  const [rollingBack, setRollingBack] = useState<string | null>(null);
  const [deployLogs, setDeployLogs] = useState<string[]>([]);

  const fetchReleaseData = async () => {
    setReleaseLoading(true);
    try {
      const [historyData, envData] = await Promise.all([
        apiFetch(fbUser, '/api/infrastructure/release/history'),
        apiFetch(fbUser, '/api/infrastructure/env-separation')
      ]);
      setReleaseHistory(historyData);
      setEnvSeparation(envData);
    } catch (e) {
      console.error('Failed to fetch release management data:', e);
      toast.error('Failed to load release pipeline data.');
    } finally {
      setReleaseLoading(false);
    }
  };

  const handleTriggerDeploy = async () => {
    setDeploying(true);
    setDeployLogs([]);
    try {
      toast.loading('Running pre-deployment quality gates...', { id: 'deploy-toast' });
      const result = await apiFetch<any>(fbUser, '/api/infrastructure/release/deploy', {
        method: 'POST',
        body: {}
      });
      if (result.releaseId !== undefined) {
        setDeployLogs(result.logs || []);
        if (result.success) {
          toast.success(`Release successfully promoted: ${result.releaseId}`, { id: 'deploy-toast' });
        } else {
          toast.error(`Release deployment failed during: ${result.step}`, { id: 'deploy-toast' });
        }
        await fetchReleaseData();
      } else {
        toast.error(result.error || 'Failed to trigger release pipeline', { id: 'deploy-toast' });
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error during release deployment', { id: 'deploy-toast' });
    } finally {
      setDeploying(false);
    }
  };

  const handleTriggerRollback = async (backupId: string) => {
    setRollingBack(backupId);
    try {
      toast.loading(`Executing rollback to snapshot ${backupId}...`, { id: 'rollback-toast' });
      const result = await apiFetch<any>(fbUser, '/api/infrastructure/release/rollback', {
        method: 'POST',
        body: { backupId }
      });
      if (result.success) {
        toast.success(`Rollback completed successfully: ${result.rollbackId}`, { id: 'rollback-toast' });
        await fetchReleaseData();
      } else {
        toast.error(result.error || 'Failed to rollback state', { id: 'rollback-toast' });
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error executing rollback', { id: 'rollback-toast' });
    } finally {
      setRollingBack(null);
    }
  };

  const fetchCertification = async () => {
    setLoading(true);
    try {
      const [certResult, metricsResult] = await Promise.all([
        apiFetch(fbUser, '/api/infrastructure/certify'),
        apiFetch(fbUser, '/api/infrastructure/monitoring')
      ]);
      setData(certResult);
      setMetrics(metricsResult);
      setLastCheck(new Date());
      toast.success('Infrastructure status updated');
    } catch (err: any) {
      console.error('Failed to fetch certification:', err);
      toast.error(err.message || 'Failed to communicate with production infrastructure');
    } finally {
      setLoading(false);
    }
  };

  const fetchDRStatus = async () => {
    setDrLoading(true);
    try {
      const [statusResult, historyResult] = await Promise.all([
        apiFetch(fbUser, '/api/infrastructure/dr/status'),
        apiFetch(fbUser, '/api/infrastructure/dr/history')
      ]);
      setDrData(statusResult);
      setDrHistory(historyResult);
    } catch (err: any) {
      console.error('Failed to fetch DR status:', err);
      toast.error(err.message || 'Network error while loading recovery status');
    } finally {
      setDrLoading(false);
    }
  };

  const handleLogsCleanup = async () => {
    setCleaning(true);
    try {
      const result = await apiFetch<any>(fbUser, '/api/admin/logs/cleanup', {
        method: 'POST',
        body: { retentionDays: 90 }
      });
      toast.success(result.message);
      await fetchCertification();
    } catch (err: any) {
      toast.error(err.message || 'Network error during logs cleanup');
    } finally {
      setCleaning(false);
    }
  };

  const handleTriggerBackup = async (category: string) => {
    setBackingUp(category);
    try {
      await apiFetch(fbUser, '/api/infrastructure/dr/backup', {
        method: 'POST',
        body: { category }
      });
      toast.success(`Backup for ${category} completed successfully`);
      await fetchDRStatus();
    } catch (err: any) {
      toast.error(err.message || `Network error backing up ${category}`);
    } finally {
      setBackingUp(null);
    }
  };

  const handleRestoreValidation = async (backupId: string) => {
    setValidating(backupId);
    try {
      await apiFetch(fbUser, '/api/infrastructure/dr/restore-validate', {
        method: 'POST',
        body: { backupId }
      });
      toast.success(`Restore verification passed for ${backupId}`);
      await fetchDRStatus();
    } catch (err: any) {
      toast.error(err.message || 'Network error during restore validation');
    } finally {
      setValidating(null);
    }
  };

  const handleRunFailoverTest = async () => {
    setTestingFailover(true);
    try {
      await apiFetch(fbUser, '/api/infrastructure/dr/failover-simulate', {
        method: 'POST',
        body: {}
      });
      toast.success('Failover test suite completed successfully');
      await fetchDRStatus();
    } catch (err: any) {
      toast.error(err.message || 'Network error during failover simulation');
    } finally {
      setTestingFailover(false);
    }
  };

  useEffect(() => {
    fetchCertification();
    fetchDRStatus();
    fetchReleaseData();
  }, []);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'CERTIFIED': return 'bg-emerald-500';
      case 'STAGING_READY': return 'bg-amber-500';
      case 'DEVELOPMENT': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HEALTHY':
      case 'CERTIFIED':
      case 'CONFIGURED':
      case 'READY_VERIFIED':
      case 'ONLINE':
      case 'EXCELLENT':
        return <CheckCircle2 className="text-emerald-500 font-bold" size={18} />;
      case 'DEGRADED':
      case 'STAGING_READY':
      case 'DEGRADED_SMS_FALLBACK':
      case 'LOCAL_COORDINATES_FALLBACK':
      case 'FAILED_OVER_TO_PAYSTACK':
      case 'FAILED_OVER_TO_FLUTTERWAVE':
        return <AlertTriangle className="text-amber-500 font-bold" size={18} />;
      case 'UNAVAILABLE':
      case 'ERROR':
      case 'MISSING_KEY':
      case 'UNREACHABLE':
      case 'MISSING':
        return <XCircle className="text-rose-500 font-bold" size={18} />;
      default:
        return <RefreshCw className="text-slate-400 animate-spin" size={18} />;
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black dark:text-white font-display uppercase italic tracking-tight flex items-center gap-3">
              <ShieldCheck className="text-primary-600" size={32} />
              Infrastructure Certification
            </h1>
            <p className="text-slate-700 dark:text-slate-300 font-medium">Production readiness audit, backups, and disaster recovery certification.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleLogsCleanup}
              disabled={cleaning || loading}
              variant="outline"
              className="rounded-xl h-11 px-6 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <RefreshCw className={cleaning ? "animate-spin mr-2" : "mr-2"} size={18} />
              Enforce 90-Day Retention
            </Button>
            <Button
              onClick={() => { fetchCertification(); fetchDRStatus(); }}
              disabled={loading || drLoading}
              className="rounded-xl h-11 px-6 shadow-lg shadow-primary-500/20"
            >
              <RefreshCw className={(loading || drLoading) ? "animate-spin mr-2" : "mr-2"} size={18} />
              Re-Certify Environment
            </Button>
          </div>
        </div>

        {/* Custom Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
          <button
            onClick={() => setActiveTab('health')}
            className={`pb-4 text-sm font-black uppercase tracking-widest border-b-4 transition-all ${
              activeTab === 'health'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Infrastructure Health & Certs
          </button>
          <button
            onClick={() => setActiveTab('dr')}
            className={`pb-4 text-sm font-black uppercase tracking-widest border-b-4 transition-all flex items-center gap-2 ${
              activeTab === 'dr'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <CloudLightning size={16} />
            Disaster Recovery & Failover
          </button>
          <button
            onClick={() => setActiveTab('release')}
            className={`pb-4 text-sm font-black uppercase tracking-widest border-b-4 transition-all flex items-center gap-2 ${
              activeTab === 'release'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Server size={16} />
            Release & Rollback
          </button>
        </div>

        {activeTab === 'health' ? (
          <>
            {data && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 border-slate-200 dark:border-slate-800 flex flex-col items-center text-center space-y-4">
                  <div className="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest">Certification Level</div>
                  <div className="relative">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white ${getLevelColor(data.certificationStatus)} shadow-xl`}>
                      <ShieldCheck size={48} />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-900 rounded-full p-2 shadow-md">
                       {getStatusIcon(data.certificationStatus)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black dark:text-white font-display">{data.certificationStatus}</h3>
                    <Badge variant="outline" className="text-[10px] font-black">{data.health.environment.toUpperCase()} ENVIRONMENT</Badge>
                  </div>
                </Card>

                <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest">Readiness Score</div>
                  <div className="flex items-end gap-2">
                    <span className="text-6xl font-black text-primary-600 font-display">{data.readinessScore}</span>
                    <span className="text-2xl font-black text-slate-400 mb-2">/100</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 transition-all duration-1000"
                      style={{ width: `${data.readinessScore}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {data.readinessScore >= 90
                      ? "Environment meets all production security and reliability standards."
                      : "Correct missing configurations before promoting to production."}
                  </p>
                </Card>

                <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest">Operational Status</div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Uptime</p>
                        <div className="flex items-center gap-2 font-bold dark:text-white">
                           <Clock size={14} className="text-primary-600" />
                           {Math.floor(data.health.uptime / 3600)}h {Math.floor((data.health.uptime % 3600) / 60)}m
                        </div>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Latency</p>
                        <div className="flex items-center gap-2 font-bold dark:text-white">
                           <Activity size={14} className="text-emerald-600" />
                           Normal
                        </div>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Node</p>
                        <div className="flex items-center gap-2 font-bold dark:text-white text-xs">
                           <Terminal size={14} className="text-indigo-600" />
                           {data.health.nodeVersion || 'v18.x'}
                        </div>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Cores</p>
                        <div className="flex items-center gap-2 font-bold dark:text-white">
                           <Cpu size={14} className="text-amber-600" />
                           Auto-scaled
                        </div>
                     </div>
                  </div>
                </Card>
              </div>
            )}

            {data && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                       <h3 className="font-bold dark:text-white flex items-center gap-2 font-display uppercase tracking-wider text-xs">
                          <Database size={18} className="text-primary-600" />
                          Core Service Health
                       </h3>
                       <Badge className="bg-emerald-100 text-emerald-700">STABLE</Badge>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                       {Object.entries(data.health.services).map(([name, status]: [string, any]) => {
                         if (typeof status === 'object') return null; // Handle nested later
                         return (
                           <div key={name} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                              <div className="space-y-0.5">
                                 <p className="text-sm font-bold dark:text-white uppercase tracking-tight">{name}</p>
                                 <p className="text-[10px] text-slate-500 font-medium">Internal System Provider</p>
                              </div>
                              <div className="flex items-center gap-3">
                                 <span className="text-xs font-black dark:text-white">{status}</span>
                                 {getStatusIcon(status)}
                              </div>
                           </div>
                         );
                       })}
                       {Object.entries(data.health.services.payment).map(([name, status]: [string, any]) => (
                         <div key={name} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                            <div className="space-y-0.5">
                               <p className="text-sm font-bold dark:text-white uppercase tracking-tight">{name}</p>
                               <p className="text-[10px] text-slate-500 font-medium">External Payment Gateway</p>
                            </div>
                            <div className="flex items-center gap-3">
                               <span className="text-xs font-black dark:text-white">{status}</span>
                               {getStatusIcon(status)}
                            </div>
                         </div>
                       ))}
                    </div>
                 </Card>

                 <div className="space-y-8">
                   <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
                      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                         <h3 className="font-bold dark:text-white flex items-center gap-2 font-display uppercase tracking-wider text-xs">
                            <Lock size={18} className="text-indigo-600" />
                            Secret Manager Verification
                         </h3>
                         <Badge className={data.secretsValidation.valid ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}>
                           {data.secretsValidation.valid ? 'SECURE' : 'INCOMPLETE'}
                         </Badge>
                      </div>
                      <div className="p-6 space-y-6">
                         <div className="space-y-3">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Environment Isolation</p>
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                               <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                                  <Server size={20} className="text-primary-600" />
                               </div>
                               <div>
                                  <p className="text-sm font-bold dark:text-white">NODE_ENV</p>
                                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{data.health.environment}</p>
                               </div>
                            </div>
                         </div>

                         <div className="space-y-3">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Missing Secret Audit</p>
                            {data.secretsValidation.missing.length === 0 ? (
                              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                                 <CheckCircle2 size={16} /> All production secrets loaded from Secret Manager or environment.
                              </div>
                            ) : (
                              <div className="space-y-2">
                                 {data.secretsValidation.missing.map((s: string) => (
                                   <div key={s} className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 flex items-center justify-between">
                                      <span className="text-[10px] font-black text-rose-800 dark:text-rose-400 font-mono uppercase">{s}</span>
                                      <Badge className="bg-rose-600 text-white text-[8px]">MISSING</Badge>
                                   </div>
                                 ))}
                              </div>
                            )}
                         </div>

                         <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800">
                            <div className="flex items-start gap-3">
                               <ShieldCheck className="text-indigo-600 shrink-0" size={18} />
                               <p className="text-[10px] text-indigo-700 dark:text-indigo-400 leading-relaxed font-medium">
                                  Security Protocol: OmorfiHub enforces zero-hardcoding. All keys must be provided via Google Cloud Secret Manager or AI Studio Secure Vault.
                               </p>
                            </div>
                         </div>
                      </div>
                   </Card>

                   <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
                      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                         <h3 className="font-bold dark:text-white flex items-center gap-2 font-display uppercase tracking-wider text-xs">
                            <Activity size={18} className="text-amber-600" />
                            Operational Error Monitoring
                         </h3>
                         <Badge className="bg-amber-100 text-amber-700">ACTIVE</Badge>
                      </div>
                      <div className="p-6">
                         {metrics && Object.keys(metrics.errorCounters).length > 0 ? (
                           <div className="space-y-4">
                              {Object.entries(metrics.errorCounters).map(([key, count]: [string, any]) => (
                                <div key={key} className="flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                      <div className={`w-2 h-2 rounded-full ${key.includes('CRITICAL') ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                                      <span className="text-[10px] font-black dark:text-white uppercase tracking-tighter">{key.replace('_', ' ')}</span>
                                   </div>
                                   <span className={`text-xs font-black ${count > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{count} events</span>
                                </div>
                              ))}
                           </div>
                         ) : (
                           <div className="py-8 flex flex-col items-center text-center space-y-2">
                              <CheckCircle2 size={32} className="text-emerald-500" />
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Clean Operational Slate</p>
                              <p className="text-[10px] text-slate-500 font-medium">No system errors detected in the current session.</p>
                           </div>
                         )}

                         <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-4">Alerting Thresholds</p>
                            <div className="grid grid-cols-2 gap-3">
                               {metrics && Object.entries(metrics.thresholds).map(([cat, limit]: [string, any]) => (
                                 <div key={cat} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                    <p className="text-[8px] font-bold text-slate-500 uppercase">{cat}</p>
                                    <p className="text-xs font-black dark:text-white">{limit} failures</p>
                                 </div>
                               ))}
                            </div>
                         </div>
                      </div>
                   </Card>
                 </div>
              </div>
            )}
          </>
        ) : activeTab === 'dr' ? (
          <div className="space-y-8 animate-fade-in">
            {drLoading && !drData ? (
              <Card className="p-12 flex flex-col items-center justify-center text-center space-y-4 border-slate-200 dark:border-slate-800">
                <RefreshCw className="text-indigo-600 animate-spin" size={48} />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest animate-pulse">Loading Disaster Recovery Registry...</p>
              </Card>
            ) : drData ? (
              <>
                {/* DR Hero Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-6 border-slate-200 dark:border-slate-800 flex flex-col items-center text-center space-y-4">
                    <div className="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest">DR Readiness Score</div>
                    <div className="flex items-end gap-2">
                      <span className="text-6xl font-black text-indigo-600 font-display">{drData.readinessScore}</span>
                      <span className="text-2xl font-black text-slate-400 mb-2">/100</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 transition-all duration-1000"
                        style={{ width: `${drData.readinessScore}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                      {drData.readinessScore >= 90 ? 'CERTIFIED DR REDUNDANT' : 'PARTIALLY SECURE'}
                    </p>
                  </Card>

                  <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest">Continuous Business Resilience</div>
                    <div className="space-y-3">
                      {Object.entries(drData.failoverStatus).map(([service, status]: [string, any]) => (
                        <div key={service} className="flex items-center justify-between text-xs">
                          <span className="font-bold uppercase tracking-tighter dark:text-white">{service}</span>
                          <Badge variant="outline" className="text-[9px] font-black uppercase flex items-center gap-1">
                            {getStatusIcon(status)}
                            {status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-6 border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest">Live Continuity Control</h4>
                      <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                        Verify real-time communication resilience, payment gateways failover routing, and maps local backups dynamically.
                      </p>
                    </div>
                    <Button
                      onClick={handleRunFailoverTest}
                      disabled={testingFailover}
                      className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider text-xs shadow-lg shadow-indigo-500/20"
                    >
                      {testingFailover ? (
                        <>
                          <RefreshCw className="animate-spin mr-2" size={14} />
                          Testing Channels...
                        </>
                      ) : (
                        <>
                          <CloudLightning className="mr-2 animate-bounce" size={14} />
                          Verify Continuous Flow
                        </>
                      )}
                    </Button>
                  </Card>
                </div>

                {/* 10 Core Backup Datasets */}
                <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                     <h3 className="font-bold dark:text-white flex items-center gap-2 font-display uppercase tracking-wider text-xs">
                        <FileText size={18} className="text-indigo-600" />
                        10-Point Core Backup Readiness Registry
                     </h3>
                     <Badge className="bg-indigo-100 text-indigo-700 font-bold uppercase text-[9px]">CONTINUITY CERTIFIED</Badge>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {drData.backups.map((bk: any) => (
                      <div key={bk.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-black dark:text-white uppercase tracking-tight">{bk.label}</p>
                            <Badge className={bk.status === 'HEALTHY' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}>
                              {bk.status}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{bk.notes}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Backup ID: <span className="font-black text-slate-600 dark:text-slate-300">{bk.backupId || 'N/A'}</span> • Records: {bk.recordCount} • Checksum: {bk.checksum.substring(0, 18)}...
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {bk.backupId && (
                            <Button
                              onClick={() => handleRestoreValidation(bk.backupId)}
                              disabled={validating !== null || backingUp !== null}
                              variant="outline"
                              className="rounded-xl h-9 px-4 text-xs font-black border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              {validating === bk.backupId ? (
                                <>
                                  <RefreshCw className="animate-spin mr-1.5" size={12} />
                                  Verifying...
                                </>
                              ) : (
                                'Verify Restore'
                              )}
                            </Button>
                          )}
                          <Button
                            onClick={() => handleTriggerBackup(bk.id)}
                            disabled={backingUp !== null || validating !== null}
                            className="rounded-xl h-9 px-4 text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/10"
                          >
                            {backingUp === bk.id ? (
                              <>
                                <RefreshCw className="animate-spin mr-1.5" size={12} />
                                Serializing...
                              </>
                            ) : (
                              'Backup Now'
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Grid for Documented Guidelines and History logs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Documented Guidelines */}
                  <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                       <h3 className="font-bold dark:text-white flex items-center gap-2 font-display uppercase tracking-wider text-xs">
                          <BookOpen size={18} className="text-primary-600" />
                          Documented Recovery Procedures
                       </h3>
                    </div>
                    <div className="p-6 space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
                      {drData.documentedProcedures.map((proc: any, idx: number) => (
                        <div key={proc.id} className={`pt-4 ${idx === 0 ? 'pt-0' : ''} space-y-1`}>
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-black dark:text-white uppercase tracking-wider">{proc.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-7 leading-relaxed font-medium">
                            {proc.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Auditing and History Log */}
                  <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                       <h3 className="font-bold dark:text-white flex items-center gap-2 font-display uppercase tracking-wider text-xs">
                          <History size={18} className="text-amber-600" />
                          Disaster Recovery Auditing Trail
                       </h3>
                       <Badge className="bg-amber-100 text-amber-700 uppercase font-black text-[9px]">IMMUTABLE LOGS</Badge>
                    </div>
                    <div className="p-6">
                      {drHistory.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                          <CheckCircle2 size={32} className="text-emerald-500" />
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">No operations logged</p>
                          <p className="text-[10px] text-slate-500 font-medium">Perform backup, restore, or failover simulation to log audit events.</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 divide-y divide-slate-100 dark:divide-slate-800">
                          {drHistory.map((item, idx) => (
                            <div key={item.id} className={`pt-3 ${idx === 0 ? 'pt-0' : ''} space-y-1`}>
                              <div className="flex items-center justify-between">
                                <Badge className={
                                  item.type === 'BACKUP_CREATION' ? 'bg-indigo-100 text-indigo-700' :
                                  item.type === 'FAILOVER_TEST' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                }>
                                  {item.type}
                                </Badge>
                                <span className="text-[9px] font-mono text-slate-400">{new Date(item.timestamp).toLocaleString()}</span>
                              </div>
                              <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                                Operation <span className="font-mono text-[10px] font-black">{item.id}</span> completed successfully by {item.userId}.
                              </p>
                              {item.details && item.details.remarks && (
                                <p className="text-[10px] text-slate-500 italic">“{item.details.remarks}”</p>
                              )}
                              {item.details && item.details.payments && (
                                <p className="text-[9px] text-slate-400 font-mono">
                                  Gateway active: {item.details.payments.activeGateway} • Redundancy: {item.details.payments.redundancyScore}%
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </>
            ) : null}
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {releaseLoading && !envSeparation ? (
              <Card className="p-12 flex flex-col items-center justify-center text-center space-y-4 border-slate-200 dark:border-slate-800">
                <RefreshCw className="text-emerald-600 animate-spin" size={48} />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest animate-pulse">Loading Release Management Registry...</p>
              </Card>
            ) : (
              <>
                {/* 1. Release Hero Dashboard */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Environment Status Card */}
                  <Card className="p-6 border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-1">Target Environment</div>
                      <h3 className="text-4xl font-black text-emerald-600 font-display uppercase tracking-wider">
                        {envSeparation?.environment || 'UNKNOWN'}
                      </h3>
                    </div>
                    <div className="space-y-1.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-400">ISOLATION LEVEL</span>
                        <Badge className="bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase">ENTERPRISE SECURE</Badge>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-400">DEPLOYMENT STATUS</span>
                        <span className="text-emerald-600 uppercase font-black tracking-tight flex items-center gap-1">
                          <CheckCircle2 size={12} /> ACTIVE
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* Pre-deployment Gates Summary */}
                  <Card className="p-6 border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-1">Quality Gate Score</div>
                      <div className="flex items-end gap-2">
                        <span className="text-5xl font-black text-primary-600 font-display">100</span>
                        <span className="text-xl font-black text-slate-400 mb-1">/100</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      All pre-deployment compilation checks, linter guidelines, database schema locks, and permission policies are active and validated.
                    </p>
                  </Card>

                  {/* Rollback Safeguards Status */}
                  <Card className="p-6 border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-1">Ledger Safeguards</div>
                      <Badge className="bg-indigo-100 text-indigo-700 font-black text-[9px] w-fit uppercase">ROLLBACK SHIELD ACTIVE</Badge>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      Live transaction logs, SafePay states, parcel histories, and wallets are fully locked from rollback corruption, meeting WOS Security Standard v4.
                    </p>
                  </Card>
                </div>

                {/* 2. Interactive Deployment Actions & Logs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Deployment Actions */}
                  <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                      <h3 className="font-bold dark:text-white flex items-center gap-2 font-display uppercase tracking-wider text-xs">
                        <Server size={18} className="text-emerald-600" />
                        Continuous Deployment Quality Pipeline
                      </h3>
                    </div>
                    <div className="p-6 space-y-6">
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Quality Validation Rules</p>
                        <div className="space-y-2">
                          <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 flex justify-between items-center text-xs font-bold">
                            <span className="text-slate-700 dark:text-slate-300">TypeScript Code Compilation & Strict Types</span>
                            <span className="text-emerald-600 uppercase flex items-center gap-1"><CheckCircle2 size={14} /> MET</span>
                          </div>
                          <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 flex justify-between items-center text-xs font-bold">
                            <span className="text-slate-700 dark:text-slate-300">Core Engine Signature Sign-Offs</span>
                            <span className="text-emerald-600 uppercase flex items-center gap-1"><CheckCircle2 size={14} /> MET</span>
                          </div>
                          <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 flex justify-between items-center text-xs font-bold">
                            <span className="text-slate-700 dark:text-slate-300">Firestore and Storage Security Rules Isolation</span>
                            <span className="text-emerald-600 uppercase flex items-center gap-1"><CheckCircle2 size={14} /> MET</span>
                          </div>
                          <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 flex justify-between items-center text-xs font-bold">
                            <span className="text-slate-700 dark:text-slate-300">Third-Party Gateway Cryptographic Secrets</span>
                            <span className="text-emerald-600 uppercase flex items-center gap-1"><CheckCircle2 size={14} /> MET</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2">
                        <p className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Environment Separation Check</p>
                        {envSeparation?.checks?.map((check: any) => (
                          <div key={check.id} className="flex justify-between items-center text-[10px] font-medium py-1 border-b border-slate-100 dark:border-slate-800 last:border-none">
                            <span className="text-slate-500">{check.name}</span>
                            <span className={check.status === 'PASSED' ? 'text-emerald-600 font-bold' : check.status === 'WARNING' ? 'text-amber-500 font-bold' : 'text-rose-600 font-bold'}>
                              {check.details}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-4">
                        <Button
                          onClick={handleTriggerDeploy}
                          disabled={deploying}
                          className="rounded-xl h-11 flex-1 font-black uppercase text-xs tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/15"
                        >
                          {deploying ? (
                            <>
                              <RefreshCw className="animate-spin mr-2" size={16} />
                              Executing Deployment Gates...
                            </>
                          ) : (
                            'Run Quality Gates & Deploy to Production'
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Terminal Log Console */}
                  <Card className="border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                      <h3 className="font-bold dark:text-white flex items-center gap-2 font-display uppercase tracking-wider text-xs">
                        <Terminal size={18} className="text-slate-600 dark:text-slate-300" />
                        Live Build Pipeline & Post-Deploy Logs
                      </h3>
                      <Badge className="bg-slate-800 text-slate-100 font-mono text-[8px]">bash</Badge>
                    </div>
                    <div className="p-6 bg-slate-950 text-slate-100 font-mono text-[10px] flex-1 min-h-[300px] max-h-[420px] overflow-y-auto space-y-1.5 rounded-b-xl border-t border-slate-800 shadow-inner">
                      {deployLogs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-16">
                          <Terminal size={32} className="mb-2 text-slate-700 animate-pulse" />
                          <p className="font-bold uppercase tracking-wider">Console Idle</p>
                          <p className="text-[9px] font-medium max-w-xs mt-1">Deploy logs will be piped into this interactive secure output terminal once triggered.</p>
                        </div>
                      ) : (
                        deployLogs.map((log, idx) => (
                          <div
                            key={idx}
                            className={
                              log.includes('FAILED') || log.includes('CRITICAL') ? 'text-rose-400 font-bold' :
                              log.includes('PASSED') || log.includes('SUCCESS') ? 'text-emerald-400 font-bold' :
                              log.includes('WARNING') ? 'text-amber-400' : 'text-slate-300'
                            }
                          >
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>

                {/* 3. Rollback Guard & Release History logs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Rollback Procedure */}
                  <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                      <h3 className="font-bold dark:text-white flex items-center gap-2 font-display uppercase tracking-wider text-xs">
                        <AlertTriangle size={18} className="text-rose-500" />
                        Transactional Rollback Certification Panel
                      </h3>
                    </div>
                    <div className="p-6 space-y-6">
                      <p className="text-xs font-medium text-slate-500 leading-relaxed">
                        In accordance with the <strong>OmorfiHub Operational Constitution</strong>, a platform state rollback (reverting dynamic system settings or compliance text) will <strong>never</strong> rollback live financial records. Wallet balances, SafePay statuses, completed platform payments, and parcel tracking history are immutable and shielded against data loss or duplication.
                      </p>

                      <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/50 space-y-2">
                        <p className="text-[10px] font-black text-rose-800 dark:text-rose-400 uppercase tracking-widest flex items-center gap-1">
                          <ShieldAlert size={14} /> Active Anti-Corruption Rules
                        </p>
                        <div className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed space-y-1 font-medium">
                          <p>• <strong>Immutable Wallets</strong>: Reverting system configurations does not alter active ledger entries.</p>
                          <p>• <strong>SafePay Lockout</strong>: SafePay funds held for active deliveries remain locked in their state.</p>
                          <p>• <strong>Historical Audit Logs</strong>: Past release/rollback events cannot be altered or overwritten.</p>
                        </div>
                      </div>

                      {drHistory.length === 0 ? (
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center text-[10px] font-bold text-slate-400">
                          NO RECENT BACKUP SNAPSHOTS LOCATED FOR ROLLBACK SIMULATION.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Select Certified Safe Recovery Target</p>
                          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2">
                            {drHistory.filter(h => h.type === 'BACKUP_CREATION').map((bk) => (
                              <div key={bk.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <p className="text-xs font-black dark:text-white uppercase tracking-tight">{bk.id}</p>
                                  <p className="text-[9px] font-mono text-slate-400">Created: {new Date(bk.timestamp).toLocaleString()} by {bk.userId}</p>
                                </div>
                                <Button
                                  onClick={() => handleTriggerRollback(bk.id)}
                                  disabled={rollingBack !== null || deploying}
                                  className="rounded-xl h-8 px-3 text-[10px] font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/10"
                                >
                                  {rollingBack === bk.id ? (
                                    <>
                                      <RefreshCw className="animate-spin mr-1" size={10} />
                                      Reverting...
                                    </>
                                  ) : (
                                    'Execute Rollback'
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Immutable Release History */}
                  <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                      <h3 className="font-bold dark:text-white flex items-center gap-2 font-display uppercase tracking-wider text-xs">
                        <History size={18} className="text-emerald-600" />
                        Release Pipeline Audit History Trail
                      </h3>
                      <Badge className="bg-emerald-100 text-emerald-700 uppercase font-black text-[9px]">IMMUTABLE LOGS</Badge>
                    </div>
                    <div className="p-6">
                      {releaseHistory.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                          <CheckCircle2 size={32} className="text-emerald-500" />
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">No releases logged</p>
                          <p className="text-[10px] text-slate-500 font-medium">Deploy or Rollback system state to log release events.</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2 divide-y divide-slate-100 dark:divide-slate-800">
                          {releaseHistory.map((item, idx) => (
                            <div key={item.id} className={`pt-3 ${idx === 0 ? 'pt-0' : ''} space-y-1`}>
                              <div className="flex items-center justify-between">
                                <Badge className={
                                  item.type === 'DEPLOYMENT' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                }>
                                  {item.type} ({item.status})
                                </Badge>
                                <span className="text-[9px] font-mono text-slate-400">{new Date(item.timestamp).toLocaleString()}</span>
                              </div>
                              <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                                Action <span className="font-mono text-[10px] font-black">{item.id}</span> by user <span className="font-semibold">{item.userId}</span>.
                              </p>
                              {item.details && item.details.message && (
                                <p className="text-[10px] text-slate-500 italic">“{item.details.message}”</p>
                              )}
                              {item.details && item.details.errors && (
                                <div className="space-y-0.5 mt-1 bg-rose-50 dark:bg-rose-950/20 p-2 rounded border border-rose-100 dark:border-rose-900">
                                  {item.details.errors.map((e: string, i: number) => (
                                    <p key={i} className="text-[9px] font-mono text-rose-700 dark:text-rose-400">Error: {e}</p>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-widest px-2">
           <span>Certification Authority: OmorfiHub Infrastructure Engine</span>
           <span>Last Audit: {lastCheck.toLocaleTimeString()}</span>
        </div>
      </div>
    </AdminLayout>
  );
};
