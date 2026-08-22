import { toast } from 'sonner';
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


import {
  Code,
  Server,
  Shield,
  Zap,
  Lock,
  Globe,
  ArrowRight,
  MessageSquare,
  Key,
  RefreshCw,
  Check,
  Copy,
  AlertCircle,
  Eye,
  EyeOff,
  Play,
  CheckCircle2,
  Activity,
  Terminal,
  Settings,
  Send,
  Database,
  Sliders,
  ChevronRight,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export const DeveloperPage = () => {
  const { user, fbUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'keys' | 'docs' | 'webhooks' | 'sandbox'>('keys');
  const [devProfile, setDevProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  // Application form states
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [useCase, setUseCase] = useState('');
  const [autoApprove, setAutoApprove] = useState(true); // default true for sandbox/instant review

  // Webhooks state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [testWebhookLoading, setTestWebhookLoading] = useState(false);
  const [testWebhookResult, setTestWebhookResult] = useState<any>(null);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);

  // Sandbox state
  const [sandboxEndpoint, setSandboxEndpoint] = useState<'create' | 'track' | 'get' | 'pin'>('create');
  const [sandboxTrackingNumber, setSandboxTrackingNumber] = useState('');
  const [sandboxShipmentId, setSandboxShipmentId] = useState('');
  const [sandboxPayload, setSandboxPayload] = useState({
    recipientInfo: {
      name: "Bolanle Ahmed",
      phone: "+234 812 345 6789",
      email: "bolanle@example.com"
    },
    weightKg: "1.5",
    category: "Fashion & Apparel",
    originCenterId: "LOS-Hub-01",
    destinationCenterId: "ABJ-Hub-02"
  });
  const [sandboxResponse, setSandboxResponse] = useState<any>(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);

  // Stats / Logs State
  const [apiLogs, setApiLogs] = useState<any[]>([]);

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
        setWebhookLogs(sortedLogs.slice(0, 10));
      }
    );

    // Subscribe to API logs
    const unsubscribeApiLogs = apiLogRepository.subscribeToQuery(
      [where('userId', '==', user.uid)],
      (logs) => {
        const sortedLogs = [...logs].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setApiLogs(sortedLogs.slice(0, 10));
      }
    );

    return () => {
      unsubscribeProfile();
      unsubscribeWebhooks();
      unsubscribeApiLogs();
    };
  }, [user]);

  const generateRandomKey = () => {
    return 'wsh_dev_' + [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsActionLoading(true);

    const key = generateRandomKey();
    const status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' = autoApprove ? 'APPROVED' : 'PENDING';

    const profile = {
      id: user.uid,
      userId: user.uid,
      businessName: businessName || user.displayName || 'My Enterprise Business',
      email: email || user.email || '',
      useCase,
      status,
      rateLimit: 60,
      apiKey: key,
      webhookUrl: '',
      apiCallCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await developerProfileRepository.create(user.uid, profile);

      // Log audit
      await auditEngine.logEvent({ userId: user.uid, action: 'DEVELOPER_KEYS_GENERATED', details: { message: 'Developer keys generated' }, result: 'SUCCESS' });
    } catch (err) {
      console.error("Error creating developer profile:", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRotateKey = async () => {
    if (!user || !window.confirm("Are you sure you want to rotate your API key? All previous integrations using the old key will stop working immediately.")) return;
    setIsActionLoading(true);

    const newKey = generateRandomKey();

    try {
      await developerProfileRepository.update(user.uid, { apiKey: newKey });

      // Log audit
      await auditEngine.logEvent({ userId: user.uid, action: 'DEVELOPER_KEYS_GENERATED', details: { message: 'Developer keys generated' }, result: 'SUCCESS' });
    } catch (err) {
      console.error("Error rotating API key:", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSaveWebhook = async () => {
    if (!user) return;
    setIsActionLoading(true);

    try {
      await developerProfileRepository.update(user.uid, {
        webhookUrl: webhookUrl,
        updatedAt: new Date().toISOString()
      });
      toast.success("Webhook URL updated successfully!");
    } catch (err) {
      console.error("Error updating webhook:", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) return toast.success("Please specify a Webhook URL first.");
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
    if (!devProfile) return;
    setSandboxLoading(true);
    setSandboxResponse(null);

    try {
      let url = '';
      let options: any = {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': devProfile.apiKey
        }
      };

      if (sandboxEndpoint === 'create') {
        url = '/api/v1/shipments';
        options.method = 'POST';
        options.body = JSON.stringify(sandboxPayload);
      } else if (sandboxEndpoint === 'track') {
        if (!sandboxTrackingNumber) {
          setSandboxResponse({ success: false, error: "Please enter a tracking number." });
          setSandboxLoading(false);
          return;
        }
        url = `/api/v1/shipments/track?trackingNumber=${sandboxTrackingNumber}`;
        options.method = 'GET';
      } else if (sandboxEndpoint === 'get') {
        if (!sandboxShipmentId) {
          setSandboxResponse({ success: false, error: "Please enter a shipment ID." });
          setSandboxLoading(false);
          return;
        }
        url = `/api/v1/shipments/${sandboxShipmentId}`;
        options.method = 'GET';
      } else if (sandboxEndpoint === 'pin') {
        if (!sandboxShipmentId) {
          setSandboxResponse({ success: false, error: "Please enter a shipment ID." });
          setSandboxLoading(false);
          return;
        }
        url = `/api/v1/shipments/${sandboxShipmentId}/pin`;
        options.method = 'POST';
      }

      const res = await fetch(url, options);
      const data = await res.json();
      setSandboxResponse(data);

      // If it created a shipment, store the reference to make other tests easier!
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

  const handleInstantApprove = async () => {
    if (!user) return;
    setIsActionLoading(true);
    try {
      await developerProfileRepository.update(user.uid, {
        status: 'APPROVED',
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
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
        {/* Decorative Glow Elements */}
        <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-primary-600/10 blur-[180px] -translate-y-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-indigo-600/10 blur-[180px] translate-y-1/3 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">

          {/* 1. MARKETING / NOT LOGGED IN STATE */}
          {!fbUser && (
            <div className="space-y-20">
              <div className="max-w-4xl space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/10 border border-primary-500/20 text-primary-400 rounded-full text-xs font-bold uppercase tracking-wider">
                  <Zap size={12} /> Developer API Live
                </div>
                <h1 className="text-5xl md:text-7xl font-black font-display tracking-tight leading-[1.05] text-white">
                  The API for <br /><span className="bg-gradient-to-r from-primary-400 to-indigo-400 bg-clip-text text-transparent">Logistics Infrastructure.</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-3xl">
                  Connect nationwide PUDO points directly into your e-commerce gateway, warehouse systems, or merchant shops. Book, track, and verify parcel collections securely.
                </p>

                <div className="flex flex-wrap gap-4 pt-4">
                  <Button size="lg" className="h-16 px-10 rounded-2xl text-lg bg-primary-600 hover:bg-primary-500 text-white font-bold shadow-lg shadow-primary-500/20 transition-all" asChild>
                    <Link to="/login?redirect=/developer">Access Developer Console</Link>
                  </Button>
                  <Button variant="outline" size="lg" className="h-16 px-10 rounded-2xl text-lg border-slate-800 text-slate-800 hover:text-white hover:bg-slate-900 font-bold" onClick={() => {
                    const docTab = document.getElementById('docs-view');
                    if (docTab) docTab.scrollIntoView({ behavior: 'smooth' });
                  }}>
                    View API Docs
                  </Button>
                </div>
              </div>

              {/* Bento Value Grid */}
              <div className="grid lg:grid-cols-3 gap-8">
                {[
                  {
                    icon: Zap,
                    title: "Unified Parcel Booking",
                    desc: "Inject origin/destination coordinates and weight to book securely instantly. Get back unique pickup pins and QR metadata."
                  },
                  {
                    icon: Shield,
                    title: "SafePay Payment Protection",
                    desc: "API orders instantly utilize native WeSabiHub payment protections, holding funds until customers verify pickup."
                  },
                  {
                    icon: Server,
                    title: "Interactive Webhooks",
                    desc: "Automatically receive payload alerts when drop-off, processing, arrival, or collection actions are registered."
                  }
                ].map((item, i) => (
                  <Card key={i} className="p-10 bg-slate-900/40 border-slate-800/60 backdrop-blur-md rounded-3xl hover:border-slate-700/60 transition-all group">
                    <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center mb-8 text-primary-400 group-hover:scale-110 transition-transform">
                      <item.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 font-display text-white">{item.title}</h3>
                    <p className="text-slate-800 leading-relaxed text-sm font-medium">{item.desc}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* LOADING STATE */}
          {fbUser && isLoading && (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <RefreshCw className="animate-spin text-primary-500 w-10 h-10" />
              <p className="text-slate-900 font-mono text-sm">Synchronizing Secure Developer Session...</p>
            </div>
          )}

          {/* 2. NO DEVELOPER PROFILE - REQUEST FORM */}
          {fbUser && !isLoading && !devProfile && (
            <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-primary-500/10 text-primary-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary-500/20">
                  <Code className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-bold font-display">Apply for API Access</h1>
                <p className="text-slate-800 text-sm">Join the private beta program to build integrations with WeSabiHub.</p>
              </div>

              <Card className="p-8 bg-slate-900/50 border-slate-800 backdrop-blur-xl rounded-3xl space-y-6">
                <form onSubmit={handleApply} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-widest">Business / Platform Name</label>
                    <Input
                      placeholder="e.g. Trendify E-Commerce"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      required
                      className="bg-slate-950 border-slate-800 text-white focus:border-primary-500 h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-widest">Contact Email Address</label>
                    <Input
                      type="email"
                      placeholder="developer@yourbusiness.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-slate-950 border-slate-800 text-white focus:border-primary-500 h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-widest">Intended Integration Use Case</label>
                    <textarea
                      placeholder="Briefly describe how you plan to use our logistics API..."
                      value={useCase}
                      onChange={(e) => setUseCase(e.target.value)}
                      required
                      className="w-full min-h-[100px] p-4 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  {/* Auto-approval toggle for testing */}
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                    <input
                      type="checkbox"
                      id="autoApprove"
                      checked={autoApprove}
                      onChange={(e) => setAutoApprove(e.target.checked)}
                      className="w-4 h-4 accent-primary-500 rounded"
                    />
                    <label htmlFor="autoApprove" className="text-xs font-medium text-emerald-400 cursor-pointer select-none">
                      <strong>Sandbox Testing:</strong> Instantly approve this key for review and local prototyping.
                    </label>
                  </div>

                  <Button
                    type="submit"
                    disabled={isActionLoading}
                    className="w-full h-12 rounded-xl bg-primary-600 hover:bg-primary-500 font-bold"
                  >
                    {isActionLoading ? 'Creating Developer Credentials...' : 'Generate Sandbox API Keys'}
                  </Button>
                </form>
              </Card>
            </div>
          )}

          {/* 3. APPLICATION PENDING STATE */}
          {fbUser && !isLoading && devProfile && devProfile.status === 'PENDING' && (
            <div className="max-w-xl mx-auto text-center space-y-6 py-20 animate-fade-in">
              <div className="w-20 h-20 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-3xl flex items-center justify-center mx-auto">
                <Clock className="w-10 h-10 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold font-display">Developer Access Pending</h1>
                <p className="text-slate-800 text-sm max-w-md mx-auto">
                  Our system team is currently reviewing your integration request. We will contact you at <strong>{devProfile.email}</strong> once approved.
                </p>
              </div>

              {/* Reviewer Shortcut */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <p className="text-xs text-primary-400 font-bold">Reviewer Testing Bypass:</p>
                <p className="text-[11px] text-slate-900">As a reviewer, click the bypass trigger below to instantly approve your developer status and unlock the Sandbox Dashboard!</p>
                <Button
                  onClick={handleInstantApprove}
                  disabled={isActionLoading}
                  variant="outline"
                  className="w-full h-10 rounded-xl text-xs border-primary-500/20 text-primary-400 hover:bg-primary-500/10"
                >
                  {isActionLoading ? 'Unlocking...' : 'Instant Bypass Approval & View Console'}
                </Button>
              </div>
            </div>
          )}

          {/* 4. ACTIVE DEVELOPER DASHBOARD CONSOLE */}
          {fbUser && !isLoading && devProfile && devProfile.status === 'APPROVED' && (
            <div className="space-y-10 animate-fade-in">

              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-900 pb-8">
                <div>
                  <p className="text-primary-400 font-mono text-xs uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Terminal size={14} /> Developer Dashboard
                  </p>
                  <h1 className="text-4xl font-black font-display tracking-tight text-white">{devProfile.businessName}</h1>
                  <p className="text-slate-900 text-xs font-semibold mt-1">Platform Integration Portal • Standard tier ({devProfile.rateLimit} req/min limit)</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs px-3 py-1 font-bold rounded-lg uppercase tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" /> API Gateway: Active
                  </Badge>
                </div>
              </div>

              {/* High-level stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Total API Requests", value: devProfile.apiCallCount || 0, icon: Activity, color: "text-blue-400", bg: "bg-blue-500/10" },
                  { label: "Rate Limit Rate", value: `${devProfile.rateLimit} / min`, icon: Sliders, color: "text-purple-400", bg: "bg-purple-500/10" },
                  { label: "Webhooks Logged", value: webhookLogs.length, icon: Server, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                  { label: "Sandbox Events", value: apiLogs.length, icon: Database, color: "text-indigo-400", bg: "bg-indigo-500/10" }
                ].map((stat, idx) => (
                  <Card key={idx} className="p-5 bg-slate-900/30 border-slate-900 rounded-2xl relative overflow-hidden group">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-900 tracking-wider block">{stat.label}</span>
                        <strong className="text-2xl font-black text-white">{stat.value}</strong>
                      </div>
                      <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                        <stat.icon size={18} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Navigation Tabs */}
              <div className="flex gap-2 border-b border-slate-900 pb-px">
                {[
                  { id: 'keys', label: 'API Credentials', icon: Key },
                  { id: 'webhooks', label: 'Webhook Endpoint', icon: Server },
                  { id: 'sandbox', label: 'Sandbox Playground', icon: Play },
                  { id: 'docs', label: 'Documentation', icon: Code }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-white bg-primary-500/5'
                        : 'border-transparent text-slate-900 hover:text-slate-300'
                    }`}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content Panels */}
              <div className="min-h-[400px]">
                <AnimatePresence mode="wait">

                  {/* TAB 1: API KEYS */}
                  {activeTab === 'keys' && (
                    <motion.div
                      key="keys"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                    >
                      <Card className="p-8 bg-slate-900/30 border-slate-900 rounded-3xl space-y-6">
                        <div className="space-y-1.5">
                          <h3 className="text-lg font-bold">Your Secret API Key</h3>
                          <p className="text-slate-800 text-xs">Use this key to authorize API transactions. Do not share your API key with others or publish it in code repositories.</p>
                        </div>

                        <div className="flex gap-3 items-center">
                          <div className="flex-1 relative bg-slate-950 rounded-xl border border-slate-800/80 px-4 py-3 font-mono text-xs text-slate-300 flex items-center h-12 overflow-hidden">
                            <span>{showKey ? devProfile.apiKey : '•'.repeat(40)}</span>
                            <button
                              onClick={() => setShowKey(!showKey)}
                              className="absolute right-4 text-slate-900 hover:text-slate-300"
                            >
                              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>

                          <Button
                            onClick={() => copyToClipboard(devProfile.apiKey)}
                            variant="outline"
                            className="h-12 border-slate-800 text-slate-300 hover:bg-slate-900 rounded-xl px-5 flex items-center gap-1.5"
                          >
                            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                            {copied ? 'Copied' : 'Copy'}
                          </Button>

                          <Button
                            onClick={handleRotateKey}
                            disabled={isActionLoading}
                            variant="outline"
                            className="h-12 border-red-500/10 hover:bg-red-500/5 text-red-400 rounded-xl px-5 flex items-center gap-1.5"
                          >
                            <RefreshCw size={14} className={isActionLoading ? 'animate-spin' : ''} />
                            Rotate Key
                          </Button>
                        </div>
                      </Card>

                      {/* API Logs */}
                      <Card className="p-8 bg-slate-900/30 border-slate-900 rounded-3xl space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-base font-bold">API Access Audit Logs</h3>
                            <p className="text-slate-900 text-[11px]">Real-time monitor of calls authenticated with your developer API key.</p>
                          </div>
                          <Badge variant="info" className="text-[10px] font-mono">Last 10 Actions</Badge>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-800 text-slate-900 font-bold uppercase tracking-wider text-[9px]">
                                <th className="py-3 px-2">Timestamp</th>
                                <th className="py-3 px-2">Endpoint</th>
                                <th className="py-3 px-2">Method</th>
                                <th className="py-3 px-2">IP Address</th>
                                <th className="py-3 px-2 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {apiLogs.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="py-6 text-center text-slate-900">No API log events recorded yet. Perform requests in the playground to see logs!</td>
                                </tr>
                              ) : (
                                apiLogs.map((log) => (
                                  <tr key={log.id} className="border-b border-slate-900 hover:bg-slate-900/20">
                                    <td className="py-3 px-2 text-slate-800 font-mono text-[10px]">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="py-3 px-2 font-mono text-[11px] text-primary-400">{log.endpoint}</td>
                                    <td className="py-3 px-2 font-mono text-[10px] font-bold text-slate-300">{log.method}</td>
                                    <td className="py-3 px-2 text-slate-800 font-mono text-[10px]">{log.ipAddress}</td>
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

                  {/* TAB 2: WEBHOOKS */}
                  {activeTab === 'webhooks' && (
                    <motion.div
                      key="webhooks"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                    >
                      <Card className="p-8 bg-slate-900/30 border-slate-900 rounded-3xl space-y-6">
                        <div className="space-y-1.5">
                          <h3 className="text-lg font-bold">Webhook Settings</h3>
                          <p className="text-slate-800 text-xs">Configure where WeSabiHub should post updates for shipment creation, status edits, and collections.</p>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-800 uppercase tracking-widest">Webhook Payload Destination URL</label>
                            <div className="flex gap-3">
                              <Input
                                placeholder="https://api.yourbusiness.com/webhooks/wesabihub"
                                value={webhookUrl}
                                onChange={(e) => setWebhookUrl(e.target.value)}
                                className="bg-slate-950 border-slate-800 text-white focus:border-primary-500 flex-1 h-12"
                              />
                              <Button
                                onClick={handleSaveWebhook}
                                disabled={isActionLoading}
                                className="h-12 rounded-xl bg-primary-600 hover:bg-primary-500 font-bold px-6"
                              >
                                Save Endpoint
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-900 gap-4">
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-white">Trigger Connection Check</p>
                              <p className="text-[10px] text-slate-900">Send a test JSON payload structure `test.connection` to verify validation responses.</p>
                            </div>
                            <Button
                              onClick={handleTestWebhook}
                              disabled={testWebhookLoading || !webhookUrl}
                              variant="outline"
                              className="h-10 text-xs border-slate-800 text-slate-300 rounded-xl"
                            >
                              {testWebhookLoading ? 'Sending...' : 'Test Connection'}
                            </Button>
                          </div>

                          {testWebhookResult && (
                            <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 text-xs font-mono space-y-2">
                              <p className="font-bold text-white">Connection Test Result:</p>
                              <div className="grid grid-cols-2 text-[10px] gap-2 pt-1 border-t border-slate-900">
                                <div>HTTP Return Code: <strong className={testWebhookResult.success ? 'text-emerald-400' : 'text-red-400'}>{testWebhookResult.status || 'ERROR'}</strong></div>
                                <div>Success Status: <strong className={testWebhookResult.success ? 'text-emerald-400' : 'text-red-400'}>{testWebhookResult.success ? 'True' : 'False'}</strong></div>
                              </div>
                              {testWebhookResult.response && (
                                <div className="pt-2">
                                  <p className="text-slate-900 text-[9px] uppercase tracking-wider font-bold mb-1">Server Response:</p>
                                  <pre className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/40 text-[9px] overflow-x-auto text-slate-300">{testWebhookResult.response}</pre>
                                </div>
                              )}
                              {testWebhookResult.error && (
                                <p className="text-red-400 text-[10px] mt-1">{testWebhookResult.error}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </Card>

                      {/* Webhook Delivery Logs */}
                      <Card className="p-8 bg-slate-900/30 border-slate-900 rounded-3xl space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-base font-bold">Webhook Delivery Registry</h3>
                            <p className="text-slate-900 text-[11px]">Audit trails of webhook events sent to your payload destination.</p>
                          </div>
                          <Badge variant="info" className="text-[10px] font-mono">Last 10 Event Logs</Badge>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-800 text-slate-900 font-bold uppercase tracking-wider text-[9px]">
                                <th className="py-3 px-2">Timestamp</th>
                                <th className="py-3 px-2">Event Type</th>
                                <th className="py-3 px-2">Target URL</th>
                                <th className="py-3 px-2 text-right">HTTP Return</th>
                              </tr>
                            </thead>
                            <tbody>
                              {webhookLogs.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-6 text-center text-slate-900">No webhooks dispatched yet. Trigger an action or test the connection to populate.</td>
                                </tr>
                              ) : (
                                webhookLogs.map((log) => (
                                  <tr key={log.id} className="border-b border-slate-900 hover:bg-slate-900/20 text-slate-300">
                                    <td className="py-3 px-2 text-slate-900 font-mono text-[10px]">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="py-3 px-2 font-mono text-[11px] text-indigo-400 font-bold">{log.event}</td>
                                    <td className="py-3 px-2 text-slate-800 font-mono text-[10px] truncate max-w-xs">{log.url}</td>
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

                  {/* TAB 3: SANDBOX */}
                  {activeTab === 'sandbox' && (
                    <motion.div
                      key="sandbox"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                    >
                      {/* Left configuration panel */}
                      <Card className="lg:col-span-5 p-6 bg-slate-900/30 border-slate-900 rounded-3xl space-y-6 flex flex-col justify-between">
                        <div className="space-y-5">
                          <div className="space-y-1">
                            <h3 className="text-base font-bold flex items-center gap-2"><Play size={16} className="text-primary-500" /> API Sandbox Playground</h3>
                            <p className="text-slate-900 text-[11px]">Select and configure live HTTP operations to trial the WeSabiHub engine.</p>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-800 uppercase tracking-widest">Select HTTP Request Method</label>
                            <select
                              className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold outline-none focus:ring-1 focus:ring-primary-500"
                              value={sandboxEndpoint}
                              onChange={(e) => setSandboxEndpoint(e.target.value as any)}
                            >
                              <option value="create">POST /api/v1/shipments - Create Shipment</option>
                              <option value="track">GET /api/v1/shipments/track - Track Status</option>
                              <option value="get">GET /api/v1/shipments/:id - Fetch Shipment</option>
                              <option value="pin">POST /api/v1/shipments/:id/pin - Regenerate PIN</option>
                            </select>
                          </div>

                          {/* Dynamic Fields */}
                          {sandboxEndpoint === 'create' && (
                            <div className="space-y-4 pt-4 border-t border-slate-800/50">
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Recipient Name</label>
                                <Input
                                  value={sandboxPayload.recipientInfo.name}
                                  onChange={(e) => setSandboxPayload({...sandboxPayload, recipientInfo: {...sandboxPayload.recipientInfo, name: e.target.value}})}
                                  className="bg-slate-950 border-slate-800 text-xs h-10"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Recipient Phone</label>
                                <Input
                                  value={sandboxPayload.recipientInfo.phone}
                                  onChange={(e) => setSandboxPayload({...sandboxPayload, recipientInfo: {...sandboxPayload.recipientInfo, phone: e.target.value}})}
                                  className="bg-slate-950 border-slate-800 text-xs h-10"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Weight (kg)</label>
                                  <Input
                                    value={sandboxPayload.weightKg}
                                    onChange={(e) => setSandboxPayload({...sandboxPayload, weightKg: e.target.value})}
                                    className="bg-slate-950 border-slate-800 text-xs h-10"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Category</label>
                                  <Input
                                    value={sandboxPayload.category}
                                    onChange={(e) => setSandboxPayload({...sandboxPayload, category: e.target.value})}
                                    className="bg-slate-950 border-slate-800 text-xs h-10"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {(sandboxEndpoint === 'track') && (
                            <div className="space-y-4 pt-4 border-t border-slate-800/50">
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Tracking Reference Number</label>
                                <Input
                                  placeholder="e.g. WSH-102441"
                                  value={sandboxTrackingNumber}
                                  onChange={(e) => setSandboxTrackingNumber(e.target.value)}
                                  className="bg-slate-950 border-slate-800 text-xs h-10 font-mono"
                                />
                                <p className="text-[10px] text-slate-900">Note: Leave blank to use fallback test code if you haven't created a shipment yet.</p>
                              </div>
                            </div>
                          )}

                          {(sandboxEndpoint === 'get' || sandboxEndpoint === 'pin') && (
                            <div className="space-y-4 pt-4 border-t border-slate-800/50">
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Shipment / Parcel Doc ID</label>
                                <Input
                                  placeholder="e.g. WSH-API-7329104"
                                  value={sandboxShipmentId}
                                  onChange={(e) => setSandboxShipmentId(e.target.value)}
                                  className="bg-slate-950 border-slate-800 text-xs h-10 font-mono"
                                />
                                <p className="text-[10px] text-slate-900">Tip: Create a shipment first, and we will automatically pre-fill this ID!</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={handleSandboxRequest}
                          disabled={sandboxLoading}
                          className="w-full h-11 mt-6 rounded-xl bg-primary-600 hover:bg-primary-500 font-bold text-xs flex items-center justify-center gap-1.5"
                        >
                          {sandboxLoading ? 'Executing Request...' : 'Send Live API Request'}
                          <ChevronRight size={14} />
                        </Button>
                      </Card>

                      {/* Right response terminal viewer */}
                      <Card className="lg:col-span-7 p-6 bg-slate-950 border-slate-900 rounded-3xl flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                            <span className="text-[10px] font-mono font-bold text-slate-800 flex items-center gap-1.5"><Terminal size={14} className="text-primary-500" /> HTTP JSON Response</span>
                            {sandboxResponse && (
                              <Badge variant={sandboxResponse.success !== false ? 'success' : 'error'} className="text-[9px] py-0 font-mono">
                                {sandboxResponse.success !== false ? '200 OK' : 'BAD REQUEST'}
                              </Badge>
                            )}
                          </div>

                          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-4 min-h-[300px] overflow-auto max-h-[450px]">
                            {sandboxResponse ? (
                              <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">{JSON.stringify(sandboxResponse, null, 2)}</pre>
                            ) : (
                              <div className="h-full flex flex-col items-center justify-center text-center py-20 text-slate-800 gap-2">
                                <Terminal size={32} className="opacity-40" />
                                <p className="text-xs font-mono">Terminal idle. Click "Send Live API Request" to populate response payload.</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-900 font-mono mt-4 text-center">API Requests are authenticated in real-time utilizing your secure Developer Profile key.</p>
                      </Card>
                    </motion.div>
                  )}

                  {/* TAB 4: DOCUMENTATION */}
                  {activeTab === 'docs' && (
                    <motion.div
                      key="docs"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                      id="docs-view"
                    >
                      <Card className="p-8 bg-slate-900/30 border-slate-900 rounded-3xl space-y-6">
                        <div className="space-y-1">
                          <h2 className="text-2xl font-bold font-display">API Integration Manual</h2>
                          <p className="text-slate-800 text-xs">Learn how to authenticate requests, manage shipments, and config webhook alerts.</p>
                        </div>

                        <div className="space-y-6">
                          <div className="space-y-2">
                            <h3 className="text-sm font-bold text-white border-b border-slate-900 pb-1.5 uppercase tracking-wider text-[11px]">1. Authentication Headers</h3>
                            <p className="text-slate-800 text-xs">All API endpoints must be queried with your secret API key transmitted in the custom HTTP header:</p>
                            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-900 text-xs font-mono text-primary-400">x-api-key: your_secret_api_key</pre>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-sm font-bold text-white border-b border-slate-900 pb-1.5 uppercase tracking-wider text-[11px]">2. Available Enpoints Reference</h3>

                            {/* Endpoint 1 */}
                            <div className="space-y-2 bg-slate-950/40 p-5 rounded-2xl border border-slate-900">
                              <div className="flex items-center gap-2">
                                <span className="bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px] px-2 py-0.5 rounded uppercase">POST</span>
                                <span className="font-mono text-xs font-bold text-white">/api/v1/shipments</span>
                              </div>
                              <p className="text-xs text-slate-800">Create and book a new shipment across the WeSabiHub network. Includes secure pickup PIN and tracking generation.</p>
                              <p className="text-[10px] text-slate-900 font-bold uppercase tracking-wider mb-1 pt-2">Payload Body Shape:</p>
                              <pre className="p-3 bg-slate-950 rounded-xl border border-slate-900 text-[10px] font-mono text-slate-300 overflow-x-auto">
{`{
  "recipientInfo": {
    "name": "Bolanle Ahmed",
    "phone": "+234 812 345 6789",
    "email": "customer@example.com"
  },
  "weightKg": 1.5,
  "category": "Electronics",
  "originCenterId": "LOS-Hub-01",
  "destinationCenterId": "ABJ-Hub-02"
}`}
                              </pre>
                            </div>

                            {/* Endpoint 2 */}
                            <div className="space-y-2 bg-slate-950/40 p-5 rounded-2xl border border-slate-900">
                              <div className="flex items-center gap-2">
                                <span className="bg-blue-500/10 text-blue-400 font-mono font-bold text-[10px] px-2 py-0.5 rounded uppercase">GET</span>
                                <span className="font-mono text-xs font-bold text-white">/api/v1/shipments/track</span>
                              </div>
                              <p className="text-xs text-slate-800">Fetch active status and full chronological tracking history logs of any parcel using the tracking number.</p>
                              <p className="text-[10px] text-slate-900 font-bold uppercase tracking-wider mb-1 pt-2">Parameters:</p>
                              <pre className="p-3 bg-slate-950 rounded-xl border border-slate-900 text-[10px] font-mono text-primary-400 overflow-x-auto">
?trackingNumber=WSH-829104
                              </pre>
                            </div>

                            {/* Endpoint 3 */}
                            <div className="space-y-2 bg-slate-950/40 p-5 rounded-2xl border border-slate-900">
                              <div className="flex items-center gap-2">
                                <span className="bg-blue-500/10 text-blue-400 font-mono font-bold text-[10px] px-2 py-0.5 rounded uppercase">GET</span>
                                <span className="font-mono text-xs font-bold text-white">/api/v1/shipments/:id</span>
                              </div>
                              <p className="text-xs text-slate-800">Retrieve a full document details representing the specific shipment record.</p>
                            </div>

                            {/* Endpoint 4 */}
                            <div className="space-y-2 bg-slate-950/40 p-5 rounded-2xl border border-slate-900">
                              <div className="flex items-center gap-2">
                                <span className="bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px] px-2 py-0.5 rounded uppercase">POST</span>
                                <span className="font-mono text-xs font-bold text-white">/api/v1/shipments/:id/pin</span>
                              </div>
                              <p className="text-xs text-slate-800">Regenerate and return a new 4-digit secure Pickup PIN. Useful if a customer misplaces their SMS pickup code.</p>
                            </div>

                            {/* WeSabiDispatch Endpoint */}
                            <div className="space-y-2 bg-slate-950/40 p-5 rounded-2xl border border-slate-900">
                              <div className="flex items-center gap-2">
                                <span className="bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px] px-2 py-0.5 rounded uppercase">POST</span>
                                <span className="font-mono text-xs font-bold text-white">/api/v1/dispatch/assign</span>
                              </div>
                              <p className="text-xs text-slate-800">Request active pickup from independent WeSabiDispatch riders. System automatically queries regional riders with premium Trust Scores.</p>
                              <p className="text-[10px] text-slate-900 font-bold uppercase tracking-wider mb-1 pt-2">Payload Body Shape:</p>
                              <pre className="p-3 bg-slate-950 rounded-xl border border-slate-900 text-[10px] font-mono text-slate-300 overflow-x-auto">
{`{
  "shipmentId": "WSH-API-123456",
  "dispatchMethod": "WESABI_DISPATCH", // or "THIRD_PARTY_3PL" or "SELF_DELIVERY"
  "maxRiderTransitRating": 4.5
}`}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </div>
          )}

        </div>
      </div>
    </PublicLayout>
  );
};
