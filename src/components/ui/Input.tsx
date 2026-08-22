import React from 'react';
import { cn } from '@/src/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, type, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-sm font-bold text-slate-900 dark:text-slate-200 ml-0.5 uppercase tracking-tight">
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-500 transition-colors">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-950 transition-all duration-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-primary-500/10",
              leftIcon && "pl-11",
              rightIcon && "pr-11",
              error && "border-error-500 focus:border-error-500 focus:ring-error-500/20",
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-500 transition-colors">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs font-bold text-error-600 dark:text-error-400 ml-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-xs font-medium text-slate-700 dark:text-slate-400 ml-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
