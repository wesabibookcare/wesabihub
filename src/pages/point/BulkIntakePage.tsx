import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { PointLayout } from '@/src/layouts/PointLayout';
import { useAuth } from '@/src/context/AuthContext';
import { workflowEngine } from '@/src/engines/WorkflowEngine';
import { bulkIntakeEngine } from '@/src/engines/BulkIntakeEngine';
import {
  Scan,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Layers,
  Package,
  Building2,
  User,
  ArrowRight,
  RefreshCw,
  FileText,
  Check,
  ShieldAlert,
  Copy,
  MapPin,
  Camera,
  Info,
  Archive,
  BarChart3
} from 'lucide-react';
import { BulkIntakeSession,
  ParcelCondition,
  IntakeScanItem,
  BulkIntakeSummary
} from '@/src/types/bulkIntake';

const CONDITION_OPTIONS: { value: ParcelCondition; label: string; isException: boolean }[] = [
  { value: 'GOOD', label: 'Good / Intact', isException: false },
  { value: 'DAMAGED', label: 'Damaged Packaging', isException: true },
  { value: 'WET', label: 'Wet / Moisture Damage', isException: true },
  { value: 'BROKEN_SEAL', label: 'Broken Seal / Opened', isException: true },
  { value: 'WRONG_LABEL', label: 'Wrong / Unreadable Label', isException: true },
  { value: 'WRONG_DESTINATION', label: 'Wrong Destination Hub', isException: true },
  { value: 'MISSING_ITEMS', label: 'Missing Items / Partial', isException: true },
  { value: 'QUANTITY_MISMATCH', label: 'Quantity Mismatch', isException: true },
  { value: 'TAMPERED_PACKAGE', label: 'Tampered Package', isException: true },
  { value: 'ILLEGAL_GOODS', label: 'Illegal / Contraband (Hold)', isException: true },
  { value: 'DANGEROUS_GOODS', label: 'Dangerous Goods (Hold)', isException: true },
  { value: 'OTHER', label: 'Other Exception', isException: true }
];

