import React from 'react';
import { ShieldAlert, Mail, ArrowLeft, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';

export const AccountRestrictedPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const isPending = user?.status === 'PENDING' || user?.status === 'UNDER_REVIEW' || user?.status === 'EMAIL_UNVERIFIED';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 text-center">
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6",
          isPending ? "bg-amber-100 dark:bg-amber-900/20" : "bg-red-100 dark:bg-red-900/20"
        )}>
          {isPending ? (
            <Clock className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          ) : (
            <ShieldAlert className="h-10 w-10 text-red-600 dark:text-red-400" />
          )}
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {isPending ? 'Verification in Progress' : 'Account Restricted'}
        </h1>
        <p className="text-slate-800 dark:text-slate-300 mb-8">
          {isPending ? (
            'Your application is currently under review by our team. We will notify you via email once your account has been verified and activated.'
          ) : (
            'We noticed some unusual activity or pending verification on your account. As a result, your access to OmorfiHub has been temporarily restricted.'
          )}
        </p>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-8 text-left">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-300 uppercase tracking-wider mb-2">Current Status</p>
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-2 py-1 text-xs font-bold rounded",
              isPending ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            )}>
              {user?.status?.replace('_', ' ') || 'RESTRICTED'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <Button className="w-full gap-2" variant="outline" asChild>
            <a href="mailto:support@omorfihub.com">
              <Mail className="h-4 w-4" />
              Contact Support
            </a>
          </Button>

          <Button
            className="w-full gap-2"
            variant="ghost"
            onClick={() => signOut()}
          >
            <ArrowLeft className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
          <Link to="/" className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
