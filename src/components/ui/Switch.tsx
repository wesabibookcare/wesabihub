import React from 'react';
import { cn } from '@/src/lib/utils';

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, id, onChange, ...props }, ref) => {
    const uniqueId = id || React.useId();

    return (
      <div className="flex items-center gap-3 select-none">
        <div className="relative">
          <input
            type="checkbox"
            id={uniqueId}
            className="peer sr-only"
            ref={ref}
            onChange={onChange}
            {...props}
          />
          <label
            htmlFor={uniqueId}
            className={cn(
              "block h-6 w-11 rounded-full bg-slate-200 transition-colors duration-200 peer-checked:bg-primary-600 dark:bg-slate-800 cursor-pointer",
              className
            )}
          />
          <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform duration-200 peer-checked:translate-x-5 shadow-sm pointer-events-none" />
        </div>
        {label && (
          <label
            htmlFor={uniqueId}
            className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Switch.displayName = "Switch";
