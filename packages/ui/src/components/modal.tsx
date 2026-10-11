import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

/**
 * Dialog that renders as a bottom sheet on phones (full-bleed, thumb-reachable)
 * and a centred dialog from `sm` upwards.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md'
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = React.useId();

  useLockBodyScroll(isOpen);
  useEscapeKey(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) {
      previouslyFocused.current?.focus();
      return;
    }

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const focusTimer = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const target = panel.querySelector<HTMLElement>(
        '[data-autofocus], input:not([type="hidden"]), select, textarea, button'
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

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-overlay/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative w-full bg-surface border border-line rounded-t-2xl sm:rounded-xl shadow-2xl z-10',
          'flex flex-col max-h-[92dvh] sm:max-h-[85vh]',
          'animate-slide-up sm:animate-zoom-in-95',
          maxWidths[maxWidth]
        )}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line-strong sm:hidden" aria-hidden="true" />

        <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 border-b border-line shrink-0">
          <h3 id={titleId} className="text-base sm:text-lg font-semibold text-fg">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 -mr-1.5 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-3 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
};