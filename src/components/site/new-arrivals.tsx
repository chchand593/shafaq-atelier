"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site/product-card";
import { SectionHeader } from "@/components/site/section-header";
import { PRODUCTS } from "@/lib/site-data";

export function NewArrivals() {
  const products = PRODUCTS.filter((p) => p.category === "New Arrivals");

  return (
    <section id="new-arrivals" className="bg-secondary/60 py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Just Unveiled"
          title="New Arrivals"
          description="Fresh silhouettes and detailing from our latest atelier collection. Discover what's new — before everyone else."
        />

        <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}

          {/* Editorial promo tile to round out the grid on desktop */}
          <div className="col-span-2 flex flex-col justify-between overflow-hidden rounded-xl border bg-primary p-6 text-primary-foreground sm:p-8 lg:col-span-2">
            <div>
              <span className="eyebrow text-[var(--gold-soft)]">Limited Edition</span>
              <h3 className="mt-3 font-serif text-2xl font-medium leading-tight sm:text-3xl">
                The Ramadan Edit
              </h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-primary-foreground/80">
                A curated capsule of luminous abayas for the holy month. Crafted
                in limited numbers — designed to be treasured.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="mt-6 h-11 w-fit rounded-full border-primary-foreground/40 bg-transparent px-6 text-sm font-medium uppercase tracking-wider text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            >
              <a href="#ramadan-edit">
                Explore the Edit
                <ArrowRight className="ml-1 size-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default NewArrivals;
