"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { ProductCard } from "@/components/site/product-card";
import type { Product } from "@/lib/site-data";
import { useRecentlyViewed } from "@/lib/store";

export function Recommendations({
  currentSlug,
  fallbackProducts,
}: {
  currentSlug: string;
  fallbackProducts: Product[];
}) {
  const [products, setProducts] = React.useState<Product[]>(fallbackProducts);
  const [loading, setLoading] = React.useState(true);
  const viewedIds = useRecentlyViewed((s) => s.ids);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const viewed = viewedIds.filter((id) => id !== currentSlug).join(",");
        const res = await fetch(
          `/api/recommendations/${currentSlug}${viewed ? `?viewed=${viewed}` : ""}`
        );
        if (!res.ok) return;
        const data = (await res.json()) as { products: Product[] };
        if (!cancelled && data.products.length > 0) {
          setProducts(data.products);
        }
      } catch {
        // keep fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [currentSlug]);

  if (products.length === 0) return null;

  return (
    <section className="mt-16 sm:mt-20 lg:mt-24">
      <div className="flex items-center gap-3">
        <Sparkles className="size-5 text-[var(--gold)]" />
        <div>
          <span className="eyebrow text-[var(--mocha)]">Curated For You</span>
          <h2 className="font-serif text-2xl font-medium sm:text-3xl">
            You May Also Love
          </h2>
        </div>
      </div>
      <div className="gold-rule mt-3 max-w-[3.5rem]" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col overflow-hidden rounded-xl border bg-card"
              >
                <div className="aspect-[4/5] w-full skeleton-shimmer" />
                <div className="flex flex-col gap-2 p-4">
                  <div className="h-3 w-20 skeleton-shimmer rounded" />
                  <div className="h-4 w-3/4 skeleton-shimmer rounded" />
                  <div className="h-5 w-24 skeleton-shimmer rounded" />
                </div>
              </div>
            ))
          : products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

export default Recommendations;
