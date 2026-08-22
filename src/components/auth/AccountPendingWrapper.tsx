import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const useAccountPending = () => {
  const { user } = useAuth();

  // Checks if the user is in a pending state
  const isPending = user?.status === 'pending_approval' || user?.status === 'PENDING';

  return {
    isPending,
    status: user?.status || null,
  };
};

interface AccountPendingWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AccountPendingWrapper: React.FC<AccountPendingWrapperProps> = ({
  children,
  fallback = <Navigate to="/account-restricted" replace />
}) => {
  const { isPending } = useAccountPending();
  const location = useLocation();

  // Allow essential views like settings and support for communication/configuration
  const allowedPaths = [
    '/customer/settings',
    '/customer/support',
    '/account-restricted',
    '/login',
    '/register',
    '/role-selection',
    '/profile-completion'
  ];

  if (isPending && !allowedPaths.includes(location.pathname)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
