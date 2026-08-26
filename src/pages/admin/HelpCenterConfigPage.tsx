import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { HelpCircle, Save, Users, Plus, X, RefreshCw, Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/apiClient';
import { configurationEngine } from '@/src/engines';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { toast } from 'sonner';

interface Persona {
  id: string;
  name: string;
  gender: 'male' | 'female';
  profilePictureUrl: string;
  greeting: string;
  isAvailable: boolean;
}

interface HelpConfig {
  welcomeMessage: string;
  supportEmail: string;
  emergencyPhone: string;
  personaRotation: string;
  initialGreeting: string;
  retrievalDelayMessage: string;
}

export const HelpCenterConfigPage = () => {
  const { fbUser } = useAuth();
  const [config, setConfig] = useState<HelpConfig>({
    welcomeMessage: "Welcome to OmorfiHub.",
    supportEmail: "support@omorfihub.com",
    emergencyPhone: "+234 (0) 800 000 0000",
    personaRotation: "Random Rotation",
    initialGreeting: "How can we help you today?",
    retrievalDelayMessage: "Please wait while we check that for you..."
  });

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Load configuration and personas on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const configRes = await fetch('/api/chat/config');
      const configData = await configRes.json();
      if (!configData.error) {
        setConfig(configData);
      }

      const personasRes = await fetch('/api/chat/personas');
      const personasData = await personasRes.json();
      if (!personasData.error) {
        setPersonas(personasData);
      }
    } catch (e) {
      console.error("Failed to load help center config:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigChange = (field: keyof HelpConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handlePersonaChange = (id: string, field: keyof Persona, value: any) => {
    setPersonas(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleImageFileUpload = (personaId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        handlePersonaChange(personaId, 'profilePictureUrl', result);
        toast.success("Profile image updated! Click 'Save Configuration' to persist.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveStatus("Saving configuration...");
    try {
      // 1. Save general config via API, with fallback to ConfigurationEngine & Firestore
      try {
        await apiFetch(fbUser, '/api/chat/config/save', {
          method: 'POST',
          body: config
        });
      } catch (apiErr) {
        console.warn('Backend API save endpoint unavailable or 500 error, writing to Firestore directly:', apiErr);
        await configurationEngine.updateSystemSettings('global', { helpCenterConfig: config } as any);
      }

      // 2. Save all active/edited personas via API or direct Firestore setDoc
      for (const persona of personas) {
        try {
          await apiFetch(fbUser, '/api/chat/personas/save', {
            method: 'POST',
            body: persona
          });
        } catch (personaErr) {
          console.warn(`Backend persona API save failed for ${persona.id}, saving directly to Firestore ai_personas:`, personaErr);
          await setDoc(doc(db, 'ai_personas', persona.id), {
            ...persona,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      }

      setSaveStatus("All configurations saved successfully!");
      toast.success("All configurations saved successfully to Firestore!");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      console.error("Error in handleSaveAll:", err);
      // Fallback: Write both to Firestore directly
      try {
        await configurationEngine.updateSystemSettings('global', { helpCenterConfig: config } as any);
        for (const persona of personas) {
          await setDoc(doc(db, 'ai_personas', persona.id), {
            ...persona,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
        setSaveStatus("Saved settings directly to Firestore!");
        toast.success("Saved settings directly to Firestore!");
      } catch (fsErr: any) {
        setSaveStatus(`Error saving: ${fsErr.message || 'Action failed'}`);
        toast.error(`Error saving: ${fsErr.message || 'Action failed'}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNewPersona = () => {
    const newId = `pers-${Date.now()}`;
    const newPersona: Persona = {
      id: newId,
      name: 'New Assistant',
      gender: 'female',
      profilePictureUrl: '/assets/personas/ada.png',
      greeting: 'Hello, I am your support assistant. How can I help you?',
      isAvailable: true
    };
    setPersonas(prev => [...prev, newPersona]);
  };

  const getPersonaEmoji = (gender: string) => {
    return gender === 'male' ? '👨🏽' : '👩🏻';
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-5xl mx-auto pb-10 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Help Center Management</h1>
            <p className="text-sm font-medium text-slate-900 mt-1">Configure the customer support experience and live OmorfiHubAgent Customer Care personas.</p>
          </div>
          <Button onClick={fetchData} variant="ghost" className="gap-2 shrink-0">
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw size={40} className="animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-sm text-slate-900">Loading configurations and personas...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* General Configuration Card */}
              <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-6 bg-white dark:bg-slate-900 shadow-sm rounded-xl">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center shrink-0">
                    <HelpCircle size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">General Configuration</h2>
                    <p className="text-xs text-slate-900">Main settings for the floating Help Center widget.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Welcome Message (Home)"
                    value={config.welcomeMessage}
                    onChange={e => handleConfigChange('welcomeMessage', e.target.value)}
                  />
                  <Input
                    label="Support Contact Email"
                    value={config.supportEmail}
                    onChange={e => handleConfigChange('supportEmail', e.target.value)}
                  />
                  <Input
                    label="Emergency Contact Phone"
                    value={config.emergencyPhone}
                    onChange={e => handleConfigChange('emergencyPhone', e.target.value)}
                  />
                  <Input
                    label="Initial Greeting Text"
                    value={config.initialGreeting}
                    onChange={e => handleConfigChange('initialGreeting', e.target.value)}
                  />
                  <Input
                    label="Retrieval Delay Message"
                    value={config.retrievalDelayMessage}
                    onChange={e => handleConfigChange('retrievalDelayMessage', e.target.value)}
                  />
                </div>
              </Card>

              {/* Customer Care Personas Card */}
              <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-6 bg-white dark:bg-slate-900 shadow-sm rounded-xl">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0">
                      <Users size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Customer Care Personas</h2>
                      <p className="text-xs text-slate-900">Manage the OmorfiHubAgent profiles that handle incoming support chats.</p>
                    </div>
                  </div>
                  <Button onClick={handleAddNewPersona} size="sm" className="gap-1 rounded-lg">
                    <Plus size={16} /> Add Persona
                  </Button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Persona Rotation</p>
                      <p className="text-xs text-slate-900">How should the active persona be selected for new chats?</p>
                    </div>
                    <select
                      value={config.personaRotation}
                      onChange={e => handleConfigChange('personaRotation', e.target.value)}
                      className="h-10 px-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white"
                    >
                      <option value="Random Rotation">Random Rotation</option>
                      <option value="Fixed (Single Active)">Fixed (Single Active)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {personas.map(persona => (
                      <div key={persona.id} className={cn(
                        "p-4 rounded-xl border-2 transition-all flex flex-col gap-3",
                        persona.isAvailable
                          ? "border-primary-500 bg-primary-50/5 dark:bg-primary-950/10"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20"
                      )}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center text-xl">
                              {getPersonaEmoji(persona.gender)}
                            </div>
                            <div>
                              <input
                                className="font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-primary-500 outline-none w-28 text-sm"
                                value={persona.name}
                                onChange={e => handlePersonaChange(persona.id, 'name', e.target.value)}
                              />
                              <p className="text-[10px] text-slate-800 font-mono">ID: {persona.id}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={persona.gender}
                              onChange={e => handlePersonaChange(persona.id, 'gender', e.target.value)}
                              className="h-7 px-1 text-xs rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-300 outline-none"
                            >
                              <option value="female">Female</option>
                              <option value="male">Male</option>
                            </select>

                            <button
                              onClick={() => handlePersonaChange(persona.id, 'isAvailable', !persona.isAvailable)}
                              className={cn(
                                "w-10 h-5 rounded-full relative transition-colors",
                                persona.isAvailable ? "bg-primary-500" : "bg-slate-300 dark:bg-slate-700"
                              )}
                            >
                              <span className={cn(
                                "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                                persona.isAvailable ? "translate-x-5" : "translate-x-0"
                              )} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-800 dark:text-slate-200 block mb-1">
                            Profile Avatar / Image
                          </label>
                          <div className="flex items-center gap-2">
                            {persona.profilePictureUrl && (
                              <img
                                src={persona.profilePictureUrl}
                                alt={persona.name}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                            )}
                            <Input
                              value={persona.profilePictureUrl}
                              onChange={e => handlePersonaChange(persona.id, 'profilePictureUrl', e.target.value)}
                              className="h-8 text-xs font-mono flex-1"
                              placeholder="https://example.com/avatar.png"
                            />
                            <label className="cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                              <Upload size={13} />
                              <span>Upload</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageFileUpload(persona.id, e)}
                              />
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-800 dark:text-slate-200 block mb-1">
                            Greeting Behavior
                          </label>
                          <textarea
                            rows={2}
                            value={persona.greeting}
                            onChange={e => handlePersonaChange(persona.id, 'greeting', e.target.value)}
                            className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-300 outline-none focus:ring-1 focus:ring-primary-500 mt-1"
                            placeholder="Initial greeting for the customer..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Action and Summary Sidebar */}
            <div className="space-y-6">
              <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-6 bg-white dark:bg-slate-900 shadow-sm rounded-xl sticky top-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Actions</h3>
                {saveStatus && (
                  <div className={cn(
                    "p-3 rounded-lg text-xs font-semibold text-center",
                    saveStatus.includes("Error")
                      ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50"
                      : "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/50"
                  )}>
                    {saveStatus}
                  </div>
                )}
                <Button
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  isLoading={isSaving}
                  className="w-full gap-2 rounded-xl h-11 text-sm font-semibold"
                >
                  <Save size={18} /> Save Configuration
                </Button>
                <p className="text-xs text-slate-900 text-center">Changes persist instantly to Firestore and take effect across OmorfiHub instantly.</p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
