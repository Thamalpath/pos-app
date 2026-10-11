import React from "react";
import { useCartStore } from "../stores/cartStore";
import { formatAmount, CURRENCY_LABEL } from "@pos/shared";
import { Button } from "@pos/ui";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  User,
  PauseCircle,
  CreditCard,
  X,
} from "lucide-react";

interface CartSidebarProps {
  onOpenPayment: () => void;
  onSelectCustomer: () => void;
  onClose?: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  onOpenPayment,
  onSelectCustomer,
  onClose,
}) => {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    holdCurrentCart,
    customerName,
    getTotals,
  } = useCartStore();

  const totals = getTotals();

  return (
    <div className="flex flex-col h-full min-h-0 bg-surface">
      {/* Customer / Order Details Header */}
      <div className="p-3 sm:p-3.5 border-b border-line flex items-center justify-between gap-2 bg-surface-2 shrink-0">
        <button
          onClick={onSelectCustomer}
          className="flex items-center gap-2 text-xs font-medium text-fg-muted hover:text-fg bg-surface-3 hover:bg-surface-4 px-3 py-2 rounded-lg border border-line transition min-w-0"
        >
          <User className="w-3.5 h-3.5 text-brand-fg shrink-0" />
          <span className="truncate">{customerName || "Walk-in Customer"}</span>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-fg-muted font-semibold tabular whitespace-nowrap">
            {items.length} {items.length === 1 ? "Item" : "Items"}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close cart"
              className="p-2 -mr-1 rounded-lg text-fg-muted hover:bg-surface-3 hover:text-fg transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-2.5">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-fg-subtle py-16">
            <div className="w-14 h-14 rounded-2xl bg-surface-3 flex items-center justify-center mb-3">
              <ShoppingCart className="w-6 h-6 stroke-1 text-fg-muted" />
            </div>
            <p className="text-sm font-semibold text-fg-muted">Cart is empty</p>
            <p className="text-xs text-fg-subtle mt-1 text-center max-w-[200px]">
              Scan barcodes or tap products from the catalog to build sale
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-surface-2 border border-line rounded-xl flex items-center justify-between gap-2 sm:gap-3 group hover:border-line-strong transition"
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-fg text-sm truncate">
                  {item.name}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-fg-muted">
                  <span className="tabular">
                    {formatAmount(item.price)} each
                  </span>
                  {item.taxRatePercent > 0 && (
                    <span className="text-[10px] text-fg-subtle">
                      ({item.taxRatePercent}% Tax)
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-1 bg-surface border border-line rounded-lg p-1 shrink-0">
                <button
                  onClick={() => updateQuantity(item.id, -1)}
                  aria-label={`Decrease ${item.name} quantity`}
                  className="w-8 h-8 sm:w-7 sm:h-7 rounded flex items-center justify-center text-fg-muted hover:text-fg hover:bg-surface-3 transition"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-7 sm:w-8 text-center text-xs font-bold text-fg tabular">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, 1)}
                  aria-label={`Increase ${item.name} quantity`}
                  className="w-8 h-8 sm:w-7 sm:h-7 rounded flex items-center justify-center text-fg-muted hover:text-fg hover:bg-surface-3 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Line Total & Remove */}
              <div className="text-right shrink-0 min-w-[62px]">
                <div className="text-sm font-bold text-fg tabular">
                  {formatAmount(item.total)}
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.name}`}
                  className="text-[11px] text-danger-fg/80 hover:text-danger flex items-center gap-1 ml-auto mt-1 transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Remove</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bill Summary */}
      <div className="p-4 border-t border-line bg-surface-2 space-y-2 shrink-0">
        {/* Currency stated once for the whole summary; every line below is a
            bare number so the totals stay column-aligned. */}
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-fg-subtle">
          <span>Bill Summary</span>
          <span>All amounts in {CURRENCY_LABEL}</span>
        </div>
        <div className="flex justify-between text-xs text-fg-muted">
          <span>Subtotal</span>
          <span className="tabular">{formatAmount(totals.subtotal)}</span>
        </div>
        {totals.discountTotal > 0 && (
          <div className="flex justify-between text-xs text-warning-fg">
            <span>Discounts</span>
            <span className="tabular">
              -{formatAmount(totals.discountTotal)}
            </span>
          </div>
        )}
        <div className="flex justify-between text-xs text-fg-muted">
          <span>Sales Tax</span>
          <span className="tabular">{formatAmount(totals.taxTotal)}</span>
        </div>
        <div className="pt-2 border-t border-line flex justify-between items-baseline gap-2">
          <span className="text-sm font-bold text-fg">Total Payable</span>
          <span className="text-2xl font-black text-brand-fg tracking-tight tabular">
            {formatAmount(totals.grandTotal)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 sm:p-4 border-t border-line space-y-2.5 shrink-0 pb-safe-b">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearCart}
            disabled={items.length === 0}
            className="text-xs hover:bg-danger-soft hover:border-danger-line hover:text-danger-fg"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Cart
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => holdCurrentCart()}
            disabled={items.length === 0}
            className="text-xs"
          >
            <PauseCircle className="w-3.5 h-3.5" /> Hold Ticket
          </Button>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={onOpenPayment}
          disabled={items.length === 0}
          className="w-full text-base font-bold items-center justify-center gap-2 py-3.5"
        >
          <CreditCard className="w-5 h-5 shrink-0" />
          <span className="truncate tabular">
            Pay {formatAmount(totals.grandTotal)} {CURRENCY_LABEL}
          </span>
        </Button>
      </div>
    </div>
  );
};
