import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Package as PackageIcon,
  MapPin,
  Truck,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Scale,
  CreditCard,
  Search,
  Building2,
  AlertCircle,
  Loader2,
  Calendar,
  Globe,
  ShieldCheck
} from 'lucide-react';
import { GoogleContactPickerModal } from '@/src/components/common/GoogleContactPickerModal';
import { AddToGoogleCalendarModal } from '@/src/components/common/AddToGoogleCalendarModal';
import { GoogleContact } from '@/src/services/googleService';
import { useNavigate } from 'react-router-dom';
import { MerchantLayout } from '@/src/layouts/MerchantLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { Switch } from '@/src/components/ui/Switch';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { useSettings } from '@/src/context/SettingsContext';
import { parcelEngine } from '@/src/services/ParcelEngine';
import { pricingEngine } from '@/src/services/PricingEngine';
import { communicationService } from '@/src/services/CommunicationService';
import { centreEngine, merchantEngine, workflowEngine } from '@/src/engines';
import { labelService } from '@/src/services/LabelService';
import { HubCenter, Parcel, MerchantBusiness } from '@/src/types';
import { toast } from 'sonner';

const steps = [
  { id: 1, title: 'Recipient', icon: User },
  { id: 2, title: 'Parcel', icon: PackageIcon },
  { id: 3, title: 'Route', icon: MapPin },
  { id: 4, title: 'Options', icon: Truck },
  { id: 5, title: 'Review', icon: CheckCircle2 },
];

