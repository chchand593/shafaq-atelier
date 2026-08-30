"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site/product-card";
import { SectionHeader } from "@/components/site/section-header";
import { PRODUCTS } from "@/lib/site-data";

export function DailyWear() {
  const products = PRODUCTS.filter((p) => p.category === "Daily Wear");

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
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-10 flex justify-center sm:justify-end">
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-full px-6 text-sm font-medium uppercase tracking-wider hover:border-[var(--gold)] hover:text-[var(--gold)]"
          >
            <a href="#daily-wear-all">
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
