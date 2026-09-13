"use client";

import * as React from "react";
import { ArrowRight, Gift, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site/product-card";
import { SectionHeader } from "@/components/site/section-header";
import { useApiProducts } from "@/lib/use-products";
import { useUI } from "@/lib/store";

function CardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <div className="aspect-[4/5] w-full skeleton-shimmer" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-3 w-20 skeleton-shimmer rounded" />
        <div className="h-4 w-3/4 skeleton-shimmer rounded" />
        <div className="h-3 w-1/2 skeleton-shimmer rounded" />
        <div className="mt-2 h-5 w-24 skeleton-shimmer rounded" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-2 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center lg:col-span-4">
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-[var(--gold)]">
        <Award className="size-5" />
      </span>
      <p className="font-serif text-lg">Coming soon</p>
      <p className="text-sm text-muted-foreground">
        Our best sellers are being restocked. Check back shortly.
      </p>
    </div>
  );
}

export function BestSellers() {
  const { products, loading } = useApiProducts();
  const list = React.useMemo(
    () => products.filter((p) => p.isBestSeller === true),
    [products]
  );
  const { setGiftCardOpen } = useUI();

  return (
    <section id="best-sellers" className="bg-background py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          align="left"
          eyebrow="Loved By Thousands"
          title="Best Sellers"
          description="The abayas our community keeps coming back for. Tried, tested and treasured by thousands of women across Pakistan."
        />

        <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {loading && list.length === 0
            ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            : list.length === 0
              ? <EmptyState />
              : list.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}

          {/* Editorial promo tile — Gift Card */}
          <div className="col-span-2 flex flex-col justify-between overflow-hidden rounded-xl border bg-gradient-to-br from-secondary to-secondary/60 p-6 sm:p-8 lg:col-span-2">
            <div>
              <span className="eyebrow text-[var(--gold)]">Gift Cards</span>
              <h3 className="mt-3 font-serif text-2xl font-medium leading-tight text-foreground sm:text-3xl">
                The Perfect Gift, Always the Right Size
              </h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Digital gift cards delivered instantly. Let her choose the
                abaya that speaks to her — from PKR 5,000 to PKR 50,000.
              </p>
            </div>
            <Button
              onClick={() => setGiftCardOpen(true)}
              className="mt-6 h-11 w-fit rounded-full px-6 text-sm font-medium uppercase tracking-wider"
            >
              <Gift className="size-4" />
              Purchase Gift Card
              <ArrowRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BestSellers;
