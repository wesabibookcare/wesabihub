import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Loader2, ArrowLeft, Calendar, User, MapPin, Package, Check, RefreshCw, FileText } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { motion } from 'motion/react';

export const VerifyReceiptPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<any>(null);
  const [receiptId, setReceiptId] = useState('');

  useEffect(() => {
    const verifyToken = async (id: string) => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/receipts/verify/${id}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || 'Receipt verification failed. This document is not in our system or may be forged.');
        } else {
          setReceipt(data.record);
        }
      } catch (err: any) {
        console.error('Verification error:', err);
        setError('Verification network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  if (!token && !receipt) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <Card className="p-8 shadow-2xl border-slate-200/80 dark:border-slate-900 bg-white dark:bg-slate-900/40 backdrop-blur-md rounded-[32px] w-full max-w-xl text-center space-y-6">
            <h2 className="text-2xl font-black font-display text-slate-900 dark:text-white">Verify Receipt</h2>
            <input
                type="text"
                placeholder="Enter Receipt ID"
                value={receiptId}
                onChange={(e) => setReceiptId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-950 dark:text-white"
            />
            <Button onClick={() => {
                const searchParams = new URLSearchParams(window.location.search);
                searchParams.set('token', receiptId);
                window.location.search = searchParams.toString();
            }} className="rounded-2xl h-12 px-8 shadow-lg shadow-primary-500/10">
                Verify
            </Button>
        </Card>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Branding Header */}
      <div className="flex items-center gap-2 mb-8 select-none">
        <div className="h-10 w-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-black font-display text-lg shadow-lg shadow-primary-500/20">
          W
        </div>
        <div>
          <span className="font-display font-black text-lg tracking-tight text-slate-800 dark:text-white">WeSabi<span className="text-primary-600">Hub</span></span>
          <span className="text-[10px] block font-mono text-slate-800 font-bold uppercase tracking-widest">Certified Ledger Registry</span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-xl"
      >
        <Card className="p-8 shadow-2xl border-slate-200/80 dark:border-slate-900 bg-white dark:bg-slate-900/40 backdrop-blur-md rounded-[32px] relative overflow-hidden">

          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="animate-spin text-primary-600" size={40} />
              <p className="text-sm font-medium text-slate-900">Querying immutable distributed ledger registry...</p>
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-6 space-y-6">
              <div className="h-16 w-16 bg-rose-50 dark:bg-rose-950/20 rounded-full flex items-center justify-center mx-auto text-rose-500">
                <ShieldAlert size={36} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black font-display text-slate-900 dark:text-white">Counterfeit / Invalid Document</h2>
                <p className="text-sm text-slate-900 max-w-md mx-auto">{error}</p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 text-left text-xs leading-relaxed">
                <strong>Attention Holder:</strong> Valid WeSabiHub digital receipts contain cryptographic signatures backed by real-time Firestore ledger audits. If you believe this receipt is valid, please contact dispatch operations support.
              </div>
              <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild variant="outline" className="rounded-2xl h-12 px-6">
                  <Link to="/">
                    <ArrowLeft size={16} className="mr-2" /> Back to Home
                  </Link>
                </Button>
                <Button onClick={() => window.location.reload()} className="rounded-2xl h-12 px-6">
                  <RefreshCw size={16} className="mr-2" /> Retry Verification
                </Button>
              </div>
            </div>
          )}

          {!loading && receipt && (
            <div className="space-y-6">
              {/* Badge Signature Verification */}
              <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100 dark:border-slate-800/80">
                <div className="h-16 w-16 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center justify-center text-emerald-500 mb-4 animate-pulse">
                  <ShieldCheck size={40} />
                </div>
                <Badge variant="success" className="text-xs px-4 py-1 rounded-full mb-2 font-bold tracking-wider uppercase">
                  ✓ Krypton Verified
                </Badge>
                <h2 className="text-2xl font-black font-display text-slate-900 dark:text-white">Immutable Receipt Secured</h2>
                <p className="text-xs text-slate-800 font-mono mt-1">Registry Ref: {receipt.receiptId}</p>
              </div>

              {/* Receipt Information */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Document Registry Details</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-800 uppercase block">Operation Type</span>
                    <strong className="text-sm text-slate-800 dark:text-white font-bold flex items-center gap-1.5">
                      <FileText size={14} className="text-primary-500" />
                      {receipt.type === 'INTAKE' ? 'PARCEL INTAKE (RECEIPT)' : 'PARCEL RELEASE (COLLECTION)'}
                    </strong>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-800 uppercase block">Date & Time</span>
                    <strong className="text-xs text-slate-800 dark:text-white font-mono flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-800" />
                      {new Date(receipt.createdAt).toLocaleString()}
                    </strong>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-800 uppercase block">Tracking Reference</span>
                    <strong className="text-sm text-slate-800 dark:text-white font-mono font-bold flex items-center gap-1.5">
                      <Package size={14} className="text-primary-500" />
                      {receipt.trackingNumber}
                    </strong>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-800 uppercase block">Processing Hub</span>
                    <strong className="text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                      <MapPin size={14} className="text-slate-800" />
                      {receipt.hubName}
                    </strong>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-800 uppercase block">Authorized Officer</span>
                    <strong className="text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                      <User size={14} className="text-slate-800" />
                      {receipt.staffName}
                    </strong>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-800 uppercase block">Weight / Load</span>
                    <strong className="text-sm text-slate-800 dark:text-white">
                      {receipt.weight} kg
                    </strong>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Customer / Recipient Profile</h3>
                  <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-800 text-xs">Name</span>
                      <strong className="dark:text-white font-bold">{receipt.customerName}</strong>
                    </div>
                    {receipt.customerPhone && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-800 text-xs">Contact Line</span>
                        <strong className="dark:text-white font-mono">{receipt.customerPhone}</strong>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-800/50">
                      <span className="text-slate-800 text-xs">Packaging Condition</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                        <Check size={14} /> {receipt.packagingCondition}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-800 text-xs">Stored Location</span>
                      <strong className="dark:text-white font-semibold">{receipt.shelfLocation}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex justify-center">
                  <Button asChild className="rounded-2xl h-12 px-8 shadow-lg shadow-primary-500/10">
                    <Link to="/">
                      <ArrowLeft size={16} className="mr-2" /> Finish & Return Home
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

        </Card>
      </motion.div>
    </div>
  );
};
