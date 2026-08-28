import { toast } from 'sonner';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Shield,
  Bell,
  ChevronRight,
  LogOut,
  Trash2,
  Lock,
  Smartphone,
  AtSign,
  Check
} from 'lucide-react';
import { CustomerLayout } from '@/src/layouts/CustomerLayout';
import { MerchantLayout } from '@/src/layouts/MerchantLayout';
import { AdminLayout } from '@/src/layouts/AdminLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Avatar } from '@/src/components/ui/Avatar';
import { Badge } from '@/src/components/ui/Badge';
import { Switch } from '@/src/components/ui/Switch';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { userEngine } from '@/src/engines';
import { updateProfile } from 'firebase/auth';
import { StorageService } from '@/src/services/StorageService';
import { IdVerificationSection } from '@/src/components/profile/IdVerificationSection';
import { AvatarPickerModal } from '@/src/components/profile/AvatarPickerModal';

export const ProfilePage = () => {
  const { user, fbUser, refreshUser } = useAuth();

  // Choose layout based on user role
  const Layout = user?.role === 'MERCHANT' ? MerchantLayout :
                 user?.role === 'SUPER_ADMIN' ? AdminLayout :
                 CustomerLayout;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [wesabiUsername, setWesabiUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [preferences, setPreferences] = useState({
    push: true,
    email: false,
    public: false
  });

  useEffect(() => {
    if (user) {
      const names = user.displayName?.split(' ') || ['User', ''];
      setFirstName(names[0] || '');
      setLastName(names.slice(1).join(' ') || '');
      setPhone(user.phoneNumber || '');

      if (user.wesabiUsername) {
        setWesabiUsername(user.wesabiUsername);
      } else {
        const names = (user.displayName || 'User').split(' ');
        const nameToUse = (names[0] || names[1] || 'User').toLowerCase().replace(/[^a-z0-9_]/g, '');
        const randomNum = Math.floor(100 + Math.random() * 900); // 3 digit number
        setWesabiUsername(`${nameToUse}${randomNum}`);
      }

      if (user.preferences) {
        setPreferences(prev => ({ ...prev, ...user.preferences }));
      }
    }
  }, [user]);

  const saveSettings = async (newPrefs: typeof preferences) => {
    if (!user) return;
    try {
      await userEngine.updateProfile(user.uid, {
        preferences: newPrefs
      });
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings');
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (!wesabiUsername) {
        throw new Error('OmorfiHub Username is required.');
      }

      let formattedUsername = wesabiUsername.trim().replace(/^@/, '');

      // Check format
      const usernameRegex = /^[a-zA-Z0-9_]{2,20}$/i;
      if (!usernameRegex.test(formattedUsername)) {
        throw new Error('Username must be 2-20 alphanumeric characters or underscores.');
      }

      // Query uniqueness
      const existing = await userEngine.getByUsername(formattedUsername);
      if (existing && existing.uid !== user.uid) {
        throw new Error('This OmorfiHub Username is already taken.');
      }

       await userEngine.updateProfile(user.uid, {
        displayName: `${firstName} ${lastName}`.trim(),
        phoneNumber: phone,
        wesabiUsername: formattedUsername
      });
      setWesabiUsername(formattedUsername);
      await refreshUser();
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelected = async (fileOrBase64: File | string) => {
    if (!user) return;

    try {
      if (typeof fileOrBase64 === 'string') {
        // It's a base64 string from camera capture
        const url = await StorageService.uploadFile(`avatars/${user.uid}/avatar.jpg`, fileOrBase64);
        if (fbUser && !url.startsWith('data:')) await updateProfile(fbUser, { photoURL: url });
        await userEngine.updateProfile(user.uid, { photoURL: url, photoUrl: url });
        await refreshUser();
        toast.success('Profile picture updated successfully!');
      } else {
        // It's a File object
        if (!fileOrBase64.type.startsWith('image/')) {
          toast.error('Invalid file format. Please upload an image.');
          return;
        }
        if (fileOrBase64.size > 10 * 1024 * 1024) {
          toast.error('File size exceeds 10MB limit.');
          return;
        }

        const url = await StorageService.uploadFile(`avatars/${user.uid}/avatar.jpg`, fileOrBase64);
        if (fbUser && !url.startsWith('data:')) await updateProfile(fbUser, { photoURL: url });
        await userEngine.updateProfile(user.uid, { photoURL: url, photoUrl: url });
        await refreshUser();
        toast.success('Profile picture updated successfully!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile picture');
    }
  };

  const handleAvatarDelete = async () => {
    if (!user || (!user.photoURL && !user.photoUrl)) return;
    try {
      try {
        await StorageService.deleteFile(`avatars/${user.uid}/avatar.jpg`);
      } catch (storageErr) {
        console.warn("Could not delete avatar from Firebase Storage (it might not exist), continuing with database update", storageErr);
      }
      if (fbUser) await updateProfile(fbUser, { photoURL: '' });
      await userEngine.updateProfile(user.uid, { photoURL: '', photoUrl: '' });
      await refreshUser();
      toast.success('Profile picture removed');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete profile picture');
    }
  };

  const togglePref = async (key: keyof typeof preferences) => {
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPrefs);
    await saveSettings(newPrefs);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold dark:text-white font-display">My Profile</h1>
          <p className="text-slate-900">Manage your personal information and account security.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
           <div className="lg:col-span-1 space-y-8">
              <Card className="p-8 flex flex-col items-center text-center space-y-6 border-slate-200 dark:border-slate-800">
                 <div className="relative group">
                        <Avatar
                          src={user?.photoURL || user?.photoUrl || ""}
                          name={user?.displayName || "User"}
                          className="w-32 h-32 border-4 border-primary-500/10"
                        />
                        <div className="absolute bottom-0 right-0 flex gap-1">
                           <button onClick={() => setIsPickerOpen(true)} className="p-2 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-all">
                              <Camera size={18} />
                           </button>
                           {(user?.photoURL || user?.photoUrl) && (
                             <button onClick={handleAvatarDelete} className="p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all">
                                <Trash2 size={18} />
                             </button>
                           )}
                        </div>
                 </div>
                 <div className="space-y-2">
                    <h2 className="text-2xl font-bold dark:text-white font-display">{user?.displayName || 'User'}</h2>
                    {user?.wesabiUsername && <p className="text-primary-600 font-bold font-mono text-sm">{user.wesabiUsername}</p>}
                 </div>
              </Card>
           </div>

           <div className="lg:col-span-2 space-y-8">
              <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-8">
                 <h3 className="text-xl font-bold dark:text-white font-display">Personal Details</h3>
                 <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">First Name</label>
                       <Input value={firstName} onChange={e => setFirstName(e.target.value)} prefix={<User size={18} />} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Last Name</label>
                       <Input value={lastName} onChange={e => setLastName(e.target.value)} prefix={<User size={18} />} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">OmorfiHub Username</label>
                       <Input
                          value={wesabiUsername}
                          onChange={e => setWesabiUsername(e.target.value)}
                          prefix={<AtSign size={18} className="text-primary-500" />}
                          placeholder="username"
                          className="font-bold text-primary-600 font-mono"
                       />
                       <p className="text-[10px] text-slate-800 dark:text-slate-300">Must be unique across OmorfiHub.</p>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Email Address</label>
                       <Input value={user?.email || ''} prefix={<Mail size={18} />} disabled />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                       <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Phone Number</label>
                       <Input value={phone} onChange={e => setPhone(e.target.value)} prefix={<Phone size={18} />} />
                    </div>
                 </div>

                 <div className="flex justify-end pt-4 items-center gap-4">
                    <AnimatePresence>
                      {showSaved && (
                        <motion.div initial={{opacity: 0, x: 20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0}} className="text-emerald-500 font-bold flex items-center gap-2 text-sm">
                          <Check size={16} /> Saved!
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <Button onClick={handleSave} disabled={saving} isLoading={saving} className="rounded-xl px-10 h-12">
                      Save Changes
                    </Button>
                 </div>
              </Card>

              <IdVerificationSection />

              <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">
                 <h3 className="text-xl font-bold dark:text-white font-display">Preferences</h3>
                 <div className="space-y-6">
                    {[
                      { icon: Bell, title: 'Push Notifications', desc: 'Receive real-time updates on your device.', key: 'push' },
                      { icon: Mail, title: 'Email Marketing', desc: 'Stay updated with promotions and news.', key: 'email' },
                      { icon: Shield, title: 'Public Profile', desc: 'Make your profile visible to other users.', key: 'public' },
                    ].map((pref, i) => {
                      return (
                      <div key={i} className="flex items-center justify-between">
                         <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-900">
                               <pref.icon size={20} />
                            </div>
                            <div>
                               <p className="font-bold text-sm dark:text-white">{pref.title}</p>
                               <p className="text-xs text-slate-900">{pref.desc}</p>
                            </div>
                         </div>
                         <Switch checked={!!preferences[pref.key as keyof typeof preferences]} onChange={() => togglePref(pref.key as keyof typeof preferences)} />
                      </div>
                      )
                    })}
                 </div>
              </Card>
           </div>
        </div>
      </div>
      <AvatarPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onImageSelected={handleAvatarSelected}
        currentAvatarUrl={user?.photoURL || user?.photoUrl}
      />
    </Layout>
  );
};
