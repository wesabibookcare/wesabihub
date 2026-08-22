import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, CreditCard, Lock, RefreshCw, AlertCircle, CheckCircle, Smartphone } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';

interface FlutterwavePaymentProps {
  amount: number;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  shipmentId: string;
  trackingNumber: string;
  onSuccess: (response: any) => void;
  onClose: () => void;
}

interface FlutterwaveCheckoutConfig {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency: string;
  payment_options?: string;
  redirect_url?: string;
  meta?: any;
  customer: {
    email: string;
    phonenumber?: string;
    name?: string;
  };
  customizations?: {
    title?: string;
    description?: string;
    logo?: string;
  };
  callback: (data: any) => void;
  onclose: () => void;
}

// Extend global window interface safely
declare global {
  interface Window {
    FlutterwaveCheckout?: (config: FlutterwaveCheckoutConfig) => void;
  }
}

export const FlutterwavePayment = ({
  amount,
  customerEmail,
  customerName = "Valued Customer",
  customerPhone = "+234 810 000 0000",
  shipmentId,
  trackingNumber,
  onSuccess,
  onClose
}: FlutterwavePaymentProps) => {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const publicKey = (import.meta as any).env?.VITE_FLUTTERWAVE_PUBLIC_KEY;

  // Load Flutterwave dynamic Inline script
  useEffect(() => {
    const scriptId = 'flutterwave-inline-checkout-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://checkout.flutterwave.com/v3.js';
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      script.onerror = () => {
        setError("Failed to load secure payment processor script.");
      };
      document.body.appendChild(script);
    } else {
      setScriptLoaded(true);
    }
  }, []);

  const handlePaymentInitiation = () => {
    setIsInitializing(true);
    setError(null);

    const txRef = `WSH-TX-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    try {
      if (!window.FlutterwaveCheckout) {
        throw new Error("Payment Gateway script not loaded completely yet. Please try again.");
      }

      window.FlutterwaveCheckout({
        public_key: publicKey,
        tx_ref: txRef,
        amount: amount,
        currency: "NGN",
        payment_options: "card, banktransfer, ussd",
        customer: {
          email: customerEmail,
          phonenumber: customerPhone,
          name: customerName,
        },
        meta: {
          shipmentId,
          trackingNumber
        },
        customizations: {
          title: "WeSabiHub Payment Protection",
          description: `Secure Protected Holding for Shipment #${trackingNumber}`,
          logo: "https://wesabihub.com/logo.png",
        },
        callback: (data: any) => {
          console.log("Flutterwave raw callback data:", data);
          if (data.status === "successful") {
            onSuccess(data);
          } else {
            setError("Transaction was not successful. Please try another card or payment method.");
          }
        },
        onclose: () => {
          setIsInitializing(false);
          onClose();
        }
      });
    } catch (err: any) {
      console.error("Flutterwave inline error:", err);
      setError(err.message || "Failed to initialize payment gateway.");
      setIsInitializing(false);
    }
  };

  // remove handleMockCardSubmit and handleMockOtpSubmit

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400 text-sm flex gap-3">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-bold">Payment Error</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <Card className="p-6 border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Shield className="text-primary-600 shrink-0" size={18} />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Payment Protection Gateway</span>
            </div>
            <h3 className="text-lg font-black dark:text-white font-display">Pay securely via Flutterwave</h3>
            <p className="text-xs text-slate-500 max-w-md">
              Your payment will be secured in a Payment Protection vault with our payment partners. Funds will only be released to the merchant once shipment delivery is verified.
            </p>
          </div>

          <div className="text-left md:text-right min-w-[120px]">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Total Amount Due</span>
            <span className="text-3xl font-black text-primary-600 font-display">₦{amount.toLocaleString()}</span>
          </div>
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-800 my-6" />

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handlePaymentInitiation}
            disabled={!scriptLoaded || isInitializing}
            className="flex-1 h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary-600/10 relative overflow-hidden"
          >
            {isInitializing ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="animate-spin" size={20} />
                Connecting Secure Gateway...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Lock size={18} />
                Pay ₦{amount.toLocaleString()} Now
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={onClose}
            className="h-14 rounded-2xl px-6 border-slate-200 dark:border-slate-800"
          >
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
};
