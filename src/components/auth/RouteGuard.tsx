import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { permissionService, Permission } from '../../services/permissionService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { fbUser, user, loading, profileMissing, complianceRequired } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!fbUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect users who haven't accepted latest policies
  if (complianceRequired && location.pathname !== '/legal-consent') {
    return <Navigate to="/legal-consent" replace />;
  }

  // Redirect users who haven't completed registration
  // Only allow access to onboarding pages if profile is missing
  if (profileMissing && !['/role-selection', '/profile-completion', '/legal-consent'].includes(location.pathname)) {
    return <Navigate to="/role-selection" replace />;
  }

  // Check for blocked, suspended, or disabled status.
  // Pending role applications do NOT lock users out of Customer access.
  if (user && (
    user.status === 'BLOCKED' ||
    user.status === 'SUSPENDED' ||
    user.status === 'DISABLED'
  )) {
    return <Navigate to="/account-restricted" replace />;
  }

  return <>{children}</>;
};

export const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, activeRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (user) {
    const redirectPath =
      activeRole === 'SUPER_ADMIN' || activeRole === 'OPERATIONS_MANAGER' ? '/admin' :
      activeRole === 'MERCHANT' ? '/merchant/dashboard' :
      activeRole === 'CENTER_OWNER' || activeRole === 'CENTER_STAFF' ? '/point/dashboard/owner' :
      activeRole === 'LOGISTICS_OWNER' || activeRole === 'LOGISTICS_COMPANY' || activeRole === 'DRIVER' ? '/logistics/dashboard/owner' :
      '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: Permission;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  requiredPermission,
  fallback = <Navigate to="/unauthorized" replace />
}) => {
  const { user, impersonatedRole, activeRole, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Super Admin account or active Super Admin impersonation bypasses restriction checks
  const isSuperAdminUser = (Array.isArray(user.roles) && user.roles.includes('SUPER_ADMIN')) || user.role === 'SUPER_ADMIN' || user.email === 'wesabibookcare@gmail.com';
  if (isSuperAdminUser || (impersonatedRole && isSuperAdminUser)) {
    return <>{children}</>;
  }

  const userRoles = Array.isArray(user.roles) ? user.roles : [user.role].filter(Boolean);
  if (allowedRoles && !userRoles.some(role => allowedRoles.includes(role)) && !allowedRoles.includes(activeRole as UserRole)) {
    return <>{fallback}</>;
  }

  if (requiredPermission && !permissionService.hasPermission(user, requiredPermission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
