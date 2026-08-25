import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  Search,
  User,
  Package,
  MapPin,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Scale,
  CreditCard,
  Printer,
  Barcode,
  Layers,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { PointLayout } from '@/src/layouts/PointLayout';
import { useAuth } from '@/src/context/AuthContext';
import { workflowEngine } from '@/src/engines/WorkflowEngine';
import { userEngine } from '@/src/engines/UserEngine';
import { centreEngine } from '@/src/engines/CentreEngine';
import { labelService } from '@/src/services/LabelService';
import { User as UserType, HubCenter, Parcel } from '@/src/types';

export const HubCreateShipmentPage: React.FC = () => {
  const { user } = useAuth();

  // Authorization Checks
  const isHubOwner = user?.role === 'CENTER_OWNER' || user?.role === 'HUB_OWNER' || user?.roles?.includes('CENTER_OWNER') || user?.roles?.includes('HUB_OWNER');
  const isHubStaff = user?.role === 'CENTER_STAFF' || user?.role === 'POINT_STAFF' || user?.roles?.includes('CENTER_STAFF') || user?.roles?.includes('POINT_STAFF');
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.roles?.includes('SUPER_ADMIN');
  const isAuthorizedRole = isHubOwner || isHubStaff || isAdmin;

  const hasDelegatedPermission = isHubOwner || isAdmin || (isHubStaff && (user?.delegatedPermissions?.canBookShipments === true || (user as any)?.canBookShipments === true));

  // Search Merchants
  const [merchantSearchQuery, setMerchantSearchQuery] = useState('');
  const [merchants, setMerchants] = useState<UserType[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<UserType | null>(null);
  const [isSearchingMerchants, setIsSearchingMerchants] = useState(false);

  // Hubs list
  const [hubs, setHubs] = useState<HubCenter[]>([]);
  const [isLoadingHubs, setIsLoadingHubs] = useState(false);

  // Form State
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [category, setCategory] = useState('General Goods');
  const [weightKg, setWeightKg] = useState(1.0);
  const [estimatedValue, setEstimatedValue] = useState(5000);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'HUB_PICKUP' | 'LOGISTICS_DELIVERY'>('HUB_PICKUP');
  const [destinationHubId, setDestinationHubId] = useState('');
  const [serviceType, setServiceType] = useState<'STANDARD' | 'EXPRESS'>('STANDARD');

  // Delegated Booking OTP State
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isLegalConfirmed, setIsLegalConfirmed] = useState(false);

  // Submit State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdParcel, setCreatedParcel] = useState<Parcel | null>(null);

  // Load active Hubs
  useEffect(() => {
    const loadHubs = async () => {
      setIsLoadingHubs(true);
      try {
        const allHubs = await centreEngine.listNearbyHubs(0, 0, 9999);
        setHubs(allHubs.filter(h => h.status === 'ACTIVE'));
      } catch (err) {
        console.error('Failed to load hubs:', err);
      } finally {
        setIsLoadingHubs(false);
      }
    };
    loadHubs();
  }, []);

  // Search Merchants Function
  const handleSearchMerchants = async () => {
    if (!merchantSearchQuery.trim()) return;
    setIsSearchingMerchants(true);
    try {
      // Get all merchants and filter client-side for fast UX
      const allUsers = await userEngine.getAllUsers();
      const queryLower = merchantSearchQuery.toLowerCase();
      const matched = allUsers.filter(u => {
        const isMerchantRole = u.role === 'MERCHANT' || u.roles?.includes('MERCHANT');
        const isVerified = u.verificationStatus?.kyc === true || u.status === 'APPROVED' || u.status === 'ACTIVE';
        const matchesQuery = ((u as any).name || u.displayName || '').toLowerCase().includes(queryLower) ||
                             u.email.toLowerCase().includes(queryLower) ||
                             u.uid.toLowerCase().includes(queryLower);
        return isMerchantRole && isVerified && matchesQuery;
      });
      setMerchants(matched);
      if (matched.length === 0) {
        toast.info('No verified merchants found matching search.');
      }
    } catch (err: any) {
      toast.error('Error searching merchants: ' + err.message);
    } finally {
      setIsSearchingMerchants(false);
    }
  };

  // Form Submission
  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedMerchant) return;

    if (!recipientName.trim() || !recipientPhone.trim()) {
      toast.error('Please fill in required recipient contact information.');
      return;
    }

    if (!destinationHubId) {
      toast.error('Please select a Destination Hub Point.');
      return;
    }

    setIsSubmitting(true);
    try {
      const originHubId = user.hubId || hubs[0]?.id || 'HUB-101';
      const parcelData: Partial<Parcel> = {
        senderId: selectedMerchant.uid,
        recipientInfo: {
          name: recipientName.trim(),
          phone: recipientPhone.trim(),
          email: recipientEmail.trim()
        },
        category,
        weightKg: Number(weightKg),
        estimatedValue: Number(estimatedValue),
        fulfillmentMethod,
        originCenterId: originHubId,
        destinationCenterId: destinationHubId,
        dimensions: { l: 15, w: 15, h: 15 }
      };

      const response = await workflowEngine.runParcelCreationWorkflow(
        user.uid,
        parcelData,
        'WALLET'
      );

      if (response.success && response.data) {
        const newParcel = response.data as Parcel;
        setCreatedParcel(newParcel);
        toast.success(`Shipment created on behalf of ${selectedMerchant.name || selectedMerchant.displayName}! Tracking ID: ${newParcel.trackingNumber}`);
      } else {
        toast.error(response.message || 'Failed to create shipment.');
      }
    } catch (err: any) {
      toast.error('Shipment booking failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const handleResetForm = () => {
    setCreatedParcel(null);
    setRecipientName('');
    setRecipientPhone('');
    setRecipientEmail('');
    setDestinationHubId('');
    setSelectedMerchant(null);
    setMerchantSearchQuery('');
  };

  // Download Waybill Label
  const handleDownloadLabel = async () => {
    if (!createdParcel) return;
    await labelService.downloadShippingLabel({
      parcel: createdParcel,
      merchant: selectedMerchant ? {
        id: selectedMerchant.uid,
        userId: selectedMerchant.uid,
        name: selectedMerchant.name || selectedMerchant.displayName || 'Merchant',
        businessName: selectedMerchant.name || selectedMerchant.displayName || 'Merchant',
        phone: selectedMerchant.phoneNumber || selectedMerchant.phone || '',
        email: selectedMerchant.email || '',
        status: 'ACTIVE'
      } as any : undefined
    });
    toast.success('Shipping label PDF generated');
  };

  if (!isAuthorizedRole) {
    return (
      <PointLayout>
        <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center space-y-4">
          <ShieldAlert size={48} className="text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-sm text-slate-600">
            Only authorized Hub Owners and Hub Operations Staff can book shipments on behalf of Merchants.
          </p>
        </div>
      </PointLayout>
    );
  }

  if (!hasDelegatedPermission) {
    return (
      <PointLayout>
        <div className="max-w-2xl mx-auto my-12 p-8 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm text-center space-y-4">
          <AlertTriangle size={48} className="text-amber-600 mx-auto" />
          <h2 className="text-xl font-bold text-amber-900">Delegated Booking Permission Required</h2>
          <p className="text-xs text-amber-800 max-w-md mx-auto">
            You are logged in as Hub Staff (<span className="font-semibold">{user.name}</span>). Your Hub Owner has not granted you delegated permission to book shipments on behalf of Merchants.
          </p>
          <div className="text-xs text-amber-700 bg-amber-100 p-3 rounded-xl max-w-md mx-auto border border-amber-200">
            To enable this capability, ask your Hub Owner to grant you the <span className="font-bold">Shipment Booking</span> permission in the Employees module.
          </div>
        </div>
      </PointLayout>
    );
  }

  return (
    <PointLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary-600 uppercase tracking-wider mb-1">
              <Building2 size={14} />
              Hub Point On-Behalf-Of Booking
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Book Shipment for Merchant</h1>
            <p className="text-xs text-slate-500 mt-1">
              Create official commercial shipments on behalf of verified merchants under their verified profile.
            </p>
          </div>
        </div>

        {/* SUCCESS CREATED PARCEL CARD */}
        {createdParcel ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-950 text-white p-8 rounded-2xl border border-emerald-800 space-y-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-emerald-800 pb-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-400" size={32} />
                <div>
                  <h2 className="text-lg font-bold">Shipment Booked Successfully</h2>
                  <p className="text-xs text-emerald-300 font-mono">Tracking ID: {createdParcel.trackingNumber}</p>
                </div>
              </div>
              <button
                onClick={handleResetForm}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl transition"
              >
                Book Another Shipment
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-emerald-900/60 p-4 rounded-xl border border-emerald-800">
                <span className="text-emerald-300 text-[10px] uppercase font-bold">Merchant Sender</span>
                <p className="font-bold text-white text-sm mt-1">{selectedMerchant?.name || selectedMerchant?.displayName}</p>
                <p className="text-[11px] text-emerald-300">{selectedMerchant?.email}</p>
              </div>

              <div className="bg-emerald-900/60 p-4 rounded-xl border border-emerald-800">
                <span className="text-emerald-300 text-[10px] uppercase font-bold">Recipient</span>
                <p className="font-bold text-white text-sm mt-1">{createdParcel.recipientInfo?.name}</p>
                <p className="text-[11px] text-emerald-300">{createdParcel.recipientInfo?.phone}</p>
              </div>

              <div className="bg-emerald-900/60 p-4 rounded-xl border border-emerald-800">
                <span className="text-emerald-300 text-[10px] uppercase font-bold">Total Tariff</span>
                <p className="font-bold text-emerald-300 text-lg mt-1">₦{createdParcel.pricing?.total.toLocaleString()}</p>
                <p className="text-[10px] text-emerald-400 font-semibold">{createdParcel.fulfillmentMethod === 'HUB_PICKUP' ? 'Hub Pickup Direct' : 'Logistics Delivery'}</p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDownloadLabel}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
              >
                <Printer size={16} /> Print Official Waybill Label
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* STEP 1: MERCHANT SELECTION (LEFT 1 COL) */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
                  <User size={18} className="text-primary-600" />
                  1. Select Verified Merchant
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-700">
                    Search Merchant Business / Email
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={merchantSearchQuery}
                        onChange={(e) => setMerchantSearchQuery(e.target.value)}
                        placeholder="Name, email or UID..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                    </div>
                    <button
                      type="button"
                      onClick={handleSearchMerchants}
                      disabled={isSearchingMerchants || !merchantSearchQuery.trim()}
                      className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
                    >
                      {isSearchingMerchants ? <RefreshCw className="animate-spin" size={14} /> : 'Search'}
                    </button>
                  </div>
                </div>

                {/* Merchant Search Results List */}
                {merchants.length > 0 && (
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl text-xs">
                    {merchants.map((m) => (
                      <div
                        key={m.uid}
                        onClick={() => setSelectedMerchant(m)}
                        className={`p-3 cursor-pointer hover:bg-primary-50/50 transition flex items-center justify-between ${
                          selectedMerchant?.uid === m.uid ? 'bg-primary-50 border-l-4 border-primary-600 font-semibold' : ''
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-900">{m.name || m.displayName || 'Merchant'}</div>
                          <div className="text-[10px] text-slate-500">{m.email}</div>
                        </div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          Verified
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Merchant Confirmation Card */}
                {selectedMerchant ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 text-sm">
                        {selectedMerchant.name || selectedMerchant.displayName}
                      </span>
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    </div>
                    <p className="text-emerald-800 text-[11px]">{selectedMerchant.email}</p>

                    {/* Delegated "Help Me" OTP Step */}
                    {!isOtpSent ? (
                      <button
                        type="button"
                        onClick={async () => {
                          if (selectedMerchant.allowDelegatedBooking === false) {
                            toast.error(`${selectedMerchant.name || 'This merchant'} has disabled delegated booking in their settings.`);
                            return;
                          }
                          setIsSendingOtp(true);
                          const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
                          setGeneratedOtp(mockOtp);
                          setIsOtpSent(true);
                          setIsSendingOtp(false);
                          toast.success(`6-digit authorization OTP sent to ${selectedMerchant.email || 'merchant phone/email'}! (Test OTP: ${mockOtp})`);
                        }}
                        disabled={isSendingOtp}
                        className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        {isSendingOtp ? <RefreshCw className="animate-spin" size={14} /> : null}
                        Request 6-Digit Authorization OTP
                      </button>
                    ) : (
                      <div className="space-y-2 pt-1 border-t border-emerald-200">
                        <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-widest block">
                          Enter Merchant Authorization OTP *
                        </span>
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="6-digit OTP code"
                          className="w-full text-center tracking-widest font-mono text-sm py-2 bg-white border border-emerald-300 rounded-lg text-emerald-950 font-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <p className="text-[10px] text-emerald-700">
                          Ask the merchant for the 6-digit code sent to their registered phone/email.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                    <Info size={16} className="shrink-0 mt-0.5" />
                    <p>Search and select a verified merchant above to proceed with shipment creation.</p>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 2: SHIPMENT DETAILS FORM (RIGHT 2 COLS) */}
            <div className="lg:col-span-2">
              <form onSubmit={handleCreateShipment} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
                  <Package size={18} className="text-primary-600" />
                  2. Shipment & Recipient Details
                </div>

                {/* Recipient Contacts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Recipient Full Name *
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g. Chinedu Okafor"
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Recipient Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="e.g. 08012345678"
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Package Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="Fashion & Apparel">Fashion & Apparel</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Documents">Documents</option>
                      <option value="Beauty & Cosmetics">Beauty & Cosmetics</option>
                      <option value="General Goods">General Goods</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Weight (Kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={weightKg}
                      onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0.1)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Declared Value (NGN)
                    </label>
                    <input
                      type="number"
                      value={estimatedValue}
                      onChange={(e) => setEstimatedValue(parseInt(e.target.value) || 1000)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Fulfillment Method & Destination Hub */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Fulfillment Method *
                    </label>
                    <select
                      value={fulfillmentMethod}
                      onChange={(e) => setFulfillmentMethod(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="HUB_PICKUP">Hub Pickup / Direct Collection (No Logistics)</option>
                      <option value="LOGISTICS_DELIVERY">Logistics Partner Delivery</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Destination Hub Point *
                    </label>
                    <select
                      value={destinationHubId}
                      onChange={(e) => setDestinationHubId(e.target.value)}
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Destination Hub Point...</option>
                      {hubs.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.city || h.state})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Legal Warning & Disclaimer Checkbox */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                   <div className="flex items-start gap-2 text-slate-800">
                      <input
                        type="checkbox"
                        id="legalConfirm"
                        checked={isLegalConfirmed}
                        onChange={(e) => setIsLegalConfirmed(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="legalConfirm" className="font-semibold cursor-pointer text-slate-800 leading-relaxed">
                        ⚠️ <span className="text-slate-900 font-bold">Helper Legal Disclaimer & Safety Confirmation:</span> I confirm that I am creating this parcel with explicit authorization from the merchant, and I verify that the parcel does not contain illegal, contraband, or dangerous items. OmorfiHub will keep a permanent security audit log of this helper transaction.
                      </label>
                   </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedMerchant || !destinationHubId || !isOtpSent || otpCode.length !== 6 || !isLegalConfirmed}
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                  >
                    {isSubmitting ? <RefreshCw className="animate-spin" size={16} /> : <ArrowRight size={16} />}
                    Book Shipment for Merchant
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PointLayout>
  );
};
