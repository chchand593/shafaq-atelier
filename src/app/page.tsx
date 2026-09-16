import { Header } from "@/components/site/header";
import { Hero } from "@/components/site/hero";
import { DailyWear } from "@/components/site/daily-wear";
import { CustomizedAbaya } from "@/components/site/customized-abaya";
import { NewArrivals } from "@/components/site/new-arrivals";
import { BestSellers } from "@/components/site/best-sellers";
import { Collection } from "@/components/site/collection";
import { WhyChooseUs } from "@/components/site/why-choose-us";
import { CustomerReviews } from "@/components/site/customer-reviews";
import { Lookbook } from "@/components/site/lookbook";
import { RecentlyViewed } from "@/components/site/recently-viewed";
import { Newsletter } from "@/components/site/newsletter";
import { Footer } from "@/components/site/footer";
import { CartDrawer } from "@/components/site/cart-drawer";
import { WishlistDrawer } from "@/components/site/wishlist-drawer";
import { Checkout } from "@/components/site/checkout";
import { QuickView } from "@/components/site/quick-view";
import { SearchOverlay } from "@/components/site/search-overlay";
import { AuthModal } from "@/components/site/auth-modal";
import { CompareBar } from "@/components/site/compare-bar";
import { GiftCardModal } from "@/components/site/gift-card-modal";
import { AdminErrorListener } from "@/components/site/admin-error-listener";
import { Suspense } from "react";

// Force dynamic rendering so the page is always fresh — not cached at build
// time with empty data. The homepage uses client-side components that fetch
// from /api/products, but Next.js may still pre-render the shell statically.
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Hero />
        <DailyWear />
        <CustomizedAbaya />
        <NewArrivals />
        <BestSellers />
        <Collection />
        <WhyChooseUs />
        <CustomerReviews />
        <Lookbook />
        <RecentlyViewed />
        <Newsletter />
      </main>
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

      {/* Listens for ?admin_error=auth|denied query param emitted by the
          middleware when an unauthenticated or non-admin user tries to visit
          /admin. Shows a toast + auto-opens the auth modal so the user can
          sign in. Wrapped in Suspense because useSearchParams requires it. */}
      <Suspense fallback={null}>
        <AdminErrorListener />
      </Suspense>
    </div>
  );
}
