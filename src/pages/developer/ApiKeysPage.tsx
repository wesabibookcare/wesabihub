import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import {
  Key,
  Copy,
  RefreshCcw,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock,
  ArrowLeft,
  Globe
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { useAuth } from '@/src/context/AuthContext';
import { Link } from 'react-router-dom';

import { developerProfileRepository } from '@/src/services/db/DeveloperProfileRepository';
import { integrationEngine } from '@/src/engines/IntegrationEngine';
import { DeveloperProfile } from '@/src/types';

export const ApiKeysPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await developerProfileRepository.getById(user!.uid);
      setProfile(data);
    } catch (err) {
      console.error('Failed to fetch developer profile:', err);
      toast.error('Failed to load API credentials');
    } finally {
      setLoading(false);
    }
  };

  const toggleShowKey = () => {
    setShowKey(!showKey);
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('API Key copied to clipboard!');
  };

  const generateNewKey = async () => {
    if (!user) return;
    try {
      setIsGenerating(true);
      const newKey = await integrationEngine.generateApiKey(user.uid, 'DEVELOPER');
      await fetchProfile();
      toast.success('New API Key generated successfully!');
    } catch (err) {
      console.error('Failed to generate key:', err);
      toast.error('Failed to generate API key');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-10 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const keys = profile?.apiKey ? [
    {
      id: 'primary',
      name: 'Primary API Key',
      key: profile.apiKey,
      status: 'ACTIVE',
      type: 'PRODUCTION',
      lastUsed: 'Recently',
      createdAt: new Date(profile.updatedAt || Date.now()).toLocaleDateString()
    }
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <Link to="/developer" className="inline-flex items-center gap-2 text-primary-600 font-bold text-xs hover:gap-3 transition-all mb-4">
             <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight font-display">API Credentials</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your secret keys for authentication and integration.</p>
        </div>
        <Button
          onClick={generateNewKey}
          disabled={isGenerating}
          className="rounded-xl bg-slate-900 text-white hover:bg-black font-bold h-12 px-6 shadow-xl shadow-slate-900/10"
        >
          {isGenerating ? 'Generating...' : <><Plus size={18} className="mr-2" /> Generate New Key</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Security Notice */}
        <Card className="p-6 border-amber-100 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/30">
          <div className="flex items-start gap-4">
             <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg text-amber-600 dark:text-amber-400">
                <Shield size={20} />
             </div>
             <div>
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">Security Best Practices</h4>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                  Never share your API keys in publicly accessible areas such as GitHub or client-side code. Use server-side environment variables to store your secret keys securely. If a key is compromised, revoke it immediately and generate a new one.
                </p>
             </div>
          </div>
        </Card>

        {/* API Keys List */}
        <div className="space-y-6">
          {keys.map((key) => (
            <Card key={key.id} className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:shadow-xl hover:shadow-slate-200/50 transition-all">
               <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  <div className="flex-1 space-y-4">
                     <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-2xl",
                          key.type === 'PRODUCTION' ? "bg-primary-50 text-primary-600" : "bg-slate-50 text-slate-500"
                        )}>
                          <Key size={24} />
                        </div>
                        <div>
                           <div className="flex items-center gap-3">
                              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{key.name}</h3>
                              <Badge className={cn(
                                "border-none px-3 py-1 font-bold text-[10px] uppercase tracking-wider",
                                key.type === 'PRODUCTION' ? "bg-primary-600 text-white" : "bg-slate-900 text-white"
                              )}>
                                {key.type}
                              </Badge>
                              {key.status === 'ACTIVE' ? (
                                <Badge variant="success" className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold">Active</Badge>
                              ) : (
                                <Badge className="bg-slate-50 text-slate-400 border-slate-100 font-bold">Inactive</Badge>
                              )}
                           </div>
                           <p className="text-xs text-slate-400 font-medium mt-1">Created on {key.createdAt} • Last used {key.lastUsed}</p>
                        </div>
                     </div>

                     <div className="relative group max-w-2xl">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                           <Lock size={16} className="text-slate-300" />
                        </div>
                        <Input
                          readOnly
                          value={showKey ? key.key : '••••••••••••••••••••••••••••••••'}
                          className="pl-12 pr-24 font-mono text-sm h-14 bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 rounded-xl"
                        />
                        <div className="absolute inset-y-0 right-2 flex items-center gap-2">
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={toggleShowKey}
                             className="h-10 w-10 p-0 text-slate-400 hover:text-primary-600"
                           >
                              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                           </Button>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => copyToClipboard(key.key)}
                             className="h-10 w-10 p-0 text-slate-400 hover:text-primary-600"
                           >
                              <Copy size={18} />
                           </Button>
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-row lg:flex-col items-center gap-3 w-full lg:w-48 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 pt-6 lg:pt-0 lg:pl-8">
                     <Button
                        variant="outline"
                        className="flex-1 lg:w-full border-slate-200 text-slate-600 font-bold text-xs h-12 rounded-xl"
                        onClick={generateNewKey}
                        disabled={isGenerating}
                      >
                        <RefreshCcw size={16} className={cn("mr-2", isGenerating && "animate-spin")} /> Roll Key
                     </Button>
                     <Button variant="ghost" className="flex-1 lg:w-full text-red-500 hover:text-red-600 hover:bg-red-50 font-bold text-xs h-12 rounded-xl">
                        <Trash2 size={16} className="mr-2" /> Revoke
                     </Button>
                  </div>
               </div>
            </Card>
          ))}
        </div>

        {/* IP Whitelisting */}
        <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="space-y-1">
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">IP Whitelisting</h3>
                 <p className="text-sm text-slate-500">Restricts API access to specific IP addresses for enhanced security.</p>
              </div>
              <Button variant="outline" className="rounded-xl border-slate-200 font-bold text-xs h-11 px-6">
                 <Plus size={16} className="mr-2" /> Add IP Address
              </Button>
           </div>

           <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-6 text-center border border-dashed border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                 <Globe size={24} />
              </div>
              <h4 className="font-bold text-slate-400">No IPs whitelisted</h4>
              <p className="text-xs text-slate-500 mt-1">API calls will be accepted from any IP address.</p>
           </div>
        </Card>
      </div>
    </div>
  );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
