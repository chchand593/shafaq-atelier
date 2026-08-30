"use client";

import { useRecentlyViewed } from "@/lib/store";
import { PRODUCTS } from "@/lib/site-data";
import { ProductCard } from "@/components/site/product-card";
import { SectionHeader } from "@/components/site/section-header";

export function RecentlyViewed() {
  const ids = useRecentlyViewed((s) => s.ids);

  const items = ids
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 4);

  if (items.length === 0) return null;

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
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default RecentlyViewed;
