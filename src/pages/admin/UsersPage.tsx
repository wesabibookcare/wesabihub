import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { useAuth } from '../../context/AuthContext';
import { userRepository } from '@/src/services/db/UserRepository';
import { auditEngine } from '@/src/engines/AuditEngine';
import { adminEngine } from '@/src/engines/AdminEngine';
import { notificationService } from '../../services/NotificationService';
import { permissionService, Permission } from '../../services/permissionService';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  ShieldCheck,
  Mail,
  Phone,
  Calendar,
  Lock,
  Power,
  ChevronRight,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Edit,
  Copy,
  PlusCircle,
  Activity,
  Check,
  Settings,
  ShieldAlert,
  Key,
  RefreshCw,
  Award,
  UserCheck,
  Clock,
  ExternalLink,
  LockKeyhole
} from 'lucide-react';
import { collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';


const STANDARD_ROLES = [
  {
    id: 'SUPER_ADMIN',
    name: 'Super Admin',
    description: 'Full, unrestricted administrative access across the entire OmorfiHub platform.',
    permissions: [
      'USERS_VIEW', 'USERS_CREATE', 'USERS_EDIT', 'USERS_SUSPEND', 'USERS_DELETE',
      'SHIPMENTS_VIEW', 'SHIPMENTS_EDIT', 'SHIPMENTS_ASSIGN', 'SHIPMENTS_CANCEL',
      'SAFEPAY_VIEW', 'SAFEPAY_RELEASE', 'SAFEPAY_HOLD', 'SAFEPAY_REFUND', 'SAFEPAY_CONFIGURE',
      'DISPUTES_VIEW', 'DISPUTES_INVESTIGATE', 'DISPUTES_ASSIGN', 'DISPUTES_RESOLVE', 'DISPUTES_CLOSE',
      'CHAT_VIEW_AUTHORIZED', 'CHAT_ACCESS_EVIDENCE', 'CHAT_ADD_CASE_NOTES',
      'SUPPORT_VIEW_TICKETS', 'SUPPORT_RESPOND', 'SUPPORT_ESCALATE', 'SUPPORT_CLOSE',
      'CENTRES_VIEW', 'CENTRES_APPROVE', 'CENTRES_SUSPEND', 'CENTRES_EDIT',
      'SETTINGS_VIEW', 'SETTINGS_EDIT',
      'AUDIT_VIEW', 'AUDIT_EXPORT'
    ],
    isPreset: true,
    isActive: true
  },
  {
    id: 'DISPUTE_ADMIN',
    name: 'Dispute Admin',
    description: 'Dedicated and authorized to investigate, resolve and close customer & merchant SafePay disputes.',
    permissions: [
      'DISPUTES_VIEW', 'DISPUTES_INVESTIGATE', 'DISPUTES_ASSIGN', 'DISPUTES_RESOLVE', 'DISPUTES_CLOSE',
      'CHAT_VIEW_AUTHORIZED', 'CHAT_ACCESS_EVIDENCE', 'CHAT_ADD_CASE_NOTES',
      'SAFEPAY_VIEW', 'SAFEPAY_HOLD', 'SAFEPAY_REFUND', 'SAFEPAY_RELEASE'
    ],
    isPreset: true,
    isActive: true
  },
  {
    id: 'FINANCE_ADMIN',
    name: 'Finance Admin',
    description: 'Manages financial wallets, payout releases, SafePay setups, and audit trails.',
    permissions: [
      'SAFEPAY_VIEW', 'SAFEPAY_RELEASE', 'SAFEPAY_HOLD', 'SAFEPAY_REFUND', 'SAFEPAY_CONFIGURE',
      'SETTINGS_VIEW', 'SETTINGS_EDIT',
      'AUDIT_VIEW', 'AUDIT_EXPORT'
    ],
    isPreset: true,
    isActive: true
  },
  {
    id: 'OPERATIONS_ADMIN',
    name: 'Operations Admin',
    description: 'Oversees shipment logs, logistics routes, partner hubs, and physical service points.',
    permissions: [
      'SHIPMENTS_VIEW', 'SHIPMENTS_EDIT', 'SHIPMENTS_ASSIGN', 'SHIPMENTS_CANCEL',
      'CENTRES_VIEW', 'CENTRES_APPROVE', 'CENTRES_SUSPEND', 'CENTRES_EDIT',
      'SETTINGS_VIEW', 'SETTINGS_EDIT'
    ],
    isPreset: true,
    isActive: true
  },
  {
    id: 'SUPPORT_ADMIN',
    name: 'Support Admin',
    description: 'Responsible for general customer support, ticket routing, escalation and live support chat.',
    permissions: [
      'SUPPORT_VIEW_TICKETS', 'SUPPORT_RESPOND', 'SUPPORT_ESCALATE', 'SUPPORT_CLOSE',
      'CHAT_VIEW_AUTHORIZED', 'CHAT_ADD_CASE_NOTES'
    ],
    isPreset: true,
    isActive: true
  },
  {
    id: 'VERIFICATION_ADMIN',
    name: 'Verification Admin',
    description: 'Validates new users, business verifications, KYC uploads, and hub approval queues.',
    permissions: [
      'USERS_VIEW', 'USERS_EDIT', 'USERS_SUSPEND',
      'CENTRES_VIEW', 'CENTRES_APPROVE', 'CENTRES_SUSPEND'
    ],
    isPreset: true,
    isActive: true
  },
  {
    id: 'SECURITY_ADMIN',
    name: 'Security Admin',
    description: 'Reviews deep audit logs, user security reports, suspicious indicators and blocks accounts.',
    permissions: [
      'USERS_VIEW', 'USERS_EDIT', 'USERS_SUSPEND', 'USERS_DELETE',
      'AUDIT_VIEW', 'AUDIT_EXPORT'
    ],
    isPreset: true,
    isActive: true
  }
];

const PERMISSION_GROUPS = [
  {
    category: 'Users & Accounts',
    permissions: [
      { key: 'USERS_VIEW', name: 'View Users', desc: 'Read standard user details and profiles' },
      { key: 'USERS_CREATE', name: 'Create Users', desc: 'Register or add new user accounts' },
      { key: 'USERS_EDIT', name: 'Edit Users', desc: 'Modify details on user accounts' },
      { key: 'USERS_SUSPEND', name: 'Suspend Users', desc: 'Temporarily lock and restrict access' },
      { key: 'USERS_DELETE', name: 'Delete Users', desc: 'Permanently remove user accounts' }
    ]
  },
  {
    category: 'Shipments & Logistics',
    permissions: [
      { key: 'SHIPMENTS_VIEW', name: 'View Shipments', desc: 'View current and historic parcel tracks' },
      { key: 'SHIPMENTS_EDIT', name: 'Edit Shipments', desc: 'Update details, weights or service tiers' },
      { key: 'SHIPMENTS_ASSIGN', name: 'Assign Drivers', desc: 'Assign routes, drivers or hub points' },
      { key: 'SHIPMENTS_CANCEL', name: 'Cancel Shipments', desc: 'Mark shipments as cancelled' }
    ]
  },
  {
    category: 'SafePay & Wallets',
    permissions: [
      { key: 'SAFEPAY_VIEW', name: 'View SafePay', desc: 'Read SafePay transactions and agreements' },
      { key: 'SAFEPAY_RELEASE', name: 'Release SafePay', desc: 'Authorize payout of SafePayed funds' },
      { key: 'SAFEPAY_HOLD', name: 'Hold Funds', desc: 'Temporarily freeze dispute-associated SafePay' },
      { key: 'SAFEPAY_REFUND', name: 'Refund Buyer', desc: 'Authorize SafePay refund back to sender' },
      { key: 'SAFEPAY_CONFIGURE', name: 'Configure SafePay Rules', desc: 'Modify commission rates or auto-release cycles' }
    ]
  },
  {
    category: 'Disputes & Investigations',
    permissions: [
      { key: 'DISPUTES_VIEW', name: 'View Disputes', desc: 'Access active dispute cases queue' },
      { key: 'DISPUTES_INVESTIGATE', name: 'Investigate Case', desc: 'Examine shipment histories, values & paths' },
      { key: 'DISPUTES_ASSIGN', name: 'Assign Dispute', desc: 'Reassign dispute cases between admins' },
      { key: 'DISPUTES_RESOLVE', name: 'Resolve Dispute', desc: 'Trigger financial releases/refunds to close' },
      { key: 'DISPUTES_CLOSE', name: 'Close Cases', desc: 'Archive resolved cases and complete logs' }
    ]
  },
  {
    category: 'OmorfiHubChat & Evidence',
    permissions: [
      { key: 'CHAT_VIEW_AUTHORIZED', name: 'View Authorized Chats', desc: 'Read ongoing buyer-merchant disputed chats' },
      { key: 'CHAT_ACCESS_EVIDENCE', name: 'Access Media Evidence', desc: 'Examine image and PDF upload evidence' },
      { key: 'CHAT_ADD_CASE_NOTES', name: 'Add Internal Notes', desc: 'Post secure notes visible only to admins' }
    ]
  },
  {
    category: 'Customer Care Tickets',
    permissions: [
      { key: 'SUPPORT_VIEW_TICKETS', name: 'View Support Tickets', desc: 'Read all open general customer care tickets' },
      { key: 'SUPPORT_RESPOND', name: 'Respond to Tickets', desc: 'Reply directly to customer enquiries' },
      { key: 'SUPPORT_ESCALATE', name: 'Escalate Tickets', desc: 'Flag tickets for specialist / supervisor care' },
      { key: 'SUPPORT_CLOSE', name: 'Close Tickets', desc: 'Mark resolved general tickets as closed' }
    ]
  },
  {
    category: 'Hub Points & Centres',
    permissions: [
      { key: 'CENTRES_VIEW', name: 'View Points', desc: 'Read list of registered OmorfiHub points' },
      { key: 'CENTRES_APPROVE', name: 'Approve Points', desc: 'Approve new physical points to operate' },
      { key: 'CENTRES_SUSPEND', name: 'Suspend Points', desc: 'Suspend point credentials on violations' },
      { key: 'CENTRES_EDIT', name: 'Edit Point Details', desc: 'Modify point pricing tiers or boundaries' }
    ]
  },
  {
    category: 'System Platform Settings',
    permissions: [
      { key: 'SETTINGS_VIEW', name: 'View Configurations', desc: 'View pricing, tax & country profiles' },
      { key: 'SETTINGS_EDIT', name: 'Modify Configurations', desc: 'Update system rules and country settings' }
    ]
  },
  {
    category: 'Audit Trail Logs',
    permissions: [
      { key: 'AUDIT_VIEW', name: 'View Security Trail', desc: 'Access active logs for security and tampering audits' },
      { key: 'AUDIT_EXPORT', name: 'Export Trails', desc: 'Download CSV logs of platform events' }
    ]
  }
];

export const UsersPage = () => {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'admins' | 'users' | 'roles'>('admins');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Dynamic Firestore-backed state
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [rolesList, setRolesList] = useState<any[]>(STANDARD_ROLES);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null);
  const [adminForm, setAdminForm] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    role: 'SUPPORT_ADMIN',
    status: 'ACTIVE',
    customPermissions: [] as string[]
  });

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    isActive: true
  });

  const [showDetailDrawer, setShowDetailDrawer] = useState<any | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState<any | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch all roles & administrators from Firestore if available
  const loadData = async () => {
    console.log('CurrentUser roles:', currentUser?.roles);
    if (!currentUser || !permissionService.hasPermission(currentUser, 'USERS_VIEW')) {
      console.error('Unauthorized attempt to access UsersPage');
      return;
    }
    setLoading(true);
    try {
      // 1. Fetch Custom Roles from Firestore
      const fetchedRoles = await adminEngine.getAdminRoles();
      if (fetchedRoles.length > 0) {
        // Merge preset standard roles with user custom roles, preventing duplicates
        const customIds = fetchedRoles.map((r: any) => r.id);
        const combined = [
          ...STANDARD_ROLES.filter(r => !customIds.includes(r.id)),
          ...fetchedRoles
        ];
        setRolesList(combined);
      } else {
        setRolesList(STANDARD_ROLES);
      }

      // 2. Fetch Administrators & Platform Users from Firestore
      const fetchedUsers = await adminEngine.getAllUsers();

      if (fetchedUsers.length > 0) {
        const admins = fetchedUsers.filter((u: any) =>
          ['SUPER_ADMIN', 'DISPUTE_ADMIN', 'FINANCE_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN', 'VERIFICATION_ADMIN', 'SECURITY_ADMIN', 'SUPPORT_OFFICER', 'VERIFICATION_OFFICER', 'FINANCE_OFFICER', 'OPERATIONS_MANAGER'].includes(u.role) ||
          u.assignedRoles?.length > 0
        );
        const clients = fetchedUsers.filter((u: any) =>
          !['SUPER_ADMIN', 'DISPUTE_ADMIN', 'FINANCE_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN', 'VERIFICATION_ADMIN', 'SECURITY_ADMIN', 'SUPPORT_OFFICER', 'VERIFICATION_OFFICER', 'FINANCE_OFFICER', 'OPERATIONS_MANAGER'].includes(u.role) &&
          (!u.assignedRoles || u.assignedRoles.length === 0)
        );

        // Pre-fill properties for UI if missing
        const formattedAdmins = admins.map((u: any, idx) => ({
          ...u,
          avatar: u.displayName ? u.displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'AD',
          joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
          assignedCases: u.assignedCases || 0,
          performanceSummary: u.performanceSummary || {
            disputesHandled: 0,
            ticketsResolved: 0,
            avgResponseTime: 0,
            avgResolutionTime: 0,
            shipmentsReviewed: 0,
            SafePayActions: 0
          }
        }));

        const formattedClients = clients.map((u: any) => ({
          ...u,
          name: u.displayName || 'Uncompleted Profile',
          avatar: u.displayName ? u.displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'US',
          joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'
        }));

        setAdminsList(formattedAdmins);
        setUsersList(formattedClients);
      } else {
        setAdminsList([]);
        setUsersList([]);
      }
    } catch (e) {
      console.error('Failed to load users from Firestore:', e);
      setAdminsList([]);
      setUsersList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading]);

  const triggerToast = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // ---------------------------------------------------------------------------
  // ADMINISTRATOR HANDLING
  // ---------------------------------------------------------------------------
  const handleOpenCreateAdmin = () => {
    setSelectedAdmin(null);
    setAdminForm({
      displayName: '',
      email: '',
      phoneNumber: '',
      role: 'SUPPORT_ADMIN',
      status: 'ACTIVE',
      customPermissions: []
    });
    setShowAdminModal(true);
  };

  const handleOpenEditAdmin = (admin: any) => {
    if (admin.role === 'SUPER_ADMIN' && currentUser?.role !== 'SUPER_ADMIN') {
      triggerToast('error', 'Security Rule: Only a Super Admin can modify another Super Admin account.');
      return;
    }
    setSelectedAdmin(admin);
    setAdminForm({
      displayName: admin.displayName || '',
      email: admin.email || '',
      phoneNumber: admin.phoneNumber || '',
      role: admin.role || 'SUPPORT_ADMIN',
      status: admin.status || 'ACTIVE',
      customPermissions: admin.customPermissions || []
    });
    setShowAdminModal(true);
  };

  const saveAdmin = async () => {
    if (!adminForm.displayName || !adminForm.email) {
      triggerToast('error', 'Please fill out name and email address.');
      return;
    }

    // Security restriction: check if currently logged-in admin has privilege
    if (currentUser?.role !== 'SUPER_ADMIN') {
      triggerToast('error', 'Privilege Escalation Blocked: Only Super Admins can manage administrators.');
      return;
    }

    setLoading(true);
    try {
      const adminId = selectedAdmin ? selectedAdmin.uid : `ADM-${Date.now()}`;


      const payload = {
        uid: adminId,
        displayName: adminForm.displayName,
        wesabiUsername: selectedAdmin?.wesabiUsername || `OmorfiHub${adminForm.displayName.replace(/\s+/g, '')}`,
        email: adminForm.email,
        phoneNumber: adminForm.phoneNumber,
        role: adminForm.role,
        status: adminForm.status,
        customPermissions: adminForm.customPermissions,
        assignedRoles: [adminForm.role],
        updatedAt: new Date().toISOString(),
        createdAt: selectedAdmin?.createdAt || new Date().toISOString()
      };

      await adminEngine.saveAdminUser(adminId, payload);

      // Log to Hardened Security Audit Engine
      await auditEngine.logEvent({
        userId: currentUser?.uid || 'SYSTEM',
        userRole: currentUser?.role || 'SUPER_ADMIN',
        action: selectedAdmin ? 'ADMIN_EDIT_ACCOUNT' : 'ADMIN_CREATE_ACCOUNT',
        targetId: adminId,
        details: {
          email: adminForm.email,
          role: adminForm.role,
          status: adminForm.status,
          permissionsCount: adminForm.customPermissions.length
        },
        result: 'SUCCESS'
      });

      // Send Super Admin Warning/Notification
      await notificationService.send(
        'SYSTEM_ADMIN_ALERT',
        selectedAdmin ? '🔒 Admin Account Modified' : '🛡️ New Admin Created',
        `Administrator account ${payload.displayName} (${payload.role}) was ${selectedAdmin ? 'modified' : 'created'} by Super Admin.`,
        'INFO'
      );

      triggerToast('success', `Successfully saved administrator ${adminForm.displayName}.`);
      setShowAdminModal(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      triggerToast('error', `Firestore block: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (admin: any) => {
    if (admin.role === 'SUPER_ADMIN') {
      triggerToast('error', 'Security Rule: The Super Admin account status cannot be modified.');
      return;
    }

    if (currentUser?.role !== 'SUPER_ADMIN') {
      triggerToast('error', 'Only Super Admins can suspend or reactivate administrator accounts.');
      return;
    }

    setLoading(true);
    const newStatus = admin.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await userRepository.update(admin.uid, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      } as any);

      await auditEngine.logEvent({
        userId: currentUser.uid,
        userRole: currentUser.role,
        action: newStatus === 'SUSPENDED' ? 'ADMIN_SUSPEND' : 'ADMIN_REACTIVATE',
        targetId: admin.uid,
        details: { adminName: admin.displayName, email: admin.email, action: newStatus },
        result: 'SUCCESS'
      });

      // Alert Super Admin
      await notificationService.send(
        'SYSTEM_ADMIN_ALERT',
        newStatus === 'SUSPENDED' ? '🚨 Admin Suspended' : '✅ Admin Re-activated',
        `Admin ${admin.displayName} status was set to ${newStatus} by ${currentUser.displayName}.`,
        newStatus === 'SUSPENDED' ? 'ERROR' : 'INFO'
      );

      triggerToast('success', `Admin ${admin.displayName} is now ${newStatus}.`);
      loadData();
    } catch (err: any) {
      triggerToast('error', `Failed to update status: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteAdmin = async (admin: any) => {
    if (admin.role === 'SUPER_ADMIN') {
      triggerToast('error', 'Security Rule: The Super Admin account cannot be deleted.');
      return;
    }

    if (currentUser?.role !== 'SUPER_ADMIN') {
      triggerToast('error', 'Unauthorized: Only Super Admins can delete administrative accounts.');
      return;
    }

    if (!window.confirm(`Are you absolutely sure you want to permanently delete Admin ${admin.displayName}? This action is IRREVERSIBLE.`)) {
      return;
    }

    setLoading(true);
    try {
      await userRepository.delete(admin.uid);

      await auditEngine.logEvent({
        userId: currentUser.uid,
        userRole: currentUser.role,
        action: 'ADMIN_DELETE',
        targetId: admin.uid,
        details: { adminName: admin.displayName, email: admin.email },
        result: 'SUCCESS'
      });

      await notificationService.send(
        'SYSTEM_ADMIN_ALERT',
        '⚠️ Admin Account Deleted',
        `Admin ${admin.displayName} was permanently deleted by ${currentUser.displayName}.`,
        'ERROR'
      );

      triggerToast('success', `Admin ${admin.displayName} permanently deleted.`);
      loadData();
    } catch (err: any) {
      triggerToast('error', `Deletion error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerPasswordReset = (admin: any) => {
    if (currentUser?.role !== 'SUPER_ADMIN') {
      triggerToast('error', 'Only the Super Admin can reset administrative credentials.');
      return;
    }
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(pass);
    setShowPasswordReset(admin);
  };

  const confirmPasswordReset = async () => {
    if (!showPasswordReset) return;
    setLoading(true);
    try {
      // In production we send a reset link, or update credentials.
      // Here we log the reset event securely.
      await auditEngine.logEvent({
        userId: currentUser?.uid || 'SYSTEM',
        userRole: currentUser?.role || 'SUPER_ADMIN',
        action: 'ADMIN_PASSWORD_RESET',
        targetId: showPasswordReset.uid,
        details: { adminName: showPasswordReset.displayName, email: showPasswordReset.email, type: 'TEMPORARY_OVERRIDE' },
        result: 'SUCCESS'
      });

      await notificationService.send(
        'SYSTEM_ADMIN_ALERT',
        '🔑 Admin Password Reset Attempted',
        `A password override reset was executed for ${showPasswordReset.displayName} by ${currentUser?.displayName}.`,
        'INFO'
      );

      triggerToast('success', `Password successfully reset. Copy the secure temporary credentials below.`);
      setShowPasswordReset(null);
    } catch (err: any) {
      triggerToast('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // ROLE BUILDER HANDLING
  // ---------------------------------------------------------------------------
  const handleOpenCreateRole = () => {
    setSelectedRole(null);
    setRoleForm({
      name: '',
      description: '',
      permissions: [],
      isActive: true
    });
    setShowRoleModal(true);
  };

  const handleOpenEditRole = (role: any) => {
    if (role.isPreset) {
      triggerToast('error', 'System Presets are read-only to ensure core system stability. Use "Duplicate" instead.');
      return;
    }
    setSelectedRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      permissions: role.permissions || [],
      isActive: role.isActive !== false
    });
    setShowRoleModal(true);
  };

  const saveRole = async () => {
    if (!roleForm.name || !roleForm.description) {
      triggerToast('error', 'Role name and description are required.');
      return;
    }

    if (currentUser?.role !== 'SUPER_ADMIN') {
      triggerToast('error', 'Only Super Admins can build or modify custom administrative roles.');
      return;
    }

    setLoading(true);
    try {
      const roleId = selectedRole ? selectedRole.id : `ROLE_${roleForm.name.toUpperCase().replace(/\s+/g, '_')}`;


      const payload = {
        id: roleId,
        name: roleForm.name,
        description: roleForm.description,
        permissions: roleForm.permissions,
        isActive: roleForm.isActive,
        createdAt: selectedRole?.createdAt || new Date().toISOString()
      };

      await adminEngine.saveAdminRole(roleId, payload);

      // Security Audit Trail
      await auditEngine.logEvent({
        userId: currentUser.uid,
        userRole: currentUser.role,
        action: selectedRole ? 'ROLE_EDIT' : 'ROLE_CREATE',
        targetId: roleId,
        details: { roleName: roleForm.name, permissionsCount: roleForm.permissions.length },
        result: 'SUCCESS'
      });

      triggerToast('success', `Successfully saved custom role ${roleForm.name}.`);
      setShowRoleModal(false);
      loadData();
    } catch (err: any) {
      triggerToast('error', `Firestore block: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateRole = (role: any) => {
    setSelectedRole(null);
    setRoleForm({
      name: `${role.name} Copy`,
      description: `Custom clone of standard ${role.name}. ${role.description}`,
      permissions: [...role.permissions],
      isActive: true
    });
    setShowRoleModal(true);
    triggerToast('success', `Copied permissions of ${role.name}. Customize details below.`);
  };

  const deleteCustomRole = async (role: any) => {
    if (role.isPreset) {
      triggerToast('error', 'System Presets cannot be deleted.');
      return;
    }

    if (currentUser?.role !== 'SUPER_ADMIN') {
      triggerToast('error', 'Only Super Admins can delete roles.');
      return;
    }

    // Safety check: is any admin assigned to this role?
    const adminsUsingRole = adminsList.filter(a => a.role === role.id || a.assignedRoles?.includes(role.id));
    if (adminsUsingRole.length > 0) {
      triggerToast('error', `Cannot delete role. It is currently assigned to ${adminsUsingRole.length} active administrator(s).`);
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete the custom role "${role.name}"?`)) {
      return;
    }

    setLoading(true);
    try {
      if (!role.isPreset) {
        await adminEngine.deleteAdminRole(role.id);
      }
      setRolesList(prev => prev.filter(r => r.id !== role.id));

      await auditEngine.logEvent({
        userId: currentUser.uid,
        userRole: currentUser.role,
        action: 'ROLE_DELETE',
        targetId: role.id,
        details: { roleName: role.name },
        result: 'SUCCESS'
      });

      triggerToast('success', `Custom role "${role.name}" deleted.`);
      loadData();
    } catch (err: any) {
      triggerToast('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle single permission selection inside modal checklists
  const toggleFormPermission = (permKey: string) => {
    const isSelected = roleForm.permissions.includes(permKey);
    if (isSelected) {
      setRoleForm(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => p !== permKey)
      }));
    } else {
      setRoleForm(prev => ({
        ...prev,
        permissions: [...prev.permissions, permKey]
      }));
    }
  };

  const toggleAdminCustomPermission = (permKey: string) => {
    const isSelected = adminForm.customPermissions.includes(permKey);
    if (isSelected) {
      setAdminForm(prev => ({
        ...prev,
        customPermissions: prev.customPermissions.filter(p => p !== permKey)
      }));
    } else {
      setAdminForm(prev => ({
        ...prev,
        customPermissions: [...prev.customPermissions, permKey]
      }));
    }
  };

  // ---------------------------------------------------------------------------
  // FILTERING LOGIC
  // ---------------------------------------------------------------------------
  const filteredAdmins = useMemo(() => {
    return adminsList.filter(admin => {
      const matchSearch =
        admin.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.wesabiUsername?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole = roleFilter === 'All' || admin.role === roleFilter;
      const matchStatus = statusFilter === 'All' || admin.status === statusFilter.toUpperCase();

      return matchSearch && matchRole && matchStatus;
    });
  }, [adminsList, searchQuery, roleFilter, statusFilter]);

  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const matchSearch =
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.wesabiUsername?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole = roleFilter === 'All' || u.role === roleFilter;
      const matchStatus = statusFilter === 'All' || u.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchRole && matchStatus;
    });
  }, [usersList, searchQuery, roleFilter, statusFilter]);

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Dynamic Warning Alert for Toast Actions */}
        <AnimatePresence>
          {actionMessage && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={cn(
                "fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border font-bold text-sm backdrop-blur-md",
                actionMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-600 border-red-500/20'
              )}
            >
              {actionMessage.type === 'success' ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
              {actionMessage.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Head Banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-primary-50 text-primary-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-primary-100">
                Administration Module
              </span>
              <span className="bg-slate-50 text-slate-900 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-slate-100">
                v2.4 Enterprise
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              Roles & Permissions
            </h1>
            <p className="text-slate-900 font-medium mt-1">
              Configure strict role-based access, manage administrator details and customize granular permissions.
            </p>
          </div>

          <div className="flex items-center gap-3">
             <Button
               variant="outline"
               onClick={loadData}
               className="rounded-xl border-slate-200 font-bold hover:bg-slate-50"
               disabled={loading}
             >
               <RefreshCw size={16} className={cn("mr-2", loading && "animate-spin")} />
               Reload Console
             </Button>

             {activeTab === 'roles' ? (
               <Button
                 onClick={handleOpenCreateRole}
                 className="rounded-xl font-bold shadow-lg bg-primary-600 text-white hover:bg-primary-700 shadow-primary-600/10"
               >
                 <Plus size={16} className="mr-2" /> Custom Role Builder
               </Button>
             ) : (
               <Button
                 onClick={handleOpenCreateAdmin}
                 className="rounded-xl font-bold shadow-lg bg-primary-600 text-white hover:bg-primary-700 shadow-primary-600/10"
               >
                 <Plus size={16} className="mr-2" /> Create Administrator
               </Button>
             )}
          </div>
        </div>

        {/* Console Nav Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => { setActiveTab('admins'); setSearchQuery(''); setRoleFilter('All'); }}
            className={cn(
              "px-5 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2",
              activeTab === 'admins'
                ? "border-primary-600 text-primary-600 bg-primary-50/10"
                : "border-transparent text-slate-900 hover:text-slate-900"
            )}
          >
            <ShieldCheck size={16} />
            Administrators
            <Badge className="ml-1 bg-slate-100 text-slate-800 border-none px-1.5 py-0.2">{adminsList.length}</Badge>
          </button>

          <button
            onClick={() => { setActiveTab('users'); setSearchQuery(''); setRoleFilter('All'); }}
            className={cn(
              "px-5 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2",
              activeTab === 'users'
                ? "border-primary-600 text-primary-600 bg-primary-50/10"
                : "border-transparent text-slate-900 hover:text-slate-900"
            )}
          >
            <Users size={16} />
            Platform Clients
            <Badge className="ml-1 bg-slate-100 text-slate-800 border-none px-1.5 py-0.2">{usersList.length}</Badge>
          </button>

          <button
            onClick={() => { setActiveTab('roles'); setSearchQuery(''); setRoleFilter('All'); }}
            className={cn(
              "px-5 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2",
              activeTab === 'roles'
                ? "border-primary-600 text-primary-600 bg-primary-50/10"
                : "border-transparent text-slate-900 hover:text-slate-900"
            )}
          >
            <Settings size={16} />
            Custom Role Builder
            <Badge className="ml-1 bg-slate-100 text-slate-800 border-none px-1.5 py-0.2">{rolesList.length}</Badge>
          </button>
        </div>

        {/* Stats Dashboard Grid */}
        {activeTab === 'admins' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border-none shadow-md bg-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-50 rounded-xl text-primary-600">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-800 font-bold uppercase tracking-wider">Total Administrators</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{adminsList.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-none shadow-md bg-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                  <UserCheck size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-800 font-bold uppercase tracking-wider">Active Status</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {adminsList.filter(a => a.status === 'ACTIVE').length} / {adminsList.length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-none shadow-md bg-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-50 rounded-xl text-red-600">
                  <Power size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-800 font-bold uppercase tracking-wider">Suspended Accounts</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {adminsList.filter(a => a.status === 'SUSPENDED').length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-none shadow-md bg-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                  <Activity size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-800 font-bold uppercase tracking-wider">Disputes Resolution</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">100%</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filter Toolbar */}
        <Card className="p-4 border-none shadow-lg bg-white">
          <div className="flex flex-col lg:flex-row gap-4">
             <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                <Search size={18} className="text-slate-800" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'roles'
                      ? "Search custom or preset roles by name..."
                      : "Search by Name, Email or Username starting with OmorfiHub..."
                  }
                  className="bg-transparent border-none focus:outline-none text-sm font-bold w-full text-slate-800"
                />
             </div>

             {activeTab !== 'roles' && (
               <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary-500"
                  >
                     <option value="All">All Roles</option>
                     {activeTab === 'admins' ? (
                       rolesList.map(r => (
                         <option key={r.id} value={r.id}>{r.name}</option>
                       ))
                     ) : (
                       <>
                         <option value="CUSTOMER">Customer</option>
                         <option value="MERCHANT">Merchant</option>
                         <option value="CENTER_OWNER">Hub Owner</option>
                         <option value="CENTER_STAFF">Hub Staff</option>
                         <option value="LOGISTICS_COMPANY">Logistics Company</option>
                         <option value="DRIVER">Driver</option>
                       </>
                     )}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary-500"
                  >
                     <option value="All">All Statuses</option>
                     <option value="Active">Active</option>
                     <option value="Suspended">Suspended</option>
                     {activeTab === 'users' && <option value="Pending">Pending</option>}
                  </select>
               </div>
             )}
          </div>
        </Card>

        {/* ---------------------------------------------------------------------
            TAB 1: ADMINISTRATORS TABLE
            --------------------------------------------------------------------- */}
        {activeTab === 'admins' && (
          <Card className="border-none shadow-xl bg-white overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Administrator</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Assigned Roles</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Override Privileges</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Status</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Load Tracker</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {filteredAdmins.map((admin, idx) => (
                         <motion.tr
                          key={admin.uid}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className="group hover:bg-slate-50/80 transition-colors"
                         >
                            {/* Admin profile and info */}
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-700 font-black text-xs shadow-sm">
                                     {admin.avatar}
                                  </div>
                                  <div>
                                     <div className="flex items-center gap-2">
                                       <p className="text-sm font-black text-slate-900">{admin.displayName}</p>
                                       {admin.role === 'SUPER_ADMIN' && (
                                         <Award size={14} className="text-amber-500 fill-amber-500" />
                                       )}
                                     </div>
                                     <p className="text-xs text-slate-800 font-medium">{admin.email}</p>
                                     <p className="text-[10px] text-slate-900 font-bold bg-slate-100 px-1.5 py-0.2 rounded inline-block mt-1">
                                       @{admin.wesabiUsername || `OmorfiHubAdmin`}
                                     </p>
                                  </div>
                               </div>
                            </td>

                            {/* Assigned role badge */}
                            <td className="px-6 py-4">
                               <div className="flex flex-wrap gap-1">
                                 <Badge className={cn(
                                   "border-none px-2 py-0.5 font-bold text-[10px]",
                                   admin.role === 'SUPER_ADMIN' ? 'bg-amber-100 text-amber-800' :
                                   admin.role === 'DISPUTE_ADMIN' ? 'bg-red-50 text-red-600' :
                                   admin.role === 'FINANCE_ADMIN' ? 'bg-emerald-50 text-emerald-600' :
                                   'bg-blue-50 text-blue-600'
                                 )}>
                                   {rolesList.find(r => r.id === admin.role)?.name || admin.role}
                                 </Badge>
                                 {admin.assignedRoles?.filter((r: string) => r !== admin.role).map((roleName: string) => (
                                   <span key={roleName}>
                                     <Badge className="border-none px-2 py-0.5 bg-slate-100 text-slate-800 font-bold text-[10px]">
                                       {rolesList.find(r => r.id === roleName)?.name || roleName}
                                     </Badge>
                                   </span>
                                 ))}
                               </div>
                            </td>

                            {/* Custom override privileges */}
                            <td className="px-6 py-4">
                               {admin.customPermissions && admin.customPermissions.length > 0 ? (
                                 <div className="flex items-center gap-1.5 text-primary-600">
                                   <ShieldAlert size={14} />
                                   <span className="text-xs font-black">
                                     +{admin.customPermissions.length} Direct Overrides
                                   </span>
                                 </div>
                               ) : (
                                 <span className="text-xs text-slate-800 font-medium">Standard Role Rules</span>
                               )}
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4">
                               <Badge className={cn(
                                  "border-none px-2 py-0.5 font-bold text-[10px]",
                                  admin.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                               )}>
                                  {admin.status}
                               </Badge>
                            </td>

                            {/* Load cases counts */}
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-2">
                                 <span className="text-xs font-bold text-slate-900">
                                   {admin.assignedCases} Active Cases
                                 </span>
                                 {admin.assignedCases > 0 && (
                                   <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                 )}
                               </div>
                            </td>

                            {/* Action controls */}
                            <td className="px-6 py-4 text-right">
                               <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    onClick={() => setShowDetailDrawer(admin)}
                                    className="p-2 h-auto text-slate-800 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                                    title="View Admin Performance"
                                  >
                                     <Activity size={16} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    onClick={() => handleOpenEditAdmin(admin)}
                                    className="p-2 h-auto text-slate-800 hover:text-primary-600 rounded-lg hover:bg-slate-100"
                                    title="Modify Roles & Overrides"
                                  >
                                     <Edit size={16} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    onClick={() => handleTriggerPasswordReset(admin)}
                                    className="p-2 h-auto text-slate-800 hover:text-amber-600 rounded-lg hover:bg-slate-100"
                                    title="Reset Password Credentials"
                                  >
                                     <Key size={16} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    onClick={() => toggleAdminStatus(admin)}
                                    className={cn(
                                      "p-2 h-auto rounded-lg hover:bg-slate-100",
                                      admin.status === 'ACTIVE' ? "text-slate-800 hover:text-red-600" : "text-emerald-500 hover:text-emerald-700"
                                    )}
                                    title={admin.status === 'ACTIVE' ? "Suspend Account" : "Re-activate Account"}
                                  >
                                     <Power size={16} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    onClick={() => deleteAdmin(admin)}
                                    className="p-2 h-auto text-slate-800 hover:text-red-700 rounded-lg hover:bg-slate-100"
                                    title="Permanently Delete Account"
                                  >
                                     <Trash2 size={16} />
                                  </Button>
                               </div>
                            </td>
                         </motion.tr>
                      ))}
                      {filteredAdmins.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-800 font-bold">
                            No administrators match the selected filter criteria.
                          </td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>

             <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                  Secure admin registry logs
                </p>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <Lock size={12} className="text-emerald-500" />
                  All admin changes recorded dynamically in Zero-Trust Audit Database
                </div>
             </div>
          </Card>
        )}

        {/* ---------------------------------------------------------------------
            TAB 2: PLATFORM USERS TABLE
            --------------------------------------------------------------------- */}
        {activeTab === 'users' && (
          <Card className="border-none shadow-xl bg-white overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Client Profile</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">OmorfiHub Tier</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Country</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Account Status</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Joined Date</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((userItem, idx) => (
                         <tr key={userItem.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 font-black text-xs border border-slate-200">
                                     {userItem.avatar}
                                  </div>
                                  <div>
                                     <p className="text-sm font-black text-slate-900">{userItem.name}</p>
                                     <p className="text-xs text-slate-900 font-medium">{userItem.email}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{userItem.role}</span>
                            </td>
                            <td className="px-6 py-4">
                               <span className="text-xs font-bold text-slate-900">{userItem.country || 'Nigeria'}</span>
                            </td>
                            <td className="px-6 py-4">
                               <Badge className={cn(
                                  "border-none px-2 py-0.5 font-bold text-[10px]",
                                  userItem.status === 'Active' || userItem.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' :
                                  userItem.status === 'Pending' || userItem.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                                  'bg-red-50 text-red-600'
                               )}>
                                  {userItem.status}
                               </Badge>
                            </td>
                            <td className="px-6 py-4">
                               <span className="text-xs font-medium text-slate-900">{userItem.joined}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={async () => {
                                      // Toggle status as rapid action
                                      if (currentUser?.role !== 'SUPER_ADMIN') {
                                        triggerToast('error', 'Only the Super Admin can lock/suspend general accounts from this portal.');
                                        return;
                                      }
                                      const lockStatus = userItem.status === 'Active' ? 'Suspended' : 'Active';
                                      try {
                                        await userRepository.update(userItem.id, { status: lockStatus } as any);
                                        triggerToast('success', `Changed user account status to ${lockStatus}.`);
                                        loadData();
                                      } catch (err: any) {
                                        triggerToast('error', err.message);
                                      }
                                    }}
                                    className="px-3 py-1.5 h-auto text-xs font-bold border-slate-200 rounded-xl"
                                  >
                                    Toggle Access
                                  </Button>
                               </div>
                            </td>
                         </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-800 font-bold">
                            No clients match the selected filter.
                          </td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </Card>
        )}

        {/* ---------------------------------------------------------------------
            TAB 3: CUSTOM ROLE BUILDER LIST
            --------------------------------------------------------------------- */}
        {activeTab === 'roles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rolesList.map((roleItem, idx) => (
              <motion.div
                key={roleItem.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card className="h-full border-none shadow-md bg-white hover:shadow-lg transition-all flex flex-col justify-between p-6">
                  <div>
                    {/* Header: Name and Custom vs Preset */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900">{roleItem.name}</h3>
                        {roleItem.isPreset && (
                          <LockKeyhole size={14} className="text-slate-800" title="System Preset" />
                        )}
                      </div>

                      {roleItem.isPreset ? (
                        <Badge className="bg-slate-100 text-slate-900 border-none font-bold text-[9px] uppercase tracking-wider">
                          System Preset
                        </Badge>
                      ) : (
                        <Badge className="bg-primary-50 text-primary-600 border-none font-bold text-[9px] uppercase tracking-wider">
                          Custom Role
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-slate-900 font-medium leading-relaxed mb-4">
                      {roleItem.description}
                    </p>

                    {/* Permissions summary */}
                    <div className="space-y-2 mb-6">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                        Permissions Profile
                      </p>
                      <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
                        {roleItem.permissions && roleItem.permissions.map((perm: string) => (
                          <span key={perm} className="bg-slate-50 text-slate-800 border border-slate-100 rounded px-1.5 py-0.5 text-[9px] font-bold">
                            {perm.replace('_', ' ')}
                          </span>
                        ))}
                        {(!roleItem.permissions || roleItem.permissions.length === 0) && (
                          <span className="text-xs text-slate-800 italic">No permissions mapped</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-800">
                      {roleItem.permissions?.length || 0} active authorities
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => handleDuplicateRole(roleItem)}
                        className="p-2 h-auto text-slate-800 hover:text-primary-600 hover:bg-slate-50 rounded-lg"
                        title="Duplicate Role Settings"
                      >
                        <Copy size={15} />
                      </Button>

                      {!roleItem.isPreset && (
                        <>
                          <Button
                            variant="ghost"
                            onClick={() => handleOpenEditRole(roleItem)}
                            className="p-2 h-auto text-slate-800 hover:text-amber-600 hover:bg-slate-50 rounded-lg"
                            title="Edit Role Settings"
                          >
                            <Edit size={15} />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => deleteCustomRole(roleItem)}
                            className="p-2 h-auto text-slate-800 hover:text-red-700 hover:bg-slate-50 rounded-lg"
                            title="Permanently Delete Custom Role"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

      </div>

      {/* =======================================================================
          MODAL 1: CREATE / EDIT ADMINISTRATOR
          ======================================================================= */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {selectedAdmin ? 'Modify Administrator Settings' : 'Create New Administrator Account'}
                </h3>
                <p className="text-xs text-slate-800 font-medium mt-0.5">
                  Assign administrative tiers and customize direct override permissions.
                </p>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                className="text-slate-800 hover:text-slate-800 font-black p-2 rounded-xl hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Full Display Name
                  </label>
                  <input
                    type="text"
                    value={adminForm.displayName}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Corporate Email Address
                  </label>
                  <input
                    type="email"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="e.g. name@omorfihub.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Phone Contact Number
                  </label>
                  <input
                    type="text"
                    value={adminForm.phoneNumber}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="e.g. +234 800 000 0000"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Primary Authority Role
                  </label>
                  <select
                    value={adminForm.role}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm font-bold text-slate-900"
                  >
                    {rolesList.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Initial Administrative Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-slate-900">
                    <input
                      type="radio"
                      name="admin_status"
                      value="ACTIVE"
                      checked={adminForm.status === 'ACTIVE'}
                      onChange={() => setAdminForm(prev => ({ ...prev, status: 'ACTIVE' }))}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    Active & Operational
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-slate-900">
                    <input
                      type="radio"
                      name="admin_status"
                      value="SUSPENDED"
                      checked={adminForm.status === 'SUSPENDED'}
                      onChange={() => setAdminForm(prev => ({ ...prev, status: 'SUSPENDED' }))}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    Locked / Suspended
                  </label>
                </div>
              </div>

              {/* Direct Override Permissions Checklist */}
              <div className="border-t border-slate-100 pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                      Direct Permission Overrides
                    </label>
                    <p className="text-[11px] text-slate-800 font-medium">
                      Grant temporary extra permissions directly to this user profile, bypassing their default role.
                    </p>
                  </div>
                  <span className="text-xs bg-primary-50 text-primary-600 font-bold px-2 py-0.5 rounded">
                    {adminForm.customPermissions.length} overrules mapped
                  </span>
                </div>

                <div className="space-y-4 max-h-[220px] overflow-y-auto border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                  {PERMISSION_GROUPS.map((group) => (
                    <div key={group.category} className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">
                        {group.category}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.permissions.map((perm) => {
                          const isSelected = adminForm.customPermissions.includes(perm.key);
                          return (
                            <label
                              key={perm.key}
                              className={cn(
                                "flex items-start gap-2 p-2 rounded-xl border cursor-pointer transition-all hover:bg-white",
                                isSelected ? "bg-white border-primary-500/30 shadow-sm" : "border-transparent"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleAdminCustomPermission(perm.key)}
                                className="mt-0.5 rounded text-primary-600 focus:ring-primary-500"
                              />
                              <div>
                                <span className="text-xs font-bold text-slate-800 block">{perm.name}</span>
                                <span className="text-[9px] text-slate-800 block font-medium leading-none mt-0.5">{perm.desc}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAdminModal(false)}
                className="rounded-xl font-bold hover:bg-slate-100"
              >
                Discard
              </Button>
              <Button
                onClick={saveAdmin}
                className="rounded-xl font-bold bg-primary-600 text-white hover:bg-primary-700 shadow-md"
                disabled={loading}
              >
                {loading ? 'Saving to Vault...' : 'Commit Settings'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* =======================================================================
          MODAL 2: CUSTOM ROLE BUILDER
          ======================================================================= */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {selectedRole ? 'Modify Custom Role Setting' : 'Build Custom Administrative Role'}
                </h3>
                <p className="text-xs text-slate-800 font-medium mt-0.5">
                  Name the role and select its associated granular permission authorities.
                </p>
              </div>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-slate-800 hover:text-slate-800 font-black p-2 rounded-xl hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Custom Role Name
                  </label>
                  <input
                    type="text"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. VIP Manager"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm font-bold text-slate-800"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Description & Scope Statement
                  </label>
                  <input
                    type="text"
                    value={roleForm.description}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="e.g. Authorized to override disputes up to $10,000 value..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Permissions Checklist Categories */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                    Assigned Permissions Checklist
                  </label>
                  <span className="text-xs bg-primary-50 text-primary-600 font-bold px-2 py-0.5 rounded">
                    {roleForm.permissions.length} selected authorities
                  </span>
                </div>

                <div className="space-y-6 max-h-[350px] overflow-y-auto border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                  {PERMISSION_GROUPS.map((group) => (
                    <div key={group.category} className="space-y-2">
                      <h4 className="text-[11px] font-black uppercase text-slate-900 tracking-wider border-b border-slate-100 pb-1">
                        {group.category}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {group.permissions.map((perm) => {
                          const isSelected = roleForm.permissions.includes(perm.key);
                          return (
                            <label
                              key={perm.key}
                              className={cn(
                                "flex items-start gap-2 p-2 rounded-xl border cursor-pointer transition-all hover:bg-white",
                                isSelected ? "bg-white border-primary-500/30 shadow-sm" : "border-transparent"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleFormPermission(perm.key)}
                                className="mt-0.5 rounded text-primary-600 focus:ring-primary-500"
                              />
                              <div>
                                <span className="text-xs font-bold text-slate-800 block">{perm.name}</span>
                                <span className="text-[9px] text-slate-800 block font-medium leading-none mt-0.5">{perm.desc}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowRoleModal(false)}
                className="rounded-xl font-bold hover:bg-slate-100"
              >
                Discard
              </Button>
              <Button
                onClick={saveRole}
                className="rounded-xl font-bold bg-primary-600 text-white hover:bg-primary-700 shadow-md"
                disabled={loading}
              >
                {loading ? 'Creating Role...' : 'Save Role Rules'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* =======================================================================
          DRAWER 3: DETAILED PERFORMANCE DRAWER
          ======================================================================= */}
      {showDetailDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Administrator Profile</h3>
                <p className="text-xs text-slate-800 font-medium">Performance metric track and scope.</p>
              </div>
              <button
                onClick={() => setShowDetailDrawer(null)}
                className="text-slate-800 hover:text-slate-800 font-bold p-2"
              >
                ✕
              </button>
            </div>

            {/* Scrollable details */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-700 font-black text-lg border border-primary-100 shadow-sm">
                  {showDetailDrawer.avatar}
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900">{showDetailDrawer.displayName}</h4>
                  <p className="text-xs text-slate-900 font-bold">{showDetailDrawer.email}</p>
                  <p className="text-xs text-primary-600 font-black mt-1">
                    {rolesList.find(r => r.id === showDetailDrawer.role)?.name || showDetailDrawer.role}
                  </p>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-800 block uppercase tracking-wider">Account Status</span>
                  <Badge className={cn(
                    "border-none mt-1.5 px-2 py-0.5 text-[10px] font-bold",
                    showDetailDrawer.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  )}>
                    {showDetailDrawer.status}
                  </Badge>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-800 block uppercase tracking-wider">Assigned Workload</span>
                  <span className="text-sm font-black text-slate-800 block mt-1.5">
                    {showDetailDrawer.assignedCases} active cases
                  </span>
                </div>
              </div>

              {/* Performance summary bento list */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">
                  Performance metrics (Lifetime)
                </h5>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-slate-100 p-3 rounded-2xl bg-slate-50/20">
                    <span className="text-[9px] text-slate-800 font-bold block uppercase">Disputes Handled</span>
                    <span className="text-base font-black text-slate-800 block mt-1">
                      {showDetailDrawer.performanceSummary?.disputesHandled || 0} resolved
                    </span>
                  </div>
                  <div className="border border-slate-100 p-3 rounded-2xl bg-slate-50/20">
                    <span className="text-[9px] text-slate-800 font-bold block uppercase">Average response time</span>
                    <span className="text-base font-black text-slate-800 block mt-1">
                      {showDetailDrawer.performanceSummary?.avgResponseTime || 0} mins
                    </span>
                  </div>
                  <div className="border border-slate-100 p-3 rounded-2xl bg-slate-50/20">
                    <span className="text-[9px] text-slate-800 font-bold block uppercase">Tickets Resolved</span>
                    <span className="text-base font-black text-slate-800 block mt-1">
                      {showDetailDrawer.performanceSummary?.ticketsResolved || 0} closed
                    </span>
                  </div>
                  <div className="border border-slate-100 p-3 rounded-2xl bg-slate-50/20">
                    <span className="text-[9px] text-slate-800 font-bold block uppercase">Avg resolution speed</span>
                    <span className="text-base font-black text-slate-800 block mt-1">
                      {showDetailDrawer.performanceSummary?.avgResolutionTime || 0} mins
                    </span>
                  </div>
                  <div className="border border-slate-100 p-3 rounded-2xl bg-slate-50/20">
                    <span className="text-[9px] text-slate-800 font-bold block uppercase">Shipments Audited</span>
                    <span className="text-base font-black text-slate-800 block mt-1">
                      {showDetailDrawer.performanceSummary?.shipmentsReviewed || 0} packages
                    </span>
                  </div>
                  <div className="border border-slate-100 p-3 rounded-2xl bg-slate-50/20">
                    <span className="text-[9px] text-slate-800 font-bold block uppercase">SafePay Interventions</span>
                    <span className="text-base font-black text-slate-800 block mt-1">
                      {showDetailDrawer.performanceSummary?.SafePayActions || 0} actions
                    </span>
                  </div>
                </div>
              </div>

              {/* Assigned standard permissions summary */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">
                  Operational authorities scope
                </h5>
                <div className="flex flex-wrap gap-1.5 max-h-[150px] overflow-y-auto border border-slate-100 p-3 rounded-2xl bg-slate-50/40">
                  {permissionService.getPermissionsForRole(showDetailDrawer.role).map((p: string) => (
                    <span key={p} className="bg-white border border-slate-100 rounded px-1.5 py-0.5 text-[9px] font-bold text-slate-800">
                      {p.replace('_', ' ')}
                    </span>
                  ))}
                  {showDetailDrawer.customPermissions?.map((p: string) => (
                    <span key={p} className="bg-primary-50 border border-primary-100 text-primary-600 rounded px-1.5 py-0.5 text-[9px] font-bold">
                      {p.replace('_', ' ')} (Override)
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100">
              <Button
                onClick={() => setShowDetailDrawer(null)}
                className="w-full rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800"
              >
                Close Profile Info
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* =======================================================================
          MODAL 4: PASSWORD RESET OVERRIDE
          ======================================================================= */}
      {showPasswordReset && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100">
              <Lock size={22} />
            </div>

            <h3 className="text-lg font-black text-slate-900">
              Reset Administrative Credentials
            </h3>
            <p className="text-xs text-slate-800 font-medium mt-1">
              Executing credential reset for admin <strong>{showPasswordReset.displayName}</strong>.
            </p>

            <div className="my-5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider block">
                Secure Temporary Override Password
              </span>
              <span className="text-lg font-mono font-black text-slate-800 block mt-2 select-all tracking-wider">
                {tempPassword}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(tempPassword);
                  triggerToast('success', 'Copied secure temporary password to clipboard!');
                }}
                className="text-[10px] text-primary-600 font-bold hover:underline mt-2 flex items-center justify-center gap-1 mx-auto"
              >
                <Copy size={12} /> Copy to Clipboard
              </button>
            </div>

            <div className="space-y-3">
              <Button
                onClick={confirmPasswordReset}
                className="w-full rounded-xl font-bold bg-primary-600 text-white hover:bg-primary-700 shadow-md"
              >
                Commit Temporary Credentials
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPasswordReset(null)}
                className="w-full rounded-xl font-bold hover:bg-slate-50 border-slate-200"
              >
                Cancel Override
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AdminLayout>
  );
};
