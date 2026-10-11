import React from 'react';
import { Modal, Button } from '@pos/ui';
import { Order, formatCurrency } from '@pos/shared';
import { Printer, Check, ArrowRight } from 'lucide-react';
import { printReceipt, openCashDrawer } from '../lib/platform';

interface ReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onNewSale: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  isOpen,
  onClose,
  onNewSale
}) => {
  if (!order) return null;

  const generateReceiptText = () => {
    const lines = [
      '========================================',
      '              OMNIPOS STORE             ',
      '        123 Business Avenue, Suite 4    ',
      '             Tel: (555) 019-2834        ',
      '========================================',
      `Order: #${order.orderNumber}`,
      `Date:  ${new Date(order.createdAt).toLocaleString()}`,
      `Cashier: ${order.cashierName}`,
      `Customer: ${order.customerName || 'Walk-in'}`,
      '----------------------------------------',
      'ITEM                   QTY   PRICE TOTAL'
    ];

    order.items.forEach(item => {
      const name = item.name.padEnd(20, ' ').substring(0, 20);
      const qty = String(item.quantity).padStart(3, ' ');
      const total = formatCurrency(item.total).padStart(8, ' ');
      lines.push(`${name} ${qty} ${total}`);
    });

    lines.push('----------------------------------------');
    lines.push(`Subtotal:                 ${formatCurrency(order.subtotal)}`);
    if (order.discountTotal > 0) {
      lines.push(`Discount:                -${formatCurrency(order.discountTotal)}`);
    }
    lines.push(`Tax:                      ${formatCurrency(order.taxTotal)}`);
    lines.push(`TOTAL:                    ${formatCurrency(order.grandTotal)}`);
    lines.push('========================================');
    if (order.payments.length > 0) {
      const p = order.payments[0];
      lines.push(`Payment (${p.method}):       ${formatCurrency(p.amount)}`);
      if (p.tendered) {
        lines.push(`Tendered:                 ${formatCurrency(p.tendered)}`);
      }
      if (p.changeGiven) {
        lines.push(`Change Due:               ${formatCurrency(p.changeGiven)}`);
      }
    }
    lines.push('========================================');
    lines.push('       Thank you for your business!     ');
    lines.push('         Please retain for refund       ');
    lines.push('========================================\n\n');

    return lines.join('\n');
  };

  const handlePrint = async () => {
    const receiptText = generateReceiptText();
    await printReceipt(receiptText);
    await openCashDrawer();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sale Complete" maxWidth="md">
      <div className="space-y-5">
        <div className="flex items-center gap-2 p-3 bg-success-soft border border-success-line rounded-xl text-success-fg text-xs font-medium">
          <Check className="w-4 h-4 shrink-0" />
          <span>Payment successful! Receipt has been generated.</span>
        </div>

        {/* Paper receipt preview — stays monochrome so it matches the printout */}
        <div className="bg-surface-2 p-4 rounded-xl border border-line font-mono text-xs text-fg-muted max-h-[320px] overflow-y-auto leading-relaxed shadow-inner">
          <pre className="whitespace-pre-wrap">{generateReceiptText()}</pre>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 pt-2">
          <Button variant="secondary" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </Button>

          <Button variant="primary" onClick={onNewSale} className="gap-2 font-bold px-5">
            <span>Next Sale</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Modal>
  );
};
