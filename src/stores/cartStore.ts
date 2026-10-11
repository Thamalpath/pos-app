import { create } from 'zustand';
import { CartItem, Product, calculateCartTotals, TotalsCalculation } from '@pos/shared';

export interface CartStore {
  items: CartItem[];
  customerId?: string;
  customerName?: string;
  orderNotes?: string;
  heldOrders: { id: string; name: string; items: CartItem[]; timestamp: string }[];
  
  // Actions
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  setQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  setItemDiscount: (itemId: string, discountAmount: number) => void;
  clearCart: () => void;
  setCustomer: (id?: string, name?: string) => void;
  setNotes: (notes: string) => void;
  holdCurrentCart: (label?: string) => void;
  recallOrder: (heldId: string) => void;
  
  // Computed
  getTotals: () => TotalsCalculation;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  customerId: undefined,
  customerName: undefined,
  orderNotes: '',
  heldOrders: [],

  addItem: (product: Product, quantity = 1) => {
    set(state => {
      const existingIndex = state.items.findIndex(item => item.productId === product.id);
      if (existingIndex > -1) {
        const updated = [...state.items];
        const current = updated[existingIndex];
        const newQty = current.quantity + quantity;
        const sub = current.price * newQty;
        const discount = current.discountAmount || 0;
        const tax = ((sub - discount) * current.taxRatePercent) / 100;

        updated[existingIndex] = {
          ...current,
          quantity: newQty,
          taxAmount: tax,
          total: sub - discount + tax
        };
        return { items: updated };
      }

      const itemSubtotal = product.price * quantity;
      const tax = (itemSubtotal * (product.taxRatePercent || 0)) / 100;
      const newItem: CartItem = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        productId: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity,
        taxRatePercent: product.taxRatePercent || 0,
        taxAmount: tax,
        discountAmount: 0,
        total: itemSubtotal + tax
      };

      return { items: [...state.items, newItem] };
    });
  },

  updateQuantity: (itemId: string, delta: number) => {
    set(state => {
      const updated = state.items
        .map(item => {
          if (item.id !== itemId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          const sub = item.price * newQty;
          const discount = item.discountAmount || 0;
          const tax = ((sub - discount) * item.taxRatePercent) / 100;
          return {
            ...item,
            quantity: newQty,
            taxAmount: tax,
            total: sub - discount + tax
          };
        })
        .filter(Boolean) as CartItem[];

      return { items: updated };
    });
  },

  setQuantity: (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }
    set(state => ({
      items: state.items.map(item => {
        if (item.id !== itemId) return item;
        const sub = item.price * quantity;
        const discount = item.discountAmount || 0;
        const tax = ((sub - discount) * item.taxRatePercent) / 100;
        return {
          ...item,
          quantity,
          taxAmount: tax,
          total: sub - discount + tax
        };
      })
    }));
  },

  removeItem: (itemId: string) => {
    set(state => ({
      items: state.items.filter(item => item.id !== itemId)
    }));
  },

  setItemDiscount: (itemId: string, discountAmount: number) => {
    set(state => ({
      items: state.items.map(item => {
        if (item.id !== itemId) return item;
        const sub = item.price * item.quantity;
        const tax = ((sub - discountAmount) * item.taxRatePercent) / 100;
        return {
          ...item,
          discountAmount,
          taxAmount: tax,
          total: sub - discountAmount + tax
        };
      })
    }));
  },

  clearCart: () => {
    set({ items: [], customerId: undefined, customerName: undefined, orderNotes: '' });
  },

  setCustomer: (id?: string, name?: string) => {
    set({ customerId: id, customerName: name });
  },

  setNotes: (notes: string) => {
    set({ orderNotes: notes });
  },

  holdCurrentCart: (label?: string) => {
    const { items, heldOrders } = get();
    if (items.length === 0) return;
    const newHeld = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: label || `Ticket #${heldOrders.length + 1}`,
      items: [...items],
      timestamp: new Date().toLocaleTimeString()
    };
    set({
      heldOrders: [...heldOrders, newHeld],
      items: [],
      customerId: undefined,
      customerName: undefined
    });
  },

  recallOrder: (heldId: string) => {
    const { heldOrders } = get();
    const target = heldOrders.find(h => h.id === heldId);
    if (!target) return;
    set({
      items: target.items,
      heldOrders: heldOrders.filter(h => h.id !== heldId)
    });
  },

  getTotals: () => {
    return calculateCartTotals(get().items);
  }
}));
