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
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !user.roles.some(role => allowedRoles.includes(role))) {
    return <>{fallback}</>;
  }

  if (requiredPermission && !permissionService.hasPermission(user, requiredPermission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
