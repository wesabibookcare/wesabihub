import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  User as FirebaseUser,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  GoogleAuthProvider,
  signInWithPopup,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User, UserRole, UserStatus } from '../types';
import { VALID_PUBLIC_ROLES } from '../constants/roles';
import { auditEngine } from './AuditEngine';

export const ROLE_REDIRECTS: Record<UserRole, string> = {
  CUSTOMER: '/dashboard',
  MERCHANT: '/merchant/dashboard',
  CENTER_OWNER: '/point/dashboard/owner',
  CENTER_STAFF: '/point/dashboard/staff',
  LOGISTICS_COMPANY: '/logistics/dashboard/owner',
  DRIVER: '/logistics/dashboard/staff',
  DEVELOPER: '/developer',
  API_MERCHANT_PARTNER: '/developer',
  SUPPORT_OFFICER: '/admin/support',
  VERIFICATION_OFFICER: '/admin/verification',
  FINANCE_OFFICER: '/admin/business-rules/payouts',
  OPERATIONS_MANAGER: '/admin/business-rules',
  SUPER_ADMIN: '/admin',
  DISPUTE_ADMIN: '/admin/support',
  SUPPORT_ADMIN: '/admin/support',
  OPERATIONS_ADMIN: '/admin/business-rules',
  VERIFICATION_ADMIN: '/admin/verification',
  SECURITY_ADMIN: '/admin/security',
  FINANCE_ADMIN: '/admin/business-rules/payouts',
  DISPATCH_RIDER: '/dispatch/dashboard',
  DISPATCH_COMPANY: '/dispatch/company/dashboard',
  FLEET_MANAGER: '/dispatch/fleet/dashboard'
};

