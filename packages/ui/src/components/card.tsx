import React from 'react';
import { cn } from '../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Removes the default padding, e.g. for flush tables. */
  flush?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, flush = false, children, ...props }) => {
  return (
    <div
      className={cn(
        // Border-only: drop shadows read as decorative card UI, whereas a
        // classic register surface separates with a hairline rule.
        'bg-surface border border-line rounded-lg text-fg',
        !flush && 'p-4 sm:p-5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};