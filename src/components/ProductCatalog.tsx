import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Product, formatAmount, CURRENCY_LABEL } from '@pos/shared';
import { Input } from '@pos/ui';
import { Search, ScanBarcode, Plus, Tag, ShoppingCart } from 'lucide-react';
import { DockKey, useKeyboardDock } from '../stores/keyboardDockStore';

interface ProductCatalogProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  /** Opens the cart drawer below the lg breakpoint. */
  onOpenCart: () => void;
  /** Backs the dock's Held key. */
  onOpenHeldOrders: () => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  onSelectProduct,
  onOpenCart,
  onOpenHeldOrders
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const registerDefault = useKeyboardDock(s => s.registerDefault);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => set.add(p.categoryName));
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory =
        selectedCategory === 'ALL' || p.categoryName === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Barcode enter detection (if cashier scans barcode that hits exactly 1 product)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const match = products.find(
        p =>
          p.barcode === searchQuery.trim() ||
          p.sku.toLowerCase() === searchQuery.trim().toLowerCase()
      );
      if (match) {
        onSelectProduct(match);
        setSearchQuery('');
      }
    }
  };

  // The dock writes here by default. Keeping the edit logic in one place means
  // the keypad, a barcode scanner and a physical keyboard all produce the same
  // result, and each rule is only stated once.
  const commitScan = useCallback(() => {
    const match = products.find(
      p =>
        p.barcode === searchQuery.trim() ||
        p.sku.toLowerCase() === searchQuery.trim().toLowerCase()
    );
    if (match) {
      onSelectProduct(match);
      setSearchQuery('');
    }
  }, [products, onSelectProduct, searchQuery]);

  const handleDockKey = useCallback(
    (key: DockKey) => {
      if (key.kind === 'char') {
        setSearchQuery(prev => prev + key.value);
        return;
      }

      switch (key.action) {
        case 'backspace':
          setSearchQuery(prev => prev.slice(0, -1));
          break;
        case 'clear':
          setSearchQuery('');
          break;
        case 'enter':
          commitScan();
          break;
        case 'focus-search':
          searchInputRef.current?.focus();
          break;
        case 'open-held':
          onOpenHeldOrders();
          break;
        default:
          // negate / percent / tab have no meaning in a name or barcode field.
          break;
      }
    },
    [commitScan, onOpenHeldOrders]
  );

  useEffect(() => {
    registerDefault('Search / Barcode', handleDockKey);
  }, [registerDefault, handleDockKey]);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-canvas overflow-hidden p-3 sm:p-4">
      {/* Search & Barcode Bar */}
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 shrink-0">
        <div className="flex-1 relative min-w-0">
          <Input
            ref={searchInputRef}
            placeholder="Search or scan barcode..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            leftIcon={<Search className="w-4 h-4" />}
            aria-label="Search products or scan barcode"
            className="h-11 text-sm"
          />
        </div>

        <div className="hidden sm:flex items-center px-3 py-2.5 bg-surface border border-line rounded-lg text-xs text-fg-muted gap-1.5 shrink-0 select-none">
          <ScanBarcode className="w-4 h-4 text-brand-fg" />
          <span>Scanner Ready</span>
        </div>

        {/* Currency is declared once for the whole grid so each tile can carry a
            bare number instead of repeating Rs. twenty times over. */}
        <div
          className="hidden sm:flex items-center px-2.5 py-2.5 bg-surface-2 border border-line rounded-lg text-[10px] uppercase tracking-[0.12em] text-fg-subtle shrink-0 select-none"
          title={`All prices in ${CURRENCY_LABEL}`}
        >
          {CURRENCY_LABEL}
        </div>

        {/* Cart button replaces the scanner chip on narrow screens */}
        <button
          type="button"
          onClick={onOpenCart}
          aria-label="Open cart"
          className="sm:hidden flex items-center justify-center w-11 h-11 shrink-0 bg-surface border border-line rounded-lg text-fg-muted active:scale-95 transition"
        >
          <ShoppingCart className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 shrink-0 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
        {categories.map(cat => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              aria-pressed={isActive}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none shrink-0 ${
                isActive
                  ? 'bg-brand text-fg-on-brand'
                  : 'bg-surface hover:bg-surface-3 text-fg-muted hover:text-fg border border-line'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto overscroll-contain pb-safe-b">
        {filteredProducts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-fg-subtle py-12">
            <Tag className="w-12 h-12 stroke-1 mb-3 opacity-40" />
            <p className="text-sm font-medium">No products match your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-3">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="group flex flex-col justify-between text-left p-3 sm:p-3.5 bg-surface hover:bg-surface-3 border border-line hover:border-brand/60 rounded-lg transition-all duration-150 relative active:scale-[0.98] select-none min-h-[104px] sm:min-h-0"
              >
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <span className="text-[11px] font-medium text-fg-muted uppercase tracking-wider line-clamp-1">
                      {product.categoryName}
                    </span>
                    {product.stockQuantity <= 5 && (
                      <span className="text-[10px] text-warning-fg bg-warning-soft px-1.5 py-0.5 rounded font-bold shrink-0">
                        {product.stockQuantity} left
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-fg text-xs sm:text-sm leading-snug line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-fg-subtle mt-0.5 truncate">SKU: {product.sku}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-line flex items-center justify-between gap-2">
                  <span className="text-sm sm:text-base font-bold text-brand-fg tabular">
                    {formatAmount(product.price)}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-surface-3 group-hover:bg-brand group-hover:text-fg-on-brand text-fg-muted flex items-center justify-center transition shrink-0">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};