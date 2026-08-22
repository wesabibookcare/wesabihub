import { RoleManagement } from '@/src/components/customer/RoleManagement';
import { PrivacySecurity } from '@/src/components/customer/PrivacySecurity';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  Bell,
  Shield,
  Globe,
  Moon,
  Sun,
  Monitor,
  User,
  Smartphone
} from 'lucide-react';
import { CustomerLayout } from '@/src/layouts/CustomerLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Switch } from '@/src/components/ui/Switch';
import { cn } from '@/src/lib/utils';
import { useSettings } from '@/src/context/SettingsContext';
import { useAuth } from '@/src/context/AuthContext';
import { userEngine } from '@/src/engines';
import { toast } from 'sonner';

export const SettingsPage = () => {
  const [activeCategory, setActiveCategory] = useState('notifications');
  const { theme, setTheme, updateUserPreference } = useSettings();
  const { user } = useAuth();

  const [prefs, setPrefs] = useState({
    push: true,
    email: true,
    parcelArrival: true,
    transitUpdates: true,
    deliveryConfirmation: true,
    smsAlerts: false
  });

  React.useEffect(() => {
    if (user?.preferences) {
      setPrefs(prev => ({
        ...prev,
        ...user.preferences
      }));
    }
  }, [user?.preferences]);

  const handlePrefChange = async (key: string, value: boolean) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    try {
      await updateUserPreference(key, value);
      toast.success('Preference updated');
    } catch (error) {
      setPrefs(prefs); // Revert
      toast.error('Failed to update preference');
    }
  };

  const categories = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Privacy & Security', icon: Shield },
    { id: 'roles', label: 'Account & Roles', icon: User },
    { id: 'appearance', label: 'Theme & Appearance', icon: Monitor },
  ];

  return (
    <CustomerLayout>
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold dark:text-white font-display">Settings</h1>
          <p className="text-slate-900">Customize your WeSabiHub experience and manage your preferences.</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-10">
           {/* Navigation Sidebar */}
           <div className="lg:col-span-1">
              <Card className="p-2 border-slate-200 dark:border-slate-800 space-y-1">
                 {categories.map((cat) => (
                   <button
                     key={cat.id}
                     onClick={() => setActiveCategory(cat.id)}
                     className={cn(
                       "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                       activeCategory === cat.id
                        ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20"
                        : "text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
                     )}
                   >
                      <cat.icon size={20} />
                      <span className="font-bold text-sm">{cat.label}</span>
                   </button>
                 ))}
              </Card>
           </div>

           {/* Settings Content */}
           <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                 {activeCategory === 'notifications' && (
                   <motion.div
                     key="notifications"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className="space-y-8"
                   >
                      <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-8">
                         <div>
                            <h2 className="text-2xl font-bold dark:text-white font-display">Notification Preferences</h2>
                            <p className="text-slate-900 text-sm">Choose how and when you want to be notified.</p>
                         </div>

                         <div className="space-y-8">
                            <div className="space-y-4">
                               <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Shipment Updates</h3>
                               {[
                                 { id: 'parcelArrival', title: 'Parcel Arrival', desc: 'When your parcel reaches a WeSabiHub point.' },
                                 { id: 'transitUpdates', title: 'In Transit Updates', desc: 'Real-time updates on parcel movement.' },
                                 { id: 'deliveryConfirmation', title: 'Delivery Confirmations', desc: 'When your parcel has been collected.' },
                               ].map((pref, i) => (
                                 <div key={i} className="flex items-center justify-between">
                                    <div>
                                       <p className="font-bold text-sm dark:text-white">{pref.title}</p>
                                       <p className="text-xs text-slate-900">{pref.desc}</p>
                                    </div>
                                    <motion.div whileTap={{ scale: 0.9 }}>
                                      <Switch
                                        checked={prefs[pref.id]}
                                        onChange={(e) => handlePrefChange(pref.id, e.target.checked)}
                                      />
                                    </motion.div>
                                 </div>
                               ))}
                            </div>

                            <div className="h-px bg-slate-100 dark:bg-slate-800" />

                            <div className="space-y-4">
                               <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Delivery Channels</h3>
                               {[
                                 { id: 'push', icon: Smartphone, title: 'Push Notifications' },
                                 { id: 'email', icon: Bell, title: 'In-App Notifications' },
                                 { id: 'smsAlerts', icon: Globe, title: 'SMS Alerts' },
                               ].map((pref, i) => (
                                 <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                       <pref.icon size={18} className="text-slate-800" />
                                       <p className="font-bold text-sm dark:text-white">{pref.title}</p>
                                    </div>
                                    <motion.div whileTap={{ scale: 0.9 }}>
                                      <Switch
                                        checked={prefs[pref.id]}
                                        onChange={(e) => handlePrefChange(pref.id, e.target.checked)}
                                      />
                                    </motion.div>
                                 </div>
                               ))}
                            </div>
                         </div>
                      </Card>
                   </motion.div>
                 )}

                 {activeCategory === 'security' && (
                    <motion.div
                      key="security"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <PrivacySecurity />
                    </motion.div>
                 )}

                 {activeCategory === 'roles' && (
                    <motion.div
                      key="roles"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <RoleManagement />
                    </motion.div>
                 )}

                 {activeCategory === 'appearance' && (
                   <motion.div
                     key="appearance"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className="space-y-8"
                   >
                      <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-8">
                         <div>
                            <h2 className="text-2xl font-bold dark:text-white font-display">Appearance</h2>
                            <p className="text-slate-900 text-sm">Customize how WeSabiHub looks on your device.</p>
                         </div>

                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {[
                              { id: 'light', label: 'Light', icon: Sun, color: 'bg-white border-slate-200' },
                              { id: 'dark', label: 'Dark', icon: Moon, color: 'bg-slate-900 border-slate-800 text-white' },
                              { id: 'system', label: 'System', icon: Monitor, color: 'bg-slate-100 border-slate-200' },
                            ].map((t) => (
                              <div key={t.id} className="space-y-3">
                                 <motion.div
                                   whileHover={{ scale: 1.02 }}
                                   whileTap={{ scale: 0.98 }}
                                   onClick={() => setTheme(t.id as any)}
                                   className={cn(
                                    "h-32 rounded-2xl border-2 flex items-center justify-center cursor-pointer transition-all",
                                    theme === t.id ? "border-primary-500 ring-4 ring-primary-500/10 shadow-lg" : "hover:border-slate-300 dark:hover:border-slate-600",
                                    t.color
                                  )}
                                 >
                                    <t.icon size={32} />
                                 </motion.div>
                                 <p className="text-center font-bold text-sm dark:text-white">{t.label}</p>
                              </div>
                            ))}
                         </div>
                      </Card>
                   </motion.div>
                 )}

              </AnimatePresence>
           </div>
        </div>
      </div>
    </CustomerLayout>
  );
};
