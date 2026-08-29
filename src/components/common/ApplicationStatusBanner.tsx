import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, CheckCircle2, X, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ApplicationStatusBanner: React.FC = () => {
  const { user } = useAuth();
  const [dismissedApproved, setDismissedApproved] = useState(false);

  if (!user) return null;

  const isPending = !!user.pendingRoleApplication;
  const requestedRoleLabel = user.requestedRole ? String(user.requestedRole).replace(/_/g, ' ') : 'Merchant';
  const newlyApprovedRole = (user.roles || []).find((r: string) => r !== 'CUSTOMER');

  // Display congratulations banner if newly approved role exists and user hasn't dismissed it
  const showApprovedBanner = !isPending && newlyApprovedRole && !dismissedApproved;

  if (isPending) {
    return (
      <div className="bg-amber-500 text-slate-950 py-2 px-4 text-xs font-semibold shadow-md flex items-center justify-between gap-2 z-40 relative">
        <div className="flex items-center gap-2 overflow-hidden">
          <Clock className="w-4 h-4 shrink-0 text-slate-950 animate-pulse" />
          <span className="truncate">
            Your <strong>{requestedRoleLabel}</strong> application has been submitted and is currently under review by our team.
          </span>
        </div>
        <span className="text-[10px] bg-slate-950/10 px-2 py-0.5 rounded font-bold whitespace-nowrap shrink-0">
          Under Review
        </span>
      </div>
    );
  }

  if (showApprovedBanner) {
    return (
      <div className="bg-emerald-600 text-white py-2 px-4 text-xs font-semibold shadow-md flex items-center justify-between gap-2 z-40 relative">
        <div className="flex items-center gap-2 overflow-hidden">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
          <span className="truncate">
            🎉 Congratulations! Your <strong>{String(newlyApprovedRole).replace(/_/g, ' ')}</strong> application has been approved!
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to={`/${String(newlyApprovedRole).toLowerCase()}/dashboard`}
            className="text-[11px] bg-white text-emerald-800 font-bold px-2.5 py-1 rounded-lg hover:bg-emerald-50 transition flex items-center gap-1"
          >
            Switch Workspace <ArrowRight className="w-3 h-3" />
          </Link>
          <button
            onClick={() => setDismissedApproved(true)}
            className="p-1 hover:bg-emerald-700 rounded-full transition text-white/80 hover:text-white"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};
