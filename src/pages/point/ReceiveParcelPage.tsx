import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PackagePlus,
  Search,
  CheckCircle2,
  Camera,
  MapPin,
  Boxes,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Info,
  ShieldCheck,
  FileText,
  Loader2
} from 'lucide-react';
import { PointLayout } from '@/src/layouts/PointLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { apiFetch } from '@/src/lib/apiClient';
import { parcelEngine as parcelServiceEngine } from '@/src/services/ParcelEngine';
import { parcelEngine, centreEngine, shiftEngine } from '@/src/engines';
import { Parcel, HubCenter } from '@/src/types';
import { QRScanner } from '@/src/components/ui/QRScanner';
import { receiptService } from '@/src/services/ReceiptService';
import { NativeMediaHandler } from '@/src/components/ui/NativeMediaHandler';
import { storageEngine } from '@/src/engines/StorageEngine';

export const ReceiveParcelPage = () => {
  const { user, fbUser } = useAuth();
  const [step, setStep] = useState(1);
  const [trackingId, setTrackingId] = useState('');
  const [shipment, setShipment] = useState<Parcel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userHub, setUserHub] = useState<HubCenter | null>(null);
  const [shelf, setShelf] = useState('Shelf A1 (Standard)');
  const [showScanner, setShowScanner] = useState(false);
  const [parcelPhoto, setParcelPhoto] = useState<string | null>(null);
  const [generatedReceipt, setGeneratedReceipt] = useState<any>(null);
  const [checklist, setChecklist] = useState({
    packaging: true,
    damage: true,
    labels: true,
    seal: true
  });
  const [damageNotes, setDamageNotes] = useState('');
  const [intakeError, setIntakeError] = useState<string | null>(null);

  const hasConditionIssue = !checklist.packaging || !checklist.damage || !checklist.labels || !checklist.seal;

  useEffect(() => {
    const fetchHub = async () => {
      if (!user) return;
      try {
        const id = (user as any).hubId;
        if (id) {
          const hub = await centreEngine.getHub(id);
          if (hub) {
            setUserHub(hub);
            return;
          }
        }

        const hubs = await centreEngine.getHubsByOwner(user.uid);
        if (hubs.length > 0) {
          setUserHub(hubs[0]);
        }
      } catch (err) {
        console.error('Failed to fetch hub:', err);
      }
    };
    fetchHub();
  }, [user]);

  const verifyShipment = async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await parcelEngine.getParcelByTracking(trackingId);
      if (!p) {
        throw new Error('Shipment not found. Please check the tracking number.');
      }
      setShipment(p);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleIntake = async () => {
    if (!shipment || !user || !userHub) return;

    setIntakeError(null);
    if (!parcelPhoto) {
      setIntakeError('A photo of the parcel is mandatory before intake can be completed.');
      return;
    }
    if (hasConditionIssue && !damageNotes.trim()) {
      setIntakeError('Please describe the issue found (damage, tampering, missing label, etc.) before continuing.');
      return;
    }

    setLoading(true);
    try {
      // Determine next status
      const isOrigin = shipment.originCenterId === userHub.id;
      const nextStatus = isOrigin ? 'RECEIVED_AT_ORIGIN' : 'ARRIVED_AT_DESTINATION';

      let photoUrl = '';
      if (parcelPhoto) {
        photoUrl = await storageEngine.uploadFile(`parcels/${shipment.id}/intake_condition.jpg`, parcelPhoto);
      }

      await parcelEngine.parcels.updateStatus(
        shipment.id,
        nextStatus,
        user.uid,
        userHub.id,
        `Parcel intake successful. Shelf: ${shelf}. Condition: Packaging=${checklist.packaging}, Damage=${!checklist.damage}. Photo: ${photoUrl}${hasConditionIssue ? `. ISSUE NOTED: ${damageNotes}` : ''}`,
        fbUser ? await fbUser.getIdToken() : undefined
      );

      // If a real condition issue was flagged, also record it as an
      // exception on the parcel itself so it surfaces in exception
      // reporting rather than only living inside a free-text status note.
      if (hasConditionIssue) {
        try {
          await parcelEngine.updateParcel(shipment.id, {
            exceptionReason: 'INTAKE_CONDITION_ISSUE',
            exceptionDetails: damageNotes,
            reportedBy: user.uid,
            condition: 'DAMAGED'
          } as any);
        } catch (exErr) {
          console.error('Failed to flag intake condition exception:', exErr);
        }
      }

      // Generate and save digital certified receipt
      try {
        const receipt = await receiptService.generateAndSaveReceipt({
          type: 'INTAKE',
          parcel: shipment,
          hub: userHub,
          staffId: user.uid,
          staffName: user.displayName || 'Authorized Staff',
          shelfLocation: shelf
        });
        setGeneratedReceipt(receipt);

        // Backup write to Express full-stack API database
        await apiFetch(fbUser, '/api/receipts/save', {
          method: 'POST',
          body: receipt
        });
      } catch (receiptErr) {
        console.error('Failed to generate/save digital receipt:', receiptErr);
      }

      // Increment active shift metric if staff is currently on shift
      try {
        const activeShift = await shiftEngine.getActiveShiftForStaff(user.uid);
        if (activeShift) {
          await shiftEngine.incrementShiftMetrics(activeShift.id, 'parcelsReceived');
        }
      } catch (shiftErr) {
        console.error('Failed to update shift metric:', shiftErr);
      }

      setStep(4);
    } catch (err: any) {
      console.error('Intake failed:', err);
      toast.error('Failed to process parcel intake: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <PointLayout>
      <div className="max-w-4xl mx-auto space-y-10 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold dark:text-white font-display">Receive Parcel</h1>
            <p className="text-slate-900">Intake a new shipment from a merchant or courier.</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl">
             {[1, 2, 3, 4].map((s) => (
               <div
                 key={s}
                 className={cn(
                   "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all",
                   step === s ? "bg-primary-600 text-white shadow-lg" :
                   step > s ? "bg-emerald-500 text-white" : "text-slate-800"
                 )}
               >
                  {step > s ? <CheckCircle2 size={16} /> : s}
               </div>
             ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
           {step === 1 && (
             <motion.div
               key="step1"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               className="space-y-6"
             >
                <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-8">
                   <div className="space-y-4">
                      <h3 className="text-xl font-bold dark:text-white font-display">Scan or Enter Shipment Reference</h3>
                      <p className="text-sm text-slate-900">Every parcel must have a pre-generated OmorfiHub tracking ID.</p>
                   </div>

                   <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-800" />
                         <Input
                           placeholder="Enter Tracking ID (e.g. WSH-928-101)"
                           className="h-14 pl-12 rounded-2xl text-lg font-mono"
                           value={trackingId}
                           onChange={(e) => setTrackingId(e.target.value)}
                         />
                      </div>
                      <Button
                        onClick={verifyShipment}
                        disabled={!trackingId || loading}
                        className="h-14 px-10 rounded-2xl shadow-lg shadow-primary-500/20"
                      >
                         {loading ? <Loader2 size={16} className="animate-spin" /> : 'Verify Shipment'}
                      </Button>
                   </div>

                    {error && (
                     <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2">
                        <AlertCircle size={18} /> {error}
                     </div>
                   )}

                   {!showScanner ? (
                     <div
                        onClick={() => setShowScanner(true)}
                        className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center justify-center border-dashed group cursor-pointer hover:border-primary-500 transition-colors"
                     >
                        <div className="text-center space-y-2">
                           <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-800 mx-auto group-hover:text-primary-600 transition-colors">
                              <Camera size={24} />
                           </div>
                           <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Open Camera to Scan QR or Barcode</p>
                        </div>
                     </div>
                   ) : (
                     <div className="space-y-4">
                        <QRScanner
                           onScanSuccess={(text) => {
                             setShowScanner(false);
                             setTrackingId(text);
                             // Auto trigger verification if it looks like a tracking ID
                             // But verifyShipment uses state, so let's just set it and maybe auto-call
                             // Actually, let's just call it directly with the scanned text
                             const handleAutoVerify = async (val: string) => {
                               setLoading(true);
                               setError(null);
                               try {
                                 let p = await parcelEngine.getParcelByTracking(val);
                                 if (!p) {
                                   p = await parcelEngine.getParcelByToken(val);
                                 }
                                 if (!p) throw new Error('Shipment not found.');
                                 setShipment(p);
                                 setStep(2);
                               } catch (err: any) {
                                 setError(err.message);
                               } finally {
                                 setLoading(false);
                               }
                             };
                             handleAutoVerify(text);
                           }}
                        />
                        <Button variant="ghost" onClick={() => setShowScanner(false)} className="w-full text-slate-900 font-bold">
                           Cancel Scanning
                        </Button>
                     </div>
                   )}
                </Card>
             </motion.div>
           )}

           {step === 2 && shipment && (
             <motion.div
               key="step2"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               className="space-y-6"
             >
                <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-8">
                   <div className="flex items-start justify-between">
                      <div className="space-y-1">
                         <Badge variant="info" className="h-6">{shipment.trackingNumber}</Badge>
                         <h3 className="text-xl font-bold dark:text-white font-display">Parcel Details Found</h3>
                      </div>
                      <Badge variant="success" className="h-8 px-3">{shipment.status.replace('_', ' ')}</Badge>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                         <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Sender ID</p>
                         <p className="font-bold dark:text-white mt-1">{shipment.senderId}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                         <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Destination Center</p>
                         <p className="font-bold dark:text-white mt-1">{shipment.destinationCenterId}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                         <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Category</p>
                         <p className="font-bold dark:text-white mt-1">{shipment.category || 'General'}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                         <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Weight</p>
                         <p className="font-bold text-primary-600 mt-1">{shipment.weightKg} kg</p>
                      </div>
                   </div>

                   <div className="flex items-center gap-4 pt-4">
                      <Button variant="outline" onClick={prevStep} className="h-12 px-8 rounded-xl">Back</Button>
                      <Button onClick={nextStep} className="flex-1 h-12 rounded-xl">Confirm & Continue</Button>
                   </div>
                </Card>
             </motion.div>
           )}

           {step === 3 && shipment && (
             <motion.div
               key="step3"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               className="space-y-6"
             >
                <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-8">
                   <div className="space-y-4">
                      <h3 className="text-xl font-bold dark:text-white font-display">Condition & Storage</h3>
                      <p className="text-sm text-slate-900">Verify the physical condition and assign a storage location.</p>
                   </div>

                   <div className="space-y-6">
                      <div className="space-y-4">
                         <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Physical Condition Checklist</p>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-primary-500 transition-colors">
                               <input
                                 type="checkbox"
                                 className="w-5 h-5 rounded-lg accent-primary-600"
                                 checked={checklist.packaging}
                                 onChange={e => { setChecklist({...checklist, packaging: e.target.checked}); setIntakeError(null); }}
                               />
                               <span className="text-sm font-bold dark:text-white">Packaging Intact</span>
                            </label>
                            <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-primary-500 transition-colors">
                               <input
                                 type="checkbox"
                                 className="w-5 h-5 rounded-lg accent-primary-600"
                                 checked={checklist.damage}
                                 onChange={e => { setChecklist({...checklist, damage: e.target.checked}); setIntakeError(null); }}
                               />
                               <span className="text-sm font-bold dark:text-white">No Visible Damage</span>
                            </label>
                            {/* ... more checks as needed ... */}
                         </div>
                      </div>

                      {hasConditionIssue && (
                        <div className="space-y-2 p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50">
                           <label className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-widest flex items-center gap-2">
                             <AlertCircle size={14} /> Describe the issue (required)
                           </label>
                           <textarea
                             value={damageNotes}
                             onChange={e => { setDamageNotes(e.target.value); setIntakeError(null); }}
                             placeholder="e.g. Box corner crushed, tape torn on one side, tracking label missing..."
                             className="w-full h-24 p-3 rounded-xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 text-sm dark:text-white resize-none"
                           />
                           <p className="text-[11px] text-red-600 dark:text-red-400">This will be logged as an exception and flagged for review. Take a clear photo of the issue below.</p>
                        </div>
                      )}

                      <div className="space-y-4">
                         <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Intake Photo Evidence (Mandatory)</p>
                         <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50 dark:bg-slate-900/50 space-y-4">
                           {parcelPhoto ? (
                             <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-inner bg-black">
                               <img src={parcelPhoto} className="w-full h-full object-contain" alt="Parcel condition" />
                               <button
                                 onClick={() => setParcelPhoto(null)}
                                 className="absolute top-4 right-4 w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform"
                                >
                                 ✕
                               </button>
                             </div>
                           ) : (
                             <div className="text-center space-y-4 w-full">
                               <NativeMediaHandler
                                 onMediaCaptured={(file) => {
                                   const reader = new FileReader();
                                   reader.onload = (e) => setParcelPhoto(e.target?.result as string);
                                   reader.readAsDataURL(file);
                                 }}
                                 label="Capture Parcel Condition"
                                 captureMode="environment"
                                 className="max-w-xs mx-auto"
                               />
                               <p className="text-[10px] text-slate-800">High-resolution photo of the parcel as received.</p>
                             </div>
                           )}
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Storage Shelf</label>
                            <select
                              value={shelf}
                              onChange={e => setShelf(e.target.value)}
                              className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold dark:text-white"
                            >
                               <option>Shelf A1 (Standard)</option>
                               <option>Shelf A2 (Standard)</option>
                               <option>Shelf B1 (Fragile)</option>
                               <option>Safe 1 (Valuable)</option>
                            </select>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-3 pt-4">
                      {intakeError && (
                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                           <AlertCircle size={16} className="shrink-0" /> {intakeError}
                        </div>
                      )}
                      <div className="flex items-center gap-4">
                         <Button variant="outline" onClick={prevStep} className="h-12 px-8 rounded-xl" disabled={loading}>Back</Button>
                         <Button
                           onClick={handleIntake}
                           className="flex-1 h-12 rounded-xl"
                           disabled={loading}
                         >
                            {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
                            Generate Intake Receipt
                         </Button>
                      </div>
                   </div>
                </Card>
             </motion.div>
           )}

           {step === 4 && shipment && (
             <motion.div
               key="step4"
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="space-y-8 text-center py-10"
             >
                <div className="w-24 h-24 rounded-3xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center mx-auto mb-6">
                   <ShieldCheck size={48} />
                </div>
                <div className="space-y-2">
                   <h2 className="text-4xl font-black dark:text-white font-display">Parcel Intake Successful</h2>
                   <p className="text-slate-900 max-w-sm mx-auto">Shipment **{shipment.trackingNumber}** has been added to inventory and the merchant has been notified.</p>
                </div>

                <div className="max-w-md mx-auto p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left space-y-4">
                   <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                      <span className="text-xs font-bold text-slate-800 uppercase">Intake ID</span>
                      <span className="font-mono text-sm dark:text-white font-bold">REC-{shipment.id.substr(-6)}</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">Location</span>
                      <span className="text-sm dark:text-white font-bold">{shelf}</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">Processed By</span>
                      <span className="text-sm dark:text-white font-bold">{user?.displayName}</span>
                   </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                   <Button
                     variant="outline"
                     className="w-full sm:w-auto h-12 px-10 rounded-xl flex items-center gap-2"
                     onClick={() => generatedReceipt && receiptService.downloadPDF(generatedReceipt)}
                     disabled={!generatedReceipt}
                   >
                      <FileText size={18} /> Download Receipt PDF
                   </Button>
                   <Button onClick={() => { setStep(1); setTrackingId(''); setShipment(null); }} className="w-full sm:w-auto h-12 px-10 rounded-xl shadow-lg shadow-primary-500/20">Receive Another</Button>
                </div>
             </motion.div>
           )}
        </AnimatePresence>

        {/* Helpful Info Footer */}
        {step < 4 && (
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800">
             <AlertCircle className="text-amber-600 shrink-0" size={20} />
             <p className="text-xs text-amber-700 leading-relaxed font-medium">
                Ensure all labels are attached securely. If the parcel appears tampered with, mark as 'Damaged' and contact support immediately before accepting.
             </p>
          </div>
        )}
      </div>
    </PointLayout>
  );
};
