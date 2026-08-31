"use client";

import * as React from "react";
import {
  SlidersHorizontal,
  X,
  Check,
  Search,
  ChevronDown,
  PackageX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/format";
import { ProductCard } from "@/components/site/product-card";
import {
  ALL_SIZES,
  type Product,
} from "@/lib/site-data";
import { useApiProducts } from "@/lib/use-products";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Unique colours across daily wear products (computed at runtime from the
// live DB-driven product list — see DailyWearCollection component below).
// Unique fabrics (short label derived from the fabric string).

type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "best-selling";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "best-selling", label: "Best Selling" },
];

type Filters = {
  priceMin: number;
  priceMax: number;
  sizes: string[];
  colors: string[]; // hex values
  fabrics: string[]; // short fabric labels
  inStockOnly: boolean;
  search: string;
};

const DEFAULT_PRICE_MIN_FALLBACK = 5000;
const DEFAULT_PRICE_MAX_FALLBACK = 20000;

const EMPTY_FILTERS: Filters = {
  priceMin: 0,
  priceMax: Number.MAX_SAFE_INTEGER,
  sizes: [],
  colors: [],
  fabrics: [],
  inStockOnly: false,
  search: "",
};

function productFabricLabel(p: Product): string {
  const f = p.fabric;
  if (f.includes("matte crepe")) return "Matte Crepe";
  if (f.includes("nida")) return "Nida";
  if (f.includes("satin-crepe") || f.includes("satin crepe")) return "Satin Crepe";
  if (f.includes("chiffon")) return "Chiffon";
  if (f.includes("silk")) return "Silk Blend";
  if (f.includes("travel crepe")) return "Travel Crepe";
  if (f.includes("heavyweight crepe")) return "Heavyweight Crepe";
  if (f.includes("layered crepe")) return "Layered Crepe";
  return "Other";
}

function applyFilters(
  products: Product[],
  filters: Filters,
  sort: SortKey
): Product[] {
  let list = products.slice();

  // Price
  list = list.filter(
    (p) => p.price >= filters.priceMin && p.price <= filters.priceMax
  );

  // Sizes
  if (filters.sizes.length > 0) {
    list = list.filter((p) => p.sizes.some((s) => filters.sizes.includes(s)));
  }

  // Colours
  if (filters.colors.length > 0) {
    list = list.filter((p) =>
      p.colorOptions.some((c) => filters.colors.includes(c.hex))
    );
  }

  // Fabrics
  if (filters.fabrics.length > 0) {
    list = list.filter((p) => filters.fabrics.includes(productFabricLabel(p)));
  }

  // In stock
  if (filters.inStockOnly) {
    list = list.filter((p) => (p.stock ?? 50) > 0);
  }

  // Search
  if (filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter((p) => {
      const hay = `${p.name} ${p.description} ${p.fabric} ${p.badge ?? ""}`.toLowerCase();
      return q.split(/\s+/).every((token) => hay.includes(token));
    });
  }

  // Sort
  switch (sort) {
    case "price-asc":
      list.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      list.sort((a, b) => b.price - a.price);
      break;
    case "best-selling":
      list.sort((a, b) => b.reviews - a.reviews);
      break;
    case "newest":
      // Daily Wear products don't have dates; sort by reviews desc as a proxy
      list.sort((a, b) => b.reviews - a.reviews);
      break;
    default:
      break;
  }

  return list;
}

function countActiveFilters(f: Filters, priceMin: number, priceMax: number): number {
  let n = 0;
  if (f.priceMin !== priceMin || f.priceMax !== priceMax) n++;
  if (f.sizes.length > 0) n += f.sizes.length;
  if (f.colors.length > 0) n += f.colors.length;
  if (f.fabrics.length > 0) n += f.fabrics.length;
  if (f.inStockOnly) n++;
  if (f.search.trim()) n++;
  return n;
}

// ---------------------------------------------------------------------------
// Filter Panel (shared between desktop sidebar + mobile sheet)
// ---------------------------------------------------------------------------

