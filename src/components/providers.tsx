"use client";

import * as React from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { useRehydrateStores, useWishlist } from "@/lib/store";

function WishlistSync() {
  const { data: session, status } = useSession();
  const setIds = useWishlist((s) => s.setIds);
  const localIds = useWishlist((s) => s.ids);
  const syncedRef = React.useRef(false);

  React.useEffect(() => {
    if (status !== "authenticated" || syncedRef.current) return;
    syncedRef.current = true;
    // Fetch server wishlist and merge with local
    fetch("/api/wishlist")
      .then((r) => r.json())
      .then((d: { products: { id: string }[] }) => {
        const serverIds = d.products.map((p) => p.id);
        const merged = Array.from(new Set([...localIds, ...serverIds]));
        setIds(merged);
      })
      .catch(() => {});
  }, [status]);

  // reset sync flag on sign out
  React.useEffect(() => {
    if (status === "unauthenticated") syncedRef.current = false;
  }, [status]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Rehydrate persisted Zustand stores on the client after mount to avoid
  // SSR/CSR hydration mismatches (skipHydration is enabled on each store).
  useRehydrateStores();

  return (
    <SessionProvider>
      <WishlistSync />
      {children}
    </SessionProvider>
  );
}
