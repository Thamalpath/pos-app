import React, { useState } from 'react';
import { Modal, Button, Input } from '@pos/ui';
import {
  PaymentMethod,
  formatAmount,
  formatCurrency,
  CURRENCY_LABEL,
  Order,
  CartItem
} from '@pos/shared';
import { Banknote, CreditCard, QrCode, Wallet, CheckCircle, Keyboard } from 'lucide-react';
import { useSessionStore } from '../stores/sessionStore';
import { DockKey, useKeyboardDock } from '../stores/keyboardDockStore';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: number;
  items: CartItem[];
  customerName?: string;
  onPaymentComplete: (order: Order) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  grandTotal,
  items,
  customerName,
  onPaymentComplete
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CASH');
  const [amountTendered, setAmountTendered] = useState<string>(grandTotal.toFixed(2));
  const [isProcessing, setIsProcessing] = useState(false);
  const operatorName = useSessionStore(s => s.operatorName);

  const tenderedNum = parseFloat(amountTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - grandTotal);

  const quickAmounts = [
    grandTotal,
    Math.ceil(grandTotal / 5) * 5,
    Math.ceil(grandTotal / 10) * 10,
    Math.ceil(grandTotal / 20) * 20,
    100
  ].filter((v, idx, arr) => arr.indexOf(v) === idx && v >= grandTotal);

  const openDock = useKeyboardDock(s => s.open);
  const closeDock = useKeyboardDock(s => s.close);

  // Same rule as the sink below, hoisted so the dock can grey out the letters
  // instead of accepting a press that silently does nothing.
  const acceptsDockKey = (key: DockKey) =>
    key.kind === 'char' ? /^[0-9.]$/.test(key.value) : true;

  // Numeric entry for cash tender. Letters are ignored rather than appended:
  // the dock is shared with the search field, which does take letters, and
  // "1a2b3" would silently parse as 1. One decimal point only, and no leading
  // zeros, so the keypad cannot produce "007.5.0" through no fault of its own.
  const handleDockKey = (key: DockKey) => {
    if (key.kind === 'char') {
      if (!/^[0-9.]$/.test(key.value)) return;
      setAmountTendered(prev => {
        if (key.value === '.') return prev.includes('.') ? prev : `${prev || '0'}.`;
        if (prev === '0') return key.value;
        return (prev + key.value).slice(0, 12);
      });
      return;
    }

    switch (key.action) {
      case 'backspace':
        setAmountTendered(prev => prev.slice(0, -1));
        break;
      case 'clear':
        setAmountTendered('');
        break;
      case 'enter':
        if (selectedMethod === 'CASH' && tenderedNum >= grandTotal) handleCompleteSale();
        else closeDock();
        break;
      default:
        break;
    }
  };

  const handleCompleteSale = () => {
    setIsProcessing(true);

    const orderId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      tenantId: 'tenant-demo-001',
      storeId: 'store-main',
      terminalId: 'pos-term-01',
      cashierId: 'usr-cashier-1',
      cashierName: operatorName,
      customerName: customerName || 'Walk-in Customer',
      items: [...items],
      subtotal: items.reduce((acc, i) => acc + i.price * i.quantity, 0),
      discountTotal: items.reduce((acc, i) => acc + (i.discountAmount || 0), 0),
      taxTotal: items.reduce((acc, i) => acc + i.taxAmount, 0),
      grandTotal,
      payments: [
        {
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          method: selectedMethod,
          amount: grandTotal,
          tendered: selectedMethod === 'CASH' ? tenderedNum : grandTotal,
          changeGiven: selectedMethod === 'CASH' ? changeDue : 0,
          timestamp: new Date().toISOString()
        }
      ],
      status: 'COMPLETED',
      syncStatus: 'PENDING_SYNC',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTimeout(() => {
      setIsProcessing(false);
      onPaymentComplete(newOrder);
    }, 400);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Process Payment" maxWidth="lg">
      <div className="space-y-5 sm:space-y-6 select-none">
        {/* Total Banner */}
        <div className="bg-surface-2 p-4 rounded-xl border border-line flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs text-fg-muted font-medium uppercase tracking-wider">
              Amount Due
            </span>
            <div className="text-2xl sm:text-3xl font-black text-brand-fg tabular">
              {formatCurrency(grandTotal)}
            </div>
          </div>
          <div className="text-right min-w-0">
            <span className="text-xs text-fg-muted font-medium">Customer</span>
            <div className="text-sm font-semibold text-fg truncate">
              {customerName || 'Walk-in Customer'}
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <label className="text-xs font-semibold text-fg-muted block mb-2 uppercase tracking-wider">
            Select Tender Method
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'CASH', label: 'Cash', icon: Banknote },
              { id: 'CARD', label: 'Card / POS', icon: CreditCard },
              { id: 'UPI_QR', label: 'UPI / QR', icon: QrCode },
              { id: 'WALLET', label: 'Wallet', icon: Wallet }
            ].map(m => {
              const Icon = m.icon;
              const isSelected = selectedMethod === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMethod(m.id as PaymentMethod)}
                  aria-pressed={isSelected}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-xs font-medium gap-1.5 min-h-[64px] ${
                    isSelected
                      ? 'bg-brand-soft border-brand text-brand-fg font-semibold shadow-inner'
                      : 'bg-surface border-line text-fg-muted hover:border-line-strong hover:text-fg'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cash Tender Input & Shortcuts */}
        {selectedMethod === 'CASH' && (
          <div className="space-y-3 bg-surface-2 p-4 rounded-xl border border-line">
            <div>
              <label className="text-xs text-fg-muted block mb-1.5" htmlFor="amount-tendered">
                Amount Tendered ({CURRENCY_LABEL})
              </label>
              <div className="flex gap-2">
                <Input
                  id="amount-tendered"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={amountTendered}
                  onChange={e => setAmountTendered(e.target.value)}
                  className="text-lg font-bold text-center tabular"
                />
                {/* Hands focus to the on-screen keypad for touch terminals */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openDock('Cash Tendered', handleDockKey, acceptsDockKey)}
                  className="shrink-0 text-xs"
                  title="Open on-screen keyboard"
                >
                  <Keyboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Keys</span>
                </Button>
              </div>
            </div>

            {/* Quick Bill Buttons */}
            <div className="grid grid-cols-3 sm:flex sm:gap-2 sm:flex-wrap">
              {quickAmounts.map(val => (
                <Button
                  key={val}
                  variant="secondary"
                  size="sm"
                  onClick={() => setAmountTendered(val.toFixed(2))}
                  className="text-xs tabular"
                >
                  {formatAmount(val)}
                </Button>
              ))}
            </div>

            {/* Change display */}
            <div className="flex items-center justify-between pt-2 border-t border-line">
              <span className="text-sm font-semibold text-fg-muted">Change Due:</span>
              <span className="text-xl font-bold text-accent-fg tabular">
                {formatAmount(changeDue)} {CURRENCY_LABEL}
              </span>
            </div>
          </div>
        )}

        {/* Card instructions */}
        {selectedMethod === 'CARD' && (
          <div className="p-4 bg-surface-2 rounded-xl border border-line text-center">
            <CreditCard className="w-8 h-8 text-info-fg mx-auto mb-2" />
            <p className="text-sm font-medium text-fg">Insert, swipe or tap card on terminal</p>
            <p className="text-xs text-fg-muted mt-1">Waiting for payment gateway authorization...</p>
          </div>
        )}

        {selectedMethod === 'UPI_QR' && (
          <div className="p-4 bg-surface-2 rounded-xl border border-line text-center">
            <QrCode className="w-12 h-12 text-brand-fg mx-auto mb-2" />
            <p className="text-sm font-medium text-fg">Customer Dynamic QR Code</p>
            <p className="text-xs text-fg-muted mt-1">Scan using any UPI or Mobile banking app</p>
          </div>
        )}

        {selectedMethod === 'WALLET' && (
          <div className="p-4 bg-surface-2 rounded-xl border border-line text-center">
            <Wallet className="w-8 h-8 text-accent-fg mx-auto mb-2" />
            <p className="text-sm font-medium text-fg">Tap card or phone on the NFC reader</p>
            <p className="text-xs text-fg-muted mt-1">Waiting for wallet authorization...</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleCompleteSale}
            disabled={isProcessing || (selectedMethod === 'CASH' && tenderedNum < grandTotal)}
            className="font-bold"
          >
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span className="truncate">
              {isProcessing ? 'Finalizing...' : 'Complete Transaction'}
            </span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};