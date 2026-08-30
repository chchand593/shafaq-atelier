"use client";

import * as React from "react";
import { SlidersHorizontal, X, Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/site/section-header";
import { ProductCard } from "@/components/site/product-card";
import {
  PRODUCTS,
  ALL_SIZES,
  type Product,
} from "@/lib/site-data";
import { formatPKR } from "@/lib/format";
import { useUI, useWishlist } from "@/lib/store";

type Category = "All" | Product["category"];
const CATEGORIES: Category[] = ["All", "Daily Wear", "New Arrivals", "Best Sellers"];

type SortKey = "featured" | "price-asc" | "price-desc" | "rating" | "newest";
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

// Build the unique colour filter list from all products.
const ALL_COLORS = Array.from(
  new Map(
    PRODUCTS.flatMap((p) => p.colorOptions).map((c) => [c.hex, c])
  ).values()
);

function ProductSkeleton() {
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

export function Collection() {
  const [category, setCategory] = React.useState<Category>("All");
  const [sort, setSort] = React.useState<SortKey>("featured");
  const [activeColors, setActiveColors] = React.useState<string[]>([]);
  const [onSaleOnly, setOnSaleOnly] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [filtersOpenMobile, setFiltersOpenMobile] = React.useState(false);

  // simulate a brief loading state when filters change (premium feel)
  const applyFilters = React.useCallback(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 280);
    return () => clearTimeout(t);
  }, []);

  const onCategory = (c: Category) => {
    setCategory(c);
    applyFilters();
  };
  const onSort = (s: SortKey) => {
    setSort(s);
    applyFilters();
  };
  const onToggleColor = (hex: string) => {
    setActiveColors((prev) =>
      prev.includes(hex) ? prev.filter((c) => c !== hex) : [...prev, hex]
    );
    applyFilters();
  };
  const onToggleSale = () => {
    setOnSaleOnly((v) => !v);
    applyFilters();
  };

  const filtered = React.useMemo(() => {
    let list = PRODUCTS.slice();
    if (category !== "All") list = list.filter((p) => p.category === category);
    if (activeColors.length > 0)
      list = list.filter((p) =>
        p.colorOptions.some((c) => activeColors.includes(c.hex))
      );
    if (onSaleOnly) list = list.filter((p) => Boolean(p.originalPrice));
    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        // New Arrivals first, then by reviews desc as a proxy
        list.sort((a, b) => {
          const ax = a.category === "New Arrivals" ? 0 : 1;
          const bx = b.category === "New Arrivals" ? 0 : 1;
          if (ax !== bx) return ax - bx;
          return b.reviews - a.reviews;
        });
        break;
      default:
        break;
    }
    return list;
  }, [category, activeColors, onSaleOnly, sort]);

  const activeFilterCount =
    (category !== "All" ? 1 : 0) +
    activeColors.length +
    (onSaleOnly ? 1 : 0);

  const clearAll = () => {
    setCategory("All");
    setActiveColors([]);
    setOnSaleOnly(false);
    setSort("featured");
    applyFilters();
  };

  return (
    <section id="collection" className="bg-background py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="The Complete Collection"
          title="Shop All Abayas"
          description="Browse our full atelier. Filter by colour, sort to your taste, and discover the abaya made for you."
        />

        {/* Category tabs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onCategory(c)}
              aria-pressed={category === c}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all sm:text-sm",
                category === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground/70 hover:border-foreground/40 hover:text-foreground"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Toolbar: sort + filter toggle (mobile) */}
        <div className="mt-8 flex items-center justify-between gap-3 border-y py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpenMobile((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium lg:hidden"
              aria-expanded={filtersOpenMobile}
            >
              <SlidersHorizontal className="size-3.5" />
              Filters
              {activeFilterCount > 0 ? (
                <span className="inline-flex size-4 items-center justify-center rounded-full bg-primary text-[0.6rem] text-primary-foreground">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
            <span className="hidden text-sm text-muted-foreground lg:inline">
              {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground sm:text-sm">Sort</label>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => onSort(e.target.value as SortKey)}
                aria-label="Sort products"
                className="h-9 rounded-full border bg-background pl-3 pr-8 text-xs font-medium outline-none transition-colors hover:border-foreground/40 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:text-sm"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
          {/* Sidebar filters (desktop) + collapsible (mobile) */}
          <aside
            className={cn(
              "lg:block",
              filtersOpenMobile ? "block" : "hidden"
            )}
          >
            <div className="space-y-6 lg:sticky lg:top-28">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="eyebrow text-[var(--mocha)]">Colour</h3>
                  {activeColors.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveColors([]);
                        applyFilters();
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                <ul className="mt-3 space-y-1.5">
                  {ALL_COLORS.map((c) => {
                    const checked = activeColors.includes(c.hex);
                    return (
                      <li key={c.hex}>
                        <button
                          type="button"
                          onClick={() => onToggleColor(c.hex)}
                          aria-pressed={checked}
                          className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left text-sm transition-colors hover:bg-secondary/60"
                        >
                          <span
                            className="flex size-5 flex-none items-center justify-center rounded-full ring-1 ring-inset ring-black/10"
                            style={{ backgroundColor: c.hex }}
                          >
                            {checked ? (
                              <Check className="size-3 text-white drop-shadow" />
                            ) : null}
                          </span>
                          <span className={cn(checked && "font-medium")}>
                            {c.name}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="border-t pt-5">
                <h3 className="eyebrow text-[var(--mocha)]">Offers</h3>
                <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={onSaleOnly}
                    onChange={onToggleSale}
                    className="size-4 rounded border-border accent-[var(--gold)]"
                  />
                  On sale only
                </label>
              </div>

              {activeFilterCount > 0 ? (
                <div className="border-t pt-5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAll}
                    className="w-full rounded-full"
                  >
                    <X className="size-3.5" />
                    Clear all ({activeFilterCount})
                  </Button>
                </div>
              ) : null}
            </div>
          </aside>

          {/* Product grid */}
          <div>
            <div className="mb-4 text-sm text-muted-foreground lg:hidden">
              {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
            </div>
            {filtered.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-20 text-center">
                <span className="font-serif text-xl">No abayas match your filters</span>
                <p className="text-sm text-muted-foreground">
                  Try removing a colour or clearing your filters.
                </p>
                <Button onClick={clearAll} variant="outline" className="rounded-full">
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <ProductSkeleton key={i} />
                    ))
                  : filtered.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Collection;
