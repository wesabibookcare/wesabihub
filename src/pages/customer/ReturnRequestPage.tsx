import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Camera,
  Loader2,
  Info,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { useAuth } from '@/src/context/AuthContext';
import { parcelEngine, auditEngine, notificationEngine } from '@/src/engines';
import { disputeEngine } from '@/src/engines/DisputeEngine';
import { userRepository } from '@/src/services/db/UserRepository';
import { merchantBusinessRepository } from '@/src/services/db/MerchantBusinessRepository';
import { returnRepository } from '@/src/services/db/ReturnRepository';
import { Parcel } from '@/src/types';
import { toast } from 'sonner';

export const ReturnRequestPage = () => {
  const { parcelId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [merchantName, setMerchantName] = useState<string>('Verified Merchant');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchParcelAndMerchant = async () => {
      if (!parcelId) return;
      try {
        const data = await parcelEngine.getParcel(parcelId);
        if (!data) {
          setError('Parcel not found');
          return;
        }
        if (data.status !== 'COLLECTED' && data.status !== 'DELIVERED') {
          setError('Only collected or delivered parcels can be returned.');
          return;
        }

        // Enforce 7-day return window rule
        const deliveredTime = new Date(data.updatedAt || Date.now()).getTime();
        const daysSinceDelivery = (Date.now() - deliveredTime) / (1000 * 60 * 60 * 24);
        if (daysSinceDelivery > 7) {
          setError('Return window expired. Returns must be initiated within 7 days of delivery.');
          return;
        }

        // Validate duplicate return requests
        const existingReturns = await returnRepository.getByParcel(data.id);
        if (existingReturns && existingReturns.length > 0) {
          setError('A return request has already been submitted for this parcel.');
          return;
        }

        setParcel(data);

        // Resolve readable merchant name instead of raw ID
        if (data.senderId) {
          try {
            const merchantUser = await userRepository.getById(data.senderId);
            if (merchantUser?.displayName) {
              setMerchantName(merchantUser.displayName);
            } else {
              const businesses = await merchantBusinessRepository.getByMerchantId(data.senderId);
              if (businesses && businesses.length > 0 && businesses[0].businessName) {
                setMerchantName(businesses[0].businessName);
              } else {
                setMerchantName(`Merchant (${data.senderId.substring(0, 8)}...)`);
              }
            }
          } catch {
            setMerchantName('Verified Merchant');
          }
        }
      } catch (err) {
        console.error('Error fetching parcel:', err);
        setError('Failed to load parcel details');
      } finally {
        setLoading(false);
      }
    };
    fetchParcelAndMerchant();
  }, [parcelId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parcel || !user) return;

    setSubmitting(true);
    setError(null);

    try {
      // 1. Create return request record in database
      const returnRecord = await returnRepository.create({
        shipmentId: parcel.shipmentId,
        parcelId: parcel.id,
        customerUserId: user.uid,
        merchantId: parcel.senderId,
        reason,
        description: details,
        photos,
        status: 'REQUESTED',
        requestedAt: new Date().toISOString()
      });

      // 2. Connect to Dispute & SafePay Engine to freeze funds / flag protection
      try {
        const protection = await disputeEngine.getPaymentProtectionByParcelId(parcel.id);
        if (protection) {
          await disputeEngine.updatePaymentProtection(protection.id, {
            status: 'DISPUTED',
            disputeReason: reason,
            updatedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.warn('SafePay freeze notice:', err);
      }

      // 3. Log audit event
      await auditEngine.logEvent({
        userId: user.uid,
        userRole: user.role || 'customer',
        action: 'RETURN_REQUEST_CREATED',
        details: { parcelId: parcel.id, shipmentId: parcel.shipmentId, reason },
        targetId: returnRecord.id,
        result: 'SUCCESS'
      });

      // 4. Trigger automated notification to merchant & customer via Notification Engine
      await notificationEngine.send(
        parcel.senderId,
        'New Return Request',
        `A return request has been submitted for parcel ${parcel.trackingNumber}. Reason: ${reason}`,
        'WARNING',
        '/merchant/returns',
        'RETURN'
      );

      await notificationEngine.send(
        user.uid,
        'Return Request Submitted',
        `Your return request for parcel ${parcel.trackingNumber} has been logged and sent to ${merchantName}.`,
        'INFO',
        '/customer/returns',
        'RETURN'
      );

      setSuccess(true);
      toast.success('Return request submitted successfully!');
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err) {
      console.error('Error submitting return request:', err);
      setError('Failed to submit return request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoUpload = () => {
    document.getElementById('return-photo-input')?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      toast.error('Image size exceeds 1MB limit. Please select a compressed image to prevent storage overflow.');
      return;
    }

    try {
      let fileUrl = '';
      try {
        const { StorageService } = await import('../../services/StorageService');
        fileUrl = await StorageService.uploadFile(`returns/evidence-${Date.now()}`, file);
      } catch (err) {
        console.warn("Storage upload failed, falling back to FileReader", err);
        const reader = new FileReader();
        fileUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(file);
        });
      }
      setPhotos(prev => [...prev, fileUrl]);
      toast.success('Evidence photo added successfully');
    } catch (err) {
      console.error("Photo selection failed", err);
      toast.error('Failed to attach photo');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="animate-spin text-primary-600" size={40} />
      </div>
    );
  }

  if (error && !parcel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-red-600">
          <AlertCircle size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold dark:text-white">Request Blocked</h2>
          <p className="text-slate-600 dark:text-slate-300 max-w-sm">{error}</p>
        </div>
        <Button onClick={() => navigate(-1)} variant="outline" className="rounded-xl px-8">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      <div className="max-w-2xl mx-auto px-4 pt-12 space-y-8">

        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary-600 transition-all font-bold text-sm">
          <ArrowLeft size={16} /> Back to Parcel
        </button>

        <div className="space-y-2">
          <h1 className="text-4xl font-black dark:text-white font-display flex items-center gap-3">
            <RotateCcw className="text-primary-600" size={32} />
            Return Request
          </h1>
          <p className="text-slate-600 dark:text-slate-300">Initiate a return for your delivered parcel from <span className="font-bold text-slate-900 dark:text-white">{merchantName}</span></p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-10 text-center space-y-6"
            >
              <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black dark:text-white">Request Submitted!</h2>
                <p className="text-slate-600 dark:text-slate-300">Your return request has been logged. The merchant will review it within 48 hours. Redirecting to dashboard...</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary-600">
                      <Package size={20} />
                    </div>
                    <div>
                      <p className="font-mono font-bold text-sm dark:text-white">{parcel?.trackingNumber}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Delivered on {new Date(parcel?.updatedAt || '').toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge variant="success">DELIVERED</Badge>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-3">
                      <AlertCircle size={18} />
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Reason for Return</label>
                    <select
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 transition-all text-sm text-slate-900 dark:text-white"
                      required
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    >
                      <option value="">Select a reason</option>
                      <option value="DEFECTIVE">Item is defective / damaged</option>
                      <option value="WRONG_ITEM">Received wrong item</option>
                      <option value="NOT_AS_DESCRIBED">Item not as described</option>
                      <option value="SIZE_MISMATCH">Size mismatch</option>
                      <option value="OTHER">Other reason</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Detailed Explanation</label>
                    <textarea
                      className="w-full min-h-[120px] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 transition-all text-sm resize-none text-slate-900 dark:text-white"
                      placeholder="Please provide more details about why you want to return this item..."
                      required
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Evidence Photos (Max 1MB per image)</label>
                    <input
                      type="file"
                      id="return-photo-input"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileSelected}
                    />
                    <div className="grid grid-cols-4 gap-4">
                      {photos.map((photo, i) => (
                        <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative group">
                          <img src={photo} className="w-full h-full object-cover" alt="Evidence" />
                          <button
                            type="button"
                            onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                            className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {photos.length < 4 && (
                        <button
                          type="button"
                          onClick={handlePhotoUpload}
                          className="aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:text-primary-600 hover:border-primary-500 transition-all gap-2"
                        >
                          <Camera size={24} />
                          <span className="text-[10px] font-bold uppercase">Add Photo</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-900/20 flex gap-4">
                    <Info className="text-primary-600 shrink-0" size={20} />
                    <p className="text-[11px] text-primary-900/70 dark:text-primary-400/70 leading-relaxed">
                      <strong>Policy Notice:</strong> Returns must be initiated within 7 days of delivery. The item must be in its original packaging. Submitting a return request automatically flags SafePay protection and notifies the merchant.
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-12 rounded-xl font-bold"
                      onClick={() => navigate(-1)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-[2] h-12 rounded-xl font-bold bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/20"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="animate-spin mr-2" size={18} />
                          Submitting...
                        </>
                      ) : 'Confirm Return Request'}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
