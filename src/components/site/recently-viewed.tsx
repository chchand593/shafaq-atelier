"use client";

import { useRecentlyViewed } from "@/lib/store";
import { useProductsByIds } from "@/lib/use-products";
import { ProductCard } from "@/components/site/product-card";
import { SectionHeader } from "@/components/site/section-header";

function CardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <div className="aspect-[4/5] w-full skeleton-shimmer" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-3 w-20 skeleton-shimmer rounded" />
        <div className="h-4 w-3/4 skeleton-shimmer rounded" />
        <div className="h-5 w-24 skeleton-shimmer rounded" />
      </div>
    </div>
  );
}

export function RecentlyViewed() {
  const ids = useRecentlyViewed((s) => s.ids);
  // Slice in store-order before lookup so the hook only resolves the top 4.
  const topIds = ids.slice(0, 4);
  const { products, loading } = useProductsByIds(topIds);

  // Maintain the order of `topIds` since useProductsByIds preserves insertion
  // order of ids but skips unmatched ones (deleted products drop out cleanly).
  const orderedProducts = topIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 4);

  if (orderedProducts.length === 0 && !loading) return null;

  return (
    <section
      id="recently-viewed"
      className="bg-background py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          align="left"
          eyebrow="Pick Up Where You Left Off"
          title="Recently Viewed"
          description="The abayas you have been admiring — saved here for when you are ready."
        />
        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {loading && orderedProducts.length === 0
            ? Array.from({ length: Math.max(1, topIds.length) }).map((_, i) => (
                <CardSkeleton key={i} />
              ))
            : orderedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>
      </div>
    </section>
  );
}

export default RecentlyViewed;
