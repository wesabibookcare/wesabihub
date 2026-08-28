import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  Package,
  MapPin,
  Clock,
  Video,
  CheckCircle2,
  Truck,
  Building2,
  Calendar,
  ChevronRight,
  ArrowRight,
  Navigation,
  Globe,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { CustomerLayout } from '@/src/layouts/CustomerLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { notificationEngine, timelineEngine } from '@/src/engines';
import { communicationService } from '@/src/services/CommunicationService';
import { parcelEngine } from '@/src/engines';
import { centreEngine } from '@/src/engines';
import { HubCenter } from '@/src/types';
import { useAuth } from '@/src/context/AuthContext';
import { apiFetch } from '@/src/lib/apiClient';
import { ShipmentTrackerMap } from '@/src/components/ui/ShipmentTrackerMap';
import { ParcelTimeline } from '@/src/components/timeline/ParcelTimeline';
import { shipmentRepository } from '@/src/services/db/ShipmentRepository';
import { SuccessAnimation, SuccessAnimationStyle } from '@/src/components/ui/SuccessAnimation';


export const TrackParcelPage = () => {
  const [searchParams] = useSearchParams();
  const initialTracking = searchParams.get('id') || '';
  const [trackingNumber, setTrackingNumber] = useState(initialTracking);
  const [isSearching, setIsSearching] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [conversationExists, setConversationExists] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // Real Firestore backend integrations
  const [hubs, setHubs] = useState<HubCenter[]>([]);
  const [realShipment, setRealShipment] = useState<any>(null);
  const [realEvents, setRealEvents] = useState<any[]>([]);
  const [paymentProtectionRecord, setPaymentProtectionRecord] = useState<any>(null);
  const [isReleasing, setIsReleasing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [animationStyle, setAnimationStyle] = useState<SuccessAnimationStyle>('confetti');

  const navigate = useNavigate();
  const { user, fbUser } = useAuth();

  // Load active hub centers to resolve names dynamically
  useEffect(() => {
    centreEngine.listNearbyHubs(0, 0, 9999).then(allHubs => {
      setHubs(allHubs.filter(h => h.status === 'ACTIVE'));
    }).catch(err => console.error("Failed to load hubs in tracking:", err));
  }, []);

  useEffect(() => {
    if (initialTracking && !hasResult && !isSearching) {
      handleSearchInternal(initialTracking);
    }
  }, [initialTracking]);

  // Live-watch the shipment doc while this page is open: if the status flips
  // to COLLECTED in real time (hub agent releases it while the customer is
  // on this page), play the same success animation the hub sees.
  const lastKnownStatusRef = React.useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!realShipment?.id) return;
    lastKnownStatusRef.current = realShipment.status;
    const unsubscribe = shipmentRepository.subscribe(realShipment.id, (updated: any) => {
      if (!updated) return;
      if (lastKnownStatusRef.current !== 'COLLECTED' && updated.status === 'COLLECTED') {
        setAnimationStyle((updated?.successAnimationStyle as SuccessAnimationStyle) || 'confetti');
        setShowSuccessAnim(true);
      }
      lastKnownStatusRef.current = updated.status;
      setRealShipment((prev: any) => prev ? { ...prev, ...updated } : updated);
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realShipment?.id]);

  useEffect(() => {
    if (hasResult) {
      notificationEngine.getConversations().then(convs => {
        const exists = convs.some(c => c.trackingNumber === trackingNumber);
        setConversationExists(exists);
      });
    }
  }, [hasResult, trackingNumber]);

  const handleSearchInternal = async (searchNum: string) => {
    if (!searchNum.trim()) {
      toast.error('Please enter a tracking number');
      return;
    }
    setIsSearching(true);
    setErrorMessage('');
    setRealShipment(null);
    setRealEvents([]);
    setPaymentProtectionRecord(null);

    try {
      // 1. Search Firestore for shipment
      const shipment = await parcelEngine.getParcelByTracking(searchNum.trim());
      if (shipment) {
        setRealShipment(shipment);

        // 2. Fetch tracking timeline
        try {
          const events = await timelineEngine.getTimelineForUser(shipment.id || shipment.shipmentId, user?.role || 'CUSTOMER', 'asc');
          setRealEvents(events);
        } catch (eventErr) {
          console.error("Failed to fetch tracking history:", eventErr);
        }

        // 3. Fetch SafePay / payment protection details
        try {
          const res = await fetch(`/api/payment-protection/status/${shipment.id || shipment.shipmentId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              setPaymentProtectionRecord(data.record);
            }
          }
        } catch (protectionErr) {
          console.error("Failed to fetch SafePay status:", protectionErr);
        }
      } else {
        setErrorMessage("No shipment found with that tracking number. Please verify and try again.");
      }
      setHasResult(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSearchInternal(trackingNumber);
  };

  const handleOmorfiChat = async () => {
    if (!user) return;

    if (conversationExists) {
      navigate('/customer/chat');
      return;
    }

    setIsCreatingChat(true);
    try {
      const sellerId = realShipment?.merchantId;
      const sellerName = realShipment ? `Merchant (ID: ${realShipment.merchantId.substring(0, 6)})` : 'Merchant';
      const sId = realShipment?.id;

      await communicationService.createShipmentConversation(
        user.uid,
        user.displayName || 'Customer',
        sellerId,
        sellerName,
        sId,
        sId,
        trackingNumber,
        !!realShipment?.protectionEnabled
      );
      navigate('/customer/chat');
    } catch (error) {
      console.error(error);
      toast.error('Failed to initialize Omorfi Chat');
    } finally {
      setIsCreatingChat(false);
    }
  };

  const isDelivered = realShipment
    ? (realShipment.status === 'DELIVERED' || realShipment.status === 'COMPLETED' || realShipment.status === 'RELEASED')
    : trackingNumber.toUpperCase().includes('DELIVERED');

  const isOutForDelivery = realShipment
    ? (realShipment.status === 'IN_TRANSIT')
    : trackingNumber.toUpperCase().includes('OUT');

  // Mock locations
  const LAGOS_HUB = { lat: 6.5244, lng: 3.3792 };
  const ABUJA_WUSE = { lat: 9.0765, lng: 7.3986 };
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const handleReleasePayment = async () => {
    const protectionId = paymentProtectionRecord?.paymentProtectionId || paymentProtectionRecord?.id;

    if (!paymentProtectionRecord?.metadata?.buyerEvidenceVideo) {
      toast.error('Please record your unboxing/inspection video in Omorfi Chat before releasing payment.');
      navigate('/customer/chat');
      return;
    }

    if (!confirm('Are you sure you want to release the protected payment? This action is irreversible.')) {
      return;
    }

    setIsReleasing(true);
    try {
      await apiFetch(fbUser, '/api/payment-protection/release', {
        method: 'POST',
        body: { paymentProtectionId: protectionId }
      });

      toast.success('SafePay payment released successfully! Funds have been sent to the Merchant.');

      // Update local state
      if (paymentProtectionRecord) {
        setPaymentProtectionRecord({
          ...paymentProtectionRecord,
          status: 'PAYMENT_RELEASED'
        });
      }
      if (realShipment) {
        setRealShipment({
          ...realShipment,
          status: 'COMPLETED'
        });
      }
    } catch (err: any) {
      console.error("Error releasing payment:", err);
      toast.error(err.message || 'Error releasing payment. Please try again.');
    } finally {
      setIsReleasing(false);
    }
  };

  const handleReportIssue = () => {
    navigate('/customer/chat');
  };

  const [isExtending, setIsExtending] = useState(false);
  const handleRequestExtension = async () => {
    const protectionId = paymentProtectionRecord?.paymentProtectionId || paymentProtectionRecord?.id;
    if (!protectionId) return;

    setIsExtending(true);
    try {
      const result: any = await apiFetch(fbUser, '/api/payment-protection/request-extension', {
        method: 'POST',
        body: { paymentProtectionId: protectionId }
      });
      toast.success('Inspection period extended.');
      if (paymentProtectionRecord) {
        setPaymentProtectionRecord({
          ...paymentProtectionRecord,
          inspectionExpiresAt: result.inspectionExpiresAt
        });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to extend inspection period.');
    } finally {
      setIsExtending(false);
    }
  };

  const trackingEvents = realEvents.length > 0
    ? realEvents.map(e => ({
        title: e.statusDescription || e.status || 'Status Updated',
        location: e.locationName || 'OmorfiHub Logistics Center',
        time: e.timestamp ? new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
        date: e.timestamp ? new Date(e.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending',
        status: 'completed'
      }))
    : [];

  return (
    <CustomerLayout>
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-4">
           <h1 className="text-4xl font-bold dark:text-white font-display tracking-tight">Track Your Parcel</h1>
            <p className="text-[#248ddb] font-bold max-w-xl mx-auto">Enter your tracking number below to see the real-time status of your shipment. Type "DELIVERED" to test Payment Protection actions.</p>
        </div>

        <Card className="p-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl">
           <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-800" />
                 <input
                   type="text"
                   value={trackingNumber}
                   onChange={(e) => setTrackingNumber(e.target.value)}
                   placeholder="Enter Tracking Number (e.g. WSH-123-456)"
                   className="w-full h-16 pl-12 pr-6 rounded-xl bg-transparent border-none focus:ring-0 outline-none dark:text-white text-lg"
                 />
              </div>
              <Button
                type="submit"
                isLoading={isSearching}
                className="h-16 px-10 rounded-xl text-lg font-bold"
              >
                 Track Now
              </Button>
           </form>
        </Card>

        {errorMessage && (
           <Card className="p-6 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 flex items-center gap-3">
             <AlertCircle size={24} className="shrink-0" />
             <p className="font-medium">{errorMessage}</p>
           </Card>
         )}

         {hasResult && realShipment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-3 gap-10"
          >
             <div className="lg:col-span-2 space-y-8">
                {/* Status Summary */}
                <Card className="p-8 border-slate-200 dark:border-slate-800 overflow-hidden relative">
                   <div className="absolute top-0 right-0 w-32 h-full bg-primary-600/5 blur-3xl" />
                   <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
                      <div className="space-y-4">
                         <div className="flex items-center gap-3">
                            <Badge variant={isDelivered ? "success" : "info"} className="h-7">
                              {realShipment ? realShipment.status : (isDelivered ? "Delivered" : "In Transit")}
                            </Badge>
                            <span className="text-slate-800 font-mono">{trackingNumber}</span>
                         </div>
                         <h2 className="text-3xl font-bold dark:text-white font-display">
                           {isDelivered ? "Delivered Successfully" : (realShipment ? `Currently ${realShipment.status.replace(/_/g, ' ')}` : "Tracking Status")}
                         </h2>
                         <div className="flex items-center gap-6 pt-2">
                            <div className="flex flex-col">
                               <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">Origin</span>
                               <span className="font-bold dark:text-white">
                                 {realShipment ? (hubs.find(h => h.id === realShipment.originCenterId)?.name || realShipment.originCenterId) : "---"}
                               </span>
                            </div>
                            <ArrowRight className="text-primary-600" />
                            <div className="flex flex-col">
                               <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">Destination</span>
                               <span className="font-bold dark:text-white">
                                 {realShipment ? (hubs.find(h => h.id === realShipment.destinationCenterId)?.name || realShipment.destinationCenterId) : "---"}
                               </span>
                            </div>
                         </div>
                      </div>
                      {!isDelivered && realShipment && (
                        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shrink-0">
                           <p className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-2">Est. Delivery</p>
                           <p className="text-2xl font-bold text-primary-600">
                             {realShipment.updatedAt
                               ? new Date(new Date(realShipment.updatedAt).getTime() + 2*24*60*60*1000).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                               : "Calculating..."}
                           </p>
                           <p className="text-xs text-slate-800">Standard Delivery Window</p>
                        </div>
                      )}
                   </div>
                </Card>

                {/* Payment Status & Pickup Readiness */}
                {realShipment && (
                  <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">
                    <h3 className="text-xl font-bold dark:text-white font-display">Pickup Preparation</h3>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-800">Payment Status:</span>
                        <Badge variant={realShipment.status === 'PAYMENT_CONFIRMED' ? 'success' : 'warning'}>
                          {realShipment.status === 'PAYMENT_CONFIRMED' ? 'Paid' : 'Awaiting Payment'}
                        </Badge>
                      </div>

                      {realShipment.status === 'AWAITING_PAYMENT' && (
                        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
                          <p className="text-sm text-amber-800 dark:text-amber-400 mb-4">
                            Outstanding Balance: <strong>₦{realShipment.pricing.total.toLocaleString()}</strong>
                          </p>
                          <Button
                            className="w-full font-bold shadow-lg"
                            onClick={() => navigate(`/customer/payment/${realShipment.id}`)}
                          >
                            Pay Now
                          </Button>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-slate-800">Pickup Status:</span>
                        <Badge variant={realShipment.status === 'READY_FOR_PICKUP' ? 'success' : 'info'}>
                          {realShipment.status === 'READY_FOR_PICKUP' ? 'Ready for Pickup' : 'Not Ready'}
                        </Badge>
                      </div>

                      {realShipment.status === 'READY_FOR_PICKUP' && (
                        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50">
                          <p className="text-sm text-emerald-800 dark:text-emerald-400">
                            Your parcel is ready for pickup at <strong>{hubs.find(h => h.id === realShipment.destinationCenterId)?.name || 'the Hub'}</strong>.
                            Please bring your Pickup PIN and valid ID.
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Payment Protection Action Card when Delivered */}
                {isDelivered && (
                  <Card className="p-8 border-primary-200 dark:border-primary-900/50 bg-primary-50 dark:bg-primary-900/10 space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={24} />
                      </div>
                      <div className="space-y-2 flex-1">
                        <h3 className="text-xl font-bold dark:text-white font-display">Shipment Delivered</h3>
                        <p className="text-slate-800 dark:text-slate-300">
                          Please inspect your item before making a decision. Your funds of
                          <strong> ₦{paymentProtectionRecord ? paymentProtectionRecord.amount?.toLocaleString() : "10,000"}</strong> are secure in our Payment Protection vault.
                          {paymentProtectionRecord && (
                            <span className="block mt-1 text-xs text-primary-600 font-bold uppercase tracking-wider">
                              SafePay Status: {paymentProtectionRecord.status.replace(/_/g, ' ')}
                            </span>
                          )}
                        </p>
                        <Link to="/safepay" className="text-xs font-bold text-primary-600 hover:underline inline-flex items-center gap-1">
                          How does SafePay work? <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>

                    {paymentProtectionRecord && !paymentProtectionRecord.metadata?.buyerEvidenceVideo && !['PAYMENT_RELEASED', 'REFUND_APPROVED', 'TRANSACTION_CLOSED'].includes(paymentProtectionRecord.status) && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
                        <Video size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-amber-800 dark:text-amber-400">Unboxing video required</p>
                          <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                            Record an unboxing/inspection video in Omorfi Chat before releasing payment. If you're reporting a problem instead, record it now if you can — it's strong evidence for your dispute.
                          </p>
                          <Button size="sm" variant="outline" className="mt-3 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400" onClick={() => navigate('/customer/chat')}>
                            <Video size={14} className="mr-2" /> Record in Omorfi Chat
                          </Button>
                        </div>
                      </div>
                    )}

                    {paymentProtectionRecord?.metadata?.buyerEvidenceVideo && !['PAYMENT_RELEASED', 'REFUND_APPROVED', 'TRANSACTION_CLOSED'].includes(paymentProtectionRecord.status) && (
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 size={16} /> Unboxing video recorded — you're all set to release payment.
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <Button
                        variant="success"
                        className="h-12 w-full font-bold shadow-lg"
                        onClick={handleReleasePayment}
                        disabled={isReleasing || (paymentProtectionRecord && ['PAYMENT_RELEASED', 'REFUND_APPROVED', 'TRANSACTION_CLOSED'].includes(paymentProtectionRecord.status))}
                      >
                        {isReleasing ? "Releasing..." : <><CheckCircle2 size={18} className="mr-2" /> Release Payment</>}
                      </Button>
                      <Button variant="danger" className="h-12 w-full font-bold shadow-lg" onClick={handleReportIssue}>
                        <AlertCircle size={18} className="mr-2" /> Report a Problem
                      </Button>
                      <Button
                        variant="outline"
                        className="h-12 w-full font-bold bg-white dark:bg-slate-800"
                        onClick={handleRequestExtension}
                        disabled={isExtending || !paymentProtectionRecord?.inspectionExpiresAt || (paymentProtectionRecord && ['PAYMENT_RELEASED', 'REFUND_APPROVED', 'TRANSACTION_CLOSED'].includes(paymentProtectionRecord.status))}
                      >
                        {isExtending ? "Extending..." : <><Clock size={18} className="mr-2" /> Request Extension</>}
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Unified Authoritative Timeline */}
                <ParcelTimeline
                  parcel={realShipment}
                  userRole={user?.role as any || 'CUSTOMER'}
                  onRefresh={() => handleSearchInternal(trackingNumber)}
                />
             </div>

             <div className="space-y-8">
                {/* Map Section */}
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <h3 className="font-bold dark:text-white font-display flex items-center gap-2">
                          <Globe size={18} className="text-primary-600" />
                          Live Tracking Map
                       </h3>
                       {isOutForDelivery && (
                          <Badge variant="success" className="animate-pulse">Live Now</Badge>
                       )}
                    </div>
                    <Card className="h-[400px] border-slate-200 dark:border-slate-800 relative overflow-hidden group p-0">
                       <ShipmentTrackerMap
                          apiKey={GOOGLE_MAPS_API_KEY}
                          origin={LAGOS_HUB}
                          destination={ABUJA_WUSE}
                          isOutForDelivery={isOutForDelivery}
                       />
                    </Card>
                    {!isOutForDelivery && !isDelivered && (
                       <p className="text-[10px] text-slate-900 font-bold uppercase tracking-widest text-center">
                          Map tracking will activate when rider is out for delivery
                       </p>
                    )}
                 </div>

                {/* Latest Activity */}
                <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-4">
                   <h3 className="font-bold dark:text-white font-display">Latest Activity</h3>
                   <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 flex gap-3">
                      <Truck className="text-primary-600 shrink-0" size={20} />
                      <p className="text-xs text-primary-700 dark:text-primary-400 leading-relaxed">
                         Parcel is currently being transported by our logistics partner. Next stop is <strong>Abuja Garki Hub</strong>.
                      </p>
                   </div>
                   <div className="space-y-3 pt-2">
                      {[
                        { label: 'Weight', value: '1.2 kg' },
                        { label: 'Carrier', value: 'OmorfiHub Fleet' },
                        { label: 'Service', value: 'Express' },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                           <span className="text-slate-900">{item.label}</span>
                           <span className="font-bold dark:text-white">{item.value}</span>
                        </div>
                      ))}
                   </div>
                </Card>

                {/* Omorfi Chat Card */}
                <Card className="p-6 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col items-center text-center space-y-4">
                   <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-slate-800 shadow-sm flex items-center justify-center text-primary-600">
                      <MessageSquare size={24} />
                   </div>
                   <div className="space-y-1">
                      <h4 className="font-bold dark:text-white">Transaction Protection Chat</h4>
                      <p className="text-xs text-slate-900">Secure dialogue with the Merchant regarding this shipment.</p>
                   </div>
                   <Button
                      variant="default"
                      className="w-full h-10 rounded-xl bg-primary-600 hover:bg-primary-700"
                      onClick={handleOmorfiChat}
                      disabled={isCreatingChat}
                   >
                      {isCreatingChat ? 'Please wait...' : (conversationExists ? 'Open Omorfi Chat' : 'Start Omorfi Chat')}
                   </Button>
                </Card>

                {/* Support Card */}
                <Card className="p-6 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col items-center text-center space-y-4">
                   <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-primary-600">
                      <Package size={24} />
                   </div>
                   <div className="space-y-1">
                      <h4 className="font-bold dark:text-white">Having Issues?</h4>
                      <p className="text-xs text-slate-900">Contact our support team for help with your tracking.</p>
                   </div>
                   <Button variant="outline" className="w-full h-10 rounded-xl" asChild>
                      <a href="/customer/support">Help Center</a>
                   </Button>
                </Card>
             </div>
          </motion.div>
        )}
      </div>

      <SuccessAnimation
        isOpen={showSuccessAnim}
        style={animationStyle}
        title="Parcel Collected!"
        subtitle="Your parcel has just been handed over successfully. Thank you for using OmorfiHub!"
        onComplete={() => setShowSuccessAnim(false)}
      />
    </CustomerLayout>
  );
};
