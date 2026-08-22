import React from 'react';
import { cn } from '@/src/lib/utils';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  onClose?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const Alert = ({ className, variant = 'info', title, children, onClose, ...props }: AlertProps) => {
  const icons = {
    info: <Info className="h-5 w-5" />,
    success: <CheckCircle2 className="h-5 w-5" />,
    warning: <AlertCircle className="h-5 w-5" />,
    error: <XCircle className="h-5 w-5" />,
  };

  const variants = {
    info: 'bg-primary-50 text-primary-950 border-primary-200 dark:bg-primary-900/10 dark:text-primary-300 dark:border-primary-900/50',
    success: 'bg-success-50 text-success-950 border-success-200 dark:bg-success-900/10 dark:text-success-300 dark:border-success-900/50',
    warning: 'bg-warning-50 text-warning-950 border-warning-200 dark:bg-warning-900/10 dark:text-warning-300 dark:border-warning-900/50',
    error: 'bg-error-50 text-error-950 border-error-200 dark:bg-error-900/10 dark:text-error-300 dark:border-error-900/50',
  };

  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-2xl border p-4 flex items-start gap-3 transition-all duration-200 shadow-sm',
        variants[variant],
        className
      )}
      {...props}
    >
      <div className="shrink-0 mt-0.5">{icons[variant]}</div>
      <div className="flex-1 space-y-1">
        {title && <h5 className="font-bold leading-none tracking-tight uppercase text-xs tracking-widest">{title}</h5>}
        <div className="text-sm font-medium">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <XCircle className="h-4 w-4 opacity-50 hover:opacity-100" />
        </button>
      )}
    </div>
  );
};
