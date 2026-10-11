import { z } from 'zod';

export const PaymentMethodSchema = z.enum([
  'CASH',
  'CARD',
  'UPI_QR',
  'WALLET',
  'GIFT_CARD',
  'SPLIT',
  'STORE_CREDIT'
]);

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const OrderStatusSchema = z.enum([
  'PENDING',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
  'HELD'
]);

export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const SyncStatusSchema = z.enum([
  'SYNCED',
  'PENDING_SYNC',
  'SYNC_FAILED'
]);

export type SyncStatus = z.infer<typeof SyncStatusSchema>;

export const ProductSchema = z.object({
  id: z.string().uuid(),
  sku: z.string().min(1),
  barcode: z.string().optional(),
  name: z.string().min(1),
  categoryId: z.string(),
  categoryName: z.string(),
  price: z.number().nonnegative(),
  costPrice: z.number().nonnegative().optional(),
  taxRatePercent: z.number().min(0).max(100).default(0),
  stockQuantity: z.number().default(0),
  trackInventory: z.boolean().default(true),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
  hasVariants: z.boolean().optional(),
  variants: z.array(z.object({
    id: z.string(),
    name: z.string(),
    sku: z.string(),
    price: z.number(),
    stockQuantity: z.number()
  })).optional()
});

export type Product = z.infer<typeof ProductSchema>;

export const CartItemSchema = z.object({
  id: z.string(), // Cart line ID
  productId: z.string(),
  name: z.string(),
  sku: z.string(),
  price: z.number(),
  quantity: z.number().positive(),
  taxRatePercent: z.number(),
  taxAmount: z.number(),
  discountAmount: z.number().default(0),
  note: z.string().optional(),
  total: z.number()
});

export type CartItem = z.infer<typeof CartItemSchema>;

export const PaymentTransactionSchema = z.object({
  id: z.string().uuid(),
  method: PaymentMethodSchema,
  amount: z.number().positive(),
  tendered: z.number().optional(),
  changeGiven: z.number().optional(),
  referenceNumber: z.string().optional(),
  timestamp: z.string().datetime()
});

export type PaymentTransaction = z.infer<typeof PaymentTransactionSchema>;

export const OrderSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  tenantId: z.string(),
  storeId: z.string(),
  terminalId: z.string(),
  cashierId: z.string(),
  cashierName: z.string(),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  items: z.array(CartItemSchema),
  subtotal: z.number(),
  discountTotal: z.number(),
  taxTotal: z.number(),
  grandTotal: z.number(),
  payments: z.array(PaymentTransactionSchema),
  status: OrderStatusSchema,
  syncStatus: SyncStatusSchema,
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type Order = z.infer<typeof OrderSchema>;

export interface Shift {
  id: string;
  terminalId: string;
  cashierId: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  expectedCash?: number;
  actualCash?: number;
  cashDifference?: number;
  totalSales: number;
  totalCashSales: number;
  totalCardSales: number;
  isOpen: boolean;
}
