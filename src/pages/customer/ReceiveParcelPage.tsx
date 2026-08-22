import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Download,
  QrCode,
  Clock,
  MapPin,
  Info,
  CheckCircle2,
  AlertCircle,
  Package,
  Calendar,
  ShieldCheck,
  ChevronRight,
  Loader2,
  Wallet,
  History
} from 'lucide-react';
import QRCodeLib from 'qrcode';
import { CustomerLayout } from '@/src/layouts/CustomerLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Modal } from '@/src/components/ui/Modal';
import { useAuth } from '@/src/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { parcelEngine, centreEngine, userEngine } from '@/src/engines';
import { Parcel } from '@/src/types';
import { cn } from '@/src/lib/utils';

const READY_STATUSES = ['READY_FOR_PICKUP', 'ARRIVED_AT_DESTINATION'];

export const ReceiveParcelPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'collected'>('pending');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [merchantNames, setMerchantNames] = useState<Record<string, string>>({});
  const [hubNames, setHubNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchIncoming = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const userPhone = user.phoneNumber || user.phone;
        if (userPhone) {
          const data = await parcelEngine.getParcelsByRecipient(userPhone);
          setParcels(data);
          const firstPending = data.find(p => p.status !== 'COLLECTED');
          if (firstPending) setSelectedParcel(firstPending);

          // Resolve readable names instead of showing raw internal IDs
          const senderIds = Array.from(new Set(data.map(p => p.senderId).filter(Boolean)));
          const hubIds = Array.from(new Set(data.map(p => p.destinationCenterId).filter(Boolean)));

          const [senderResults, hubResults] = await Promise.all([
            Promise.all(senderIds.map(id => userEngine.getUser(id).catch(() => null))),
            Promise.all(hubIds.map(id => centreEngine.getHub(id).catch(() => null)))
          ]);

          const nameMap: Record<string, string> = {};
          senderResults.forEach((u, i) => {
            if (u) nameMap[senderIds[i]] = u.displayName || u.email || senderIds[i];
          });
          setMerchantNames(nameMap);

          const hubMap: Record<string, string> = {};
          hubResults.forEach((h, i) => {
            if (h) hubMap[hubIds[i]] = h.name || hubIds[i];
          });
          setHubNames(hubMap);
        }
      } catch (err) {
        console.error('Error fetching incoming parcels:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchIncoming();
  }, [user]);

  // Generate a real, scannable QR code for the selected parcel's pickup credentials
  useEffect(() => {
    if (!selectedParcel) {
      setQrDataUrl(null);
      return;
    }
    const payload = JSON.stringify({
      trackingNumber: selectedParcel.trackingNumber,
      parcelId: selectedParcel.id,
      pickupPin: selectedParcel.pickupPin || ''
    });
    QRCodeLib.toDataURL(payload, { width: 300, margin: 1 })
      .then(setQrDataUrl)
      .catch(err => {
        console.error('Failed to generate QR code:', err);
        setQrDataUrl(null);
      });
  }, [selectedParcel]);

  const pendingParcels = parcels.filter(p => p.status !== 'COLLECTED');
  const collectedParcels = parcels.filter(p => p.status === 'COLLECTED');
  const visibleParcels = activeTab === 'pending' ? pendingParcels : collectedParcels;

  const isPaid = (p: Parcel) => p.status !== 'AWAITING_PAYMENT' && p.status !== 'DRAFT';

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="animate-spin text-primary-600" size={40} />
          <p className="text-slate-900 font-medium">Fetching incoming parcels...</p>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold dark:text-white font-display">Receive Parcel</h1>
            <p className="text-slate-600 dark:text-slate-300">Manage parcels being sent to you.</p>
          </div>
          <Button variant="outline" className="rounded-xl h-12 px-6" onClick={() => setShowInstructions(true)}>
            <Info size={18} className="mr-2" /> Pickup Instructions
          </Button>
        </div>

        <Modal isOpen={showInstructions} onClose={() => setShowInstructions(false)} title="How to Pick Up Your Parcel">
          <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
            <p>When your parcel arrives at your chosen hub, you'll get a notification along with a secure one-time PIN.</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Go to the hub location shown for your parcel.</li>
              <li>Bring a valid form of ID.</li>
              <li>Give the hub staff your tracking number and PIN, or let them scan your QR code.</li>
              <li>Pay any outstanding balance if the parcel isn't already paid for.</li>
              <li>Inspect your parcel before confirming you've received it.</li>
            </ol>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
              Never share your PIN with anyone except hub staff at the moment of pickup.
            </p>
          </div>
        </Modal>

        {/* Pending / Collected tabs */}
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit">
           <button
             onClick={() => { setActiveTab('pending'); if (pendingParcels[0]) setSelectedParcel(pendingParcels[0]); }}
             className={cn("px-6 py-2 rounded-xl font-bold text-xs transition-all", activeTab === 'pending' ? "bg-white dark:bg-slate-800 text-primary-600 shadow-sm" : "text-slate-800")}
           >
             Pending ({pendingParcels.length})
           </button>
           <button
             onClick={() => { setActiveTab('collected'); setSelectedParcel(null); }}
             className={cn("px-6 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5", activeTab === 'collected' ? "bg-white dark:bg-slate-800 text-primary-600 shadow-sm" : "text-slate-800")}
           >
             <History size={12} /> Collected ({collectedParcels.length})
           </button>
        </div>

        {visibleParcels.length === 0 ? (
          <Card className="p-20 text-center space-y-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-600 dark:text-slate-300">
              <Package size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold dark:text-white">
                {activeTab === 'pending' ? 'No incoming parcels' : 'No collected parcels yet'}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                {activeTab === 'pending'
                  ? 'Parcels sent to your registered phone number will appear here automatically.'
                  : 'Parcels you\'ve picked up will show here for your records.'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h2 className="text-xl font-bold dark:text-white font-display flex items-center gap-2">
                <Package size={20} className="text-primary-600" />
                {activeTab === 'pending' ? `Incoming Parcels (${visibleParcels.length})` : `Collection History (${visibleParcels.length})`}
              </h2>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
                {visibleParcels.map((parcel) => (
                  <Card
                    key={parcel.id}
                    onClick={() => setSelectedParcel(parcel)}
                    className={cn(
                      "p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all cursor-pointer hover:shadow-lg",
                      selectedParcel?.id === parcel.id ? "ring-2 ring-primary-500 bg-primary-500/5 dark:bg-primary-950/20" : ""
                    )}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                          <Download size={24} />
                        </div>
                        <div>
                          <p className="font-mono font-bold dark:text-white">{parcel.trackingNumber}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">From: {merchantNames[parcel.senderId] || 'Merchant'}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <Badge variant={READY_STATUSES.includes(parcel.status) ? 'success' : 'info'}>
                          {parcel.status.replace(/_/g, ' ')}
                        </Badge>
                        {parcel.status !== 'COLLECTED' && (
                          <Badge variant={isPaid(parcel) ? 'success' : 'warning'} className="text-[10px]">
                            {isPaid(parcel) ? 'Paid' : 'Unpaid'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                        <MapPin size={18} className="text-primary-600 shrink-0" />
                        <div className="text-sm">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {parcel.status === 'COLLECTED' ? 'Collected From' : 'Destination Hub'}
                          </p>
                          <p>{hubNames[parcel.destinationCenterId] || parcel.destinationCenterId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                        <Calendar size={18} className="text-primary-600 shrink-0" />
                        <div className="text-sm">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {parcel.status === 'COLLECTED' ? 'Collected On' : 'Created At'}
                          </p>
                          <p>{new Date(parcel.status === 'COLLECTED' ? parcel.updatedAt : parcel.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-10">
              {/* Active Pickup Visual */}
              {activeTab === 'pending' && (
                <AnimatePresence mode="wait">
                  {selectedParcel ? (
                    <motion.div
                      key={selectedParcel.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <Card className="p-8 bg-slate-900 text-white border-none relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-full bg-primary-600/20 blur-3xl" />
                        <div className="space-y-8 relative z-10">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 backdrop-blur-md flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                              <QrCode size={32} />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold font-display">Scan to Collect</h3>
                              <p className="text-slate-300 text-sm">Present this QR code at the Hub center.</p>
                            </div>
                          </div>

                          <div className="bg-white p-6 rounded-3xl w-48 h-48 mx-auto shadow-2xl flex items-center justify-center overflow-hidden">
                             {qrDataUrl ? (
                               <img src={qrDataUrl} alt="Pickup QR Code" className="w-full h-full object-contain" />
                             ) : (
                               <Loader2 className="animate-spin text-slate-400" size={32} />
                             )}
                          </div>

                          <div className="text-center space-y-4">
                             <div className="space-y-1">
                                <p className="text-xs text-slate-400 uppercase tracking-widest">Tracking Number</p>
                                <p className="font-mono font-bold text-lg">{selectedParcel.trackingNumber}</p>
                             </div>

                             {READY_STATUSES.includes(selectedParcel.status) && selectedParcel.pickupPin && (
                               <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                  <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Backup Pickup PIN</p>
                                  <p className="text-3xl font-black text-emerald-400 font-mono tracking-[0.2em]">{selectedParcel.pickupPin}</p>
                               </div>
                             )}

                             <div className="p-4 rounded-2xl border" style={{
                               borderColor: isPaid(selectedParcel) ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)',
                               backgroundColor: isPaid(selectedParcel) ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)'
                             }}>
                                <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-2">
                                      <Wallet size={16} className={isPaid(selectedParcel) ? "text-emerald-400" : "text-amber-400"} />
                                      <span className="text-xs font-bold uppercase tracking-widest">
                                        {isPaid(selectedParcel) ? 'Paid' : 'Payment Due'}
                                      </span>
                                   </div>
                                   {!isPaid(selectedParcel) && (
                                     <Button size="sm" onClick={() => navigate(`/customer/payment/${selectedParcel.id}`)} className="h-8 text-xs rounded-lg">
                                        Pay Now
                                     </Button>
                                   )}
                                </div>
                             </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ) : (
                    <Card className="p-12 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center gap-4">
                      <QrCode size={48} className="text-slate-400" />
                      <p className="text-slate-600 dark:text-slate-300 font-medium">Select a parcel to view pickup credentials.</p>
                    </Card>
                  )}
                </AnimatePresence>
              )}

              {/* Instructions */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold dark:text-white font-display">How to Collect</h2>
                <div className="space-y-4">
                  {[
                    { icon: ShieldCheck, title: 'Verify Identity', desc: 'Bring a valid government-issued ID card.' },
                    { icon: QrCode, title: 'Show Code', desc: 'Present your pickup code or QR code to the hub manager.' },
                    { icon: Wallet, title: 'Settle Payment', desc: 'Pay any outstanding balance before collection, in-app or on-site.' },
                    { icon: CheckCircle2, title: 'Confirm Collection', desc: 'Verify the parcel condition before final confirmation.' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="shrink-0 w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                        <item.icon size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold dark:text-white text-sm">{item.title}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
};