class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  get currentUser() {
    return auth.currentUser;
  }

  async sendEmailVerification(): Promise<void> {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  }

  async createAuthUser(email: string, pass: string): Promise<FirebaseUser> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    return userCredential.user;
  }

  async register(email: string, pass: string, displayName: string, role: UserRole = 'CUSTOMER', extraData: any = {}): Promise<User> {
    const isSuperAdminEmail = email.toLowerCase() === 'wesabibookcare@gmail.com';
    const safeRole: UserRole = isSuperAdminEmail
      ? 'SUPER_ADMIN'
      : ((VALID_PUBLIC_ROLES as readonly string[]).includes(role) ? role : 'CUSTOMER');

    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const fbUser = userCredential.user;

    // Determine status and check for invitations
    let status: UserStatus = 'EMAIL_UNVERIFIED';
    let isInvited = false;
    let hubId = '';
    let companyId = extraData.companyId || '';

    // If CENTER_STAFF, check if they were invited
    let matchedInvitationId = '';
    if (safeRole === 'CENTER_STAFF') {
      try {
        const { invitationRepository } = await import('./db/InvitationRepository');
        const invs = await invitationRepository.getByEmail(email);
        if (invs.length > 0) {
          isInvited = true;
          hubId = invs[0].hubId;
          matchedInvitationId = invs[0].id;
        }
      } catch (e) {
        console.error('Failed to check invitations during registration:', e);
      }
    }

    // Special logic for Logistics Roles using Invite Codes
    if (['FLEET_MANAGER', 'DRIVER'].includes(role) && extraData.inviteCode) {
      // We will verify the code later in a service, for now we just store it
      status = 'PENDING';
    }

    const newUser: User = {
      id: fbUser.uid,
      uid: fbUser.uid,
      displayName,
      email,
      roles: [safeRole],
      role: safeRole,
      status,
      hubId: hubId || undefined,
      companyId: companyId || undefined,
      inviteCode: extraData.inviteCode || undefined,
      isInvited: isInvited || undefined,
      createdAt: new Date().toISOString(),
      verificationStatus: {
        email: false,
        phone: false,
        kyc: false
      },
      ...extraData
    };

    await setDoc(doc(db, 'users', fbUser.uid), {
      ...newUser,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });

    // Mark the invitation as used so it doesn't sit as PENDING forever
    if (matchedInvitationId) {
      try {
        const { invitationRepository } = await import('./db/InvitationRepository');
        await invitationRepository.update(matchedInvitationId, { status: 'ACCEPTED', acceptedBy: fbUser.uid, acceptedAt: new Date().toISOString() });
      } catch (e) {
        console.error('Failed to mark invitation as accepted:', e);
      }
    }

    // Create Role Application for roles that require approval (Standard Registration)
    if (['MERCHANT', 'CENTER_OWNER', 'DISPATCH_RIDER'].includes(safeRole)) {
      const applicationId = `APP-${Date.now()}`;
      await setDoc(doc(db, 'roleApplications', applicationId), {
        id: applicationId,
        userId: fbUser.uid,
        role: safeRole,
        status: 'SUBMITTED',
        data: {
          email,
          displayName,
          registrationType: 'STANDARD',
          ...extraData
        },
        submittedAt: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    await sendEmailVerification(fbUser);
    await this.logAudit(fbUser.uid, 'REGISTER', { email, role });

    return newUser;
  }

  async signInWithGoogle(): Promise<User | null> {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const fbUser = userCredential.user;

    const userDocRef = doc(db, 'users', fbUser.uid);
    const userDoc = await getDoc(userDocRef);

    let userData: User | null = null;
    let targetDocRef = userDocRef;

    if (userDoc.exists()) {
      userData = userDoc.data() as User;
    } else if (fbUser.email) {
      // Look up existing user profile by email in case of prior email registration or mismatched Auth UID
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', fbUser.email.toLowerCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const foundDoc = snap.docs[0];
        userData = foundDoc.data() as User;
        targetDocRef = foundDoc.ref;
      }
    }

    const isSuperAdminEmail = fbUser.email?.toLowerCase() === 'wesabibookcare@gmail.com';

    if (userData) {
      // If primary Super Admin email, promote to SUPER_ADMIN if needed
      if (isSuperAdminEmail && userData.role !== 'SUPER_ADMIN') {
        const updatedRoles = Array.from(new Set([...(userData.roles || []), 'SUPER_ADMIN' as UserRole]));
        userData.role = 'SUPER_ADMIN';
        userData.roles = updatedRoles;
        userData.status = 'ACTIVE';
        await updateDoc(targetDocRef, {
          role: 'SUPER_ADMIN',
          roles: updatedRoles,
          status: 'ACTIVE',
          lastLogin: serverTimestamp()
        }).catch(e => console.warn('Failed to promote primary super admin on Google sign in:', e));
      } else {
        // Check if account is suspended/disabled
        if (['SUSPENDED', 'DISABLED', 'BLOCKED', 'REJECTED'].includes(userData.status)) {
          await signOut(auth);
          throw new Error(`Your account is ${userData.status.toLowerCase()}. Please contact support.`);
        }

        await updateDoc(targetDocRef, {
          lastLogin: serverTimestamp()
        }).catch(e => console.warn('Failed to update lastLogin for Google user:', e));
      }

      await this.logAudit(userData.uid || fbUser.uid, 'LOGIN_GOOGLE', { email: fbUser.email });
      return userData;
    } else {
      // User document does NOT exist for Google user; create an active user profile immediately!
      const defaultRole: UserRole = isSuperAdminEmail ? 'SUPER_ADMIN' : 'CUSTOMER';

      const newUserDoc: User = {
        id: fbUser.uid,
        uid: fbUser.uid,
        displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
        email: fbUser.email || '',
        roles: [defaultRole],
        role: defaultRole,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        verificationStatus: {
          email: true,
          phone: false,
          kyc: false
        },
        wesabiUsername: `WSH_${fbUser.uid.substring(0, 8)}`
      };

      await setDoc(userDocRef, {
        ...newUserDoc,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });

      await this.logAudit(fbUser.uid, 'REGISTER_GOOGLE', { email: fbUser.email, role: newUserDoc.role });
      return newUserDoc;
    }
  }

  async completeRegistration(uid: string, email: string, displayName: string, role: UserRole, profileData: any): Promise<User> {
    const userDocRef = doc(db, 'users', uid);

    // Idempotency check: prevent duplicate profile creation
    const existingSnap = await getDoc(userDocRef);
    if (existingSnap.exists()) {
      const existingUser = existingSnap.data() as User;
      await this.logAudit(uid, 'REGISTRATION_COMPLETE_IDEMPOTENT', { role, existingRole: existingUser.role });
      return existingUser;
    }

    // Determine status based on role
    let status: UserStatus = 'ACTIVE';
    if (['MERCHANT', 'CENTER_OWNER', 'LOGISTICS_COMPANY', 'DEVELOPER', 'DISPATCH_RIDER', 'DISPATCH_COMPANY', 'FLEET_MANAGER'].includes(role)) {
      status = 'PENDING';
    } else if (role === 'CENTER_STAFF') {
      // If invited, status could be ACTIVE
      status = profileData.isInvited ? 'ACTIVE' : 'PENDING';
    }

    const newUser: User = {
      id: uid,
      uid: uid,
      displayName,
      email,
      roles: [role],
      role,
      status,
      createdAt: new Date().toISOString(),
      verificationStatus: {
        email: true,
        phone: false,
        kyc: false
      },
      ...profileData
    };

    await setDoc(userDocRef, {
      ...newUser,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });

    // Create Role Application for roles that require approval
    if (status === 'PENDING') {
      const applicationId = `APP-${Date.now()}`;
      await setDoc(doc(db, 'roleApplications', applicationId), {
        id: applicationId,
        userId: uid,
        role,
        status: 'SUBMITTED',
        data: profileData,
        submittedAt: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    await this.logAudit(uid, 'COMPLETE_REGISTRATION', { role, status });
    return newUser;
  }

  async login(email: string, pass: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const fbUser = userCredential.user;

      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDoc = await getDoc(userDocRef);
      const isSuperAdminEmail = email.toLowerCase() === 'wesabibookcare@gmail.com';

      let userData: User;

      if (!userDoc.exists()) {
        // Auto-heal missing profile in Firestore so user isn't locked out with an error
        const defaultRole: UserRole = isSuperAdminEmail ? 'SUPER_ADMIN' : 'CUSTOMER';
        userData = {
          id: fbUser.uid,
          uid: fbUser.uid,
          displayName: fbUser.displayName || email.split('@')[0] || 'User',
          email,
          roles: [defaultRole],
          role: defaultRole,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          verificationStatus: {
            email: fbUser.emailVerified,
            phone: false,
            kyc: false
          },
          wesabiUsername: `WSH_${fbUser.uid.substring(0, 8)}`
        };

        await setDoc(userDocRef, {
          ...userData,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });
      } else {
        userData = userDoc.data() as User;

        if (isSuperAdminEmail && userData.role !== 'SUPER_ADMIN') {
          const updatedRoles = Array.from(new Set([...(userData.roles || []), 'SUPER_ADMIN' as UserRole]));
          userData.role = 'SUPER_ADMIN';
          userData.roles = updatedRoles;
          userData.status = 'ACTIVE';
          await updateDoc(userDocRef, {
            role: 'SUPER_ADMIN',
            roles: updatedRoles,
            status: 'ACTIVE',
            lastLogin: serverTimestamp()
          }).catch(e => console.warn('Failed to promote primary super admin on login:', e));
        } else {
          // Check if account is suspended/disabled
          if (['SUSPENDED', 'DISABLED', 'BLOCKED', 'REJECTED'].includes(userData.status)) {
            await signOut(auth);
            throw new Error(`Your account is ${userData.status.toLowerCase()}. Please contact support.`);
          }

          await updateDoc(userDocRef, {
            lastLogin: serverTimestamp()
          });
        }
      }

      await this.logAudit(fbUser.uid, 'LOGIN', { email });

      return userData;
    } catch (err: any) {
      await auditEngine.logEvent({
        userId: 'UNKNOWN',
        action: 'AUTH_FAILED',
        details: { email, reason: err.message },
        result: 'FAILURE'
      });
      throw err;
    }
  }

  async logout(): Promise<void> {
    const uid = auth.currentUser?.uid;
    await signOut(auth);
    if (uid) {
      await this.logAudit(uid, 'LOGOUT');
    }
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  async hasPassword(): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) return false;
    return user.providerData.some(p => p.providerId === 'password');
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('User not authenticated');

    const hasPassword = await this.hasPassword();

    if (hasPassword) {
      if (!currentPassword) throw new Error('Current password is required to change password');
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
    }

    await updatePassword(user, newPassword);
  }

  async sendOTP(phoneNumber: string, containerId: string): Promise<ConfirmationResult> {
    const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible'
    });
    return await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  }

  async verifyOTP(confirmationResult: ConfirmationResult, code: string): Promise<User> {
    const result = await confirmationResult.confirm(code);
    const fbUser = result.user;

    const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
    if (!userDoc.exists()) {
      // Handle phone-only registration if needed, but usually we link or have email first
      throw new Error('User profile not found. Please register with email first.');
    }

    return userDoc.data() as User;
  }

  async getUserProfile(uid: string): Promise<User | null> {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists() ? (userDoc.data() as User) : null;
  }

  async bootstrapSuperAdmin(email: string, pass: string, displayName: string): Promise<User> {
    let fbUser: FirebaseUser | null = null;
    try {
      // 1. Create firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      fbUser = userCredential.user;

      const newUser: User = {
        id: fbUser.uid,
        uid: fbUser.uid,
        displayName,
        email,
        roles: ['SUPER_ADMIN'],
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        verificationStatus: {
          email: true,
          phone: false,
          kyc: false
        }
      };

      // 2. Log bootstrap started under their session (they are signed in by createUserWithEmailAndPassword)
      await auditEngine.logEvent({
        userId: fbUser.uid,
        userRole: 'SUPER_ADMIN',
        action: 'BOOTSTRAP_STARTED',
        details: { email, initiator: 'System Bootstrap' },
        result: 'SUCCESS'
      });

      // 3. Write user document to users collection
      await setDoc(doc(db, 'users', fbUser.uid), {
        ...newUser,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });

      // 4. Update systemSettings/global to set isSuperAdminBootstrapped: true
      const globalSettingsRef = doc(db, 'systemSettings', 'global');
      const globalSettingsSnap = await getDoc(globalSettingsRef);
      if (globalSettingsSnap.exists()) {
        await updateDoc(globalSettingsRef, {
          isSuperAdminBootstrapped: true,
          bootstrapCompletedAt: serverTimestamp(),
          bootstrapCreator: 'System Bootstrap'
        });
      } else {
        await setDoc(globalSettingsRef, {
          isSuperAdminBootstrapped: true,
          bootstrapCompletedAt: serverTimestamp(),
          bootstrapCreator: 'System Bootstrap',
          platformName: 'OmorfiHub',
          createdAt: serverTimestamp()
        });
      }

      // 5. Record final audit logs
      await auditEngine.logEvent({
        userId: fbUser.uid,
        userRole: 'SUPER_ADMIN',
        action: 'BOOTSTRAP_SUPER_ADMIN_CREATED',
        details: { email, creator: 'System Bootstrap' },
        result: 'SUCCESS'
      });

      await auditEngine.logEvent({
        userId: fbUser.uid,
        userRole: 'SUPER_ADMIN',
        action: 'BOOTSTRAP_DISABLED',
        details: { timestamp: new Date().toISOString() },
        result: 'SUCCESS'
      });

      return newUser;
    } catch (err) {
      // Clean up Firebase Auth user if created so we don't leave partial admin account
      if (fbUser) {
        try {
          await fbUser.delete();
        } catch (deleteErr) {
          console.error('Failed to clean up Auth user on bootstrap error:', deleteErr);
        }
      }
      throw err;
    }
  }

  private async logAudit(userId: string, action: string, details: any = {}) {
    await auditEngine.logEvent({
      userId,
      action,
      details,
      result: 'SUCCESS'
    });
  }
}

export const authService = AuthService.getInstance();
