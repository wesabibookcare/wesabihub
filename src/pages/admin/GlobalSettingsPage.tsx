import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Key,
  QrCode,
  Camera,
  MapPin,
  Activity,
  CheckSquare,
  Info,
  Settings,
  Globe,
  Layout,
  List,
  Flag,
  CreditCard,
  FileText,
  Bot,
  Zap,
  Save,
  RefreshCcw,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Palette,
  Share2,
  Mail,
  Phone,
  Clock,
  Coins,
  History,
  FileSearch,
  MessageSquare,
  AlertCircle,
  Type as TypeIcon,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Search,
  Calendar,
  Building,
  HelpCircle,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { LegalManagementTab } from '../../components/admin/LegalManagementTab';
import { AdminLayout } from '../../layouts/AdminLayout';
import { configurationEngine, auditEngine, notificationEngine } from '@/src/engines';
import { contentEngine } from '../../engines/ContentEngine';
import { FAQ } from '../../services/db/FAQRepository';
import { KnowledgeArticle } from '../../services/db/KnowledgeRepository';
import { SystemSettings, FooterLink } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { SuccessAnimation, ALL_SUCCESS_ANIMATION_STYLES, SuccessAnimationStyle } from '../../components/ui/SuccessAnimation';
import { useSettings } from '../../context/SettingsContext';
import { auth } from '../../lib/firebase';

import { toast } from 'sonner';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

type TabType = 'general' | 'branding' | 'landing' | 'animations' | 'social' | 'company' | 'faq' | 'knowledge' | 'countries' | 'features' | 'legal' | 'contact' | 'communications' | 'maps' | 'payments' | 'logs';

