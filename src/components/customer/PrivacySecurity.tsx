import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Switch } from '@/src/components/ui/Switch';
import { Lock, Smartphone } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { useSettings } from '@/src/context/SettingsContext';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { ChangePasswordModal } from './ChangePasswordModal';

export const PrivacySecurity: React.FC = () => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const { user } = useAuth();
  const { updateUserPreference } = useSettings();
  const [prefs, setPrefs] = useState({
    twoFactor: false,
    publicProfile: true,
    activityStatus: true
  });

  React.useEffect(() => {
    if (user?.preferences) {
      setPrefs(prev => ({
        ...prev,
        ...user.preferences
      }));
    }
  }, [user?.preferences]);

  const handleToggle = async (key: string, value: boolean) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    try {
      await updateUserPreference(key, value);
      toast.success('Security preference updated');
    } catch (error) {
      setPrefs(prefs); // Revert
      toast.error('Failed to update preference');
    }
  };

  return (
    <div className="space-y-8">
      <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-8">
        <div>
          <h2 className="text-2xl font-bold dark:text-white font-display">Privacy & Security</h2>
          <p className="text-slate-500 text-sm">Manage your account security and data privacy.</p>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Account Security</h3>
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <div className="flex items-center gap-3">
                <Lock className="text-primary-600" size={20} />
                <div>
                  <p className="font-bold text-sm dark:text-white">Change Password</p>
                  <p className="text-xs text-slate-500">Update your account password regularly.</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsPasswordModalOpen(true)}>Change Password</Button>
            </div>

            <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <div className="flex items-center gap-3">
                <Smartphone className="text-primary-600" size={20} />
                <div>
                  <p className="font-bold text-sm dark:text-white">Two-Factor Authentication</p>
                  <p className="text-xs text-slate-500">Add an extra layer of security to your account.</p>
                </div>
              </div>
              <motion.div whileTap={{ scale: 0.9 }}>
                <Switch
                  checked={!!prefs.twoFactor}
                  onChange={(e) => handleToggle('twoFactor', e.target.checked)}
                />
              </motion.div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Privacy Settings</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm dark:text-white">Public Profile</p>
                <p className="text-xs text-slate-500">Allow others to see your OmorfiHub username and ratings.</p>
              </div>
              <motion.div whileTap={{ scale: 0.9 }}>
                <Switch
                  checked={!!prefs.publicProfile}
                  onChange={(e) => handleToggle('publicProfile', e.target.checked)}
                />
              </motion.div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm dark:text-white">Activity Status</p>
                <p className="text-xs text-slate-500">Show when you're online or active on Omorfi Chat.</p>
              </div>
              <motion.div whileTap={{ scale: 0.9 }}>
                <Switch
                  checked={!!prefs.activityStatus}
                  onChange={(e) => handleToggle('activityStatus', e.target.checked)}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-8 border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/10 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-red-600">Danger Zone</h3>
          <p className="text-slate-500 text-sm">Irreversible actions for your account.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <p className="font-bold text-sm dark:text-white">Delete Account</p>
            <p className="text-xs text-slate-500">Permanently remove your account and all associated data.</p>
          </div>
          <Button onClick={() => toast.error("For security reasons, please contact support to delete your account.")} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/50">Delete Account</Button>
        </div>
      </Card>
    </div>
  );
};
