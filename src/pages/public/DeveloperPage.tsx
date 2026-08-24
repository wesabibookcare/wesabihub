import React, { useState, useEffect } from 'react';
import { where } from 'firebase/firestore';
import { PublicLayout } from '@/src/layouts/PublicLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Input } from '@/src/components/ui/Input';
import { useAuth } from '@/src/context/AuthContext';
import { developerProfileRepository } from '@/src/services/db/DeveloperProfileRepository';
import { webhookLogRepository } from '@/src/services/db/WebhookLogRepository';
import { apiLogRepository } from '@/src/services/db/ApiLogRepository';
import { auditEngine } from '@/src/engines/AuditEngine';
import { toast } from 'sonner';

import {
  Code,
  Server,
  Shield,
  Zap,
  Lock,
  Globe,
  ArrowRight,
  Key,
  RefreshCw,
  Check,
  Copy,
  AlertCircle,
  Eye,
  EyeOff,
  Play,
  Activity,
  Terminal,
  Send,
  Database,
  Sliders,
  ChevronRight,
  Clock,
  Plus,
  BookOpen,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export const DeveloperPage = () => {
  const { user, fbUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'apps' | 'keys' | 'sandbox' | 'webhooks' | 'docs'>('apps');
  const [devProfile, setDevProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Applications State
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [showCreateAppModal, setShowKeyModal] = useState(false);
  const [appName, setAppName] = useState('');
  const [companyName, setCompany] = useState('');
  const [appEnv, setAppEnv] = useState<'SANDBOX' | 'PRODUCTION'>('SANDBOX');
  const [appWebhookUrl, setAppWebhookUrl] = useState('');

  // Legacy / Direct profile states
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  // Webhooks state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [testWebhookLoading, setTestWebhookLoading] = useState(false);
  const [testWebhookResult, setTestWebhookResult] = useState<any>(null);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);

  // Sandbox state
  const [sandboxEndpoint, setSandboxEndpoint] = useState<
    | 'auth'
    | 'create'
    | 'get'
    | 'track'
    | 'status'
    | 'pickup'
    | 'pickup-fail'
    | 'confirm'
    | 'delivery-fail'
    | 'cancel'
    | 'evidence'
    | 'pin'
  >('create');
  const [sandboxTrackingNumber, setSandboxTrackingNumber] = useState('');
  const [sandboxShipmentId, setSandboxShipmentId] = useState('');
  const [sandboxStatusValue, setSandboxStatusValue] = useState('IN_TRANSIT');
  const [sandboxIdempotencyKey, setSandboxIdempotencyKey] = useState(`idemp-${Date.now()}`);
  const [sandboxPayload, setSandboxPayload] = useState({
    recipientInfo: {
      name: "Bolanle Ahmed",
      phone: "+234 812 345 6789",
      email: "bolanle@example.com"
    },
    weightKg: "2.5",
    category: "Fashion & Electronics",
    originCenterId: "LOS-Hub-01",
    destinationCenterId: "ABJ-Hub-02",
    externalOrderId: `ORD-${Date.now()}`
  });
  const [sandboxResponse, setSandboxResponse] = useState<any>(null);
  const [sandboxResponseHeaders, setSandboxResponseHeaders] = useState<Record<string, string>>({});
  const [sandboxLoading, setSandboxLoading] = useState(false);

  // Stats / Logs State
  const [apiLogs, setApiLogs] = useState<any[]>([]);

  const fetchApplications = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/v1/developer/applications');
      const data = await res.json();
      if (data.success && data.applications) {
        setApplications(data.applications);
        if (data.applications.length > 0 && !selectedApp) {
          setSelectedApp(data.applications[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch developer applications:', err);
    }
  };

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Subscribe to Developer Profile
    const unsubscribeProfile = developerProfileRepository.subscribe(user.uid, (data) => {
      if (data) {
        setDevProfile(data);
        setWebhookUrl(data.webhookUrl || '');
      } else {
        setDevProfile(null);
      }
      setIsLoading(false);
    });

    // Subscribe to webhook logs
    const unsubscribeWebhooks = webhookLogRepository.subscribeToQuery(
      [where('userId', '==', user.uid)],
      (logs) => {
        const sortedLogs = [...logs].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setWebhookLogs(sortedLogs.slice(0, 15));
      }
    );

    // Subscribe to API logs
    const unsubscribeApiLogs = apiLogRepository.subscribeToQuery(
      [where('userId', '==', user.uid)],
      (logs) => {
        const sortedLogs = [...logs].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setApiLogs(sortedLogs.slice(0, 15));
      }
    );

    fetchApplications();

    return () => {
      unsubscribeProfile();
      unsubscribeWebhooks();
      unsubscribeApiLogs();
    };
  }, [user]);

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsActionLoading(true);

    try {
      const res = await fetch('/api/v1/developer/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName: appName || 'My Logistics Integration',
          companyName: companyName || user.displayName || 'Enterprise Partner',
          environment: appEnv,
          webhookUrl: appWebhookUrl,
          scopes: ['shipments:read', 'shipments:create', 'shipments:update', 'tracking:read', 'webhooks:manage']
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Application "${data.application.appName}" created!`);
        setShowKeyModal(false);
        setAppName('');
        setCompany('');
        fetchApplications();
        setSelectedApp(data.application);
      } else {
        toast.error(data.error || 'Failed to create application');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Network error creating application');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRotateAppKey = async (appId: string) => {
    if (!window.confirm("Are you sure you want to rotate API keys for this application? The current API key will stop working immediately.")) return;
    setIsActionLoading(true);

    try {
      const res = await fetch(`/api/v1/developer/applications/${appId}/rotate`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        toast.success("API credentials rotated successfully!");
        fetchApplications();
      } else {
        toast.error(data.error || 'Failed to rotate keys');
      }
    } catch (err) {
      toast.error('Failed to rotate keys');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRequestProduction = async (appId: string) => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/v1/developer/applications/${appId}/request-production`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Production access request submitted for Admin review!");
        fetchApplications();
      } else {
        toast.error(data.error || 'Failed to request production access');
      }
    } catch (err) {
      toast.error('Failed to submit production request');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSaveWebhook = async () => {
    if (!user) return;
    setIsActionLoading(true);

    try {
      if (selectedApp) {
        await fetch(`/api/v1/developer/applications/${selectedApp.id}/webhooks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ webhookUrl })
        });
      }
      if (devProfile) {
        await developerProfileRepository.update(user.uid, {
          webhookUrl,
          updatedAt: new Date().toISOString()
        });
      }
      toast.success("Webhook URL updated successfully!");
    } catch (err) {
      console.error("Error updating webhook:", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) return toast.error("Please specify a Webhook URL first.");
    setTestWebhookLoading(true);
    setTestWebhookResult(null);

    try {
      const response = await fetch('/api/v1/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl })
      });
      const data = await response.json();
      setTestWebhookResult(data);
    } catch (err: any) {
      setTestWebhookResult({ success: false, error: err.message || "Failed to contact URL" });
    } finally {
      setTestWebhookLoading(false);
    }
  };

  const handleSandboxRequest = async () => {
    const activeApiKey = selectedApp?.apiKey || devProfile?.apiKey;
    if (!activeApiKey) {
      toast.error("Please select or create an API application first.");
      return;
    }

    setSandboxLoading(true);
    setSandboxResponse(null);
    setSandboxResponseHeaders({});

    try {
      let url = '';
      let method = 'GET';
      let body: any = null;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-api-key': activeApiKey,
        'Idempotency-Key': sandboxIdempotencyKey
      };

      if (sandboxEndpoint === 'auth') {
        url = '/api/v1/auth/verify';
        method = 'POST';
      } else if (sandboxEndpoint === 'create') {
        url = '/api/v1/shipments';
        method = 'POST';
        body = JSON.stringify(sandboxPayload);
      } else if (sandboxEndpoint === 'get') {
        if (!sandboxShipmentId) {
          setSandboxResponse({ success: false, error: "Please enter or generate a Shipment ID." });
          setSandboxLoading(false);
          return;
        }
        url = `/api/v1/shipments/${sandboxShipmentId}`;
        method = 'GET';
      } else if (sandboxEndpoint === 'track') {
        if (!sandboxTrackingNumber) {
          setSandboxResponse({ success: false, error: "Please enter or generate a Tracking Number." });
          setSandboxLoading(false);
          return;
        }
        url = `/api/v1/shipments/track?trackingNumber=${sandboxTrackingNumber}`;
        method = 'GET';
      } else if (sandboxEndpoint === 'status') {
        if (!sandboxShipmentId) {
          setSandboxResponse({ success: false, error: "Please enter a Shipment ID." });
          setSandboxLoading(false);
          return;
        }
        url = `/api/v1/shipments/${sandboxShipmentId}/status`;
        method = 'PATCH';
        body = JSON.stringify({ status: sandboxStatusValue, remarks: "Updated via Sandbox Tester" });
      } else if (sandboxEndpoint === 'pickup') {
        if (!sandboxShipmentId) {
          setSandboxResponse({ success: false, error: "Please enter a Shipment ID." });
          setSandboxLoading(false);
          return;
        }
        url = `/api/v1/shipments/${sandboxShipmentId}/pickup-request`;
        method = 'POST';
        body = JSON.stringify({ notes: "Sandbox pickup request" });
      } else if (sandboxEndpoint === 'pickup-fail') {
        if (!sandboxShipmentId) {
          setSandboxResponse({ success: false, error: "Please enter a Shipment ID." });
          setSandboxLoading(false);
          return;
        }
        url = `/api/v1/shipments/${sandboxShipmentId}/pickup-failure`;
        method = 'POST';
        body = JSON.stringify({ reason: "Merchant address closed" });
      } else if (sandboxEndpoint === 'confirm') {
        if (!sandboxShipmentId) {
          setSandboxResponse({ success: false, error: "Please enter a Shipment ID." });
          setSandboxLoading(false);
          return;
        }
        url = `/api/v1/shipments/${sandboxShipmentId}/confirm`;
        method = 'POST';
        body = JSON.stringify({ notes: "Delivery verified via sandbox" });
      } else if (sandboxEndpoint === 'delivery-fail') {
        if (!sandboxShipmentId) {
          setSandboxResponse({ success: false, error: "Please enter a Shipment ID." });
          setSandboxLoading(false);
          return;
        }
        url = `/api/v1/shipments/${sandboxShipmentId}/failure`;
        method = 'POST';
        body = JSON.stringify({ reason: "Customer requested reschedule" });
      } else if (sandboxEndpoint === 'cancel') {
        if (!sandboxShipmentId) {
          setSandboxResponse({ success: false, error: "Please enter a Shipment ID." });
          setSandboxLoading(false);
          return;
        }
        url = `/api/v1/shipments/${sandboxShipmentId}/cancel`;
        method = 'POST';
        body = JSON.stringify({ reason: "Order cancelled by customer" });
      } else if (sandboxEndpoint === 'evidence') {
        if (!sandboxShipmentId) {
          setSandboxResponse({ success: false, error: "Please enter a Shipment ID." });
          setSandboxLoading(false);
          return;
        }
        url = `/api/v1/shipments/${sandboxShipmentId}/evidence`;
        method = 'POST';
        body = JSON.stringify({
          photoUrl: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=400",
          notes: "Digital signature captured"
        });
      } else if (sandboxEndpoint === 'pin') {
        if (!sandboxShipmentId) {
          setSandboxResponse({ success: false, error: "Please enter a Shipment ID." });
          setSandboxLoading(false);
          return;
        }
        url = `/api/v1/shipments/${sandboxShipmentId}/pin`;
        method = 'POST';
      }

      const options: any = { method, headers };
      if (body) options.body = body;

      const res = await fetch(url, options);
      const data = await res.json();

      const resHeaders: Record<string, string> = {
        'x-ratelimit-limit': res.headers.get('x-ratelimit-limit') || '',
        'x-ratelimit-remaining': res.headers.get('x-ratelimit-remaining') || '',
        'x-ratelimit-reset': res.headers.get('x-ratelimit-reset') || '',
        'x-cache': res.headers.get('x-cache') || 'MISS'
      };

      setSandboxResponseHeaders(resHeaders);
      setSandboxResponse(data);

      if (sandboxEndpoint === 'create' && data.success && data.shipment) {
        setSandboxTrackingNumber(data.shipment.trackingNumber);
        setSandboxShipmentId(data.shipment.shipmentId);
      }
    } catch (err: any) {
      setSandboxResponse({ success: false, error: err.message || "Request failed" });
    } finally {
      setSandboxLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-slate-950 text-white py-24 relative overflow-hidden">
        {/* Glow Elements */}
        <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-primary-600/10 blur-[180px] -translate-y-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-indigo-600/10 blur-[180px] translate-y-1/3 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 relative z-10 space-y-12">

          {/* 1. MARKETING / GUEST LANDING HEADER */}
          {!fbUser && (
            <div className="space-y-16">
              <div className="max-w-4xl space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-primary-500/10 border border-primary-500/20 text-primary-400 rounded-full text-xs font-bold uppercase tracking-wider">
                  <Zap size={12} /> OmorfiHub Developer Portal
                </div>
                <h1 className="text-5xl md:text-7xl font-black font-display tracking-tight leading-[1.05] text-white">
                  The API for <br />
                  <span className="bg-gradient-to-r from-primary-400 to-indigo-400 bg-clip-text text-transparent">Nationwide Logistics Infrastructure.</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-3xl">
                  Connect OmorfiHub PUDO points, dispatch rider networks, and logistics providers directly into your e-commerce gateway, marketplace, or merchant software.
                </p>

                <div className="flex flex-wrap gap-4 pt-4">
                  <Button size="lg" className="h-14 px-8 rounded-2xl text-base bg-primary-600 hover:bg-primary-500 text-white font-bold shadow-lg shadow-primary-500/20 transition-all" asChild>
                    <Link to="/login?redirect=/api">Access Developer Console</Link>
                  </Button>
                  <Button variant="outline" size="lg" className="h-14 px-8 rounded-2xl text-base border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 font-bold" onClick={() => setActiveTab('docs')}>
                    View API Reference
                  </Button>
                </div>
              </div>

              {/* Bento Value Cards */}
              <div className="grid lg:grid-cols-3 gap-8">
                {[
                  {
                    icon: Zap,
                    title: "Unified Parcel Booking",
                    desc: "Inject origin/destination coordinates and parcel weight to instantly generate tracking IDs and secure 4-digit pickup PINs."
                  },
                  {
                    icon: Shield,
                    title: "SafePay Protected Transactions",
                    desc: "SafePay is OmorfiHub's separate protected buyer-seller transaction service, holding payment until verified pickup."
                  },
                  {
                    icon: Server,
                    title: "HMAC Signed Webhooks",
                    desc: "Receive real-time event webhooks signed with SHA-256 signatures when drop-off, hub arrival, dispatch, or delivery occurs."
                  }
                ].map((item, i) => (
                  <Card key={i} className="p-8 bg-slate-900/40 border-slate-800/60 backdrop-blur-md rounded-3xl hover:border-slate-700/60 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center mb-6 text-primary-400 group-hover:scale-110 transition-transform">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 font-display text-white">{item.title}</h3>
                    <p className="text-slate-400 leading-relaxed text-xs font-medium">{item.desc}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* LOADING SESSION */}
          {fbUser && isLoading && (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <RefreshCw className="animate-spin text-primary-500 w-10 h-10" />
              <p className="text-slate-400 font-mono text-xs uppercase tracking-wider font-bold">Synchronizing OmorfiHub Developer Console...</p>
            </div>
          )}

          {/* ACTIVE LOGGED-IN DEVELOPER CONSOLE */}
          {fbUser && !isLoading && (
            <div className="space-y-8 animate-fade-in">

              {/* Top Banner & Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-900 pb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-primary-500/10 text-primary-400 border-primary-500/20 text-[10px] font-mono uppercase tracking-wider">
                      <Terminal size={12} className="mr-1" /> OmorfiHub Developer Portal
                    </Badge>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black font-display tracking-tight text-white">
                    {selectedApp?.companyName || devProfile?.businessName || user?.displayName || 'Enterprise Partner'}
                  </h1>
                  <p className="text-slate-400 text-xs mt-1">
                    Manage API applications, test sandbox workflows, configure HMAC webhooks, and monitor real-time API logs.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setShowKeyModal(true)}
                    className="bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs h-11 px-5 rounded-xl shadow-lg shadow-primary-500/20 flex items-center gap-2"
                  >
                    <Plus size={16} /> New Application
                  </Button>
                </div>
              </div>

              {/* Application Selector Banner */}
              {applications.length > 0 && (
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-400">
                      <Layers size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Active Application</span>
                      <strong className="text-sm font-bold text-white">{selectedApp?.appName || 'Default Application'}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      className="bg-slate-950 border border-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:border-primary-500"
                      value={selectedApp?.id || ''}
                      onChange={(e) => {
                        const found = applications.find(a => a.id === e.target.value);
                        if (found) setSelectedApp(found);
                      }}
                    >
                      {applications.map(app => (
                        <option key={app.id} value={app.id}>
                          {app.appName} ({app.environment}) - [{app.status}]
                        </option>
                      ))}
                    </select>

                    <Badge
                      variant={selectedApp?.environment === 'PRODUCTION' ? (selectedApp?.status === 'APPROVED' ? 'success' : 'warning') : 'info'}
                      className="text-[10px] font-mono uppercase px-3 py-1"
                    >
                      {selectedApp?.environment || 'SANDBOX'} • {selectedApp?.status || 'APPROVED'}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { label: "Total API Requests", value: selectedApp?.apiCallCount || devProfile?.apiCallCount || 0, icon: Activity, color: "text-blue-400", bg: "bg-blue-500/10" },
                  { label: "Environment Tier", value: selectedApp?.environment || 'SANDBOX', icon: Sliders, color: "text-purple-400", bg: "bg-purple-500/10" },
                  { label: "Rate Limit", value: `${selectedApp?.rateLimitPerMin || 60} req/min`, icon: Clock, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                  { label: "Webhooks Logged", value: webhookLogs.length, icon: Server, color: "text-indigo-400", bg: "bg-indigo-500/10" }
                ].map((stat, idx) => (
                  <Card key={idx} className="p-5 bg-slate-900/30 border-slate-900 rounded-2xl relative overflow-hidden">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">{stat.label}</span>
                        <strong className="text-xl font-black text-white">{stat.value}</strong>
                      </div>
                      <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                        <stat.icon size={18} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Navigation Tabs */}
              <div className="flex gap-2 border-b border-slate-900 pb-px overflow-x-auto">
                {[
                  { id: 'apps', label: 'API Applications', icon: Layers },
                  { id: 'keys', label: 'Credentials', icon: Key },
                  { id: 'sandbox', label: 'Sandbox Tester', icon: Play },
                  { id: 'webhooks', label: 'Webhooks', icon: Server },
                  { id: 'docs', label: 'API Reference', icon: BookOpen }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-bold text-xs uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-white bg-primary-500/5'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB PANELS */}
              <div className="min-h-[450px]">
                <AnimatePresence mode="wait">

                  {/* TAB 1: APPLICATIONS */}
                  {activeTab === 'apps' && (
                    <motion.div key="apps" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {applications.length === 0 ? (
                          <Card className="col-span-2 p-12 text-center bg-slate-900/30 border-slate-900 rounded-3xl space-y-4">
                            <Layers size={36} className="mx-auto text-slate-500" />
                            <h3 className="text-lg font-bold">No API Applications Found</h3>
                            <p className="text-slate-400 text-xs max-w-sm mx-auto">Create your first OmorfiHub Sandbox application to receive API credentials and test workflows.</p>
                            <Button onClick={() => setShowKeyModal(true)} className="bg-primary-600 font-bold text-xs rounded-xl h-11 px-6">
                              Create First Application
                            </Button>
                          </Card>
                        ) : (
                          applications.map((app) => (
                            <Card key={app.id} className={`p-6 border rounded-3xl space-y-5 transition-all ${
                              selectedApp?.id === app.id ? 'border-primary-500 bg-primary-500/5' : 'border-slate-900 bg-slate-900/30 hover:border-slate-800'
                            }`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <Badge className="bg-slate-800 text-slate-300 border-none text-[9px] font-mono mb-2 uppercase">{app.environment}</Badge>
                                  <h3 className="text-xl font-bold text-white">{app.appName}</h3>
                                  <p className="text-xs text-slate-400 font-medium">{app.companyName}</p>
                                </div>
                                <Badge variant={app.status === 'APPROVED' ? 'success' : 'warning'} className="text-[10px] font-mono">
                                  {app.status}
                                </Badge>
                              </div>

                              <div className="p-3 bg-slate-950 rounded-xl border border-slate-900/80 space-y-1 text-xs font-mono">
                                <span className="text-slate-500 text-[10px] uppercase font-bold block">API Key Prefix:</span>
                                <span className="text-primary-400 font-bold">{app.apiKeyPrefix || app.apiKey?.substring(0, 12) + '...'}</span>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
                                <span className="text-slate-400">Limit: <strong>{app.rateLimitPerMin || 60} req/min</strong></span>
                                <div className="flex gap-2">
                                  {app.environment === 'SANDBOX' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleRequestProduction(app.id)}
                                      disabled={isActionLoading}
                                      className="text-[10px] border-slate-800 text-slate-300 rounded-lg h-8"
                                    >
                                      Request Production
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRotateAppKey(app.id)}
                                    disabled={isActionLoading}
                                    className="text-[10px] border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-lg h-8"
                                  >
                                    Rotate Key
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 2: CREDENTIALS */}
                  {activeTab === 'keys' && (
                    <motion.div key="keys" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <Card className="p-8 bg-slate-900/30 border-slate-900 rounded-3xl space-y-6">
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold">API Key & Webhook Credentials</h3>
                          <p className="text-slate-400 text-xs">Transmit your key in the <code className="text-primary-400">x-api-key</code> HTTP header for every API request.</p>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected Application API Key</label>
                            <div className="flex gap-3 items-center">
                              <div className="flex-1 relative bg-slate-950 rounded-xl border border-slate-800 px-4 py-3 font-mono text-xs text-slate-300 flex items-center h-12 overflow-hidden">
                                <span>{showKey ? (selectedApp?.apiKey || devProfile?.apiKey) : '•'.repeat(40)}</span>
                                <button onClick={() => setShowKey(!showKey)} className="absolute right-4 text-slate-500 hover:text-slate-300">
                                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                              </div>

                              <Button onClick={() => copyToClipboard(selectedApp?.apiKey || devProfile?.apiKey || '')} variant="outline" className="h-12 border-slate-800 text-slate-300 hover:bg-slate-900 rounded-xl px-5">
                                {copied ? <Check size={16} className="text-emerald-400 mr-1" /> : <Copy size={16} className="mr-1" />}
                                {copied ? 'Copied' : 'Copy Key'}
                              </Button>
                            </div>
                          </div>

                          {selectedApp?.apiSecret && (
                            <div className="space-y-2 pt-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Application Secret (HMAC Signing)</label>
                              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300">
                                <span>{selectedApp.apiSecret}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>

                      {/* API Logs */}
                      <Card className="p-8 bg-slate-900/30 border-slate-900 rounded-3xl space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-base font-bold">API Call Audit Log</h3>
                            <p className="text-slate-400 text-xs">Real-time trace of HTTP calls authenticated with your credentials.</p>
                          </div>
                          <Badge variant="info" className="text-[10px] font-mono">Recent 15 Requests</Badge>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                                <th className="py-3 px-2">Timestamp</th>
                                <th className="py-3 px-2">Endpoint</th>
                                <th className="py-3 px-2">Method</th>
                                <th className="py-3 px-2">IP</th>
                                <th className="py-3 px-2 text-right">HTTP Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {apiLogs.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="py-6 text-center text-slate-500">No API log events recorded yet. Run requests in the Sandbox Tester!</td>
                                </tr>
                              ) : (
                                apiLogs.map((log) => (
                                  <tr key={log.id} className="border-b border-slate-900 hover:bg-slate-900/20 text-slate-300">
                                    <td className="py-3 px-2 font-mono text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="py-3 px-2 font-mono text-[11px] text-primary-400">{log.endpoint}</td>
                                    <td className="py-3 px-2 font-mono text-[10px] font-bold text-slate-200">{log.method}</td>
                                    <td className="py-3 px-2 font-mono text-[10px] text-slate-400">{log.ipAddress || '0.0.0.0'}</td>
                                    <td className="py-3 px-2 text-right">
                                      <span className={`font-mono font-bold px-2 py-0.5 rounded-md text-[10px] ${
                                        log.status >= 200 && log.status < 300 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                      }`}>
                                        {log.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    </motion.div>
                  )}

                  {/* TAB 3: SANDBOX TESTER PLAYGROUND */}
                  {activeTab === 'sandbox' && (
                    <motion.div key="sandbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left Control Panel */}
                      <Card className="lg:col-span-5 p-6 bg-slate-900/30 border-slate-900 rounded-3xl space-y-5 flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <h3 className="text-base font-bold flex items-center gap-2"><Play size={16} className="text-primary-500" /> Interactive Sandbox Suite</h3>
                            <p className="text-slate-400 text-[11px]">Test end-to-end logistics API flows in safe isolation.</p>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Operation</label>
                            <select
                              className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-primary-500"
                              value={sandboxEndpoint}
                              onChange={(e) => setSandboxEndpoint(e.target.value as any)}
                            >
                              <option value="auth">POST /api/v1/auth/verify - Verify Key & Scopes</option>
                              <option value="create">POST /api/v1/shipments - Create Shipment</option>
                              <option value="get">GET /api/v1/shipments/:id - Fetch Shipment</option>
                              <option value="track">GET /api/v1/shipments/track - Track Status</option>
                              <option value="status">PATCH /api/v1/shipments/:id/status - Transition Status</option>
                              <option value="pickup">POST /api/v1/shipments/:id/pickup-request - Request Pickup</option>
                              <option value="pickup-fail">POST /api/v1/shipments/:id/pickup-failure - Record Pickup Failure</option>
                              <option value="confirm">POST /api/v1/shipments/:id/confirm - Confirm Delivery</option>
                              <option value="delivery-fail">POST /api/v1/shipments/:id/failure - Record Delivery Failure</option>
                              <option value="cancel">POST /api/v1/shipments/:id/cancel - Cancel Shipment</option>
                              <option value="evidence">POST /api/v1/shipments/:id/evidence - Upload Evidence</option>
                              <option value="pin">POST /api/v1/shipments/:id/pin - Regenerate Pickup PIN</option>
                            </select>
                          </div>

                          {/* Dynamic Inputs */}
                          <div className="space-y-3 pt-3 border-t border-slate-900">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Idempotency-Key Header</label>
                              <Input
                                value={sandboxIdempotencyKey}
                                onChange={(e) => setSandboxIdempotencyKey(e.target.value)}
                                className="bg-slate-950 border-slate-800 text-xs h-9 font-mono"
                              />
                            </div>

                            {sandboxEndpoint === 'create' && (
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recipient Name</label>
                                  <Input
                                    value={sandboxPayload.recipientInfo.name}
                                    onChange={(e) => setSandboxPayload({...sandboxPayload, recipientInfo: {...sandboxPayload.recipientInfo, name: e.target.value}})}
                                    className="bg-slate-950 border-slate-800 text-xs h-9"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weight (kg)</label>
                                    <Input
                                      value={sandboxPayload.weightKg}
                                      onChange={(e) => setSandboxPayload({...sandboxPayload, weightKg: e.target.value})}
                                      className="bg-slate-950 border-slate-800 text-xs h-9"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">External Order ID</label>
                                    <Input
                                      value={sandboxPayload.externalOrderId}
                                      onChange={(e) => setSandboxPayload({...sandboxPayload, externalOrderId: e.target.value})}
                                      className="bg-slate-950 border-slate-800 text-xs h-9 font-mono"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {sandboxEndpoint === 'track' && (
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tracking Number</label>
                                <Input
                                  placeholder="e.g. WSH-829104"
                                  value={sandboxTrackingNumber}
                                  onChange={(e) => setSandboxTrackingNumber(e.target.value)}
                                  className="bg-slate-950 border-slate-800 text-xs h-9 font-mono"
                                />
                              </div>
                            )}

                            {['get', 'status', 'pickup', 'pickup-fail', 'confirm', 'delivery-fail', 'cancel', 'evidence', 'pin'].includes(sandboxEndpoint) && (
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shipment ID</label>
                                <Input
                                  placeholder="e.g. WSH-API-102482"
                                  value={sandboxShipmentId}
                                  onChange={(e) => setSandboxShipmentId(e.target.value)}
                                  className="bg-slate-950 border-slate-800 text-xs h-9 font-mono"
                                />
                              </div>
                            )}

                            {sandboxEndpoint === 'status' && (
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Status Value</label>
                                <select
                                  value={sandboxStatusValue}
                                  onChange={(e) => setSandboxStatusValue(e.target.value)}
                                  className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-semibold"
                                >
                                  <option value="RECEIVED_AT_ORIGIN">RECEIVED_AT_ORIGIN</option>
                                  <option value="IN_TRANSIT">IN_TRANSIT</option>
                                  <option value="ARRIVED_AT_DESTINATION">ARRIVED_AT_DESTINATION</option>
                                  <option value="READY_FOR_PICKUP">READY_FOR_PICKUP</option>
                                  <option value="DELIVERED">DELIVERED</option>
                                  <option value="DELIVERY_FAILED">DELIVERY_FAILED</option>
                                  <option value="CANCELLED">CANCELLED</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          onClick={handleSandboxRequest}
                          disabled={sandboxLoading}
                          className="w-full h-11 rounded-xl bg-primary-600 hover:bg-primary-500 font-bold text-xs flex items-center justify-center gap-2 mt-4"
                        >
                          {sandboxLoading ? 'Executing Request...' : 'Send API Request'}
                          <ChevronRight size={14} />
                        </Button>
                      </Card>

                      {/* Right Response Terminal */}
                      <Card className="lg:col-span-7 p-6 bg-slate-950 border-slate-900 rounded-3xl flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                            <span className="text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1.5"><Terminal size={14} className="text-primary-500" /> HTTP Response Payload</span>
                            {sandboxResponseHeaders['x-cache'] && (
                              <Badge variant="outline" className="text-[9px] font-mono border-slate-800 text-slate-400">
                                Cache: {sandboxResponseHeaders['x-cache']}
                              </Badge>
                            )}
                          </div>

                          {Object.keys(sandboxResponseHeaders).length > 0 && (
                            <div className="flex gap-4 text-[10px] font-mono text-slate-500 bg-slate-900/40 p-2.5 rounded-xl border border-slate-900">
                              <span>Limit: <strong className="text-slate-300">{sandboxResponseHeaders['x-ratelimit-limit']}</strong></span>
                              <span>Remaining: <strong className="text-slate-300">{sandboxResponseHeaders['x-ratelimit-remaining']}</strong></span>
                              <span>Reset: <strong className="text-slate-300">{sandboxResponseHeaders['x-ratelimit-reset']}s</strong></span>
                            </div>
                          )}

                          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-4 min-h-[300px] overflow-auto max-h-[450px]">
                            {sandboxResponse ? (
                              <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">{JSON.stringify(sandboxResponse, null, 2)}</pre>
                            ) : (
                              <div className="h-full flex flex-col items-center justify-center text-center py-20 text-slate-600 gap-2">
                                <Terminal size={32} className="opacity-40" />
                                <p className="text-xs font-mono">Terminal idle. Click "Send API Request" to execute test.</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-500 font-mono text-center">
                          OmorfiHub Sandbox Environment • Isolated from production wallets &amp; real payments.
                        </p>
                      </Card>
                    </motion.div>
                  )}

                  {/* TAB 4: WEBHOOKS */}
                  {activeTab === 'webhooks' && (
                    <motion.div key="webhooks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <Card className="p-8 bg-slate-900/30 border-slate-900 rounded-3xl space-y-6">
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold">Webhook Event Configuration</h3>
                          <p className="text-slate-400 text-xs">Configure your HTTP endpoint to receive HMAC SHA-256 signed JSON webhook events.</p>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Webhook Destination URL</label>
                            <div className="flex gap-3">
                              <Input
                                placeholder="https://api.yourcompany.com/webhooks/omorfi"
                                value={webhookUrl}
                                onChange={(e) => setWebhookUrl(e.target.value)}
                                className="bg-slate-950 border-slate-800 text-white flex-1 h-12"
                              />
                              <Button onClick={handleSaveWebhook} disabled={isActionLoading} className="h-12 bg-primary-600 font-bold px-6 rounded-xl">
                                Save URL
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-900 gap-4">
                            <div>
                              <p className="text-xs font-bold text-white">Trigger Connection Check</p>
                              <p className="text-[10px] text-slate-400">Sends test payload <code className="text-primary-400">test.connection</code> to verify connectivity.</p>
                            </div>
                            <Button onClick={handleTestWebhook} disabled={testWebhookLoading || !webhookUrl} variant="outline" className="h-10 text-xs border-slate-800 text-slate-300 rounded-xl">
                              {testWebhookLoading ? 'Testing...' : 'Test Endpoint'}
                            </Button>
                          </div>

                          {testWebhookResult && (
                            <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 text-xs font-mono space-y-2">
                              <p className="font-bold text-white">Test Connection Result:</p>
                              <div className="grid grid-cols-2 text-[10px] gap-2 pt-1 border-t border-slate-900">
                                <div>HTTP Status: <strong className={testWebhookResult.success ? 'text-emerald-400' : 'text-red-400'}>{testWebhookResult.status || 'ERROR'}</strong></div>
                                <div>Success: <strong className={testWebhookResult.success ? 'text-emerald-400' : 'text-red-400'}>{testWebhookResult.success ? 'True' : 'False'}</strong></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>

                      {/* Webhook Delivery Registry */}
                      <Card className="p-8 bg-slate-900/30 border-slate-900 rounded-3xl space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-base font-bold">Webhook Delivery Registry</h3>
                            <p className="text-slate-400 text-xs">Recent event dispatch logs with HMAC signatures and duration metrics.</p>
                          </div>
                          <Badge variant="info" className="text-[10px] font-mono">Recent Logs</Badge>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                                <th className="py-3 px-2">Timestamp</th>
                                <th className="py-3 px-2">Event</th>
                                <th className="py-3 px-2">Destination URL</th>
                                <th className="py-3 px-2">Latency</th>
                                <th className="py-3 px-2 text-right">HTTP Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {webhookLogs.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="py-6 text-center text-slate-500">No webhooks dispatched yet. Trigger a status change to see logs!</td>
                                </tr>
                              ) : (
                                webhookLogs.map((log) => (
                                  <tr key={log.id} className="border-b border-slate-900 hover:bg-slate-900/20 text-slate-300">
                                    <td className="py-3 px-2 font-mono text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="py-3 px-2 font-mono text-[11px] text-indigo-400 font-bold">{log.event}</td>
                                    <td className="py-3 px-2 font-mono text-[10px] text-slate-400 truncate max-w-xs">{log.url}</td>
                                    <td className="py-3 px-2 font-mono text-[10px] text-slate-400">{log.duration ? `${log.duration}ms` : '-'}</td>
                                    <td className="py-3 px-2 text-right">
                                      <span className={`font-mono font-bold px-2 py-0.5 rounded-md text-[10px] ${
                                        log.status >= 200 && log.status < 300 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                      }`}>
                                        {log.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    </motion.div>
                  )}

                  {/* TAB 5: DOCUMENTATION */}
                  {activeTab === 'docs' && (
                    <motion.div key="docs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <Card className="p-8 bg-slate-900/30 border-slate-900 rounded-3xl space-y-6">
                        <div className="space-y-1">
                          <h2 className="text-2xl font-bold font-display">OmorfiHub API Specification</h2>
                          <p className="text-slate-400 text-xs">Version 1.0 • Base URL: <code className="text-primary-400">/api/v1/</code></p>
                        </div>

                        <div className="space-y-6">
                          <div className="space-y-2">
                            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-1.5 uppercase tracking-wider text-[11px]">1. Authentication &amp; Headers</h3>
                            <p className="text-slate-400 text-xs">Include your API Key in the custom HTTP header for every request:</p>
                            <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-900 text-xs font-mono text-primary-400">
x-api-key: sb_key_your_api_key_here
Idempotency-Key: your_unique_idempotency_key
                            </pre>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-1.5 uppercase tracking-wider text-[11px]">2. Webhook Signature Verification (HMAC SHA-256)</h3>
                            <p className="text-slate-400 text-xs">Verify webhook authenticity by checking the <code className="text-primary-400">X-OmorfiHub-Signature</code> header:</p>
                            <pre className="p-3.5 bg-slate-950 rounded-xl border border-slate-900 text-[11px] font-mono text-slate-300 overflow-x-auto">
{`const crypto = require('crypto');

function verifyOmorfiWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(JSON.stringify(payload)).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}`}
                            </pre>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-1.5 uppercase tracking-wider text-[11px]">3. Key Endpoints Reference</h3>

                            {[
                              { method: "POST", endpoint: "/api/v1/shipments", desc: "Create new parcel shipment with origin/destination hub IDs and recipient details.", badge: "bg-emerald-500/10 text-emerald-400" },
                              { method: "GET", endpoint: "/api/v1/shipments/track?trackingNumber=WSH-829104", desc: "Track shipment events chronologically.", badge: "bg-blue-500/10 text-blue-400" },
                              { method: "PATCH", endpoint: "/api/v1/shipments/:id/status", desc: "Update shipment status (IN_TRANSIT, READY_FOR_PICKUP, DELIVERED, etc.).", badge: "bg-purple-500/10 text-purple-400" },
                              { method: "POST", endpoint: "/api/v1/shipments/:id/confirm", desc: "Confirm pickup/delivery using 4-digit PIN.", badge: "bg-emerald-500/10 text-emerald-400" },
                              { method: "POST", endpoint: "/api/v1/shipments/:id/cancel", desc: "Cancel active shipment.", badge: "bg-red-500/10 text-red-400" }
                            ].map((ep, i) => (
                              <div key={i} className="p-4 bg-slate-950/40 rounded-2xl border border-slate-900 space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded ${ep.badge}`}>{ep.method}</span>
                                  <span className="font-mono text-xs font-bold text-white">{ep.endpoint}</span>
                                </div>
                                <p className="text-xs text-slate-400">{ep.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Attribution Footer */}
              <div className="pt-8 border-t border-slate-900 text-center text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-400">OmorfiHub is a product of Omorfi Limited</p>
                <p className="text-[11px]">All API operations are monitored for security and compliance.</p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* CREATE APPLICATION MODAL */}
      {showCreateAppModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 bg-slate-900 border-slate-800 text-white rounded-3xl space-y-5 animate-scale-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base">New API Application</h3>
              <button onClick={() => setShowKeyModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateApp} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Application Name</label>
                <Input
                  required
                  placeholder="e.g. Example Logistics Integration"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Company Name</label>
                <Input
                  required
                  placeholder="e.g. Example Logistics Ltd"
                  value={companyName}
                  onChange={(e) => setCompany(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Environment</label>
                <select
                  value={appEnv}
                  onChange={(e) => setAppEnv(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
                >
                  <option value="SANDBOX">Sandbox (Instant API Access)</option>
                  <option value="PRODUCTION">Production (Requires Admin Approval)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Webhook Destination URL (Optional)</label>
                <Input
                  placeholder="https://api.yourcompany.com/webhooks"
                  value={appWebhookUrl}
                  onChange={(e) => setAppWebhookUrl(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white h-10"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <Button type="submit" disabled={isActionLoading} className="flex-1 bg-primary-600 hover:bg-primary-500 font-bold h-11 rounded-xl">
                  {isActionLoading ? 'Creating...' : 'Create Application'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </PublicLayout>
  );
};
