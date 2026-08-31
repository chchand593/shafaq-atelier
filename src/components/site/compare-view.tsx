"use client";

import * as React from "react";
import Link from "next/link";
import { X, GitCompare, Star, Check, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/format";
import { useCompare, MAX_COMPARE, useUI } from "@/lib/store";
import { useProductsByIds } from "@/lib/use-products";
import type { Product } from "@/lib/site-data";

type Row = {
  label: string;
  key: (p: Product) => React.ReactNode;
  highlight?: (p: Product) => boolean;
};

const ROWS: Row[] = [
  {
    label: "Price",
    key: (p) => (
      <span className="font-serif text-lg font-semibold">
        {formatPKR(p.price)}
      </span>
    ),
  },
  {
    label: "Original Price",
    key: (p) =>
      p.originalPrice ? (
        <span className="text-sm text-muted-foreground line-through">
          {formatPKR(p.originalPrice)}
        </span>
      ) : (
        <span className="text-muted-foreground/40">—</span>
      ),
  },
  {
    label: "Rating",
    key: (p) => (
      <span className="inline-flex items-center gap-1">
        <Star className="size-4 fill-[var(--gold)] text-[var(--gold)]" />
        {p.rating.toFixed(1)} ({p.reviews})
      </span>
    ),
    highlight: (p) => p.rating >= 4.9,
  },
  {
    label: "Colours",
    key: (p) => (
      <div className="flex justify-center gap-1.5">
        {p.colorOptions.map((c) => (
          <span
            key={c.hex}
            title={c.name}
            style={{ backgroundColor: c.hex }}
            className="size-4 rounded-full ring-1 ring-inset ring-black/10"
          />
        ))}
      </div>
    ),
  },
  {
    label: "Sizes",
    key: (p) => (
      <span className="text-sm text-muted-foreground">
        {p.sizes.join(", ")}
      </span>
    ),
  },
  {
    label: "Fabric",
    key: (p) => <span className="text-sm">{p.fabric}</span>,
  },
  {
    label: "Care",
    key: (p) => <span className="text-xs text-muted-foreground">{p.care}</span>,
  },
  {
    label: "Badge",
    key: (p) =>
      p.badge ? (
        <Badge className="bg-primary text-primary-foreground">{p.badge}</Badge>
      ) : (
        <span className="text-muted-foreground/40">—</span>
      ),
  },
];

export function CompareView() {
  const { ids, remove, clear } = useCompare();
  const { openQuickView, setCartOpen } = useUI();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const { products: items, loading } = useProductsByIds(ids);

  if (!mounted || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="skeleton-shimmer size-8 rounded-full" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-[var(--mocha)]">
          <GitCompare className="size-8" />
        </span>
        <div>
          <h1 className="font-serif text-2xl font-medium">Nothing to compare yet</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add up to {MAX_COMPARE} abayas to compare their features side by side.
          </p>
        </div>
        <Button asChild className="rounded-full px-8">
          <Link href="/">Browse Abayas</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow text-[var(--gold)]">Side by Side</p>
          <h1 className="font-serif text-2xl font-medium sm:text-3xl">
            Compare Abayas
          </h1>
        </div>
        <Button
          variant="outline"
          onClick={clear}
          className="rounded-full"
        >
          <X className="size-4" /> Clear All
        </Button>
      </div>

      {/* Comparison grid */}
      <div className="mt-8 overflow-x-auto elegant-scroll">
        <div
          className="grid gap-px overflow-hidden rounded-xl border bg-border"
          style={{
            gridTemplateColumns: `140px repeat(${items.length}, minmax(200px, 1fr))`,
          }}
        >
          {/* Header row: images + names */}
          <div className="bg-background p-3" />
          {items.map((p) => (
            <div key={p.id} className="bg-background p-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  className="absolute right-0 top-0 z-10 inline-flex size-7 items-center justify-center rounded-full bg-background/85 text-muted-foreground shadow-sm backdrop-blur hover:text-destructive"
                  aria-label={`Remove ${p.name}`}
                >
                  <X className="size-3.5" />
                </button>
                <Link href={`/product/${p.id}`}>
                  <div className="zoom-wrap relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-secondary">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="zoom-img h-full w-full object-cover"
                    />
                  </div>
                </Link>
              </div>
              <Link
                href={`/product/${p.id}`}
                className="mt-2 block font-serif text-sm font-medium leading-tight hover:text-[var(--gold)]"
              >
                {p.name}
              </Link>
              <p className="text-xs text-muted-foreground">{p.category}</p>
            </div>
          ))}

          {/* Fill empty slots */}
          {Array.from({ length: MAX_COMPARE - items.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center justify-center bg-background/50 p-3"
            >
              <div className="flex aspect-[4/5] w-full flex-col items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                <GitCompare className="size-6" />
                <p className="mt-1 text-xs">Add a product</p>
              </div>
            </div>
          ))}

          {/* Data rows */}
          {ROWS.map((row) => (
            <React.Fragment key={row.label}>
              <div className="flex items-center bg-secondary/60 px-3 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {row.label}
              </div>
              {items.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    "flex items-center justify-center px-3 py-3 text-center",
                    row.highlight?.(p) && "bg-[var(--gold)]/5"
                  )}
                >
                  {row.key(p)}
                </div>
              ))}
              {Array.from({ length: MAX_COMPARE - items.length }).map((_, i) => (
                <div
                  key={`empty-${row.label}-${i}`}
                  className="bg-background/50"
                />
              ))}
            </React.Fragment>
          ))}

          {/* Action row */}
          <div className="flex items-center bg-secondary/60 px-3 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Action
          </div>
          {items.map((p) => (
            <div
              key={p.id}
              className="flex flex-col items-center gap-2 bg-background px-3 py-3"
            >
              <Button
                size="sm"
                onClick={() => openQuickView(p)}
                className="w-full rounded-full"
              >
                <ShoppingBag className="size-3.5" /> Quick View
              </Button>
              <Button
                size="sm"
                variant="outline"
                asChild
                className="w-full rounded-full"
              >
                <Link href={`/product/${p.id}`}>
                  View Details <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          ))}
          {Array.from({ length: MAX_COMPARE - items.length }).map((_, i) => (
            <div key={`empty-action-${i}`} className="bg-background/50" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default CompareView;
