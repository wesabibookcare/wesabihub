
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, getDoc, updateDoc, setDoc, query, collection, where, limit, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { userEngine, complianceEngine, auditEngine } from '../engines';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isMerchant: boolean;
  role: UserRole | null;
  impersonatedRole: UserRole | null;
  fbUser: FirebaseUser | null;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
  impersonate: (role: UserRole) => void;
  stopImpersonating: () => void;
  activeRole: UserRole | null;
  setActiveRole: (role: UserRole) => void;
  profileMissing: boolean;
  complianceRequired: boolean;
  bootstrapNeeded: boolean;
  refreshBootstrapStatus: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileMissing, setProfileMissing] = useState(false);
  const [complianceRequired, setComplianceRequired] = useState(false);
  const [bootstrapNeeded, setBootstrapNeeded] = useState(false);
  const [impersonatedRole, setImpersonatedRole] = useState<UserRole | null>(null);
  const [activeRole, setActiveRoleState] = useState<UserRole | null>(null);

  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    localStorage.setItem('activeRole', role);
  };

  useEffect(() => {
    if (user && user.roles && user.roles.length > 0) {
        const savedRole = localStorage.getItem('activeRole');
        if (savedRole && user.roles.includes(savedRole as UserRole)) {
            setActiveRoleState(savedRole as UserRole);
        } else {
            setActiveRoleState(user.roles[0]);
        }
    }
  }, [user]);

  const impersonate = (role: UserRole) => {
    if (user?.role === 'SUPER_ADMIN') {
      setImpersonatedRole(role);
      setActiveRoleState(role);
      // Log impersonation via Audit Engine
      auditEngine.logEvent({
        userId: user.id,
        action: 'ADMIN_IMPERSONATION_START',
        details: { targetRole: role },
        result: 'SUCCESS'
      });
    }
  };

  const stopImpersonating = () => {
    if (user && impersonatedRole) {
      auditEngine.logEvent({
        userId: user.id,
        action: 'ADMIN_IMPERSONATION_STOP',
        details: { stoppedRole: impersonatedRole },
        result: 'SUCCESS'
      });
    }
    setImpersonatedRole(null);
    setActiveRoleState(user?.roles[0] || null);
  };

  const refreshBootstrapStatus = async () => {
    try {
      const globalRef = doc(db, 'systemSettings', 'global');
      const globalSnap = await getDoc(globalRef).catch(err => {
        console.warn('Failed to fetch systemSettings global doc:', err);
        return null;
      });

      if (globalSnap && globalSnap.exists() && globalSnap.data().isSuperAdminBootstrapped === true) {
        setBootstrapNeeded(false);
        return;
      }

      // Fallback query to verify users collection directly
      if (auth.currentUser) {
        try {
          const q = query(collection(db, 'users'), where('roles', 'array-contains', 'SUPER_ADMIN'), limit(1));
          const querySnapshot = await getDocs(q).catch(err => {
            console.warn('Direct users query catch:', err);
            return null;
          });
          if (querySnapshot && !querySnapshot.empty) {
            setBootstrapNeeded(false);
            // Self-heal global settings if possible
            await updateDoc(globalRef, { isSuperAdminBootstrapped: true }).catch(e => {
              console.log('Failed to self-heal bootstrapped flag (expected if not admin):', e.message);
            });
            return;
          }
        } catch (queryErr) {
          console.log('Direct users query failed (expected if guest/no permission):', queryErr);
        }
      }

      setBootstrapNeeded(true);
    } catch (err) {
      console.error('Error checking bootstrap status:', err);
      setBootstrapNeeded(false);
    }
  };

  // Removed the separate useEffect for refreshBootstrapStatus

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setFbUser(firebaseUser);

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);

        unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() || {};
            const isSuperAdminEmail = firebaseUser.email?.toLowerCase() === 'wesabibookcare@gmail.com';

            let roles = data.roles || (data.role ? [data.role] : []);
            let role = data.role || roles[0] || 'CUSTOMER';
            let status = data.status || 'ACTIVE';

            if (isSuperAdminEmail) {
              if (!roles.includes('SUPER_ADMIN')) {
                roles = Array.from(new Set([...roles, 'SUPER_ADMIN' as UserRole]));
              }
              role = 'SUPER_ADMIN';
              status = 'ACTIVE';

              if (data.role !== 'SUPER_ADMIN' || !data.roles?.includes('SUPER_ADMIN') || data.status !== 'ACTIVE') {
                updateDoc(userDocRef, {
                  role: 'SUPER_ADMIN',
                  roles,
                  status: 'ACTIVE'
                }).catch(e => console.warn('Background auto-heal super admin doc failed:', e));
              }
            }

            const profile = {
              ...data,
              roles,
              role,
              status,
              id: docSnap.id,
              uid: docSnap.id
            } as User;
            setUser(profile);
            setProfileMissing(false);

            // Check Compliance asynchronously
            complianceEngine.checkUserCompliance(docSnap.id, profile.role || 'CUSTOMER', profile.country || 'NG')
                .then(res => setComplianceRequired(!res.compliant))
                .catch(err => console.error('Compliance check failed:', err));
          } else {
            setUser(null);
            setProfileMissing(true);
          }
          setLoading(false);
        }, (error) => {
          console.error('Error listening to user profile:', error);
          setLoading(false);
          setProfileMissing(true);
        });
      } else {
        setUser(null);
        setProfileMissing(false);
        setLoading(false);
      }
    });

    refreshBootstrapStatus().catch(err => {
      console.warn("Error running refreshBootstrapStatus during AuthProvider init:", err);
      setBootstrapNeeded(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const logout = async () => {
    await userEngine.logout();
  };

  const hasRole = (roles: UserRole[]) => {
    if (!user) return false;
    const effectiveRole = impersonatedRole || user.role;
    return roles.includes(effectiveRole);
  };

  const effectiveRole = impersonatedRole || user?.role || null;

  const value = {
    user,
    fbUser,
    loading,
    role: effectiveRole,
    impersonatedRole,
    activeRole,
    setActiveRole,
    isAdmin: effectiveRole === 'SUPER_ADMIN' || effectiveRole === 'OPERATIONS_MANAGER',
    isMerchant: effectiveRole === 'MERCHANT' || effectiveRole === 'CENTER_OWNER',
    logout,
    hasRole,
    impersonate,
    stopImpersonating,
    profileMissing,
    complianceRequired,
    bootstrapNeeded,
    refreshBootstrapStatus,
    refreshUser: async () => {
      // Real-time listener handles state, but this acts as an explicit re-trigger if needed
      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data() || {};
          const roles = data.roles || (data.role ? [data.role] : []);
          const profile = {
            ...data,
            roles,
            role: data.role || roles[0] || 'CUSTOMER',
            id: docSnap.id,
            uid: docSnap.id
          } as User;
          setUser(profile);
        }
      }
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
