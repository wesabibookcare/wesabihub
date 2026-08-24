
import React, { useState, useEffect } from 'react';
import {
  Palette,
  Type,
  Image as ImageIcon,
  Upload,
  Save,
  RefreshCcw,
  Check,
  Globe,
  Info,
  Smartphone,
  Mail,
  FileText,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { cn } from '@/src/lib/utils';
import { useSettings } from '../../context/SettingsContext';
import { configurationEngine } from '@/src/engines';
import { auditEngine } from '../../services/AuditEngine';
import { auth } from '../../lib/firebase';

export const BrandAssetsPage = () => {
  const { settings, loading } = useSettings();
  const [localSettings, setLocalSettings] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [activeTab, setActiveTab] = useState<'VISUALS' | 'TYPOGRAPHY' | 'INFO'>('VISUALS');

  useEffect(() => {
    if (settings) {
      setLocalSettings({ ...settings });
    }
  }, [settings]);

  if (loading || !localSettings) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <RefreshCcw className="w-8 h-8 text-primary-600 animate-spin" />
            <p className="text-slate-900 font-medium">Loading brand configuration...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await configurationEngine.updateSystemSettings('global', localSettings);

      // Audit log
      await auditEngine.logEvent({
        userId: auth.currentUser?.uid || 'system',
        action: 'UPDATE_BRAND_ASSETS',
        details: { changes: 'Global branding assets updated' },
        result: 'SUCCESS'
      });

      setSaveStatus({ type: 'success', message: 'Brand assets updated successfully' });
    } catch (error: any) {
      setSaveStatus({ type: 'error', message: `Failed to save changes: ${error.message}` });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  const handleFileUpload = async (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaveStatus({ type: 'success', message: `Uploading ${file.name}...` });

      // Let's attempt real firebase storage upload, with base64 data-url fallback if it fails or storage is not initialized/accessible
      let fileUrl = '';
      try {
        const { StorageService } = await import('../../services/StorageService');
        fileUrl = await StorageService.uploadFile(`branding/${field}-${Date.now()}`, file);
      } catch (err) {
        console.warn("Storage upload failed, falling back to FileReader", err);
        const reader = new FileReader();
        fileUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(file);
        });
      }

      updateBranding(field, fileUrl);
      setSaveStatus({ type: 'success', message: `${file.name} uploaded successfully! Remember to save global changes.` });
    } catch (error: any) {
      setSaveStatus({ type: 'error', message: `Upload failed: ${error.message}` });
    } finally {
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  const assetCards = [
    { id: 'logoUrl', label: 'Primary Logo', value: localSettings.branding.logoUrl, type: 'IMAGE' },
    { id: 'logoDarkUrl', label: 'Dark Mode Logo', value: localSettings.branding.logoDarkUrl, type: 'IMAGE' },
    { id: 'logoLightUrl', label: 'Light Mode Logo', value: localSettings.branding.logoLightUrl, type: 'IMAGE' },
    { id: 'logoWithTaglineUrl', label: 'Logo with Tagline', value: localSettings.branding.logoWithTaglineUrl, type: 'IMAGE' },
    { id: 'faviconUrl', label: 'Favicon', value: localSettings.branding.faviconUrl, type: 'IMAGE' },
    { id: 'appIconUrl', label: 'Mobile App Icon', value: localSettings.branding.appIconUrl, type: 'IMAGE' },
    { id: 'emailLogoUrl', label: 'Email Template Logo', value: localSettings.branding.emailLogoUrl, type: 'IMAGE' },
    { id: 'documentLogoUrl', label: 'Document/Watermark Logo', value: localSettings.branding.documentLogoUrl, type: 'IMAGE' },
  ];

  const updateBranding = (field: string, value: any) => {
    setLocalSettings({
      ...localSettings,
      branding: {
        ...localSettings.branding,
        [field]: value
      }
    });
  };

  const updateTypography = (field: string, value: any) => {
    setLocalSettings({
      ...localSettings,
      branding: {
        ...localSettings.branding,
        typography: {
          ...localSettings.branding.typography,
          [field]: value
        }
      }
    });
  };

  const updateEmailBranding = (field: string, value: any) => {
    setLocalSettings({
      ...localSettings,
      branding: {
        ...localSettings.branding,
        emailBranding: {
          ...localSettings.branding.emailBranding,
          [field]: value
        }
      }
    });
  };

  const updateWatermarks = (field: string, value: any) => {
    setLocalSettings({
      ...localSettings,
      branding: {
        ...localSettings.branding,
        watermarks: {
          ...localSettings.branding.watermarks,
          [field]: value
        }
      }
    });
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-primary-600 font-bold uppercase tracking-widest text-[10px] mb-2">Master Branding Center</p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Brand Assets</h1>
            <p className="text-slate-900 font-medium mt-1">Manage global identity assets used throughout the platform.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl border-slate-200 font-bold" onClick={() => setLocalSettings({ ...settings })}>
              <RefreshCcw size={18} className="mr-2" /> Reset Defaults
            </Button>
            <Button className="rounded-xl font-bold shadow-lg shadow-primary-600/20" onClick={handleSave} isLoading={isSaving}>
              <Save size={18} className="mr-2" /> Save Global Changes
            </Button>
          </div>
        </div>

        {saveStatus && (
          <Alert variant={saveStatus.type} onClose={() => setSaveStatus(null)}>
            {saveStatus.message}
          </Alert>
        )}

        {/* Info Alert */}
        <Card className="p-4 bg-blue-50 border-blue-100 flex gap-4">
          <div className="p-2 bg-blue-600 text-white rounded-xl h-fit">
            <Info size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-blue-900">Propagating Changes</h4>
            <p className="text-xs text-blue-700 font-medium mt-0.5">
              Updates to the Master Brand Assets will automatically reflect across all modules (Logistics, Points, Merchant Hub, etc.). No manual updates required.
            </p>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation */}
          <div className="lg:col-span-1 space-y-2">
            {[
              { id: 'VISUALS', label: 'Visual Identity', icon: ImageIcon },
              { id: 'TYPOGRAPHY', label: 'Typography & Colors', icon: Palette },
              { id: 'INFO', label: 'Company Information', icon: Info },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all",
                  activeTab === tab.id
                    ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20"
                    : "text-slate-900 hover:bg-slate-100"
                )}
              >
                <tab.icon size={20} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Editor */}
          <div className="lg:col-span-3 space-y-8">
            {activeTab === 'VISUALS' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {assetCards.map((asset) => (
                  <Card key={asset.id} className="p-6 border-none shadow-xl shadow-slate-200/50 group">
                    <input
                      type="file"
                      id={`upload-${asset.id}`}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(asset.id, e)}
                    />
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-black text-slate-900">{asset.label}</h3>
                      <button
                        type="button"
                        onClick={() => document.getElementById(`upload-${asset.id}`)?.click()}
                        className="p-2 text-slate-800 hover:text-primary-600 transition-colors"
                        title="Upload logo"
                      >
                        <Upload size={18} />
                      </button>
                    </div>
                    <div
                      onClick={() => document.getElementById(`upload-${asset.id}`)?.click()}
                      className="aspect-video rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center p-8 relative overflow-hidden group-hover:border-primary-400 transition-colors cursor-pointer"
                      title="Click to Upload logo"
                    >
                      {asset.value ? (
                        <img
                          src={asset.value}
                          alt={asset.label}
                          className="max-h-full max-w-full object-contain drop-shadow-xl"
                        />
                      ) : (
                        <ImageIcon size={40} className="text-slate-300" />
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">SVG, PNG, JPG (Max 5MB)</p>
                      <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold">ACTIVE</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {activeTab === 'TYPOGRAPHY' && (
              <div className="space-y-8">
                <Card className="p-8 border-none shadow-xl shadow-slate-200/50">
                  <h3 className="text-xl font-black tracking-tight text-slate-900 mb-6 flex items-center gap-2">
                    <Palette size={24} className="text-primary-600" /> Platform Colors
                  </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Primary Brand Color</label>
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl shadow-inner border-2 border-white" style={{ backgroundColor: localSettings.branding.primaryColor }} />
                          <div className="flex-1">
                            <input
                              type="text"
                              value={localSettings.branding.primaryColor}
                              onChange={(e) => updateBranding('primaryColor', e.target.value)}
                              className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-2 font-mono font-bold text-sm"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Secondary Accent Color</label>
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl shadow-inner border-2 border-white" style={{ backgroundColor: localSettings.branding.secondaryColor }} />
                          <div className="flex-1">
                            <input
                              type="text"
                              value={localSettings.branding.secondaryColor}
                              onChange={(e) => updateBranding('secondaryColor', e.target.value)}
                              className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-2 font-mono font-bold text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-8 border-none shadow-xl shadow-slate-200/50">
                    <h3 className="text-xl font-black tracking-tight text-slate-900 mb-6 flex items-center gap-2">
                      <Mail size={24} className="text-primary-600" /> Email Branding
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Header Color</label>
                          <input
                            type="color"
                            value={localSettings.branding.emailBranding?.headerColor || '#ffffff'}
                            onChange={(e) => updateEmailBranding('headerColor', e.target.value)}
                            className="w-full h-10 rounded-lg"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Footer Color</label>
                          <input
                            type="color"
                            value={localSettings.branding.emailBranding?.footerColor || '#f8fafc'}
                            onChange={(e) => updateEmailBranding('footerColor', e.target.value)}
                            className="w-full h-10 rounded-lg"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Accent Color</label>
                          <input
                            type="color"
                            value={localSettings.branding.emailBranding?.accentColor || localSettings.branding.primaryColor}
                            onChange={(e) => updateEmailBranding('accentColor', e.target.value)}
                            className="w-full h-10 rounded-lg"
                          />
                       </div>
                    </div>
                  </Card>

                  <Card className="p-8 border-none shadow-xl shadow-slate-200/50">
                    <h3 className="text-xl font-black tracking-tight text-slate-900 mb-6 flex items-center gap-2">
                      <FileText size={24} className="text-primary-600" /> Watermarks & Guidelines
                    </h3>
                    <div className="space-y-6">
                       <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                          <div>
                             <h4 className="text-sm font-bold">Enable Document Watermarks</h4>
                             <p className="text-xs text-slate-900">Apply brand watermark to all platform-generated PDF receipts.</p>
                          </div>
                          <button
                            onClick={() => updateWatermarks('enabled', !localSettings.branding.watermarks?.enabled)}
                            className={cn(
                              "w-12 h-6 rounded-full relative transition-colors",
                              localSettings.branding.watermarks?.enabled ? "bg-primary-500" : "bg-slate-300"
                            )}
                          >
                            <span className={cn(
                              "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                              localSettings.branding.watermarks?.enabled ? "translate-x-6" : "translate-x-0"
                            )} />
                          </button>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Watermark Text</label>
                             <input
                               type="text"
                               value={localSettings.branding.watermarks?.text || ''}
                               onChange={(e) => updateWatermarks('text', e.target.value)}
                               className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-2 font-bold text-sm"
                               placeholder="e.g. OmorfiHub Official"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Brand Guidelines URL</label>
                             <input
                               type="text"
                               value={localSettings.branding.brandGuidelinesUrl || ''}
                               onChange={(e) => updateBranding('brandGuidelinesUrl', e.target.value)}
                               className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-2 font-bold text-sm"
                               placeholder="https://docs.omorfihub.com/brand"
                             />
                          </div>
                       </div>
                    </div>
                  </Card>

                  <Card className="p-8 border-none shadow-xl shadow-slate-200/50">
                    <h3 className="text-xl font-black tracking-tight text-slate-900 mb-6 flex items-center gap-2">
                      <Type size={24} className="text-primary-600" /> Typography System
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Heading Font Family</label>
                          <input
                            type="text"
                            value={localSettings.branding.typography.headingFont}
                            onChange={(e) => updateTypography('headingFont', e.target.value)}
                            className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-2 font-bold text-sm"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Body Font Family</label>
                          <input
                            type="text"
                            value={localSettings.branding.typography.bodyFont}
                            onChange={(e) => updateTypography('bodyFont', e.target.value)}
                            className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-2 font-bold text-sm"
                          />
                       </div>
                    </div>
                    <div className="space-y-6">
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800 mb-4">Preview: Headlines & Display</h4>
                        <p className="text-4xl font-black tracking-tight text-slate-900" style={{ fontFamily: localSettings.branding.typography.headingFont }}>
                          The quick brown fox jumps over the lazy dog.
                        </p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800 mb-4">Preview: Body & UI</h4>
                        <p className="text-lg font-medium text-slate-800 leading-relaxed" style={{ fontFamily: localSettings.branding.typography.bodyFont }}>
                          Platform elements use this typeface for optimal readability across all devices. {localSettings.platformName} prioritizes legibility and clean visual hierarchy.
                        </p>
                      </div>
                    </div>
                </Card>
              </div>
            )}

             {activeTab === 'INFO' && (
                <Card className="p-8 border-none shadow-xl shadow-slate-200/50">
                   <h3 className="text-xl font-black tracking-tight text-slate-900 mb-8 flex items-center gap-2">
                     <Info size={24} className="text-primary-600" /> Company Information
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Platform Official Name</label>
                         <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <Globe size={18} className="text-slate-800" />
                            <input
                              type="text"
                              value={localSettings.platformName}
                              onChange={(e) => setLocalSettings({...localSettings, platformName: e.target.value})}
                              className="bg-transparent border-none focus:outline-none font-bold w-full"
                            />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Brand Slogan</label>
                         <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <Smartphone size={18} className="text-slate-800" />
                            <input
                              type="text"
                              value={localSettings.tagline}
                              onChange={(e) => setLocalSettings({...localSettings, tagline: e.target.value})}
                              className="bg-transparent border-none focus:outline-none font-bold w-full"
                            />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Global Support Email</label>
                         <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <Mail size={18} className="text-slate-800" />
                            <input
                              type="email"
                              value={localSettings.supportEmail}
                              onChange={(e) => setLocalSettings({...localSettings, supportEmail: e.target.value})}
                              className="bg-transparent border-none focus:outline-none font-bold w-full"
                            />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Global Support Phone</label>
                         <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <Smartphone size={18} className="text-slate-800" />
                            <input
                              type="text"
                              value={localSettings.supportPhone}
                              onChange={(e) => setLocalSettings({...localSettings, supportPhone: e.target.value})}
                              className="bg-transparent border-none focus:outline-none font-bold w-full"
                            />
                         </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-800">Platform Website</label>
                         <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <Globe size={18} className="text-slate-800" />
                            <input
                              type="text"
                              value={localSettings.website}
                              onChange={(e) => setLocalSettings({...localSettings, website: e.target.value})}
                              className="bg-transparent border-none focus:outline-none font-bold w-full"
                            />
                         </div>
                      </div>
                   </div>
                </Card>
             )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
