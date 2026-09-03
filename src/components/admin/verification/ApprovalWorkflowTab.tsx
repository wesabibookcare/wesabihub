import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { roleApplicationRepository } from '../../../services/db/RoleApplicationRepository';
import { idVerificationRepository } from '../../../services/db/IdVerificationRepository';
import { userRepository } from '../../../services/db/UserRepository';
import { notificationService } from '../../../services/NotificationService';
import { documentRequirementRepository } from '../../../services/db/DocumentRequirementRepository';
import { profileUpdateAuditService, ProfileChangeRecord } from '@/src/services/ProfileUpdateAuditService';
import { RoleApplication, IdVerification, DocumentRequirement } from '../../../types';
import { auditEngine } from '../../../services/AuditEngine';


import { toast } from 'sonner';
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Building,
  User,
  ArrowRight,
  ExternalLink,
  Loader2,
  X,
  AlertCircle,
  Phone,
  MessageSquare,
  History,
  FileCheck,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export const ApprovalWorkflowTab: React.FC = () => {
  const [applications, setApplications] = useState<RoleApplication[]>([]);
  const [profileChanges, setProfileChanges] = useState<ProfileChangeRecord[]>([]);
  const [idScans, setIdScans] = useState<IdVerification[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'PENDING' | 'APPROVED' | 'SUSPENDED' | 'RE_UPLOAD_REQUESTED' | 'ID_SCANS' | 'UPDATES'>('PENDING');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<RoleApplication | null>(null);
  const [selectedScan, setSelectedScan] = useState<IdVerification | null>(null);
  const [docReqs, setDocReqs] = useState<DocumentRequirement[]>([]);

  // Action fields
  const [internalNotes, setInternalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [reUploadTarget, setReUploadTarget] = useState<string>('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showReUploadForm, setShowReUploadForm] = useState(false);

  useEffect(() => {
    setLoading(true);
    let rawApps: RoleApplication[] = [];
    let pendingUsersList: any[] = [];

    const mergeApplications = (appsList: RoleApplication[], usersList: any[]) => {
      const existingUserIds = new Set(appsList.map((a) => a.userId));
      const syntheticApps: RoleApplication[] = usersList
        .filter(
          (u) =>
            u.uid &&
            !existingUserIds.has(u.uid) &&
            (u.pendingRoleApplication === true ||
              (u.status &&
                ['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'EMAIL_UNVERIFIED'].includes(
                  u.status
                )) ||
              (u.requestedRole && u.requestedRole !== 'CUSTOMER') ||
              (u.role && u.role !== 'CUSTOMER'))
        )
        .map((u) => {
          const docs = Object.keys(u)
            .filter((k) => k.startsWith('document_'))
            .map((k) => (u as any)[k]);
          return {
            id: `APP-USER-${u.uid}`,
            userId: u.uid,
            role: u.requestedRole || u.role || 'MERCHANT',
            status:
              u.status === 'UNDER_REVIEW'
                ? 'UNDER_REVIEW'
                : u.status === 'REJECTED'
                ? 'REJECTED'
                : 'SUBMITTED',
            data: {
              email: u.email,
              displayName: u.displayName,
              phone: u.phoneNumber || u.phone || '',
              address: u.address || '',
              city: u.city || '',
              state: u.state || '',
              nin: u.nin || '',
              cac: u.cac || '',
              ...u
            },
            documents: docs,
            submittedAt: u.createdAt || new Date().toISOString(),
            createdAt: u.createdAt || new Date().toISOString(),
            updatedAt: u.updatedAt || new Date().toISOString()
          } as RoleApplication;
        });

      setApplications([...appsList, ...syntheticApps]);
      setLoading(false);
    };

    // Subscribe to role applications
    const unsubscribeApps = roleApplicationRepository.subscribeToQuery([], (allApps) => {
      rawApps = allApps;
      mergeApplications(rawApps, pendingUsersList);
    });

    // Subscribe to users collection to capture all pending applicants
    const unsubscribeUsers = userRepository.subscribeToQuery([], (users) => {
      pendingUsersList = users;
      mergeApplications(rawApps, pendingUsersList);
    });

    // Subscribe to ID Verifications
    const unsubscribeIdScans = idVerificationRepository.subscribeToQuery([], (scans) => {
      setIdScans(scans);
    });

    // Fetch dynamic requirements to humanize document labels
    documentRequirementRepository.getAll().then((data) => {
      setDocReqs(data);
    });

    fetchProfileChanges();

    return () => {
      unsubscribeApps();
      unsubscribeUsers();
      unsubscribeIdScans();
    };
  }, []);

  const fetchProfileChanges = async () => {
    const changes = await profileUpdateAuditService.getChangesForAuthority('ADMIN');
    setProfileChanges(changes);
  };

  const handleClearChanges = async () => {
    try {
      await Promise.all(profileChanges.map(change => {
        if (change.id) {
           return profileUpdateAuditService.markChangeAsSeen(change.id);
        }
      }));
      setProfileChanges([]);
      toast.success('Updates marked as seen');
    } catch (e) {
      console.error('Error clearing changes:', e);
      toast.error('Failed to clear updates');
    }
  };

  const handleOpenReview = (app: RoleApplication) => {
    setSelectedApp(app);
    setInternalNotes(app.reviewNotes || '');
    setRejectionReason('');
    setShowRejectForm(false);
    setShowReUploadForm(false);
    setReUploadTarget('');
  };

  const handleSaveNotes = async () => {
    if (!selectedApp) return;
    try {
      if (selectedApp.id.startsWith('APP-USER-')) {
        await roleApplicationRepository.create(selectedApp.id, {
          ...selectedApp,
          reviewNotes: internalNotes,
          updatedAt: new Date().toISOString()
        });
      } else {
        await roleApplicationRepository.update(selectedApp.id, {
          reviewNotes: internalNotes,
          updatedAt: new Date().toISOString()
        });
      }
      setSelectedApp(prev => prev ? { ...prev, reviewNotes: internalNotes } : null);
      toast.success('Internal review notes saved');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save review notes');
    }
  };

  const handleApprove = async (app: RoleApplication) => {
    setProcessingId(app.id);
    try {
      if (app.id.startsWith('APP-USER-')) {
        await roleApplicationRepository.create(app.id, {
          ...app,
          status: 'APPROVED',
          reviewNotes: internalNotes,
          updatedAt: new Date().toISOString()
        });
      } else {
        await roleApplicationRepository.update(app.id, {
          status: 'APPROVED',
          reviewNotes: internalNotes,
          updatedAt: new Date().toISOString()
        });
      }

      const isDispatch = app.role === 'DISPATCH_RIDER';
      const isLogisticsCompany = app.role === 'LOGISTICS_COMPANY';

      let extraProfileData: any = { ...app.data };

      if (isDispatch) {
        extraProfileData = {
          ...extraProfileData,
          dispatchId: `WSD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          trustLevel: 'TIER_1',
          trustScore: 100,
          academyTrainingStatus: 'COMPLETED',
          onboardingDate: new Date().toISOString(),
          verifiedAt: new Date().toISOString(),
          digitalIdActive: true,
        };
      } else if (isLogisticsCompany) {
        extraProfileData = {
          ...extraProfileData,
          verificationLevel: 'VERIFIED_PARTNER',
          partnerSince: new Date().toISOString(),
        };
      }

      // Grant the approved role: merge it into the user's existing roles
      // so approval makes the account possess multiple roles (e.g. ['CUSTOMER', 'MERCHANT']).
      const applicant = await userRepository.getById(app.userId);
      const existingRoles = applicant?.roles || ['CUSTOMER'];
      const mergedRoles = existingRoles.includes(app.role) ? existingRoles : [...existingRoles, app.role];

      await userRepository.update(app.userId, {
        status: 'ACTIVE',
        roles: mergedRoles,
        role: app.role, // set primary active role to newly approved role
        pendingRoleApplication: false,
        requestedRole: undefined,
        updatedAt: new Date().toISOString(),
        ...extraProfileData
      });

      await auditEngine.logEvent({
        userId: app.userId,
        userRole: app.role,
        action: 'ROLE_APPLICATION_APPROVE',
        details: { applicationId: app.id, role: app.role },
        result: 'SUCCESS'
      });

      // Send automated notification
      await notificationService.sendFromTemplate(
        app.userId,
        'approved',
        { role: app.role.replace(/_/g, ' ') },
        'Application Approved 🎉',
        `Your application to register as a ${app.role.replace(/_/g, ' ')} has been approved by our Verification team. Welcome to OmorfiHub!`,
        'SUCCESS',
        'APPROVAL'
      );

      toast.success(`Application for user ${app.userId} approved.`);
      setSelectedApp(null);
    } catch (err) {
      console.error('Approval failed:', err);
      toast.error('Failed to approve application.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (app: RoleApplication) => {
    if (!rejectionReason.trim()) {
      toast.error('Please input a rejection reason');
      return;
    }
    setProcessingId(app.id);
    try {
      if (app.id.startsWith('APP-USER-')) {
        await roleApplicationRepository.create(app.id, {
          ...app,
          status: 'REJECTED',
          reviewNotes: `${internalNotes}\n[Rejection Reason]: ${rejectionReason}`,
          updatedAt: new Date().toISOString()
        });
      } else {
        await roleApplicationRepository.update(app.id, {
          status: 'REJECTED',
          reviewNotes: `${internalNotes}\n[Rejection Reason]: ${rejectionReason}`,
          updatedAt: new Date().toISOString()
        });
      }

      // Only downgrade the account itself if this application was the
      // gate on their initial access (status still UNDER_REVIEW). An
      // already-ACTIVE user requesting an *additional* role should keep
      // full use of their existing account when that extra request is
      // declined -- only the role grant is denied, not their account.
      const applicant = await userRepository.getById(app.userId);
      if (applicant?.status === 'UNDER_REVIEW') {
        await userRepository.update(app.userId, {
          status: 'REJECTED',
          updatedAt: new Date().toISOString()
        });
      }

      await auditEngine.logEvent({
        userId: app.userId,
        userRole: app.role,
        action: 'ROLE_APPLICATION_REJECT',
        details: { applicationId: app.id, reason: rejectionReason },
        result: 'SUCCESS'
      });

      // Notify applicant
      await notificationService.sendFromTemplate(
        app.userId,
        'rejected',
        { reason: rejectionReason },
        'Application Rejected ⚠️',
        `Your registration application has been rejected. Reason: ${rejectionReason}. Please contact support if you believe this was an error.`,
        'ERROR',
        'APPROVAL'
      );

      toast.success(`Application rejected.`);
      setSelectedApp(null);
    } catch (err) {
      console.error('Rejection failed:', err);
      toast.error('Failed to reject application.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSuspend = async (app: RoleApplication) => {
    setProcessingId(app.id);
    try {
      await roleApplicationRepository.update(app.id, {
        status: 'UNDER_REVIEW',
        reviewNotes: `${internalNotes}\n[Suspended/Under Review at]: ${new Date().toLocaleString()}`,
        updatedAt: new Date().toISOString()
      });

      await userRepository.update(app.userId, {
        status: 'UNDER_REVIEW',
        updatedAt: new Date().toISOString()
      });

      await auditEngine.logEvent({
        userId: app.userId,
        userRole: app.role,
        action: 'ROLE_APPLICATION_SUSPEND',
        details: { applicationId: app.id },
        result: 'SUCCESS'
      });

      // Notify
      await notificationService.sendFromTemplate(
        app.userId,
        'suspended',
        {},
        'Application Under Review ⏳',
        'Your registration is currently suspended for extra credentials auditing. We will reach out shortly.',
        'WARNING',
        'APPROVAL'
      );

      toast.success('Verification process suspended');
      setSelectedApp(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to suspend application');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (app: RoleApplication) => {
    if (!window.confirm(`Are you sure you want to delete application ${app.id}?`)) return;
    setProcessingId(app.id);
    try {
      if (!app.id.startsWith('APP-USER-')) {
        await roleApplicationRepository.delete(app.id);
      }
      const applicant = await userRepository.getById(app.userId);
      if (applicant) {
        await userRepository.update(app.userId, {
          pendingRoleApplication: false,
          requestedRole: undefined,
          status: applicant.status === 'UNDER_REVIEW' || applicant.status === 'REJECTED' || applicant.status === 'SUBMITTED' ? 'ACTIVE' : applicant.status,
          updatedAt: new Date().toISOString()
        });
      }
      setApplications(prev => prev.filter(a => a.id !== app.id));
      setSelectedApp(null);
      toast.success(`Application deleted successfully`);
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete application.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRequestReUpload = async (app: RoleApplication) => {
    if (!reUploadTarget) {
      toast.error('Please specify which document needs a re-upload');
      return;
    }
    setProcessingId(app.id);
    try {
      const docLabel = docReqs.find(d => d.id === reUploadTarget)?.name || reUploadTarget;
      await roleApplicationRepository.update(app.id, {
        status: 'MORE_INFORMATION_REQUIRED', // set status to re-upload needed or suspended with field reset
        reviewNotes: `${internalNotes}\n[Re-upload Requested]: ${docLabel}`,
        updatedAt: new Date().toISOString()
      });

      // Reset that document field in user's profile to force a re-upload!
      await userRepository.update(app.userId, {
        [`document_${reUploadTarget}`]: '',
        updatedAt: new Date().toISOString()
      });

      await auditEngine.logEvent({
        userId: app.userId,
        userRole: app.role,
        action: 'ROLE_APPLICATION_RE_UPLOAD',
        details: { applicationId: app.id, documentId: reUploadTarget },
        result: 'SUCCESS'
      });

      // Notify
      await notificationService.sendFromTemplate(
        app.userId,
        'reupload',
        { document: docLabel },
        'Document Re-upload Required 📝',
        `Your upload for ${docLabel} was not acceptable. Please log in to your profile and re-upload a clear copy.`,
        'WARNING',
        'APPROVAL'
      );

      toast.success(`Re-upload requested for ${docLabel}`);
      setSelectedApp(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to request document re-upload');
    } finally {
      setProcessingId(null);
    }
  };

  // Humanize doc requirement names
  const getDocName = (key: string) => {
    const docId = key.replace('document_', '');
    const found = docReqs.find(d => d.id === docId);
    return found ? found.name : key.replace('document_', '').replace(/_/g, ' ');
  };

  // Categorize applications for rendering tabs
  const pendingApps = applications.filter(app => !app.status || app.status === 'SUBMITTED' || app.status === 'PENDING');
  const approvedApps = applications.filter(app => app.status === 'APPROVED');
  const suspendedApps = applications.filter(app => app.status === 'UNDER_REVIEW');
  const reUploadRequestedApps = applications.filter(app => app.status === 'RE_UPLOAD_REQUESTED' || app.status === 'MORE_INFORMATION_REQUIRED');

  const rawFilteredApps =
    activeSubTab === 'PENDING' ? pendingApps :
    activeSubTab === 'APPROVED' ? approvedApps :
    activeSubTab === 'SUSPENDED' ? suspendedApps :
    activeSubTab === 'RE_UPLOAD_REQUESTED' ? reUploadRequestedApps : [];

  const filteredApps = rawFilteredApps.filter(app => {
    if (roleFilter === 'ALL') return true;
    return app.role === roleFilter;
  });

  return (
    <div className="space-y-6">
      {/* Sub tabs inside workflow */}
      <div className="flex flex-col gap-3 border-b pb-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'PENDING', label: 'Pending Queue', count: pendingApps.length },
              { id: 'APPROVED', label: 'Approved Applications', count: approvedApps.length },
              { id: 'SUSPENDED', label: 'Suspended Review', count: suspendedApps.length },
              { id: 'ID_SCANS', label: 'ID Verification Scans', count: idScans.filter(s => s.status === 'PENDING').length },
              { id: 'UPDATES', label: 'Profile Updates', count: profileChanges.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
                  activeSubTab === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    activeSubTab === tab.id ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-800'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeSubTab === 'UPDATES' && profileChanges.length > 0 && (
            <Button size="sm" variant="outline" onClick={handleClearChanges} className="rounded-xl font-bold">
              Mark all updates as seen
            </Button>
          )}
        </div>

        {/* Role categorization filter buttons */}
        {(activeSubTab === 'PENDING' || activeSubTab === 'APPROVED' || activeSubTab === 'SUSPENDED') && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter size={12} /> Filter by Role:
            </span>
            {[
              { id: 'ALL', label: 'All Roles' },
              { id: 'MERCHANT', label: 'Merchant Pending/Approved' },
              { id: 'DISPATCH_RIDER', label: 'SendOmorfi Rider' },
              { id: 'CENTER_OWNER', label: 'Hub Center Owner' },
              { id: 'LOGISTICS_COMPANY', label: 'Logistics Company' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setRoleFilter(r.id)}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg border transition ${
                  roleFilter === r.id
                    ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <Loader2 className="animate-spin text-primary-600" size={24} />
          <p className="text-xs text-slate-400 font-bold">Loading dynamic queues...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">

          {/* Display lists based on active tab */}
          {(activeSubTab === 'PENDING' || activeSubTab === 'APPROVED' || activeSubTab === 'SUSPENDED' || activeSubTab === 'RE_UPLOAD_REQUESTED') && (
            <>
              {filteredApps.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 p-8 space-y-3">
                  <ShieldCheck className="mx-auto text-emerald-500" size={48} />
                  <h4 className="font-bold text-slate-900 text-sm">Applications Queue Empty</h4>
                  <p className="text-xs text-slate-400">No applications match the current status and role filters.</p>
                </div>
              ) : (
                filteredApps.map((app, idx) => (
                  <Card key={app.id} className="p-5 border border-slate-200/60 shadow-sm rounded-3xl bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900">{app.role.replace(/_/g, ' ')}</h4>
                        <Badge className={
                          app.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 font-bold text-[9px] uppercase tracking-wider' :
                          app.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-800 font-bold text-[9px] uppercase tracking-wider' :
                          'bg-slate-100 text-slate-600 font-bold text-[9px] uppercase tracking-wider'
                        }>
                          {app.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-[11px]">
                        <span className="flex items-center gap-1"><User size={12} /> UID: {app.userId}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> Submitted: {new Date(app.submittedAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><FileText size={12} /> {Object.keys(app.data || {}).filter(k => k.startsWith('document_')).length} Documents</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <Button
                        size="sm"
                        onClick={() => handleOpenReview(app)}
                        className="bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex-1 md:flex-initial"
                      >
                        Audit Credentials
                        <ArrowRight size={14} className="ml-1" />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(app)}
                        disabled={processingId === app.id}
                        className="rounded-xl text-xs font-bold"
                        title="Delete Form Application"
                      >
                        Delete
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </>
          )}

          {/* Render ID Scan Queues */}
          {activeSubTab === 'ID_SCANS' && (
            <div className="text-center py-10 bg-white rounded-3xl border border-slate-100 p-8">
              <p className="text-xs text-slate-500 italic">ID scanning queue is integrated with the main AI Trust scanner widget.</p>
            </div>
          )}

          {/* Render Profile Updates */}
          {activeSubTab === 'UPDATES' && (
            <>
              {profileChanges.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 p-8">
                  <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={32} />
                  <p className="text-xs text-slate-400 font-bold">No profile changes waiting for validation.</p>
                </div>
              ) : (
                profileChanges.map(change => (
                  <Card key={change.id} className="p-5 border border-slate-200/60 shadow-sm rounded-3xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-xs text-slate-800">User Profile Update: {change.userId}</p>
                        <p className="text-[10px] text-slate-400">Field: {change.field} | Updated: {new Date(change.timestamp).toLocaleString()}</p>
                        <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
                          <div className="p-2 bg-slate-50 rounded-lg">
                            <span className="text-[9px] text-slate-400 font-bold block">OLD VALUE:</span>
                            <span className="font-semibold text-slate-700">{String(change.oldValue)}</span>
                          </div>
                          <div className="p-2 bg-emerald-50/50 rounded-lg">
                            <span className="text-[9px] text-emerald-600 font-bold block">NEW VALUE:</span>
                            <span className="font-semibold text-slate-800">{String(change.newValue)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </>
          )}

        </div>
      )}

      {/* Audit/Verification detailed popup modal */}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            >
              <div className="p-5 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-sm">Auditing: {selectedApp.role.replace('_', ' ')}</h3>
                    <p className="text-[10px] text-slate-500">Applicant: {selectedApp.userId}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedApp(null)} className="p-1.5 hover:bg-slate-100 rounded-lg transition">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Applicant data and doc list */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Form answers */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Submitted Credentials</h4>
                    <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 text-xs">
                      {Object.entries(selectedApp.data || {})
                        .filter(([k]) => !k.startsWith('document_') && k !== 'isInvited' && k !== 'invitationId' && k !== 'hubId')
                        .map(([key, val]) => (
                          <div key={key} className="space-y-0.5">
                            <span className="text-slate-400 font-semibold capitalize text-[10px]">{key.replace(/([A-Z])/g, ' $1')}:</span>
                            <p className="font-bold text-slate-800 dark:text-white break-all">{String(val)}</p>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Document uploads auditing */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Uploaded Documents Preview</h4>
                    <div className="space-y-3">
                      {Object.entries(selectedApp.data || {})
                        .filter(([k]) => k.startsWith('document_'))
                        .map(([key, val]) => {
                          const docUrl = String(val);
                          const isImage = docUrl.match(/\.(jpg|jpeg|png|webp|gif)/i) || docUrl.includes('image') || docUrl.startsWith('data:image');
                          return (
                            <div key={key} className="p-4 border rounded-2xl bg-white dark:bg-slate-950 space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="font-bold text-slate-800 dark:text-white text-xs">{getDocName(key)}</p>
                                <a
                                  href={docUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-bold text-primary-600 flex items-center gap-1 hover:underline"
                                >
                                  <ExternalLink size={12} /> Open original
                                </a>
                              </div>

                              {/* Embed preview */}
                              {docUrl ? (
                                <div className="border rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center max-h-60 overflow-hidden">
                                  {isImage ? (
                                    <img
                                      src={docUrl}
                                      alt="Document preview"
                                      className="max-h-60 object-contain"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="p-8 text-center space-y-2">
                                      <FileText className="mx-auto text-slate-400" size={32} />
                                      <p className="text-[10px] font-bold text-slate-500">PDF Document / Scan Attached</p>
                                      <iframe
                                        src={`https://docs.google.com/gview?url=${encodeURIComponent(docUrl)}&embedded=true`}
                                        className="w-full h-48 border-none mt-2"
                                        title="PDF Preview"
                                      />
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-[10px] text-amber-600 italic">No document file supplied.</p>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* Audit decisions and logs */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Internal notes widget */}
                  <div className="p-4 border border-slate-200/60 rounded-3xl bg-slate-50/50 space-y-3">
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1">
                      <MessageSquare size={14} className="text-slate-400" />
                      Internal Reviewer Notes
                    </h4>
                    <textarea
                      placeholder="Add observations, security checks status, identity matching notes..."
                      value={internalNotes}
                      onChange={e => setInternalNotes(e.target.value)}
                      rows={3}
                      className="w-full p-3 text-xs bg-white border rounded-xl"
                    />
                    <Button size="sm" onClick={handleSaveNotes} className="w-full bg-slate-900 text-white rounded-lg h-8">
                      Save Review Note
                    </Button>
                  </div>

                  {/* Actions selection */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Verification Decisions</h4>

                    {!showRejectForm && !showReUploadForm ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => handleSuspend(selectedApp)}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-700 border-none font-bold rounded-xl text-xs h-10"
                        >
                          <AlertTriangle size={14} className="mr-1" /> Suspend Review
                        </Button>
                        <Button
                          onClick={() => {
                            setShowReUploadForm(true);
                            // default to first doc field if available
                            const docField = Object.keys(selectedApp.data || {}).find(k => k.startsWith('document_'));
                            if (docField) setReUploadTarget(docField.replace('document_', ''));
                          }}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-none font-bold rounded-xl text-xs h-10"
                        >
                          <RotateCcw size={14} className="mr-1" /> Request Re-upload
                        </Button>
                        <Button
                          onClick={() => setShowRejectForm(true)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 border-none font-bold rounded-xl text-xs h-10 col-span-2"
                        >
                          <XCircle size={14} className="mr-1" /> Reject Candidate
                        </Button>
                      </div>
                    ) : null}

                    {/* Rejection inputs */}
                    {showRejectForm && (
                      <div className="p-4 border border-red-200 rounded-2xl bg-red-50/20 space-y-3 animate-in slide-in-from-bottom-2">
                        <div className="flex justify-between">
                          <span className="font-bold text-red-700 text-xs">Granular Rejection Reason:</span>
                          <button onClick={() => setShowRejectForm(false)} className="text-red-500 font-bold">Cancel</button>
                        </div>
                        <textarea
                          required
                          placeholder="Provide the applicant with precise details (e.g. CAC number does not match registry documents)"
                          value={rejectionReason}
                          onChange={e => setRejectionReason(e.target.value)}
                          rows={2}
                          className="w-full p-2.5 bg-white border border-red-200 rounded-xl text-xs"
                        />
                        <Button
                          onClick={() => handleReject(selectedApp)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg h-9"
                        >
                          Confirm Permanent Rejection
                        </Button>
                      </div>
                    )}

                    {/* Reupload inputs */}
                    {showReUploadForm && (
                      <div className="p-4 border border-blue-200 rounded-2xl bg-blue-50/20 space-y-3 animate-in slide-in-from-bottom-2">
                        <div className="flex justify-between">
                          <span className="font-bold text-blue-700 text-xs">Request Document Correction:</span>
                          <button onClick={() => setShowReUploadForm(false)} className="text-blue-500 font-bold">Cancel</button>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500">Choose Target Document:</label>
                          <select
                            value={reUploadTarget}
                            onChange={e => setReUploadTarget(e.target.value)}
                            className="w-full h-8 px-2 border rounded-lg bg-white"
                          >
                            {Object.keys(selectedApp.data || {})
                              .filter(k => k.startsWith('document_'))
                              .map(k => {
                                const id = k.replace('document_', '');
                                return (
                                  <option key={id} value={id}>{getDocName(k)}</option>
                                );
                              })}
                          </select>
                        </div>
                        <Button
                          onClick={() => handleRequestReUpload(selectedApp)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-9"
                        >
                          Send Correction Request
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Verification History / timeline */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <History size={14} /> Verification History Timeline
                    </h4>
                    <div className="p-4 border rounded-3xl bg-white space-y-3">
                      <div className="relative border-l-2 pl-4 space-y-3">
                        <div className="relative">
                          <div className="absolute -left-[21px] mt-0.5 w-2 h-2 rounded-full bg-emerald-500" />
                          <p className="font-bold text-slate-800">Registration Complete</p>
                          <p className="text-[9px] text-slate-400">{new Date(selectedApp.submittedAt).toLocaleString()}</p>
                        </div>
                        <div className="relative">
                          <div className="absolute -left-[21px] mt-0.5 w-2 h-2 rounded-full bg-blue-500" />
                          <p className="font-bold text-slate-800">Assigned Verification officer</p>
                          <p className="text-[9px] text-slate-400">System Router</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="p-5 border-t flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950">
                <Button
                  variant="danger"
                  onClick={() => handleDelete(selectedApp)}
                  disabled={processingId === selectedApp.id}
                  className="rounded-xl h-10 font-bold"
                >
                  Delete Form
                </Button>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => setSelectedApp(null)} className="rounded-xl h-10">
                    Dismiss Review
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedApp)}
                    disabled={processingId === selectedApp.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold min-w-36 h-10"
                  >
                    {processingId === selectedApp.id ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <FileCheck size={16} className="mr-1.5" />}
                    Approve & Activate
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
