import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  QrCode,
  Package,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  X,
  Truck,
  ShieldCheck,
  Search,
  Boxes,
  Loader2,
  Camera
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { LogisticsLayout } from '@/src/layouts/LogisticsLayout';
import { parcelEngine } from '@/src/engines';
import { Parcel, ParcelStatus } from '@/src/types';
import { useAuth } from '@/src/context/AuthContext';
import { QRScanner } from '@/src/components/ui/QRScanner';

type ScanMode = 'SCAN' | 'RESULT' | 'PROCESSING' | 'SUCCESS';

export const ScanWorkspacePage = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState<ScanMode>('SCAN');
  const [scannedParcel, setScannedParcel] = useState<Parcel | null>(null);
  const [manualId, setManualId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [suggestedAction, setSuggestedAction] = useState<{
    label: string;
    code: 'PICKUP' | 'DROP_OFF' | 'DELIVER' | 'NONE';
    nextStatus: ParcelStatus;
  }>({ label: 'No Action Required', code: 'NONE', nextStatus: 'IN_TRANSIT' });

  const handleScan = async (scannedValue: string) => {
    if (!scannedValue) return;
    setMode('PROCESSING');
    setError(null);

    try {
      // 1. Try tracking number
      let parcel = await parcelEngine.getParcelByTracking(scannedValue);

      // 2. Try verification token (QR Collection)
      if (!parcel) {
        parcel = await parcelEngine.getParcelByToken(scannedValue);
      }

      if (!parcel) {
        throw new Error('Shipment not found. Please check the tracking number or QR code.');
      }

      setScannedParcel(parcel);

      // Logic to determine suggested action
      let action: typeof suggestedAction = { label: 'No Action Required', code: 'NONE', nextStatus: parcel.status };

      if (parcel.status === 'AWAITING_DISPATCH' || parcel.status === 'RECEIVED_AT_ORIGIN') {
        action = {
          label: 'Pickup from Hub',
          code: 'PICKUP',
          nextStatus: 'IN_TRANSIT'
        };
      } else if (parcel.status === 'IN_TRANSIT') {
        action = {
          label: 'Drop-off at Destination',
          code: 'DROP_OFF',
          nextStatus: 'ARRIVED_AT_DESTINATION'
        };
      } else if (parcel.status === 'ARRIVED_AT_DESTINATION') {
         action = {
           label: 'Final Delivery to Point',
           code: 'DROP_OFF',
           nextStatus: 'READY_FOR_PICKUP'
         };
      } else if (parcel.status === 'READY_FOR_PICKUP') {
        action = {
          label: 'Customer Collection',
          code: 'DELIVER',
          nextStatus: 'COLLECTED'
        };
      }

      setSuggestedAction(action);
      setMode('RESULT');
    } catch (err: any) {
      setError(err.message || 'Failed to process scan');
      setMode('SCAN');
    }
  };

  const handleConfirmAction = async () => {
    if (!scannedParcel || !user || suggestedAction.code === 'NONE') return;

    setMode('PROCESSING');
    try {
      await parcelEngine.updateStatus(scannedParcel.id, suggestedAction.nextStatus);
      setMode('SUCCESS');
    } catch (err: any) {
      setError(err.message || 'Failed to update shipment status');
      setMode('RESULT');
    }
  };

  const reset = () => {
    setMode('SCAN');
    setScannedParcel(null);
    setManualId('');
    setError(null);
  };

  return (
    <LogisticsLayout>
      <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
         <div className="inline-flex p-3 rounded-2xl bg-primary-600/10 text-primary-600 mb-4">
            <QrCode size={32} />
         </div>
         <h1 className="text-4xl font-black tracking-tight dark:text-white">Scan Workspace</h1>
         <p className="text-slate-900 font-medium mt-1">Scan QR codes or barcodes to automatically detect required logistics actions.</p>
      </div>

      <Card className="p-1 border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden">
        <div className="p-8 md:p-12">
          <AnimatePresence mode="wait">
            {mode === 'SCAN' && (
              <motion.div
                key="scan"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="flex flex-col items-center py-12"
              >
                {error && (
                  <div className="w-full mb-6 p-4 rounded-2xl bg-red-50 text-red-600 flex items-center gap-3 font-bold text-sm">
                    <AlertTriangle size={18} />
                    {error}
                  </div>
                )}

                <div className="w-full max-w-md space-y-6">
                   {!showScanner ? (
                     <div
                        className="w-full aspect-square border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-4 bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer hover:border-primary-500 transition-colors group"
                        onClick={() => setShowScanner(true)}
                     >
                        <div className="p-4 rounded-full bg-white dark:bg-slate-800 shadow-sm group-hover:scale-110 transition-transform">
                           <Camera size={32} className="text-primary-600" />
                        </div>
                        <div className="text-center">
                           <p className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">Open Camera Scanner</p>
                           <p className="text-xs text-slate-900 font-bold">Fast identification & sync</p>
                        </div>
                     </div>
                   ) : (
                     <div className="space-y-4">
                        <QRScanner
                           onScanSuccess={(text) => {
                             setShowScanner(false);
                             handleScan(text);
                           }}
                           onScanFailure={(err) => {
                             // Silence errors or show subtle hint
                             console.log("Scan error:", err);
                           }}
                        />
                        <Button
                           variant="ghost"
                           onClick={() => setShowScanner(false)}
                           className="w-full text-slate-900 hover:text-red-500 font-bold"
                        >
                           Cancel Scanning
                        </Button>
                     </div>
                   )}

                   <div className="flex items-center gap-4">
                      <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                      <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">or manual entry</span>
                      <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                   </div>

                   <form onSubmit={(e) => { e.preventDefault(); handleScan(manualId); }} className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-800" size={18} />
                      <input
                        type="text"
                        placeholder="Type Tracking Number (e.g. WSB-1234)..."
                        className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary-500/50"
                        value={manualId}
                        onChange={(e) => setManualId(e.target.value)}
                      />
                   </form>
                </div>
              </motion.div>
            )}

            {mode === 'PROCESSING' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-24"
              >
                <Loader2 className="w-20 h-20 text-primary-600 animate-spin mb-8" />
                <h3 className="text-2xl font-black dark:text-white">Processing Scan</h3>
                <p className="text-slate-900 font-bold mt-2">Checking Business Rules Engine...</p>
              </motion.div>
            )}

            {mode === 'RESULT' && scannedParcel && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                   <div>
                      <Badge className="bg-primary-500/10 text-primary-600 px-3 py-1 rounded-full font-black text-[10px] tracking-widest mb-2">
                         System Identified
                      </Badge>
                      <h3 className="text-3xl font-black dark:text-white">{scannedParcel.trackingNumber}</h3>
                   </div>
                   <Button variant="ghost" size="icon" onClick={reset} className="rounded-xl">
                      <X size={24} />
                   </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <Card className="p-6 bg-slate-50 dark:bg-slate-800/50 border-none rounded-[2rem]">
                      <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-4">Parcel Details</p>
                      <div className="space-y-4">
                         <div className="flex justify-between">
                            <span className="text-sm font-medium text-slate-900">Status</span>
                            <Badge variant="outline" className="text-[10px] font-black uppercase">{scannedParcel.status.replace(/_/g, ' ')}</Badge>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-sm font-medium text-slate-900">Recipient</span>
                            <span className="text-sm font-black dark:text-white">{scannedParcel.recipientInfo.name}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-sm font-medium text-slate-900">Weight</span>
                            <span className="text-sm font-black dark:text-white">{scannedParcel.weightKg}kg</span>
                         </div>
                      </div>
                   </Card>

                   <Card className={cn(
                     "p-6 border-none rounded-[2rem]",
                     suggestedAction.code === 'NONE' ? "bg-slate-100 dark:bg-slate-800" : "bg-emerald-500/10 border-emerald-500/20"
                   )}>
                      <div className="flex items-center gap-3 mb-4">
                         <div className={cn(
                           "p-2 rounded-xl text-white shadow-lg",
                           suggestedAction.code === 'NONE' ? "bg-slate-400 shadow-slate-400/20" : "bg-emerald-500 shadow-emerald-500/20"
                         )}>
                            <ShieldCheck size={20} />
                         </div>
                         <h4 className={cn(
                           "text-lg font-black",
                           suggestedAction.code === 'NONE' ? "text-slate-900 dark:text-slate-300" : "text-emerald-950 dark:text-emerald-400"
                         )}>Required Action</h4>
                      </div>
                      <p className={cn(
                        "font-bold text-2xl mb-6",
                        suggestedAction.code === 'NONE' ? "text-slate-900" : "text-emerald-700 dark:text-emerald-500"
                      )}>{suggestedAction.label}</p>

                      {suggestedAction.code !== 'NONE' && (
                        <ul className="space-y-3">
                           <li className="flex items-center gap-2 text-sm font-medium text-emerald-800/70 dark:text-emerald-500/70">
                              <CheckCircle2 size={16} /> Verify point ID matches
                           </li>
                           <li className="flex items-center gap-2 text-sm font-medium text-emerald-800/70 dark:text-emerald-500/70">
                              <CheckCircle2 size={16} /> Confirm physical condition
                           </li>
                        </ul>
                      )}
                   </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                   <Button
                     onClick={handleConfirmAction}
                     disabled={suggestedAction.code === 'NONE'}
                     className="h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg gap-3"
                   >
                      <CheckCircle2 size={24} />
                      Confirm {suggestedAction.label}
                   </Button>
                   <Button variant="outline" onClick={reset} className="h-16 rounded-2xl border-slate-200 text-slate-800 hover:bg-slate-50 font-black text-lg gap-3">
                      <ArrowRight size={24} />
                      Scan Another
                   </Button>
                </div>

                <p className="text-center text-[10px] font-bold text-slate-800 uppercase tracking-widest pt-4">
                   Actions provided by OmorfiHub Rules Engine v2.0
                </p>
              </motion.div>
            )}

            {mode === 'SUCCESS' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-12 text-center"
              >
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-8 animate-bounce">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="text-3xl font-black dark:text-white mb-2">Operation Successful</h3>
                <p className="text-slate-900 font-bold mb-10">The shipment status has been updated and synchronized with the hub.</p>

                <Button onClick={reset} className="h-14 rounded-2xl px-12 bg-primary-600 font-black text-lg">
                  Next Scan
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Info Footnote */}
      <div className="flex items-center justify-center gap-8 text-slate-800 py-4">
         <div className="flex items-center gap-2">
            <ShieldCheck size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Encrypted</span>
         </div>
         <div className="flex items-center gap-2">
            <Boxes size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Live Sync</span>
         </div>
         <div className="flex items-center gap-2">
            <Truck size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Asset Tracking</span>
         </div>
      </div>
      </div>
    </LogisticsLayout>
  );
};
