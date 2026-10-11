import { Order, Product } from '@pos/shared';
import { StorageAdapter, SyncEngineEvents, NetworkStatus } from './types';
import { IndexedDbAdapter } from './adapters/indexedDbAdapter';
import { TauriSqliteAdapter } from './adapters/tauriSqliteAdapter';

export class SyncEngine {
  private adapter: StorageAdapter;
  private syncApiEndpoint: string;
  private isSyncing = false;
  private isOnline: boolean;
  private events: SyncEngineEvents;

  constructor(options: {
    syncApiEndpoint: string;
    events?: SyncEngineEvents;
    preferNativeSqlite?: boolean;
  }) {
    this.syncApiEndpoint = options.syncApiEndpoint;
    this.events = options.events || {};
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    // Detect if running inside Tauri runtime or standard browser
    const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
    
    if (isTauri && options.preferNativeSqlite) {
      this.adapter = new TauriSqliteAdapter();
    } else {
      this.adapter = new IndexedDbAdapter();
    }

    this.bindNetworkListeners();
  }

  async init(): Promise<void> {
    try {
      await this.adapter.init();
    } catch (e) {
      console.warn('Fallback to IndexedDB adapter due to:', e);
      this.adapter = new IndexedDbAdapter();
      await this.adapter.init();
    }
  }

  private bindNetworkListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.events.onNetworkChange?.('ONLINE');
      this.triggerSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.events.onNetworkChange?.('OFFLINE');
    });
  }

  getNetworkStatus(): NetworkStatus {
    return this.isOnline ? 'ONLINE' : 'OFFLINE';
  }

  async recordOrder(order: Order, authToken?: string): Promise<{ synced: boolean }> {
    // If online, attempt direct cloud commit
    if (this.isOnline) {
      try {
        const response = await fetch(`${this.syncApiEndpoint}/api/v1/pos/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
          },
          body: JSON.stringify(order)
        });

        if (response.ok) {
          return { synced: true };
        }
      } catch (err) {
        console.warn('Network request failed during order submission. Saving to offline queue.', err);
      }
    }

    // Save to local offline queue (SQLite on Tauri, IndexedDB on Web)
    await this.adapter.saveOfflineOrder(order);
    return { synced: false };
  }

  async triggerSync(authToken?: string): Promise<number> {
    if (this.isSyncing || !this.isOnline) return 0;
    this.isSyncing = true;
    this.events.onSyncStarted?.();

    let syncedCount = 0;
    try {
      const pendingOrders = await this.adapter.getPendingOrders();
      for (const order of pendingOrders) {
        try {
          const res = await fetch(`${this.syncApiEndpoint}/api/v1/pos/orders/sync-offline`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
            },
            body: JSON.stringify(order)
          });

          if (res.ok) {
            await this.adapter.markOrderSynced(order.id);
            syncedCount++;
          }
        } catch (itemErr) {
          console.error(`Failed to sync order ${order.orderNumber}:`, itemErr);
          break; // Stop iteration if connection dropped
        }
      }
      this.events.onSyncCompleted?.(syncedCount);
    } catch (err: any) {
      this.events.onSyncFailed?.(err);
    } finally {
      this.isSyncing = false;
    }

    return syncedCount;
  }

  async cacheProducts(products: Product[]): Promise<void> {
    await this.adapter.cacheProducts(products);
  }

  async getCachedProducts(): Promise<Product[]> {
    return this.adapter.getCachedProducts();
  }

  async searchProducts(query: string): Promise<Product[]> {
    return this.adapter.searchProducts(query);
  }
}
