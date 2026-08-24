import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Code,
  Key,
  Globe,
  Activity,
  Cpu,
  Terminal,
  Zap,
  BookOpen,
  ArrowRight,
  Shield,
  Server,
  Cloud,
  FileCode,
  ExternalLink,
  Layers
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { useAuth } from '@/src/context/AuthContext';
import { Link } from 'react-router-dom';

import { toast } from 'sonner';
import { developerProfileRepository } from '@/src/services/db/DeveloperProfileRepository';
import { webhookLogRepository } from '@/src/services/db/WebhookLogRepository';
import { DeveloperProfile, WebhookLog } from '@/src/types';

export const DeveloperDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);

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

      const appRes = await fetch('/api/v1/developer/applications').catch(() => null);
      if (appRes && appRes.ok) {
        const appJson = await appRes.json();
        if (appJson.applications) setApplications(appJson.applications);
      }

      setProfile(pData);
      setLogs(lData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5));
    } catch (err) {
      console.error('Failed to fetch developer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    apiRequests: applications.reduce((acc, a) => acc + (a.apiCallCount || 0), profile?.apiCallCount || 0).toString(),
    uptime: '99.9%',
    webhooksSent: logs.length.toString(),
    avgLatency: logs.length > 0 ? `${Math.round(logs.reduce((acc, l) => acc + (l.duration || 0), 0) / logs.length)}ms` : '18ms'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-10 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold uppercase tracking-widest text-[10px]">
            <Terminal size={12} /> OmorfiHub Developer Console
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight font-display">
            Welcome, <span className="text-primary-600">{user?.displayName?.split(' ')[0] || 'Builder'}</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Build logistics integrations with OmorfiHub APIs.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs h-11 px-6" asChild>
             <Link to="/api"><BookOpen size={16} className="mr-2" /> Developer Documentation</Link>
          </Button>
          <Button className="rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs h-11 px-6 shadow-lg shadow-primary-500/20" asChild>
             <Link to="/api"><Zap size={16} className="mr-2" /> Sandbox Tester</Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total API Requests', value: stats.apiRequests, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'System Uptime', value: stats.uptime, icon: Cloud, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { label: 'Webhooks Dispatched', value: stats.webhooksSent, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
          { label: 'Avg. Latency', value: stats.avgLatency, icon: Cpu, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
        ].map((stat, i) => (
          <Card key={i} className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-primary-500/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2.5 rounded-xl", stat.bg)}>
                <stat.icon className={stat.color} size={20} />
              </div>
              <Badge variant="outline" className="text-[10px] border-slate-100 dark:border-slate-800">Real-time</Badge>
            </div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-display">{stat.value}</h3>
          </Card>
        ))}
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* API & Webhooks */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to="/api">
              <Card className="p-8 border-slate-200 dark:border-slate-800 hover:border-primary-500 group transition-all h-full bg-white dark:bg-slate-900 overflow-hidden relative">
                <div className="relative z-10 space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl w-fit group-hover:bg-primary-600 group-hover:text-white transition-all">
                    <Key size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white font-display">API Credentials</h3>
                    <p className="text-slate-500 text-sm mt-2">Manage production and sandbox credentials securely.</p>
                  </div>
                  <div className="flex items-center text-primary-600 font-bold text-sm group-hover:gap-2 transition-all">
                    Manage Applications <ArrowRight size={16} />
                  </div>
                </div>
                <Code className="absolute -right-8 -bottom-8 w-40 h-40 text-slate-50 dark:text-slate-800/20 group-hover:scale-110 transition-transform pointer-events-none" />
              </Card>
            </Link>

            <Link to="/api">
              <Card className="p-8 border-slate-200 dark:border-slate-800 hover:border-primary-500 group transition-all h-full bg-white dark:bg-slate-900 overflow-hidden relative">
                <div className="relative z-10 space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl w-fit group-hover:bg-primary-600 group-hover:text-white transition-all">
                    <Globe size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white font-display">Webhooks &amp; HMAC</h3>
                    <p className="text-slate-500 text-sm mt-2">Configure real-time event notifications for your system.</p>
                  </div>
                  <div className="flex items-center text-primary-600 font-bold text-sm group-hover:gap-2 transition-all">
                    Configure Webhooks <ArrowRight size={16} />
                  </div>
                </div>
                <Zap className="absolute -right-8 -bottom-8 w-40 h-40 text-slate-50 dark:text-slate-800/20 group-hover:scale-110 transition-transform pointer-events-none" />
              </Card>
            </Link>
          </div>

          <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <Server size={20} className="text-primary-600" /> Recent Activity Logs
              </h3>
              <Button variant="ghost" className="text-xs font-bold text-slate-400 hover:text-primary-600" asChild>
                <Link to="/api">View Sandbox Logs</Link>
              </Button>
            </div>
            <div className="space-y-4">
              {logs.length === 0 ? (
                <div className="p-12 text-center text-slate-500 italic text-sm">No recent activity logs recorded.</div>
              ) : logs.map((log, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-black",
                      log.status >= 400 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                    )}>
                      {log.event} {log.status}
                    </span>
                    <div>
                      <p className="text-sm font-mono text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{log.url}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(log.timestamp || '').toLocaleTimeString()}</p>
                    <p className="text-[10px] text-slate-500">{log.duration || 0}ms</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6 bg-slate-900 text-white border-none rounded-3xl overflow-hidden relative">
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Shield size={20} className="text-primary-400" />
                 </div>
                 <h4 className="font-bold">Security Status</h4>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <span className="text-sm text-slate-400">Sandbox Environment</span>
                   <Badge variant="success" className="bg-emerald-500/20 text-emerald-400 border-none">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-sm text-slate-400">Rate Limiting</span>
                   <Badge variant="info" className="bg-blue-500/20 text-blue-400 border-none">Enforced</Badge>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-sm text-slate-400">Production Access</span>
                   <Badge variant={profile?.status === 'APPROVED' ? 'success' : 'warning'} className={cn("border-none", profile?.status === 'APPROVED' ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400")}>
                      {profile?.status || 'PENDING'}
                   </Badge>
                </div>
              </div>
              <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold py-6" asChild>
                <Link to="/api">Launch Developer Portal</Link>
              </Button>
            </div>
          </Card>

          <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl">
            <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <FileCode size={18} className="text-primary-600" /> Quick Documentation
            </h4>
            <div className="space-y-3">
              {[
                { title: 'OmorfiHub API Manual', link: '/api' },
                { title: 'Sandbox Tester Suite', link: '/api' },
                { title: 'Webhooks Verification', link: '/api' }
              ].map((res, i) => (
                <Link key={i} to={res.link} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-medium group-hover:text-primary-600">{res.title}</span>
                  <ExternalLink size={14} className="text-slate-300 group-hover:text-primary-600" />
                </Link>
              ))}
            </div>
          </Card>

          <div className="p-6 rounded-3xl bg-primary-600 text-white relative overflow-hidden group space-y-2">
            <h4 className="font-bold">OmorfiHub API Engine</h4>
            <p className="text-primary-100 text-xs">OmorfiHub is a product of Omorfi Limited</p>
            <Button className="bg-white text-primary-600 hover:bg-slate-100 rounded-xl text-xs font-bold mt-4 px-6 h-10" asChild>
              <Link to="/api">Open Console</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
