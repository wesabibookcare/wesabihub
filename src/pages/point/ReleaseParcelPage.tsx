import { toast } from 'sonner';
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { PointLayout } from '@/src/layouts/PointLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { Parcel, TrackingEvent, CustodyRecord } from '@/src/types';
import { SuccessAnimation, SuccessAnimationStyle } from '@/src/components/ui/SuccessAnimation';
import { receiptService } from '@/src/services/ReceiptService';
import { userRepository } from '@/src/services/db/UserRepository';
import { NativeMediaHandler } from '@/src/components/ui/NativeMediaHandler';
import { QRScanner } from '@/src/components/ui/QRScanner';
import { shipmentRepository } from '@/src/services/db/ShipmentRepository';
import {
  PackageCheck,
  Search,
  User,
  ShieldCheck,
  QrCode,
  Key,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  XCircle,
  Smartphone,
  Check,
  Camera,
  X,
  FileText,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  MapPin,
  Signature as SigIcon,
  ShieldAlert,
  Loader2,
  Info,
  Activity
} from 'lucide-react';
import {
  parcelEngine,
  auditEngine,
  notificationEngine,
  configurationEngine,
  centreEngine,
  shiftEngine
} from '@/src/engines';


export const ReleaseParcelPage = () => {
  const { user, fbUser } = useAuth();
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams] = useSearchParams();

  // Pre-fill from a deep link (e.g. navigated here from Search with a
  // tracking number already known) instead of making staff re-type it.
  useEffect(() => {
    const trackingParam = searchParams.get('tracking');
    if (trackingParam) setSearchQuery(trackingParam);
  }, [searchParams]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [justConfirmedPayment, setJustConfirmedPayment] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState<any>(null);

  // Live-watch the selected parcel so staff see payment status flip the
  // instant the customer pays -- no manual re-search needed. This is what
  // powers the gray -> green confirm button transition.
  useEffect(() => {
    if (!selectedParcel?.id) return;
    const wasUnpaid = selectedParcel.status === 'AWAITING_PAYMENT'
      || (selectedParcel.SafePayStatus && (selectedParcel.SafePayStatus as any) !== 'HELD' && (selectedParcel.SafePayStatus as any) !== 'RELEASED');

    const unsubscribe = shipmentRepository.subscribe(selectedParcel.id, (updated) => {
      if (!updated) return;
      setSelectedParcel(updated);
      const nowPaid = updated.status !== 'AWAITING_PAYMENT'
        && (!updated.SafePayStatus || (updated.SafePayStatus as any) === 'HELD' || (updated.SafePayStatus as any) === 'RELEASED');
      if (wasUnpaid && nowPaid) {
        setJustConfirmedPayment(true);
        toast.success('Payment confirmed! You can now release this parcel.');
        setTimeout(() => setJustConfirmedPayment(false), 4000);
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedParcel?.id]);

  // Settings & Expiries
  const [sysSettings, setSysSettings] = useState<any>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // Verification states
  const [qrScanned, setQrScanned] = useState(false);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [qrError, setQrError] = useState('');
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinVerified, setPinVerified] = useState(false);

  // Collection Details
  const [collectedByName, setCollectedByName] = useState('');
  const [collectedByPhone, setCollectedByPhone] = useState('');
  const [collectedRelation, setCollectedRelation] = useState<'SELF' | 'OTHER'>('SELF');

  // Scanner Simulator State
  const [showScannerSim, setShowScannerSim] = useState(false);
  const [simScanResult, setSimScanResult] = useState('');

  // Signature Canvas State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [signatureError, setSignatureError] = useState('');

  // Photo uploads
  const [photoParcel, setPhotoParcel] = useState<string>('');
  const [photoLabel, setPhotoLabel] = useState<string>('');
  const [photoCondition, setPhotoCondition] = useState<string>('');
  const [photoError, setPhotoError] = useState('');

  // Offline status & Queued tasks
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  // Staff Metadata (Simulated details or user record)
  const staffId = user?.uid;
  const staffName = user?.displayName;
  const staffRole = user?.role;
  const centerId = selectedParcel?.destinationCenterId;

  // Custody Timeline
  const [timeline, setTimeline] = useState<TrackingEvent[]>([]);

  // Listen to connectivity changes
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Fetch system settings
  useEffect(() => {
    configurationEngine.getGlobalSettings().then(data => {
      if (data && (data as any).parcelVerification) {
        setSysSettings((data as any).parcelVerification);
      } else {
        // Fallback standard security policy
        setSysSettings({
          pickupPinExpiryMinutes: 1440,
          maxVerificationAttempts: 3,
          qrValidityPeriodMinutes: 60,
          signatureRequired: true,
          mandatoryParcelPhotos: true,
          gpsRequired: false,
          chainOfCustodyEnabled: true
        });
      }
    });
  }, []);

  // Initialize canvas listeners if step is signature step
  useEffect(() => {
    if (step === 3 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
      }
    }
  }, [step]);

  // Handle parcel search
  const handleFindParcel = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSelectedParcel(null);
    setQrScanned(false);
    setPinVerified(false);
    setEnteredPin('');
    setFailedAttempts(0);
    setIsLocked(false);
    setQrError('');
    setPinError('');

    try {
      // Find parcel either by tracking number or lookup directly
      let parcel = await parcelEngine.getParcelByTracking(searchQuery.trim());
      if (!parcel) {
        // Try getting by ID
        parcel = await parcelEngine.getParcel(searchQuery.trim());
      }

      if (parcel) {
        // Backwards compatibility generator (if existing parcel doesn't have verification properties)
        if (!parcel.pickupPin || !parcel.verificationToken) {
          const pin = Math.floor(100000 + Math.random() * 900000).toString();
          const token = crypto.randomUUID();
          const expiryMinutes = sysSettings?.pickupPinExpiryMinutes || 1440;
          const qrExpiryMinutes = sysSettings?.qrValidityPeriodMinutes || 60;

          const updatedFields: Partial<Parcel> = {
            pickupPin: pin,
            pickupPinExpiry: new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString(),
            pickupPinAttempts: 0,
            pickupPinVerified: false,
            verificationToken: token,
            qrExpiry: new Date(Date.now() + qrExpiryMinutes * 60 * 1000).toISOString()
          };

          await parcelEngine.updateParcel(parcel.id, updatedFields);
          parcel = { ...parcel, ...updatedFields };
        }

        setSelectedParcel(parcel);
        setCollectedByName(parcel.recipientInfo.name);
        setCollectedByPhone(parcel.recipientInfo.phone || '');
        setFailedAttempts(parcel.pickupPinAttempts || 0);

        // Check lock status
        const maxAttempts = sysSettings?.maxVerificationAttempts || 3;
        if ((parcel.pickupPinAttempts || 0) >= maxAttempts) {
          setIsLocked(true);
        }

        // Fetch parcel timeline
        const events = await parcelEngine.tracking.getTrackingHistory(parcel.id);
        setTimeline(events);

        setStep(2);
      } else {
        toast.error('Parcel not found. Please verify the Tracking ID.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error searching parcel.');
    } finally {
      setIsSearching(false);
    }
  };

  // Generate / Regenerate Pickup PIN & QR
  const handleRegenerateCredentials = async () => {
    if (!selectedParcel) return;
    const confirmRegen = window.confirm('Are you sure you want to regenerate the Pickup PIN and QR Code? This will invalidate previous credentials.');
    if (!confirmRegen) return;

    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomUUID();
    const expiryMinutes = sysSettings?.pickupPinExpiryMinutes || 1440;
    const qrExpiryMinutes = sysSettings?.qrValidityPeriodMinutes || 60;

    const updatedFields: Partial<Parcel> = {
      pickupPin: pin,
      pickupPinExpiry: new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString(),
      pickupPinAttempts: 0,
      pickupPinVerified: false,
      verificationToken: token,
      qrExpiry: new Date(Date.now() + qrExpiryMinutes * 60 * 1000).toISOString()
    };

    await parcelEngine.updateParcel(selectedParcel.id, updatedFields);
    setSelectedParcel({ ...selectedParcel, ...updatedFields });
    setFailedAttempts(0);
    setIsLocked(false);
    setQrScanned(false);
    setPinVerified(false);
    setQrError('');
    setPinError('');

    // Log audit
    await auditEngine.logEvent({
      userId: staffId,
      action: 'REGENERATE_PICKUP_CREDENTIALS',
      details: { parcelId: selectedParcel.id },
      result: 'SUCCESS',
      targetId: selectedParcel.id
    });
    toast.success(`New Pickup PIN generated: ${pin} (Expired in ${expiryMinutes} minutes)`);
  };

  // Step 1: QR scan validation
  const handleQrScanResult = (scannedToken: string) => {
    setQrError('');
    if (!selectedParcel) return;

    if (scannedToken !== selectedParcel.verificationToken) {
      setQrError('Invalid QR Code. Verification token mismatch.');
      logFailedAttempt('QR_TOKEN_MISMATCH', 'Scanned invalid QR Code signature.');
      return;
    }

    // Check QR expiry
    if (selectedParcel.qrExpiry) {
      const expiryDate = new Date(selectedParcel.qrExpiry);
      if (Date.now() > expiryDate.getTime()) {
        setQrError('QR Code has expired. Please regenerate a new QR Code.');
        logFailedAttempt('QR_EXPIRED', 'QR token has expired.');
        return;
      }
    }

    setQrScanned(true);
    setShowScannerSim(false);

    // Audit Log
    auditEngine.logEvent({
      userId: staffId,
      action: 'VERIFY_QR_SUCCESS',
      details: { parcelId: selectedParcel.id },
      result: 'SUCCESS',
      targetId: selectedParcel.id
    });
  };

  // Step 2: Validate PIN
  const handleVerifyPIN = async () => {
    setPinError('');
    if (!selectedParcel) return;

    const maxAttempts = sysSettings?.maxVerificationAttempts || 3;

    if (isLocked) {
      setPinError('This shipment is locked due to repeated failed collection attempts.');
      return;
    }

    // Check PIN expiry
    if (selectedParcel.pickupPinExpiry) {
      const expiryDate = new Date(selectedParcel.pickupPinExpiry);
      if (Date.now() > expiryDate.getTime()) {
        setPinError('Pickup PIN has expired. Please regenerate a new PIN.');
        logFailedAttempt('PIN_EXPIRED', 'Pickup PIN has expired.');
        return;
      }
    }

    try {
      setIsSyncing(true);
      const response = await fetch('/api/parcels/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await fbUser!.getIdToken()}`
        },
        body: JSON.stringify({
          parcelId: selectedParcel.id,
          enteredPin: enteredPin
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setPinError(data.error || 'Failed to verify PIN.');
        if (data.isLocked) {
          setIsLocked(true);
          dispatchAlertNotifications();
        }
        return;
      }

      if (data.verified) {
        setPinVerified(true);
        setFailedAttempts(0);
        setSelectedParcel({ ...selectedParcel, pickupPinVerified: true, pickupPinAttempts: 0 });
        toast.success('Pickup PIN verified successfully!');
      } else {
        const remaining = data.attemptsRemaining ?? (maxAttempts - (failedAttempts + 1));
        setFailedAttempts(maxAttempts - remaining);
        if (data.isLocked) {
          setIsLocked(true);
          setPinError(`Verification Locked! You have reached maximum failed verification attempts (${maxAttempts}). Alert dispatched to point owner.`);
          dispatchAlertNotifications();
        } else {
          setPinError(`Incorrect Pickup PIN. Attempts remaining: ${remaining}`);
        }
      }
    } catch (err: any) {
      console.error(err);
      setPinError('Error verifying PIN on server. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Log failed verification attempts
  const logFailedAttempt = async (reason: string, remarks: string) => {
    if (!selectedParcel) return;

    await auditEngine.logEvent({
      userId: staffId,
      action: 'VERIFICATION_FAILED',
      details: { parcelId: selectedParcel.id, reason, remarks, staffName, centerId },
      result: 'FAILURE',
      targetId: selectedParcel.id
    });
  };

  // Alert system for Point Owner & Super Admin
  const dispatchAlertNotifications = async () => {
    if (!selectedParcel || !centerId) return;

    // Notify the actual hub/point owner where this suspicious activity is
    // happening -- not the merchant who originally shipped the parcel.
    // The merchant has no ability to act on in-person security concerns at
    // a hub they don't run, and was previously being alerted by mistake.
    try {
      const hub = await centreEngine.getHub(centerId);
      if (hub?.ownerId) {
        await notificationEngine.send(
          hub.ownerId,
          'CRITICAL: Multiple Failed Release Attempts',
          `Suspicious activity: Parcel ${selectedParcel.trackingNumber} had repeated failed verification attempts at your Hub Center. The release has been locked pending review.`,
          'WARNING',
          undefined,
          'SECURITY'
        );
      }
    } catch (err) {
      console.error('Failed to resolve hub owner for security alert:', err);
    }

    // Super Admin Audit Flag
    await auditEngine.logEvent({
      userId: 'SYSTEM',
      action: 'SUSPICIOUS_ACTIVITY_ALERT',
      details: { parcelId: selectedParcel.id, trackingNumber: selectedParcel.trackingNumber, centerId, attempts: failedAttempts },
      result: 'FAILURE',
      targetId: selectedParcel.id
    });
  };

  // Drawing Canvas logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    e.preventDefault();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      setSignatureData(canvasRef.current.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData('');
  };

  // A parcel is clear to release once payment is settled -- for a SafePay
  // parcel that means funds are HELD/RELEASED; for a regular parcel it just
  // means it's moved past AWAITING_PAYMENT. Checking only SafePayStatus (as
  // this used to) left the release button permanently disabled for every
  // non-SafePay parcel, since that field simply doesn't exist on them.
  const isReleasePaymentCleared = (parcel: Parcel | null) => {
    if (!parcel) return false;
    if (parcel.SafePayStatus) {
      return (parcel.SafePayStatus as any) === 'HELD' || (parcel.SafePayStatus as any) === 'RELEASED' || (parcel.SafePayStatus as any) === 'FUNDS_SECURED';
    }
    return parcel.status !== 'AWAITING_PAYMENT';
  };

  // Final Release Action
  const handleConfirmRelease = async () => {
    setSignatureError('');
    setPhotoError('');

    if (!selectedParcel) return;

    // Hard payment gate: a parcel can never be handed over unless SafePay
    // funds are confirmed held (paid) for it. This check cannot be bypassed
    // from the UI regardless of button state.
    if (selectedParcel.SafePayStatus !== 'HELD' && selectedParcel.SafePayStatus !== 'RELEASED') {
      toast.error('This parcel cannot be released — payment has not been confirmed yet.');
      logFailedAttempt('RELEASE_BLOCKED_UNPAID', 'Attempted release without confirmed payment.');
      return;
    }

    // Checks configurations
    if (sysSettings?.signatureRequired && !signatureData) {
      setSignatureError('Customer digital signature is mandatory to complete release.');
      return;
    }

    if (sysSettings?.mandatoryParcelPhotos && (!photoParcel || !photoLabel)) {
      setPhotoError('Mandatory photos (Signed parcel and parcel label) are required.');
      return;
    }

    const collectionDetails = {
      status: 'COLLECTED' as const,
      SafePayStatus: 'RELEASED' as const,
      successAnimationStyle: sysSettings?.successAnimationStyle || 'confetti',
      signatureUrl: signatureData,
      signatureDate: new Date().toISOString(),
      parcelPhotos: [photoParcel, photoLabel, photoCondition].filter(Boolean),
      collectedBy: {
        name: collectedByName,
        phone: collectedByPhone,
        relation: collectedRelation
      },
      collectionStaff: {
        staffId,
        staffName,
        staffRole,
        centerId,
        device: navigator.userAgent,
        gps: null, // GPS data can be added later via browser API
        timestamp: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    };

    if (!isOnline) {
      // Offline Queueing: Store in localStorage
      const queuedRelease = {
        parcelId: selectedParcel.id,
        details: collectionDetails,
        // PIN and staffId are now validated server-side based on Auth token
        timestamp: Date.now()
      };
      const existingQueue = JSON.parse(localStorage.getItem('queued_parcel_releases') || '[]');
      existingQueue.push(queuedRelease);
      localStorage.setItem('queued_parcel_releases', JSON.stringify(existingQueue));

      toast.success('No internet detected. Parcel release queued locally. It will auto-synchronize when connection returns.');

      // Update local state temporarily to success
      setSelectedParcel({
        ...selectedParcel,
        ...collectionDetails,
        status: 'COLLECTED',
        SafePayStatus: 'RELEASED'
      });
      setShowSuccessAnim(true);
      setStep(4);
      return;
    }

    // Process Online Release
    setIsSyncing(true);
    try {
      const response = await fetch('/api/parcels/release', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await fbUser!.getIdToken()}`
        },
        body: JSON.stringify({
          parcelId: selectedParcel.id,
          collectionDetails
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to release parcel on server.');
        setIsSyncing(false);
        return;
      }

      // Update local state
      setSelectedParcel({
        ...selectedParcel,
        ...collectionDetails,
        status: 'COLLECTED',
        SafePayStatus: 'RELEASED'
      });

      // Refetch custody timeline
      const events = await parcelEngine.tracking.getTrackingHistory(selectedParcel.id);
      setTimeline(events);

      // Increment active shift metrics for staff member
      if (staffId) {
        try {
          const activeShift = await shiftEngine.getActiveShiftForStaff(staffId);
          if (activeShift) {
            await shiftEngine.incrementShiftMetrics(activeShift.id, 'parcelsReleased');
          }
        } catch (shiftErr) {
          console.error('Failed to update shift metric on release:', shiftErr);
        }
      }


      // Trigger post-release notifications to customer and sender
      try {
        await notificationEngine.send(
          selectedParcel.senderId,
          'Parcel Collected Successfully',
          `Parcel ${selectedParcel.trackingNumber} sent to ${selectedParcel.recipientInfo.name} has been successfully collected at Hub ${centerId}.`,
          'SUCCESS',
          undefined,
          'SHIPMENT'
        );

        // The recipient isn't always the account that created the shipment
        // (often not even a registered user at all -- just a name/phone/
        // email on the label). Look up a real account to notify instead of
        // guessing; previously this sent to selectedParcel.id, which is the
        // parcel's own document ID, not a user -- meaning the recipient's
        // "your parcel was collected" confirmation never actually arrived.
        let recipientUser = null;
        if (selectedParcel.recipientInfo.email) {
          recipientUser = await userRepository.getByEmail(selectedParcel.recipientInfo.email);
        }
        if (!recipientUser && selectedParcel.recipientInfo.phone) {
          recipientUser = await userRepository.getByPhone(selectedParcel.recipientInfo.phone);
        }
        if (recipientUser) {
          await notificationEngine.send(
            recipientUser.uid || recipientUser.id,
            'Parcel Collected',
            `Your parcel ${selectedParcel.trackingNumber} has been released and collected by ${collectedByName} (Relation: ${collectedRelation}) at Hub ${centerId}. Thank you for using WeSabiHub!`,
            'SUCCESS',
            undefined,
            'SHIPMENT'
          );
        }
      } catch (notifErr) {
        console.error('Notification warning:', notifErr);
      }

      // Generate and save RELEASE receipt
      try {
        let hubDetails: any = null;
        if (selectedParcel.destinationCenterId) {
          hubDetails = await centreEngine.getHub(selectedParcel.destinationCenterId);
        }
        if (!hubDetails) {
          hubDetails = {
            id: centerId,
            name: centerId || 'WeSabiHub Point',
            location: 'Nigeria'
          };
        }

        const receipt = await receiptService.generateAndSaveReceipt({
          type: 'RELEASE',
          parcel: {
            ...selectedParcel,
            ...collectionDetails,
            status: 'COLLECTED',
            SafePayStatus: 'RELEASED'
          },
          hub: hubDetails,
          staffId,
          staffName,
          shelfLocation: selectedParcel.shelfLocation || 'Main Inventory Shelf',
          recipientRelation: collectedRelation
        });
        setGeneratedReceipt(receipt);

        // Backup write to Express full-stack API database
        await fetch('/api/receipts/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(receipt)
        });
      } catch (receiptErr) {
        console.error('Failed to generate RELEASE receipt:', receiptErr);
      }

      setShowSuccessAnim(true);
      setStep(4);
    } catch (err) {
      console.error(err);
      toast.error('Error releasing parcel. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };
  const handleSyncOfflineQueue = async () => {
    const queue = JSON.parse(localStorage.getItem('queued_parcel_releases') || '[]');
    if (queue.length === 0) return;

    setIsSyncing(true);
    const successfullySynced: string[] = [];
    try {
      for (const item of queue) {
        // Submit updates securely via server endpoint
        const response = await fetch('/api/parcels/release', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await fbUser!.getIdToken()}`
          },
          body: JSON.stringify({
            parcelId: item.parcelId,
            collectionDetails: item.details
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || `Failed to sync release for parcel ${item.parcelId}`);
        }

        successfullySynced.push(item.parcelId);
      }
      localStorage.removeItem('queued_parcel_releases');
      toast.success('Offline queued releases synchronized successfully!');
    } catch (err: any) {
      console.error(err);
      // Clean up only synced items from the queue to prevent double synchronization
      const remainingQueue = queue.filter((item: any) => !successfullySynced.includes(item.parcelId));
      if (remainingQueue.length > 0) {
        localStorage.setItem('queued_parcel_releases', JSON.stringify(remainingQueue));
      } else {
        localStorage.removeItem('queued_parcel_releases');
      }
      toast.error(`Sync warning: ${err.message || 'Error synchronizing some queued items.'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <PointLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-20">

        {/* Offline & Sync indicators */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-primary-600 rounded-full animate-pulse" />
              <h1 className="text-3xl font-black dark:text-white font-display">Secure Parcel Release</h1>
            </div>
            <p className="text-xs text-slate-900">Two-step QR and PIN validation with chain of custody logging.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Online/Offline status banner */}
            <div className={cn(
              "px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold",
              isOnline ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20" : "bg-amber-50 text-amber-600 dark:bg-amber-950/20"
            )}>
              {isOnline ? (
                <>
                  <Wifi size={14} />
                  <span>Online State</span>
                </>
              ) : (
                <>
                  <WifiOff size={14} />
                  <span>Offline Mode</span>
                </>
              )}
            </div>

            {/* Offline sync button if records exist */}
            {isOnline && localStorage.getItem('queued_parcel_releases') && (
              <Button
                onClick={handleSyncOfflineQueue}
                variant="outline"
                size="sm"
                className="h-9 rounded-xl flex items-center gap-1.5 bg-primary-50 text-primary-600 border-primary-200"
              >
                <RefreshCw size={14} className={cn(isSyncing && "animate-spin")} />
                <span>Sync Queue</span>
              </Button>
            )}
          </div>
        </div>

        {/* Steps Breadcrumbs indicator */}
        <div className="flex items-center justify-center py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-3xl">
          <div className="flex items-center gap-4 sm:gap-8">
            {[
              { num: 1, label: 'Search' },
              { num: 2, label: 'Two-Step Verification' },
              { num: 3, label: 'Evidence & Sign' },
              { num: 4, label: 'Custody Handover' }
            ].map((s) => (
              <div key={s.num} className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all",
                  step === s.num ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20" :
                  step > s.num ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-900"
                )}>
                  {step > s.num ? <Check size={14} strokeWidth={3} /> : s.num}
                </div>
                <span className={cn(
                  "text-xs font-bold hidden md:inline",
                  step === s.num ? "text-slate-900 dark:text-white" : "text-slate-800"
                )}>{s.label}</span>
                {s.num < 4 && <div className="h-0.5 w-4 sm:w-8 bg-slate-200 dark:bg-slate-800" />}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* STEP 1: Search & Locate Parcel */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <div className="md:col-span-2 space-y-6">
                <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold dark:text-white font-display">Locate Shipment</h2>
                    <p className="text-xs text-slate-900">Enter the parcel Tracking Number or Shipment ID to launch the verification module.</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-800" size={18} />
                      <Input
                        placeholder="e.g. TRK482930219"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleFindParcel()}
                        className="h-13 pl-12 rounded-2xl text-base font-mono"
                      />
                    </div>
                    <Button
                      onClick={handleFindParcel}
                      disabled={isSearching || !searchQuery.trim()}
                      className="h-13 px-8 rounded-2xl shadow-lg shadow-primary-500/20 font-bold flex items-center gap-2"
                    >
                      {isSearching && <Loader2 className="animate-spin" size={16} />}
                      Find Shipment
                    </Button>
                  </div>
                </Card>

                {/* Secure Collection Standards Notice */}
                <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="text-emerald-500" size={16} />
                    Chain of Custody Standard Protocol
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] text-slate-900 leading-normal">
                    <div className="p-3 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <strong>1. No Manual Bypasses</strong>
                      <p className="mt-1">Staff cannot override failed QR scans or Pickup PIN entries. Both are mandatory to unlock collection.</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <strong>2. Zero Personal Data Risk</strong>
                      <p className="mt-1">QR tokens contain secure hashes and do not expose recipient email, telephone numbers, or values.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Help */}
              <div className="space-y-6">
                <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-4 bg-primary-50 dark:bg-primary-950/20 border-primary-100">
                  <h4 className="font-bold text-sm text-primary-800 dark:text-primary-300">Finding a Parcel</h4>
                  <p className="text-xs text-primary-700 leading-relaxed">
                    Enter the tracking number from the customer's pickup notification, or scan the barcode on your inventory shelf label. You can also search by the parcel's internal ID if the tracking number isn't available.
                  </p>
                </Card>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Two-Step QR & PIN Verification */}
          {step === 2 && selectedParcel && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >

              {/* Parcel & Verification forms */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6">

                  {/* Lock Indicator */}
                  {isLocked && (
                    <div className="p-5 bg-red-500/10 border border-red-500/20 text-red-600 rounded-3xl flex items-start gap-4 mb-4">
                      <ShieldAlert size={28} className="shrink-0 text-red-600 mt-1" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm">Security Lockdown Active</h4>
                        <p className="text-xs text-red-500/80 leading-normal">
                          Verification is suspended due to exceeding the maximum allowed ({sysSettings?.maxVerificationAttempts || 3}) failed PIN entries. Point Owners can regenerate the PIN to lift this lock.
                        </p>
                        <Button
                          onClick={handleRegenerateCredentials}
                          variant="outline"
                          size="sm"
                          className="mt-2 text-xs bg-white text-red-700 border-red-200"
                        >
                          Regenerate PIN (Authorize)
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="space-y-1">
                      <Badge variant="success" className="font-mono text-xs">{selectedParcel.trackingNumber}</Badge>
                      <h2 className="text-2xl font-black dark:text-white font-display">Two-Step Security Validation</h2>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setStep(1)} className="rounded-xl flex items-center gap-1">
                      <ArrowLeft size={14} /> Back
                    </Button>
                  </div>

                  {/* STEP 2-1: Scan QR Code */}
                  <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm",
                          qrScanned ? "bg-emerald-100 text-emerald-600" : "bg-primary-50 text-primary-600"
                        )}>
                          {qrScanned ? <Check size={18} strokeWidth={3} /> : "1"}
                        </div>
                        <div>
                          <h3 className="font-bold dark:text-white text-sm">Scan Secure Release QR Code</h3>
                          <p className="text-[11px] text-slate-800">Scan customer's on-screen shipment token QR.</p>
                        </div>
                      </div>
                      <Badge variant={qrScanned ? "success" : "warning"}>
                        {qrScanned ? "Verified" : "Pending Scan"}
                      </Badge>
                    </div>

                    {qrError && <p className="text-[11px] text-red-500 font-bold">{qrError}</p>}

                    {!qrScanned && !isLocked && (
                      <div className="flex gap-4 pt-2">
                        <Button
                          onClick={() => setShowScannerSim(true)}
                          className="flex-1 rounded-2xl h-12 flex items-center gap-2 shadow-lg shadow-primary-500/10"
                        >
                          <QrCode size={18} /> Open Built-in Scanner
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* STEP 2-2: Verify Pickup PIN */}
                  <div className={cn(
                    "p-6 rounded-3xl border transition-all space-y-4",
                    !qrScanned ? "opacity-50 pointer-events-none bg-slate-50/50 border-slate-100" : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm",
                          pinVerified ? "bg-emerald-100 text-emerald-600" : "bg-primary-50 text-primary-600"
                        )}>
                          {pinVerified ? <Check size={18} strokeWidth={3} /> : "2"}
                        </div>
                        <div>
                          <h3 className="font-bold dark:text-white text-sm">Enter Secure Pickup PIN</h3>
                          <p className="text-[11px] text-slate-800">Recipient must provide their secure 6-digit one-time code.</p>
                        </div>
                      </div>
                      <Badge variant={pinVerified ? "success" : "warning"}>
                        {pinVerified ? "Verified" : "Pending PIN"}
                      </Badge>
                    </div>

                    {pinError && <p className="text-[11px] text-red-500 font-bold">{pinError}</p>}

                    {!pinVerified && !isLocked && (
                      <div className="flex gap-3 pt-2">
                        <Input
                          maxLength={6}
                          type="password"
                          placeholder="• • • • • •"
                          value={enteredPin}
                          onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
                          className="h-12 text-center text-xl font-bold tracking-widest rounded-2xl font-mono flex-1 bg-white"
                        />
                        <Button onClick={handleVerifyPIN} disabled={enteredPin.length < 6} className="h-12 px-6 rounded-2xl font-bold">
                          Verify PIN
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Recipient collector detail form */}
                  {qrScanned && pinVerified && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                      <h3 className="font-bold text-sm dark:text-white">Receiver Log Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-800 uppercase tracking-widest">Collector Name</label>
                          <Input
                            value={collectedByName}
                            onChange={(e) => setCollectedByName(e.target.value)}
                            className="h-10 rounded-xl"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-800 uppercase tracking-widest">Collector Phone</label>
                          <Input
                            value={collectedByPhone}
                            onChange={(e) => setCollectedByPhone(e.target.value)}
                            className="h-10 rounded-xl"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-800 uppercase tracking-widest">Relation to Recipient</label>
                          <select
                            value={collectedRelation}
                            onChange={(e: any) => setCollectedRelation(e.target.value)}
                            className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500"
                          >
                            <option value="SELF">Self (Original Recipient)</option>
                            <option value="OTHER">Other (Authorized Proxy)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation controls */}
                  <div className="flex items-center gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="outline" onClick={() => setStep(1)} className="h-12 px-8 rounded-2xl">Cancel</Button>
                    <Button
                      onClick={() => setStep(3)}
                      disabled={!qrScanned || !pinVerified}
                      className="flex-1 h-12 rounded-2xl font-bold"
                    >
                      Continue to Custody Signatures
                    </Button>
                  </div>

                </Card>
              </div>

              {/* Sidebar Parcel & SafePay Summary */}
              <div className="space-y-6">
                <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-6">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="font-bold dark:text-white text-sm font-display">Shipment Information</h3>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-800">Tracking Number:</span>
                      <span className="font-mono font-bold dark:text-white">{selectedParcel.trackingNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-800">Sender:</span>
                      <span className="font-bold dark:text-white">{selectedParcel.senderId.substring(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-800">Recipient Name:</span>
                      <span className="font-bold dark:text-white">{selectedParcel.recipientInfo.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-800">Parcel Status:</span>
                      <Badge variant="info">{selectedParcel.status}</Badge>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />

                    <div className="flex justify-between items-center">
                      <span className="text-slate-800">Payment Protection:</span>
                      <Badge variant={selectedParcel.SafePayStatus === 'HELD' ? 'warning' : 'success'} className="flex items-center gap-1">
                        <ShieldCheck size={12} />
                        <span>{selectedParcel.SafePayStatus === 'HELD' ? 'Payment Protected' : selectedParcel.SafePayStatus}</span>
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-800">Payment Status:</span>
                      <AnimatePresence mode="wait">
                        {selectedParcel.status === 'AWAITING_PAYMENT' ? (
                          <motion.div
                            key="unpaid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                          >
                            <Badge variant="outline" className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200">
                              <Loader2 size={12} className="animate-spin" />
                              <span>Waiting for Payment</span>
                            </Badge>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="paid"
                            initial={{ opacity: 0, scale: justConfirmedPayment ? 0.5 : 1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                          >
                            <Badge variant="success" className="flex items-center gap-1.5">
                              <CheckCircle2 size={12} />
                              <span>Payment Confirmed</span>
                            </Badge>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />

                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                        <Info size={12} /> Customer lost their PIN?
                      </span>
                      <p className="text-xs text-slate-500">Generate a new one and relay it to them by phone after verifying their identity.</p>
                      <Button onClick={handleRegenerateCredentials} variant="outline" className="w-full text-xs h-9 bg-white dark:bg-slate-800">
                        Regenerate PIN
                      </Button>
                    </div>

                  </div>
                </Card>
              </div>

              {/* SCANNER MODAL */}
              {showScannerSim && (
                <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-slate-950 border border-slate-800 w-full max-w-md rounded-3xl p-6 text-center space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                      <h3 className="font-bold text-white font-display">Scan Customer QR Token</h3>
                      <button onClick={() => setShowScannerSim(false)} className="text-slate-800 hover:text-white">
                        <X size={20} />
                      </button>
                    </div>

                    <QRScanner
                      onScanSuccess={(text) => handleQrScanResult(text)}
                      onScanFailure={(err) => console.log(err)}
                    />

                    <Button variant="outline" onClick={() => setShowScannerSim(false)} className="w-full rounded-xl text-white">Cancel</Button>
                  </div>
                </div>
              )}

            </motion.div>
          )}

          {/* STEP 3: Digital Signature & Photo Evidence */}
          {step === 3 && selectedParcel && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >

              <div className="lg:col-span-2 space-y-6">
                <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-8">

                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <h2 className="text-2xl font-black dark:text-white font-display">Signatures & Photographic Proofs</h2>
                    <p className="text-xs text-slate-900 mt-1">Capture final recipient digital acknowledgement and live parcel condition photographs to seal chain of custody transfer.</p>
                  </div>

                  {/* 3-1: Digital Signature Canvas */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <SigIcon className="text-primary-600" size={18} />
                        <h3 className="font-bold dark:text-white text-sm">Customer Digital Signature</h3>
                      </div>
                      <button onClick={clearCanvas} className="text-xs text-red-500 font-bold hover:underline">Clear Signature</button>
                    </div>

                    {signatureError && <p className="text-[11px] text-red-500 font-bold">{signatureError}</p>}

                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900">
                      <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        width={500}
                        height={180}
                        className="w-full h-[180px] bg-transparent cursor-crosshair touch-none"
                      />
                    </div>
                    <p className="text-[9px] text-slate-800">Recipient must draw inside the dashed area. Signatures are timestamped and linked directly to Shipment {selectedParcel.shipmentId}.</p>
                  </div>

                  {/* 3-2: Live Photo Evidence */}
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Camera className="text-primary-600" size={18} />
                      <h3 className="font-bold dark:text-white text-sm">Photographic Evidence</h3>
                    </div>

                    {photoError && <p className="text-[11px] text-red-500 font-bold">{photoError}</p>}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                      {/* Photo 1: Signed Parcel */}
                      <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 bg-slate-50 dark:bg-slate-900/50">
                        <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Signed Parcel Photo (Mandatory)</span>
                        {photoParcel ? (
                          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black">
                            <img src={photoParcel} className="w-full h-full object-cover" alt="Parcel evidence" />
                            <button onClick={() => setPhotoParcel('')} className="absolute right-1 top-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white text-[10px]">✕</button>
                          </div>
                        ) : (
                          <NativeMediaHandler
                            label="Capture Live"
                            onMediaCaptured={(file) => {
                              const reader = new FileReader();
                              reader.onload = (e) => setPhotoParcel(e.target?.result as string);
                              reader.readAsDataURL(file);
                            }}
                          />
                        )}
                      </div>

                      {/* Photo 2: Label */}
                      <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 bg-slate-50 dark:bg-slate-900/50">
                        <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Parcel Label Photo (Mandatory)</span>
                        {photoLabel ? (
                          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black">
                            <img src={photoLabel} className="w-full h-full object-cover" alt="Label evidence" />
                            <button onClick={() => setPhotoLabel('')} className="absolute right-1 top-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white text-[10px]">✕</button>
                          </div>
                        ) : (
                          <NativeMediaHandler
                            label="Capture Live"
                            onMediaCaptured={(file) => {
                              const reader = new FileReader();
                              reader.onload = (e) => setPhotoLabel(e.target?.result as string);
                              reader.readAsDataURL(file);
                            }}
                          />
                        )}
                      </div>

                      {/* Photo 3: Condition */}
                      <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 bg-slate-50 dark:bg-slate-900/50">
                        <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Parcel Condition (Optional)</span>
                        {photoCondition ? (
                          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black">
                            <img src={photoCondition} className="w-full h-full object-cover" alt="Condition evidence" />
                            <button onClick={() => setPhotoCondition('')} className="absolute right-1 top-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white text-[10px]">✕</button>
                          </div>
                        ) : (
                          <NativeMediaHandler
                            label="Capture Condition"
                            onMediaCaptured={(file) => {
                              const reader = new FileReader();
                              reader.onload = (e) => setPhotoCondition(e.target?.result as string);
                              reader.readAsDataURL(file);
                            }}
                          />
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Submit actions */}
                  <div className="flex items-center gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="outline" onClick={() => setStep(2)} className="h-12 px-8 rounded-2xl">Back</Button>
                    <Button
                      onClick={handleConfirmRelease}
                      disabled={isSyncing || !isReleasePaymentCleared(selectedParcel)}
                      className={cn(
                        "flex-1 h-12 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-colors",
                        isReleasePaymentCleared(selectedParcel)
                          ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/10"
                          : "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed"
                      )}
                    >
                      {isSyncing && <Loader2 className="animate-spin" size={16} />}
                      {isReleasePaymentCleared(selectedParcel)
                        ? 'Authorize Handover & Complete Release'
                        : 'Waiting for Payment Confirmation'}
                    </Button>
                  </div>

                </Card>
              </div>

              {/* Sidebar staff logs */}
              <div className="space-y-6">
                <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h4 className="font-bold dark:text-white text-xs font-display flex items-center gap-1.5 text-primary-600">
                      <User size={14} /> Authorized Staff Log
                    </h4>
                  </div>

                  <div className="space-y-3 text-[11px] text-slate-900">
                    <div className="flex justify-between">
                      <span>Staff Name:</span>
                      <strong className="text-slate-800 dark:text-white">{staffName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Hub Point:</span>
                      <strong className="text-slate-800 dark:text-white">{centerId}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Role Rank:</span>
                      <strong className="text-slate-800 dark:text-white">{staffRole}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Assigned Coordinates:</span>
                      <strong className="text-slate-800 dark:text-white">6.4281° N, 3.4219° E</strong>
                    </div>
                  </div>
                </Card>
              </div>

            </motion.div>
          )}

          {/* STEP 4: Handover Success & Chronological Timeline */}
          {step === 4 && selectedParcel && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >

              <Card className="p-10 border-slate-200 dark:border-slate-800 text-center space-y-6 max-w-3xl mx-auto">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center rounded-3xl mx-auto mb-2 shadow-lg shadow-emerald-500/10">
                  <PackageCheck size={42} />
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-black dark:text-white font-display">Parcel Custody Handed Over</h2>
                  <p className="text-xs text-slate-900 max-w-lg mx-auto leading-relaxed">
                    Shipment **{selectedParcel.shipmentId}** has been released to <strong>{selectedParcel.collectedBy?.name}</strong>. The protected funds of <strong>₦{(selectedParcel.pricing?.total || 0).toLocaleString()}</strong> have been marked as released to the seller/merchant.
                  </p>
                </div>

                {/* Handover Details receipt */}
                <div className="p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-left grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-800 font-bold uppercase text-[9px] tracking-widest block">Release ID</span>
                    <strong className="dark:text-white font-mono text-sm">REL-{Date.now().toString().substring(6)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-800 font-bold uppercase text-[9px] tracking-widest block">Handover Time</span>
                    <strong className="dark:text-white font-mono">{new Date(selectedParcel.collectionStaff?.timestamp || '').toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-slate-800 font-bold uppercase text-[9px] tracking-widest block">Recipient Name</span>
                    <strong className="dark:text-white">{selectedParcel.collectedBy?.name} ({selectedParcel.collectedBy?.relation})</strong>
                  </div>
                  <div>
                    <span className="text-slate-800 font-bold uppercase text-[9px] tracking-widest block">Authorized Staff</span>
                    <strong className="dark:text-white">{selectedParcel.collectionStaff?.staffName} ({selectedParcel.collectionStaff?.staffRole})</strong>
                  </div>
                </div>

                {/* Chronological Chain of Custody Timeline */}
                <div className="text-left space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-base dark:text-white font-display flex items-center gap-2">
                    <Activity size={18} className="text-primary-600" />
                    Immutable Chain of Custody Timeline
                  </h3>

                  <div className="space-y-6 pl-4 border-l-2 border-slate-200 dark:border-slate-800 relative">
                    {timeline.length === 0 ? (
                      <div className="text-xs text-slate-800">No events logged in the custody registry.</div>
                    ) : (
                      timeline.map((event, i) => (
                        <div key={event.id} className="relative space-y-1">
                          {/* Dot indicator */}
                          <div className={cn(
                            "absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 bg-white dark:bg-slate-950",
                            i === 0 ? "border-emerald-500 ring-4 ring-emerald-500/10" : "border-slate-400"
                          )} />
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">
                              {new Date(event.timestamp).toLocaleDateString()} {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-slate-300 dark:text-slate-300">•</span>
                            <Badge variant={event.status === 'COLLECTED' ? 'success' : 'info'} className="text-[9px] h-5 py-0">
                              {event.status}
                            </Badge>
                          </div>
                          <p className="text-xs font-bold dark:text-white">{event.remarks}</p>
                          <p className="text-[10px] text-slate-800">Location: {event.location} • Actor: {event.actorId}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => generatedReceipt && receiptService.downloadPDF(generatedReceipt)}
                    className="px-10 rounded-2xl h-12 font-bold"
                    disabled={!generatedReceipt}
                  >
                    <FileText size={18} className="mr-2" /> Download Receipt PDF
                  </Button>
                  <Button onClick={() => { setStep(1); setGeneratedReceipt(null); }} className="px-10 rounded-2xl h-12 shadow-lg shadow-primary-500/20 font-bold">
                    Release Another Parcel
                  </Button>
                </div>

              </Card>

            </motion.div>
          )}

        </AnimatePresence>

      </div>

      <SuccessAnimation
        isOpen={showSuccessAnim}
        style={(sysSettings?.successAnimationStyle as SuccessAnimationStyle) || 'confetti'}
        title="Parcel Released!"
        subtitle={selectedParcel ? `${selectedParcel.trackingNumber} handed over successfully.` : undefined}
        onComplete={() => setShowSuccessAnim(false)}
      />
    </PointLayout>
  );
};
