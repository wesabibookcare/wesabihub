import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck, ShieldAlert, FileText, Lock, DollarSign, ArrowRight, CheckCircle2,
  AlertCircle, ChevronRight, User, Package, RefreshCw, FileCode, Check, Send, AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Input } from '@/src/components/ui/Input';
import { toast } from 'sonner';
import { SafePayTransaction, SafePayAgreementTerms, SafePayFeePayer } from '@/src/types';
import { useNavigate, useParams } from 'react-router-dom';

const DEFAULT_TERMS: SafePayAgreementTerms = {
  itemName: '',
  productCategory: 'Electronics',
  itemCondition: 'New',
  testing: 'Testing allowed',
  testingDescription: '',
  warranty: 'No warranty',
  returnPolicy: 'Return only for defect',
  authenticity: 'Original',
  contents: 'Complete package',
  serialImei: 'Not required',
  serialImeiValue: '',
  packaging: 'Seller packaging',
  delivery: 'OmorfiHub Hub',
  deliveryMethod: 'OmorfiHub Hub',
  inspection: 'Standard SafePay inspection',
  defectDefinition: 'Item does not function as described',
  specialInstructions: ''
};

export const SafePayWorkspace = ({ transactionId: propTxId }: { transactionId?: string }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const txId = propTxId || params.id;

  const currentUserId = user?.uid || '';
  const currentUserName = user?.displayName || 'User';

  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState<SafePayTransaction | null>(null);

  // Form states for agreement proposal
  const [terms, setTerms] = useState<SafePayAgreementTerms>(DEFAULT_TERMS);
  const [feePayer, setFeePayer] = useState<SafePayFeePayer>('BUYER');
  const [customKey, setCustomKey] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [customTermsList, setCustomTermsList] = useState<Array<{ key: string; value: string }>>([]);

  // Acceptance checkboxes
  const [acceptTransactionTerms, setAcceptTransactionTerms] = useState(false);
  const [acceptSafePayTerms, setAcceptSafePayTerms] = useState(false);

  useEffect(() => {
    if (txId) {
      loadTransaction(txId);
    }
  }, [txId]);

  const loadTransaction = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/safepay/workspace/${id}`, {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken?.() || ''}`
        }
      });
      const data = await res.json();
      if (data.success && data.transaction) {
        setTransaction(data.transaction);
        const versions = data.transaction.versions || [];
        const latest = versions[versions.length - 1];
        if (latest) {
          setTerms(latest.terms || DEFAULT_TERMS);
          setFeePayer(latest.feePayer || 'BUYER');
          if (latest.terms?.customTerms) {
            setCustomTermsList(latest.terms.customTerms);
          }
        }
      } else {
        toast.error(data.error || 'Failed to load SafePay transaction');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Could not fetch SafePay workspace details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomTerm = () => {
    if (!customKey.trim() || !customValue.trim()) return;
    const updated = [...customTermsList, { key: customKey.trim(), value: customValue.trim() }];
    setCustomTermsList(updated);
    setCustomKey('');
    setCustomValue('');
  };

  const handleAcceptAgreement = async () => {
    if (!txId) return;
    if (!acceptTransactionTerms || !acceptSafePayTerms) {
      toast.error('You must acknowledge both Transaction Terms and SafePay Terms & Conditions');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/safepay/workspace/${txId}/agreement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken?.() || ''}`
        },
        body: JSON.stringify({
          action: 'ACCEPT',
          safePayTermsAccepted: acceptSafePayTerms
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Agreement accepted successfully!');
        setTransaction(data.transaction);
      } else {
        toast.error(data.error || 'Acceptance failed');
      }
    } catch (err: any) {
      toast.error('Failed to submit acceptance');
    } finally {
      setLoading(false);
    }
  };

  const handleProposeNewVersion = async () => {
    if (!txId) return;
    setLoading(true);
    try {
      const payloadTerms = {
        ...terms,
        customTerms: customTermsList
      };

      const res = await fetch(`/api/safepay/workspace/${txId}/agreement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken?.() || ''}`
        },
        body: JSON.stringify({
          action: 'PROPOSE_NEW',
          terms: payloadTerms,
          feePayer,
          safePayTermsAccepted: acceptSafePayTerms
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('New agreement version proposed!');
        setTransaction(data.transaction);
      } else {
        toast.error(data.error || 'Proposal failed');
      }
    } catch (err: any) {
      toast.error('Failed to propose new terms');
    } finally {
      setLoading(false);
    }
  };

  if (!transaction) {
    return (
      <Card className="p-8 text-center space-y-4">
        <ShieldCheck className="mx-auto text-primary-600 animate-pulse" size={40} />
        <p className="font-bold text-slate-700 dark:text-slate-300">Loading SafePay Transaction Workspace...</p>
      </Card>
    );
  }

  const isBuyer = transaction.buyerId === currentUserId;
  const isSeller = transaction.sellerId === currentUserId;

  const versions = transaction.versions || [];
  const activeVersion = versions[versions.length - 1];
  const isAgreed = transaction.status === 'AGREED' || transaction.paymentStatus === 'FUNDS_SECURED';

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Short Description Banner */}
      <Card className="p-4 bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/40 rounded-2xl flex items-start gap-3">
        <ShieldCheck className="text-primary-600 shrink-0 mt-0.5" size={20} />
        <p className="text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed font-medium">
          SafePay is a separate protected transaction service for buyer–seller purchases. It helps protect the agreed transaction through payment, evidence, inspection and resolution. SafePay is independent of OmorfiHub logistics and is not OmorfiHub's ordinary payment system.
        </p>
      </Card>

      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="info" className="uppercase font-bold tracking-wider text-[9px]">
              SafePay Transaction #{transaction.transactionId}
            </Badge>
            <Badge variant={isAgreed ? 'success' : 'warning'} className="uppercase font-bold text-[9px]">
              {transaction.status}
            </Badge>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white font-display">
            {transaction.itemTitle}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Buyer: <span className="font-bold dark:text-slate-300">{transaction.buyerName}</span> • Seller: <span className="font-bold dark:text-slate-300">{transaction.sellerName}</span>
          </p>
        </div>

        <div className="text-right border-l md:border-l-0 border-slate-100 pl-4 md:pl-0">
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Total Authoritative Amount</p>
          <p className="text-3xl font-black text-primary-600 font-display">
            ₦{transaction.authoritativePaymentRequired?.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-500 font-medium">
            Item Price: ₦{transaction.agreedAmount?.toLocaleString()} • SafePay Fee: ₦{transaction.feeAmount?.toLocaleString()} ({transaction.feePayer})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Agreement Terms View / Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-6 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base dark:text-white flex items-center gap-2 font-display">
                <FileText size={18} className="text-primary-600" />
                Layer 2: Buyer/Seller Transaction Terms (Version #{activeVersion?.version || 1})
              </h3>
              <Badge variant="outline" className="font-mono text-[10px]">
                {activeVersion?.status}
              </Badge>
            </div>

            {/* Dropdown Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Product / Item Name</label>
                <Input
                  disabled={isAgreed}
                  value={terms.itemName || ''}
                  onChange={e => setTerms({ ...terms, itemName: e.target.value })}
                  placeholder="e.g. iPhone 15 Pro Max 256GB"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Product Category</label>
                <select
                  disabled={isAgreed}
                  value={terms.productCategory || 'Electronics'}
                  onChange={e => setTerms({ ...terms, productCategory: e.target.value })}
                  className="w-full p-2.5 border rounded-xl dark:bg-slate-900 dark:text-white"
                >
                  <option value="Electronics">Electronics (Phones, Laptops, Gadgets)</option>
                  <option value="Fashion">Fashion & Apparel</option>
                  <option value="Home & Office">Home & Office Appliances</option>
                  <option value="Vehicles">Vehicles & Automotive Parts</option>
                  <option value="Beauty">Beauty & Personal Care</option>
                  <option value="Furniture">Furniture & Decor</option>
                  <option value="General Goods">Other General Goods</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Item Condition</label>
                <select
                  disabled={isAgreed}
                  value={terms.itemCondition}
                  onChange={e => setTerms({ ...terms, itemCondition: e.target.value })}
                  className="w-full p-2.5 border rounded-xl dark:bg-slate-900 dark:text-white"
                >
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Used — Excellent">Used — Excellent</option>
                  <option value="Used — Good">Used — Good</option>
                  <option value="Used — Fair">Used — Fair</option>
                  <option value="Used — Poor">Used — Poor</option>
                  <option value="Refurbished">Refurbished</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Testing Permission</label>
                <select
                  disabled={isAgreed}
                  value={terms.testing}
                  onChange={e => setTerms({ ...terms, testing: e.target.value })}
                  className="w-full p-2.5 border rounded-xl dark:bg-slate-900 dark:text-white"
                >
                  <option value="Testing allowed">Testing allowed</option>
                  <option value="Testing not allowed">Testing not allowed</option>
                  <option value="Specific test agreed">Specific test agreed</option>
                </select>
                {terms.testing === 'Specific test agreed' && (
                  <Input
                    disabled={isAgreed}
                    value={terms.testingDescription || ''}
                    onChange={e => setTerms({ ...terms, testingDescription: e.target.value })}
                    placeholder="Describe specific testing agreed..."
                    className="mt-1 text-xs"
                  />
                )}
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Warranty</label>
                <select
                  disabled={isAgreed}
                  value={terms.warranty}
                  onChange={e => setTerms({ ...terms, warranty: e.target.value })}
                  className="w-full p-2.5 border rounded-xl dark:bg-slate-900 dark:text-white"
                >
                  <option value="No warranty">No warranty</option>
                  <option value="Manufacturer warranty">Manufacturer warranty</option>
                  <option value="Seller warranty">Seller warranty</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Return Policy</label>
                <select
                  disabled={isAgreed}
                  value={terms.returnPolicy}
                  onChange={e => setTerms({ ...terms, returnPolicy: e.target.value })}
                  className="w-full p-2.5 border rounded-xl dark:bg-slate-900 dark:text-white"
                >
                  <option value="No return">No return</option>
                  <option value="Return within 3 days">Return within 3 days</option>
                  <option value="Return only for defect">Return only for defect</option>
                  <option value="Return if not as described">Return if not as described</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Authenticity</label>
                <select
                  disabled={isAgreed}
                  value={terms.authenticity}
                  onChange={e => setTerms({ ...terms, authenticity: e.target.value })}
                  className="w-full p-2.5 border rounded-xl dark:bg-slate-900 dark:text-white"
                >
                  <option value="Original">Original</option>
                  <option value="Refurbished">Refurbished</option>
                  <option value="Compatible/aftermarket">Compatible/aftermarket</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Contents</label>
                <select
                  disabled={isAgreed}
                  value={terms.contents}
                  onChange={e => setTerms({ ...terms, contents: e.target.value })}
                  className="w-full p-2.5 border rounded-xl dark:bg-slate-900 dark:text-white"
                >
                  <option value="Main item only">Main item only</option>
                  <option value="Item + accessories">Item + accessories</option>
                  <option value="Complete package">Complete package</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Serial / IMEI</label>
                <select
                  disabled={isAgreed}
                  value={terms.serialImei}
                  onChange={e => setTerms({ ...terms, serialImei: e.target.value })}
                  className="w-full p-2.5 border rounded-xl dark:bg-slate-900 dark:text-white"
                >
                  <option value="Required">Required</option>
                  <option value="Not required">Not required</option>
                </select>
                {terms.serialImei === 'Required' && (
                  <Input
                    disabled={isAgreed}
                    value={terms.serialImeiValue || ''}
                    onChange={e => setTerms({ ...terms, serialImeiValue: e.target.value })}
                    placeholder="Enter Serial # or IMEI..."
                    className="mt-1 text-xs"
                  />
                )}
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Packaging</label>
                <select
                  disabled={isAgreed}
                  value={terms.packaging}
                  onChange={e => setTerms({ ...terms, packaging: e.target.value })}
                  className="w-full p-2.5 border rounded-xl dark:bg-slate-900 dark:text-white"
                >
                  <option value="Original packaging">Original packaging</option>
                  <option value="Seller packaging">Seller packaging</option>
                  <option value="Special packaging requirement">Special packaging requirement</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Logistics / Delivery Choice</label>
                <select
                  disabled={isAgreed}
                  value={terms.delivery}
                  onChange={e => setTerms({ ...terms, delivery: e.target.value })}
                  className="w-full p-2.5 border rounded-xl dark:bg-slate-900 dark:text-white"
                >
                  <option value="OmorfiHub Hub">OmorfiHub Hub</option>
                  <option value="OmorfiHub Dispatch Rider">OmorfiHub Dispatch Rider</option>
                  <option value="Seller delivery">Seller delivery</option>
                  <option value="Buyer pickup">Buyer pickup</option>
                  <option value="External courier">External courier</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Inspection Standard</label>
                <select
                  disabled={isAgreed}
                  value={terms.inspection}
                  onChange={e => setTerms({ ...terms, inspection: e.target.value })}
                  className="w-full p-2.5 border rounded-xl dark:bg-slate-900 dark:text-white"
                >
                  <option value="Standard SafePay inspection">Standard SafePay inspection</option>
                  <option value="Custom agreed inspection">Custom agreed inspection</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1 text-xs">Defect Definition</label>
              <select
                disabled={isAgreed}
                value={terms.defectDefinition}
                onChange={e => setTerms({ ...terms, defectDefinition: e.target.value })}
                className="w-full p-2.5 border rounded-xl dark:bg-slate-900 dark:text-white text-xs"
              >
                <option value="Item does not function as described">Item does not function as described</option>
                <option value="Material difference from agreement">Material difference from agreement</option>
                <option value="Missing agreed component">Missing agreed component</option>
                <option value="Damage not disclosed">Damage not disclosed</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1 text-xs">Special Instructions</label>
              <textarea
                disabled={isAgreed}
                value={terms.specialInstructions || ''}
                onChange={e => setTerms({ ...terms, specialInstructions: e.target.value })}
                placeholder="Custom requirements or testing protocols agreed..."
                className="w-full p-2.5 border rounded-xl dark:bg-slate-900 dark:text-white text-xs min-h-[60px]"
              />
            </div>

            {/* Custom Terms section */}
            {!isAgreed && (
              <div className="space-y-3 border-t pt-4 border-slate-100 dark:border-slate-800">
                <p className="font-bold text-xs text-slate-700 dark:text-slate-300">Add Custom Term</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Term Name (e.g. Serial #)"
                    value={customKey}
                    onChange={e => setCustomKey(e.target.value)}
                    className="text-xs"
                  />
                  <Input
                    placeholder="Value (e.g. SN-884912)"
                    value={customValue}
                    onChange={e => setCustomValue(e.target.value)}
                    className="text-xs"
                  />
                  <Button size="sm" onClick={handleAddCustomTerm} type="button" className="shrink-0 text-xs">
                    Add
                  </Button>
                </div>
              </div>
            )}

            {/* Custom Terms List */}
            {customTermsList.length > 0 && (
              <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                {customTermsList.map((ct, idx) => (
                  <div key={idx} className="flex justify-between font-mono">
                    <span className="font-bold text-slate-600 dark:text-slate-400">{ct.key}:</span>
                    <span className="dark:text-slate-200">{ct.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Fee Responsibility Selector */}
            <div className="space-y-2 border-t pt-4 border-slate-100 dark:border-slate-800">
              <label className="font-bold text-xs text-slate-700 dark:text-slate-300 block">
                Who pays the SafePay Service Fee (₦{transaction.feeAmount?.toLocaleString()})?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'BUYER', label: 'Buyer Pays' },
                  { id: 'SELLER', label: 'Seller Pays' },
                  { id: 'SPLIT', label: 'Split 50/50' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    disabled={isAgreed}
                    type="button"
                    onClick={() => setFeePayer(opt.id as SafePayFeePayer)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      feePayer === opt.id
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dual Acceptance Controls */}
            <div className="space-y-4 border-t pt-4 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 p-4 rounded-2xl">
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Party Acceptance Acknowledgement
              </h4>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={acceptTransactionTerms}
                    onChange={e => setAcceptTransactionTerms(e.target.checked)}
                    disabled={isAgreed}
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>
                    {isBuyer ? "I agree to the Seller's transaction terms shown above." : "I agree to the Buyer's transaction terms shown above."}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={acceptSafePayTerms}
                    onChange={e => setAcceptSafePayTerms(e.target.checked)}
                    disabled={isAgreed}
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>I have read and agree to the <strong>Layer 1: SafePay Terms & Conditions</strong>.</span>
                </label>
              </div>

              {!isAgreed && (
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleAcceptAgreement}
                    disabled={loading || !acceptTransactionTerms || !acceptSafePayTerms}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl flex-1"
                  >
                    <Check className="mr-1" size={14} /> Accept & Lock Version #{activeVersion?.version}
                  </Button>

                  <Button
                    onClick={handleProposeNewVersion}
                    disabled={loading}
                    variant="outline"
                    className="text-xs rounded-xl flex-1 border-slate-300"
                  >
                    <Send className="mr-1" size={14} /> Propose Version #{ (activeVersion?.version || 1) + 1 }
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar Status, Fee Breakdown, Payment Checkout & Actions */}
        <div className="space-y-6">
          {/* Status Overview */}
          <Card className="p-6 space-y-4 border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm dark:text-white uppercase tracking-wider text-slate-400">
              SafePay Status Engine
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Agreement State:</span>
                <Badge variant={isAgreed ? 'success' : 'warning'}>{transaction.status}</Badge>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Buyer Status:</span>
                <span className="font-bold">{activeVersion?.buyerAccepted ? 'ACCEPTED' : 'PENDING'}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Seller Status:</span>
                <span className="font-bold">{activeVersion?.sellerAccepted ? 'ACCEPTED' : 'PENDING'}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Payment Protection:</span>
                <span className="font-bold">{transaction.paymentStatus || 'UNPAID'}</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Escrow Gateway:</span>
                <span className="font-mono font-bold text-indigo-600">Flutterwave</span>
              </div>
            </div>

            {/* Payment Checkout trigger if AGREED and UNPAID */}
            {isAgreed && transaction.paymentStatus !== 'FUNDS_SECURED' && transaction.paymentStatus !== 'RELEASED' && isBuyer && (
              <Button
                onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await fetch('/api/payment-protection/initialize', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${await user?.getIdToken?.() || ''}`
                      },
                      body: JSON.stringify({
                        shipmentId: transaction.transactionId,
                        amount: transaction.authoritativePaymentRequired,
                        customerEmail: transaction.buyerEmail || user?.email || 'buyer@omorfihub.com',
                        customerName: transaction.buyerName,
                        merchantId: transaction.sellerId,
                        trackingNumber: transaction.transactionId
                      })
                    });
                    const data = await res.json();
                    if (data.checkoutUrl) {
                      window.location.href = data.checkoutUrl;
                    } else if (data.error) {
                      toast.error(data.error);
                    }
                  } catch (e: any) {
                    toast.error('Payment checkout failed to initialize');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 text-xs rounded-xl shadow-md"
              >
                <Lock size={14} className="mr-1.5" /> Pay ₦{transaction.authoritativePaymentRequired?.toLocaleString()} via Flutterwave
              </Button>
            )}

            {/* Release funds trigger if FUNDS_SECURED */}
            {transaction.paymentStatus === 'FUNDS_SECURED' && isBuyer && (
              <Button
                onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await fetch('/api/payment-protection/release', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${await user?.getIdToken?.() || ''}`
                      },
                      body: JSON.stringify({
                        paymentProtectionId: transaction.transactionId
                      })
                    });
                    const data = await res.json();
                    if (data.success) {
                      toast.success('Funds successfully released to seller');
                      loadTransaction(transaction.transactionId);
                    } else {
                      toast.error(data.error || 'Release failed');
                    }
                  } catch (e: any) {
                    toast.error('Failed to release payment');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 text-xs rounded-xl shadow-md"
              >
                <CheckCircle2 size={14} className="mr-1.5" /> Confirm Inspection & Release Funds
              </Button>
            )}
          </Card>

          {/* Fee Snapshot Breakdown */}
          <Card className="p-6 space-y-3 bg-slate-900 text-white rounded-2xl">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Server Fee Snapshot
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Agreed Item Price:</span>
                <span className="font-bold font-mono">₦{transaction.agreedAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>SafePay Fee (Snapshotted):</span>
                <span className="font-bold font-mono text-amber-400">₦{transaction.feeAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 border-t border-slate-800 pt-2">
                <span>Buyer Share:</span>
                <span>₦{transaction.buyerFeeShare?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Seller Share:</span>
                <span>₦{transaction.sellerFeeShare?.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {/* Immutable Version History */}
          <Card className="p-6 space-y-3 border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Immutable Agreement History
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {versions.map((ver, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between font-bold">
                    <span>Version #{ver.version}</span>
                    <Badge variant={ver.status === 'AGREED' ? 'success' : ver.status === 'SUPERSEDED' ? 'outline' : 'warning'} className="text-[8px]">
                      {ver.status}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Proposed by {ver.proposerRole} at {new Date(ver.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
