import Dexie, { type Table } from 'dexie';
import { Order, Product } from '@pos/shared';
import { StorageAdapter } from '../types';

class PosLocalDatabase extends Dexie {
  orders!: Table<Order, string>;
  products!: Table<Product, string>;

  constructor() {
    super('PosLocalStore');
    this.version(1).stores({
      orders: 'id, syncStatus, createdAt, orderNumber',
      products: 'id, sku, barcode, name, categoryId, isActive'
    });
  }
}

export class IndexedDbAdapter implements StorageAdapter {
  private db: PosLocalDatabase;

  constructor() {
    this.db = new PosLocalDatabase();
  }

  async init(): Promise<void> {
    await this.db.open();
  }

  async saveOfflineOrder(order: Order): Promise<void> {
    await this.db.orders.put({
      ...order,
      syncStatus: 'PENDING_SYNC'
    });
  }

  async getPendingOrders(): Promise<Order[]> {
    return this.db.orders.where('syncStatus').equals('PENDING_SYNC').toArray();
  }

  async markOrderSynced(orderId: string): Promise<void> {
    await this.db.orders.update(orderId, { syncStatus: 'SYNCED' });
  }

  async cacheProducts(products: Product[]): Promise<void> {
    await this.db.transaction('rw', this.db.products, async () => {
      await this.db.products.clear();
      await this.db.products.bulkPut(products);
    });
  }

  async getCachedProducts(): Promise<Product[]> {
    return this.db.products.toArray();
  }

  async searchProducts(query: string): Promise<Product[]> {
    const q = query.toLowerCase();
    return this.db.products
      .filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode ? p.barcode.includes(q) : false)
      )
      .toArray();
  }
}
