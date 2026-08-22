import React from 'react';
import { cn } from '@/src/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { LoadingIcon } from '@/src/components/brand/LoadingIcon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, asChild = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm shadow-primary-500/20 active:scale-[0.98]',
      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 active:scale-[0.98]',
      outline: 'bg-transparent border border-slate-300 text-slate-950 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-900 active:scale-[0.98]',
      text: 'bg-transparent text-slate-900 hover:text-primary-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800',
      danger: 'bg-error-600 text-white hover:bg-error-700 shadow-sm shadow-error-500/20 active:scale-[0.98]',
      success: 'bg-success-600 text-white hover:bg-success-700 shadow-sm shadow-success-500/20 active:scale-[0.98]',
    };

    const sizes = {
      sm: 'h-9 px-3 text-xs',
      md: 'h-11 px-6 text-sm',
      lg: 'h-14 px-8 text-base',
      icon: 'h-10 w-10 p-0',
    };

    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50 disabled:pointer-events-none';
    const combinedClassName = cn(baseStyles, variants[variant], sizes[size], className);

    if (asChild && React.isValidElement(children)) {
      return (
        <Slot
          ref={ref}
          className={combinedClassName}
          {...props}
        >
          {React.cloneElement(children as React.ReactElement<any>, {
            children: (
              <>
                {isLoading ? (
                  <LoadingIcon size={16} />
                ) : (
                  <>
                    {leftIcon && <span className="mr-2">{leftIcon}</span>}
                    {children.props.children}
                    {rightIcon && <span className="ml-2">{rightIcon}</span>}
                  </>
                )}
              </>
            )
          })}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={combinedClassName}
        {...props}
      >
        {isLoading ? (
          <LoadingIcon size={16} />
        ) : (
          <>
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
