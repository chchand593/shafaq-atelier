"use client";

// Client-side data layer for catalog products.
//
// The customer storefront must NEVER read from the hardcoded PRODUCTS array
// in `site-data.ts` for listing or lookup — that array is only kept as a
// seed/fallback reference and as a TypeScript shape. All customer-facing
// product listings MUST come from the database via /api/products so that
// admin add/delete/deactivate changes are reflected on the storefront.
//
// This hook fetches ALL active products once, caches the result in a module-
// level singleton, and shares it between every consumer. Admin mutations
// (create/update/delete) call `invalidateProductsCache()` from the API
// response handlers so the next mount re-fetches fresh data.

import * as React from "react";
import type { Product } from "@/lib/site-data";

type State = {
  products: Product[];
  loading: boolean;
  error: string | null;
};

// Module-level cache. Survives across components and route transitions within
// the same client session. Reset by `invalidateProductsCache()`.
//
// INVARIANT: cachedProducts is only set to a NON-EMPTY array on success. If
// the fetch fails or returns an empty list, the cache stays null so the next
// mount re-fetches. This prevents the "works on first load, blank on refresh"
// bug where an empty array (truthy in JS) would poison the cache and stop
// the hook from ever re-requesting products.
let cachedProducts: Product[] | null = null;
let inflight: Promise<Product[]> | null = null;

async function fetchProducts(): Promise<Product[]> {
  if (cachedProducts && cachedProducts.length > 0) return cachedProducts;
  if (inflight) return inflight;
  inflight = fetch("/api/products")
    .then(async (r) => {
      if (!r.ok) return [];
      const data = (await r.json()) as { products?: Product[] };
      const products = data.products ?? [];
      // Only cache non-empty successful responses. An empty/failed response
      // leaves cachedProducts as null so the next mount re-fetches.
      if (products.length > 0) {
        cachedProducts = products;
      }
      return products;
    })
    .catch(() => {
      // Network/parse error — do NOT cache. Leave cachedProducts as null so
      // the next mount re-fetches instead of showing an empty list forever.
      return [];
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/**
 * Fetch all active products from /api/products. Cached at module level so
 * multiple components on the same page share one network request.
 */
export function useApiProducts(): State {
  const [state, setState] = React.useState<State>({
    // Initial state: use cache if it has products, otherwise mark as loading.
    // An empty cachedProducts (from a previous failed fetch) is treated as
    // "not cached" so we re-fetch on the next mount.
    products: cachedProducts && cachedProducts.length > 0 ? cachedProducts : [],
    loading: !(cachedProducts && cachedProducts.length > 0),
    error: null,
  });

  React.useEffect(() => {
    // If we already have a non-empty cache, use it and stop loading.
    if (cachedProducts && cachedProducts.length > 0) {
      setState({ products: cachedProducts, loading: false, error: null });
      return;
    }
    let mounted = true;
    fetchProducts()
      .then((products) => {
        if (mounted) {
          setState({ products, loading: false, error: null });
        }
      })
      .catch((e) => {
        if (mounted)
          setState({ products: [], loading: false, error: String(e) });
      });
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}

/**
 * Look up multiple products by slug. Used by wishlist, compare and recently
 * viewed drawers — they store product ids (slugs) in client state and need to
 * render full product data. Falls back to an empty list while loading.
 */
export function useProductsByIds(ids: string[]): {
  products: Product[];
  loading: boolean;
} {
  const { products, loading } = useApiProducts();
  const map = React.useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );
  const matched = React.useMemo(
    () =>
      ids
        .map((id) => map.get(id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p)),
    [ids, map]
  );
  return { products: matched, loading };
}

/**
 * Invalidate the module-level product cache. The next component mount will
 * re-fetch fresh data from /api/products. Called by admin product CRUD
 * response handlers so the storefront reflects changes immediately.
 */
export function invalidateProductsCache() {
  cachedProducts = null;
}
