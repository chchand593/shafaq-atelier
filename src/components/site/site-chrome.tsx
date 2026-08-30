"use client";

import * as React from "react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { CartDrawer } from "@/components/site/cart-drawer";
import { WishlistDrawer } from "@/components/site/wishlist-drawer";
import { Checkout } from "@/components/site/checkout";
import { QuickView } from "@/components/site/quick-view";
import { SearchOverlay } from "@/components/site/search-overlay";
import { AuthModal } from "@/components/site/auth-modal";
import { CompareBar } from "@/components/site/compare-bar";
import { GiftCardModal } from "@/components/site/gift-card-modal";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />

      {/* Global overlays (client state) */}
      <CartDrawer />
      <WishlistDrawer />
      <Checkout />
      <QuickView />
      <SearchOverlay />
      <AuthModal />
      <CompareBar />
      <GiftCardModal />
    </div>
  );
}

export default SiteChrome;