export const CreateShipmentPage = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const isSafePayEnabled = settings?.featureFlags?.enableSafePay !== false;
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdParcel, setCreatedParcel] = useState<Parcel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [merchant, setMerchant] = useState<MerchantBusiness | null>(null);
  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  const handleSelectContact = (contact: GoogleContact) => {
    setFormData(prev => ({
      ...prev,
      recipientName: contact.name,
      recipientPhone: contact.phone || prev.recipientPhone,
      recipientEmail: contact.email || prev.recipientEmail,
    }));
  };

  useEffect(() => {
    if (user) {
      merchantEngine.getBusiness(user.uid).then(setMerchant);
    }
  }, [user]);

  // Form State
  const [formData, setFormData] = useState({
    fulfillmentMethod: 'HUB_PICKUP' as 'HUB_PICKUP' | 'LOGISTICS_DELIVERY',
    recipientName: '',
    recipientPhone: '',
    recipientEmail: '',
    category: 'Fashion & Apparel',
    weightKg: 0.5,
    estimatedValue: 5000,
    originCenterId: '',
    destinationCenterId: '',
    serviceType: 'STANDARD' as 'STANDARD' | 'EXPRESS' | 'SAME_DAY',
    dimensions: { l: 10, w: 10, h: 10 },
    protectionEnabled: false
  });

  const [hubs, setHubs] = useState<HubCenter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingHubs, setIsLoadingHubs] = useState(false);
  const [servicePrices, setServicePrices] = useState<Record<'STANDARD' | 'EXPRESS' | 'SAME_DAY', number | null>>({
    STANDARD: null, EXPRESS: null, SAME_DAY: null
  });
  const [pricesLoading, setPricesLoading] = useState(false);

  useEffect(() => {
    const loadHubs = async () => {
      setIsLoadingHubs(true);
      try {
        const allHubs = await centreEngine.listNearbyHubs(0, 0, 9999);
        setHubs(allHubs.filter(h => h.status === 'ACTIVE'));

        // Auto-select first active hub as origin if none selected
        if (allHubs.length > 0 && !formData.originCenterId) {
          setFormData(prev => ({ ...prev, originCenterId: allHubs[0].id }));
        }
      } catch (err) {
        console.error('Failed to load hubs:', err);
      } finally {
        setIsLoadingHubs(false);
      }
    };
    loadHubs();
  }, []);

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // Fetch real, live delivery prices (per service type) instead of showing
  // static placeholder figures -- these must reflect the same pricing rules
  // the backend uses when the shipment is actually created.
  useEffect(() => {
    if (currentStep !== 4 || formData.fulfillmentMethod !== 'LOGISTICS_DELIVERY') return;
    let cancelled = false;
    const country = user?.country || 'Nigeria';

    setPricesLoading(true);
    Promise.all(
      (['STANDARD', 'EXPRESS', 'SAME_DAY'] as const).map(serviceType =>
        pricingEngine.calculatePrice({
          country,
          weightKg: formData.weightKg,
          dimensions: formData.dimensions,
          serviceType,
        }).then(breakdown => [serviceType, breakdown.total] as const)
          .catch(() => [serviceType, null] as const)
      )
    ).then(results => {
      if (cancelled) return;
      const next = { STANDARD: null, EXPRESS: null, SAME_DAY: null } as Record<'STANDARD' | 'EXPRESS' | 'SAME_DAY', number | null>;
      results.forEach(([type, total]) => { next[type] = total; });
      setServicePrices(next);
    }).finally(() => {
      if (!cancelled) setPricesLoading(false);
    });

    return () => { cancelled = true; };
  }, [currentStep, formData.fulfillmentMethod, formData.weightKg, formData.dimensions, user?.country]);

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.recipientName.trim().length > 0 && formData.recipientPhone.trim().length > 0;
      case 2:
        return formData.weightKg > 0 && formData.estimatedValue > 0;
      case 3:
        return !!formData.originCenterId && !!formData.destinationCenterId;
      case 4:
        return formData.fulfillmentMethod === 'HUB_PICKUP' || !!formData.serviceType;
      default:
        return true;
    }
  };

  const filteredHubs = hubs.filter(h =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isMerchantUnverified = user?.role === 'MERCHANT' &&
    user?.verificationStatus?.kyc !== true &&
    user?.status !== 'APPROVED' &&
    user?.status !== 'ACTIVE';

  const handleCreateShipment = async () => {
    if (!user) return;
    if (isMerchantUnverified) {
      toast.error('Your merchant account must be verified before creating shipments.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await workflowEngine.runParcelCreationWorkflow(
        user.uid,
        {
          recipientInfo: {
            name: formData.recipientName,
            phone: formData.recipientPhone,
            email: formData.recipientEmail || undefined,
          },
          originCenterId: formData.originCenterId,
          destinationCenterId: formData.destinationCenterId,
          weightKg: formData.weightKg,
          dimensions: formData.dimensions,
          fulfillmentMethod: formData.fulfillmentMethod,
          category: formData.category,
          estimatedValue: formData.estimatedValue,
          protectionEnabled: formData.protectionEnabled
        },
        'WALLET'
      );

      if (response.success && response.data) {
        setCreatedParcel(response.data);

        // If SafePay is enabled, automatically initialize Omorfi Chat thread for merchant and recipient
        if (formData.protectionEnabled) {
          try {
            await communicationService.createShipmentConversation(
              formData.recipientEmail || 'CUSTOMER_UID',
              formData.recipientName,
              user.uid,
              user.displayName || 'Merchant',
              response.data.shipmentId,
              response.data.id,
              response.data.trackingNumber,
              true,
              'CUSTOMER',
              'MERCHANT'
            );
          } catch (chatErr) {
            console.warn('Auto-creating chat for SafePay shipment:', chatErr);
          }
        }

        toast.success('Shipment created successfully');
      } else {
        setError(response.message || 'Failed to create shipment.');
        toast.error(response.message || 'Failed to create shipment.');
      }
    } catch (err: any) {
      console.error('Shipment creation failed:', err);
      setError(err.message || 'Failed to create shipment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadLabel = async () => {
    if (!createdParcel) return;
    setIsDownloading(true);
    try {
      const originHub = hubs.find(h => h.id === createdParcel.originCenterId);
      const destinationHub = hubs.find(h => h.id === createdParcel.destinationCenterId);

      await labelService.downloadShippingLabel({
        parcel: createdParcel,
        originHub,
        destinationHub,
        merchant: merchant || undefined
      });

      setDownloadSuccess(true);
      toast.success('Label downloaded successfully');
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to download label:', err);
      toast.error('Failed to generate label');
    } finally {
      setIsDownloading(false);
    }
  };

  if (createdParcel) {
    return (
      <MerchantLayout>
        <div className="max-w-2xl mx-auto py-20 text-center space-y-8 animate-fade-in">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
             <CheckCircle2 size={48} />
          </div>
          <div className="space-y-2">
             <h1 className="text-4xl font-black dark:text-white font-display uppercase italic tracking-tight">Shipment Created!</h1>
             <p className="text-slate-700 font-medium">Tracking ID: <span className="font-bold text-primary-600">{createdParcel.trackingNumber}</span></p>
          </div>
          <Card className="p-6 border-slate-300 dark:border-slate-800 text-left space-y-4 shadow-lg rounded-3xl">
             <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-800">Total Price</span>
                <span className="font-black dark:text-white text-lg">₦{createdParcel.pricing.total.toLocaleString()}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-800">Destination Hub</span>
                <span className="font-black dark:text-white">
                  {hubs.find(h => h.id === createdParcel.destinationCenterId)?.name || createdParcel.destinationCenterId}
                </span>
             </div>
          </Card>
          <div className="flex flex-col gap-3">
             <Button
               type="button"
               onClick={() => setIsCalendarModalOpen(true)}
               className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-md"
             >
               <Calendar size={18} />
               <span>Sync Drop-off Reminder to Google Calendar</span>
             </Button>
             <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  className="flex-1 rounded-xl h-12"
                  variant="outline"
                  onClick={handleDownloadLabel}
                  disabled={isDownloading}
                >
                   {isDownloading ? (
                     <><Loader2 className="animate-spin mr-2" size={18} /> Downloading...</>
                   ) : downloadSuccess ? (
                     <><CheckCircle2 className="text-emerald-500 mr-2" size={18} /> Downloaded</>
                   ) : (
                     'Download Label'
                   )}
                </Button>
                <Button className="flex-1 rounded-xl h-12" onClick={() => { setCreatedParcel(null); setCurrentStep(1); }}>Create Another</Button>
             </div>
          </div>
        </div>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout>
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-black dark:text-white font-display uppercase italic tracking-tight">New Shipment</h1>
          <p className="text-slate-700 font-medium">Create a new parcel shipment for your customer.</p>
        </div>

        {isMerchantUnverified && (
          <div className="p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-3xl flex items-start gap-4">
            <AlertCircle className="text-red-600 shrink-0 mt-1" size={24} />
            <div className="space-y-2">
              <h3 className="font-bold text-red-900 dark:text-red-300">Merchant Account Verification Required</h3>
              <p className="text-sm text-red-700 dark:text-red-400">
                Your merchant profile is currently pending verification. Unverified merchants cannot create shipments. Please complete your identity verification in settings to enable shipment creation.
              </p>
              <Button size="sm" variant="outline" className="rounded-xl border-red-300 text-red-700 hover:bg-red-100" onClick={() => navigate('/merchant/settings')}>
                Complete Verification
              </Button>
            </div>
          </div>
        )}

        {/* Stepper */}
        <div className="relative flex justify-between px-2">
           <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
           {steps.map((step) => (
             <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                  currentStep >= step.id
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-500/30"
                    : "bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 text-slate-800"
                )}>
                   <step.icon size={20} />
                </div>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest hidden sm:block",
                  currentStep >= step.id ? "text-primary-700" : "text-slate-700"
                )}>
                   {step.title}
                </span>
             </div>
           ))}
        </div>

        {/* Step Content */}
        <Card className="p-8 border-slate-200 dark:border-slate-800">
           <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                   <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900">
                      <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-200">
                        <Globe size={16} className="text-blue-600" />
                        <span>Quick import recipient from your Google Contacts</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsContactPickerOpen(true)}
                        className="rounded-xl border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-800 text-xs font-bold"
                      >
                        Import Contact
                      </Button>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-800 uppercase tracking-widest">Recipient Full Name</label>
                         <Input
                           placeholder="Enter customer name"
                           value={formData.recipientName}
                           onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-800 uppercase tracking-widest">Phone Number</label>
                         <Input
                           placeholder="+234 800 000 0000"
                           value={formData.recipientPhone}
                           onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                         />
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                         <label className="text-xs font-bold text-slate-800 uppercase tracking-widest">Email Address (Optional)</label>
                         <Input
                           placeholder="customer@example.com"
                           value={formData.recipientEmail}
                           onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                         />
                      </div>
                   </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="sm:col-span-2 space-y-2">
                         <label className="text-xs font-bold text-slate-800 uppercase tracking-widest">Parcel Category</label>
                         <select
                           className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 border-none outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white text-sm font-semibold"
                           value={formData.category}
                           onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                         >
                            <option>Fashion & Apparel</option>
                            <option>Electronics</option>
                            <option>Beauty & Personal Care</option>
                            <option>Home & Office</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-800 uppercase tracking-widest">Weight (kg)</label>
                         <div className="relative">
                            <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-900" size={18} />
                            <Input
                              placeholder="0.5"
                              className="pl-12"
                              type="number"
                              step="0.1"
                              value={formData.weightKg}
                              onChange={(e) => setFormData({ ...formData, weightKg: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                            />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-800 uppercase tracking-widest">Estimated Value (₦)</label>
                         <div className="relative">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-900" size={18} />
                            <Input
                              placeholder="5,000"
                              className="pl-12"
                              type="number"
                              value={formData.estimatedValue}
                              onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                            />
                         </div>
                      </div>
                   </div>

                   <Card
                     className={cn(
                       "p-5 border-2 transition-all",
                       !isSafePayEnabled ? "border-slate-200 dark:border-slate-800 opacity-70 cursor-not-allowed" :
                       formData.protectionEnabled ? "border-primary-500 bg-primary-50/50 dark:bg-primary-900/10 cursor-pointer" : "border-slate-200 dark:border-slate-800 cursor-pointer"
                     )}
                     onClick={() => isSafePayEnabled && setFormData({ ...formData, protectionEnabled: !formData.protectionEnabled })}
                   >
                      <div className="flex items-start justify-between gap-4">
                         <div className="flex items-start gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                              formData.protectionEnabled && isSafePayEnabled ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            )}>
                               <ShieldCheck size={20} />
                            </div>
                            <div>
                               <p className="font-bold text-sm dark:text-white flex items-center gap-2">
                                 Use SafePay for this transaction
                                 {!isSafePayEnabled && <Badge variant="warning" className="text-[9px] h-4">Coming Soon</Badge>}
                               </p>
                               <p className="text-xs text-slate-800 dark:text-slate-300 mt-1">
                                 {isSafePayEnabled
                                   ? "The buyer's payment is held securely by Flutterwave until they confirm the item, with video evidence on both sides. Optional — recommended for higher-value or first-time buyer transactions."
                                   : "SafePay protected payments aren't active yet — we're putting the finishing touches on it. This shipment will use standard payment for now."}
                               </p>
                            </div>
                         </div>
                         <Switch checked={!!formData.protectionEnabled && isSafePayEnabled} disabled={!isSafePayEnabled} onChange={() => isSafePayEnabled && setFormData({ ...formData, protectionEnabled: !formData.protectionEnabled })} />
                      </div>
                   </Card>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                   <div className="space-y-6">
                      <div className="space-y-3">
                         <h4 className="text-sm font-bold dark:text-white flex items-center gap-2">
                            <Building2 size={16} className="text-primary-600" />
                            Pickup OmorfiHub Point
                         </h4>
                         <div className="relative">
                            <select
                              className="w-full h-14 pl-14 pr-4 rounded-2xl bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800 outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white text-sm font-bold appearance-none"
                              value={formData.originCenterId}
                              onChange={(e) => setFormData({ ...formData, originCenterId: e.target.value })}
                            >
                               <option value="" disabled>Select your pickup hub</option>
                               {hubs.map(hub => (
                                 <option key={hub.id} value={hub.id}>{hub.name} — {hub.city}</option>
                               ))}
                            </select>
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary-600 shadow-sm pointer-events-none">
                               <MapPin size={18} />
                            </div>
                         </div>
                         <p className="text-[11px] text-slate-500">This is the OmorfiHub Point where you'll drop off the parcel.</p>
                      </div>

                      <div className="space-y-3">
                         <h4 className="text-sm font-bold dark:text-white flex items-center gap-2">
                            <MapPin size={16} className="text-indigo-600" />
                            Destination OmorfiHub Point
                         </h4>
                         <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-900" size={18} />
                            <Input
                              placeholder="Search destination hub..."
                              className="pl-12 h-14"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 max-h-[300px] overflow-y-auto">
                            {isLoadingHubs ? (
                              <div className="col-span-2 flex justify-center py-8">
                                <Loader2 className="animate-spin text-primary-600" />
                              </div>
                            ) : filteredHubs.map((hub) => (
                               <Card
                                 key={hub.id}
                                 className={cn(
                                   "p-4 border-slate-100 dark:border-slate-800 hover:border-primary-500 cursor-pointer transition-colors group",
                                   formData.destinationCenterId === hub.id && "border-primary-600 bg-primary-50/10"
                                 )}
                                 onClick={() => setFormData({ ...formData, destinationCenterId: hub.id })}
                               >
                                  <p className="font-bold text-sm dark:text-white group-hover:text-primary-600 transition-colors">{hub.name}</p>
                                  <p className="text-[10px] text-slate-800">{hub.address}, {hub.city}</p>
                               </Card>
                            ))}
                         </div>
                      </div>
                   </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                   <div className="space-y-4">
                      <h3 className="text-sm font-bold dark:text-white uppercase tracking-widest">Select Fulfillment Method</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <Card
                            className={cn("p-6 cursor-pointer border-2 transition-all", formData.fulfillmentMethod === 'HUB_PICKUP' ? 'border-primary-600 bg-primary-50/10' : 'border-slate-200')}
                            onClick={() => setFormData({ ...formData, fulfillmentMethod: 'HUB_PICKUP' })}
                         >
                            <h4 className="font-bold dark:text-white">Hub Pickup</h4>
                            <p className="text-xs text-slate-800">Parcel stays at Hub</p>
                         </Card>
                         <Card
                            className={cn("p-6 cursor-pointer border-2 transition-all", formData.fulfillmentMethod === 'LOGISTICS_DELIVERY' ? 'border-primary-600 bg-primary-50/10' : 'border-slate-200')}
                            onClick={() => setFormData({ ...formData, fulfillmentMethod: 'LOGISTICS_DELIVERY' })}
                         >
                            <h4 className="font-bold dark:text-white">Logistics Delivery</h4>
                            <p className="text-xs text-slate-800">Delivered to door</p>
                         </Card>
                      </div>

                      {formData.fulfillmentMethod === 'LOGISTICS_DELIVERY' && (
                        <div className="space-y-4 pt-4">
                          <h3 className="text-sm font-bold dark:text-white uppercase tracking-widest">Select Service Type</h3>
                          {[
                            { id: 'STANDARD', title: 'Standard Delivery', desc: 'Estimated 2-3 business days', icon: Truck },
                            { id: 'EXPRESS', title: 'Express Delivery', desc: 'Next business day arrival', icon: Truck },
                            { id: 'SAME_DAY', title: 'Same Day Delivery', desc: 'Arrival within 8 hours', icon: Truck },
                          ].map((opt) => (
                            <Card
                              key={opt.id}
                              className={cn(
                                "p-6 border-slate-200 dark:border-slate-800 hover:border-primary-500 cursor-pointer transition-all group",
                                formData.serviceType === opt.id && "border-primary-600 bg-primary-50/10"
                              )}
                              onClick={() => setFormData({ ...formData, serviceType: opt.id as any })}
                            >
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 group-hover:text-primary-600 transition-colors">
                                        <opt.icon size={24} />
                                     </div>
                                     <div>
                                        <h4 className="font-bold dark:text-white">{opt.title}</h4>
                                        <p className="text-xs text-slate-800">{opt.desc}</p>
                                     </div>
                                  </div>
                                  {pricesLoading ? (
                                    <Loader2 className="animate-spin text-primary-600" size={20} />
                                  ) : (
                                    <span className="text-xl font-black text-primary-600">
                                      {servicePrices[opt.id as 'STANDARD' | 'EXPRESS' | 'SAME_DAY'] != null
                                        ? `₦${Math.round(servicePrices[opt.id as 'STANDARD' | 'EXPRESS' | 'SAME_DAY']!).toLocaleString()}`
                                        : '—'}
                                    </span>
                                  )}
                               </div>
                            </Card>
                          ))}
                        </div>
                      )}
                      {formData.fulfillmentMethod === 'LOGISTICS_DELIVERY' && (
                        <p className="text-[11px] text-slate-500 pt-1">Prices shown are live estimates based on your parcel's weight and dimensions. The final amount is confirmed at checkout.</p>
                      )}
                   </div>
                </motion.div>
              )}

              {currentStep === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                   <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-8">
                         <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Recipient</p>
                            <p className="font-bold dark:text-white">{formData.recipientName}</p>
                            <p className="text-xs text-slate-800">{formData.recipientPhone}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Parcel</p>
                            <p className="font-bold dark:text-white">{formData.category}</p>
                            <p className="text-xs text-slate-800">{formData.weightKg}kg • ₦{formData.estimatedValue.toLocaleString()} Value</p>
                         </div>
                      </div>

                      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-4">
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-800">Service</span>
                            <span className="font-bold dark:text-white uppercase">{formData.serviceType}</span>
                         </div>
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-800">Destination</span>
                            <span className="font-bold dark:text-white">
                              {hubs.find(h => h.id === formData.destinationCenterId)?.name || 'Not selected'}
                            </span>
                         </div>
                         <div className="h-px bg-slate-200 dark:bg-slate-800" />
                         <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-900 dark:text-white">Calculation Method</span>
                            <span className="text-sm font-bold text-primary-600">Dynamic Pricing Rules</span>
                         </div>
                      </div>

                      {error && (
                        <div className="p-4 rounded-xl bg-red-50 text-red-600 text-xs flex items-center gap-3">
                          <AlertCircle size={16} /> {error}
                        </div>
                      )}

                      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800">
                         <AlertCircle className="text-blue-600 shrink-0" size={18} />
                         <p className="text-[10px] text-blue-600 leading-relaxed font-medium">
                            By clicking "Confirm & Create", you agree to OmorfiHub's Terms of Service and confirm the parcel does not contain prohibited items.
                         </p>
                      </div>
                   </div>
                </motion.div>
              )}
           </AnimatePresence>

           <div className="mt-10 flex items-center justify-between pt-8 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="text"
                onClick={prevStep}
                disabled={currentStep === 1 || isSubmitting}
                className="font-bold text-slate-800"
              >
                 <ChevronLeft size={20} /> Back
              </Button>
              <Button
                onClick={currentStep === steps.length ? handleCreateShipment : nextStep}
                disabled={isSubmitting || !isStepValid(currentStep)}
                className="rounded-xl px-10 h-12 shadow-lg shadow-primary-500/20"
              >
                 {isSubmitting ? (
                   <>
                     <Loader2 size={20} className="animate-spin mr-2" /> Creating...
                   </>
                 ) : (
                   <>
                     {currentStep === steps.length ? 'Confirm & Create' : 'Next Step'} <ChevronRight size={20} />
                   </>
                 )}
              </Button>
           </div>
           {!isStepValid(currentStep) && (
             <p className="text-xs text-red-500 font-medium text-right mt-2">
               {currentStep === 1 && 'Enter the recipient\'s name and phone number to continue.'}
               {currentStep === 2 && 'Enter a valid weight and estimated value to continue.'}
               {currentStep === 3 && 'Select both an origin and destination hub to continue.'}
             </p>
           )}
        </Card>

        {/* Google Integrations Modals */}
        <GoogleContactPickerModal
          isOpen={isContactPickerOpen}
          onClose={() => setIsContactPickerOpen(false)}
          onSelectContact={handleSelectContact}
        />

        <AddToGoogleCalendarModal
          isOpen={isCalendarModalOpen}
          onClose={() => setIsCalendarModalOpen(false)}
          defaultEvent={{
            summary: `OmorfiHub Parcel Dispatch Reminder: ${createdParcel?.trackingNumber || 'Pending'}`,
            description: `Dispatch parcel tracking ID: ${createdParcel?.trackingNumber || 'Pending'}. Destination hub: ${hubs.find(h => h.id === createdParcel?.destinationCenterId)?.name || createdParcel?.destinationCenterId || 'Hub'}. Recipient: ${formData.recipientName} (${formData.recipientPhone}).`,
            startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
            location: hubs.find(h => h.id === createdParcel?.originCenterId)?.name,
          }}
        />
      </div>
    </MerchantLayout>
  );
};
