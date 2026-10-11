import React, { useEffect, useState } from 'react';
import { Badge, Button, ThemeToggle, cn } from '@pos/ui';
import {
  RefreshCw,
  Maximize2,
  Layers,
  Archive,
  ShoppingCart,
  Wifi,
  WifiOff,
  Monitor,
  Globe
} from 'lucide-react';
import { PlatformInfo } from '../lib/platform';
import { useCartStore } from '../stores/cartStore';
import { useSessionStore } from '../stores/sessionStore';
import { formatCurrency } from '@pos/shared';

interface PosHeaderProps {
  platform: PlatformInfo;
  isOnline: boolean;
  pendingSyncCount: number;
  onTriggerSync: () => void;
  onOpenHeldOrders: () => void;
  onToggleCart: () => void;
  cartItemCount: number;
  cartTotal: number;
}

export const PosHeader: React.FC<PosHeaderProps> = ({
  platform,
  isOnline,
  pendingSyncCount,
  onTriggerSync,
  onOpenHeldOrders,
  onToggleCart,
  cartItemCount,
  cartTotal
}) => {
  const heldOrders = useCartStore(s => s.heldOrders);
  const customerName = useCartStore(s => s.customerName);
  const session = useSessionStore();

  const [now, setNow] = useState(() => new Date());

  // One tick feeds both date and time so the two can never disagree.
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const date = now.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // 24h with an explicit meridiem marker: on a till running morning and evening
  // shifts, "13" versus "1" is exactly the ambiguity that causes errors.
  const time = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.log(err));
    } else {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    }
  };

  const statusLabel = isOnline
    ? pendingSyncCount > 0
      ? `Syncing ${pendingSyncCount}`
      : 'Online'
    : 'Offline';

  const fields = [
    { label: 'Operator', value: session.operatorName, mono: false },
    { label: 'Salesman', value: session.salesmanName, mono: false },
    { label: 'Date', value: date, mono: true },
    { label: 'Time', value: time, mono: true },
    { label: 'Customer', value: customerName || 'Walk-in', mono: false, accent: true },
    { label: 'Unit', value: session.unitName, mono: false },
    { label: 'Temp No', value: session.terminalNo, mono: true }
  ];

  return (
    <header className="shrink-0 z-20 bg-surface border-b border-line pt-safe-t brand-edge shadow-raised">
      {/* One single row. Brand, register details and controls share a single
          surface with no internal divider, so the whole thing reads as one
          header rather than a stack of bars. The details area takes the
          remaining space and scrolls sideways when the row runs out of room,
          which keeps every field reachable from a phone without wrapping the
          header onto a second line. */}
      <div className="flex items-stretch gap-3 sm:gap-4 px-3 sm:px-4 py-1.5 min-h-[52px]">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-brand flex items-center justify-center border border-brand-line shrink-0">
            <Layers className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-fg-on-brand" />
          </div>
          <div className="min-w-0 leading-tight">
            <h1 className="font-bold text-fg text-sm sm:text-base tracking-tight truncate">
              OmniPOS
            </h1>
            <p className="text-[10px] sm:text-[11px] text-fg-subtle truncate hidden sm:block">
              {session.storeName}
            </p>
          </div>
        </div>

        {/* Hairline separating identity from register data */}
        <div className="w-px bg-line shrink-0 self-stretch my-1" aria-hidden="true" />

        {/* Register details */}
        <div className="flex-1 min-w-0 flex items-center overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 pr-3">
            {/* Status leads so it is never what gets scrolled out of view */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full shrink-0',
                  isOnline ? 'bg-success' : 'bg-danger',
                  isOnline && pendingSyncCount > 0 && 'animate-pulse'
                )}
                aria-hidden="true"
              />
              <div className="leading-tight">
                <div className="text-[9px] uppercase tracking-[0.1em] text-fg-subtle">Status</div>
                <div
                  className={cn(
                    'text-xs font-semibold whitespace-nowrap',
                    isOnline ? 'text-success-fg' : 'text-danger-fg'
                  )}
                >
                  {statusLabel}
                </div>
              </div>
            </div>

            {fields.map(field => (
              <div key={field.label} className="leading-tight shrink-0">
                <div className="text-[9px] uppercase tracking-[0.1em] text-fg-subtle">
                  {field.label}
                </div>
                <div
                  className={cn(
                    'text-xs font-medium whitespace-nowrap',
                    field.mono && 'font-mono tabular',
                    field.accent ? 'text-brand-fg font-semibold' : 'text-fg'
                  )}
                >
                  {field.value}
                </div>
              </div>
            ))}

            {/* Runtime is diagnostic, so it only appears when there is room */}
            <div className="leading-tight shrink-0 hidden 2xl:block">
              <div className="text-[9px] uppercase tracking-[0.1em] text-fg-subtle">
                Runtime
              </div>
              <div className="text-xs font-medium text-fg-muted whitespace-nowrap flex items-center gap-1">
                {isOnline ? (
                  <Wifi className="w-3 h-3 text-success-fg" />
                ) : (
                  <WifiOff className="w-3 h-3 text-danger-fg" />
                )}
                {platform.isTauri ? 'Tauri Desktop' : 'Web POS'}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {pendingSyncCount > 0 && (
            <button
              onClick={onTriggerSync}
              className="flex items-center gap-1.5 px-2 py-1.5 bg-warning-soft border border-warning-line text-warning-fg text-xs rounded-lg hover:brightness-95 transition shrink-0"
              title="Click to sync pending orders"
            >
              <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
              <span className="hidden sm:inline tabular">{pendingSyncCount}</span>
            </button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenHeldOrders}
            className="relative text-xs shrink-0"
            title="Held Tickets"
          >
            <Archive className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xl:inline">Held</span>
            {heldOrders.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-brand text-fg-on-brand font-bold rounded-full text-[10px] tabular">
                {heldOrders.length}
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            aria-label="Toggle fullscreen"
            className="hidden sm:inline-flex shrink-0"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>

          <div className="hidden lg:block shrink-0">
            <Badge
              variant={platform.isTauri ? 'success' : 'info'}
              className="text-[10px] py-0 px-2"
            >
              {platform.isTauri ? (
                <>
                  <Monitor className="w-3 h-3" /> Tauri
                </>
              ) : (
                <>
                  <Globe className="w-3 h-3" /> Web
                </>
              )}
            </Badge>
          </div>

          <ThemeToggle />

          {/* Cart trigger — below lg the cart lives in an off-canvas drawer */}
          <button
            type="button"
            onClick={onToggleCart}
            aria-label={`Open cart, ${cartItemCount} items`}
            className="relative lg:hidden p-2 rounded-lg text-fg-muted hover:bg-surface-3 hover:text-fg transition min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 bg-brand text-fg-on-brand font-bold rounded-full text-[10px] flex items-center justify-center tabular">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Running total — only meaningful once the cart is in view */}
      <span className="sr-only" aria-live="polite">
        Cart total {formatCurrency(cartTotal)}
      </span>
    </header>
  );
};