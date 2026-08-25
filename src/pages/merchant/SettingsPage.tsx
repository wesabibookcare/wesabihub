import React, { useState, useEffect } from 'react';
import { PrivacySecurity } from '@/src/components/customer/PrivacySecurity';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  Bell,
  Shield,
  Globe,
  Moon,
  Sun,
  Monitor,
  Lock,
  User,
  CreditCard,
  Building2,
  Image as ImageIcon,
  Smartphone,
  Eye,
  ChevronRight,
  Palette,
  Plus,
  Loader2,
  CheckCircle2,
  Camera,
  Mail,
  Phone
} from 'lucide-react';
import { MerchantLayout } from '@/src/layouts/MerchantLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { Switch } from '@/src/components/ui/Switch';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { userEngine } from '@/src/engines';
import { merchantEngine } from '@/src/engines';
import { merchantBusinessRepository } from '@/src/services/db/MerchantBusinessRepository';
import { updateProfile } from 'firebase/auth';
import { StorageService } from '@/src/services/StorageService';
import { MerchantBusiness } from '@/src/types';
import { toast } from 'sonner';

export const MerchantSettingsPage = () => {
  const { user, fbUser } = useAuth();
  const [activeCategory, setActiveCategory] = useState('profile');
  const [storeLogo, setStoreLogo] = useState<string>(user?.photoURL || user?.photoUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&h=150&fit=crop');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [merchantBus, setMerchantBus] = useState<MerchantBusiness | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [businessDesc, setBusinessDesc] = useState('');
  const [brandColor, setBrandColor] = useState('#7C3AED');
  const [storeTheme, setStoreTheme] = useState('modern');

  const [allowDelegatedBooking, setAllowDelegatedBooking] = useState<boolean>(
    user?.allowDelegatedBooking !== false
  );
  const [showDisclaimerModal, setShowDisclaimerModal] = useState<boolean>(false);

  const [settings, setSettings] = useState<Record<string, boolean>>({
    newOrderReceived: true,
    orderPickedUp: true,
    deliveryConfirmation: true,
    safePayFundsReleased: true,
    payoutSuccessful: true,
    serviceFeeDeducted: false
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const businesses = await merchantEngine.getBusinessesByMerchant(user!.uid);
      if (businesses.length > 0) {
        const bus = businesses[0];
        setMerchantBus(bus);
        setBusinessName(bus.businessName || bus.name || '');
        setBusinessDesc(bus.description || '');
        setBrandColor(bus.brandColor || '#7C3AED');
        setStoreTheme(bus.storeTheme || 'modern');
        if (bus.notificationSettings) {
          setSettings(bus.notificationSettings);
        }
      }
      if (user?.photoURL || user?.photoUrl) {
        setStoreLogo(user.photoURL || user.photoUrl || '');
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUploadClick = () => {
    document.getElementById('merchant-logo-input')?.click();
  };

  const handleLogoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file format. Please upload PNG, JPG, or WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit.');
      return;
    }

    try {
      setIsUploading(true);

      const url = await StorageService.uploadFile(`avatars/${user.uid}/avatar.jpg`, file);
      if (fbUser && !url.startsWith('data:')) await updateProfile(fbUser, { photoURL: url });
      await userEngine.updateProfile(user.uid, { photoURL: url, photoUrl: url });

      if (merchantBus) {
        await merchantEngine.updateBusiness(user.uid, { logoUrl: url });
      }

      setStoreLogo(url);
      toast.success('Logo updated successfully');
    } catch (err) {
      console.error("Store logo selection failed", err);
      toast.error('Failed to upload profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await merchantEngine.updateBusiness(user.uid, {
        businessName: businessName,
        name: businessName,
        description: businessDesc,
        brandColor: brandColor,
        storeTheme: storeTheme,
        notificationSettings: settings
      });

      await userEngine.updateProfile(user.uid, {
        allowDelegatedBooking
      } as any);

      setShowSaved(true);
      toast.success('Settings saved successfully');
      setTimeout(() => setShowSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save:', err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDelegatedBooking = (enabled: boolean) => {
    if (enabled) {
      setShowDisclaimerModal(true);
    } else {
      setAllowDelegatedBooking(false);
      toast.info('Delegated booking disabled. Other users cannot create parcels on your behalf.');
    }
  };

  const confirmDelegatedBookingDisclaimer = async () => {
    setAllowDelegatedBooking(true);
    setShowDisclaimerModal(false);
    if (user) {
      await userEngine.updateProfile(user.uid, { allowDelegatedBooking: true } as any);
      toast.success('Delegated booking enabled with legal disclaimer acknowledgement.');
    }
  };

  const categories = [
    { id: 'profile', label: 'User Profile', icon: User },
    { id: 'business', label: 'Business Profile', icon: Building2 },
    { id: 'branding', label: 'Store Branding', icon: Palette },
    { id: 'delegated', label: 'Delegated Booking', icon: Smartphone },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Privacy & Security', icon: Shield },
  ];

  if (loading) {
    return (
      <MerchantLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-primary-600" size={40} />
        </div>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout>
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold dark:text-white font-display">Settings</h1>
            <p className="text-slate-800">Manage your business profile, branding, and account preferences.</p>
          </div>
          <Button
            className="rounded-xl h-12 px-8 shadow-lg transition-all active:scale-95"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : (showSaved ? <CheckCircle2 className="mr-2" size={18} /> : null)}
            {saving ? 'Saving...' : (showSaved ? 'Saved' : 'Save Changes')}
          </Button>
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
                       "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm",
                       activeCategory === cat.id
                        ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20"
                        : "text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                     )}
                   >
                      <cat.icon size={20} />
                      {cat.label}
                   </button>
                 ))}
              </Card>
           </div>

           {/* Settings Content */}
           <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                 {activeCategory === 'profile' && (
                    <motion.div
                      key="profile"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                       <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-8">
                          <div>
                             <h2 className="text-2xl font-bold dark:text-white font-display">User Profile</h2>
                             <p className="text-sm text-slate-800">Manage your personal account details.</p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-800 uppercase tracking-widest">Full Name</label>
                                <Input value={user?.displayName || ''} readOnly className="bg-slate-50 opacity-70" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-800 uppercase tracking-widest">Username</label>
                                <Input value={user?.wesabiUsername || 'Not Set'} readOnly className="bg-slate-50 opacity-70" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-800 uppercase tracking-widest">Email</label>
                                <Input value={user?.email || ''} readOnly className="bg-slate-50 opacity-70" />
                             </div>
                          </div>
                       </Card>
                    </motion.div>
                  )}
                 {activeCategory === 'business' && (
                   <motion.div
                     key="business"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className="space-y-8"
                   >
                      <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-8">
                         <div>
                            <h2 className="text-2xl font-bold dark:text-white font-display">Business Profile</h2>
                            <p className="text-sm text-slate-800">Public information about your store.</p>
                         </div>

                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="sm:col-span-2 flex items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                               <input
                                 type="file"
                                 id="merchant-logo-input"
                                 className="hidden"
                                 accept="image/*"
                                 onChange={handleLogoSelected}
                                />
                               <div
                                 onClick={handleLogoUploadClick}
                                 className="w-24 h-24 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 relative group overflow-hidden cursor-pointer shadow-md"
                               >
                                  {storeLogo ? (
                                    <img src={storeLogo} className="w-full h-full object-cover" alt="Store Logo" />
                                  ) : (
                                    <ImageIcon size={32} />
                                  )}
                                  <button type="button" className="absolute inset-0 bg-slate-900/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">Change Logo</button>
                               </div>
                               <div className="space-y-1">
                                  <h4 className="font-bold dark:text-white">Store Logo</h4>
                                  <p className="text-xs text-slate-800">Recommended size: 512x512px. PNG or SVG.</p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="h-8 text-[10px] mt-2 rounded-lg transition-all active:scale-95"
                                    onClick={handleLogoUploadClick}
                                    isLoading={isUploading}
                                  >
                                    Upload Logo
                                  </Button>
                               </div>
                            </div>
                            <div className="space-y-2">
                               <label className="text-xs font-bold text-slate-800 uppercase tracking-widest">Business Name</label>
                               <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                               <label className="text-xs font-bold text-slate-800 uppercase tracking-widest">Business Email</label>
                               <Input defaultValue={user?.email || ''} readOnly className="bg-slate-50 opacity-70" />
                            </div>
                            <div className="sm:col-span-2 space-y-2">
                               <label className="text-xs font-bold text-slate-800 uppercase tracking-widest">Business Description</label>
                               <textarea className="w-full h-24 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border-none outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white text-sm font-semibold" value={businessDesc} onChange={(e) => setBusinessDesc(e.target.value)} />
                            </div>
                         </div>
                      </Card>
                   </motion.div>
                 )}

                 {activeCategory === 'delegated' && (
                   <motion.div
                     key="delegated"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className="space-y-8"
                   >
                      <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-8">
                         <div>
                            <h2 className="text-2xl font-bold dark:text-white font-display">Delegated Booking Preferences</h2>
                            <p className="text-sm text-slate-800">Control whether approved Hub Owners, Staff, or fellow Merchants can assist you with booking parcels on your behalf.</p>
                         </div>

                         <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
                            <div className="flex items-center justify-between">
                               <div>
                                  <p className="font-bold dark:text-white">Allow Delegated "Help Me" Booking</p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mt-1">
                                    Enables authorized helpers to initiate a parcel creation on your behalf by verifying a 6-digit OTP code sent to your phone/email.
                                  </p>
                               </div>
                               <Switch
                                 checked={allowDelegatedBooking}
                                 onChange={(e: any) => handleToggleDelegatedBooking(e.target.checked)}
                               />
                            </div>

                            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 leading-relaxed space-y-2">
                               <p className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                                 <Shield size={16} /> Legal Notice & Merchant Responsibility
                               </p>
                               <p>
                                 By enabling this feature, you authorize designated helpers (verified Hub Owners, Hub Staff, or fellow Merchants) to book shipments under your merchant identity upon providing a 6-digit security OTP. OmorfiHub is not liable for unauthorized OTP sharing or carelessness on your part. Never share your OTP code unless you explicitly requested assistance.
                               </p>
                            </div>
                         </div>
                      </Card>
                   </motion.div>
                 )}

                 {activeCategory === 'branding' && (
                   <motion.div
                     key="branding"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     className="space-y-8"
                   >
                      <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-8">
                         <div>
                            <h2 className="text-2xl font-bold dark:text-white font-display">Store Branding</h2>
                            <p className="text-sm text-slate-800">Customize how your store appears on OmorfiHub.</p>
                         </div>

                         <div className="space-y-6">
                            <div className="space-y-4">
                               <label className="text-xs font-bold text-slate-800 uppercase tracking-widest">Brand Primary Color</label>
                               <div className="flex flex-wrap gap-4">
                                  {['#0F172A', '#2563EB', '#7C3AED', '#DB2777', '#059669'].map((color) => (
                                    <div
                                      key={color}
                                      className={cn(
                                        "w-12 h-12 rounded-2xl cursor-pointer transition-all border-4 active:scale-90",
                                        color === brandColor ? "border-primary-500 scale-110 shadow-lg" : "border-transparent"
                                      )} onClick={() => setBrandColor(color)}
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                  <label className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 border-4 border-transparent cursor-pointer active:scale-90 relative overflow-hidden">
                                     <Plus size={20} />
                                     <input
                                       type="color"
                                       value={brandColor}
                                       onChange={(e) => setBrandColor(e.target.value)}
                                       className="absolute inset-0 opacity-0 cursor-pointer"
                                     />
                                  </label>
                               </div>
                            </div>

                            <div className="space-y-4">
                               <label className="text-xs font-bold text-slate-800 uppercase tracking-widest">Store Theme</label>
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className={cn("p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-95", storeTheme === "modern" ? "border-primary-500 bg-primary-500/5" : "border-slate-200 dark:border-slate-800 hover:border-slate-300")} onClick={() => setStoreTheme("modern")}>
                                     <div className="h-20 bg-white dark:bg-slate-800 rounded-lg mb-3 shadow-sm" />
                                     <p className="font-bold text-sm dark:text-white">Modern Minimalist</p>
                                  </div>
                                  <div className={cn("p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-95", storeTheme === "classic" ? "border-primary-500 bg-primary-500/5" : "border-slate-200 dark:border-slate-800 hover:border-slate-300")} onClick={() => setStoreTheme("classic")}>
                                     <div className="h-20 bg-slate-900 rounded-lg mb-3 shadow-sm" />
                                     <p className="font-bold text-sm dark:text-white">Classic Dark</p>
                                  </div>
                                </div>
                            </div>
                         </div>
                      </Card>
                   </motion.div>
                 )}

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
                            <p className="text-sm text-slate-800">Choose how you want to be alerted about store activity.</p>
                         </div>

                         <div className="space-y-8">
                            {[
                              {
                                group: 'Order Updates',
                                items: [
                                  { label: 'New Order Received', key: 'newOrderReceived' },
                                  { label: 'Order Picked Up', key: 'orderPickedUp' },
                                  { label: 'Delivery Confirmation', key: 'deliveryConfirmation' }
                                ]
                              },
                              {
                                group: 'Financial Alerts',
                                items: [
                                  { label: 'SafePay Funds Released', key: 'safePayFundsReleased' },
                                  { label: 'Payout Successful', key: 'payoutSuccessful' },
                                  { label: 'Service Fee Deducted', key: 'serviceFeeDeducted' }
                                ]
                              },
                            ].map((group, i) => (
                              <div key={i} className="space-y-4">
                                 <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">{group.group}</h3>
                                 <div className="space-y-4">
                                    {group.items.map((item) => (
                                         <div key={item.key} className="flex items-center justify-between">
                                            <p className="text-sm font-bold dark:text-white">{item.label}</p>
                                            <Switch
                                              checked={!!settings[item.key]}
                                              onChange={(e: any) => {
                                                setSettings(s => ({...s, [item.key]: e.target.checked}));
                                              }}
                                            />
                                         </div>
                                       ))}
                                 </div>
                                 {i === 0 && <div className="h-px bg-slate-100 dark:bg-slate-800 pt-4" />}
                              </div>
                            ))}
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
              </AnimatePresence>
           </div>
        </div>
      </div>

      {/* Legal Disclaimer Modal */}
      {showDisclaimerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-lg w-full space-y-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
                 <Shield size={28} />
              </div>
              <div className="space-y-2">
                 <h3 className="text-xl font-bold dark:text-white font-display">Delegated Booking Authorization Terms</h3>
                 <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                   Please read and acknowledge the following legal disclaimer before activating delegated parcel booking.
                 </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed max-h-48 overflow-y-auto">
                 <p className="font-semibold text-slate-900 dark:text-white">
                   1. Authorization Consent:
                 </p>
                 <p>
                   You explicitly consent that verified Hub Owners, Hub Staff, or fellow Merchants may initiate shipment creation under your merchant identity only when you provide them with the 6-digit one-time authorization code (OTP) sent to your registered phone or email.
                 </p>
                 <p className="font-semibold text-slate-900 dark:text-white">
                   2. Liability & OTP Safety:
                 </p>
                 <p>
                   OmorfiHub and Omorfi Limited hold zero liability for fraudulent, incorrect, or careless bookings resulting from your voluntary disclosure of the authorization OTP code to unauthorized individuals.
                 </p>
                 <p className="font-semibold text-slate-900 dark:text-white">
                   3. Contraband Responsibility:
                 </p>
                 <p>
                   You remain strictly liable for the contents of any parcel booked on your behalf. Parcels containing illegal or hazardous goods will be confiscated and reported to legal authorities.
                 </p>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                 <Button variant="outline" onClick={() => setShowDisclaimerModal(false)} className="rounded-xl h-11">
                    Cancel
                 </Button>
                 <Button onClick={confirmDelegatedBookingDisclaimer} className="rounded-xl h-11 bg-amber-600 hover:bg-amber-700 text-white font-bold">
                    I Understand & Agree
                 </Button>
              </div>
           </motion.div>
        </div>
      )}
    </MerchantLayout>
  );
};
