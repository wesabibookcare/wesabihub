import { UserRole, User, RegistrationPayload, UserStatus, ApplicationStatus, RoleApplication } from '../types';
import { Permission } from '../services/permissionService';
import { userRepository } from '../services/db/UserRepository';
import { permissionService } from '../services/permissionService';
import { authService } from '../services/authService';
import { roleApplicationRepository } from '../services/db/RoleApplicationRepository';
import { monitoringEngine } from './MonitoringEngine';
import { addressRepository } from '../services/db/AddressRepository';
import { supportTicketRepository } from '../services/db/SupportTicketRepository';
import {
  storageEngine,
  notificationEngine,
  auditEngine,
  configurationEngine
} from './index';

/**
 * OmorfiHub User & Identity Engine
 * Manages user lifecycle, authentication mapping, and permissions.
 */
class UserEngine {
  private static instance: UserEngine;

  private constructor() {}

  public static getInstance(): UserEngine {
    if (!UserEngine.instance) {
      UserEngine.instance = new UserEngine();
    }
    return UserEngine.instance;
  }

  async getUser(userId: string): Promise<User | null> {
    return await userRepository.getById(userId);
  }

  /**
   * Authoritative source for User Registration journey
   */
  async registerUser(payload: RegistrationPayload, options: { sendVerification?: boolean } = {}): Promise<User> {
    try {
      const { uid, email, displayName, role, profileData, files } = payload;

      // Idempotency check: prevent duplicate profile creation
      const existingUser = await userRepository.getById(uid);
      if (existingUser) {
        await auditEngine.logEvent({
          userId: uid,
          userRole: existingUser.role,
          action: 'REGISTRATION_IDEMPOTENT_RESOLVE',
          details: { role: existingUser.role, status: existingUser.status },
          result: 'SUCCESS'
        });
        return existingUser;
      }

    // 1. Validate public registration role authority:
    const VALID_PUBLIC_ROLES: UserRole[] = ['CUSTOMER', 'MERCHANT', 'CENTER_OWNER', 'CENTER_STAFF', 'DISPATCH_RIDER'];
    const safeRole: UserRole = VALID_PUBLIC_ROLES.includes(role) ? role : 'CUSTOMER';

    // Customer and Hub Staff roles get direct instant active access.
    // Every other role (Merchant, Hub Owner, Dispatch Rider) gets instant active access as CUSTOMER,
    // while their requested role application sits in "pending" box waiting for Admin review.
    const isDirectAccess = safeRole === 'CUSTOMER' || safeRole === 'CENTER_STAFF';

    // Status is always ACTIVE so they are not blocked from using Customer features immediately
    const userStatus: UserStatus = 'ACTIVE';
    const appStatus: ApplicationStatus | null = isDirectAccess ? null : 'SUBMITTED';

    // 2. Storage Engine for docs
    const uploadedDocs: Record<string, string> = {};
    if (files) {
      for (const [key, file] of Object.entries(files)) {
        if (file instanceof File) {
          const url = await storageEngine.uploadUserDocument(uid, key.replace('document_', ''), file);
          uploadedDocs[key] = url;
        } else if (typeof file === 'string' && file.startsWith('http')) {
          uploadedDocs[key] = file;
        }
      }
    }

    const finalProfileData = { ...profileData, ...uploadedDocs, updatedAt: new Date().toISOString() };

    // Assigned active primary role is CUSTOMER for approval-required roles, or requested role if direct access
    const assignedRole: UserRole = isDirectAccess ? safeRole : 'CUSTOMER';
    const assignedRoles: UserRole[] = isDirectAccess ? [safeRole] : ['CUSTOMER'];

    // 3. Persist User
    const userDoc: User = {
      displayName,
      email,
      status: userStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verificationStatus: { email: !!options.sendVerification, phone: false, kyc: false },
      wesabiUsername: (finalProfileData as any).wesabiUsername || `WSH_${uid.substring(0, 8)}`,
      requestedRole: isDirectAccess ? undefined : safeRole,
      pendingRoleApplication: !isDirectAccess,
      ...finalProfileData,
      id: uid,
      uid,
      roles: assignedRoles,
      role: assignedRole,
    };

    await userRepository.create(uid, userDoc);

    // 4. Handle Application & Notifications
    if (appStatus) {
      const applicationId = `APP-${Date.now()}-${uid.substring(0, 5)}`.toUpperCase();
      const roleApplication: RoleApplication = {
        id: applicationId,
        userId: uid,
        role: safeRole,
        status: appStatus,
        data: finalProfileData,
        documents: Object.values(uploadedDocs),
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await roleApplicationRepository.create(applicationId, roleApplication);

      await notificationEngine.send(
        uid,
        'Application Received & Customer Account Active',
        `You're approved as a Customer for now, your ${safeRole.replace(/_/g, ' ')} application is under review.`,
        'INFO',
        '/customer/dashboard',
        'SYSTEM'
      );
    } else {
      await notificationEngine.send(
        uid,
        'Welcome to OmorfiHub! 🚀',
        `Your account as a ${safeRole.replace(/_/g, ' ')} is now active. Explore the dashboard to get started.`,
        'SUCCESS',
        '/dashboard',
        'SYSTEM'
      );
    }

    // 5. Verification Email if requested
    if (options.sendVerification && authService.currentUser) {
      await authService.sendEmailVerification();
    }

    // 6. Audit
    await auditEngine.logEvent({
      userId: uid,
      userRole: role,
      action: 'COMPLETE_REGISTRATION',
      details: { role, status: userStatus },
      result: 'SUCCESS'
    });

    return userDoc;
    } catch (err: any) {
      await monitoringEngine.captureError(err, 'AUTH', 'HIGH', {
        userId: payload.uid,
        role: payload.role
      });
      throw err;
    }
  }

  async hasPermission(userId: string, permission: Permission): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    return permissionService.hasPermission(user, permission);
  }

