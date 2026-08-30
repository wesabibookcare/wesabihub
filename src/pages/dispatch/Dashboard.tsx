import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import {
  Shield,
  Award,
  Wallet,
  GraduationCap,
  FileText,
  QrCode,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Upload,
  TrendingUp,
  TrendingDown,
  Bell,
  Check,
  ArrowRight,
  Power,
  LogOut,
  CreditCard,
  DollarSign,
  Shuffle,
  Plus,
  Activity,
  BookOpen,
  Briefcase,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';


import { Card } from '../../components/ui/Card';
import { userRepository } from '@/src/services/db/UserRepository';
import { courseRepository } from '@/src/services/db/CourseRepository';
import { storageEngine } from '@/src/engines/StorageEngine';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { cn } from '@/src/lib/utils';
import { auditEngine } from '../../services/AuditEngine';
import { useNavigate } from 'react-router-dom';

// Trust Tier configuration details
const TIER_BENEFITS = {
  TIER_1: { name: 'Tier 1 (Silver)', limit: '₦50,000 Parcel Limit', commission: '15% Comm. Rate', requirements: 'Complete Profile' },
  TIER_2: { name: 'Tier 2 (Gold)', limit: '₦150,000 Parcel Limit', commission: '12% Comm. Rate', requirements: '20+ successful trips & 100+ Trust Score' },
  TIER_3: { name: 'Tier 3 (Platinum)', limit: '₦500,000 Parcel Limit', commission: '10% Comm. Rate', requirements: '50+ successful trips & 150+ Trust Score' },
  TIER_4: { name: 'Tier 4 (Black Diamond)', limit: 'Unlimited Parcel Limit', commission: '8% Comm. Rate', requirements: '100+ successful trips, 180+ Trust Score & No violations' },
};

export const DispatchDashboard = () => {
  const { user, activeRole, setActiveRole } = useAuth();
  const navigate = useNavigate();

  // Real-time rider profile states synced with Firestore
  const [riderProfile, setRiderProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // UI active tabs: 'overview' | 'academy' | 'id' | 'agreement' | 'wallet' | 'jobs'
  const [activeTab, setActiveTab] = useState<'overview' | 'academy' | 'id' | 'agreement' | 'wallet' | 'jobs'>('overview');

  // State for documents and modals
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentSignature, setConsentSignature] = useState('');
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // Local lists for dynamic notifications, courses and audit logs inside dashboard
  const [notifications, setNotifications] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  // Synchronize Rider Data in Real-time from Firestore
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = userRepository.subscribe(user.id, async (data) => {
      if (data) {

        // Populate default values if missing for fresh dispatch riders
        if (!data.trustLevel) {
          await userRepository.update(user.id, {
            trustLevel: 'TIER_1',
            trustScore: 100,
            academyTrainingStatus: 'PENDING',
            availableBalance: 0,
            pendingBalance: 0,
            tripsCount: 0,
            dispatchId: data.dispatchId || `WSD-${user.id.slice(0, 4).toUpperCase()}`,
            violationsCount: 0
          });
        }
        setRiderProfile(data);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);


  // Load courses, notifications and audit logs dynamically
  useEffect(() => {
    if (!user?.id) return;

    // Load Courses
    const unsubCourses = courseRepository.subscribeToQuery([], (fetchedCourses) => {
      setCourses(fetchedCourses as any[]);
    });


    // Populate local notifications
    setNotifications([]);

    return () => unsubCourses();
  }, [user?.id]);

  // Handle Complete Lesson/Course inside Training Academy
  const handleCompleteCourse = async (courseId: string, trustBonus: number) => {
    if (!user?.id || !riderProfile) return;

    try {
      const updatedProgress = riderProfile.completedCourses || [];
      if (updatedProgress.includes(courseId)) {
        toast.success('You have already completed this course.');
        return;
      }

      const newScore = (riderProfile.trustScore || 100) + trustBonus;
      let newTier = riderProfile.trustLevel || 'TIER_1';

      // Calculate dynamic Tier thresholds
      const totalTrips = riderProfile.tripsCount || 0;
      if (newScore >= 180 && totalTrips >= 100 && (riderProfile.violationsCount || 0) === 0) newTier = 'TIER_4';
      else if (newScore >= 150 && totalTrips >= 50) newTier = 'TIER_3';
      else if (newScore >= 100 && totalTrips >= 20) newTier = 'TIER_2';

      const completedCourses = [...(riderProfile.completedCourses || [])];
      if (!completedCourses.includes(courseId)) {
        completedCourses.push(courseId);
      }

      await userRepository.update(user.id, {
        completedCourses,
        trustScore: newScore,
        trustLevel: newTier,
        academyTrainingStatus: 'COMPLETED'
      } as any);

      // Audit Log
      await auditEngine.logEvent({
        userId: user.id,
        userRole: 'DISPATCH_RIDER',
        action: 'ACADEMY_COURSE_COMPLETE',
        details: { courseId, trustBonusAdded: trustBonus, newScore },
        result: 'SUCCESS'
      });

      toast.success(`Congratulations! You completed the course, earned +${trustBonus} Trust Points, and updated your profile!`);
    } catch (e: any) {
      console.error('Failed to complete course:', e);
    }
  };

  // Sign latest agreement version
  const handleSignAgreement = async () => {
    if (!consentSignature.trim() || !user?.id) return;
    try {
      await userRepository.update(user.id, {
        agreementSigned: true,
        agreementVersion: 'v2.4.0',
        agreementSignedAt: new Date().toISOString(),
        agreementSignature: consentSignature
      } as any);

      await auditEngine.logEvent({
        userId: user.id,
        userRole: 'DISPATCH_RIDER',
        action: 'DISPATCH_PARTNER_AGREEMENT_SIGN',
        details: { version: 'v2.4.0', signature: consentSignature },
        result: 'SUCCESS'
      });

      setShowConsentModal(false);
      setConsentSignature('');
      toast.success('OmorfiHubDispatch Partner Agreement v2.4.0 successfully signed and stored on-chain!');
    } catch (e) {
      console.error('Failed to sign agreement:', e);
    }
  };

  const handleUploadClick = (docType: string) => {
    setUploadingDoc(docType);
  };

  const handleFileUpload = async (docType: string, file: File) => {
    if (!user?.id) return;
    setIsUploading(true);
    try {
      const downloadUrl = await storageEngine.uploadUserDocument(user.id, docType, file);
      setUploadedFiles(prev => ({ ...prev, [docType]: downloadUrl }));

      await userRepository.update(user.id, {
        [`document_${docType}`]: downloadUrl
      } as any);

      await auditEngine.logEvent({
        userId: user.id,
        userRole: 'DISPATCH_RIDER',
        action: 'DOCUMENT_UPLOAD_SUCCESS',
        details: { docType, downloadUrl },
        result: 'SUCCESS'
      });

      toast.success(`${docType.toUpperCase()} uploaded successfully!`);
      setUploadingDoc(null);
    } catch (err: any) {
      console.error('File upload failed:', err);
      toast.error('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Dynamic Trust Score and Tier Updates (+ / - events)
  const adjustTrustScore = async (amount: number, reason: string) => {
    if (!user?.id || !riderProfile) return;
    try {

      const currentScore = riderProfile.trustScore || 100;
      const newScore = Math.max(0, currentScore + amount);
      const currentTrips = riderProfile.tripsCount || 0;
      const isPositive = amount > 0;

      const updatedTrips = isPositive && reason.includes('delivery') ? currentTrips + 1 : currentTrips;
      const updatedViolations = !isPositive && reason.includes('violation') ? (riderProfile.violationsCount || 0) + 1 : (riderProfile.violationsCount || 0);

      // Re-evaluate trust level
      let newTier = 'TIER_1';
      if (newScore >= 180 && updatedTrips >= 100 && updatedViolations === 0) newTier = 'TIER_4';
      else if (newScore >= 150 && updatedTrips >= 50) newTier = 'TIER_3';
      else if (newScore >= 100 && updatedTrips >= 20) newTier = 'TIER_2';

      await userRepository.update(user.id, {
        trustScore: newScore,
        trustLevel: newTier,
        tripsCount: updatedTrips,
        violationsCount: updatedViolations
      } as any);

      // Log score adjustments to local display and audit engine
      const logEntry = {
        id: `EVT-${Date.now()}`,
        reason,
        change: amount,
        timestamp: new Date().toLocaleTimeString()
      };
      setAuditLogs(prev => [logEntry, ...prev]);

      await auditEngine.logEvent({
        userId: user.id,
        userRole: 'DISPATCH_RIDER',
        action: 'TRUST_SCORE_ADJUST',
        details: { reason, change: amount, newScore, newTier },
        result: 'SUCCESS'
      });

    } catch (e) {
      console.error(e);
    }
  };


  // Handle Withdrawals
  const handleWithdraw = async (amount: number) => {
    if (!user?.id || !riderProfile) return;
    const currentAvailable = riderProfile.availableBalance || 0;
    if (amount > currentAvailable) {
      toast.success('Insufficient available balance to perform withdrawal.');
      return;
    }
    try {
      await userRepository.update(user.id, {
        availableBalance: currentAvailable - amount,
        pendingBalance: (riderProfile.pendingBalance || 0) + amount
      } as any);

      await auditEngine.logEvent({
        userId: user.id,
        userRole: 'DISPATCH_RIDER',
        action: 'WITHDRAWAL_REQUEST',
        details: { amount },
        result: 'SUCCESS'
      });

      toast.success(`Withdrawal request for ₦${amount.toLocaleString()} submitted. Amount is held in pending settlement.`);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin text-primary-600 mb-4" size={48} />
        <p className="font-bold text-slate-800">Loading Dispatch Space...</p>
      </div>
    );
  }

  const statusColors = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
    SUSPENDED: 'bg-rose-100 text-rose-800 border-rose-300',
    DISABLED: 'bg-slate-100 text-slate-900 border-slate-300'
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
      {/* Upper Navigation Rail */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">
            WS
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tight text-slate-900 dark:text-white">SendOmorfi Terminal</h1>
            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Courier Partner Dashboard v2.4</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Header Switch Role Capability */}
          {user?.roles && user.roles.length > 1 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <Shuffle size={14} className="text-slate-900" />
              <select
                value={activeRole || 'DISPATCH_RIDER'}
                onChange={(e) => setActiveRole(e.target.value as any)}
                className="text-xs font-bold text-slate-900 dark:text-slate-300 bg-transparent border-none focus:ring-0 outline-none cursor-pointer"
              >
                {user.roles.map(r => (
                  <option key={r} value={r}>{r.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="text-slate-900 hover:text-red-600 rounded-xl flex items-center gap-2"
            onClick={() => {
              navigate('/login');
            }}
          >
            <LogOut size={16} /> Logout
          </Button>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto px-6 mt-8">

        {/* Verification Status Banner */}
        <div className="mb-6">
          <Card className={cn("p-4 border flex flex-col md:flex-row md:items-center justify-between gap-4", statusColors[riderProfile?.status as keyof typeof statusColors] || 'bg-slate-50')}>
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 shrink-0" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest">Rider Registration Status</p>
                <h3 className="font-black text-lg">{riderProfile?.status || 'PENDING'}</h3>
                <p className="text-xs opacity-90">
                  {riderProfile?.status === 'PENDING' && 'Your documents are currently under review by our operations verification team.'}
                  {riderProfile?.status === 'ACTIVE' && 'Authorized. Your account is fully active. You are eligible to accept transit jobs.'}
                  {riderProfile?.status === 'APPROVED' && 'Approved! Complete any outstanding onboarding steps to activate routing.'}
                  {riderProfile?.status === 'REJECTED' && 'Your application was rejected. Please review uploaded document requirements.'}
                  {riderProfile?.status === 'SUSPENDED' && 'Access Suspended. Please contact security support or complete mandatory re-training.'}
                  {riderProfile?.status === 'DISABLED' && 'This account has been disabled.'}
                </p>
              </div>
            </div>

            {/* Header Branding */}
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Authorized Personnel
              </Badge>
            </div>
          </Card>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-4 mb-8 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Overview Hub', icon: <Activity size={16} /> },
            { id: 'id', label: 'Digital Credentials ID', icon: <QrCode size={16} /> },
            { id: 'academy', label: 'Training Academy', icon: <GraduationCap size={16} /> },
            { id: 'agreement', label: 'Partner Agreement', icon: <FileText size={16} /> },
            { id: 'wallet', label: 'Wallet & Payouts', icon: <Wallet size={16} /> },
            { id: 'jobs', label: 'Dispatch Job Board', icon: <Briefcase size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold border transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:text-slate-900 dark:border-white'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 hover:bg-slate-50'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Panels */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >

              {/* Trust Score Panel */}
              <Card className="p-6 col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-xl text-slate-900 dark:text-white">Trust Engine Performance</h3>
                    <p className="text-xs text-slate-900 font-medium">Real-time trust score tracking and rating mechanics.</p>
                  </div>
                  <Badge className="bg-primary-50 text-primary-600 border-none px-3 py-1 font-black rounded-xl">
                    Score: {riderProfile?.trustScore || 100} PTS
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
                    <p className="text-[10px] font-black uppercase text-slate-800">Trust Level Status</p>
                    <div className="my-2">
                      <span className="text-2xl font-black text-primary-600">{riderProfile?.trustLevel || 'TIER_1'}</span>
                    </div>
                    <p className="text-[10px] text-slate-900 font-bold">{TIER_BENEFITS[riderProfile?.trustLevel as keyof typeof TIER_BENEFITS]?.name || 'Tier 1'}</p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
                    <p className="text-[10px] font-black uppercase text-slate-800">Completed Trips</p>
                    <div className="my-2">
                      <span className="text-2xl font-black text-slate-800 dark:text-white">{riderProfile?.tripsCount || 0} Trips</span>
                    </div>
                    <p className="text-[10px] text-slate-900 font-bold">Unlocks Higher Trust Tiers</p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
                    <p className="text-[10px] font-black uppercase text-slate-800">Violations Registered</p>
                    <div className="my-2">
                      <span className={cn("text-2xl font-black", (riderProfile?.violationsCount || 0) > 0 ? "text-red-500" : "text-emerald-500")}>
                        {riderProfile?.violationsCount || 0}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-900 font-bold">Resets at end of fiscal month</p>
                  </div>
                </div>

                {/* Score Progression Guidelines */}
                <div className="p-4 bg-primary-50/50 rounded-2xl border border-primary-100 space-y-2">
                  <p className="text-xs font-bold text-primary-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Award size={14} /> Trust Level Limit Guidelines
                  </p>
                  <p className="text-xs text-primary-900 leading-relaxed font-medium">
                    Your Trust level determines your payload risk capability:
                    <br />
                    <span className="font-bold">Tier 1:</span> Up to ₦50,000 parcel value • <span className="font-bold">Tier 2:</span> Up to ₦150,000 • <span className="font-bold">Tier 3:</span> Up to ₦500,000 • <span className="font-bold">Tier 4:</span> Unlimited limit! Complete deliveries and training to upgrade.
                  </p>
                </div>

                {/* Score Progression Guidelines */}

                {/* Recent Trust Incidents Log */}
                {auditLogs.length > 0 && (
                  <div className="space-y-2 mt-4 border-t border-slate-100 pt-4">
                    <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Dynamic Score Incidents Log</h4>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2">
                      {auditLogs.map(log => (
                        <div key={log.id} className="flex justify-between items-center text-xs p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                          <span className="font-bold text-slate-900 dark:text-slate-300">{log.reason}</span>
                          <span className={cn("font-black", log.change > 0 ? "text-emerald-600" : "text-rose-600")}>
                            {log.change > 0 ? `+${log.change}` : log.change} PTS
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Onboarding Documents Checklist panel */}
              <Card className="p-6 space-y-6">
                <div>
                  <h3 className="font-black text-xl text-slate-900 dark:text-white">Credentials Checklist</h3>
                  <p className="text-xs text-slate-900 font-medium">Upload necessary verification materials to avoid suspension.</p>
                </div>

                <div className="space-y-3">
                  {[
                    { id: 'nin', label: 'National Identity Number (NIN)', desc: 'Required government identity verification' },
                    { id: 'license', label: 'Driver License Validity', desc: 'Valid Class-A riders license doc' },
                    { id: 'vehicle', label: 'Vehicle Roadworthiness', desc: 'Proof of roadworthiness & insurance' },
                    { id: 'guarantor', label: 'Guarantor Documentation', desc: 'Signed guarantor declaration form' }
                  ].map(doc => {
                    const isUploaded = uploadedFiles[doc.id] || riderProfile?.[`document_${doc.id}`];
                    return (
                      <div key={doc.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{doc.label}</p>
                          <p className="text-[10px] text-slate-800 font-medium">{doc.desc}</p>
                        </div>
                        {isUploaded ? (
                          <div className="flex items-center gap-1.5 text-emerald-600">
                            <CheckCircle size={16} />
                            <span className="text-[10px] font-black uppercase">Ready</span>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" className="text-[10px] h-8 rounded-xl" onClick={() => handleUploadClick(doc.id)}>
                            <Upload size={12} className="mr-1" /> Upload
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* File upload picker */}
                {uploadingDoc && (
                  <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 space-y-3">
                    <p className="text-xs font-bold text-slate-900">Upload document for {uploadingDoc.toUpperCase()}:</p>
                    <label className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-white cursor-pointer hover:bg-slate-50 transition-colors block">
                      <Upload className="mx-auto text-slate-800 mb-2" size={24} />
                      <span className="text-[11px] font-bold text-slate-900">{isUploading ? 'Uploading...' : 'Click to select file from device'}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        disabled={isUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(uploadingDoc, file);
                        }}
                      />
                    </label>
                    <Button variant="ghost" size="sm" className="text-slate-900 w-full" onClick={() => setUploadingDoc(null)} disabled={isUploading}>Cancel</Button>
                  </div>
                )}
              </Card>

            </motion.div>
          )}

          {/* Digital Credential ID Card Panel */}
          {activeTab === 'id' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start"
            >
              {/* Card visualizer */}
              <div className="flex justify-center">
                <div className="w-[350px] bg-slate-900 text-white rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden border border-slate-800">
                  {/* Top background glow */}
                  <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary-600/30 rounded-full blur-3xl" />

                  {/* Top header */}
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <h4 className="font-black text-sm uppercase tracking-wider text-slate-800">OmorfiHubDispatch</h4>
                      <p className="text-[8px] font-black uppercase text-primary-500 tracking-widest">Digital Credential</p>
                    </div>
                    <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center font-black text-xs">
                      WS
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="my-8 flex items-center gap-4 relative z-10">
                    <div className="w-20 h-20 bg-slate-800 rounded-2xl border-2 border-primary-500/50 flex items-center justify-center overflow-hidden">
                      <User size={40} className="text-slate-800" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-black text-lg text-white leading-none">{riderProfile?.displayName || user?.displayName}</h3>
                      <p className="text-xs font-bold text-slate-800 uppercase">SendOmorfi Partner</p>
                      <p className="text-[10px] font-bold text-primary-400 uppercase">Mode: {riderProfile?.sendOmorfiTransitMode || 'On foot'}</p>
                      <Badge className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-1", riderProfile?.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400')}>
                        {riderProfile?.status}
                      </Badge>
                    </div>
                  </div>

                  {/* ID Details */}
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 relative z-10">
                    <div>
                      <p className="text-[8px] font-black uppercase text-slate-900">Dispatch ID</p>
                      <p className="text-xs font-bold font-mono text-slate-200">{riderProfile?.dispatchId || 'WSD-PENDING'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase text-slate-900">Trust Level</p>
                      <p className="text-xs font-bold text-primary-400">{riderProfile?.trustLevel || 'TIER_1'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase text-slate-900">Expiry Date</p>
                      <p className="text-xs font-bold text-slate-300">Dec 2026</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase text-slate-900">Security Signature</p>
                      <p className="text-[10px] italic font-serif text-slate-800">OmorfiHub Trust</p>
                    </div>
                  </div>

                  {/* QR / Barcode Code */}
                  <div className="mt-6 p-3 bg-white rounded-2xl flex items-center justify-between gap-4 relative z-10">
                    <div className="flex-1">
                      <p className="text-[8px] font-black uppercase text-slate-900">Public Verification QR Code</p>
                      <p className="text-[9px] font-medium text-slate-800 leading-none">Scan to check credential authenticity.</p>
                    </div>
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center p-1 border">
                      <QrCode size={40} className="text-slate-900" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ID verification instruction panel */}
              <Card className="p-6 space-y-6">
                <div>
                  <h3 className="font-black text-xl text-slate-900 dark:text-white">QR Verification Service</h3>
                  <p className="text-xs text-slate-900 font-medium">Verify credentials on-the-field instantly using our central gateway.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-start gap-3">
                    <QrCode className="text-primary-600 mt-1 shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Public Verification Endpoint</h4>
                      <p className="text-xs text-slate-900 leading-relaxed mt-1">
                        Any merchant, point agent, or final customer can scan your QR code to verify your full identity, safety compliance, driver license status and current platform level.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Button
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => navigate(`/public/verify-rider/${user?.id || 'TEST_RIDER'}`)}
                    >
                      <ExternalLink size={16} /> Open Public Verification Page
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Training Academy Panel */}
          {activeTab === 'academy' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-black text-xl text-slate-900 dark:text-white">Training Academy</h3>
                  <p className="text-xs text-slate-900 font-medium">Mandatory safety, professional courier practices, and efficiency courses.</p>
                </div>
                <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-1 font-black rounded-xl">
                  {riderProfile?.completedCourses?.length || 0} / {courses.length} Completed
                </Badge>
              </div>

              {/* Course items */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => {
                  const isCompleted = riderProfile?.completedCourses?.includes(course.id);
                  return (
                    <Card key={course.id} className="p-5 flex flex-col justify-between hover:shadow-lg transition-all border border-slate-100">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <Badge className={cn("px-2 py-0.5 border-none rounded-lg text-[9px] uppercase font-bold",
                            course.category === 'Safety' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                          )}>
                            {course.category}
                          </Badge>
                          {course.isMandatory && (
                            <Badge className="bg-amber-50 text-amber-700 border-none px-2 py-0.5 rounded-lg text-[9px] uppercase font-bold">
                              Mandatory
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-black text-base text-slate-900 dark:text-white">{course.title}</h4>
                        <p className="text-xs text-slate-900 leading-relaxed font-medium">{course.description || 'Access course materials to unlock dispatch permissions.'}</p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-800 font-bold">
                          <Clock size={12} /> {course.duration || '20 Mins'}
                        </div>
                        {isCompleted ? (
                          <div className="flex items-center gap-1 text-emerald-600 font-black text-xs">
                            <CheckCircle size={14} /> Completed
                          </div>
                        ) : (
                          <Button size="sm" onClick={() => handleCompleteCourse(course.id, course.trustBonus)}>
                            Start (+{course.trustBonus} PTS)
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Partner Agreement versioning panel */}
          {activeTab === 'agreement' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              <Card className="p-6 space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="font-black text-xl text-slate-900 dark:text-white">OmorfiHubDispatch Partner Agreement</h3>
                    <p className="text-xs text-slate-900 font-medium">Legal terms, compliance rules, on-chain safety, and audit policies.</p>
                  </div>
                  <Badge className="bg-slate-100 text-slate-800 border-none px-2.5 py-1 font-mono text-[10px] font-bold">
                    v2.4.0 (Latest)
                  </Badge>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 text-xs text-slate-800 dark:text-slate-300 font-medium leading-relaxed">
                  <p className="font-bold">Last Modified: July 2026</p>
                  <p>
                    By accepting this Agreement, you enter into a legally binding partnership with OmorfiHub Logistics Platform. You agree to represent the brand professionally, adhere to regional safety protocols, maintain valid license/ID documents, and respect delivery custody mechanisms.
                  </p>
                  <p>
                    <span className="font-bold">1. Trust Score Policy:</span> OmorfiHub operates a dynamic trust rating score (0 - 200). Your access to delivery channels is strictly bound to maintaining a Trust Score above 60. Violations such as fraud events, constant delay complaints, or GPS manipulation will trigger instant temporary suspension.
                  </p>
                  <p>
                    <span className="font-bold">2. Financial Payout and Settlements:</span> All payments earned are routed through OmorfiHub SafePay Wallet. Payouts require successful delivery confirmation. Withdrawals will clear into registered settlement banks. Fees and commissions are applied as per current Trust Tier settings.
                  </p>
                  <p>
                    <span className="font-bold">3. Audit and compliance:</span> All application credentials and physical verification status updates are logged securely in audit systems. Any fraud will be reported directly to regulatory authorities.
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  {riderProfile?.agreementSigned ? (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
                      <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-sm text-emerald-800">Agreement Signed and Verified</h4>
                        <p className="text-xs text-emerald-700 font-medium mt-1">
                          Signed electronically on {new Date(riderProfile?.agreementSignedAt).toLocaleDateString()} using signature code: <span className="font-mono font-bold">{riderProfile?.agreementSignature || 'WSD-SIGN'}</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-slate-900">Sign your full name below to accept terms:</p>
                      <div className="flex gap-3">
                        <Input
                          placeholder="Your Electronic Signature"
                          value={consentSignature}
                          onChange={e => setConsentSignature(e.target.value)}
                        />
                        <Button onClick={handleSignAgreement} disabled={!consentSignature.trim()}>
                          Accept & Sign
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Wallet & settlements panel */}
          {activeTab === 'wallet' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >

              {/* Balances */}
              <Card className="p-6 col-span-2 space-y-6">
                <div>
                  <h3 className="font-black text-xl text-slate-900 dark:text-white">Rider Payment Protection Wallet</h3>
                  <p className="text-xs text-slate-900 font-medium font-sans">Track settlements, pending balances, and instant bank cashouts.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-900 text-white rounded-3xl relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary-500/20 rounded-full blur-2xl" />
                    <p className="text-[10px] font-black uppercase text-slate-800">Available Cashout Balance</p>
                    <h2 className="text-3xl font-black mt-2 font-mono">₦{(riderProfile?.availableBalance || 0).toLocaleString()}</h2>
                    <p className="text-[10px] text-slate-300 font-bold mt-4 flex items-center gap-1">
                      <CheckCircle size={12} className="text-emerald-400" /> Settled & Ready
                    </p>
                  </div>

                  <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black uppercase text-slate-800">Pending Protection Hold</p>
                    <h2 className="text-3xl font-black mt-2 font-mono text-slate-800 dark:text-white">₦{(riderProfile?.pendingBalance || 0).toLocaleString()}</h2>
                    <p className="text-[10px] text-slate-800 font-bold mt-4 flex items-center gap-1">
                      <Clock size={12} className="text-amber-500" /> Clears in 24h post-delivery
                    </p>
                  </div>
                </div>

                {/* Cashout Withdrawals actions */}
                <div className="border-t pt-6 space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Fast Bank Settlement Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="text-xs rounded-xl h-10 px-4 font-bold border-slate-200"
                      onClick={() => handleWithdraw(5000)}
                      disabled={(riderProfile?.availableBalance || 0) < 5000}
                    >
                      Withdraw ₦5,000
                    </Button>
                    <Button
                      variant="outline"
                      className="text-xs rounded-xl h-10 px-4 font-bold border-slate-200"
                      onClick={() => handleWithdraw(10000)}
                      disabled={(riderProfile?.availableBalance || 0) < 10000}
                    >
                      Withdraw ₦10,000
                    </Button>
                    <Button
                      variant="outline"
                      className="text-xs rounded-xl h-10 px-4 font-bold border-slate-200"
                      onClick={() => handleWithdraw(riderProfile?.availableBalance || 0)}
                      disabled={(riderProfile?.availableBalance || 0) <= 0}
                    >
                      Withdraw Maximum Balance
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Settlement Information */}
              <Card className="p-6 space-y-6">
                <div>
                  <h3 className="font-black text-xl text-slate-900 dark:text-white">Settlement Account</h3>
                  <p className="text-xs text-slate-900 font-medium">Your rider delivery earnings are held in your verified settlement account.</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border space-y-3">
                  <p className="text-xs font-medium text-slate-900 leading-relaxed">
                    Withdrawal requests are processed into your registered bank account upon delivery completion and verification.
                  </p>
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                    <Shield size={14} className="text-emerald-600" /> Direct Bank Settlement
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Live Dispatch Jobs Board */}
          {activeTab === 'jobs' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-black text-xl text-slate-900 dark:text-white">Transit Job board</h3>
                  <p className="text-xs text-slate-900 font-medium">Accept and execute nearby logistics deliveries securely.</p>
                </div>
                <Badge className="bg-blue-50 text-blue-600 border-none px-3 py-1 font-black rounded-xl">
                  {notifications.filter(n => n.type === 'NEW_JOB').length} Jobs Available
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {notifications.filter(n => n.type === 'NEW_JOB').map(job => (
                  <Card key={job.id} className="p-5 space-y-4 border hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start">
                      <Badge className="bg-primary-50 text-primary-600 border-none px-2 py-0.5 rounded-lg text-[9px] uppercase font-black">
                        Active Job
                      </Badge>
                      <span className="text-xs text-slate-800 font-bold">{job.time}</span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-black text-base text-slate-900 dark:text-white">{job.title}</h4>
                      <p className="text-xs text-slate-900 leading-relaxed font-medium">{job.body}</p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        className="bg-slate-900 hover:bg-black text-white"
                        onClick={() => {
                          const isAuthorized = riderProfile?.status === 'ACTIVE' || riderProfile?.status === 'APPROVED';
                          if (!isAuthorized || user?.pendingRoleApplication) {
                            toast.error('Application Under Review. You cannot accept transit jobs until approved by Admin.');
                            return;
                          }
                          setSelectedJob(job);
                          toast.success(`Dispatch Trip Accepted! Pick up your package at Ikeja Hub. Remember to track GPS safely.`);
                        }}
                      >
                        Accept & Start Route
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => toast.success('Job offer declined.')}>
                        Decline
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>


    </div>
  );
};