export const GlobalSettingsPage = () => {
  const { settings: globalSettings, loading } = useSettings();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [saveStatus, setSaveStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [activePolicy, setActivePolicy] = useState<string>('privacyPolicy');

  // Enterprise Communication Admin Panel States
  const [commsLogs, setCommsLogs] = useState<any[]>([]);
  const [providerHealths, setProviderHealths] = useState<any[]>([]);
  const [commsSubTab, setCommsSubTab] = useState<'providers' | 'templates' | 'logs' | 'health'>('providers');

  // Success Animation Preview State
  const [previewAnimation, setPreviewAnimation] = useState<SuccessAnimationStyle | null>(null);

  useEffect(() => {
    if (globalSettings) {
      const mergedSettings = {
        ...globalSettings,
        companyPages: {
          aboutUs: '',
          howItWorks: '',
          solutions: '',
          forMerchants: '',
          becomeHub: '',
          pricing: '',
          contactUs: '',
          ...globalSettings.companyPages
        },
        contactInfo: {
          supportEmail: globalSettings.supportEmail || '',
          supportPhone: globalSettings.supportPhone || '',
          customerCareEmail: '',
          officeAddresses: [],
          businessHours: '',
          ...globalSettings.contactInfo
        },
        featureFlags: {
          paymentProtection: true,
          weSabiChat: true,
          qrVerification: true,
          barcodeVerification: true,
          storage: true,
          returns: true,
          apiPlatform: true,
          googleMaps: true,
          aiCustomerCare: true,
          notifications: true,
          ...globalSettings.featureFlags
        },
        telegramConfig: {
          botToken: '',
          chatId: '',
          enabled: false,
          ...globalSettings.telegramConfig
        },
        smsConfig: {
          provider: 'FALLBACK',
          apiKey: '',
          senderId: 'OmorfiHub',
          enabled: false,
          ...globalSettings.smsConfig
        },
        emailConfig: {
          provider: 'FALLBACK',
          apiKey: '',
          defaultSender: 'no-reply@omorfihub.com',
          enabled: false,
          ...globalSettings.emailConfig
        },
        communicationSettings: {
          notificationLimits: 50,
          retryPolicy: {
            maxAttempts: 3,
            delaySeconds: 10,
          },
          quietHoursStart: '22:00',
          quietHoursEnd: '06:00',
          ...globalSettings.communicationSettings
        },
        notificationTemplates: {
          received: { title: 'Parcel Received', body: 'We have received your parcel {{trackingNumber}} at our hub center.', enabled: true },
          approved: { title: 'Account Approved', body: 'Welcome to OmorfiHub! Your {{role}} role application is approved.', enabled: true },
          rejected: { title: 'Application Rejected', body: 'Your registration application was rejected. Please review feedback.', enabled: true },
          reupload: { title: 'Document Action Needed', body: 'Please reupload document {{docName}} due to compliance issues.', enabled: true },
          suspended: { title: 'Account Suspended', body: 'Your account has been suspended due to policy violations.', enabled: true },
          ...globalSettings.notificationTemplates
        },
        mapsConfig: {
          mapsProvider: 'GOOGLE',
          defaultSearchRadiusKm: 10,
          maxDispatchRadiusKm: 15,
          defaultCountry: 'Nigeria',
          distanceUnits: 'km',
          locationUpdateIntervalMs: 10000,
          geofenceRadiusMeters: 100,
          locationAccuracyThresholdMeters: 15,
          routeDeviationThresholdMeters: 150,
          enableRouteDeviationDetection: true,
          enableLiveRiderTracking: true,
          enableGeofencing: true,
          ...globalSettings.mapsConfig
        },
        paymentConfig: {
          primaryProvider: 'FLUTTERWAVE',
          backupProvider: 'PAYSTACK',
          enabledProviders: ['FLUTTERWAVE', 'PAYSTACK'],
          primarySafePayProvider: 'FLUTTERWAVE',
          primaryPlatformProvider: 'PAYSTACK',
          enableFallback: true,
          allowedFallbackTypes: ['WALLET_FUNDING', 'REGISTRATION_FEE', 'MEMBERSHIP', 'SUBSCRIPTION', 'GENERAL_PLATFORM_CHARGE'],
          retryLimits: 3,
          timeoutDuration: 30,
          paymentMaintenanceMode: false,
          providerPriority: ['PAYSTACK', 'FLUTTERWAVE'],
          supportedCurrencies: ['NGN', 'USD', 'GHS', 'KES'],
          webhookEndpoint: '/api/payment-protection/webhook',
          settlementDelays: 86400,
          refundRules: ['FULL_REFUND', 'PARTIAL_REFUND_WITH_FEE'],
          isFlutterwaveEnabled: true,
          ...globalSettings.paymentConfig
        }
      };
      setSettings(JSON.parse(JSON.stringify(mergedSettings)));
    }
  }, [globalSettings]);

  useEffect(() => {
    if (activeTab === 'logs') {
      auditEngine.getRecentLogs(50).then(setAuditLogs);
    }
    if (activeTab === 'faq') {
      contentEngine.getAllFaqs().then(setFaqs);
    }
    if (activeTab === 'knowledge') {
      contentEngine.getAllArticles().then(setArticles);
    }
    if (activeTab === 'communications') {
      // Fetch stats and subscribe to real-time communication dispatch logs
      const stats = notificationEngine.getProviderHealthStats();
      setProviderHealths(stats);

      const unsubscribe = notificationEngine.subscribeToCommunicationLogs((logs) => {
        setCommsLogs(logs);
      });
      return () => unsubscribe();
    }
  }, [activeTab]);

  if (loading || !settings) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <RefreshCcw className="animate-spin text-primary-500" size={32} />
      </div>
    );
  }

  const handleUpdate = async () => {
    if (!settings) return;
    setIsSaving(true);
    setSaveStatus(null);
    try {
      await configurationEngine.updateSystemSettings('global', settings);

      // Log the change
      await auditEngine.logEvent({ userId: 'admin', action: 'UPDATE_GLOBAL_SETTINGS', details: {}, targetId: 'global', result: 'SUCCESS' });

      setSaveStatus({ type: 'success', message: 'Settings updated successfully!' });
      toast.success('Settings updated successfully!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setSaveStatus({ type: 'error', message: 'Failed to update settings.' });
      toast.error('Failed to update settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateNestedSetting = (section: keyof SystemSettings, field: string, value: any) => {
    setSettings({
      ...settings,
      [section]: {
        ...(settings[section] as any),
        [field]: value
      }
    });
  };

  const updateLandingHero = (field: string, value: any) => {
    setSettings({
      ...settings,
      landingPage: {
        ...settings.landingPage,
        hero: {
          ...settings.landingPage.hero,
          [field]: value
        }
      }
    });
  };

  const updateBranding = (field: string, value: any) => {
    setSettings({
      ...settings,
      branding: {
        ...settings.branding,
        [field]: value
      }
    });
  };

  const updateTypography = (field: string, value: any) => {
    setSettings({
      ...settings,
      branding: {
        ...settings.branding,
        typography: {
          ...settings.branding.typography,
          [field]: value
        }
      }
    });
  };

  const updateSocialLink = (field: string, value: any) => {
    setSettings({
      ...settings,
      socialLinks: {
        ...settings.socialLinks,
        [field]: value
      }
    });
  };

  const updateCountryConfig = (field: string, value: any) => {
    setSettings({
      ...settings,
      countryConfig: {
        ...settings.countryConfig,
        [field]: value
      }
    });
  };

  const updateTaxSettings = (field: string, value: any) => {
    setSettings({
      ...settings,
      countryConfig: {
        ...settings.countryConfig,
        taxSettings: {
          ...settings.countryConfig.taxSettings,
          [field]: value
        }
      }
    });
  };

  const updatePolicy = (field: string, value: any) => {
    setSettings({
      ...settings,
      policies: {
        ...settings.policies,
        [field]: value
      }
    });
  };

  const updateCompanyPage = (field: string, value: any) => {
    setSettings({
      ...settings,
      companyPages: {
        ...settings.companyPages,
        [field]: value
      }
    });
  };

  const updateContactInfo = (field: string, value: any) => {
    setSettings({
      ...settings,
      contactInfo: {
        ...settings.contactInfo,
        [field]: value
      }
    });
  };

  const updateFeatureFlag = (field: string, value: boolean) => {
    setSettings({
      ...settings,
      featureFlags: {
        ...settings.featureFlags,
        [field]: value
      }
    });
  };

  const addFooterLink = () => {
    const newLink: FooterLink = {
      id: Math.random().toString(36).substr(2, 9),
      label: 'New Link',
      href: '#',
      category: 'COMPANY',
      enabled: true,
      order: settings.footer.links.length
    };
    setSettings({
      ...settings,
      footer: {
        ...settings.footer,
        links: [...settings.footer.links, newLink]
      }
    });
  };

  const updateFooterLink = (id: string, field: keyof FooterLink, value: any) => {
    setSettings({
      ...settings,
      footer: {
        ...settings.footer,
        links: settings.footer.links.map(link => link.id === id ? { ...link, [field]: value } : link)
      }
    });
  };

  const deleteFooterLink = (id: string) => {
    setSettings({
      ...settings,
      footer: {
        ...settings.footer,
        links: settings.footer.links.filter(link => link.id !== id)
      }
    });
  };

  const reorderFooterLink = (id: string, direction: 'up' | 'down') => {
    const links = [...settings.footer.links].sort((a, b) => a.order - b.order);
    const index = links.findIndex(l => l.id === id);
    if (direction === 'up' && index > 0) {
      [links[index], links[index - 1]] = [links[index - 1], links[index]];
    } else if (direction === 'down' && index < links.length - 1) {
      [links[index], links[index + 1]] = [links[index + 1], links[index]];
    }
    const updatedLinks = links.map((l, i) => ({ ...l, order: i }));
    setSettings({
      ...settings,
      footer: {
        ...settings.footer,
        links: updatedLinks
      }
    });
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-20">

      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-6 z-40">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
            <Settings size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black dark:text-white font-display tracking-tight uppercase italic text-primary-600">Platform Configuration</h1>
            <p className="text-xs text-slate-900 font-medium">Manage global branding, localisation, and policies.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto max-w-[800px]">
            {(['general', 'branding', 'landing', 'animations', 'social', 'company', 'faq', 'knowledge', 'countries', 'features', 'legal', 'contact', 'communications', 'maps', 'payments', 'logs'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap",
                  activeTab === tab ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs" : "text-slate-900 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          <Button onClick={handleUpdate} isLoading={isSaving} className="px-6 py-2.5 rounded-xl shadow-lg shadow-primary-500/10 font-bold text-xs shrink-0">
            <Save size={16} className="mr-2" /> Save Changes
          </Button>
        </div>
      </div>

      {saveStatus && (
        <Alert variant={saveStatus.type === 'success' ? 'success' : 'error'} className="rounded-2xl border-2 mb-4">
          {saveStatus.message}
        </Alert>
      )}

      {/* TABS CONTENT */}
      <div className="space-y-8">

        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 font-display">
                <Layout className="text-primary-600" size={18} />
                <h3 className="font-bold dark:text-white text-base">Platform Identity</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Platform Name</label>
                  <input
                    value={settings.platformName || ''}
                    onChange={(e) => setSettings({...settings, platformName: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-sans font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Tagline</label>
                  <input
                    value={settings.tagline || ''}
                    onChange={(e) => setSettings({...settings, tagline: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-sans"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Maintenance Mode</h4>
                    <p className="text-[10px] text-slate-900 mt-1">Prevent non-admin users from accessing the platform.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </Card>

            <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 font-display">
                <Globe className="text-primary-600" size={18} />
                <h3 className="font-bold dark:text-white text-base">Global Infrastructure</h3>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
                   <div className="flex items-center gap-3">
                      <Zap className="text-emerald-600" size={16} />
                      <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-400">System Status: Optimal</h4>
                   </div>
                   <p className="text-[10px] text-emerald-700 dark:text-emerald-500 mt-1">All microservices and database nodes are performing within nominal latency thresholds.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">API Environment</label>
                  <Badge variant="outline" className="bg-slate-50 dark:bg-slate-900 font-mono text-[10px]">PRODUCTION-V1.4.2</Badge>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* BRANDING TAB */}
        {activeTab === 'branding' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 font-display">
                  <Palette className="text-primary-600" size={18} />
                  <h3 className="font-bold dark:text-white text-sm">Asset Configuration</h3>
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'logoUrl', label: 'Primary Logo URL' },
                    { key: 'logoDarkUrl', label: 'Dark Logo URL' },
                    { key: 'faviconUrl', label: 'Favicon URL' },
                    { key: 'appIconUrl', label: 'App Icon URL' }
                  ].map((asset) => (
                    <div key={asset.key} className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">{asset.label}</label>
                      <input
                        value={(settings.branding as any)[asset.key] || ''}
                        onChange={(e) => updateBranding(asset.key, e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-mono"
                      />
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 font-display">
                  <TypeIcon className="text-primary-600" size={18} />
                  <h3 className="font-bold dark:text-white text-sm">Typography</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Heading Font</label>
                    <input
                      value={settings.branding?.typography.headingFont || ''}
                      onChange={(e) => updateTypography('headingFont', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-sans"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Body Font</label>
                    <input
                      value={settings.branding?.typography.bodyFont || ''}
                      onChange={(e) => updateTypography('bodyFont', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-sans"
                    />
                  </div>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Primary Colour</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.branding?.primaryColor || '#0F172A'}
                        onChange={(e) => updateBranding('primaryColor', e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer"
                      />
                      <input
                        value={settings.branding?.primaryColor || ''}
                        onChange={(e) => updateBranding('primaryColor', e.target.value)}
                        className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-mono uppercase"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Secondary Colour</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.branding?.secondaryColor || '#3B82F6'}
                        onChange={(e) => updateBranding('secondaryColor', e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer"
                      />
                      <input
                        value={settings.branding?.secondaryColor || ''}
                        onChange={(e) => updateBranding('secondaryColor', e.target.value)}
                        className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                   <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-6">Theme Preview</h4>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-3">
                         <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white">
                            <Zap size={20} />
                         </div>
                         <div className="h-2 w-20 bg-slate-100 rounded" />
                         <div className="h-2 w-12 bg-slate-50 rounded" />
                      </div>
                      <div className="p-6 bg-slate-950 rounded-2xl shadow-sm border border-slate-800 flex flex-col items-center gap-3">
                         <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white">
                            <Zap size={20} />
                         </div>
                         <div className="h-2 w-20 bg-slate-800 rounded" />
                         <div className="h-2 w-12 bg-slate-900 rounded" />
                      </div>
                   </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* SUCCESS ANIMATIONS TAB */}
        {activeTab === 'animations' && (
          <div className="space-y-8">
            <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 font-display">
                <div className="flex items-center gap-3">
                  <Sparkles className="text-primary-600" size={20} />
                  <div>
                    <h3 className="font-bold dark:text-white text-base">30 Selectable Success Animation Engine</h3>
                    <p className="text-xs text-slate-500">Configure global success animation preferences, auto-dismiss duration, and test all 30 styles.</p>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono text-[10px]">30 DISTINCT STYLES</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold dark:text-white">Enable Success Animations Globally</h4>
                    <p className="text-[10px] text-slate-500 mt-1">Show animated celebratory overlays upon key user events.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.featureFlags?.notifications !== false}
                      onChange={(e) => updateFeatureFlag('notifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest block">
                    Default System Success Animation Style
                  </label>
                  <select
                    value={settings.successAnimationStyle || 'confetti'}
                    onChange={(e) => setSettings({ ...settings, successAnimationStyle: e.target.value as any })}
                    className="w-full h-10 px-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-bold font-sans"
                  >
                    {ALL_SUCCESS_ANIMATION_STYLES.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.label} — ({st.description})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Alert variant="warning" className="rounded-2xl text-xs">
                <strong>Important Policy:</strong> Success animations are purely visual feedback to enhance user experience. A success animation must <strong>NEVER</strong> be interpreted as proof of financial settlement or payment authorization. Authoritative state remains governed by the backend.
              </Alert>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-4">
                  Interactive Preview Studio (All 30 Animation Styles)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {ALL_SUCCESS_ANIMATION_STYLES.map((st, idx) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setPreviewAnimation(st.id)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all hover:scale-105 active:scale-95 group",
                        settings.successAnimationStyle === st.id
                          ? "bg-primary-50 dark:bg-primary-950/30 border-primary-500 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary-400"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                        <Eye size={12} className="text-slate-400 group-hover:text-primary-600" />
                      </div>
                      <p className="text-xs font-bold dark:text-white truncate">{st.label}</p>
                      <p className="text-[9px] text-slate-500 line-clamp-1 mt-0.5">{st.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <SuccessAnimation
              isOpen={!!previewAnimation}
              style={previewAnimation || 'confetti'}
              title="Animation Preview"
              subtitle={`Testing "${previewAnimation}" success animation style (Non-financial preview)`}
              onComplete={() => setPreviewAnimation(null)}
              autoDismissMs={2600}
            />
          </div>
        )}

        {/* LANDING PAGE TAB */}
        {activeTab === 'landing' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 font-display">
                  <Layout className="text-primary-600" size={18} />
                  <h3 className="font-bold dark:text-white text-base">Hero Section</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Headline</label>
                    <input
                      value={settings.landingPage?.hero.title || ''}
                      onChange={(e) => updateLandingHero('title', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-sans font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Subtitle</label>
                    <textarea
                      rows={3}
                      value={settings.landingPage?.hero.subtitle || ''}
                      onChange={(e) => updateLandingHero('subtitle', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-sans"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Hero Background URL</label>
                    <input
                      value={settings.landingPage?.hero.backgroundImageUrl || ''}
                      onChange={(e) => updateLandingHero('backgroundImageUrl', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-sans"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 font-display">
                  <FileSearch className="text-primary-600" size={18} />
                  <h3 className="font-bold dark:text-white text-base">Value Propositions</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { key: 'networkSummary', label: 'Platform Summary' },
                    { key: 'merchantValueProp', label: 'Merchant Benefits' },
                    { key: 'logisticsValueProp', label: 'Logistics Benefits' },
                    { key: 'centerValueProp', label: 'Hub Center Benefits' }
                  ].map((item) => (
                    <div key={item.key} className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">{item.label}</label>
                      <textarea
                        rows={2}
                        value={(settings.landingPage.descriptions as any)[item.key] || ''}
                        onChange={(e) => {
                          const newDescs = { ...settings.landingPage.descriptions, [item.key]: e.target.value };
                          setSettings({
                            ...settings,
                            landingPage: { ...settings.landingPage, descriptions: newDescs }
                          });
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-sans"
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 font-display">
                <div className="flex items-center gap-3">
                  <Activity className="text-primary-600" size={18} />
                  <h3 className="font-bold dark:text-white text-base">Statistics Section</h3>
                </div>
                <Button size="sm" variant="outline" className="rounded-xl">Add Statistic</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {settings.landingPage.statistics?.map((stat, i) => (
                  <div key={stat.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                    <input
                      value={stat.label}
                      onChange={(e) => {
                        const newStats = [...settings.landingPage.statistics];
                        newStats[i].label = e.target.value;
                        setSettings({...settings, landingPage: {...settings.landingPage, statistics: newStats}});
                      }}
                      className="w-full bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-widest text-slate-800"
                    />
                    <input
                      value={stat.value}
                      onChange={(e) => {
                        const newStats = [...settings.landingPage.statistics];
                        newStats[i].value = e.target.value;
                        setSettings({...settings, landingPage: {...settings.landingPage, statistics: newStats}});
                      }}
                      className="w-full bg-transparent border-none p-0 text-xl font-black text-slate-900 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* SOCIAL LINKS TAB */}
        {activeTab === 'social' && (
          <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 font-display">
              <Share2 className="text-primary-600" size={18} />
              <h3 className="font-bold dark:text-white text-base">Social Media & Contact Links</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { key: 'facebook', label: 'Facebook', icon: Facebook },
                { key: 'instagram', label: 'Instagram', icon: Instagram },
                { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
                { key: 'twitter', label: 'Twitter / X', icon: Twitter },
                { key: 'tiktok', label: 'TikTok', icon: Activity },
                { key: 'youtube', label: 'YouTube', icon: Youtube },
                { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                { key: 'telegram', label: 'Telegram', icon: MessageSquare },
                { key: 'website', label: 'Official Website', icon: Globe }
              ].map((item) => (
                <div key={item.key} className="space-y-1.5">
                  <div className="flex items-center gap-2 mb-1">
                    <item.icon size={14} className="text-slate-800" />
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">{item.label}</label>
                  </div>
                  <input
                    value={(settings.socialLinks as any)[item.key] || ''}
                    onChange={(e) => updateSocialLink(item.key, e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-mono"
                  />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* COMPANY PAGES TAB */}
        {activeTab === 'company' && (
          <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 font-display">
              <Building className="text-primary-600" size={18} />
              <h3 className="font-bold dark:text-white text-base">Company Content Pages</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-1 flex flex-col gap-1">
                {[
                  { key: 'aboutUs', label: 'About Us' },
                  { key: 'howItWorks', label: 'How It Works' },
                  { key: 'solutions', label: 'Our Solutions' },
                  { key: 'merchants', label: 'For Merchants' },
                  { key: 'logistics', label: 'For Logistics' },
                  { key: 'hubs', label: 'For Hub Centers' }
                ].map((page) => (
                  <button
                    key={page.key}
                    onClick={() => setActivePolicy(page.key)}
                    className={cn(
                      "text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
                      activePolicy === page.key ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20" : "text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-900"
                    )}
                  >
                    {page.label}
                  </button>
                ))}
              </div>
              <div className="md:col-span-3 space-y-4">
                 <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-[10px] uppercase">Page Editor: Markdown Enabled</Badge>
                 </div>
                 <textarea
                   rows={20}
                   value={(settings.companyPages as any)[activePolicy] || ''}
                   onChange={(e) => updateCompanyPage(activePolicy, e.target.value)}
                   className="w-full p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-mono leading-relaxed focus:ring-2 focus:ring-primary-500"
                 />
              </div>
            </div>
          </Card>
        )}

        {/* FAQ TAB */}
        {activeTab === 'faq' && (
          <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 font-display">
              <div className="flex items-center gap-3">
                <HelpCircle className="text-primary-600" size={18} />
                <h3 className="font-bold dark:text-white text-base">Frequently Asked Questions</h3>
              </div>
              <Button size="sm" className="rounded-xl">
                 <Plus size={16} className="mr-2" /> Add FAQ
              </Button>
            </div>

            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <input
                      value={faq.question}
                      className="bg-transparent border-none p-0 text-xs font-bold w-full focus:ring-0"
                    />
                    <div className="flex items-center gap-2">
                       <Badge className="bg-slate-200 dark:bg-slate-800 text-[9px]">{faq.category}</Badge>
                       <button className="text-slate-800 hover:text-rose-600"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <textarea
                    value={faq.answer}
                    rows={2}
                    className="bg-transparent border-none p-0 text-[10px] text-slate-900 w-full focus:ring-0"
                  />
                </div>
              ))}
              {faqs.length === 0 && (
                <div className="py-12 text-center text-slate-800 italic text-xs">No FAQs found. Add your first one above.</div>
              )}
            </div>
          </Card>
        )}

        {/* KNOWLEDGE TAB */}
        {activeTab === 'knowledge' && (
          <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 font-display">
              <div className="flex items-center gap-3">
                <BookOpen className="text-primary-600" size={18} />
                <h3 className="font-bold dark:text-white text-base">Knowledge Base Articles</h3>
              </div>
              <Button size="sm" className="rounded-xl">
                 <Plus size={16} className="mr-2" /> Create Article
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {articles.map((article) => (
                <div key={article.id} className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-3 group hover:border-primary-500/30 transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[9px]">{article.category}</Badge>
                    <span className="text-[9px] text-slate-800">{new Date(article.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-bold text-sm group-hover:text-primary-600 transition-colors">{article.title}</h4>
                  <p className="text-[10px] text-slate-900 line-clamp-2">{article.summary}</p>
                </div>
              ))}
              {articles.length === 0 && (
                <div className="col-span-2 py-12 text-center text-slate-800 italic text-xs">Knowledge base is currently empty.</div>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'legal' && <LegalManagementTab />}

        {/* COUNTRIES TAB */}
        {activeTab === 'countries' && (
          <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 font-display">
              <Flag className="text-primary-600" size={18} />
              <h3 className="font-bold dark:text-white text-base">Regional & Localisation Settings</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { key: 'defaultCountry', label: 'Operating Country' },
                { key: 'defaultCurrency', label: 'Primary Currency' },
                { key: 'defaultCurrencySymbol', label: 'Currency Symbol' },
                { key: 'defaultTimezone', label: 'Default Timezone' },
                { key: 'defaultPhoneCode', label: 'Country Phone Code' },
                { key: 'defaultDateFormat', label: 'Date Format' },
                { key: 'defaultAddressFormat', label: 'Address Format' }
              ].map((item) => (
                <div key={item.key} className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">{item.label}</label>
                  <input
                    value={(settings.countryConfig as any)[item.key] || ''}
                    onChange={(e) => updateCountryConfig(item.key, e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-sans font-bold"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <Coins size={16} className="text-emerald-600" />
                  <h4 className="text-xs font-black uppercase tracking-widest">Tax & VAT Rules</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Enable Tax Calculation</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.countryConfig.taxSettings.enabled}
                      onChange={(e) => updateTaxSettings('enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-800">VAT Rate (%)</label>
                  <input
                    type="number"
                    value={settings.countryConfig.taxSettings.vatRate}
                    onChange={(e) => updateTaxSettings('vatRate', parseFloat(e.target.value))}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <AlertCircle size={16} className="text-primary-600" />
                  <h4 className="text-xs font-black uppercase tracking-widest">Consumer Protection</h4>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-800">Regulatory Framework</label>
                  <textarea
                    rows={4}
                    value={settings.countryConfig.consumerProtectionRules}
                    onChange={(e) => updateCountryConfig('consumerProtectionRules', e.target.value)}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* FEATURES TAB */}
        {activeTab === 'features' && (
          <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 font-display">
              <Zap className="text-primary-600" size={18} />
              <h3 className="font-bold dark:text-white text-base">Platform Feature Management</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: 'enableMerchantRegistration', label: 'Merchant Onboarding', desc: 'Allow new businesses to register on the platform.' },
                { key: 'enableLogisticsOnboarding', label: 'Logistics Onboarding', desc: 'Allow new logistics partners to join the network.' },
                { key: 'enableHubCenterApplications', label: 'Hub Center Applications', desc: 'Enable the application flow for new Hub Centers.' },
                { key: 'enablePublicMarketplace', label: 'Public Marketplace', desc: 'Make the platform searchable and visible to non-users.' },
                { key: 'enableAIAssistant', label: 'AI Business Intelligence', desc: 'Enable the Gemini-powered business assistant for users.' },
                { key: 'enableGlobalSearch', label: 'Universal Global Search', desc: 'Enable deep indexing and searching across all entities.' },
                { key: 'enableSafePay', label: 'SafePay Protected Payments', desc: 'Enable the buyer-seller protected payment workflow. When off, SafePay shows as "Coming Soon" everywhere.' }
              ].map((feature) => (
                <div key={feature.key} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <div className="max-w-[70%]">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{feature.label}</h4>
                    <p className="text-[10px] text-slate-900 mt-1">{feature.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(settings.featureFlags as any)[feature.key]}
                      onChange={(e) => updateFeatureFlag(feature.key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* LEGAL TAB */}
        {activeTab === 'legal' && (
          <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 font-display">
              <FileText className="text-primary-600" size={18} />
              <h3 className="font-bold dark:text-white text-base">Legal Policies & Agreements</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-1 flex flex-col gap-1">
                {[
                  { key: 'privacyPolicy', label: 'Privacy Policy' },
                  { key: 'termsOfService', label: 'Terms of Service' },
                  { key: 'paymentProtectionPolicy', label: 'Payment Protection' },
                  { key: 'returnsPolicy', label: 'Returns Policy' },
                  { key: 'merchantPolicy', label: 'Merchant Policy' },
                  { key: 'communityGuidelines', label: 'Community Guidelines' }
                ].map((policy) => (
                  <button
                    key={policy.key}
                    onClick={() => setActivePolicy(policy.key)}
                    className={cn(
                      "text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
                      activePolicy === policy.key ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20" : "text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-900"
                    )}
                  >
                    {policy.label}
                  </button>
                ))}
              </div>
              <div className="md:col-span-3 space-y-4">
                 <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-[10px] uppercase">Editor: Markdown Enabled</Badge>
                 </div>
                 <textarea
                   rows={20}
                   value={(settings.policies as any)[activePolicy] || ''}
                   onChange={(e) => updatePolicy(activePolicy, e.target.value)}
                   className="w-full p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-mono leading-relaxed focus:ring-2 focus:ring-primary-500"
                 />
              </div>
            </div>
          </Card>
        )}

        {/* CONTACT TAB */}
        {activeTab === 'contact' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 font-display">
                <Mail className="text-primary-600" size={18} />
                <h3 className="font-bold dark:text-white text-base">Support Channels</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Main Support Email</label>
                  <input
                    value={settings.contactInfo.supportEmail || ''}
                    onChange={(e) => updateContactInfo('supportEmail', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-sans"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Primary Support Phone</label>
                  <input
                    value={settings.contactInfo.supportPhone || ''}
                    onChange={(e) => updateContactInfo('supportPhone', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-sans"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">WhatsApp Business Number</label>
                  <input
                    value={settings.contactInfo.whatsapp || ''}
                    onChange={(e) => updateContactInfo('whatsapp', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-sans"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 font-display">
                <MapPin className="text-primary-600" size={18} />
                <h3 className="font-bold dark:text-white text-base">Office Locations</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Headquarters Address</label>
                  <textarea
                    rows={2}
                    value={settings.contactInfo.address || ''}
                    onChange={(e) => updateContactInfo('address', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-sans"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Operational Hours</label>
                  <input
                    value={settings.contactInfo.workingHours || ''}
                    onChange={(e) => updateContactInfo('workingHours', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-sans"
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* MAPS & GEOLOCATION CONFIGURATION TAB */}
        {activeTab === 'maps' && settings.mapsConfig && (
          <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 font-display">
              <Globe className="text-primary-600" size={18} />
              <h3 className="font-bold dark:text-white text-base">Maps & Geolocation Configuration</h3>
            </div>

            <Alert variant="info" className="rounded-2xl text-xs">
              Configure parameters for Google Maps, live rider tracking, geofencing, route deviation, and distance thresholds.
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Maps Provider</label>
                <select
                  value={settings.mapsConfig.mapsProvider || 'GOOGLE'}
                  onChange={(e) => setSettings({
                    ...settings,
                    mapsConfig: { ...settings.mapsConfig!, mapsProvider: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl"
                >
                  <option value="GOOGLE">Google Maps Platform</option>
                  <option value="OPENSTREETMAP">OpenStreetMap (Fallback)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Default Country</label>
                <input
                  type="text"
                  value={settings.mapsConfig.defaultCountry || 'Nigeria'}
                  onChange={(e) => setSettings({
                    ...settings,
                    mapsConfig: { ...settings.mapsConfig!, defaultCountry: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl"
                  placeholder="Nigeria"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Distance Units</label>
                <select
                  value={settings.mapsConfig.distanceUnits || 'km'}
                  onChange={(e) => setSettings({
                    ...settings,
                    mapsConfig: { ...settings.mapsConfig!, distanceUnits: e.target.value as 'km' | 'miles' }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl"
                >
                  <option value="km">Kilometers (km)</option>
                  <option value="miles">Miles (mi)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Default Search Radius (km)</label>
                <input
                  type="number"
                  value={settings.mapsConfig.defaultSearchRadiusKm ?? 10}
                  onChange={(e) => setSettings({
                    ...settings,
                    mapsConfig: { ...settings.mapsConfig!, defaultSearchRadiusKm: Number(e.target.value) }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Maximum Dispatch Radius (km)</label>
                <input
                  type="number"
                  value={settings.mapsConfig.maxDispatchRadiusKm ?? 15}
                  onChange={(e) => setSettings({
                    ...settings,
                    mapsConfig: { ...settings.mapsConfig!, maxDispatchRadiusKm: Number(e.target.value) }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Tracking Update Interval (ms)</label>
                <input
                  type="number"
                  value={settings.mapsConfig.locationUpdateIntervalMs ?? 10000}
                  onChange={(e) => setSettings({
                    ...settings,
                    mapsConfig: { ...settings.mapsConfig!, locationUpdateIntervalMs: Number(e.target.value) }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Geofence Radius (meters)</label>
                <input
                  type="number"
                  value={settings.mapsConfig.geofenceRadiusMeters ?? 100}
                  onChange={(e) => setSettings({
                    ...settings,
                    mapsConfig: { ...settings.mapsConfig!, geofenceRadiusMeters: Number(e.target.value) }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">GPS Accuracy Threshold (meters)</label>
                <input
                  type="number"
                  value={settings.mapsConfig.locationAccuracyThresholdMeters ?? 15}
                  onChange={(e) => setSettings({
                    ...settings,
                    mapsConfig: { ...settings.mapsConfig!, locationAccuracyThresholdMeters: Number(e.target.value) }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Route Deviation Threshold (meters)</label>
                <input
                  type="number"
                  value={settings.mapsConfig.routeDeviationThresholdMeters ?? 150}
                  onChange={(e) => setSettings({
                    ...settings,
                    mapsConfig: { ...settings.mapsConfig!, routeDeviationThresholdMeters: Number(e.target.value) }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                <div>
                  <span className="text-xs font-bold block dark:text-white">Route Deviation Detection</span>
                  <span className="text-[10px] text-slate-900">Flag riders deviating from direct path</span>
                </div>
                <button
                  onClick={() => setSettings({
                    ...settings,
                    mapsConfig: { ...settings.mapsConfig!, enableRouteDeviationDetection: !settings.mapsConfig?.enableRouteDeviationDetection }
                  })}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    settings.mapsConfig.enableRouteDeviationDetection ? "bg-primary-600" : "bg-slate-200 dark:bg-slate-800"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    settings.mapsConfig.enableRouteDeviationDetection ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                <div>
                  <span className="text-xs font-bold block dark:text-white">Live Rider Tracking</span>
                  <span className="text-[10px] text-slate-900">Enable real-time tracking for customers</span>
                </div>
                <button
                  onClick={() => setSettings({
                    ...settings,
                    mapsConfig: { ...settings.mapsConfig!, enableLiveRiderTracking: !settings.mapsConfig?.enableLiveRiderTracking }
                  })}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    settings.mapsConfig.enableLiveRiderTracking ? "bg-primary-600" : "bg-slate-200 dark:bg-slate-800"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    settings.mapsConfig.enableLiveRiderTracking ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                <div>
                  <span className="text-xs font-bold block dark:text-white">Geofencing & Alerts</span>
                  <span className="text-[10px] text-slate-900">Enable geofences for automatic alerts</span>
                </div>
                <button
                  onClick={() => setSettings({
                    ...settings,
                    mapsConfig: { ...settings.mapsConfig!, enableGeofencing: !settings.mapsConfig?.enableGeofencing }
                  })}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    settings.mapsConfig.enableGeofencing ? "bg-primary-600" : "bg-slate-200 dark:bg-slate-800"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    settings.mapsConfig.enableGeofencing ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* PAYMENT & SAFEPAY CONFIGURATION TAB */}
        {activeTab === 'payments' && settings.paymentConfig && (
          <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 font-display">
              <CreditCard className="text-primary-600" size={18} />
              <h3 className="font-bold dark:text-white text-base">Payment & SafePay Rules Engine</h3>
            </div>

            <Alert variant="info" className="rounded-2xl text-xs">
              Configure authoritative payment providers, SafePay protection mechanisms, and automatic transaction fallback behavior.
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Primary SafePay Provider</label>
                <select
                  value={settings.paymentConfig.primarySafePayProvider || 'FLUTTERWAVE'}
                  onChange={(e) => setSettings({
                    ...settings,
                    paymentConfig: { ...settings.paymentConfig!, primarySafePayProvider: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-sans"
                >
                  <option value="FLUTTERWAVE">Flutterwave (Authoritative Primary)</option>
                  <option value="PAYSTACK">Paystack (Not Recommended for SafePay)</option>
                </select>
                <p className="text-[9px] text-slate-900 mt-1">SafePay holding, release, and refund are governed primarily by this provider.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Primary Platform Provider</label>
                <select
                  value={settings.paymentConfig.primaryPlatformProvider || 'PAYSTACK'}
                  onChange={(e) => setSettings({
                    ...settings,
                    paymentConfig: { ...settings.paymentConfig!, primaryPlatformProvider: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-sans"
                >
                  <option value="PAYSTACK">Paystack (Primary for Platform/Wallet)</option>
                  <option value="FLUTTERWAVE">Flutterwave</option>
                </select>
                <p className="text-[9px] text-slate-900 mt-1">Governs wallet funding, registration, memberships, and platform charges.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Retry Limits</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.paymentConfig.retryLimits ?? 3}
                  onChange={(e) => setSettings({
                    ...settings,
                    paymentConfig: { ...settings.paymentConfig!, retryLimits: parseInt(e.target.value) || 3 }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-sans"
                />
                <p className="text-[9px] text-slate-900 mt-1">Maximum number of API retries upon payment failure.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Timeout Duration (seconds)</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={settings.paymentConfig.timeoutDuration ?? 30}
                  onChange={(e) => setSettings({
                    ...settings,
                    paymentConfig: { ...settings.paymentConfig!, timeoutDuration: parseInt(e.target.value) || 30 }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-sans"
                />
                <p className="text-[9px] text-slate-900 mt-1">Maximum API call duration before flagging a gateway timeout.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Provider Priority Order</label>
                <input
                  type="text"
                  value={settings.paymentConfig.providerPriority?.join(', ') || 'PAYSTACK, FLUTTERWAVE'}
                  onChange={(e) => setSettings({
                    ...settings,
                    paymentConfig: {
                      ...settings.paymentConfig!,
                      providerPriority: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
                    }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-sans font-mono"
                />
                <p className="text-[9px] text-slate-900 mt-1">Fallback precedence (comma separated, e.g. PAYSTACK, FLUTTERWAVE).</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Supported Currencies</label>
                <input
                  type="text"
                  value={settings.paymentConfig.supportedCurrencies?.join(', ') || 'NGN, USD, GHS, KES'}
                  onChange={(e) => setSettings({
                    ...settings,
                    paymentConfig: {
                      ...settings.paymentConfig!,
                      supportedCurrencies: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
                    }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-sans font-mono"
                />
                <p className="text-[9px] text-slate-900 mt-1">Currencies accepted by authoritative gateways.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Webhook Endpoint</label>
                <input
                  type="text"
                  value={settings.paymentConfig.webhookEndpoint || '/api/payment-protection/webhook'}
                  onChange={(e) => setSettings({
                    ...settings,
                    paymentConfig: {
                      ...settings.paymentConfig!,
                      webhookEndpoint: e.target.value
                    }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-sans font-mono"
                />
                <p className="text-[9px] text-slate-900 mt-1">Authoritative relative URL for payment event webhooks.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Settlement Delay (seconds)</label>
                <input
                  type="number"
                  min="0"
                  value={settings.paymentConfig.settlementDelays ?? 86400}
                  onChange={(e) => setSettings({
                    ...settings,
                    paymentConfig: {
                      ...settings.paymentConfig!,
                      settlementDelays: parseInt(e.target.value) || 0
                    }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-sans"
                />
                <p className="text-[9px] text-slate-900 mt-1">Seconds to hold funds before eligible for release/settlement.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">SafePay Refund Rules</label>
                <input
                  type="text"
                  value={settings.paymentConfig.refundRules?.join(', ') || 'FULL_REFUND, PARTIAL_REFUND_WITH_FEE'}
                  onChange={(e) => setSettings({
                    ...settings,
                    paymentConfig: {
                      ...settings.paymentConfig!,
                      refundRules: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
                    }
                  })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-sans font-mono"
                />
                <p className="text-[9px] text-slate-900 mt-1">Comma-separated lists of allowed refund mechanics.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Allowed Fallback Payment Types</label>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 max-h-[140px] overflow-y-auto">
                  {['WALLET_FUNDING', 'REGISTRATION_FEE', 'MEMBERSHIP', 'SUBSCRIPTION', 'GENERAL_PLATFORM_CHARGE'].map((type) => {
                    const isChecked = settings.paymentConfig?.allowedFallbackTypes?.includes(type);
                    return (
                      <label key={type} className="flex items-center gap-2 cursor-pointer text-[10px] font-sans">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const currentList = settings.paymentConfig?.allowedFallbackTypes || [];
                            const newList = e.target.checked
                              ? [...currentList, type]
                              : currentList.filter(t => t !== type);
                            setSettings({
                              ...settings,
                              paymentConfig: { ...settings.paymentConfig!, allowedFallbackTypes: newList }
                            });
                          }}
                          className="rounded border-slate-300 dark:border-slate-700 text-primary-600 focus:ring-primary-500 h-3.5 w-3.5"
                        />
                        <span className="text-slate-900 dark:text-slate-300 font-medium">{type.replace(/_/g, ' ')}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[9px] text-slate-900 mt-1">SafePay transactions are strictly excluded from failover for safety.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold block dark:text-white">Enable Automated Fallback</span>
                  <span className="text-[10px] text-slate-900">Allow non-SafePay platform transactions to failover to secondary provider.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({
                    ...settings,
                    paymentConfig: { ...settings.paymentConfig!, enableFallback: !settings.paymentConfig?.enableFallback }
                  })}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    settings.paymentConfig.enableFallback ? "bg-primary-600" : "bg-slate-200 dark:bg-slate-800"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    settings.paymentConfig.enableFallback ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold block dark:text-white">Payment System Maintenance Mode</span>
                  <span className="text-[10px] text-slate-900">Temporarily freeze all external payments for safety.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({
                    ...settings,
                    paymentConfig: { ...settings.paymentConfig!, paymentMaintenanceMode: !settings.paymentConfig?.paymentMaintenanceMode }
                  })}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    settings.paymentConfig.paymentMaintenanceMode ? "bg-red-600" : "bg-slate-200 dark:bg-slate-800"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    settings.paymentConfig.paymentMaintenanceMode ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold block dark:text-white">Enable Flutterwave Gateway</span>
                  <span className="text-[10px] text-slate-900">Enable or disable all integrations and API transactions through Flutterwave.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({
                    ...settings,
                    paymentConfig: { ...settings.paymentConfig!, isFlutterwaveEnabled: !settings.paymentConfig?.isFlutterwaveEnabled }
                  })}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    settings.paymentConfig.isFlutterwaveEnabled !== false ? "bg-primary-600" : "bg-slate-200 dark:bg-slate-800"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    settings.paymentConfig.isFlutterwaveEnabled !== false ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold block dark:text-white">Enable Card Payments (Platform Payments)</span>
                  <span className="text-[10px] text-slate-900">Temporarily disabled by platform policy. Enable or disable credit/debit card processing.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({
                    ...settings,
                    paymentConfig: { ...settings.paymentConfig!, isCardPaymentEnabled: !settings.paymentConfig?.isCardPaymentEnabled }
                  })}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    settings.paymentConfig.isCardPaymentEnabled === true ? "bg-primary-600" : "bg-slate-200 dark:bg-slate-800"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    settings.paymentConfig.isCardPaymentEnabled === true ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold block dark:text-white">Enable Bank Transfer Payments</span>
                  <span className="text-[10px] text-slate-900">Active payment method for platform charges and wallet funding.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({
                    ...settings,
                    paymentConfig: { ...settings.paymentConfig!, isBankTransferEnabled: !settings.paymentConfig?.isBankTransferEnabled }
                  })}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    settings.paymentConfig.isBankTransferEnabled !== false ? "bg-primary-600" : "bg-slate-200 dark:bg-slate-800"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    settings.paymentConfig.isBankTransferEnabled !== false ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* ENTERPRISE COMMUNICATIONS CONSOLE */}
        {activeTab === 'communications' && (
          <div className="space-y-6">
            {/* SUB-TAB NAVIGATOR */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit">
              {(['providers', 'templates', 'health', 'logs'] as const).map((sub) => (
                <button
                  key={sub}
                  onClick={() => setCommsSubTab(sub)}
                  className={cn(
                    "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap",
                    commsSubTab === sub
                      ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-900 hover:text-slate-900 dark:hover:text-slate-100"
                  )}
                >
                  {sub}
                </button>
              ))}
            </div>

            {/* SUB-TAB: PROVIDERS */}
            {commsSubTab === 'providers' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* CONFIG COLUMNS */}
                <div className="lg:col-span-2 space-y-8">
                  {/* TELEGRAM */}
                  <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <Bot className="text-primary-600" size={18} />
                        <h4 className="font-bold dark:text-white text-sm">Telegram Bot Gateway</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSettings({
                            ...settings,
                            telegramConfig: { ...settings.telegramConfig!, enabled: !settings.telegramConfig?.enabled }
                          })}
                          className={cn(
                            "relative inline-flex h-5 w-10 items-center rounded-full transition-colors",
                            settings.telegramConfig?.enabled ? "bg-primary-600" : "bg-slate-200 dark:bg-slate-800"
                          )}
                        >
                          <span className={cn(
                            "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
                            settings.telegramConfig?.enabled ? "translate-x-5" : "translate-x-1"
                          )} />
                        </button>
                        <span className="text-[10px] font-bold text-slate-900">
                          {settings.telegramConfig?.enabled ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Bot HTTP Token</label>
                        <input
                          type="password"
                          value={settings.telegramConfig?.botToken || ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            telegramConfig: { ...settings.telegramConfig!, botToken: e.target.value }
                          })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-mono"
                          placeholder="bot_token"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Chat ID / Group ID</label>
                        <input
                          value={settings.telegramConfig?.chatId || ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            telegramConfig: { ...settings.telegramConfig!, chatId: e.target.value }
                          })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-mono"
                          placeholder="-1000000000"
                        />
                      </div>
                    </div>
                  </Card>

                  {/* EMAIL */}
                  <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <Mail className="text-primary-600" size={18} />
                        <h4 className="font-bold dark:text-white text-sm">Email Delivery Gateway</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSettings({
                            ...settings,
                            emailConfig: { ...settings.emailConfig!, enabled: !settings.emailConfig?.enabled }
                          })}
                          className={cn(
                            "relative inline-flex h-5 w-10 items-center rounded-full transition-colors",
                            settings.emailConfig?.enabled ? "bg-primary-600" : "bg-slate-200 dark:bg-slate-800"
                          )}
                        >
                          <span className={cn(
                            "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
                            settings.emailConfig?.enabled ? "translate-x-5" : "translate-x-1"
                          )} />
                        </button>
                        <span className="text-[10px] font-bold text-slate-900">
                          {settings.emailConfig?.enabled ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Primary Provider</label>
                        <select
                          value={settings.emailConfig?.provider || 'FALLBACK'}
                          onChange={(e) => setSettings({
                            ...settings,
                            emailConfig: { ...settings.emailConfig!, provider: e.target.value as any }
                          })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-bold"
                        >
                          <option value="SENDGRID">SendGrid</option>
                          <option value="MAILGUN">Mailgun</option>
                          <option value="SES">Amazon SES</option>
                          <option value="FALLBACK">Fallback Delivery Engine</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Default Sender Name/Email</label>
                        <input
                          value={settings.emailConfig?.defaultSender || ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            emailConfig: { ...settings.emailConfig!, defaultSender: e.target.value }
                          })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-sans font-medium"
                          placeholder="no-reply@omorfihub.com"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">API Access Key / Secret</label>
                        <input
                          type="password"
                          value={settings.emailConfig?.apiKey || ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            emailConfig: { ...settings.emailConfig!, apiKey: e.target.value }
                          })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-mono"
                          placeholder="SG.xxxxxxxxxx"
                        />
                      </div>
                    </div>
                  </Card>

                  {/* SMS */}
                  <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="text-primary-600" size={18} />
                        <h4 className="font-bold dark:text-white text-sm">SMS Delivery Gateway</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSettings({
                            ...settings,
                            smsConfig: { ...settings.smsConfig!, enabled: !settings.smsConfig?.enabled }
                          })}
                          className={cn(
                            "relative inline-flex h-5 w-10 items-center rounded-full transition-colors",
                            settings.smsConfig?.enabled ? "bg-primary-600" : "bg-slate-200 dark:bg-slate-800"
                          )}
                        >
                          <span className={cn(
                            "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
                            settings.smsConfig?.enabled ? "translate-x-5" : "translate-x-1"
                          )} />
                        </button>
                        <span className="text-[10px] font-bold text-slate-900">
                          {settings.smsConfig?.enabled ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Primary Provider</label>
                        <select
                          value={settings.smsConfig?.provider || 'FALLBACK'}
                          onChange={(e) => setSettings({
                            ...settings,
                            smsConfig: { ...settings.smsConfig!, provider: e.target.value as any }
                          })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-bold"
                        >
                          <option value="TWILIO">Twilio</option>
                          <option value="INFOBIP">Infobip</option>
                          <option value="FALLBACK">Fallback Delivery Engine</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Sender ID / Brand Name</label>
                        <input
                          value={settings.smsConfig?.senderId || ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            smsConfig: { ...settings.smsConfig!, senderId: e.target.value }
                          })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-sans font-bold"
                          placeholder="OmorfiHub"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">API Key / Auth Token</label>
                        <input
                          type="password"
                          value={settings.smsConfig?.apiKey || ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            smsConfig: { ...settings.smsConfig!, apiKey: e.target.value }
                          })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-mono"
                          placeholder="auth_token"
                        />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* SIDEBAR POLICIES */}
                <div className="space-y-8">
                  <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-6 bg-slate-50 dark:bg-slate-900/40">
                    <div className="flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800/50 pb-3">
                      <ShieldCheck className="text-primary-600" size={16} />
                      <h4 className="font-bold text-xs uppercase tracking-widest text-slate-900">Global Delivery Policies</h4>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest block">Daily Rate Limit (per User)</label>
                        <input
                          type="number"
                          value={settings.communicationSettings?.notificationLimits ?? 50}
                          onChange={(e) => setSettings({
                            ...settings,
                            communicationSettings: {
                              ...settings.communicationSettings!,
                              notificationLimits: parseInt(e.target.value) || 50
                            }
                          })}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-bold font-mono"
                        />
                        <p className="text-[9px] text-slate-800">Restricts user spamming across SMS and push channels.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest block">Retry Policy Limit</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[8px] uppercase tracking-widest font-black text-slate-800 block mb-1">Max Attempts</span>
                            <input
                              type="number"
                              value={settings.communicationSettings?.retryPolicy?.maxAttempts ?? 3}
                              onChange={(e) => setSettings({
                                ...settings,
                                communicationSettings: {
                                  ...settings.communicationSettings!,
                                  retryPolicy: {
                                    ...settings.communicationSettings!.retryPolicy,
                                    maxAttempts: parseInt(e.target.value) || 3
                                  }
                                }
                              })}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-bold font-mono"
                            />
                          </div>
                          <div>
                            <span className="text-[8px] uppercase tracking-widest font-black text-slate-800 block mb-1">Retry Delay (Sec)</span>
                            <input
                              type="number"
                              value={settings.communicationSettings?.retryPolicy?.delaySeconds ?? 10}
                              onChange={(e) => setSettings({
                                ...settings,
                                communicationSettings: {
                                  ...settings.communicationSettings!,
                                  retryPolicy: {
                                    ...settings.communicationSettings!.retryPolicy,
                                    delaySeconds: parseInt(e.target.value) || 10
                                  }
                                }
                              })}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-bold font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest block">Quiet Hours Restriction</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[8px] uppercase tracking-widest font-black text-slate-800 block mb-1">Starts At</span>
                            <input
                              type="time"
                              value={settings.communicationSettings?.quietHoursStart || '22:00'}
                              onChange={(e) => setSettings({
                                ...settings,
                                communicationSettings: {
                                  ...settings.communicationSettings!,
                                  quietHoursStart: e.target.value
                                }
                              })}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-bold font-mono"
                            />
                          </div>
                          <div>
                            <span className="text-[8px] uppercase tracking-widest font-black text-slate-800 block mb-1">Ends At</span>
                            <input
                              type="time"
                              value={settings.communicationSettings?.quietHoursEnd || '06:00'}
                              onChange={(e) => setSettings({
                                ...settings,
                                communicationSettings: {
                                  ...settings.communicationSettings!,
                                  quietHoursEnd: e.target.value
                                }
                              })}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-bold font-mono"
                            />
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-800 mt-1">Defers bulk non-critical alerts during configured time boundaries.</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* SUB-TAB: TEMPLATES */}
            {commsSubTab === 'templates' && (
              <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <TypeIcon className="text-primary-600" size={18} />
                  <h3 className="font-bold dark:text-white text-base">Notification Content Templates</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(['received', 'approved', 'rejected', 'reupload', 'suspended'] as const).map((key) => {
                    const template = settings.notificationTemplates?.[key];
                    if (!template) return null;
                    return (
                      <div key={key} className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 bg-slate-50/50 dark:bg-slate-900/20">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-widest text-slate-900">{key} Template</span>
                          <button
                            onClick={() => {
                              const templates = { ...settings.notificationTemplates };
                              templates[key] = { ...templates[key]!, enabled: !templates[key]!.enabled };
                              setSettings({ ...settings, notificationTemplates: templates });
                            }}
                            className={cn(
                              "relative inline-flex h-4 w-8 items-center rounded-full transition-colors",
                              template.enabled ? "bg-primary-600" : "bg-slate-200 dark:bg-slate-800"
                            )}
                          >
                            <span className={cn(
                              "inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform",
                              template.enabled ? "translate-x-4" : "translate-x-1"
                            )} />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <span className="text-[8px] font-black text-slate-800 uppercase tracking-widest block">Notification Title</span>
                            <input
                              value={template.title}
                              onChange={(e) => {
                                const templates = { ...settings.notificationTemplates };
                                templates[key] = { ...templates[key]!, title: e.target.value };
                                setSettings({ ...settings, notificationTemplates: templates });
                              }}
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-bold"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <span className="text-[8px] font-black text-slate-800 uppercase tracking-widest block">Notification Body</span>
                            <textarea
                              rows={3}
                              value={template.body}
                              onChange={(e) => {
                                const templates = { ...settings.notificationTemplates };
                                templates[key] = { ...templates[key]!, body: e.target.value };
                                setSettings({ ...settings, notificationTemplates: templates });
                              }}
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-sans"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* SUB-TAB: HEALTH & STATUS */}
            {commsSubTab === 'health' && (
              <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <Activity className="text-primary-600" size={18} />
                  <h3 className="font-bold dark:text-white text-base">Real-Time Provider Health & Performance</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {providerHealths.map((ph, idx) => (
                    <div key={idx} className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 font-mono">{ph.provider}</span>
                        <Badge
                          variant={ph.status === 'ACTIVE' ? 'success' : ph.status === 'DEGRADED' ? 'warning' : 'error'}
                          className="text-[9px] font-extrabold uppercase"
                        >
                          {ph.status}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <span className="text-2xl font-black font-display dark:text-white">{ph.latencyMs}ms</span>
                        <span className="text-[10px] text-slate-800 block uppercase tracking-widest">Avg Latency</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-[11px]">
                        <div>
                          <span className="text-slate-900 font-bold">{ph.successRate}%</span>
                          <span className="text-[8px] text-slate-800 block uppercase tracking-widest">Success Rate</span>
                        </div>
                        <div>
                          <span className="text-slate-900 font-bold">{ph.totalRequests}</span>
                          <span className="text-[8px] text-slate-800 block uppercase tracking-widest">Requests</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* SUB-TAB: DELIVERY HISTORY LOGS */}
            {commsSubTab === 'logs' && (
              <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <History className="text-primary-600" size={18} />
                    <h3 className="font-bold dark:text-white text-base">Dynamic Dispatch History & Delivery Logs</h3>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold py-1 px-3">
                    🟢 Live Listening
                  </Badge>
                </div>

                <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                        <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px] text-slate-800">Timestamp</th>
                        <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px] text-slate-800">Recipient</th>
                        <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px] text-slate-800">Channel</th>
                        <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px] text-slate-800">Provider</th>
                        <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px] text-slate-800">Category</th>
                        <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px] text-slate-800">Status</th>
                        <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px] text-slate-800">Message Preview</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {commsLogs.map((cl) => (
                        <tr key={cl.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-[9px] text-slate-900 whitespace-nowrap">
                            {new Date(cl.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-300">
                            {cl.recipient}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase">
                              {cl.channel}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 font-mono text-[10px] text-slate-900">
                            {cl.provider}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-300">
                              {cl.category}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-1.5 font-bold">
                              {cl.status === 'SUCCESS' ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span className="text-emerald-600">DELIVERED</span>
                                </>
                              ) : cl.status === 'RETRYING' ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  <span className="text-amber-600">RETRYING</span>
                                </>
                              ) : cl.status === 'PENDING' ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                  <span className="text-blue-600">DEFERRED</span>
                                </>
                              ) : (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  <span className="text-rose-600">FAILED</span>
                                </>
                              )}
                            </span>
                            {cl.error && (
                              <span className="text-[8px] text-rose-400 font-mono block mt-0.5">{cl.error}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-900 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">{cl.title}</span>
                            {cl.body}
                          </td>
                        </tr>
                      ))}
                      {commsLogs.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-800 italic">
                            No dispatch communications recorded in this session.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* AUDIT LOGS TAB */}
        {activeTab === 'logs' && (
          <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 font-display">
              <div className="flex items-center gap-3">
                <History className="text-primary-600" size={18} />
                <h3 className="font-bold dark:text-white text-base">Configuration Audit Trail</h3>
              </div>
              <Button size="sm" variant="outline" onClick={() => auditEngine.getRecentLogs(50).then(setAuditLogs)} className="rounded-xl">
                 <RefreshCcw size={14} className="mr-2" /> Refresh Logs
              </Button>
            </div>

            <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-slate-800">Timestamp</th>
                    <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-slate-800">User</th>
                    <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-slate-800">Action</th>
                    <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-slate-800">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-[10px] text-slate-900">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="text-[10px] font-bold">{log.userId === 'SYSTEM' ? '⚙️ SYSTEM' : log.userId.substring(0, 8)}</Badge>
                      </td>
                      <td className="px-6 py-4 font-bold">{log.action}</td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap text-slate-900 font-mono text-[10px]">
                          {JSON.stringify(log.details)}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-800 italic">No configuration changes recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

      </div>
    </div>
  </AdminLayout>
);
};

export default GlobalSettingsPage;
