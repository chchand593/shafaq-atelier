"use client";

import { ArrowRight, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site/product-card";
import { SectionHeader } from "@/components/site/section-header";
import { PRODUCTS } from "@/lib/site-data";
import { useUI } from "@/lib/store";

export function BestSellers() {
  const products = PRODUCTS.filter((p) => p.category === "Best Sellers");
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
          {products.map((product) => (
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
