import { create } from 'zustand';

/**
 * Identity of the register session, as shown in the POS information bar.
 * Kept separate from the cart store: this is who is logged in, not what is
 * being sold.
 */
export interface SessionState {
  operatorId: string;
  operatorName: string;
  operatorRole: string;
  salesmanId: string;
  salesmanName: string;
  terminalNo: string;
  unitName: string;
  storeName: string;

  setSalesman: (salesmanName: string) => void;
}

export const useSessionStore = create<SessionState>(set => ({
  operatorId: 'usr-cashier-1',
  operatorName: 'John Doe',
  operatorRole: 'Cashier',
  salesmanId: 'usr-sales-1',
  salesmanName: 'Sarah Connor',
  terminalNo: '01',
  unitName: 'Main Counter',
  storeName: 'OmniPOS Store',

  setSalesman: salesmanName => set({ salesmanName })
}));