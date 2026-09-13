"use client";

import * as React from "react";
import { ArrowRight, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site/product-card";
import { SectionHeader } from "@/components/site/section-header";
import { useApiProducts } from "@/lib/use-products";

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
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-[var(--mocha)]">
        <Shirt className="size-5" />
      </span>
      <p className="font-serif text-lg">No products available</p>
      <p className="text-sm text-muted-foreground">
        Our collection is being updated. Please check back soon.
      </p>
    </div>
  );
}

export function DailyWear() {
  const { products, loading } = useApiProducts();
  const list = React.useMemo(
    () => products.filter((p) => p.isFeatured === true || p.category === "Daily Wear"),
    [products]
  );

  return (
    <section id="daily-wear" className="bg-background py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          align="left"
          eyebrow="For Everyday Grace"
          title="Daily Wear Abayas"
          description="Effortless, breathable and beautifully cut for the rhythm of your day. Everyday essentials designed to move with you, from morning to evening."
        />

        <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {loading && list.length === 0
            ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            : list.length === 0
              ? <EmptyState />
              : list.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
        </div>

        <div className="mt-10 flex justify-center sm:justify-end">
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-full px-6 text-sm font-medium uppercase tracking-wider hover:border-[var(--gold)] hover:text-[var(--gold)]"
          >
            <a href="/daily-wear">
              View All Daily Wear
              <ArrowRight className="ml-1 size-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default DailyWear;
