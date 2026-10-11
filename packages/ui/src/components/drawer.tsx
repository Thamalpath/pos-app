import React, { useEffect, useRef } from 'react';
import { cn } from '../lib/utils';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Edge the panel slides in from. */
  side?: 'left' | 'right' | 'bottom';
  /** Panel sizing, e.g. `w-72` or `w-full max-w-[420px]`. */
  widthClassName?: string;
  /** Renders a drag affordance and rounds only the top corners. */
  isSheet?: boolean;
  ariaLabel?: string;
  children: React.ReactNode;
}

/**
 * Off-canvas panel for small screens. Desktop layouts keep their navigation
 * docked in flow, so drawers are the mobile/tablet counterpart rather than a
 * permanent overlay.
 */
export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  side = 'left',
  widthClassName = 'w-72 max-w-[85vw]',
  isSheet = false,
  ariaLabel,
  children
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useLockBodyScroll(isOpen);
  useEscapeKey(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) {
      previouslyFocused.current?.focus();
      return;
    }

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    // Defer so the panel exists before we move focus into it.
    const focusTimer = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const target = panel.querySelector<HTMLElement>(
        '[data-autofocus], button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      (target ?? panel).focus();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [isOpen]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;

    const panel = panelRef.current;
    if (!panel) return;

    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(element => element.offsetParent !== null);

    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const enterAnimation =
    side === 'left' ? 'animate-slide-in-left' : side === 'right' ? 'animate-slide-in-right' : 'animate-slide-up';

  const panelClasses =
    side === 'bottom'
      ? cn(
          'relative w-full max-h-[85dvh] rounded-t-2xl border-t border-line bg-surface shadow-2xl',
          'animate-slide-up'
        )
      : cn(
          'relative h-full shrink-0 border-line bg-surface shadow-2xl flex flex-col',
          widthClassName,
          enterAnimation
        );

  return (
    <div
      className={cn(
        'fixed inset-0 z-50',
        side === 'bottom' ? 'flex items-end justify-center' : 'flex'
      )}
    >
      <div
        className="absolute inset-0 bg-overlay/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn(
          panelClasses,
          side === 'left' && 'border-r',
          side === 'right' && 'border-l',
          isSheet && side !== 'bottom' && 'rounded-none'
        )}
      >
        {isSheet && side === 'bottom' && (
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line-strong" aria-hidden="true" />
        )}
        {children}
      </div>
    </div>
  );
};