import { CartItem } from '../schemas';

export interface TotalsCalculation {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  itemCount: number;
}

export function calculateCartTotals(items: CartItem[]): TotalsCalculation {
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;
  let itemCount = 0;

  for (const item of items) {
    const itemSubtotal = item.price * item.quantity;
    const itemDiscount = item.discountAmount || 0;
    const taxableAmount = Math.max(0, itemSubtotal - itemDiscount);
    const itemTax = (taxableAmount * (item.taxRatePercent || 0)) / 100;

    subtotal += itemSubtotal;
    discountTotal += itemDiscount;
    taxTotal += itemTax;
    itemCount += item.quantity;
  }

  const grandTotal = Math.max(0, subtotal - discountTotal + taxTotal);

  return {
    subtotal: roundTo2(subtotal),
    discountTotal: roundTo2(discountTotal),
    taxTotal: roundTo2(taxTotal),
    grandTotal: roundTo2(grandTotal),
    itemCount
  };
}

export function roundTo2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Money is handled in rupees. The locale drives digit grouping, so switch
 * CURRENCY_LOCALE to 'en-US' if the till needs plain 123,456.00 grouping
 * instead of the lakh system.
 */
export const CURRENCY_CODE = 'INR';
export const CURRENCY_LOCALE = 'en-IN';
export const CURRENCY_LABEL = 'Rs.';

/**
 * Plain grouped number with no currency symbol.
 *
 * Prefer this wherever the currency is already stated once for the whole
 * panel (cart totals, product tiles, price columns). Repeating the symbol on
 * every line is noise and pushes digits out of alignment on a narrow screen.
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Amount with an explicit Rs. prefix. Reserved for places where the currency
 * must stand alone - printed receipts, totals that float free of a header,
 * and any exported/committed figure.
 */
export function formatCurrency(amount: number, currency: string = CURRENCY_CODE): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}
