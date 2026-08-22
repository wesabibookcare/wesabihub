import React, { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  Search,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  ExternalLink,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Settings2,
  Activity,
  History,
  Trash2,
  RefreshCcw,
  Play
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { useAuth } from '@/src/context/AuthContext';
import { Link } from 'react-router-dom';

import { toast } from 'sonner';
import { developerProfileRepository } from '@/src/services/db/DeveloperProfileRepository';
import { webhookLogRepository } from '@/src/services/db/WebhookLogRepository';
import { integrationEngine } from '@/src/engines/IntegrationEngine';
import { DeveloperProfile, WebhookLog } from '@/src/types';

export const WebhooksPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pData, lData] = await Promise.all([
        developerProfileRepository.getById(user!.uid),
        webhookLogRepository.query([{ field: 'userId', operator: '==', value: user!.uid }])
      ]);
      setProfile(pData);
      setLogs(lData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10));
    } catch (err) {
      console.error('Failed to fetch webhook data:', err);
      toast.error('Failed to load webhook configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEndpoint = async () => {
    if (!newUrl || !user) return;
    try {
      await integrationEngine.registerWebhook(user.uid, 'DEVELOPER', newUrl);
      await fetchData();
      setShowCreate(false);
      setNewUrl('');
      toast.success('Webhook endpoint registered');
    } catch (err) {
      toast.error('Failed to register webhook');
    }
  };

  const handleTestWebhook = async () => {
    if (!profile?.webhookUrl || !user) {
      toast.error('Please configure a webhook URL first');
      return;
    }
    try {
      setIsTesting(true);
      await integrationEngine.testWebhook(user.uid, 'DEVELOPER', profile.webhookUrl);
      await fetchData();
      toast.success('Test webhook dispatched');
    } catch (err) {
      toast.error('Failed to dispatch test webhook');
    } finally {
      setIsTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-10 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const webhooks = profile?.webhookUrl ? [
    {
      id: 'primary',
      url: profile.webhookUrl,
      events: ['shipment.created', 'shipment.updated', 'payment.secured', 'parcel.delivered'],
      status: profile.status === 'APPROVED' ? 'ACTIVE' : 'INACTIVE',
      lastDelivery: logs.length > 0 ? new Date(logs[0].createdAt || '').toLocaleTimeString() : 'Never',
      successRate: '100%'
    }
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <Link to="/developer" className="inline-flex items-center gap-2 text-primary-600 font-bold text-xs hover:gap-3 transition-all mb-4">
             <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight font-display">Webhooks</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Receive real-time event notifications directly in your application.</p>
        </div>
        <div className="flex flex-col gap-4">
          <Button onClick={() => setShowCreate(!showCreate)} className="rounded-xl bg-slate-900 text-white hover:bg-black font-bold h-12 px-6 shadow-xl shadow-slate-900/10">
            <Plus size={18} className="mr-2" /> {profile?.webhookUrl ? 'Update Endpoint' : 'Create Endpoint'}
          </Button>
          {showCreate && (
            <Card className="p-4 border-slate-200 bg-white shadow-lg space-y-4">
              <Input
                placeholder="https://your-api.com/webhook"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="h-11"
              />
              <div className="flex gap-2">
                <Button onClick={handleCreateEndpoint} className="flex-1">Save Endpoint</Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
           {/* Webhook Endpoints */}
           <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                    <Globe size={20} className="text-primary-600" /> Endpoints
                 </h3>
                 <Badge variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-400">{webhooks.length} Active</Badge>
              </div>

              {webhooks.map((hook) => (
                <Card key={hook.id} className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:shadow-lg transition-all">
                   <div className="space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                         <div className="flex items-center gap-4">
                            <div className={cn(
                              "p-2.5 rounded-xl",
                              hook.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                            )}>
                               <Zap size={20} />
                            </div>
                            <div>
                               <h4 className="text-sm font-black text-slate-900 dark:text-white truncate max-w-md">{hook.url}</h4>
                               <div className="flex items-center gap-3 mt-1">
                                  <Badge variant="success" className="bg-emerald-50 text-emerald-600 border-none text-[10px] font-bold">Success Rate {hook.successRate}</Badge>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                     <Clock size={10} /> {hook.lastDelivery !== 'Never' ? `Last delivered ${hook.lastDelivery}` : 'No deliveries yet'}
                                  </span>
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="h-9 px-3 rounded-lg text-slate-400 hover:text-primary-600" onClick={fetchData}>
                               <RefreshCcw size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-9 px-3 rounded-lg text-slate-400 hover:text-primary-600" onClick={() => setShowCreate(true)}>
                               <Settings2 size={16} />
                            </Button>
                         </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                         {hook.events.map((event, i) => (
                           <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold rounded-md uppercase tracking-wider">
                              {event}
                           </span>
                         ))}
                      </div>
                   </div>
                </Card>
              ))}
           </div>

           {/* Delivery Logs */}
           <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                    <History size={20} className="text-primary-600" /> Delivery History
                 </h3>
                 <Button variant="ghost" className="text-xs font-bold text-slate-400 hover:text-primary-600" onClick={fetchData}>Refresh Logs</Button>
              </div>

              <Card className="border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                 <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {logs.length === 0 ? (
                      <div className="p-12 text-center text-slate-500 italic text-sm">No delivery attempts recorded yet.</div>
                    ) : logs.map((log) => (
                      <div key={log.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between group">
                         <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-1.5 h-8 rounded-full",
                              log.statusCode === 200 ? "bg-emerald-500" : "bg-red-500"
                            )} />
                            <div>
                               <div className="flex items-center gap-3">
                                  <span className="text-xs font-black text-slate-900 dark:text-white font-mono uppercase tracking-widest">{log.event}</span>
                                  <span className={cn(
                                    "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                    log.statusCode === 200 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                  )}>
                                     {log.statusCode}
                                  </span>
                               </div>
                               <p className="text-[10px] text-slate-500 font-medium truncate max-w-xs">{log.url}</p>
                            </div>
                         </div>
                         <div className="text-right flex items-center gap-6">
                            <div className="hidden sm:block">
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(log.createdAt || '').toLocaleTimeString()}</p>
                               <p className="text-[10px] text-slate-500">{log.duration}ms</p>
                            </div>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 rounded-lg">
                               <ChevronRight size={16} />
                            </Button>
                         </div>
                      </div>
                    ))}
                 </div>
              </Card>
           </div>
        </div>

        {/* Sidebar / Tools */}
        <div className="space-y-8">
           <Card className="p-8 bg-slate-900 text-white border-none rounded-3xl space-y-6 relative overflow-hidden">
              <div className="relative z-10 space-y-6">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                       <Activity size={20} className="text-primary-400" />
                    </div>
                    <h4 className="font-bold">Test Webhook</h4>
                 </div>
                 <p className="text-xs text-slate-400 leading-relaxed">
                    Send a test payload to your configured endpoint to verify your server is receiving events correctly.
                 </p>
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Endpoint</label>
                       <div className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-4 text-sm text-white flex items-center truncate">
                          {profile?.webhookUrl || 'No endpoint configured'}
                       </div>
                    </div>
                    <Button
                      onClick={handleTestWebhook}
                      disabled={isTesting || !profile?.webhookUrl}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold h-11 rounded-xl"
                    >
                       {isTesting ? <Loader2 size={16} className="animate-spin mr-2" /> : <Play size={16} className="mr-2" />}
                       Dispatch Test Event
                    </Button>
                 </div>
              </div>
           </Card>

           <div className="space-y-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 pl-4">Available Events</h4>
              <div className="space-y-2">
                 {[
                   { name: 'shipment.created', desc: 'Triggered when a new shipment is created.' },
                   { name: 'shipment.updated', desc: 'Triggered when shipment status changes.' },
                   { name: 'payment.secured', desc: 'Triggered when SafePay funds are verified.' },
                   { name: 'parcel.delivered', desc: 'Triggered upon final delivery to customer.' },
                   { name: 'parcel.returned', desc: 'Triggered when a return is initiated.' },
                 ].map((event, i) => (
                   <div key={i} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <p className="text-xs font-black text-slate-900 dark:text-white font-mono tracking-wider">{event.name}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{event.desc}</p>
                   </div>
                 ))}
              </div>
              <Button variant="ghost" className="w-full text-xs font-bold text-primary-600 hover:bg-primary-50">
                 View Event Reference <ExternalLink size={14} className="ml-2" />
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
