import { toast } from "sonner";

import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AdminLayout } from '../../layouts/AdminLayout';
import { configurationEngine } from '@/src/engines';
import { auditEngine } from '../../services/AuditEngine';
import { useAuth } from '../../context/AuthContext';
import { Announcement, Advertisement, DocumentRequirement, UserRole } from '../../types';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  Megaphone,
  Image as ImageIcon,
  Plus,
  Trash2,
  Save,
  Calendar,
  TrendingUp,
  MousePointerClick,
  Sparkles,
  Check,
  Eye,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  Sliders,
  Play,
  Pencil
} from 'lucide-react';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';

export const PlatformOperationsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'maintenance' | 'announcements' | 'advertisements' | 'documents'>('maintenance');

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [maintenance, setMaintenance] = useState<any>(null);
  const [docRequirements, setDocRequirements] = useState<DocumentRequirement[]>([]);

  // Form states - Announcements
  const [annForm, setAnnForm] = useState<Partial<Announcement>>({
    title: '',
    body: '',
    imageUrl: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&q=80',
    buttonText: 'Learn More',
    destinationUrl: '/become-dispatch-partner',
    priority: 'NORMAL',
    status: 'PUBLISHED',
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  });
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);

  // Form states - Advertisements
  const [adForm, setAdForm] = useState<Partial<Advertisement>>({
    headline: '',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&q=80',
    destinationUrl: '/merchant-solutions',
    priority: 1,
    enabled: true,
    status: 'PUBLISHED',
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  });
  const [editingAdId, setEditingAdId] = useState<string | null>(null);

  // Form states - Document Requirements
  const [docForm, setDocForm] = useState<Partial<DocumentRequirement>>({
    name: '',
    description: '',
    isRequired: true,
    applicableRoles: ['MERCHANT'],
    applicableCountries: ['NG'],
    acceptedFileTypes: ['pdf', 'png', 'jpg', 'jpeg'],
    maxFileSizeMb: 5,
    requiresExpiryDate: false,
    renewalReminderDays: 30,
    adminVerificationRequired: true,
    autoApprovalAllowed: false,
    displayOrder: 1,
    helpText: '',
    isActive: true
  });
  const [editingDocId, setEditingDocId] = useState<string | null>(null);

  // Delete Modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'announcement' | 'ad' | 'document';
    id: string;
    title: string;
  }>({
    isOpen: false,
    type: 'announcement',
    id: '',
    title: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [anns, adsRes, settings, docs] = await Promise.all([
        configurationEngine.getAnnouncements(),
        configurationEngine.getAdvertisements(),
        configurationEngine.getGlobalSettings(),
        configurationEngine.getAllDocumentRequirements()
      ]);
      setAnnouncements(anns.filter(a => !a.isDeleted));
      setAds(adsRes.filter(a => !a.isDeleted));
      setMaintenance(settings?.maintenanceMode || false);
      setDocRequirements(docs.filter(d => !d.isDeleted));
    } catch (err) {
      console.error("Failed to load operations data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleMaintenance = async () => {
    try {
      const nextMode = !maintenance;
      await configurationEngine.updateSystemSettings('global', { maintenanceMode: nextMode });
      setMaintenance(nextMode);
      toast.success(nextMode ? "Maintenance Mode Activated" : "Maintenance Mode Deactivated");
      await auditEngine.logEvent({
        userId: user?.uid || 'unknown',
        action: nextMode ? 'MAINTENANCE_ENABLED' : 'MAINTENANCE_DISABLED',
        details: { enabled: nextMode },
        result: 'SUCCESS'
      });
    } catch (err) {
      console.error("Failed to toggle maintenance mode:", err);
    }
  };

  // Pre-fill templates for Dispatch Riders Recruitment
  const applyAnnouncementTemplate = () => {
    setAnnForm({
      title: "We're Hiring! Become an Independent WeSabiDispatch Rider",
      body: "Earn over ₦250,000 monthly, operate dynamic inter-hub delivery routes, claim secure SafePay-held payments immediately, and complete academy courses to raise your Trust Score.",
      imageUrl: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&q=80",
      buttonText: "Apply Now",
      destinationUrl: "/become-dispatch-partner",
      priority: "HIGH",
      status: "PUBLISHED",
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
    });
    setEditingAnnId(null);
  };

  const applyAdTemplate = () => {
    setAdForm({
      headline: "Fulfill Shipments with WeSabiDispatch",
      description: "Automate last-mile courier fulfillment with certified, high-trust dispatch riders. Features secure SafePay payments and dynamic scanning verification.",
      imageUrl: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&q=80",
      destinationUrl: "/merchant-solutions",
      priority: 5,
      enabled: true,
      status: "PUBLISHED",
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
    });
    setEditingAdId(null);
  };

  // Submit operations - Announcement

  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (file: File | null, setFormState: Function, fieldName: string) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `marketing/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormState((prev: any) => ({ ...prev, [fieldName]: url }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = editingAnnId || 'ann_' + Date.now();
      const payload: Announcement = {
        id,
        title: annForm.title || '',
        body: annForm.body || '',
        imageUrl: annForm.imageUrl,
        buttonText: annForm.buttonText,
        destinationUrl: annForm.destinationUrl,
        priority: annForm.priority as any || 'NORMAL',
        status: annForm.status as any || 'PUBLISHED',
        startDate: annForm.startDate || new Date().toISOString(),
        endDate: annForm.endDate || new Date().toISOString(),
        views: annForm.views || 0,
        createdAt: annForm.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false
      };

      await configurationEngine.createAnnouncement(id, payload);
      await auditEngine.logEvent({
        userId: user?.uid || 'unknown',
        action: editingAnnId ? 'ANNOUNCEMENT_UPDATED' : 'ANNOUNCEMENT_CREATED',
        details: { id, title: payload.title },
        result: 'SUCCESS'
      });

      setEditingAnnId(null);
      setAnnForm({
        title: '',
        body: '',
        imageUrl: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&q=80',
        buttonText: 'Learn More',
        destinationUrl: '/become-dispatch-partner',
        priority: 'NORMAL',
        status: 'PUBLISHED',
        startDate: new Date().toISOString().slice(0, 16),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
      });
      fetchData();
      toast.success(editingAnnId ? 'Announcement updated!' : 'Announcement published!');
    } catch (err) {
      console.error(err);
    }
  };

  // Submit operations - Advertisement
  const handleAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = editingAdId || 'ad_' + Date.now();
      const payload: Advertisement = {
        id,
        headline: adForm.headline || '',
        description: adForm.description || '',
        imageUrl: adForm.imageUrl || '',
        destinationUrl: adForm.destinationUrl || '',
        priority: Number(adForm.priority) || 1,
        enabled: adForm.enabled !== false,
        status: adForm.status as any || 'PUBLISHED',
        startDate: adForm.startDate || new Date().toISOString(),
        endDate: adForm.endDate || new Date().toISOString(),
        views: adForm.views || 0,
        clicks: adForm.clicks || 0,
        createdAt: adForm.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false
      };

      await configurationEngine.createAdvertisement(id, payload);
      await auditEngine.logEvent({
        userId: user?.uid || 'unknown',
        action: editingAdId ? 'ADVERTISEMENT_UPDATED' : 'ADVERTISEMENT_CREATED',
        details: { id, headline: payload.headline },
        result: 'SUCCESS'
      });

      setEditingAdId(null);
      setAdForm({
        headline: '',
        description: '',
        imageUrl: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&q=80',
        destinationUrl: '/merchant-solutions',
        priority: 1,
        enabled: true,
        status: 'PUBLISHED',
        startDate: new Date().toISOString().slice(0, 16),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
      });
      fetchData();
      toast.success(editingAdId ? 'Ad campaign updated!' : 'Ad campaign launched!');
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      await configurationEngine.deleteAnnouncement(id);
      await auditEngine.logEvent({
        userId: user?.uid || 'unknown',
        action: 'ANNOUNCEMENT_DELETED',
        details: { id },
        result: 'SUCCESS'
      });
      fetchData();
      toast.success('Announcement deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete announcement');
    }
  };

  const formatForInput = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toISOString().slice(0, 16);
    } catch (e) {
      return '';
    }
  };

  const startEditingAnn = (ann: Announcement) => {
    setEditingAnnId(ann.id);
    setAnnForm({
      ...ann,
      startDate: formatForInput(ann.startDate),
      endDate: formatForInput(ann.endDate)
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startEditingAd = (ad: Advertisement) => {
    setEditingAdId(ad.id);
    setAdForm({
      ...ad,
      startDate: formatForInput(ad.startDate),
      endDate: formatForInput(ad.endDate)
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteAd = async (id: string) => {
    try {
      await configurationEngine.deleteAdvertisement(id);
      await auditEngine.logEvent({
        userId: user?.uid || 'unknown',
        action: 'ADVERTISEMENT_DELETED',
        details: { id },
        result: 'SUCCESS'
      });
      fetchData();
      toast.success('Ad campaign deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete ad campaign');
    }
  };

  const startEditingDoc = (docReq: DocumentRequirement) => {
    setEditingDocId(docReq.id);
    setDocForm({
      ...docReq
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteDoc = async (id: string) => {
    try {
      await configurationEngine.deleteDocumentRequirement(id);
      await auditEngine.logEvent({
        userId: user?.uid || 'unknown',
        action: 'DOCUMENT_REQUIREMENT_DELETED',
        details: { id },
        result: 'SUCCESS'
      });
      fetchData();
      toast.success('Document requirement deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete document requirement');
    }
  };

  const saveDocRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!docForm.name) {
        toast.error('Name is required');
        return;
      }
      const data: Partial<DocumentRequirement> = {
        name: docForm.name,
        description: docForm.description || '',
        isRequired: !!docForm.isRequired,
        applicableRoles: docForm.applicableRoles || [],
        applicableCountries: docForm.applicableCountries || [],
        acceptedFileTypes: docForm.acceptedFileTypes || [],
        maxFileSizeMb: Number(docForm.maxFileSizeMb) || 5,
        requiresExpiryDate: !!docForm.requiresExpiryDate,
        renewalReminderDays: Number(docForm.renewalReminderDays) || 0,
        adminVerificationRequired: !!docForm.adminVerificationRequired,
        autoApprovalAllowed: !!docForm.autoApprovalAllowed,
        displayOrder: Number(docForm.displayOrder) || 1,
        helpText: docForm.helpText || '',
        isActive: !!docForm.isActive,
        updatedAt: new Date().toISOString()
      };

      if (editingDocId) {
        await configurationEngine.updateDocumentRequirement(editingDocId, data);
        await auditEngine.logEvent({
          userId: user?.uid || 'unknown',
          action: 'DOCUMENT_REQUIREMENT_UPDATED',
          details: { id: editingDocId, ...data },
          result: 'SUCCESS'
        });
        toast.success('Document requirement updated successfully!');
      } else {
        const id = `doc_req_${Date.now()}`;
        const newReq: DocumentRequirement = {
          id,
          ...data,
          createdAt: new Date().toISOString(),
          isDeleted: false
        } as DocumentRequirement;
        await configurationEngine.createDocumentRequirement(id, newReq);
        await auditEngine.logEvent({
          userId: user?.uid || 'unknown',
          action: 'DOCUMENT_REQUIREMENT_CREATED',
          details: { id, ...data },
          result: 'SUCCESS'
        });
        toast.success('Document requirement created successfully!');
      }

      setEditingDocId(null);
      setDocForm({
        name: '',
        description: '',
        isRequired: true,
        applicableRoles: ['MERCHANT'],
        applicableCountries: ['NG'],
        acceptedFileTypes: ['pdf', 'png', 'jpg', 'jpeg'],
        maxFileSizeMb: 5,
        requiresExpiryDate: false,
        renewalReminderDays: 30,
        adminVerificationRequired: true,
        autoApprovalAllowed: false,
        displayOrder: 1,
        helpText: '',
        isActive: true
      });
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save document requirement');
    }
  };

  const seedDefaultDocs = async () => {
    setLoading(true);
    try {
      const defaults: Partial<DocumentRequirement>[] = [
        {
          id: 'doc_cac_cert',
          name: 'CAC Certificate',
          description: 'Corporate Affairs Commission - Certificate of Incorporation',
          isRequired: true,
          applicableRoles: ['MERCHANT', 'CENTER_OWNER', 'LOGISTICS_COMPANY'],
          applicableCountries: ['NG'],
          acceptedFileTypes: ['pdf', 'png', 'jpeg', 'jpg'],
          maxFileSizeMb: 10,
          requiresExpiryDate: false,
          renewalReminderDays: 0,
          adminVerificationRequired: true,
          autoApprovalAllowed: false,
          displayOrder: 1,
          helpText: 'Please upload a clear PDF scan of your company CAC certificate.',
          isActive: true
        },
        {
          id: 'doc_tin',
          name: 'Tax Identification Number (TIN)',
          description: 'Official Tax ID registration certificate or printout',
          isRequired: true,
          applicableRoles: ['MERCHANT', 'LOGISTICS_COMPANY'],
          applicableCountries: ['NG', 'GH'],
          acceptedFileTypes: ['pdf', 'png', 'jpeg', 'jpg'],
          maxFileSizeMb: 5,
          requiresExpiryDate: false,
          renewalReminderDays: 0,
          adminVerificationRequired: true,
          autoApprovalAllowed: false,
          displayOrder: 2,
          helpText: 'Provide your official corporate or individual tax identification number certificate.',
          isActive: true
        },
        {
          id: 'doc_nin',
          name: 'National Identification Number (NIN)',
          description: 'NIN slip, premium card, or digital NIN verification',
          isRequired: true,
          applicableRoles: ['CUSTOMER', 'DISPATCH_RIDER', 'FLEET_MANAGER', 'DRIVER'],
          applicableCountries: ['NG'],
          acceptedFileTypes: ['pdf', 'png', 'jpeg', 'jpg'],
          maxFileSizeMb: 5,
          requiresExpiryDate: false,
          renewalReminderDays: 0,
          adminVerificationRequired: true,
          autoApprovalAllowed: true,
          displayOrder: 3,
          helpText: 'Upload your 11-digit NIN verification document or slip.',
          isActive: true
        },
        {
          id: 'doc_license',
          name: 'Driver\'s License',
          description: 'Valid government-issued commercial or national driver\'s license',
          isRequired: true,
          applicableRoles: ['DISPATCH_RIDER', 'DRIVER'],
          applicableCountries: ['ALL'],
          acceptedFileTypes: ['pdf', 'png', 'jpeg', 'jpg'],
          maxFileSizeMb: 5,
          requiresExpiryDate: true,
          renewalReminderDays: 30,
          adminVerificationRequired: true,
          autoApprovalAllowed: false,
          displayOrder: 4,
          helpText: 'Ensure the driver license is active and clearly legible showing date of expiry.',
          isActive: true
        },
        {
          id: 'doc_guarantor',
          name: 'Guarantor Form',
          description: 'Completed and signed WeSabiHub guarantor attestation letter',
          isRequired: true,
          applicableRoles: ['DISPATCH_RIDER', 'DRIVER'],
          applicableCountries: ['ALL'],
          acceptedFileTypes: ['pdf', 'png', 'jpeg', 'jpg'],
          maxFileSizeMb: 10,
          requiresExpiryDate: false,
          renewalReminderDays: 0,
          adminVerificationRequired: true,
          autoApprovalAllowed: false,
          displayOrder: 5,
          helpText: 'Download the guarantor template, have your guarantor fill it out, and upload the signed scan.',
          isActive: true
        }
      ];

      for (const item of defaults) {
        await configurationEngine.createDocumentRequirement(item.id!, {
          ...item,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDeleted: false
        } as DocumentRequirement);
      }

      await auditEngine.logEvent({
        userId: user?.uid || 'unknown',
        action: 'DOCUMENT_REQUIREMENTS_SEEDED',
        details: { count: defaults.length },
        result: 'SUCCESS'
      });

      toast.success('Successfully seeded default document requirements!');
      fetchData();
    } catch (err) {
      console.error('Failed to seed default requirements:', err);
      toast.error('Failed to seed requirements.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <AdminLayout>
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <RefreshCw className="animate-spin text-primary-500 w-10 h-10" />
        <p className="text-slate-900 font-mono text-xs uppercase tracking-widest font-bold">Synchronizing Operations Hub...</p>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-primary-600 font-bold uppercase tracking-widest text-[10px] mb-2">Central CMS Hub</p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white font-display">Platform Operations & CMS</h1>
            <p className="text-slate-900 font-medium mt-1">Manage global maintenance, broadcast banners, recruitment campaigns, and display advertisements.</p>
          </div>
          <div className="flex items-center gap-3">
            {['maintenance', 'announcements', 'advertisements', 'documents'].map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? "default" : "outline"}
                onClick={() => setActiveTab(tab as any)}
                className="rounded-xl px-4 py-2 font-bold text-xs uppercase tracking-wider"
              >
                {tab === 'documents' ? 'document requirements' : tab}
              </Button>
            ))}
          </div>
        </div>

        {/* TAB 1: MAINTENANCE MODE */}
        {activeTab === 'maintenance' && (
          <Card className="p-8 border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <Sliders className="text-primary-600" size={24} />
              <div>
                <h3 className="font-bold dark:text-white text-lg">System-wide Lockout Mode</h3>
                <p className="text-xs text-slate-800">Put the front-end server into maintenance mode to run upgrades safely.</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl gap-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Current Status</span>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${maintenance ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <strong className="text-lg font-black dark:text-white uppercase tracking-tight font-display">
                    {maintenance ? 'Maintenance Lock Active' : 'System Operational & Live'}
                  </strong>
                </div>
                <p className="text-xs text-slate-900">When locked, all public/authenticated clients are redirected to a friendly placeholder offline page.</p>
              </div>

              <Button
                onClick={toggleMaintenance}
                variant={maintenance ? 'danger' : 'primary'}
                className="h-14 px-8 rounded-xl font-bold font-display uppercase italic tracking-wide text-xs"
              >
                {maintenance ? 'Disable System Maintenance' : 'Activate System Maintenance'}
              </Button>
            </div>
          </Card>
        )}

        {/* TAB 2: ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Column */}
            <Card className="lg:col-span-5 p-6 border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Megaphone className="text-primary-600" size={20} />
                  <h3 className="font-bold dark:text-white text-base">
                    {editingAnnId ? 'Edit Announcement' : 'New Announcement'}
                  </h3>
                </div>
                <Button
                  onClick={applyAnnouncementTemplate}
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-[10px] font-black border-primary-500/20 text-primary-600 hover:bg-primary-50"
                >
                  <Sparkles size={12} className="mr-1" /> Use Rider Template
                </Button>
              </div>

              <form onSubmit={handleAnnSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Announcement Title</label>
                  <input
                    placeholder="Headline banner text..."
                    value={annForm.title || ''}
                    onChange={(e) => setAnnForm({...annForm, title: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg font-bold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Body Paragraph</label>
                  <textarea
                    rows={4}
                    placeholder="Full description details..."
                    value={annForm.body || ''}
                    onChange={(e) => setAnnForm({...annForm, body: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Button CTA (e.g. WhatsApp Us)</label>
                    <input
                      placeholder="e.g. WhatsApp Us"
                      value={annForm.buttonText || ''}
                      onChange={(e) => setAnnForm({...annForm, buttonText: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Destination URL</label>
                    <input
                      placeholder="e.g. /become-dispatch-partner"
                      value={annForm.destinationUrl || ''}
                      onChange={(e) => setAnnForm({...annForm, destinationUrl: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Banner Image URL</label>
                  <div className="flex gap-2">
                    <input
                      value={annForm.imageUrl || ''}
                      onChange={(e) => setAnnForm({...annForm, imageUrl: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg font-mono text-slate-900"
                    />
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => handleImageUpload(e.target.files?.[0] || null, setAnnForm, 'imageUrl')}
                      disabled={isUploading}
                      className="w-32 text-xs file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Priority Class</label>
                    <select
                      value={annForm.priority}
                      onChange={(e) => setAnnForm({...annForm, priority: e.target.value as any})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg font-bold"
                    >
                      <option value="NORMAL">NORMAL</option>
                      <option value="INFO">INFO</option>
                      <option value="HIGH">HIGH</option>
                      <option value="EMERGENCY">EMERGENCY</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Broadcast Status</label>
                    <select
                      value={annForm.status}
                      onChange={(e) => setAnnForm({...annForm, status: e.target.value as any})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg font-bold"
                    >
                      <option value="PUBLISHED">PUBLISHED</option>
                      <option value="DRAFT">DRAFT</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      value={annForm.startDate}
                      onChange={(e) => setAnnForm({...annForm, startDate: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">End Date & Time</label>
                    <input
                      type="datetime-local"
                      value={annForm.endDate}
                      onChange={(e) => setAnnForm({...annForm, endDate: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button type="submit" disabled={isUploading} className="flex-1 font-bold h-11 rounded-xl">
                    <Save size={16} className="mr-2" />
                    {editingAnnId ? 'Update Announcement' : 'Publish Announcement'}
                  </Button>
                  {editingAnnId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingAnnId(null);
                        setAnnForm({
                          title: '',
                          body: '',
                          imageUrl: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&q=80',
                          buttonText: 'Learn More',
                          destinationUrl: '/become-dispatch-partner',
                          priority: 'NORMAL',
                          status: 'PUBLISHED',
                          startDate: new Date().toISOString().slice(0, 16),
                          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
                        });
                      }}
                      className="h-11 rounded-xl"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Card>

            {/* List Column */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white px-1">Active Broadcasts</h3>
              {announcements.length === 0 ? (
                <div className="p-12 text-center text-slate-800 italic bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs">
                  No published announcements found. Click "Use Rider Template" to prefill and launch!
                </div>
              ) : (
                announcements.map((ann) => (
                  <Card key={ann.id} className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary-500/30 transition-all rounded-2xl">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="bg-primary-500/10 text-primary-600 border-none text-[9px] uppercase tracking-wider">{ann.priority}</Badge>
                          <Badge variant="outline" className="text-[9px] font-mono">{ann.status}</Badge>
                          <span className="text-[10px] text-slate-800 font-mono flex items-center gap-1"><Calendar size={12} /> {new Date(ann.startDate).toLocaleString()} to {new Date(ann.endDate).toLocaleString()}</span>
                        </div>
                        <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">{ann.title}</h4>
                        <p className="text-xs text-slate-900 dark:text-slate-300 font-medium leading-relaxed">{ann.body}</p>
                        {ann.destinationUrl && (
                          <div className="pt-2">
                            <Badge variant="outline" className="text-[9px] border-slate-200 dark:border-slate-800 py-1 px-2.5">
                              Button: {ann.buttonText || 'Learn More'} → {ann.destinationUrl}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditingAnn(ann)}
                          className="p-2 h-8 w-8 rounded-lg hover:border-primary-500 hover:text-primary-600"
                          title="Edit Announcement"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setDeleteModal({
                            isOpen: true,
                            type: 'announcement',
                            id: ann.id,
                            title: ann.title || 'Untitled'
                          })}
                          className="p-2 h-8 w-8 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ADVERTISEMENTS */}
        {activeTab === 'advertisements' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Column */}
            <Card className="lg:col-span-5 p-6 border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <ImageIcon className="text-primary-600" size={20} />
                  <h3 className="font-bold dark:text-white text-base">
                    {editingAdId ? 'Edit Ad Banner' : 'New Ad Banner'}
                  </h3>
                </div>
                <Button
                  onClick={applyAdTemplate}
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-[10px] font-black border-primary-500/20 text-primary-600 hover:bg-primary-50"
                >
                  <Sparkles size={12} className="mr-1" /> Use Promo Template
                </Button>
              </div>

              <form onSubmit={handleAdSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Headline / Ad Copy</label>
                  <input
                    placeholder="Ad Headline copy..."
                    value={adForm.headline || ''}
                    onChange={(e) => setAdForm({...adForm, headline: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg font-bold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Ad Body Description</label>
                  <textarea
                    rows={4}
                    placeholder="Ad details and subtitle..."
                    value={adForm.description || ''}
                    onChange={(e) => setAdForm({...adForm, description: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Target Action Destination URL</label>
                  <input
                    placeholder="e.g. /merchant-solutions"
                    value={adForm.destinationUrl || ''}
                    onChange={(e) => setAdForm({...adForm, destinationUrl: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Creative Image URL</label>
                  <div className="flex gap-2">
                    <input
                      value={adForm.imageUrl || ''}
                      onChange={(e) => setAdForm({...adForm, imageUrl: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg font-mono text-slate-900"
                    />
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => handleImageUpload(e.target.files?.[0] || null, setAdForm, 'imageUrl')}
                      disabled={isUploading}
                      className="w-32 text-xs file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Priority Order Weight</label>
                    <input
                      type="number"
                      placeholder="e.g. 5"
                      value={adForm.priority || 1}
                      onChange={(e) => setAdForm({...adForm, priority: Number(e.target.value)})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Ad Status</label>
                    <select
                      value={adForm.status}
                      onChange={(e) => setAdForm({...adForm, status: e.target.value as any})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg font-bold"
                    >
                      <option value="PUBLISHED">PUBLISHED</option>
                      <option value="DRAFT">DRAFT</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      value={adForm.startDate}
                      onChange={(e) => setAdForm({...adForm, startDate: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">End Date & Time</label>
                    <input
                      type="datetime-local"
                      value={adForm.endDate}
                      onChange={(e) => setAdForm({...adForm, endDate: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button type="submit" disabled={isUploading} className="flex-1 font-bold h-11 rounded-xl">
                    <Save size={16} className="mr-2" />
                    {editingAdId ? 'Update Campaign' : 'Launch Campaign'}
                  </Button>
                  {editingAdId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingAdId(null);
                        setAdForm({
                          headline: '',
                          description: '',
                          imageUrl: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&q=80',
                          destinationUrl: '/merchant-solutions',
                          priority: 1,
                          enabled: true,
                          status: 'PUBLISHED',
                          startDate: new Date().toISOString().slice(0, 16),
                          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
                        });
                      }}
                      className="h-11 rounded-xl"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Card>

            {/* List Column */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white px-1">Campaign Banners</h3>
              {ads.length === 0 ? (
                <div className="p-12 text-center text-slate-800 italic bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs">
                  No active ad campaigns found. Click "Use Promo Template" to prefill and launch!
                </div>
              ) : (
                ads.map((adItem) => (
                  <Card key={adItem.id} className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary-500/30 transition-all rounded-2xl">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="bg-indigo-500/10 text-indigo-600 border-none text-[9px] uppercase tracking-wider">Weight Priority: {adItem.priority}</Badge>
                          <Badge variant="outline" className="text-[9px] font-mono">{adItem.status}</Badge>
                          <span className="text-[10px] text-slate-800 font-mono flex items-center gap-1"><Calendar size={12} /> {new Date(adItem.startDate).toLocaleString()} to {new Date(adItem.endDate).toLocaleString()}</span>
                        </div>
                        <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">{adItem.headline}</h4>
                        <p className="text-xs text-slate-900 dark:text-slate-300 font-medium leading-relaxed">{adItem.description}</p>

                        <div className="flex gap-4 pt-2">
                          <span className="text-[10px] font-mono font-bold text-slate-800 flex items-center gap-1">
                            <Eye size={12} /> {adItem.views || 0} Views
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-800 flex items-center gap-1">
                            <MousePointerClick size={12} /> {adItem.clicks || 0} Clicks
                          </span>
                          <span className="text-[10px] font-mono font-bold text-primary-500 truncate max-w-xs">
                            Target: {adItem.destinationUrl}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditingAd(adItem)}
                          className="p-2 h-8 w-8 rounded-lg hover:border-primary-500 hover:text-primary-600"
                          title="Edit Ad Campaign"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setDeleteModal({
                            isOpen: true,
                            type: 'ad',
                            id: adItem.id,
                            title: adItem.headline || 'Untitled'
                          })}
                          className="p-2 h-8 w-8 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
        {/* TAB 4: DOCUMENT REQUIREMENTS ENGINE */}
        {activeTab === 'documents' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Column */}
            <Card className="lg:col-span-5 p-6 border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Sliders className="text-primary-600" size={20} />
                  <h3 className="font-bold dark:text-white text-base font-display">
                    {editingDocId ? 'Edit Document' : 'New Document'}
                  </h3>
                </div>
                {editingDocId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingDocId(null);
                      setDocForm({
                        name: '',
                        description: '',
                        isRequired: true,
                        applicableRoles: ['MERCHANT'],
                        applicableCountries: ['NG'],
                        acceptedFileTypes: ['pdf', 'png', 'jpg', 'jpeg'],
                        maxFileSizeMb: 5,
                        requiresExpiryDate: false,
                        renewalReminderDays: 30,
                        adminVerificationRequired: true,
                        autoApprovalAllowed: false,
                        displayOrder: 1,
                        helpText: '',
                        isActive: true
                      });
                    }}
                    className="text-[10px] uppercase font-bold py-1 px-2 h-7"
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>

              <form onSubmit={saveDocRequirement} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900">Document Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CAC Certificate, Driver's License"
                    value={docForm.name || ''}
                    onChange={e => setDocForm({...docForm, name: e.target.value})}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900">Description</label>
                  <textarea
                    placeholder="Provide a brief description of the requirement..."
                    value={docForm.description || ''}
                    onChange={e => setDocForm({...docForm, description: e.target.value})}
                    className="w-full h-20 p-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900">Help/Instruction Text</label>
                  <input
                    type="text"
                    placeholder="e.g. Please upload a scanned PDF copy not exceeding 5MB"
                    value={docForm.helpText || ''}
                    onChange={e => setDocForm({...docForm, helpText: e.target.value})}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-900">Max Size (MB)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={50}
                      value={docForm.maxFileSizeMb || 5}
                      onChange={e => setDocForm({...docForm, maxFileSizeMb: Number(e.target.value)})}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-900">Display Order</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={docForm.displayOrder || 1}
                      onChange={e => setDocForm({...docForm, displayOrder: Number(e.target.value)})}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Checklist checkboxes: Applicable Roles */}
                <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-800 block mb-1">Applicable Roles</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {['CUSTOMER', 'MERCHANT', 'CENTER_OWNER', 'CENTER_STAFF', 'LOGISTICS_COMPANY', 'DISPATCH_RIDER', 'FLEET_MANAGER', 'DRIVER', 'DEVELOPER'].map(roleId => {
                      const isChecked = docForm.applicableRoles?.includes(roleId as UserRole);
                      return (
                        <label key={roleId} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const updated = isChecked
                                ? docForm.applicableRoles?.filter(r => r !== roleId)
                                : [...(docForm.applicableRoles || []), roleId as UserRole];
                              setDocForm({...docForm, applicableRoles: updated});
                            }}
                            className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                          />
                          <span className="text-[11px] font-medium text-slate-800 dark:text-slate-300">{roleId.replace('_', ' ')}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Checklist checkboxes: Applicable Countries */}
                <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-800 block mb-1">Applicable Countries</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['ALL', 'NG', 'GH', 'KE', 'UK', 'CA', 'US'].map(countryCode => {
                      const isChecked = docForm.applicableCountries?.includes(countryCode);
                      return (
                        <label key={countryCode} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const updated = isChecked
                                ? docForm.applicableCountries?.filter(c => c !== countryCode)
                                : [...(docForm.applicableCountries || []), countryCode];
                              setDocForm({...docForm, applicableCountries: updated});
                            }}
                            className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                          />
                          <span className="text-[11px] font-medium text-slate-800 dark:text-slate-300">
                            {countryCode === 'ALL' ? '🌍 All Countries' : countryCode}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Checklist checkboxes: File Types */}
                <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-800 block mb-1">Accepted File Types</label>
                  <div className="flex gap-4">
                    {['pdf', 'png', 'jpg', 'jpeg'].map(ext => {
                      const isChecked = docForm.acceptedFileTypes?.includes(ext);
                      return (
                        <label key={ext} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const updated = isChecked
                                ? docForm.acceptedFileTypes?.filter(t => t !== ext)
                                : [...(docForm.acceptedFileTypes || []), ext];
                              setDocForm({...docForm, acceptedFileTypes: updated});
                            }}
                            className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                          />
                          <span className="text-[11px] uppercase font-bold text-slate-900">{ext}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Switches */}
                <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Is Required Document</label>
                    <input
                      type="checkbox"
                      checked={!!docForm.isRequired}
                      onChange={e => setDocForm({...docForm, isRequired: e.target.checked})}
                      className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Requires Expiry Date</label>
                    <input
                      type="checkbox"
                      checked={!!docForm.requiresExpiryDate}
                      onChange={e => setDocForm({...docForm, requiresExpiryDate: e.target.checked})}
                      className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                    />
                  </div>
                  {docForm.requiresExpiryDate && (
                    <div className="mt-2 pl-4 flex items-center justify-between">
                      <span className="text-[11px] text-slate-800 font-medium">Renewal Reminder (Days)</span>
                      <input
                        type="number"
                        min={1}
                        className="w-16 h-7 text-xs px-2 rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-900"
                        value={docForm.renewalReminderDays || 30}
                        onChange={e => setDocForm({...docForm, renewalReminderDays: Number(e.target.value)})}
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Admin Review Required</label>
                    <input
                      type="checkbox"
                      checked={!!docForm.adminVerificationRequired}
                      onChange={e => setDocForm({...docForm, adminVerificationRequired: e.target.checked})}
                      className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Auto-Approval Allowed</label>
                    <input
                      type="checkbox"
                      checked={!!docForm.autoApprovalAllowed}
                      onChange={e => setDocForm({...docForm, autoApprovalAllowed: e.target.checked})}
                      className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Active Status</label>
                    <input
                      type="checkbox"
                      checked={!!docForm.isActive}
                      onChange={e => setDocForm({...docForm, isActive: e.target.checked})}
                      className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary-600 hover:bg-primary-700 font-bold h-11 rounded-xl shadow-lg shadow-primary-500/20"
                >
                  <Save size={16} className="mr-2 inline" />
                  {editingDocId ? 'Save Requirement' : 'Create Requirement'}
                </Button>
              </form>
            </Card>

            {/* List Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white font-display">Active Document Requirements</h3>
                  <p className="text-xs text-slate-800">Total configured: {docRequirements.length}</p>
                </div>
                {docRequirements.length === 0 && (
                  <Button
                    onClick={seedDefaultDocs}
                    variant="outline"
                    className="rounded-xl font-bold font-display uppercase tracking-wider text-[10px]"
                  >
                    <Sparkles size={14} className="mr-1" />
                    Seed Standard Docs
                  </Button>
                )}
              </div>

              <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                {docRequirements.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
                    <Sliders className="mx-auto text-slate-300 w-12 h-12" />
                    <h4 className="font-bold text-slate-900 dark:text-slate-300">No Document Requirements Configured</h4>
                    <p className="text-xs text-slate-800 max-w-sm mx-auto">Use the form on the left or click Seed Standard Docs to populate the initial platform configuration.</p>
                  </div>
                ) : (
                  docRequirements.map(req => (
                    <Card key={req.id} className="p-5 border-slate-200 dark:border-slate-800 shadow-md rounded-2xl hover:shadow-lg transition">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-base text-slate-900 dark:text-white">{req.name}</h4>
                            {req.isRequired ? (
                              <Badge variant="error" className="text-[9px]">REQUIRED</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px]">OPTIONAL</Badge>
                            )}
                            {!req.isActive && (
                              <Badge variant="warning" className="text-[9px]">INACTIVE</Badge>
                            )}
                          </div>

                          <p className="text-xs text-slate-900 font-medium leading-relaxed">{req.description}</p>
                          {req.helpText && (
                            <p className="text-[11px] text-slate-800 italic">Instruction: {req.helpText}</p>
                          )}

                          <div className="space-y-1 pt-1">
                            <div className="flex gap-1.5 flex-wrap items-center">
                              <span className="text-[10px] font-bold text-slate-800">Roles:</span>
                              {req.applicableRoles.map(role => (
                                <span key={role} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 rounded text-[9px] font-bold uppercase">{role.replace('_', ' ')}</span>
                              ))}
                            </div>

                            <div className="flex gap-1.5 flex-wrap items-center">
                              <span className="text-[10px] font-bold text-slate-800">Countries:</span>
                              {req.applicableCountries.map(c => (
                                <span key={c} className="px-1.5 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded text-[9px] font-bold uppercase">{c === 'ALL' ? 'Global' : c}</span>
                              ))}
                            </div>

                            <div className="flex gap-4 text-[10px] font-mono text-slate-800">
                              <span>Max Size: <strong className="text-slate-800 dark:text-slate-300">{req.maxFileSizeMb}MB</strong></span>
                              <span>Types: <strong className="text-slate-800 dark:text-slate-300">{req.acceptedFileTypes.join(', ').toUpperCase()}</strong></span>
                              {req.requiresExpiryDate && (
                                <span>Expiry Required (Reminder: {req.renewalReminderDays} days)</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditingDoc(req)}
                            className="p-1.5 h-8 w-8 rounded-lg hover:border-primary-500 hover:text-primary-600"
                            title="Edit Requirement"
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setDeleteModal({
                              isOpen: true,
                              type: 'document',
                              id: req.id,
                              title: req.name
                            })}
                            className="p-1.5 h-8 w-8 rounded-lg"
                            title="Delete Requirement"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          if (deleteModal.type === 'announcement') {
            deleteAnnouncement(deleteModal.id);
          } else if (deleteModal.type === 'ad') {
            deleteAd(deleteModal.id);
          } else {
            deleteDoc(deleteModal.id);
          }
        }}
        title={`Delete ${deleteModal.type === 'announcement' ? 'Announcement' : deleteModal.type === 'ad' ? 'Ad Campaign' : 'Document Requirement'}?`}
        description={`Are you sure you want to remove "${deleteModal.title}"? This action cannot be undone and will immediately remove the content from the platform.`}
        confirmText="Yes, Delete Permanently"
        variant="danger"
      />
    </AdminLayout>
  );
};
