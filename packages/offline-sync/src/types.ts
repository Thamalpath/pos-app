import { Order, Product } from '@pos/shared';

export interface StorageAdapter {
  init(): Promise<void>;
  saveOfflineOrder(order: Order): Promise<void>;
  getPendingOrders(): Promise<Order[]>;
  markOrderSynced(orderId: string): Promise<void>;
  cacheProducts(products: Product[]): Promise<void>;
  getCachedProducts(): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;
}

export type NetworkStatus = 'ONLINE' | 'OFFLINE';

export interface SyncEngineEvents {
  onSyncStarted?: () => void;
  onSyncCompleted?: (syncedCount: number) => void;
  onSyncFailed?: (error: Error) => void;
  onNetworkChange?: (status: NetworkStatus) => void;
}
