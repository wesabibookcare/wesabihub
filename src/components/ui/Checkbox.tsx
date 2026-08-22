import React from 'react';
import { cn } from '@/src/lib/utils';
import { Check } from 'lucide-react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const uniqueId = id || React.useId();

    return (
      <div className="flex flex-col space-y-1">
        <label
          htmlFor={uniqueId}
          className="group flex items-center gap-3 cursor-pointer select-none"
        >
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              id={uniqueId}
              className="peer sr-only"
              ref={ref}
              {...props}
            />
            <div className={cn(
              "h-5 w-5 rounded-md border-2 border-slate-200 bg-white transition-all duration-200 peer-checked:bg-primary-600 peer-checked:border-primary-600 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500/20 dark:bg-slate-900 dark:border-slate-800",
              error && "border-error-500",
              className
            )} />
            <Check className="absolute h-3.5 w-3.5 text-white scale-0 transition-transform duration-200 peer-checked:scale-100" />
          </div>
          {label && (
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {label}
            </span>
          )}
        </label>
        {error && <p className="text-xs font-medium text-error-600 dark:text-error-400 ml-8">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
