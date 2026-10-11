import { Product } from '@pos/shared';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    sku: 'BEV-001',
    barcode: '8901001',
    name: 'Espresso Double Shot',
    categoryId: 'cat-bev',
    categoryName: 'Beverages',
    price: 3.50,
    taxRatePercent: 8,
    stockQuantity: 99,
    trackInventory: false,
    isActive: true
  },
  {
    id: 'prod-002',
    sku: 'BEV-002',
    barcode: '8901002',
    name: 'Vanilla Oat Milk Latte',
    categoryId: 'cat-bev',
    categoryName: 'Beverages',
    price: 4.75,
    taxRatePercent: 8,
    stockQuantity: 45,
    trackInventory: true,
    isActive: true
  },
  {
    id: 'prod-003',
    sku: 'BAK-001',
    barcode: '8901003',
    name: 'Almond Butter Croissant',
    categoryId: 'cat-bakery',
    categoryName: 'Bakery',
    price: 3.95,
    taxRatePercent: 5,
    stockQuantity: 14,
    trackInventory: true,
    isActive: true
  },
  {
    id: 'prod-004',
    sku: 'BAK-002',
    barcode: '8901004',
    name: 'Blueberry Glazed Scone',
    categoryId: 'cat-bakery',
    categoryName: 'Bakery',
    price: 3.25,
    taxRatePercent: 5,
    stockQuantity: 4,
    trackInventory: true,
    isActive: true
  },
  {
    id: 'prod-005',
    sku: 'FOOD-001',
    barcode: '8901005',
    name: 'Avocado Toast & Sourdough',
    categoryId: 'cat-food',
    categoryName: 'Prepared Food',
    price: 8.50,
    taxRatePercent: 8,
    stockQuantity: 30,
    trackInventory: true,
    isActive: true
  },
  {
    id: 'prod-006',
    sku: 'FOOD-002',
    barcode: '8901006',
    name: 'Smoked Turkey Panini',
    categoryId: 'cat-food',
    categoryName: 'Prepared Food',
    price: 9.95,
    taxRatePercent: 8,
    stockQuantity: 18,
    trackInventory: true,
    isActive: true
  },
  {
    id: 'prod-007',
    sku: 'RET-001',
    barcode: '8901007',
    name: 'Ceramic KeepCup (12oz)',
    categoryId: 'cat-merch',
    categoryName: 'Retail & Merch',
    price: 22.00,
    taxRatePercent: 10,
    stockQuantity: 12,
    trackInventory: true,
    isActive: true
  },
  {
    id: 'prod-008',
    sku: 'RET-002',
    barcode: '8901008',
    name: 'Ethiopian Whole Bean Coffee (250g)',
    categoryId: 'cat-merch',
    categoryName: 'Retail & Merch',
    price: 16.50,
    taxRatePercent: 0,
    stockQuantity: 25,
    trackInventory: true,
    isActive: true
  }
];
