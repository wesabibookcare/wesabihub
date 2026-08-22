import React from 'react';
import { cn } from '@/src/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
  children?: React.ReactNode;
}

export const Badge = ({ className, variant = 'default', size = 'md', children, ...props }: BadgeProps) => {
  const variants = {
    default: 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700',
    success: 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-500',
    warning: 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-500',
    error: 'bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-500',
    info: 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400',
    outline: 'border border-slate-300 text-slate-950 dark:border-slate-800 dark:text-slate-100 font-black',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] uppercase tracking-wider',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-bold',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
};
