import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MerchantLayout } from '@/src/layouts/MerchantLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Parcel } from '@/src/types';
import { communicationService } from '@/src/services/CommunicationService';
import { conversationRepository } from '@/src/services/db/ConversationRepository';
import { userRepository } from '@/src/services/db/UserRepository';
import { useAuth } from '@/src/context/AuthContext';
import {
  Search,
  Package,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import {
  centreEngine,
  parcelEngine
} from '@/src/engines';
import { ShipmentTrackerMap } from '@/src/components/ui/ShipmentTrackerMap';

export const TrackShipmentsPage = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [shipment, setShipment] = useState<Parcel | null>(null);
  const [originHub, setOriginHub] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationHub, setDestinationHub] = useState<{ lat: number; lng: number } | null>(null);
  const [conversationExists, setConversationExists] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (hasResult && shipment) {
      conversationRepository.getByShipment(shipment.shipmentId).then(conv => {
        setConversationExists(!!conv);
      });

      setOriginHub(null);
      setDestinationHub(null);
      centreEngine.getHub(shipment.originCenterId).then(hub => {
        const loc = hub?.location || hub?.gps;
        if (loc) setOriginHub(loc);
      });
      centreEngine.getHub(shipment.destinationCenterId).then(hub => {
        const loc = hub?.location || hub?.gps;
        if (loc) setDestinationHub(loc);
      });
    }
  }, [hasResult, shipment]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    setIsSearching(true);
    setHasResult(false);
    setShipment(null);

    try {
      const result = await parcelEngine.getParcelByTracking(trackingNumber.trim());
      if (result) {
        setShipment(result);
        setHasResult(true);
      } else {
        toast.error('No shipment found with this tracking number');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error searching for shipment');
    } finally {
      setIsSearching(false);
    }
  };

  const handleOmorfiChat = async () => {
    if (!user || !shipment) return;

    if (conversationExists) {
      navigate('/merchant/chat');
      return;
    }

    setIsCreatingChat(true);
    try {
      // recipientInfo only carries name/phone/email at drop-off time -- resolve
      // the customer's actual account so the conversation can reach them.
      let recipientUser = null;
      if (shipment.recipientInfo.email) {
        recipientUser = await userRepository.getByEmail(shipment.recipientInfo.email);
      }
      if (!recipientUser && shipment.recipientInfo.phone) {
        recipientUser = await userRepository.getByPhone(shipment.recipientInfo.phone);
      }

      if (!recipientUser) {
        toast.error("This customer doesn't have a OmorfiHub account yet, so Omorfi Chat isn't available for this shipment.");
        return;
      }

      await communicationService.createShipmentConversation(
        recipientUser.uid || recipientUser.id,
        shipment.recipientInfo.name || 'Customer',
        user.uid,
        user.displayName || 'Merchant',
        shipment.shipmentId || 'unknown',
        shipment.id || 'unknown',
        trackingNumber,
        !!shipment.protectionEnabled
      );
      navigate('/merchant/chat');
    } catch (error) {
      console.error(error);
      toast.error('Failed to initialize Omorfi Chat');
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <MerchantLayout>
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="space-y-2 text-center md:text-left">
          <h1 className="text-3xl font-bold dark:text-white font-display">Track Shipments</h1>
          <p className="text-slate-800">Monitor your outgoing parcels in real-time.</p>
        </div>

        <Card className="p-8 border-slate-200 dark:border-slate-800">
           <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-900" />
                 <Input
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  placeholder="Enter Tracking ID (e.g. WSH-928-101)"
                  className="h-14 pl-12 rounded-2xl"
                 />
              </div>
              <Button type="submit" isLoading={isSearching} className="rounded-2xl h-14 px-10 shadow-lg shadow-primary-500/20 font-bold">Track Now</Button>
           </form>
        </Card>

        {/* Results Placeholder */}
        {hasResult && shipment && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           <div className="lg:col-span-2 space-y-8">
              <div className="relative pl-10 space-y-10">
                 <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100 dark:bg-slate-800" />

                 {(() => {
                   // Ordered real stages this shipment can pass through
                   const stages = [
                     { key: 'CREATED', status: ['DRAFT', 'AWAITING_PAYMENT', 'PAYMENT_CONFIRMED', 'AWAITING_DROP_OFF'], label: 'Shipment Created', desc: 'Merchant created the shipment and it is awaiting drop-off at origin hub.', icon: Package, color: 'bg-slate-800' },
                     { key: 'RECEIVED', status: ['RECEIVED_AT_ORIGIN', 'RECEIVED_AT_CENTER', 'AWAITING_DISPATCH'], label: 'Received at Origin Hub', desc: 'Parcel dropped off and verified at the origin hub.', icon: Package, color: 'bg-slate-800' },
                     { key: 'TRANSIT', status: ['IN_TRANSIT', 'TRANSFERRED_BETWEEN_POINTS'], label: 'In Transit', desc: 'Parcel left origin hub and is on its way to destination.', icon: Truck, color: 'bg-blue-600' },
                     { key: 'ARRIVED', status: ['ARRIVED_AT_DESTINATION', 'READY_FOR_PICKUP'], label: 'Arrived at Hub', desc: 'Parcel arrived at destination hub and is ready for pickup.', icon: MapPin, color: 'bg-primary-600' },
                     { key: 'DELIVERED', status: ['COLLECTED', 'DELIVERED', 'COMPLETED'], label: 'Delivered', desc: 'Parcel picked up / delivered to the customer.', icon: CheckCircle2, color: 'bg-emerald-500' },
                   ];
                   const currentIdx = stages.findIndex(s => s.status.includes(shipment.status));
                   const visibleStages = currentIdx === -1 ? [stages[0]] : stages.slice(0, currentIdx + 1);

                   return visibleStages.map((stage, i) => {
                     const isCurrent = i === visibleStages.length - 1;
                     return (
                       <div key={stage.key} className="relative group">
                          <div className={cn(
                            "absolute -left-[30px] top-0 w-10 h-10 rounded-full border-4 border-white dark:border-slate-950 flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110",
                            stage.color
                          )}>
                             <stage.icon size={18} />
                          </div>
                          <div className="space-y-1">
                             <div className="flex items-center gap-3">
                                <h4 className={cn("font-bold", isCurrent ? "text-primary-600" : "dark:text-white")}>{stage.label}</h4>
                                {i === 0 && (
                                  <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">
                                    {shipment.createdAt ? new Date(shipment.createdAt).toLocaleDateString() : ''}
                                  </span>
                                )}
                                {isCurrent && i !== 0 && (
                                  <Badge variant="info" className="text-[9px]">Current Status</Badge>
                                )}
                             </div>
                             <p className="text-sm text-slate-800 leading-relaxed">{stage.desc}</p>
                          </div>
                       </div>
                     );
                   });
                 })()}
              </div>
           </div>

           <div className="space-y-6">
              <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-6">
                 <h3 className="font-bold dark:text-white font-display">Shipment Details</h3>
                 <div className="space-y-4">
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Tracking ID</p>
                       <p className="font-bold text-sm dark:text-white">{shipment.trackingNumber}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Recipient</p>
                       <p className="font-bold text-sm dark:text-white">{shipment.recipientInfo.name}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Route</p>
                       <p className="text-xs text-slate-800">{shipment.originCenterId} <ArrowRight size={12} className="inline mx-1" /> {shipment.destinationCenterId}</p>
                    </div>
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                       <Badge variant={shipment.protectionStatus === 'RELEASED' ? "success" : "warning"} className="w-full justify-center h-10 rounded-xl text-xs font-bold">
                          {shipment.protectionStatus === 'RELEASED' ? 'SafePay Released' : 'SafePay Protected'}
                       </Badge>
                    </div>
                 </div>
              </Card>

              {/* Omorfi Chat Card */}
              <Card className="p-6 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col items-center text-center space-y-4">
                 <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-slate-800 shadow-sm flex items-center justify-center text-primary-600">
                    <MessageSquare size={24} />
                 </div>
                 <div className="space-y-1">
                    <h4 className="font-bold dark:text-white">SafePay Communication</h4>
                    <p className="text-xs text-slate-800">Secure dialogue with the Customer regarding this shipment.</p>
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

              <Card className="h-64 border-slate-200 dark:border-slate-800 overflow-hidden relative p-0">
                 {originHub && destinationHub ? (
                   <ShipmentTrackerMap
                      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}
                      origin={originHub}
                      destination={destinationHub}
                      isOutForDelivery={shipment.status === 'IN_TRANSIT'}
                   />
                 ) : (
                   <div className="h-full flex items-center justify-center text-xs text-slate-500 text-center px-6">
                     Route map unavailable — location data for one of the hubs on this route is missing.
                   </div>
                 )}
              </Card>
           </div>
        </motion.div>
        )}
      </div>
    </MerchantLayout>
  );
};