function FilterPanel({
  filters,
  setFilters,
  allColors,
  allFabrics,
  priceMin,
  priceMax,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  allColors: { hex: string; name: string }[];
  allFabrics: string[];
  priceMin: number;
  priceMax: number;
}) {
  const toggleArray = (key: "sizes" | "colors" | "fabrics", val: string) =>
    setFilters((f) => ({
      ...f,
      [key]: f[key].includes(val)
        ? f[key].filter((x) => x !== val)
        : [...f[key], val],
    }));

  return (
    <div className="space-y-6">
      {/* Price range */}
      <div>
        <h3 className="eyebrow text-[var(--mocha)]">Price Range</h3>
        <div className="mt-3 flex items-center gap-2">
          <Input
            type="number"
            value={filters.priceMin}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                priceMin: Math.min(
                  Number(e.target.value) || priceMin,
                  f.priceMax
                ),
              }))
            }
            className="h-9 text-sm"
            placeholder={String(priceMin)}
            min={priceMin}
            max={priceMax}
          />
          <span className="text-muted-foreground">—</span>
          <Input
            type="number"
            value={filters.priceMax}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                priceMax: Math.max(
                  Number(e.target.value) || priceMax,
                  f.priceMin
                ),
              }))
            }
            className="h-9 text-sm"
            placeholder={String(priceMax)}
            min={priceMin}
            max={priceMax}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {formatPKR(filters.priceMin)} — {formatPKR(filters.priceMax)}
        </p>
      </div>

      <Separator />

      {/* Size */}
      <div>
        <h3 className="eyebrow text-[var(--mocha)]">Size</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {ALL_SIZES.map((s) => {
            const checked = filters.sizes.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleArray("sizes", s)}
                aria-pressed={checked}
                className={cn(
                  "inline-flex h-9 min-w-11 items-center justify-center rounded-md border px-3 text-sm font-medium transition-all",
                  checked
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-foreground/40"
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Colour */}
      <div>
        <h3 className="eyebrow text-[var(--mocha)]">Colour</h3>
        <div className="mt-3 space-y-1.5">
          {allColors.map((c) => {
            const checked = filters.colors.includes(c.hex);
            return (
              <button
                key={c.hex}
                type="button"
                onClick={() => toggleArray("colors", c.hex)}
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
                <span className={cn(checked && "font-medium")}>{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Fabric */}
      <div>
        <h3 className="eyebrow text-[var(--mocha)]">Fabric</h3>
        <div className="mt-3 space-y-1.5">
          {allFabrics.map((fab) => {
            const checked = filters.fabrics.includes(fab);
            return (
              <label
                key={fab}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1.5 text-sm transition-colors hover:bg-secondary/60"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleArray("fabrics", fab)}
                  className="size-4 rounded border-border accent-[var(--gold)]"
                />
                {fab}
              </label>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Availability */}
      <div>
        <h3 className="eyebrow text-[var(--mocha)]">Availability</h3>
        <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) =>
              setFilters((f) => ({ ...f, inStockOnly: e.target.checked }))
            }
            className="size-4 rounded border-border accent-[var(--gold)]"
          />
          In stock only
        </label>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Active filter chips
// ---------------------------------------------------------------------------

function ActiveFilterChips({
  filters,
  setFilters,
  onClearAll,
  allColors,
  priceMin,
  priceMax,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onClearAll: () => void;
  allColors: { hex: string; name: string }[];
  priceMin: number;
  priceMax: number;
}) {
  const chips: { label: string; onRemove: () => void }[] = [];

  if (filters.priceMin !== priceMin || filters.priceMax !== priceMax) {
    chips.push({
      label: `${formatPKR(filters.priceMin)}–${formatPKR(filters.priceMax)}`,
      onRemove: () =>
        setFilters((f) => ({
          ...f,
          priceMin,
          priceMax,
        })),
    });
  }

  for (const s of filters.sizes) {
    chips.push({
      label: `Size: ${s}`,
      onRemove: () =>
        setFilters((f) => ({ ...f, sizes: f.sizes.filter((x) => x !== s) })),
    });
  }

  for (const hex of filters.colors) {
    const c = allColors.find((x) => x.hex === hex);
    chips.push({
      label: `Colour: ${c?.name || hex}`,
      onRemove: () =>
        setFilters((f) => ({
          ...f,
          colors: f.colors.filter((x) => x !== hex),
        })),
    });
  }

  for (const fab of filters.fabrics) {
    chips.push({
      label: `Fabric: ${fab}`,
      onRemove: () =>
        setFilters((f) => ({
          ...f,
          fabrics: f.fabrics.filter((x) => x !== fab),
        })),
    });
  }

  if (filters.inStockOnly) {
    chips.push({
      label: "In Stock",
      onRemove: () => setFilters((f) => ({ ...f, inStockOnly: false })),
    });
  }

  if (filters.search.trim()) {
    chips.push({
      label: `Search: "${filters.search.trim()}"`,
      onRemove: () => setFilters((f) => ({ ...f, search: "" })),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip, i) => (
        <button
          key={i}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium transition-colors hover:border-foreground/40"
        >
          {chip.label}
          <X className="size-3 text-muted-foreground" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const ITEMS_PER_PAGE = 8;

export function DailyWearCollection() {
  const { products: allProducts, loading: productsLoading } = useApiProducts();
  const dailyWear = React.useMemo(
    () => allProducts.filter((p) => p.category === "Daily Wear"),
    [allProducts]
  );

  // Derive filter facets + price bounds from the live DB-driven product list.
  const allColors = React.useMemo(
    () =>
      Array.from(
        new Map(
          dailyWear.flatMap((p) => p.colorOptions).map((c) => [c.hex, c])
        ).values()
      ),
    [dailyWear]
  );
  const allFabrics = React.useMemo(
    () =>
      Array.from(
        new Set(
          dailyWear.map((p) => {
            const f = p.fabric;
            if (f.includes("matte crepe")) return "Matte Crepe";
            if (f.includes("nida")) return "Nida";
            if (f.includes("satin-crepe") || f.includes("satin crepe"))
              return "Satin Crepe";
            if (f.includes("chiffon")) return "Chiffon";
            if (f.includes("silk")) return "Silk Blend";
            if (f.includes("travel crepe")) return "Travel Crepe";
            if (f.includes("heavyweight crepe")) return "Heavyweight Crepe";
            if (f.includes("layered crepe")) return "Layered Crepe";
            return "Other";
          })
        )
      ).sort(),
    [dailyWear]
  );
  const priceMin = React.useMemo(
    () =>
      dailyWear.length > 0
        ? Math.min(...dailyWear.map((p) => p.price))
        : DEFAULT_PRICE_MIN_FALLBACK,
    [dailyWear]
  );
  const priceMax = React.useMemo(
    () =>
      dailyWear.length > 0
        ? Math.max(...dailyWear.map((p) => p.price))
        : DEFAULT_PRICE_MAX_FALLBACK,
    [dailyWear]
  );

  const defaultFilters = React.useMemo<Filters>(
    () => ({
      priceMin,
      priceMax,
      sizes: [],
      colors: [],
      fabrics: [],
      inStockOnly: false,
      search: "",
    }),
    [priceMin, priceMax]
  );

  const [filters, setFilters] = React.useState<Filters>(defaultFilters);
  const [sort, setSort] = React.useState<SortKey>("featured");
  const [visibleCount, setVisibleCount] = React.useState(ITEMS_PER_PAGE);
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  // Once the products load and we know the real price bounds, sync the filter
  // default state so the price slider starts with correct min/max values.
  React.useEffect(() => {
    setFilters((f) => ({
      ...f,
      priceMin: f.priceMin === 0 || f.priceMin === EMPTY_FILTERS.priceMin ? priceMin : f.priceMin,
      priceMax: f.priceMax === Number.MAX_SAFE_INTEGER || f.priceMax === EMPTY_FILTERS.priceMax ? priceMax : f.priceMax,
    }));
  }, [priceMin, priceMax]);

  const filtered = React.useMemo(
    () => applyFilters(dailyWear, filters, sort),
    [dailyWear, filters, sort]
  );

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const activeCount = countActiveFilters(filters, priceMin, priceMax);

  const clearAll = () => {
    setFilters(defaultFilters);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  // Reset pagination when filters/sort change
  React.useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [filters, sort]);

  return (
    <div className="mx-auto max-w-7xl overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {/* Page hero */}
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="eyebrow text-[var(--gold)]">For Everyday Grace</span>
        <h1 className="font-serif text-4xl font-medium leading-tight sm:text-5xl">
          Daily Wear Abayas
        </h1>
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
          Effortless, breathable and beautifully cut for the rhythm of your day.
          Everyday essentials designed to move with you, from morning to evening.
        </p>
        <p className="text-xs text-muted-foreground">
          {dailyWear.length} pieces in the collection
        </p>
        <div className="gold-rule mt-1 max-w-[3.5rem]" />
      </div>

      {/* Toolbar */}
      <div className="mt-10 flex flex-col gap-3 border-y py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile filter toggle */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium lg:hidden"
              >
                <SlidersHorizontal className="size-3.5" />
                Filters
                {activeCount > 0 ? (
                  <span className="inline-flex size-4 items-center justify-center rounded-full bg-primary text-[0.6rem] text-primary-foreground">
                    {activeCount}
                  </span>
                ) : null}
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[85%] max-w-xs overflow-y-auto elegant-scroll border-r bg-background p-0"
            >
              <SheetHeader className="border-b px-5 py-4">
                <SheetTitle className="text-left font-serif text-lg">
                  Filters
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Filter the Daily Wear abaya collection
                </SheetDescription>
              </SheetHeader>
              <div className="px-5 py-5">
                <FilterPanel filters={filters} setFilters={setFilters} allColors={allColors} allFabrics={allFabrics} priceMin={priceMin} priceMax={priceMax} />
                <div className="mt-6 flex gap-2">
                  <Button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="flex-1 rounded-full"
                  >
                    Show {filtered.length} results
                  </Button>
                  {activeCount > 0 ? (
                    <Button
                      variant="outline"
                      onClick={clearAll}
                      className="rounded-full"
                    >
                      Clear
                    </Button>
                  ) : null}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <span className="text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Collection search */}
          <div className="relative flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              placeholder="Search this collection…"
              aria-label="Search within Daily Wear"
              className="h-9 rounded-full pl-9 text-sm sm:w-56"
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort products"
              className="h-9 appearance-none rounded-full border bg-background pl-3 pr-8 text-xs font-medium outline-none transition-colors hover:border-foreground/40 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:text-sm"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      <div className="mt-4">
        <ActiveFilterChips
          filters={filters}
          setFilters={setFilters}
          onClearAll={clearAll}
          allColors={allColors}
          priceMin={priceMin}
          priceMax={priceMax}
        />
      </div>

      {/* Layout: sidebar + grid */}
      <div className="mt-6 grid gap-8 lg:grid-cols-[220px_1fr]">
        {/* Desktop filter sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-medium">Filters</h3>
              {activeCount > 0 ? (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </button>
              ) : null}
            </div>
            <FilterPanel filters={filters} setFilters={setFilters} allColors={allColors} allFabrics={allFabrics} priceMin={priceMin} priceMax={priceMax} />
          </div>
        </aside>

        {/* Product grid */}
        <div>
          {filtered.length === 0 && !productsLoading ? (
            // Empty state
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-20 text-center">
              <PackageX className="size-10 text-muted-foreground/40" />
              <div>
                <p className="font-serif text-xl">No abayas match your filters</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try adjusting your price range, colours, or sizes.
                </p>
              </div>
              <Button onClick={clearAll} variant="outline" className="rounded-full">
                Clear Filters
              </Button>
            </div>
          ) : productsLoading && dailyWear.length === 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col overflow-hidden rounded-xl border bg-card">
                  <div className="aspect-[4/5] w-full skeleton-shimmer" />
                  <div className="flex flex-col gap-2 p-4">
                    <div className="h-3 w-20 skeleton-shimmer rounded" />
                    <div className="h-4 w-3/4 skeleton-shimmer rounded" />
                    <div className="h-5 w-24 skeleton-shimmer rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-3">
                {visible.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Load More */}
              {hasMore ? (
                <div className="mt-10 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setVisibleCount((c) => c + ITEMS_PER_PAGE)
                    }
                    className="rounded-full px-8"
                  >
                    Load More ({filtered.length - visibleCount} remaining)
                  </Button>
                </div>
              ) : (
                <p className="mt-8 text-center text-xs text-muted-foreground">
                  Showing all {filtered.length}{" "}
                  {filtered.length === 1 ? "piece" : "pieces"}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DailyWearCollection;
