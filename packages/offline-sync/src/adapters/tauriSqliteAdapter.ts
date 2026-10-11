import { Order, Product } from '@pos/shared';
import { StorageAdapter } from '../types';

/**
 * TauriSQLiteAdapter communicates with SQLite via Tauri 2.0 SQL plugin
 * (e.g., tauri-plugin-sql: sqlite:pos_local.db)
 */
export class TauriSqliteAdapter implements StorageAdapter {
  private db: any = null;

  async init(): Promise<void> {
    try {
      // Dynamic import to prevent bundler errors when compiling for web-only
      const Database = (await import('@tauri-apps/plugin-sql')).default;
      this.db = await Database.load('sqlite:pos_offline.db');

      // Create local SQLite schema for desktop offline capability
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS offline_orders (
          id TEXT PRIMARY KEY,
          order_number TEXT NOT NULL,
          payload TEXT NOT NULL,
          sync_status TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
      `);

      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS local_products (
          id TEXT PRIMARY KEY,
          sku TEXT NOT NULL,
          barcode TEXT,
          name TEXT NOT NULL,
          category_id TEXT,
          category_name TEXT,
          price REAL NOT NULL,
          tax_rate REAL NOT NULL,
          stock_quantity REAL NOT NULL,
          payload TEXT NOT NULL
        );
      `);
    } catch (err) {
      console.warn('Tauri SQLite plugin not available in this environment. Fallback needed.', err);
      throw err;
    }
  }

  async saveOfflineOrder(order: Order): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.execute(
      `INSERT OR REPLACE INTO offline_orders (id, order_number, payload, sync_status, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [order.id, order.orderNumber, JSON.stringify(order), 'PENDING_SYNC', order.createdAt]
    );
  }

  async getPendingOrders(): Promise<Order[]> {
    if (!this.db) throw new Error('Database not initialized');
    const rows = await this.db.select(
      `SELECT payload FROM offline_orders WHERE sync_status = 'PENDING_SYNC' ORDER BY created_at ASC`
    );
    return rows.map((r: any) => JSON.parse(r.payload));
  }

  async markOrderSynced(orderId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.execute(
      `UPDATE offline_orders SET sync_status = 'SYNCED' WHERE id = $1`,
      [orderId]
    );
  }

  async cacheProducts(products: Product[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    for (const p of products) {
      await this.db.execute(
        `INSERT OR REPLACE INTO local_products (id, sku, barcode, name, category_id, category_name, price, tax_rate, stock_quantity, payload)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          p.id,
          p.sku,
          p.barcode || '',
          p.name,
          p.categoryId,
          p.categoryName,
          p.price,
          p.taxRatePercent,
          p.stockQuantity,
          JSON.stringify(p)
        ]
      );
    }
  }

  async getCachedProducts(): Promise<Product[]> {
    if (!this.db) throw new Error('Database not initialized');
    const rows = await this.db.select(`SELECT payload FROM local_products`);
    return rows.map((r: any) => JSON.parse(r.payload));
  }

  async searchProducts(query: string): Promise<Product[]> {
    if (!this.db) throw new Error('Database not initialized');
    const q = `%${query}%`;
    const rows = await this.db.select(
      `SELECT payload FROM local_products 
       WHERE name LIKE $1 OR sku LIKE $1 OR barcode LIKE $1`,
      [q]
    );
    return rows.map((r: any) => JSON.parse(r.payload));
  }
}
