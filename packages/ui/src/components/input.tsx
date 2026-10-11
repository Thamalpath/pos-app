import React from 'react';
import { cn } from '../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, leftIcon, ...props }, ref) => {
    return (
      <div className="w-full relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-surface border border-line text-fg placeholder:text-fg-subtle rounded-lg px-3.5 py-2.5 text-sm transition-all',
            'focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/25',
            'min-h-[44px] sm:min-h-0',
            leftIcon && 'pl-10',
            error && 'border-danger focus:border-danger focus:ring-danger/25',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger-fg mt-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';