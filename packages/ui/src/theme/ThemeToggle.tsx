import React, { useEffect, useRef, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme, type ThemePreference } from './theme-controller';

export interface ThemeToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * `toggle` renders a single light/dark switch (default).
   * `menu` adds a dropdown with an explicit "System" option.
   */
  variant?: 'toggle' | 'menu';
  align?: 'left' | 'right';
}

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor }
];

const TRIGGER_CLASSES =
  'inline-flex items-center justify-center rounded-lg p-2 transition-colors ' +
  'text-fg-muted hover:bg-surface-3 hover:text-fg ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60';

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'toggle',
  align = 'right',
  className,
  ...props
}) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  if (variant === 'toggle') {
    const nextThemeLabel = resolvedTheme === 'dark' ? 'light' : 'dark';

    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${nextThemeLabel} theme`}
        title={`Switch to ${nextThemeLabel} theme`}
        className={cn(TRIGGER_CLASSES, className)}
        {...props}
      >
        {resolvedTheme === 'dark' ? (
          <Sun className="w-4 h-4" aria-hidden="true" />
        ) : (
          <Moon className="w-4 h-4" aria-hidden="true" />
        )}
      </button>
    );
  }

  const ActiveIcon = theme === 'system' ? Monitor : theme === 'light' ? Sun : Moon;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsMenuOpen(open => !open)}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        aria-label="Change theme"
        title="Change theme"
        className={cn(TRIGGER_CLASSES, isMenuOpen && 'bg-surface-3 text-fg')}
      >
        <ActiveIcon className="w-4 h-4" aria-hidden="true" />
      </button>

      {isMenuOpen && (
        <div
          role="menu"
          className={cn(
            'absolute z-50 mt-2 w-40 overflow-hidden rounded-xl border border-line',
            'bg-surface p-1 shadow-xl animate-fade-in',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {OPTIONS.map(({ value, label, icon: Icon }) => {
            const isActive = theme === value;
            return (
              <button
                key={value}
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => {
                  setTheme(value);
                  setIsMenuOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-soft text-brand-fg'
                    : 'text-fg-muted hover:bg-surface-3 hover:text-fg'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};