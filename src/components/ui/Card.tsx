import React from 'react';
import { cn } from '@/src/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'outline' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', ...props }, ref) => {
    const variants = {
      default: 'bg-surface border border-slate-300 dark:border-slate-800 shadow-sm',
      flat: 'bg-slate-50 dark:bg-slate-900 border-none shadow-none',
      outline: 'bg-transparent border border-slate-300 dark:border-slate-800 shadow-none',
      glass: 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/20 dark:border-slate-800/50 shadow-lg',
    };

    const paddings = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl transition-all duration-200',
          variants[variant],
          paddings[padding],
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 mb-4', className)} {...props} />
);

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('text-xl font-bold tracking-tight text-slate-900 dark:text-white font-display', className)} {...props} />
);

export const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-sm text-slate-800 font-medium dark:text-slate-300', className)} {...props} />
);

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('pt-0', className)} {...props} />
);

export const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center pt-4 border-t border-slate-200 dark:border-slate-800 mt-4', className)} {...props} />
);
