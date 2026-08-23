import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const useAccountPending = () => {
  const { user } = useAuth();

  // Checks if the user has a pending role application under review (while active as customer)
  const isPending = !!(user?.pendingRoleApplication || user?.status === 'pending_approval' || user?.status === 'PENDING' || user?.status === 'UNDER_REVIEW');

  return {
    isPending,
    status: user?.status || null,
    requestedRole: user?.requestedRole || null,
  };
};

interface AccountPendingWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AccountPendingWrapper: React.FC<AccountPendingWrapperProps> = ({
  children
}) => {
  // Users are no longer locked out of Customer functionality even with a pending role application
  return <>{children}</>;
};
