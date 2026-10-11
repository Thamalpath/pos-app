import React from 'react';
import { cn } from '../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand' | 'accent';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  children,
  ...props
}) => {
  const styles = {
    neutral: 'bg-surface-3 text-fg-muted border border-line',
    brand: 'bg-brand-soft text-brand-fg border border-brand-line',
    success: 'bg-success-soft text-success-fg border border-success-line',
    warning: 'bg-warning-soft text-warning-fg border border-warning-line',
    danger: 'bg-danger-soft text-danger-fg border border-danger-line',
    info: 'bg-info-soft text-info-fg border border-info-line',
    accent: 'bg-accent-soft text-accent-fg border border-accent-line'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};