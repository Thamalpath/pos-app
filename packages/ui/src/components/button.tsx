import React from 'react';
import { cn } from '../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  /** Stretches the button to fill its container. */
  block?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', block = false, type = 'button', ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg ' +
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ' +
      'disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none ' +
      // Comfortable tap target on touch terminals.
      'min-h-[40px] sm:min-h-0';

    const variantClasses = {
      primary: 'bg-brand text-fg-on-brand hover:bg-brand-hover focus-visible:ring-brand',
      secondary:
        'bg-surface-3 text-fg border border-line hover:bg-surface-4 focus-visible:ring-fg-muted',
      outline:
        'border border-line-strong bg-transparent text-fg hover:bg-surface-3 focus-visible:ring-fg-muted',
      danger: 'bg-danger text-fg-on-solid hover:brightness-95 focus-visible:ring-danger',
      ghost: 'bg-transparent text-fg-muted hover:bg-surface-3 hover:text-fg',
      success: 'bg-success text-fg-on-solid hover:brightness-95 focus-visible:ring-success'
    };

    const sizeClasses = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5 min-h-[36px] sm:min-h-0',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-base px-5 py-3 gap-2.5 min-h-[48px] sm:min-h-0',
      icon: 'p-2.5 w-10 h-10'
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          block && 'w-full',
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';