  async getRolePermissions(role: UserRole): Promise<Permission[]> {
    return permissionService.getPermissionsForRole(role);
  }

  async updateStatus(userId: string, status: User['status']): Promise<void> {
    await userRepository.update(userId, { status, updatedAt: new Date().toISOString() });
  }

  async login(email: string, password: string): Promise<User> {
    return await authService.login(email, password);
  }

  async logout(): Promise<void> {
    await authService.logout();
  }

  async signInWithGoogle(): Promise<User | null> {
    return await authService.signInWithGoogle();
  }

  async register(email: string, password: string, displayName: string, role: UserRole, extraData?: any): Promise<User> {
    // 1. Create Auth User
    const fbUser = await authService.createAuthUser(email, password);

    // 2. Run profile registration via User Engine (Authoritative)
    return await this.registerUser({
      uid: fbUser.uid,
      email,
      displayName,
      role,
      profileData: extraData || {}
    }, { sendVerification: true });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // 1. Reauthenticate and change in authService
    await authService.changePassword(currentPassword, newPassword);

    // 2. Audit
    await auditEngine.logEvent({
      userId,
      action: 'PASSWORD_CHANGE',
      details: { timestamp: new Date().toISOString() },
      result: 'SUCCESS'
    });

    // 3. Notify
    await notificationEngine.send(
      userId,
      'Password Changed',
      'Your password has been successfully changed.',
      'SUCCESS',
      '/settings',
      'SYSTEM'
    );
  }

  async requestPasswordReset(email: string): Promise<void> {
    try {
      // 1. Call server API to handle priority (Telegram > Email)
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.method === 'EMAIL') {
        // Fallback to standard Firebase email reset if Telegram was not used
        await authService.resetPassword(email);
      }

      await auditEngine.logEvent({
        userId: email,
        action: 'PASSWORD_RESET_REQUESTED',
        details: { method: data.method || 'EMAIL' },
        result: 'SUCCESS'
      });
    } catch (error) {
      // Direct fallback to email on API failure
      await authService.resetPassword(email);
      throw error;
    }
  }
  async getUsersByHub(hubId: string): Promise<User[]> {
    return await userRepository.query([{ field: 'hubId', operator: '==', value: hubId }]);
  }

  async getByUsername(username: string): Promise<User | null> {
    const users = await userRepository.query([{ field: 'wesabiUsername', operator: '==', value: username }]);
    return users.length > 0 ? users[0] : null;
  }

  public get roles() {
    return roleApplicationRepository;
  }
  async getAddresses(userId: string): Promise<any[]> {

    return await addressRepository.getByUser(userId);
  }
  async updateAddress(id: string, data: any): Promise<void> {

    await addressRepository.update(id, data);
  }
  async addAddress(id: string, data: any): Promise<void> {

    try { await addressRepository.create(id, data); } catch (e) { console.error('addAddress error:', e); throw e; }
  }
  async deleteAddress(id: string): Promise<void> {

    await addressRepository.delete(id);
  }
  async setDefaultAddress(userId: string, addressId: string): Promise<void> {

    await addressRepository.setDefault(userId, addressId);
  }
  async createSupportTicket(id: string, data: any): Promise<void> {

    await supportTicketRepository.create(id, data);
  }
  async updateProfile(userId: string, data: any): Promise<void> {
    const existing = await userRepository.getById(userId);
    await userRepository.update(userId, data);

    await auditEngine.logEvent({
      userId,
      userRole: existing?.role || 'CUSTOMER',
      action: 'UPDATE_PROFILE',
      details: {
        changedKeys: Object.keys(data),
        before: existing ? Object.keys(data).reduce((acc, k) => ({ ...acc, [k]: (existing as any)[k] || null }), {}) : {}
      },
      result: 'SUCCESS'
    });

    await notificationEngine.send(
      userId,
      'Profile Updated',
      'Your profile information has been successfully updated.',
      'SUCCESS',
      '/settings',
      'SYSTEM'
    );
  }
  async updateUser(userId: string, data: Partial<User>): Promise<void> {
    const existing = await userRepository.getById(userId);
    await userRepository.update(userId, data);

    await auditEngine.logEvent({
      userId,
      userRole: existing?.role || 'CUSTOMER',
      action: 'UPDATE_USER',
      details: {
        changedKeys: Object.keys(data),
        before: existing ? Object.keys(data).reduce((acc, k) => ({ ...acc, [k]: (existing as any)[k] || null }), {}) : {}
      },
      result: 'SUCCESS'
    });
  }
  async getAllUsers(): Promise<User[]> {

    return await userRepository.getAll();
  }

}

export const userEngine = UserEngine.getInstance();
