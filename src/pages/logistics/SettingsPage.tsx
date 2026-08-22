import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  Shield,
  Users,
  Lock,
  Smartphone,
  Globe,
  CreditCard,
  ChevronRight,
  Eye,
  Settings as SettingsIcon,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { LogisticsLayout } from '@/src/layouts/LogisticsLayout';
import { toast } from 'sonner';
import { useSettings } from '@/src/context/SettingsContext';
import { useAuth } from '@/src/context/AuthContext';

export const SettingsPage = () => {
  const { updateUserPreference } = useSettings();
  const { user } = useAuth();

  const [settings, setSettings] = useState<Record<string, boolean>>({
    "Job Assignment Alerts": true,
    "Exception Notifications": true,
    "Payout Confirmations": false,
    "Mobile Scanning": true,
    "Manual Override": false,
    "Support Chat": true,
  });

  React.useEffect(() => {
    if (user?.preferences?.logistics) {
      setSettings(s => ({...s, ...user.preferences.logistics}));
    }
  }, [user]);

  const [isSaving, setIsSaving] = useState(false);

  const toggleSetting = (label: string) => {
    setSettings(s => {
      const next = { ...s, [label]: !s[label] };
      toast.success('Setting updated successfully');
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUserPreference('logistics', settings);
      toast.success('All changes saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    {
      title: "Notifications",
      icon: Bell,
      items: [
        { label: "Job Assignment Alerts", desc: "Get notified when new jobs are assigned to your fleet." },
        { label: "Exception Notifications", desc: "Real-time alerts for delivery issues and breakdowns." },
        { label: "Payout Confirmations", desc: "Email and push alerts when funds are settled." },
      ]
    },
    {
      title: "Driver Permissions",
      icon: Users,
      items: [
        { label: "Mobile Scanning", desc: "Allow drivers to use mobile camera for QR scanning." },
        { label: "Manual Override", desc: "Permit drivers to manually confirm deliveries in dead-zones." },
        { label: "Support Chat", desc: "Enable direct chat between drivers and support team." },
      ]
    }
  ];

  return (
    <LogisticsLayout>
      <div className="space-y-10">
         {sections.map((section) => (
            <div key={section.title} className="space-y-6">
               <div className="flex items-center gap-3 px-2">
                  <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-900/10 text-primary-600">
                     <section.icon size={22} />
                  </div>
                  <h3 className="text-xl font-black dark:text-white">{section.title}</h3>
               </div>

               <div className="space-y-4">
                  {section.items.map((item) => (
                     <Card key={item.label} className="p-8 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-between group transition-all hover:scale-[1.01]">
                        <div className="flex-1 pr-10">
                           <h4 className="text-lg font-black dark:text-white mb-1">{item.label}</h4>
                           <p className="text-sm font-medium text-slate-900">{item.desc}</p>
                        </div>
                        <div
                          onClick={() => toggleSetting(item.label)}
                          className={cn(
                            "w-14 h-8 rounded-full relative cursor-pointer transition-colors p-1",
                            settings[item.label] ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
                          )}
                        >
                           <motion.div
                             animate={{ x: settings[item.label] ? 24 : 0 }}
                             className="w-6 h-6 bg-white rounded-full shadow-sm"
                           />
                        </div>
                     </Card>
                  ))}
               </div>
            </div>
         ))}

         <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
               <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/10 text-amber-600">
                  <Shield size={22} />
               </div>
               <h3 className="text-xl font-black dark:text-white">Security & Access</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Card className="p-8 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] flex flex-col justify-between">
                  <div>
                     <Lock className="text-primary-600 mb-4" size={24} />
                     <h4 className="text-lg font-black dark:text-white mb-2">Two-Factor Auth</h4>
                     <p className="text-xs font-medium text-slate-900 leading-relaxed mb-6">Secure your logistics account with 2FA verification codes.</p>
                  </div>
                  <Button variant="outline" onClick={() => toast.success('2FA configuration instructions sent to email')} className="w-full rounded-2xl h-11 border-slate-200 font-bold">Configure</Button>
               </Card>

               <Card className="p-8 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] flex flex-col justify-between">
                  <div>
                     <Smartphone className="text-primary-600 mb-4" size={24} />
                     <h4 className="text-lg font-black dark:text-white mb-2">Authorized Devices</h4>
                     <p className="text-xs font-medium text-slate-900 leading-relaxed mb-6">Manage mobile devices connected to your fleet scanners.</p>
                  </div>
                  <Button variant="outline" onClick={() => toast.success('Device management loaded')} className="w-full rounded-2xl h-11 border-slate-200 font-bold">Manage (3)</Button>
               </Card>
            </div>
         </div>

         <div className="pt-10 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-slate-800">
               <p className="text-[10px] font-black uppercase tracking-widest">Platform Node: WSB-L-01</p>
               <span className="text-slate-200">•</span>
               <p className="text-[10px] font-black uppercase tracking-widest">Rules Engine: v2.4.0</p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
               <Button onClick={() => toast.success('Account reset email sent')} variant="ghost" className="rounded-2xl h-12 px-6 font-bold text-red-500 hover:bg-red-50">Reset Account</Button>
               <Button onClick={handleSave} disabled={isSaving} className="flex-1 md:flex-none rounded-2xl h-12 px-10 font-black bg-primary-600 text-white shadow-xl shadow-primary-500/20">
                  {isSaving ? <Loader2 size={18} className="animate-spin mr-2 inline" /> : null}
                  {isSaving ? 'Saving...' : 'Save All Changes'}
               </Button>
            </div>
         </div>
      </div>
    </LogisticsLayout>
  );
};
