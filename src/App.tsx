import React, { useState, useEffect, useMemo } from "react";
import { Product, Order } from "@pos/shared";
import { SyncEngine } from "@pos/offline-sync";
import { Modal, Button, Input, Drawer, useIsDesktop, cn } from "@pos/ui";
import { PosHeader } from "./components/PosHeader";
import { ProductCatalog } from "./components/ProductCatalog";
import { CartSidebar } from "./components/CartSidebar";
import { KeyboardDock } from "./components/KeyboardDock";
import { PaymentModal } from "./components/PaymentModal";
import { ReceiptModal } from "./components/ReceiptModal";
import { getPlatformInfo } from "./lib/platform";
import { CART_WIDTH_CLASS } from "./lib/layout";
import { useCartStore } from "./stores/cartStore";
import { useKeyboardDock } from "./stores/keyboardDockStore";
import { INITIAL_PRODUCTS } from "./data/mockProducts";
import { PlayCircle } from "lucide-react";

export const App: React.FC = () => {
  const platform = useMemo(() => getPlatformInfo(), []);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [products] = useState<Product[]>(INITIAL_PRODUCTS);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const isDesktop = useIsDesktop();

  // Modals state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(
    null,
  );
  const [tempCustomerName, setTempCustomerName] = useState("");

  // Cart store
  const {
    addItem,
    clearCart,
    items,
    heldOrders,
    recallOrder,
    customerName,
    setCustomer,
    getTotals,
  } = useCartStore();

  const totals = getTotals();
  const dockHeight = useKeyboardDock((s) => s.height);

  const syncEngine = useMemo(() => {
    return new SyncEngine({
      syncApiEndpoint: "http://localhost:5000",
      preferNativeSqlite: platform.isTauri,
      events: {
        onNetworkChange: (status) => setIsOnline(status === "ONLINE"),
        onSyncCompleted: (count) => {
          setPendingSyncCount((prev) => Math.max(0, prev - count));
        },
      },
    });
  }, [platform.isTauri]);

  useEffect(() => {
    syncEngine
      .init()
      .catch((err) => console.error("SyncEngine initialization failed:", err));
  }, [syncEngine]);

  useEffect(() => {
    if (isDesktop) setIsCartOpen(false);
  }, [isDesktop]);

  const handleTriggerSync = async () => {
    const count = await syncEngine.triggerSync();
    if (count > 0) {
      alert(`Successfully synced ${count} pending orders to cloud.`);
    }
  };

  const handlePaymentComplete = async (order: Order) => {
    setIsPaymentOpen(false);
    setIsCartOpen(false);
    setLastCompletedOrder(order);
    setIsReceiptOpen(true);

    const result = await syncEngine.recordOrder(order);
    if (!result.synced) {
      setPendingSyncCount((prev) => prev + 1);
    }
  };

  const handleNewSale = () => {
    clearCart();
    setIsReceiptOpen(false);
    setLastCompletedOrder(null);
  };

  const handleSaveCustomer = () => {
    setCustomer(undefined, tempCustomerName.trim() || undefined);
    setIsCustomerModalOpen(false);
  };

  const cart = (
    <CartSidebar
      onOpenPayment={() => {
        setIsPaymentOpen(true);
        setIsCartOpen(false);
      }}
      onSelectCustomer={() => {
        setTempCustomerName(customerName || "");
        setIsCustomerModalOpen(true);
      }}
      onClose={() => setIsCartOpen(false)}
    />
  );

  return (
    <div className="flex flex-col h-full w-full bg-canvas text-fg overflow-hidden">
      {/* Top POS Header */}
      <PosHeader
        platform={platform}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        onTriggerSync={handleTriggerSync}
        onOpenHeldOrders={() => setIsHeldModalOpen(true)}
        onToggleCart={() => setIsCartOpen((open) => !open)}
        cartItemCount={items.length}
        cartTotal={totals.grandTotal}
      />

      {/* Main Terminal View: Product Catalog (Left) + Cart (Right) */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div
          className="flex-1 flex flex-col min-w-0 min-h-0"
          style={{ paddingBottom: dockHeight || undefined }}
        >
          <ProductCatalog
            products={products}
            onSelectProduct={addItem}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenHeldOrders={() => setIsHeldModalOpen(true)}
          />
        </div>

        {/* Cart docked at lg+ */}
        <aside
          className={cn(
            "hidden lg:block border-l border-line shrink-0 h-full shadow-panel",
            CART_WIDTH_CLASS,
          )}
        >
          {cart}
        </aside>
      </div>

      {/* Cart drawer below lg */}
      {isCartOpen && !isDesktop && (
        <Drawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          side="right"
          widthClassName="w-[380px] sm:w-[420px] max-w-[92vw]"
          ariaLabel="Current cart"
        >
          {cart}
        </Drawer>
      )}

      {/* Swipe-up on-screen keyboard dock */}
      <KeyboardDock />

      {/* Payment Tender Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        grandTotal={totals.grandTotal}
        items={items}
        customerName={customerName}
        onPaymentComplete={handlePaymentComplete}
      />

      {/* Receipt & Thermal Print Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        order={lastCompletedOrder}
        onClose={() => setIsReceiptOpen(false)}
        onNewSale={handleNewSale}
      />

      {/* Held Orders / Parked Tickets Modal */}
      <Modal
        isOpen={isHeldModalOpen}
        onClose={() => setIsHeldModalOpen(false)}
        title="Held Tickets"
        maxWidth="md"
      >
        <div className="space-y-3">
          {heldOrders.length === 0 ? (
            <p className="text-sm text-fg-subtle text-center py-6">
              No held orders found
            </p>
          ) : (
            heldOrders.map((held) => (
              <div
                key={held.id}
                className="flex items-center justify-between gap-3 p-3.5 bg-surface-2 border border-line rounded-xl"
              >
                <div className="min-w-0">
                  <h4 className="font-semibold text-fg text-sm truncate">
                    {held.name}
                  </h4>
                  <p className="text-xs text-fg-muted mt-0.5">
                    {held.items.length} items • Held at {held.timestamp}
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    recallOrder(held.id);
                    setIsHeldModalOpen(false);
                  }}
                  className="gap-1.5 shrink-0"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Recall</span>
                </Button>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Customer Info Modal */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Assign Customer"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div>
            <label
              className="text-xs text-fg-muted block mb-1.5"
              htmlFor="customer-name"
            >
              Customer Name / Phone
            </label>
            <Input
              id="customer-name"
              placeholder="e.g. Alice Smith (+1 555-0192)"
              value={tempCustomerName}
              onChange={(e) => setTempCustomerName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setIsCustomerModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveCustomer}>
              Apply to Ticket
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
