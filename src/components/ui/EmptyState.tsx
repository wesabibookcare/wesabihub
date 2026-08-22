import React from 'react';
import { cn } from '@/src/lib/utils';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500",
      className
    )}>
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-800 mb-2 border border-slate-100 dark:border-slate-800">
          <Icon size={32} />
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">{title}</h3>
        {description && (
          <p className="text-sm text-slate-800 font-medium dark:text-slate-300 max-w-xs mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="pt-2">
          {action}
        </div>
      )}
    </div>
  );
};