export const BulkIntakePage: React.FC = () => {
  const { user } = useAuth();
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Authorization Check
  const allowedRoles = ['CENTER_STAFF', 'HUB_OWNER', 'POINT_ADMIN', 'POINT_STAFF', 'ADMIN', 'SUPER_ADMIN'];
  const isAuthorized = user && allowedRoles.includes(user.role);

  // State Management
  const [session, setSession] = useState<BulkIntakeSession | null>(null);
  const [shipmentIdInput, setShipmentIdInput] = useState('');
  const [merchantIdInput, setMerchantIdInput] = useState('');
  const [isStartingSession, setIsStartingSession] = useState(false);

  // Scan controls
  const [parcelInput, setParcelInput] = useState('');
  const [selectedCondition, setSelectedCondition] = useState<ParcelCondition>('GOOD');
  const [scanNotes, setScanNotes] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [isProcessingScan, setIsProcessingScan] = useState(false);

  // Status & Feedback
  const [lastScanResult, setLastScanResult] = useState<{
    type: 'success' | 'duplicate' | 'exception' | 'error';
    message: string;
    shelf?: string;
    tracking?: string;
  } | null>(null);

  // Final Summary State
  const [summary, setSummary] = useState<BulkIntakeSummary | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Auto-focus scanner on active intake
  useEffect(() => {
    if (session && session.status === 'IN_INTAKE_PROGRESS' && scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [session, lastScanResult]);

  // Handle Session Start
  const handleStartSession = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;

    if (!shipmentIdInput.trim()) {
      toast.error('Please enter a Parent Shipment ID or Bulk Reference');
      return;
    }

    setIsStartingSession(true);
    try {
      const hubId = user.hubId || 'HUB-101';
      const response = await workflowEngine.startBulkIntakeWorkflow(
        { id: user.uid, role: user.role, name: user.name, hubId },
        hubId,
        merchantIdInput.trim() || user.uid,
        shipmentIdInput.trim()
      );

      if (response.success && response.data) {
        setSession(response.data as BulkIntakeSession);
        setSummary(null);
        setLastScanResult(null);
        toast.success(`Intake Session Initialized for Shipment ${shipmentIdInput}`);
      } else {
        toast.error(response.message || 'Failed to start Bulk Intake session');
      }
    } catch (err: any) {
      toast.error('Error initializing intake session: ' + err.message);
    } finally {
      setIsStartingSession(false);
    }
  };

  // Handle Parcel Scan
  const handleProcessScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!session || !parcelInput.trim() || !user) return;

    const currentInput = parcelInput.trim();
    setIsProcessingScan(true);

    try {
      const response = await workflowEngine.processBulkParcelScanWorkflow(
        { id: user.uid, role: user.role },
        session.id,
        currentInput,
        selectedCondition,
        scanNotes,
        evidenceUrl
      );

      // Refresh Session State
      const updatedSession = await bulkIntakeEngine.getSession(session.id);
      if (updatedSession) {
        setSession(updatedSession);
      }

      if (response.success) {
        const scanData = response.data;
        if (scanData?.isDuplicate) {
          setLastScanResult({
            type: 'duplicate',
            message: response.message,
            shelf: scanData.scanItem?.shelfLocation,
            tracking: currentInput
          });
          toast.warning(`Duplicate Scan: ${currentInput}`);
        } else if (scanData?.hasException) {
          setLastScanResult({
            type: 'exception',
            message: response.message,
            tracking: currentInput
          });
          toast.info(`Exception Logged: ${currentInput}`);
        } else {
          setLastScanResult({
            type: 'success',
            message: response.message,
            shelf: scanData?.scanItem?.shelfLocation,
            tracking: currentInput
          });
          toast.success(`Parcel Checked In: ${currentInput}`);
        }
      } else {
        setLastScanResult({
          type: 'error',
          message: response.message || 'Parcel intake failed',
          tracking: currentInput
        });
        toast.error(`Intake Failed: ${response.message}`);
      }

      // Reset scan inputs for next item (Non-blocking continuous scanning)
      setParcelInput('');
      setSelectedCondition('GOOD');
      setScanNotes('');
      setEvidenceUrl('');

      // Refocus input field
      if (scanInputRef.current) {
        scanInputRef.current.focus();
      }
    } catch (err: any) {
      toast.error('Scan processing error: ' + err.message);
    } finally {
      setIsProcessingScan(false);
    }
  };

  // Handle Finalize Session
  const handleFinalizeSession = async () => {
    if (!session || !user) return;

    setIsFinalizing(true);
    try {
      const response = await workflowEngine.finalizeBulkIntakeWorkflow(
        { id: user.uid, role: user.role },
        session.id
      );

      if (response.success && response.data) {
        const finalSummary = response.data as BulkIntakeSummary;
        setSummary(finalSummary);
        setSession(prev => prev ? { ...prev, status: 'COMPLETED' } : null);
        toast.success('Bulk Intake Session finalized successfully!');
      } else {
        toast.error(response.message || 'Failed to finalize session');
      }
    } catch (err: any) {
      toast.error('Error finalizing session: ' + err.message);
    } finally {
      setIsFinalizing(false);
    }
  };

  // Reset page for new session
  const handleResetForNewSession = () => {
    setSession(null);
    setSummary(null);
    setShipmentIdInput('');
    setMerchantIdInput('');
    setParcelInput('');
    setLastScanResult(null);
  };

  // Render Access Denied for unauthorized roles
  if (!isAuthorized) {
    return (
      <PointLayout>
        <div className="max-w-3xl mx-auto mt-12 p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Hub Operations Only</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Bulk Parcel Check-In is restricted to authenticated Hub Point Owners and Center Operations Staff.
            Your current role (<span className="font-semibold text-slate-800">{user?.role || 'Guest'}</span>) does not have permission to execute physical parcel intake.
          </p>
        </div>
      </PointLayout>
    );
  }

  const scannedList = session?.scannedItems || [];
  const processedCount = session?.processedParcels.length || 0;
  const expectedTotal = session?.totalParcels || 1;
  const exceptionCount = session ? Object.keys(session.exceptions).length : 0;
  const duplicateCount = session?.duplicateScansCount || 0;
  const progressPct = Math.min(100, Math.round((processedCount / Math.max(1, expectedTotal)) * 100));

  return (
    <PointLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary-600 uppercase tracking-wider mb-1">
              <Layers size={14} />
              WeSabiHub Hub Operations
            </div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              Bulk Parcel Intake Engine
              {session && (
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  session.status === 'IN_INTAKE_PROGRESS'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {session.status === 'IN_INTAKE_PROGRESS' ? 'Active Session' : 'Completed'}
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Physical receiving, barcode scanning, condition grading, and automatic shelf allocation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right text-xs text-slate-500 hidden sm:block">
              <div className="font-medium text-slate-900">{user.name}</div>
              <div>Hub: {user.hubId || 'HUB-101'}</div>
            </div>
            {session && session.status === 'IN_INTAKE_PROGRESS' && (
              <button
                onClick={handleFinalizeSession}
                disabled={isFinalizing}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                {isFinalizing ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                Finalize Intake Session
              </button>
            )}
          </div>
        </div>

        {/* SUMMARY MODAL / VIEW (IF COMPLETED) */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-950 text-white p-6 rounded-2xl shadow-lg border border-emerald-800 space-y-6"
          >
            <div className="flex items-center justify-between border-b border-emerald-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-800 rounded-xl">
                  <CheckCircle2 className="text-emerald-300" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Bulk Intake Session Finalized</h3>
                  <p className="text-xs text-emerald-300">Session Ref: {summary.sessionId}</p>
                </div>
              </div>
              <button
                onClick={handleResetForNewSession}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition"
              >
                Start New Session
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
              <div className="bg-emerald-900/60 p-3 rounded-xl border border-emerald-800/50">
                <div className="text-xs text-emerald-300">Expected</div>
                <div className="text-2xl font-bold mt-1">{summary.totalExpected}</div>
              </div>
              <div className="bg-emerald-900/60 p-3 rounded-xl border border-emerald-800/50">
                <div className="text-xs text-emerald-300">Accepted</div>
                <div className="text-2xl font-bold text-emerald-300 mt-1">{summary.acceptedCount}</div>
              </div>
              <div className="bg-emerald-900/60 p-3 rounded-xl border border-emerald-800/50">
                <div className="text-xs text-emerald-300">Exceptions</div>
                <div className="text-2xl font-bold text-amber-300 mt-1">{summary.exceptionCount}</div>
              </div>
              <div className="bg-emerald-900/60 p-3 rounded-xl border border-emerald-800/50">
                <div className="text-xs text-emerald-300">Duplicates</div>
                <div className="text-2xl font-bold text-sky-300 mt-1">{summary.duplicateCount}</div>
              </div>
              <div className="bg-emerald-900/60 p-3 rounded-xl border border-emerald-800/50">
                <div className="text-xs text-emerald-300">Unprocessed</div>
                <div className="text-2xl font-bold text-slate-300 mt-1">{summary.unprocessedCount}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SESSION INITIATION FORM (IF NO ACTIVE SESSION) */}
        {!session && !summary && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
                <Package size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Start Bulk Intake Session</h2>
                <p className="text-xs text-slate-500">Scan or enter parent shipment ID to begin receiving parcels.</p>
              </div>
            </div>

            <form onSubmit={handleStartSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Parent Shipment ID / Bulk Reference *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={shipmentIdInput}
                    onChange={(e) => setShipmentIdInput(e.target.value)}
                    placeholder="e.g. SHIP-1001 or BULK-2026-908"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                    required
                  />
                  <Scan className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Merchant / Sender ID (Optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={merchantIdInput}
                    onChange={(e) => setMerchantIdInput(e.target.value)}
                    placeholder="Merchant ID or leave blank to auto-detect"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                  />
                  <Building2 className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isStartingSession || !shipmentIdInput.trim()}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  {isStartingSession ? <RefreshCw className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                  Initialize Bulk Intake Session
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ACTIVE SESSION DASHBOARD */}
        {session && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SCANNING CONTROLS (LEFT 2 COLS) */}
            <div className="lg:col-span-2 space-y-6">
              {/* SESSION METRICS BAR */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Intake Progress Overview
                  </div>
                  <div className="text-xs font-semibold text-slate-900">
                    {processedCount} of {expectedTotal} Parcels ({progressPct}%)
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Scanned</div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">{processedCount}</div>
                  </div>
                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                    <div className="text-[10px] text-emerald-700 uppercase font-semibold">Accepted</div>
                    <div className="text-lg font-bold text-emerald-800 mt-0.5">
                      {processedCount - exceptionCount}
                    </div>
                  </div>
                  <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                    <div className="text-[10px] text-amber-700 uppercase font-semibold">Exceptions</div>
                    <div className="text-lg font-bold text-amber-800 mt-0.5">{exceptionCount}</div>
                  </div>
                  <div className="bg-sky-50 p-2.5 rounded-xl border border-sky-100">
                    <div className="text-[10px] text-sky-700 uppercase font-semibold">Duplicates</div>
                    <div className="text-lg font-bold text-sky-800 mt-0.5">{duplicateCount}</div>
                  </div>
                </div>
              </div>

              {/* SCANNER INPUT CARD */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Scan className="text-primary-600" size={20} />
                    <h2 className="text-base font-bold text-slate-900">Live Parcel Barcode Scanner</h2>
                  </div>
                  <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Ready for Scan
                  </span>
                </div>

                <form onSubmit={handleProcessScan} className="space-y-4">
                  <div className="relative">
                    <input
                      ref={scanInputRef}
                      type="text"
                      value={parcelInput}
                      onChange={(e) => setParcelInput(e.target.value)}
                      placeholder="Scan parcel barcode or enter Tracking ID..."
                      disabled={session.status === 'COMPLETED'}
                      className="w-full pl-11 pr-24 py-3.5 bg-slate-50 border-2 border-primary-200 rounded-xl text-base font-mono font-bold text-slate-900 focus:bg-white focus:border-primary-600 focus:outline-none focus:ring-4 focus:ring-primary-100 transition"
                    />
                    <Scan className="absolute left-3.5 top-4 text-primary-500" size={20} />
                    <button
                      type="submit"
                      disabled={isProcessingScan || !parcelInput.trim() || session.status === 'COMPLETED'}
                      className="absolute right-2 top-2 bottom-2 px-4 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isProcessingScan ? <RefreshCw className="animate-spin" size={14} /> : <Check size={14} />}
                      Scan
                    </button>
                  </div>

                  {/* Condition Grading Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Physical Condition Grade
                      </label>
                      <select
                        value={selectedCondition}
                        onChange={(e) => setSelectedCondition(e.target.value as ParcelCondition)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {CONDITION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label} {opt.isException ? '⚠️' : '✅'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Exception Notes (If Any)
                      </label>
                      <input
                        type="text"
                        value={scanNotes}
                        onChange={(e) => setScanNotes(e.target.value)}
                        placeholder="Optional remarks or defect description"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </form>

                {/* LAST SCAN RESULT TOAST / BANNER */}
                <AnimatePresence>
                  {lastScanResult && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`p-4 rounded-xl border text-xs font-medium flex items-start gap-3 ${
                        lastScanResult.type === 'success'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : lastScanResult.type === 'duplicate'
                          ? 'bg-sky-50 border-sky-200 text-sky-900'
                          : lastScanResult.type === 'exception'
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : 'bg-red-50 border-red-200 text-red-900'
                      }`}
                    >
                      {lastScanResult.type === 'success' && <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={18} />}
                      {lastScanResult.type === 'duplicate' && <Copy className="text-sky-600 shrink-0 mt-0.5" size={18} />}
                      {lastScanResult.type === 'exception' && <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />}
                      {lastScanResult.type === 'error' && <XCircle className="text-red-600 shrink-0 mt-0.5" size={18} />}

                      <div className="space-y-0.5 flex-1">
                        <div className="font-bold">
                          {lastScanResult.message}
                        </div>
                        {lastScanResult.shelf && (
                          <div className="text-[11px] opacity-90 flex items-center gap-1 font-semibold">
                            <MapPin size={12} /> Assigned Shelf: {lastScanResult.shelf}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* SCANNED ITEMS LOG TABLE */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="text-slate-600" size={18} />
                    <h3 className="text-sm font-bold text-slate-900">
                      Processed Session Logs ({scannedList.length})
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    Session: {session.id}
                  </span>
                </div>

                {scannedList.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <Archive className="mx-auto text-slate-300" size={36} />
                    <p className="text-xs">No parcels scanned in this session yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px]">
                          <th className="py-2.5 px-3">Time</th>
                          <th className="py-2.5 px-3">Tracking ID</th>
                          <th className="py-2.5 px-3">Condition</th>
                          <th className="py-2.5 px-3">Shelf Location</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {scannedList.slice().reverse().map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {item.trackingNumber}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                item.condition === 'GOOD'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}>
                                {item.condition}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-800">
                              {item.shelfLocation || 'Pending'}
                            </td>
                            <td className="py-2.5 px-3">
                              {item.isDuplicate ? (
                                <span className="text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded text-[10px]">
                                  Duplicate
                                </span>
                              ) : item.hasException ? (
                                <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded text-[10px]">
                                  Exception
                                </span>
                              ) : (
                                <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                                  Accepted
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* SESSION SIDEBAR DETAILS (RIGHT 1 COL) */}
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Info size={16} className="text-slate-500" />
                  Session Information
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="text-slate-500 text-[10px] uppercase font-semibold">Shipment Ref</div>
                    <div className="font-mono font-bold text-slate-900 mt-0.5">{session.shipmentId}</div>
                  </div>

                  <div>
                    <div className="text-slate-500 text-[10px] uppercase font-semibold">Hub Operator</div>
                    <div className="font-semibold text-slate-800 mt-0.5">{session.operatorName}</div>
                  </div>

                  <div>
                    <div className="text-slate-500 text-[10px] uppercase font-semibold">Target Hub Point</div>
                    <div className="font-semibold text-slate-800 mt-0.5">{session.hubId}</div>
                  </div>

                  <div>
                    <div className="text-slate-500 text-[10px] uppercase font-semibold">Merchant / Source</div>
                    <div className="font-semibold text-slate-800 mt-0.5">{session.merchantName || session.merchantId}</div>
                  </div>

                  <div>
                    <div className="text-slate-500 text-[10px] uppercase font-semibold">Started At</div>
                    <div className="text-slate-600 mt-0.5">{new Date(session.createdAt).toLocaleString()}</div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleFinalizeSession}
                    disabled={isFinalizing || session.status === 'COMPLETED'}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-50"
                  >
                    {isFinalizing ? <RefreshCw className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                    Finalize & Complete Intake
                  </button>
                </div>
              </div>

              {/* OPERATIONAL RULES SUMMARY */}
              <div className="bg-slate-900 text-slate-300 p-5 rounded-2xl border border-slate-800 space-y-3 text-xs">
                <div className="font-bold text-white flex items-center gap-2">
                  <BarChart3 size={16} className="text-primary-400" />
                  WeSabiHub Intake Rules
                </div>
                <ul className="space-y-2 text-[11px] list-disc list-inside text-slate-400">
                  <li>Scanning updates parcel status to Received at Hub.</li>
                  <li>InventoryEngine automatically allocates standard storage shelf.</li>
                  <li>Duplicate scans provide status feedback without repeating custody logs.</li>
                  <li>Exceptions and condition flags trigger audit and merchant notifications.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </PointLayout>
  );
};
