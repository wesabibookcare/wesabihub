import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { CustomerLayout } from '@/src/layouts/CustomerLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, CheckCircle2, XCircle, Package } from 'lucide-react';
import { parcelEngine } from '@/src/engines';
import { useAuth } from '@/src/context/AuthContext';
import { apiFetch } from '@/src/lib/apiClient';

type VerifyState = 'idle' | 'verifying' | 'success' | 'failed';

export const PaymentPage = () => {
  const { parcelId } = useParams<{ parcelId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, fbUser } = useAuth();

  const [parcel, setParcel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [verifyState, setVerifyState] = useState<VerifyState>('idle');

  // Returning from checkout (Flutterwave or the sandbox simulator) lands back
  // here with these query params attached -- see mock-callback / the real
  // provider redirect for where these come from.
  const returnedTxRef = searchParams.get('tx_ref');
  const returnedStatus = searchParams.get('status');

  useEffect(() => {
    if (!parcelId) return;
    parcelEngine.getParcel(parcelId).then(p => {
      setParcel(p);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [parcelId]);

  const isSafePay = !!parcel?.protectionEnabled;

  // If we've just been returned from the checkout page, confirm the payment.
  useEffect(() => {
    const confirmReturnedPayment = async () => {
      if (!returnedTxRef || !fbUser) return;

      if (returnedStatus !== 'successful') {
        setVerifyState('failed');
        return;
      }

      setVerifyState('verifying');
      try {
        await apiFetch(fbUser, isSafePay ? '/api/payment-protection/verify' : '/api/parcels/verify-payment', {
          method: 'POST',
          body: { txRef: returnedTxRef }
        });
        setVerifyState('success');
        toast.success(isSafePay
          ? 'Payment confirmed! Your funds are securely held until delivery is confirmed.'
          : 'Payment confirmed!');
      } catch (err: any) {
        setVerifyState('failed');
        toast.error(err.message || 'We could not confirm this payment. If money left your account, contact support with your reference.');
      }
    };
    confirmReturnedPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnedTxRef, returnedStatus, fbUser, isSafePay]);

  const itemValue = parcel?.estimatedValue || 0;
  const shippingFee = parcel?.pricing?.total || 0;
  const totalDue = isSafePay ? (itemValue + shippingFee) : shippingFee;

  const handlePay = async () => {
    if (!parcel || !user || !fbUser) {
      toast.error('You must be signed in to pay for this shipment.');
      return;
    }
    setIsPaying(true);
    try {
      const endpoint = isSafePay ? '/api/payment-protection/initialize' : '/api/parcels/initialize-payment';
      const body = isSafePay
        ? {
            shipmentId: parcel.shipmentId || parcel.id,
            amount: totalDue,
            customerEmail: user.email,
            customerName: user.displayName,
            customerPhone: user.phoneNumber,
            merchantId: parcel.senderId,
            trackingNumber: parcel.trackingNumber,
            redirectUrl: `${window.location.origin}/customer/payment/${parcelId}`
          }
        : {
            parcelId: parcel.id,
            customerEmail: user.email,
            customerName: user.displayName,
            customerPhone: user.phoneNumber,
            redirectUrl: `${window.location.origin}/customer/payment/${parcelId}`
          };

      const response = await apiFetch<{ checkoutUrl: string; isSandbox: boolean }>(fbUser, endpoint, {
        method: 'POST',
        body
      });

      if (!response.checkoutUrl) {
        throw new Error('Payment could not be started. Please try again.');
      }

      if (response.isSandbox) {
        toast.info('Opening the sandbox payment simulator (no real API keys configured yet)...');
      }

      // Full-page redirect: this is a hosted checkout page outside our app.
      window.location.href = response.checkoutUrl;
    } catch (err: any) {
      toast.error(err.message || 'Failed to start payment. Please try again.');
      setIsPaying(false);
    }
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center py-24 gap-2 text-slate-800">
          <Loader2 size={20} className="animate-spin" /> Loading shipment details...
        </div>
      </CustomerLayout>
    );
  }

  if (!parcel) {
    return (
      <CustomerLayout>
        <div className="max-w-xl mx-auto py-24 text-center text-slate-800">
          Shipment not found. Please check the link and try again.
        </div>
      </CustomerLayout>
    );
  }

  // --- Returned from checkout: show confirmation state instead of the pay button ---
  if (returnedTxRef) {
    return (
      <CustomerLayout>
        <div className="max-w-xl mx-auto space-y-6">
          <Card className="p-10 text-center space-y-4">
            {verifyState === 'verifying' && (
              <>
                <Loader2 size={40} className="mx-auto animate-spin text-primary-600" />
                <h1 className="text-xl font-bold dark:text-white">Confirming your payment...</h1>
                <p className="text-slate-800 text-sm">This only takes a moment. Please don't close this page.</p>
              </>
            )}
            {verifyState === 'success' && (
              <>
                <CheckCircle2 size={48} className="mx-auto text-emerald-600" />
                <h1 className="text-xl font-bold dark:text-white">{isSafePay ? 'Payment Secured' : 'Payment Confirmed'}</h1>
                <p className="text-slate-800 text-sm">
                  {isSafePay
                    ? `Your ₦${totalDue.toLocaleString()} payment is held securely by Flutterwave until you confirm the delivery is correct.`
                    : `Your ₦${totalDue.toLocaleString()} payment has been received.`}
                </p>
                <Button onClick={() => navigate('/customer/track?id=' + parcel.trackingNumber)} className="w-full h-12 mt-2">
                  Track My Shipment
                </Button>
              </>
            )}
            {verifyState === 'failed' && (
              <>
                <XCircle size={48} className="mx-auto text-red-600" />
                <h1 className="text-xl font-bold dark:text-white">Payment Not Confirmed</h1>
                <p className="text-slate-800 text-sm">
                  {returnedStatus !== 'successful'
                    ? "It looks like the payment was cancelled or didn't complete."
                    : "We couldn't confirm this payment automatically. If money left your account, please contact support with your reference before trying again."}
                </p>
                <Button variant="outline" onClick={() => navigate('/customer/payment/' + parcelId)} className="w-full h-12 mt-2">
                  Try Again
                </Button>
              </>
            )}
          </Card>
        </div>
      </CustomerLayout>
    );
  }

  // --- Normal state: show the payment summary and the Pay button ---
  return (
    <CustomerLayout>
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold dark:text-white">Complete Payment</h1>
        <Card className="p-8 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <span className="text-slate-600">Shipment ID:</span>
            <span className="font-bold">{parcel.shipmentId}</span>
          </div>
          <div className="space-y-2 border-b pb-4">
            {isSafePay && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Item Value:</span>
                <span className="font-semibold">₦{itemValue.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Shipping Fee:</span>
              <span className="font-semibold">₦{shippingFee.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex justify-between items-center text-xl font-bold">
            <span>Total Due:</span>
            <span className="text-primary-600">₦{totalDue.toLocaleString()}</span>
          </div>
          {isSafePay ? (
            <div className="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-lg text-sm text-primary-800 dark:text-primary-300 flex items-start gap-2.5">
              <ShieldCheck size={18} className="shrink-0 mt-0.5" />
              <span>
                This payment is processed through SafePay. Funds are only released to the merchant after you confirm the parcel arrived as expected.
                If there's a problem, you can open a dispute before that release happens.
              </span>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
              <Package size={18} className="shrink-0 mt-0.5" />
              <span>This covers the delivery fee for this parcel. Once paid, your parcel will be processed for pickup.</span>
            </div>
          )}
          <Button onClick={handlePay} disabled={isPaying} className="w-full h-14 text-lg">
            {isPaying ? 'Starting secure payment...' : 'Proceed to Payment'}
          </Button>
        </Card>
      </div>
    </CustomerLayout>
  );
};
