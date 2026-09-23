"use client";

import * as React from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Product } from "@/lib/site-data";

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export type CartLineInput = {
  productId: string;
  name: string;
  price: number;
  image: string;
  color: string;
  colorName: string;
  size: string;
  qty: number;
};

export type CartLine = CartLineInput & {
  // composite key for uniqueness
  key: string;
};

type CartState = {
  lines: CartLine[];
  add: (line: CartLineInput) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
};

function lineKey(l: { productId: string; color: string; size: string }) {
  return `${l.productId}__${l.color}__${l.size}`;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line) =>
        set((state) => {
          const key = lineKey(line);
          const existing = state.lines.find((l) => l.key === key);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.key === key ? { ...l, qty: l.qty + line.qty } : l
              ),
            };
          }
          return { lines: [...state.lines, { ...line, key }] };
        }),
      remove: (key) =>
        set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),
      setQty: (key, qty) =>
        set((state) => ({
          lines: state.lines
            .map((l) => (l.key === key ? { ...l, qty: Math.max(1, qty) } : l))
            .filter((l) => l.qty > 0),
        })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: "shafaq-cart",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);

// Rehydrate persisted stores on the client after mount to avoid SSR/CSR
// hydration mismatches.
export function useRehydrateStores() {
  React.useEffect(() => {
    void useCart.persist.rehydrate();
    void useWishlist.persist.rehydrate();
    void usePromo.persist.rehydrate();
    void useRecentlyViewed.persist.rehydrate();
    void useCompare.persist.rehydrate();
  }, []);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.qty, 0);
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.qty * l.price, 0);
}

// Free shipping threshold for the progress bar.
export const FREE_SHIPPING_THRESHOLD = 10000;

// ---------------------------------------------------------------------------
// Promo codes
// ---------------------------------------------------------------------------

export type PromoCode = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  label: string;
};

// Valid demo promo codes (client-side for the foundation phase).
export const PROMO_CODES: PromoCode[] = [
  { code: "WELCOME10", type: "percent", value: 10, label: "10% off welcome" },
  { code: "ATELIER500", type: "fixed", value: 500, label: "PKR 500 off" },
  { code: "EID15", type: "percent", value: 15, label: "Eid 15% off" },
];

type PromoState = {
  applied: PromoCode | null;
  apply: (code: string) => PromoCode | null;
  remove: () => void;
};

export const usePromo = create<PromoState>()(
  persist(
    (set) => ({
      applied: null,
      apply: (code) => {
        const found = PROMO_CODES.find(
          (p) => p.code.toLowerCase() === code.trim().toLowerCase()
        );
        if (found) {
          set({ applied: found });
          return found;
        }
        return null;
      },
      remove: () => set({ applied: null }),
    }),
    {
      name: "shafaq-promo",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);

export function promoDiscount(subtotal: number, promo: PromoCode | null): number {
  if (!promo) return 0;
  if (promo.type === "percent") return Math.round((subtotal * promo.value) / 100);
  return Math.min(promo.value, subtotal);
}

export function shippingCost(subtotal: number, itemCount: number): number {
  if (itemCount === 0) return 0;
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return 350; // flat PKR 350 below threshold
}

// ---------------------------------------------------------------------------
// Wishlist (just product ids)
// ---------------------------------------------------------------------------

type WishlistState = {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
  setIds: (ids: string[]) => void;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        set((state) => ({
          ids: state.ids.includes(id)
            ? state.ids.filter((x) => x !== id)
            : [...state.ids, id],
        }));
        // best-effort sync to server (ignored if not authenticated)
        void fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: id }),
        }).catch(() => {});
      },
      has: (id) => get().ids.includes(id),
      clear: () => set({ ids: [] }),
      setIds: (ids) => set({ ids }),
    }),
    {
      name: "shafaq-wishlist",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);

// ---------------------------------------------------------------------------
// Recently viewed
// ---------------------------------------------------------------------------

type RecentlyViewedState = {
  ids: string[];
  push: (id: string) => void;
  clear: () => void;
};

export const useRecentlyViewed = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      ids: [],
      push: (id) =>
        set((state) => ({
          ids: [id, ...state.ids.filter((x) => x !== id)].slice(0, 8),
        })),
      clear: () => set({ ids: [] }),
    }),
    {
      name: "shafaq-recently-viewed",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);

// ---------------------------------------------------------------------------
// Product comparison
// ---------------------------------------------------------------------------

type CompareState = {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
  remove: (id: string) => void;
};

export const MAX_COMPARE = 3;

export const useCompare = create<CompareState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set((state) => {
          if (state.ids.includes(id)) {
            return { ids: state.ids.filter((x) => x !== id) };
          }
          if (state.ids.length >= MAX_COMPARE) return state;
          return { ids: [...state.ids, id] };
        }),
      has: (id) => get().ids.includes(id),
      clear: () => set({ ids: [] }),
      remove: (id) =>
        set((state) => ({ ids: state.ids.filter((x) => x !== id) })),
    }),
    {
      name: "shafaq-compare",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);

// ---------------------------------------------------------------------------
// UI state (not persisted) — drawers / overlays
// ---------------------------------------------------------------------------

export type CheckoutStep = "information" | "shipping" | "payment" | "review" | "done";

type UIState = {
  cartOpen: boolean;
  wishlistOpen: boolean;
  searchOpen: boolean;
  quickView: Product | null;
  checkoutOpen: boolean;
  checkoutStep: CheckoutStep;
  lastOrder: string | null; // order id after confirmation
  authOpen: boolean;
  giftCardOpen: boolean;
  setCartOpen: (open: boolean) => void;
  setWishlistOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;
  setCheckoutOpen: (open: boolean) => void;
  setCheckoutStep: (step: CheckoutStep) => void;
  setLastOrder: (id: string | null) => void;
  setAuthOpen: (open: boolean) => void;
  setGiftCardOpen: (open: boolean) => void;
};

export const useUI = create<UIState>((set) => ({
  cartOpen: false,
  wishlistOpen: false,
  searchOpen: false,
  quickView: null,
  checkoutOpen: false,
  checkoutStep: "information",
  lastOrder: null,
  authOpen: false,
  giftCardOpen: false,
  setCartOpen: (cartOpen) => set({ cartOpen }),
  setWishlistOpen: (wishlistOpen) => set({ wishlistOpen }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  openQuickView: (product) => set({ quickView: product }),
  closeQuickView: () => set({ quickView: null }),
  setCheckoutOpen: (checkoutOpen) => set({ checkoutOpen }),
  setCheckoutStep: (checkoutStep) => set({ checkoutStep }),
  setLastOrder: (lastOrder) => set({ lastOrder }),
  setAuthOpen: (authOpen) => set({ authOpen }),
  setGiftCardOpen: (giftCardOpen) => set({ giftCardOpen }),
}));
