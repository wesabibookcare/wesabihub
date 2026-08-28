import { toast } from 'sonner';
import { useRef, useState } from "react";
import React from 'react';
import {
  User,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Building2,
  Clock,
  Camera,
  Star,
  CheckCircle2,
  Award,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { PointLayout } from '@/src/layouts/PointLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Select } from '@/src/components/ui/Select';
import { cn } from '@/src/lib/utils';
import { useAuth } from "@/src/context/AuthContext";
import { userEngine, centreEngine } from "@/src/engines";
import { updateProfile } from "firebase/auth";
import { StorageService } from '@/src/services/StorageService';
import { Trash2, AtSign, Check, X, Save } from "lucide-react";
import { AvatarPickerModal } from '@/src/components/profile/AvatarPickerModal';
import { Input } from '@/src/components/ui/Input';
import { RatingSummaryCard } from '@/src/components/ratings/RatingSummaryCard';
import { HubCenter } from '@/src/types';

export const ProfilePage = () => {
  const { user, fbUser, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [wesabiUsername, setWesabiUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // --- Hub (physical PUDO point) state ---
  const [hub, setHub] = useState<HubCenter | null>(null);
  const [hubLoading, setHubLoading] = useState(true);
  const [isHubEditing, setIsHubEditing] = useState(false);
  const [savingHub, setSavingHub] = useState(false);
  const emptyHubForm = {
    name: '', type: 'OTHER' as HubCenter['type'], address: '', city: '', state: '',
    lga: '', country: 'Nigeria', contactPhone: '', operatingHours: ''
  };
  const [hubForm, setHubForm] = useState(emptyHubForm);

  const loadHub = async (ownerId: string) => {
    setHubLoading(true);
    try {
      const existingHub = await centreEngine.getHubByOwner(ownerId);
      setHub(existingHub);
      if (existingHub) {
        setHubForm({
          name: existingHub.name || '',
          type: existingHub.type || 'OTHER',
          address: existingHub.address || '',
          city: existingHub.city || '',
          state: existingHub.state || '',
          lga: existingHub.lga || '',
          country: existingHub.country || 'Nigeria',
          contactPhone: existingHub.contactPhone || '',
          operatingHours: existingHub.operatingHours || ''
        });
      }
    } catch (err) {
      console.error('Failed to load hub:', err);
      toast.error('Could not load your hub details. Please refresh the page.');
    } finally {
      setHubLoading(false);
    }
  };

  React.useEffect(() => {
    if (user?.uid) {
      loadHub(user.uid);
    }
  }, [user?.uid]);

  const handleHubFieldChange = (field: keyof typeof hubForm, value: string) => {
    setHubForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateHub = async () => {
    if (!user) return;
    setSavingHub(true);
    try {
      await centreEngine.createHub(user.uid, hubForm);
      toast.success('Hub submitted! An admin will review and approve it shortly.');
      await loadHub(user.uid);
    } catch (err: any) {
      toast.error(err.message || 'Failed to register your hub.');
    } finally {
      setSavingHub(false);
    }
  };

  const handleSaveHubEdits = async () => {
    if (!hub) return;
    setSavingHub(true);
    try {
      await centreEngine.updateHubDetails(hub.id, hubForm);
      toast.success('Hub details updated.');
      setIsHubEditing(false);
      await loadHub(hub.ownerId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update hub details.');
    } finally {
      setSavingHub(false);
    }
  };

  const hubTypeOptions = [
    { label: 'Filling Station', value: 'FILLING_STATION' },
    { label: 'Supermarket', value: 'SUPERMARKET' },
    { label: 'Pharmacy', value: 'PHARMACY' },
    { label: 'Other', value: 'OTHER' }
  ];

  React.useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || 'Hub Name');
      setPhone(user.phoneNumber || '');
      setEmail(user.email || '');

      if (user.wesabiUsername) {
        setWesabiUsername(user.wesabiUsername);
      } else {
        const cleanName = (user.displayName || 'Hub').replace(/[^a-zA-Z0-9]/g, '');
        const randomNum = user.uid ? user.uid.substring(0, 5) : Math.random().toString(36).substring(2, 7);
        setWesabiUsername(`WSH_${cleanName}${randomNum}`);
      }
    }
  }, [user]);

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
        displayName: displayName.trim(),
        phoneNumber: phone,
        wesabiUsername: formattedUsername
      });
      setWesabiUsername(formattedUsername);
      await refreshUser();
      setIsEditing(false);
      toast.success('Hub Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update hub profile');
    } finally {
      setSaving(false);
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
        await refreshUser();
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
        await refreshUser();
        toast.success('Logo updated successfully!');
      }
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
      toast.error('Failed to remove profile logo');
    }
  };

  return (

    <PointLayout>
      <div className="space-y-10 max-w-4xl mx-auto pb-20">
        <div className="relative h-48 rounded-3xl bg-slate-900 overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-indigo-600/20" />
        </div>

        <div className="px-8 -mt-20 relative z-10 space-y-8">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex items-end gap-6">
                                  <div className="relative group">
                    <img
                       src={user?.photoURL || user?.photoUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80"}
                       className="w-32 h-32 rounded-3xl border-4 border-white dark:border-slate-800 shadow-xl object-cover"
                      alt="Profile"
                    />
                    <div className="absolute inset-0 bg-black/40 text-white rounded-3xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                       <button onClick={() => setIsPickerOpen(true)} className="p-2 hover:bg-white/20 rounded-full">
                         <Camera size={24} />
                       </button>
                       {(user?.photoURL || user?.photoUrl) && (
                         <button onClick={handleAvatarDelete} className="p-2 hover:bg-red-500/80 rounded-full text-red-100">
                           <Trash2 size={24} />
                         </button>
                       )}
                    </div>

                 </div>
                 <div className="pb-2 space-y-1">
                    <div className="flex items-center gap-3">
                       <h1 className="text-3xl font-black dark:text-white font-display">{user?.displayName || 'Hub Name'}</h1>
                       {hub && (
                         <Badge variant={hub.status === 'ACTIVE' ? 'success' : hub.status === 'PENDING' ? 'warning' : 'default'} className="h-6">
                           {hub.status === 'ACTIVE' ? 'Live & Visible to Customers' : hub.status === 'PENDING' ? 'Pending Admin Approval' : 'Inactive'}
                         </Badge>
                       )}
                    </div>
                    {user?.wesabiUsername && (
                       <p className="text-primary-600 font-bold font-mono text-sm mb-1">{user.wesabiUsername}</p>
                    )}
                    <p className="text-slate-900 font-medium flex items-center gap-2">
                       <MapPin size={14} className="text-primary-600" /> {hub ? `${hub.address}, ${hub.city}, ${hub.state}` : 'No hub location set up yet'}
                    </p>
                 </div>
              </div>
              <div className="flex gap-3">
                 {isEditing ? (
                    <div className="flex gap-2">
                       <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl h-11 px-6">Cancel</Button>
                       <Button onClick={handleSave} disabled={saving} isLoading={saving} className="rounded-xl h-11 px-8 bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-1.5 shadow-lg shadow-primary-500/20">
                          <Save size={16} /> Save
                       </Button>
                    </div>
                 ) : (
                    <Button onClick={() => setIsEditing(true)} className="rounded-xl h-11 px-8 shadow-lg shadow-primary-500/20">Edit Profile</Button>
                 )}
              </div>
           </div>

           {!hubLoading && hub && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 border-slate-200 dark:border-slate-800 flex items-center gap-4 bg-primary-50/50 dark:bg-primary-900/10">
                   <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center">
                      <Star size={24} />
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Rating</p>
                      <p className="text-xl font-black dark:text-white font-display">
                        {hub.rating ? `${hub.rating.toFixed(1)}/5.0` : 'No ratings yet'}
                      </p>
                   </div>
                </Card>
                <Card className="p-6 border-slate-200 dark:border-slate-800 flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 size={24} />
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Reviews</p>
                      <p className="text-xl font-black dark:text-white font-display">{hub.reviews || 0}</p>
                   </div>
                </Card>
                <Card className="p-6 border-slate-200 dark:border-slate-800 flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Award size={24} />
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Trust Points</p>
                      <p className="text-xl font-black dark:text-white font-display">{hub.totalPoints ?? 0}</p>
                   </div>
                </Card>
             </div>
           )}

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-8">
                 <h3 className="text-lg font-bold dark:text-white font-display border-b border-slate-100 dark:border-slate-800 pb-4">Account Details</h3>
                 {isEditing ? (
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Display Name</label>
                          <Input value={displayName} onChange={e => setDisplayName(e.target.value)} leftIcon={<Building2 size={18} />} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">OmorfiHub Username</label>
                          <Input
                             value={wesabiUsername}
                             onChange={e => setWesabiUsername(e.target.value)}
                             leftIcon={<AtSign size={18} className="text-primary-500" />}
                             placeholder="WSH_point"
                             className="font-bold text-primary-600 font-mono"
                          />
                          <p className="text-[10px] text-slate-800 dark:text-slate-300">Must be unique across the platform. Others will use this exact text to find and chat with you.</p>
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Contact Phone</label>
                          <Input value={phone} onChange={e => setPhone(e.target.value)} leftIcon={<Phone size={18} />} />
                       </div>
                    </div>
                 ) : (
                    <div className="space-y-6">
                       <div className="flex items-start gap-4">
                          <Building2 className="text-slate-800 mt-1" size={20} />
                          <div>
                             <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Display Name</p>
                             <p className="text-sm font-bold dark:text-white mt-1">{user?.displayName || 'Not set'}</p>
                          </div>
                       </div>
                       <div className="flex items-start gap-4">
                          <AtSign className="text-slate-800 mt-1" size={20} />
                          <div>
                             <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">OmorfiHub Username</p>
                             <p className="text-sm font-bold text-primary-600 font-mono mt-1">{user?.wesabiUsername || 'Not Set'}</p>
                             <p className="text-[10px] text-slate-800 mt-1">Share this exact text so others can find and chat with you.</p>
                          </div>
                       </div>
                       <div className="flex items-start gap-4">
                          <Mail className="text-slate-800 mt-1" size={20} />
                          <div>
                             <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Email</p>
                             <p className="text-sm font-bold dark:text-white mt-1">{user?.email || 'Not set'}</p>
                          </div>
                       </div>
                       <div className="flex items-start gap-4">
                          <Phone className="text-slate-800 mt-1" size={20} />
                          <div>
                             <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Contact Phone</p>
                             <p className="text-sm font-bold dark:text-white mt-1">{user?.phoneNumber || 'Not set'}</p>
                          </div>
                       </div>
                    </div>
                 )}
              </Card>

              <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">
                 <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <h3 className="text-lg font-bold dark:text-white font-display">Hub Location &amp; Details</h3>
                    {hub && !isHubEditing && (
                       <Button variant="outline" size="sm" onClick={() => setIsHubEditing(true)} className="rounded-lg h-9 px-4 text-xs font-bold">
                          Edit
                       </Button>
                    )}
                 </div>

                 {hubLoading ? (
                    <div className="flex items-center justify-center py-10 gap-2 text-slate-800">
                       <Loader2 size={20} className="animate-spin" /> Loading hub details...
                    </div>
                 ) : !hub ? (
                    <div className="space-y-5">
                       <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30">
                          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                             You haven't set up your hub location yet. Customers and merchants can't find or send parcels to you until this is submitted and approved.
                          </p>
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Hub Name</label>
                          <Input value={hubForm.name} onChange={e => handleHubFieldChange('name', e.target.value)} leftIcon={<Building2 size={18} />} placeholder="e.g. Lekki Phase 1 PUDO Point" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Hub Type</label>
                          <Select value={hubForm.type} onChange={e => handleHubFieldChange('type', e.target.value)} options={hubTypeOptions} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Street Address</label>
                          <Input value={hubForm.address} onChange={e => handleHubFieldChange('address', e.target.value)} leftIcon={<MapPin size={18} />} placeholder="e.g. 12 Admiralty Way" />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">City</label>
                             <Input value={hubForm.city} onChange={e => handleHubFieldChange('city', e.target.value)} placeholder="e.g. Lekki" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">State</label>
                             <Input value={hubForm.state} onChange={e => handleHubFieldChange('state', e.target.value)} placeholder="e.g. Lagos" />
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">LGA (optional)</label>
                             <Input value={hubForm.lga} onChange={e => handleHubFieldChange('lga', e.target.value)} placeholder="e.g. Eti-Osa" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Country</label>
                             <Input value={hubForm.country} onChange={e => handleHubFieldChange('country', e.target.value)} />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Contact Phone</label>
                          <Input value={hubForm.contactPhone} onChange={e => handleHubFieldChange('contactPhone', e.target.value)} leftIcon={<Phone size={18} />} placeholder="e.g. 0812 345 6789" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Operating Hours</label>
                          <Input value={hubForm.operatingHours} onChange={e => handleHubFieldChange('operatingHours', e.target.value)} leftIcon={<Clock size={18} />} placeholder="e.g. Mon-Sat 8AM-8PM, Sun Closed" />
                       </div>
                       <Button onClick={handleCreateHub} disabled={savingHub} isLoading={savingHub} className="w-full rounded-xl h-12 bg-primary-600 hover:bg-primary-700 text-white font-bold">
                          Submit Hub for Approval
                       </Button>
                    </div>
                 ) : isHubEditing ? (
                    <div className="space-y-5">
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Hub Name</label>
                          <Input value={hubForm.name} onChange={e => handleHubFieldChange('name', e.target.value)} leftIcon={<Building2 size={18} />} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Hub Type</label>
                          <Select value={hubForm.type} onChange={e => handleHubFieldChange('type', e.target.value)} options={hubTypeOptions} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Street Address</label>
                          <Input value={hubForm.address} onChange={e => handleHubFieldChange('address', e.target.value)} leftIcon={<MapPin size={18} />} />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">City</label>
                             <Input value={hubForm.city} onChange={e => handleHubFieldChange('city', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">State</label>
                             <Input value={hubForm.state} onChange={e => handleHubFieldChange('state', e.target.value)} />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Contact Phone</label>
                          <Input value={hubForm.contactPhone} onChange={e => handleHubFieldChange('contactPhone', e.target.value)} leftIcon={<Phone size={18} />} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Operating Hours</label>
                          <Input value={hubForm.operatingHours} onChange={e => handleHubFieldChange('operatingHours', e.target.value)} leftIcon={<Clock size={18} />} />
                       </div>
                       <div className="flex gap-3">
                          <Button variant="outline" onClick={() => { setIsHubEditing(false); loadHub(hub.ownerId); }} className="flex-1 rounded-xl h-12">Cancel</Button>
                          <Button onClick={handleSaveHubEdits} disabled={savingHub} isLoading={savingHub} className="flex-1 rounded-xl h-12 bg-primary-600 hover:bg-primary-700 text-white font-bold">
                             Save Changes
                          </Button>
                       </div>
                    </div>
                 ) : (
                    <div className="space-y-6">
                       {hub.status === 'PENDING' && (
                         <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30">
                            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                               Your hub is awaiting admin approval. It won't appear to customers or merchants until it's approved.
                            </p>
                         </div>
                       )}
                       <div className="flex items-start gap-4">
                          <Building2 className="text-slate-800 mt-1" size={20} />
                          <div>
                             <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Hub Name</p>
                             <p className="text-sm font-bold dark:text-white mt-1">{hub.name}</p>
                          </div>
                       </div>
                       <div className="flex items-start gap-4">
                          <MapPin className="text-slate-800 mt-1" size={20} />
                          <div>
                             <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Address</p>
                             <p className="text-sm font-bold dark:text-white mt-1">{hub.address}, {hub.city}, {hub.state}</p>
                          </div>
                       </div>
                       <div className="flex items-start gap-4">
                          <Phone className="text-slate-800 mt-1" size={20} />
                          <div>
                             <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Contact Phone</p>
                             <p className="text-sm font-bold dark:text-white mt-1">{hub.contactPhone || 'Not set'}</p>
                          </div>
                       </div>
                       <div className="flex items-start gap-4">
                          <Clock className="text-slate-800 mt-1" size={20} />
                          <div>
                             <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Operating Hours</p>
                             <p className="text-sm font-bold dark:text-white mt-1">{hub.operatingHours || 'Not set'}</p>
                          </div>
                       </div>
                    </div>
                 )}
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
      {/* Ratings & Trust Profile Summary */}
      <div className="pt-6">
         <RatingSummaryCard
            targetId={user?.uid || 'DEFAULT_HUB'}
            targetType="HUB"
            targetName={user?.displayName || 'Hub Center'}
            currentUserId={user?.uid}
            showReviewsList={true}
         />
      </div>
    </PointLayout>
  );
};
