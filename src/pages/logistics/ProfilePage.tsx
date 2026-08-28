import { toast } from "sonner";
import { useRef, useState } from "react";
import React from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  MapPin,
  Truck,
  CheckCircle2,
  FileText,
  Mail,
  Phone,
  ExternalLink,
  ChevronRight,
  Plus
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { useAuth } from "@/src/context/AuthContext";
import { userEngine } from '@/src/engines';
import { updateProfile } from "firebase/auth";
import { StorageService } from '@/src/services/StorageService';
import { profileUpdateAuditService } from '@/src/services/ProfileUpdateAuditService';
import { Trash2, Camera, Edit2, Check, X, AtSign, Save } from "lucide-react";
import { LogisticsLayout } from '@/src/layouts/LogisticsLayout';
import { Input } from "@/src/components/ui/Input";
import { AvatarPickerModal } from '@/src/components/profile/AvatarPickerModal';


export const ProfilePage = () => {
  const { user, fbUser, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [wesabiUsername, setWesabiUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [headquarters, setHeadquarters] = useState('');

  React.useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || 'Swift Logistics Ltd');
      setPhone(user.phoneNumber || user.phone || '');
      setEmail(user.email || '');
      setHeadquarters(user.address || '12, Oba Akran, Ikeja, Lagos');

      if (user.wesabiUsername) {
        setWesabiUsername(user.wesabiUsername);
      } else {
        const cleanName = (user.displayName || 'Logistics').replace(/[^a-zA-Z0-9]/g, '');
        const randomNum = user.uid ? user.uid.substring(0, 5) : Math.random().toString(36).substring(2, 7);
        setWesabiUsername(`WSH_${cleanName}${randomNum}`);
      }
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
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

      // Log the profile audit changes
      const oldPhone = user.phoneNumber || user.phone || '';
      if (phone !== oldPhone) {
        const authorityId = user.role === 'DISPATCH_RIDER' ? 'ADMIN' : (user.companyId || 'ADMIN');
        await profileUpdateAuditService.logChange({
          userId: user.uid,
          userDisplayName: user.displayName || 'Unknown User',
          userRole: user.role,
          field: 'phone',
          oldValue: oldPhone,
          newValue: phone,
          authorityId: authorityId
        });
      }

      await userEngine.updateProfile(user.uid, {
        displayName: displayName.trim(),
        phone: phone,
        phoneNumber: phone,
        wesabiUsername: formattedUsername,
        address: headquarters
      });

      setWesabiUsername(formattedUsername);
      setIsEditing(false);
      await refreshUser();
      toast.success('Business Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update business profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarSelected = async (fileOrBase64: File | string) => {
    if (!user) return;

    setIsUploading(true);
    try {
      if (typeof fileOrBase64 === 'string') {
        const url = await StorageService.uploadFile(`avatars/${user.uid}/avatar.jpg`, fileOrBase64);
        if (fbUser && !url.startsWith('data:')) await updateProfile(fbUser, { photoURL: url });
        await userEngine.updateProfile(user.uid, { photoURL: url, photoUrl: url });
        toast.success('Logo updated successfully!');
      } else {
        const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
        if (!validTypes.includes(fileOrBase64.type)) {
          toast.error('Invalid file format. Please upload PNG, JPG, or WEBP.');
          return;
        }
        if (fileOrBase64.size > 5 * 1024 * 1024) {
          toast.error('File size exceeds 5MB limit.');
          return;
        }

        const url = await StorageService.uploadFile(`avatars/${user.uid}/avatar.jpg`, fileOrBase64);
        if (fbUser && !url.startsWith('data:')) await updateProfile(fbUser, { photoURL: url });
        await userEngine.updateProfile(user.uid, { photoURL: url, photoUrl: url });
        toast.success('Logo updated successfully!');
      }
      await refreshUser();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update logo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarDelete = async () => {
    if (!user || (!user.photoURL && !user.photoUrl)) return;
    try {
      try {
        await StorageService.deleteFile(`avatars/${user.uid}/avatar.jpg`);
      } catch (storageErr) {
        console.warn("Could not delete avatar from Firebase Storage, continuing database update", storageErr);
      }
      if (fbUser) await updateProfile(fbUser, { photoURL: '' });
      await userEngine.updateProfile(user.uid, { photoURL: '', photoUrl: '' });
      await refreshUser();
      toast.success('Profile logo removed');
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove logo');
    }
  };

  return (

    <LogisticsLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <p className="text-emerald-600 font-bold uppercase tracking-widest text-[10px] mb-2">Company Compliance</p>
           <h1 className="text-4xl font-black tracking-tight dark:text-white">Business Profile</h1>
           <p className="text-slate-900 font-medium mt-1">Manage your logistics firm's identity and operational reach.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            {/* Identity Card */}
            <Card className="p-10 border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[3rem] relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                              <div className="flex items-center gap-8 mb-10">
                  <div className="relative group w-24 h-24 rounded-[2rem] overflow-hidden shadow-2xl shadow-primary-500/20">
                     {user?.photoURL || user?.photoUrl ? (
                        <img src={user.photoURL || user?.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                     ) : (
                        <div className="w-full h-full bg-primary-600 text-white flex items-center justify-center font-black text-4xl">
                           {user?.displayName?.[0] || 'L'}
                        </div>
                     )}
                     <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                       <button onClick={() => setIsPickerOpen(true)} className="p-2 hover:bg-white/20 rounded-full">
                         <Camera size={20} />
                       </button>
                       {(user?.photoURL || user?.photoUrl) && (
                         <button onClick={handleAvatarDelete} className="p-2 hover:bg-red-500/80 rounded-full text-red-100">
                           <Trash2 size={20} />
                         </button>
                       )}
                     </div>

                  </div>
                  <div>
                     <h2 className="text-3xl font-black dark:text-white">{user?.displayName || 'Swift Logistics Ltd'}</h2>
                     {user?.wesabiUsername && (
                        <p className="text-primary-600 font-bold font-mono text-sm mt-1">{user.wesabiUsername}</p>
                     )}

                     <p className="text-slate-900 font-bold uppercase tracking-widest text-xs mt-1">Reg ID: WSB-LG-0021</p>
                     <div className="flex items-center gap-2 mt-4 text-emerald-600">
                        <ShieldCheck size={18} />
                        <span className="text-sm font-black uppercase tracking-widest">Fully Verified Partner</span>
                     </div>
                  </div>
               </div>

               {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-slate-100 dark:border-slate-800">
                     <div className="space-y-6">
                        <div>
                           <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-2 block">Hub Name</label>
                           <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-10 text-sm font-black" />
                        </div>
                        <div>
                           <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-2 block">OmorfiHub Username</label>
                           <Input
                              value={wesabiUsername}
                              onChange={(e) => setWesabiUsername(e.target.value)}
                              prefix={<AtSign size={16} className="text-primary-500" />}
                              className="h-10 text-sm font-bold font-mono text-primary-600"
                           />
                        </div>
                     </div>
                     <div className="space-y-6">
                        <div>
                           <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-2 block">Support Line</label>
                           <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10 text-sm font-black" />
                        </div>
                        <div>
                           <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-2 block">Headquarters</label>
                           <Input value={headquarters} onChange={(e) => setHeadquarters(e.target.value)} className="h-10 text-sm font-black" />
                        </div>
                        <div className="flex gap-2 pt-2">
                           <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1 rounded-2xl h-12 font-bold">Cancel</Button>
                           <Button onClick={handleSave} disabled={isSaving} isLoading={isSaving} className="flex-1 rounded-2xl h-12 bg-primary-600 hover:bg-primary-700 text-white font-bold gap-2">
                              <Save size={18} /> Save
                           </Button>
                        </div>
                     </div>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-slate-100 dark:border-slate-800">
                     <div className="space-y-6">
                        <div>
                           <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-2 block">Primary Contact</label>
                           <div className="flex items-center gap-3">
                              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800">
                                 <Mail size={18} />
                              </div>
                              <span className="text-sm font-black dark:text-white">{user?.email || 'admin@swiftlogistics.ng'}</span>
                           </div>
                        </div>
                        <div>
                           <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-2 block">OmorfiHub Username</label>
                           <div className="flex items-center gap-3">
                              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800">
                                 <AtSign size={18} />
                              </div>
                              <span className="text-sm font-bold text-primary-600 font-mono">{user?.wesabiUsername || 'Not Set'}</span>
                           </div>
                        </div>
                     </div>
                     <div className="space-y-6">
                        <div>
                           <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-2 block">Support Line</label>
                           <div className="flex items-center gap-3">
                              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800">
                                 <Phone size={18} />
                              </div>
                              <span className="text-sm font-black dark:text-white">{user?.phone || user?.phoneNumber || '+234 1 223 9021'}</span>
                           </div>
                        </div>
                        <div>
                           <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-2 block">Headquarters</label>
                           <div className="flex items-center gap-3">
                              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800">
                                 <MapPin size={18} />
                              </div>
                              <span className="text-sm font-black dark:text-white">{user?.address || '12, Oba Akran, Ikeja, Lagos'}</span>
                           </div>
                        </div>
                        <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full rounded-2xl h-12 border-slate-200 dark:border-slate-800 font-bold gap-2">
                           <FileText size={18} />
                           Update Profile
                        </Button>
                     </div>
                  </div>
               )}
            </Card>

            {/* Operating Regions */}
            <Card className="p-10 border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[3rem]">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black dark:text-white">Operating Regions</h3>
                  <Button variant="ghost" className="text-primary-600 font-black gap-2">
                     <Plus size={18} /> Add Region
                  </Button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['Lagos Mainland', 'Lekki/Ajah Corridor', 'Ibadan Central', 'Ogun Border Hubs'].map((region) => (
                     <div key={region} className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between group cursor-default">
                        <div className="flex items-center gap-4">
                           <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-900/10 text-primary-600">
                              <MapPin size={20} />
                           </div>
                           <span className="text-sm font-black dark:text-white">{region}</span>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-600 rounded-full border-none px-3 py-1 font-bold text-[10px] uppercase">Active</Badge>
                     </div>
                  ))}
               </div>
            </Card>
         </div>

         <div className="space-y-8">
            <Card className="p-8 border-none shadow-xl bg-slate-950 text-white rounded-[3rem]">
               <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                  <FileText className="text-primary-500" size={24} />
                  Verification Documents
               </h3>
               <div className="space-y-4">
                  {[
                    { label: 'CAC Certificate', status: 'VERIFIED' },
                    { label: 'Insurance Policy', status: 'VERIFIED' },
                    { label: 'Fleet License', status: 'EXPIRES_SOON' }
                  ].map((doc) => (
                     <div key={doc.label} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-300">{doc.label}</span>
                        <Badge className={cn(
                          "rounded-full px-2 py-0.5 font-black text-[10px] uppercase",
                          doc.status === 'VERIFIED' ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                        )}>
                           {doc.status.replace('_', ' ')}
                        </Badge>
                     </div>
                  ))}
               </div>
               <Button className="w-full mt-8 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl h-12 font-black gap-2 border-none">
                  <ExternalLink size={18} />
                  Open Compliance Portal
               </Button>
            </Card>

            <Card className="p-8 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[3rem]">
               <h3 className="text-xl font-black dark:text-white mb-6">Fleet Summary</h3>
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <Truck size={20} className="text-primary-600" />
                        <span className="text-sm font-bold text-slate-900">Light Vans</span>
                     </div>
                     <span className="text-lg font-black dark:text-white">08</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <Truck size={20} className="text-primary-600" />
                        <span className="text-sm font-bold text-slate-900">Heavy Trucks</span>
                     </div>
                     <span className="text-lg font-black dark:text-white">04</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <Truck size={20} className="text-primary-600" />
                        <span className="text-sm font-bold text-slate-900">Bikes</span>
                     </div>
                     <span className="text-lg font-black dark:text-white">03</span>
                  </div>
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
    </LogisticsLayout>
  );
};
