# OmniPOS — POS Terminal

Universal, high-performance Point-of-Sale client. One codebase ships both a **Web POS Terminal** (any browser, iPad, Android/iOS tablet) and a **Desktop POS** (Tauri 2 native app with offline SQLite, ESC/POS thermal printing and barcode scanning).

## Structure

```
pos-app/
├── src/                         # React 18 + Vite + Tailwind + Zustand + TanStack Query
│   ├── components/              # PosHeader, ProductCatalog, CartSidebar, PaymentModal, ReceiptModal
│   ├── stores/                  # Cart, held tickets, shift/session management
│   └── lib/platform.ts          # Hardware & runtime bridge (detects Tauri vs Web)
├── src-tauri/                   # Tauri 2 desktop layer (Rust, SQLite, ESC/POS)
├── packages/
│   ├── shared/                  # Domain types, Zod schemas, cart/tax calculators
│   ├── ui/                      # Shared component library (Tailwind preset)
│   └── offline-sync/            # IndexedDB (web) + SQLite (desktop) sync engine
├── postcss.config.js
├── tailwind.config.js
└── vite.config.ts
```

The `packages/*` folders are local npm workspaces (`@pos/*`), consumed directly as TypeScript source — no separate build step needed.

## Getting Started

```bash
npm install

# Web POS (http://localhost:1420)
npm run dev

# Desktop POS (requires Rust + Cargo)
npm run dev:desktop
```

## Build

```bash
# Web distribution -> dist/
npm run build

# Desktop executable (.exe on Windows / .dmg / .deb)
npm run build:desktop
```

## Typecheck

```bash
npm run typecheck        # app + all @pos/* packages
```

## Requirements

- Node.js >= 20, npm >= 10
- Rust + Cargo (desktop build only)
