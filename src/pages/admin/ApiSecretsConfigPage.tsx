import React, { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  Save,
  RefreshCcw,
  Lock,
  Globe,
  Bot,
  CreditCard,
  MessageSquare,
  Truck,
  Database,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { configurationEngine, auditEngine } from '@/src/engines';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { toast } from 'sonner';

export interface SystemSecrets {
  geminiApiKey: string;
  googleMapsApiKey: string;
  firebaseConfig: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
    apiKey: string;
    authDomain: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  webhookSecrets: {
    omorfiWebhookSecret: string;
    paystackSecretKey: string;
    flutterwaveSecretKey: string;
  };
  providerSecrets: {
    telegramBotToken: string;
    telegramChatId: string;
    smsApiKey: string;
    emailApiKey: string;
  };
  logisticsMarkup: {
    markupPercentage: number;
    minMarkupAmount: number;
  };
}

export const ApiSecretsConfigPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Mask toggle states for each field key
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const [secrets, setSecrets] = useState<SystemSecrets>({
    geminiApiKey: '',
    googleMapsApiKey: '',
    firebaseConfig: {
      projectId: '',
      clientEmail: '',
      privateKey: '',
      apiKey: '',
      authDomain: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
    },
    webhookSecrets: {
      omorfiWebhookSecret: '',
      paystackSecretKey: '',
      flutterwaveSecretKey: '',
    },
    providerSecrets: {
      telegramBotToken: '',
      telegramChatId: '',
      smsApiKey: '',
      emailApiKey: '',
    },
    logisticsMarkup: {
      markupPercentage: 10,
      minMarkupAmount: 200,
    },
  });

  const fetchSecrets = async () => {
    setLoading(true);
    try {
      // Load primary secrets document: systemSettings/secrets
      const docRef = doc(db, 'systemSettings', 'secrets');
      const snap = await getDoc(docRef);

      // Also check systemSettings/global fallback if geminiApiKey or maps key exists there
      const globalRef = doc(db, 'systemSettings', 'global');
      const globalSnap = await getDoc(globalRef);

      let fetchedData: Partial<SystemSecrets> = {};
      if (snap.exists()) {
        fetchedData = snap.data() as Partial<SystemSecrets>;
      }

      const globalData = globalSnap.exists() ? globalSnap.data() : {};

      setSecrets(prev => ({
        ...prev,
        ...fetchedData,
        geminiApiKey: fetchedData.geminiApiKey || globalData.geminiApiKey || prev.geminiApiKey,
        googleMapsApiKey: fetchedData.googleMapsApiKey || globalData.googleMapsApiKey || prev.googleMapsApiKey,
        firebaseConfig: {
          ...prev.firebaseConfig,
          ...(fetchedData.firebaseConfig || {}),
        },
        webhookSecrets: {
          ...prev.webhookSecrets,
          ...(fetchedData.webhookSecrets || {}),
        },
        providerSecrets: {
          ...prev.providerSecrets,
          ...(fetchedData.providerSecrets || {}),
        },
        logisticsMarkup: {
          ...prev.logisticsMarkup,
          ...(fetchedData.logisticsMarkup || {}),
        },
      }));
    } catch (err: any) {
      console.error('Failed to load system secrets from Firestore:', err);
      toast.error('Failed to load secrets from Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecrets();
  }, []);

  const toggleShowSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      const payload = {
        ...secrets,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.email || 'SUPER_ADMIN',
      };

      // 1. Direct Firestore write to systemSettings/secrets
      await setDoc(doc(db, 'systemSettings', 'secrets'), payload, { merge: true });

      // 2. Also fallback update systemSettings/global for legacy resolution if geminiApiKey is set
      try {
        await setDoc(doc(db, 'systemSettings', 'global'), {
          geminiApiKey: secrets.geminiApiKey,
          googleMapsApiKey: secrets.googleMapsApiKey,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (globalErr) {
        console.warn('Could not mirror geminiApiKey to systemSettings/global:', globalErr);
      }

      // 3. Fallback engine persistence call
      try {
        await configurationEngine.updateSystemSettings('secrets', payload);
      } catch (engErr) {
        console.warn('ConfigurationEngine.updateSystemSettings secrets fallback warning:', engErr);
      }

      // 4. Log audit event
      await auditEngine.logEvent({
        userId: auth.currentUser?.uid || 'admin',
        action: 'UPDATE_SYSTEM_SECRETS',
        details: { fieldsUpdated: Object.keys(secrets) },
        result: 'SUCCESS'
      });

      setSaveStatus({ type: 'success', message: 'System Secrets and API keys updated successfully!' });
      toast.success('System Secrets and API keys updated successfully!');
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: any) {
      console.error('Error saving system secrets:', err);
      setSaveStatus({ type: 'error', message: err.message || 'Failed to update system secrets.' });
      toast.error(err.message || 'Failed to update system secrets.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
          <RefreshCcw className="animate-spin text-primary-600 mb-4" size={36} />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
            Loading System Secrets Vault...
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-6 z-40">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Lock size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black dark:text-white font-display tracking-tight uppercase italic text-amber-600">
                API Secrets & Infrastructure Configuration
              </h1>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Manage system API keys, Firebase service accounts, webhooks, and rate markups securely.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={fetchSecrets}
              variant="outline"
              className="rounded-xl px-4 py-2.5 font-bold text-xs"
            >
              <RefreshCcw size={16} className="mr-2" /> Refresh
            </Button>
            <Button
              onClick={handleSave}
              isLoading={saving}
              className="px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/10 font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Save size={16} className="mr-2" /> Save Secret Vault
            </Button>
          </div>
        </div>

        {saveStatus && (
          <Alert variant={saveStatus.type === 'success' ? 'success' : 'error'} className="rounded-2xl border-2">
            {saveStatus.message}
          </Alert>
        )}

        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-start gap-3">
          <ShieldCheck className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div className="text-xs text-amber-900 dark:text-amber-300 space-y-1">
            <p className="font-bold">Super Admin Vault Security Notice:</p>
            <p>
              Secret keys and service account credentials configured here are protected by Firestore Security Rules restricting client reads strictly to authenticated Super Admin sessions (<code>isPlatformAdmin()</code>). Private keys are masked by default to prevent shoulder-surfing.
            </p>
          </div>
        </div>

        {/* SECRETS CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CARD 1: AI & GEOLOCATION API KEYS */}
          <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3 font-display">
                <Bot className="text-amber-600" size={20} />
                <h3 className="font-bold dark:text-white text-base">AI & Geolocation API Keys</h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">REAL-TIME RESOLUTION</Badge>
            </div>

            <div className="space-y-4">
              {/* GEMINI API KEY */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest block">
                    Google Gemini AI API Key (geminiApiKey)
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleShowSecret('geminiApiKey')}
                    className="text-slate-500 hover:text-slate-700 text-xs flex items-center gap-1 font-bold"
                  >
                    {showSecrets.geminiApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showSecrets.geminiApiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showSecrets.geminiApiKey ? 'text' : 'password'}
                  value={secrets.geminiApiKey}
                  onChange={e => setSecrets({ ...secrets, geminiApiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-mono dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[9px] text-slate-500">
                  Powers the Omorfi AI Chatbot, document scanning, and delivery estimation engines.
                </p>
              </div>

              {/* GOOGLE MAPS API KEY */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest block">
                    Google Maps Platform API Key (googleMapsApiKey)
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleShowSecret('googleMapsApiKey')}
                    className="text-slate-500 hover:text-slate-700 text-xs flex items-center gap-1 font-bold"
                  >
                    {showSecrets.googleMapsApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showSecrets.googleMapsApiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showSecrets.googleMapsApiKey ? 'text' : 'password'}
                  value={secrets.googleMapsApiKey}
                  onChange={e => setSecrets({ ...secrets, googleMapsApiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-mono dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[9px] text-slate-500">
                  Used for address autocomplete, live rider tracking, and distance calculations.
                </p>
              </div>
            </div>
          </Card>

          {/* CARD 2: WEBHOOK SECRETS & MARKS */}
          <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 font-display">
              <div className="flex items-center gap-3">
                <Key className="text-amber-600" size={20} />
                <h3 className="font-bold dark:text-white text-base">Webhook Secrets & Rate Markups</h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">HMAC SHA-256</Badge>
            </div>

            <div className="space-y-4">
              {/* OMORFI WEBHOOK SECRET */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest block">
                    System Webhook Signature Secret (omorfiWebhookSecret)
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleShowSecret('omorfiWebhookSecret')}
                    className="text-slate-500 hover:text-slate-700 text-xs flex items-center gap-1 font-bold"
                  >
                    {showSecrets.omorfiWebhookSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showSecrets.omorfiWebhookSecret ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showSecrets.omorfiWebhookSecret ? 'text' : 'password'}
                  value={secrets.webhookSecrets.omorfiWebhookSecret}
                  onChange={e => setSecrets({
                    ...secrets,
                    webhookSecrets: { ...secrets.webhookSecrets, omorfiWebhookSecret: e.target.value }
                  })}
                  placeholder="whsec_..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-mono dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[9px] text-slate-500">
                  Used to sign outgoing webhooks with X-OmorfiHub-Signature header.
                </p>
              </div>

              {/* LOGISTICS RATE MARKUPS */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest block">
                    Logistics Markup (%)
                  </label>
                  <input
                    type="number"
                    value={secrets.logisticsMarkup.markupPercentage}
                    onChange={e => setSecrets({
                      ...secrets,
                      logisticsMarkup: { ...secrets.logisticsMarkup, markupPercentage: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-bold dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest block">
                    Min Markup Amount (₦)
                  </label>
                  <input
                    type="number"
                    value={secrets.logisticsMarkup.minMarkupAmount}
                    onChange={e => setSecrets({
                      ...secrets,
                      logisticsMarkup: { ...secrets.logisticsMarkup, minMarkupAmount: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-bold dark:text-white"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* CARD 3: FIREBASE CONFIGURATION & SERVICE ACCOUNT */}
          <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 font-display">
              <div className="flex items-center gap-3">
                <Database className="text-amber-600" size={20} />
                <h3 className="font-bold dark:text-white text-base">Firebase Infrastructure Credentials</h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">FIREBASE ADMIN SDK</Badge>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Copy these fields exactly as formatted in your Firebase Project Console / Service Account JSON file.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest block">
                  Project ID (projectId)
                </label>
                <input
                  type="text"
                  value={secrets.firebaseConfig.projectId}
                  onChange={e => setSecrets({
                    ...secrets,
                    firebaseConfig: { ...secrets.firebaseConfig, projectId: e.target.value }
                  })}
                  placeholder="wesabibookcare-d0ceb"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-mono dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest block">
                  Client Email (clientEmail)
                </label>
                <input
                  type="text"
                  value={secrets.firebaseConfig.clientEmail}
                  onChange={e => setSecrets({
                    ...secrets,
                    firebaseConfig: { ...secrets.firebaseConfig, clientEmail: e.target.value }
                  })}
                  placeholder="firebase-adminsdk-xxx@..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-mono dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest block">
                  Web API Key (apiKey)
                </label>
                <div className="relative">
                  <input
                    type={showSecrets.firebaseApiKey ? 'text' : 'password'}
                    value={secrets.firebaseConfig.apiKey}
                    onChange={e => setSecrets({
                      ...secrets,
                      firebaseConfig: { ...secrets.firebaseConfig, apiKey: e.target.value }
                    })}
                    placeholder="AIzaSy..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-mono dark:text-white pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowSecret('firebaseApiKey')}
                    className="absolute right-2 top-2.5 text-slate-500 hover:text-slate-700 text-xs font-bold"
                  >
                    {showSecrets.firebaseApiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 lg:col-span-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest block">
                    Firebase Private Key (privateKey)
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleShowSecret('firebasePrivateKey')}
                    className="text-slate-500 hover:text-slate-700 text-xs flex items-center gap-1 font-bold"
                  >
                    {showSecrets.firebasePrivateKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showSecrets.firebasePrivateKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                {showSecrets.firebasePrivateKey ? (
                  <textarea
                    rows={4}
                    value={secrets.firebaseConfig.privateKey}
                    onChange={e => setSecrets({
                      ...secrets,
                      firebaseConfig: { ...secrets.firebaseConfig, privateKey: e.target.value }
                    })}
                    placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgw..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-mono dark:text-white leading-relaxed"
                  />
                ) : (
                  <input
                    type="password"
                    value={secrets.firebaseConfig.privateKey}
                    onChange={e => setSecrets({
                      ...secrets,
                      firebaseConfig: { ...secrets.firebaseConfig, privateKey: e.target.value }
                    })}
                    placeholder="••••••••••••••••••••••••••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-mono dark:text-white"
                  />
                )}
              </div>
            </div>
          </Card>

          {/* CARD 4: PAYMENT GATEWAY SECRETS */}
          <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 font-display">
              <div className="flex items-center gap-3">
                <CreditCard className="text-amber-600" size={20} />
                <h3 className="font-bold dark:text-white text-base">Payment Gateway API Keys</h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">PAYSTACK & FLUTTERWAVE</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest block">
                    Paystack Secret Key (paystackSecretKey)
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleShowSecret('paystackSecretKey')}
                    className="text-slate-500 hover:text-slate-700 text-xs flex items-center gap-1 font-bold"
                  >
                    {showSecrets.paystackSecretKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showSecrets.paystackSecretKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showSecrets.paystackSecretKey ? 'text' : 'password'}
                  value={secrets.webhookSecrets.paystackSecretKey}
                  onChange={e => setSecrets({
                    ...secrets,
                    webhookSecrets: { ...secrets.webhookSecrets, paystackSecretKey: e.target.value }
                  })}
                  placeholder="sk_live_... or sk_test_..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-mono dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest block">
                    Flutterwave Secret Key (flutterwaveSecretKey)
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleShowSecret('flutterwaveSecretKey')}
                    className="text-slate-500 hover:text-slate-700 text-xs flex items-center gap-1 font-bold"
                  >
                    {showSecrets.flutterwaveSecretKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showSecrets.flutterwaveSecretKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showSecrets.flutterwaveSecretKey ? 'text' : 'password'}
                  value={secrets.webhookSecrets.flutterwaveSecretKey}
                  onChange={e => setSecrets({
                    ...secrets,
                    webhookSecrets: { ...secrets.webhookSecrets, flutterwaveSecretKey: e.target.value }
                  })}
                  placeholder="FLWSECK_..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-mono dark:text-white"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ApiSecretsConfigPage;
