import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Lock,
  Smartphone,
  Globe,
  Moon,
  Sun,
  ChevronRight,
  Database,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { PointLayout } from '@/src/layouts/PointLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Switch } from '@/src/components/ui/Switch';
import { cn } from '@/src/lib/utils';
import { useSettings } from '@/src/context/SettingsContext';
import { toast } from 'sonner';
import { useAuth } from '@/src/context/AuthContext';
import { centreEngine } from '@/src/engines';

export const SettingsPage = () => {
  const { theme, setTheme } = useSettings();
  const { user } = useAuth();
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [hubId, setHubId] = useState<string | null>(null);
  const [hubStatus, setHubStatus] = useState<string>('ACTIVE');

  useEffect(() => {
    const loadHub = async () => {
      if (!user) return;
      const hubs = await centreEngine.getHubsByOwner(user.uid).catch(() => []);
      if (hubs.length > 0) {
        setHubId(hubs[0].id);
        setHubStatus(hubs[0].status);
      }
    };
    loadHub();
  }, [user]);

  const handleDeactivate = async () => {
    if (!hubId) {
      toast.error('No hub found for your account.');
      return;
    }
    const goingActive = hubStatus !== 'ACTIVE';
    const confirmMsg = goingActive
      ? 'Reactivate this hub? It will start receiving parcels again.'
      : 'Deactivate this hub? It will stop receiving new parcels until you reactivate it.';
    if (!confirm(confirmMsg)) return;

    setIsDeactivating(true);
    try {
      const newStatus = goingActive ? 'ACTIVE' : 'INACTIVE';
      await centreEngine.updateHubStatus(hubId, newStatus as any, 'Toggled by hub owner from Settings');
      setHubStatus(newStatus);
      toast.success(goingActive ? 'Hub reactivated successfully.' : 'Hub deactivated. It will no longer receive new parcels.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update hub status.');
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleNavClick = (title: string) => {
    toast.info(`${title} settings coming soon.`);
  };

  const sections = [
    {
      title: 'Point Preferences',
      icon: SettingsIcon,
      settings: [
        { title: 'Notifications', desc: 'Manage SMS and Push alerts', icon: Bell },
        { title: 'Security', desc: '2FA and access logs', icon: Shield },
        { title: 'Privacy', desc: 'Control your public visibility', icon: Lock },
      ]
    },
    {
      title: 'Integration',
      icon: Globe,
      settings: [
        { title: 'Mobile App', desc: 'Sync with OmorfiHub Go', icon: Smartphone },
        { title: 'Data Export', desc: 'Schedule automated reports', icon: Database },
      ]
    }
  ];

  return (
    <PointLayout>
      <div className="space-y-10 max-w-4xl mx-auto pb-20">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold dark:text-white font-display">Settings</h1>
          <p className="text-slate-900">Configure your hub's operation and security parameters.</p>
        </div>

        <div className="space-y-8">
           {sections.map((section, idx) => (
             <div key={idx} className="space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest px-2">{section.title}</h3>
                <Card className="border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                   {section.settings.map((setting, sIdx) => (
                     <div
                       key={sIdx}
                       onClick={() => handleNavClick(setting.title)}
                       className="p-6 flex items-center justify-between group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                     >
                        <div className="flex items-center gap-5">
                           <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 flex items-center justify-center transition-colors group-hover:bg-primary-600 group-hover:text-white">
                              <setting.icon size={20} />
                           </div>
                           <div>
                              <h4 className="font-bold text-sm dark:text-white">{setting.title}</h4>
                              <p className="text-xs text-slate-900">{setting.desc}</p>
                           </div>
                        </div>
                        <ChevronRight className="text-slate-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" size={20} />
                     </div>
                   ))}
                </Card>
             </div>
           ))}

           <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest px-2">Appearance</h3>
              <Card className="p-6 border-slate-200 dark:border-slate-800 flex items-center justify-between">
                 <div className="flex items-center gap-5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 flex items-center justify-center">
                       {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                    </div>
                    <div>
                       <h4 className="font-bold text-sm dark:text-white">Dark Mode</h4>
                       <p className="text-xs text-slate-900">Reduce eye strain during night shifts</p>
                    </div>
                 </div>
                 <Switch
                   checked={theme === 'dark'}
                   onChange={(e: any) => setTheme(e.target.checked ? 'dark' : 'light')}
                 />
              </Card>
           </div>

           <div className="pt-10 space-y-4">
              <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest px-2">Danger Zone</h3>
              <Card className="p-6 border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                       <AlertTriangle size={24} />
                    </div>
                    <div>
                       <h4 className="font-bold text-sm dark:text-white">{hubStatus === 'ACTIVE' ? 'Deactivate Hub' : 'Reactivate Hub'}</h4>
                       <p className="text-xs text-slate-900">
                         {hubStatus === 'ACTIVE' ? 'Temporarily stop receiving parcels at this location.' : 'This hub is currently inactive and not receiving new parcels.'}
                       </p>
                    </div>
                 </div>
                 <Button
                   variant="outline"
                   onClick={handleDeactivate}
                   disabled={isDeactivating || !hubId}
                   className="rounded-xl h-12 px-8 border-red-200 text-red-600 hover:bg-red-600 hover:text-white font-bold"
                 >
                    <Trash2 size={18} className="mr-2" />
                    {isDeactivating ? 'Updating...' : hubStatus === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
                 </Button>
              </Card>
           </div>
        </div>
      </div>
    </PointLayout>
  );
};
