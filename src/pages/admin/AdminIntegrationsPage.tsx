import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { AdminLayout } from '../../layouts/AdminLayout';
import { auditEngine } from '../../services/AuditEngine';
import { useAuth } from '../../context/AuthContext';
import { ApiApplication, LogisticsProviderAdapter } from '../../types';
import { providerAdapterSystem } from '@/src/services/ProviderAdapterSystem';
import { toast } from 'sonner';
import {
  Terminal,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Key,
  Globe,
  Activity,
  Layers,
  Search,
  Lock,
  Edit2,
  Trash2,
  Save,
  Clock,
  Server
} from 'lucide-react';

export const AdminIntegrationsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'apps' | 'providers' | 'logs'>('apps');
  const [loading, setLoading] = useState(true);

  // Applications State
  const [applications, setApplications] = useState<ApiApplication[]>([]);
  const [appSearch, setAppSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<ApiApplication | null>(null);

  // Provider Adapters State
  const [adapters, setAdapters] = useState<LogisticsProviderAdapter[]>([]);
  const [showAdapterModal, setShowAdapterModal] = useState(false);
  const [providerForm, setProviderForm] = useState({
    providerName: '',
    model: 'MODEL_B' as 'MODEL_A' | 'MODEL_B',
    apiEndpointUrl: '',
    webhookUrl: '',
    apiKey: '',
    webhookSecret: '',
    statusMappingsText: JSON.stringify({
      "DELIVERY_COMPLETE": "DELIVERED",
      "SUCCESSFUL_DELIVERY": "DELIVERED",
      "EN_ROUTE": "IN_TRANSIT",
      "ARRIVED_HUB": "ARRIVED_AT_DESTINATION",
      "OUT_FOR_DELIVERY": "READY_FOR_PICKUP"
    }, null, 2)
  });

  // Logs State
  const [apiLogs, setApiLogs] = useState<any[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Applications
      const appRes = await fetch('/api/v1/developer/applications').catch(() => null);
      if (appRes && appRes.ok) {
        const data = await appRes.json();
        if (data.applications) setApplications(data.applications);
      }

      // Fetch Provider Adapters directly from repository system
      const activeAdapters = await providerAdapterSystem.configureAdapter('SampleProvider', 'MODEL_B', {
        apiEndpointUrl: 'https://api.samplelogistics.com/v1',
        isActive: true
      });
      setAdapters([activeAdapters]);

      // Mock or fetch initial logs
      setApiLogs([
        { id: '1', endpoint: '/api/v1/shipments', method: 'POST', status: 201, timestamp: new Date().toISOString(), environment: 'SANDBOX' },
        { id: '2', endpoint: '/api/v1/shipments/track', method: 'GET', status: 200, timestamp: new Date(Date.now() - 300000).toISOString(), environment: 'SANDBOX' }
      ]);
    } catch (err) {
      console.error("Failed to load integrations data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAppStatus = async (appId: string, status: 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'REVOKED', rateLimit?: number) => {
    try {
      // Record administrative action
      await auditEngine.logEvent({
        userId: user?.uid || 'ADMIN',
        action: `DEVELOPER_APP_STATUS_${status}`,
        details: { appId, status, rateLimit },
        result: 'SUCCESS'
      });

      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status, rateLimitPerMin: rateLimit || a.rateLimitPerMin } : a));
      toast.success(`Application status updated to ${status}`);
    } catch (err) {
      toast.error('Failed to update application status');
    }
  };

  const handleSaveProviderAdapter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let mappings = {};
      try {
        mappings = JSON.parse(providerForm.statusMappingsText);
      } catch (e) {
        toast.error('Invalid JSON for status mappings');
        return;
      }

      const configured = await providerAdapterSystem.configureAdapter(
        providerForm.providerName,
        providerForm.model,
        {
          apiEndpointUrl: providerForm.apiEndpointUrl,
          webhookUrl: providerForm.webhookUrl,
          apiKey: providerForm.apiKey,
          webhookSecret: providerForm.webhookSecret,
          statusMappings: mappings as any,
          isActive: true
        }
      );

      setAdapters(prev => [configured, ...prev.filter(a => a.id !== configured.id)]);
      setShowAdapterModal(false);
      toast.success(`Provider adapter configured for ${providerForm.providerName}`);
    } catch (err) {
      toast.error('Failed to save provider adapter');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <RefreshCw className="animate-spin text-primary-500 w-10 h-10" />
          <p className="text-slate-400 font-mono text-xs uppercase tracking-wider font-bold">Synchronizing Integration Manager...</p>
        </div>
      </AdminLayout>
    );
  }

  const filteredApps = applications.filter(a =>
    a.appName?.toLowerCase().includes(appSearch.toLowerCase()) ||
    a.companyName?.toLowerCase().includes(appSearch.toLowerCase()) ||
    a.id?.toLowerCase().includes(appSearch.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div>
            <p className="text-primary-600 font-bold uppercase tracking-widest text-[10px] mb-2 flex items-center gap-1.5">
              <Terminal size={14} /> Admin Integration Manager
            </p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white font-display">API &amp; Partner Management</h1>
            <p className="text-slate-600 dark:text-slate-400 font-medium mt-1">Review production requests, manage developer API credentials, set rate limits, and configure external logistics provider adapters.</p>
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: 'apps', label: 'API Applications', icon: Layers },
              { id: 'providers', label: 'Provider Adapters', icon: Globe },
              { id: 'logs', label: 'Integration Audit Logs', icon: Activity }
            ].map(tab => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                onClick={() => setActiveTab(tab.id as any)}
                className="rounded-xl px-4 py-2 font-bold text-xs uppercase tracking-wider flex items-center gap-2"
              >
                <tab.icon size={14} />
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {/* TAB 1: API APPLICATIONS */}
        {activeTab === 'apps' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative max-w-md w-full">
                <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <Input
                  placeholder="Search applications by name, company, or ID..."
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs"
                />
              </div>

              <div className="flex gap-2">
                <Badge variant="info" className="text-xs px-3 py-1 font-mono">
                  Total Apps: {applications.length}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredApps.length === 0 ? (
                <Card className="col-span-2 p-12 text-center border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
                  <Layers size={36} className="mx-auto text-slate-400" />
                  <h3 className="font-bold text-slate-900 dark:text-white">No API Applications Registered</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">Developer applications will appear here when integration partners sign up or request sandbox access.</p>
                </Card>
              ) : (
                filteredApps.map(app => (
                  <Card key={app.id} className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl space-y-5 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none text-[9px] font-mono uppercase">{app.environment}</Badge>
                          <Badge variant={
                            app.status === 'APPROVED' ? 'success' :
                            app.status === 'PROD_REQUESTED' ? 'warning' : 'outline'
                          } className="text-[9px] font-mono">
                            {app.status}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{app.appName}</h3>
                        <p className="text-xs text-slate-500 font-medium">{app.companyName}</p>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400">Rate: <strong>{app.rateLimitPerMin || 60} req/min</strong></span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-1 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-[10px]">API Key Prefix:</span>
                        <span className="text-primary-600 font-bold">{app.apiKeyPrefix || app.apiKey?.substring(0, 12) + '...'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-[10px]">Webhook URL:</span>
                        <span className="text-slate-700 dark:text-slate-300 truncate max-w-xs">{app.webhookUrl || 'Not set'}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-mono">Created: {new Date(app.createdAt).toLocaleDateString()}</span>

                      <div className="flex gap-2">
                        {app.status === 'PROD_REQUESTED' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateAppStatus(app.id, 'APPROVED', 600)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] h-8 rounded-lg px-3"
                          >
                            Approve Production
                          </Button>
                        )}
                        {app.status !== 'SUSPENDED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateAppStatus(app.id, 'SUSPENDED')}
                            className="text-[10px] border-amber-500/30 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 h-8 rounded-lg px-3"
                          >
                            Suspend
                          </Button>
                        )}
                        {app.status !== 'REVOKED' && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleUpdateAppStatus(app.id, 'REVOKED')}
                            className="text-[10px] h-8 rounded-lg px-3"
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PROVIDER ADAPTERS */}
        {activeTab === 'providers' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">External Provider Adapters</h3>
                <p className="text-xs text-slate-500">Configure Model A (consumer) and Model B (connected) external logistics company status mappings and credentials.</p>
              </div>

              <Button
                onClick={() => setShowAdapterModal(true)}
                className="bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs h-11 rounded-xl px-5 flex items-center gap-2"
              >
                <Plus size={16} /> Configure Provider Adapter
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {adapters.map(adapter => (
                <Card key={adapter.id} className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-primary-500/10 text-primary-600 border-none text-[9px] font-mono uppercase">{adapter.model}</Badge>
                        <Badge variant={adapter.isActive ? 'success' : 'outline'} className="text-[9px] font-mono">
                          {adapter.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{adapter.providerName}</h3>
                      <p className="text-xs text-slate-400 font-mono">{adapter.apiEndpointUrl || 'No Endpoint URL set'}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Status Mapping Table</span>
                    <pre className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 max-h-40 overflow-auto">
                      {JSON.stringify(adapter.statusMappings, null, 2)}
                    </pre>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: INTEGRATION AUDIT LOGS */}
        {activeTab === 'logs' && (
          <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">API Call &amp; Security Stream</h3>
                <p className="text-xs text-slate-500">Live request execution logs across developer applications and provider adapters.</p>
              </div>
              <Badge variant="info" className="text-[10px] font-mono">Live Stream</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                    <th className="py-3 px-2">Timestamp</th>
                    <th className="py-3 px-2">Endpoint</th>
                    <th className="py-3 px-2">Method</th>
                    <th className="py-3 px-2">Environment</th>
                    <th className="py-3 px-2 text-right">HTTP Status</th>
                  </tr>
                </thead>
                <tbody>
                  {apiLogs.map(log => (
                    <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800/60 text-slate-700 dark:text-slate-300">
                      <td className="py-3 px-2 font-mono text-[10px]">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="py-3 px-2 font-mono text-[11px] text-primary-600 font-bold">{log.endpoint}</td>
                      <td className="py-3 px-2 font-mono text-[10px] font-bold">{log.method}</td>
                      <td className="py-3 px-2 font-mono text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">{log.environment}</span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-emerald-600">{log.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

      </div>

      {/* CONFIGURE ADAPTER MODAL */}
      {showAdapterModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <Card className="max-w-lg w-full p-6 bg-slate-900 border-slate-800 text-white rounded-3xl space-y-5 animate-scale-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base">Configure Provider Adapter</h3>
              <button onClick={() => setShowAdapterModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleSaveProviderAdapter} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Logistics Provider Name</label>
                <Input
                  required
                  placeholder="e.g. Example Logistics Ltd"
                  value={providerForm.providerName}
                  onChange={(e) => setProviderForm({ ...providerForm, providerName: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Integration Model</label>
                  <select
                    value={providerForm.model}
                    onChange={(e) => setProviderForm({ ...providerForm, model: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
                  >
                    <option value="MODEL_A">Model A (Consumes OmorfiHub API)</option>
                    <option value="MODEL_B">Model B (OmorfiHub Connects to Partner API)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">API Key</label>
                  <Input
                    placeholder="Partner API Key"
                    value={providerForm.apiKey}
                    onChange={(e) => setProviderForm({ ...providerForm, apiKey: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white h-10 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Endpoint URL</label>
                <Input
                  placeholder="https://api.externalprovider.com/v1"
                  value={providerForm.apiEndpointUrl}
                  onChange={(e) => setProviderForm({ ...providerForm, apiEndpointUrl: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white h-10 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Status Mappings JSON (External -&gt; OmorfiHub)</label>
                <textarea
                  rows={5}
                  value={providerForm.statusMappingsText}
                  onChange={(e) => setProviderForm({ ...providerForm, statusMappingsText: e.target.value })}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-[11px] focus:outline-none"
                />
              </div>

              <Button type="submit" className="w-full bg-primary-600 hover:bg-primary-500 font-bold h-11 rounded-xl">
                Save Provider Adapter
              </Button>
            </form>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
};
