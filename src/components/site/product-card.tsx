"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, Star, Eye, GitCompare, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useUI, useWishlist, useCompare, MAX_COMPARE } from "@/lib/store";
import { formatPKR } from "@/lib/format";
import type { Product, ColorImage, CombinationImage } from "@/lib/site-data";

type ProductCardProps = {
  product: Product;
  className?: string;
};

// Helper: find the color-specific image for a given hex, falling back to the
// product's main image when no match exists. Used by ProductCard, QuickView,
// and ProductDetail to ensure consistent fallback behaviour.
// Fully null-safe: handles missing/undefined fields gracefully.
export function getColorImage(
  product: Product,
  colorHex: string | null
): string {
  if (!product) return "/images/custom.jpg";
  if (!colorHex || !product.colorImages || product.colorImages.length === 0) {
    return product.images?.[0] || product.image || "/images/custom.jpg";
  }
  const match = product.colorImages.find(
    (ci: ColorImage) => ci.colorHex?.toLowerCase() === colorHex.toLowerCase()
  );
  return match?.image || product.images?.[0] || product.image || "/images/custom.jpg";
}

// Get ALL gallery images for a specific color. Returns the color-specific
// images array if it exists (multiple images per color), otherwise returns
// just the single color image. Falls back to the product's default gallery
// when no color match exists.
// Fully null-safe: handles missing/undefined fields gracefully.
export function getColorGallery(
  product: Product,
  colorHex: string | null
): string[] {
  if (!product) return ["/images/custom.jpg"];
  if (!colorHex || !product.colorImages || product.colorImages.length === 0) {
    return product.images?.length ? product.images : [product.image || "/images/custom.jpg"];
  }
  const match = product.colorImages.find(
    (ci: ColorImage) => ci.colorHex?.toLowerCase() === colorHex.toLowerCase()
  );
  if (!match) {
    return product.images?.length ? product.images : [product.image || "/images/custom.jpg"];
  }
  if (match.images && Array.isArray(match.images) && match.images.length > 0) {
    const primary = match.image;
    const extras = match.images.filter((img) => img !== primary);
    return [primary, ...extras];
  }
  return [match.image];
}

// Find the best matching CombinationImage entry for a given color/style/fabric
// selection. All three keys are optional on the CombinationImage entry — an
// absent key means "applies to all values of that dimension". The matcher
// prefers entries where the provided keys EXACTLY match the entry's keys, and
// where the entry has MORE specified keys (more specific match wins).
//
// CRITICAL SAFETY: A dimension is only treated as a wildcard when the SELECTION
// passes null for it. If the selection passes a value, entries with a DIFFERENT
// value for that dimension are REJECTED — even if the selection intentionally
// dropped a different dimension. This prevents the fallback from showing an
// image that belongs to a different color/fabric/style.
//
// Returns `null` when no combination entry matches. The caller then falls back
// to getColorGallery / product.images.
function findCombinationEntry(
  product: Product,
  colorHex: string | null,
  styleId: string | null,
  fabricId: string | null
): CombinationImage | null {
  if (!product.combinationImages || product.combinationImages.length === 0) {
    return null;
  }
  const color = colorHex?.toLowerCase() ?? null;
  const style = styleId ?? null;
  const fabric = fabricId ?? null;

  // Score each entry: a candidate must match on every dimension where BOTH
  // the entry and the selection specify a value. The entry's "specificity" is
  // how many dimensions it pins down. Higher specificity + match = best.
  let best: { entry: CombinationImage; specificity: number } | null = null;
  for (const entry of product.combinationImages) {
    const eColor = entry.colorHex?.toLowerCase() ?? null;
    const eStyle = entry.styleId ?? null;
    const eFabric = entry.fabricId ?? null;

    // For each dimension: if BOTH entry and selection specify a value, they
    // must be equal. If either is absent, that dimension is a wildcard.
    if (eColor && color && eColor !== color) continue;
    if (eStyle && style && eStyle !== style) continue;
    if (eFabric && fabric && eFabric !== fabric) continue;

    const specificity =
      (eColor ? 1 : 0) + (eStyle ? 1 : 0) + (eFabric ? 1 : 0);
    if (!best || specificity > best.specificity) {
      best = { entry, specificity };
    }
  }
  return best?.entry ?? null;
}

// STRICTER matcher for fallback levels: when a dimension is "dropped" (passed
// as null), the entry must NOT have a different value for ANY dimension the
// caller is still tracking. Specifically:
//   - `requiredColor`: if set, entries with a different colorHex are rejected.
//   - `requiredStyle`: if set, entries with a different styleId are rejected.
//   - `requiredFabric`: if set, entries with a different fabricId are rejected.
//   - `matchColor/matchStyle/matchFabric`: if set, the entry must match (or be
//     absent) on that dimension.
//
// This prevents Level 2 (Color+Fabric) or Level 3 (Style+Fabric) from matching
// an entry that has a DIFFERENT value for the dimension that was "dropped".
function findStrictCombinationEntry(
  product: Product,
  opts: {
    matchColor: string | null;
    matchStyle: string | null;
    matchFabric: string | null;
    requiredColor: string | null;
    requiredStyle: string | null;
    requiredFabric: string | null;
  }
): CombinationImage | null {
  if (!product.combinationImages || product.combinationImages.length === 0) {
    return null;
  }
  const mc = opts.matchColor?.toLowerCase() ?? null;
  const ms = opts.matchStyle ?? null;
  const mf = opts.matchFabric ?? null;
  const rc = opts.requiredColor?.toLowerCase() ?? null;
  const rs = opts.requiredStyle ?? null;
  const rf = opts.requiredFabric ?? null;

  let best: { entry: CombinationImage; specificity: number } | null = null;
  for (const entry of product.combinationImages) {
    const eColor = entry.colorHex?.toLowerCase() ?? null;
    const eStyle = entry.styleId ?? null;
    const eFabric = entry.fabricId ?? null;

    // Match dimensions: entry must match (or be absent) on the matched dims
    if (mc && eColor && eColor !== mc) continue;
    if (ms && eStyle && eStyle !== ms) continue;
    if (mf && eFabric && eFabric !== mf) continue;

    // Required dimensions: entry must NOT have a different value for the
    // dimensions the caller is still tracking (even though they're not matched)
    if (rc && eColor && eColor !== rc) continue;
    if (rs && eStyle && eStyle !== rs) continue;
    if (rf && eFabric && eFabric !== rf) continue;

    const specificity =
      (eColor ? 1 : 0) + (eStyle ? 1 : 0) + (eFabric ? 1 : 0);
    if (!best || specificity > best.specificity) {
      best = { entry, specificity };
    }
  }
  return best?.entry ?? null;
}

// Combination-aware gallery builder. Fallback chain (never returns [] empty):
//   1. Exact Color + Style + Fabric match in product.combinationImages
//   2. Color + Fabric match (drop style — preserves fabric dimension)
//   3. Style + Fabric match (drop color — preserves fabric dimension)
//   4. Color match (product.colorImages — real color photo)
//   5. Style-only match in combinationImages
//   6. Default product.images gallery (or product.image)
//
// CRITICAL: Levels 2 and 3 keep the fabricId in the match call so entries
// whose fabricId differs from the selected fabric are rejected. This prevents
// the fallback from showing an image belonging to a DIFFERENT fabric.
//
// Used by ProductDetail and QuickView. Fully null-safe — never throws, never returns [].
export function getCombinationGallery(
  product: Product,
  colorHex: string | null,
  styleId: string | null,
  fabricId: string | null
): string[] {
  if (!product) return ["/images/custom.jpg"];

  // Helper: extract the image array from a CombinationImage entry.
  const extractImages = (entry: CombinationImage | null): string[] | null => {
    if (!entry || !entry.image) return null;
    if (entry.images && Array.isArray(entry.images) && entry.images.length > 0) {
      const primary = entry.image;
      const extras = entry.images.filter((img) => img !== primary);
      const all = [primary, ...extras].filter((u) => typeof u === "string" && u.length > 0);
      if (all.length > 0) return all;
    }
    if (typeof entry.image === "string" && entry.image.length > 0) return [entry.image];
    return null;
  };

  // 1. Try the most specific combination match (color + style + fabric).
  const exact = extractImages(findCombinationEntry(product, colorHex, styleId, fabricId));
  if (exact) return exact;

  // 2. Try Color + Fabric (drop style — preserves fabric + color dimensions).
  //    Uses findStrictCombinationEntry so entries with a different style are
  //    rejected (requiredStyle = styleId). This prevents matching a combo that
  //    belongs to a different style.
  if (colorHex && fabricId) {
    const cf = extractImages(findStrictCombinationEntry(product, {
      matchColor: colorHex,
      matchStyle: null,
      matchFabric: fabricId,
      requiredColor: colorHex,
      requiredStyle: styleId,
      requiredFabric: fabricId,
    }));
    if (cf) return cf;
  }

  // 3. Try Style + Fabric (drop color — preserves fabric + style dimensions).
  //    Uses findStrictCombinationEntry so entries with a different color are
  //    rejected (requiredColor = colorHex). This prevents matching a combo that
  //    belongs to a different color.
  if (styleId && fabricId) {
    const sf = extractImages(findStrictCombinationEntry(product, {
      matchColor: null,
      matchStyle: styleId,
      matchFabric: fabricId,
      requiredColor: colorHex,
      requiredStyle: styleId,
      requiredFabric: fabricId,
    }));
    if (sf) return sf;
  }

  // 4. Try color only (existing colorImages — real color photo).
  if (colorHex) {
    const colorGallery = getColorGallery(product, colorHex);
    // Only use the color gallery if it actually found a color-specific image
    // (getColorGallery falls back to product.images when no match). We detect
    // a real match by checking if colorImages has an entry for this hex.
    const hasColorMatch =
      product.colorImages &&
      product.colorImages.some(
        (ci) => ci.colorHex?.toLowerCase() === colorHex.toLowerCase()
      );
    if (hasColorMatch && colorGallery.length > 0) return colorGallery;
  }

  // 5. Try style-only match (drop color + fabric).
  if (styleId) {
    const styleOnly = extractImages(findCombinationEntry(product, null, styleId, null));
    if (styleOnly) return styleOnly;
  }

  // 6. Final fallback — default product gallery.
  return product.images?.length
    ? product.images
    : [product.image || "/images/custom.jpg"];
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { openQuickView } = useUI();
  const wishlist = useWishlist();
  const wished = wishlist.ids.includes(product.id);
  const compare = useCompare();
  const inCompare = compare.ids.includes(product.id);
  const compareFull = compare.ids.length >= MAX_COMPARE;

  // Selected color for the live image swap. Null = use default product image.
  const [selectedColor, setSelectedColor] = React.useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = React.useState(true);

  // The image src changes based on the selected color. When a color-specific
  // image exists in the product data, it is shown. Otherwise the main product
  // image is used as a fallback — no CSS filters or fake color tricks.
  const currentImage = getColorImage(product, selectedColor);

  const onWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    wishlist.toggle(product.id);
  };

  const onQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openQuickView(product);
  };

  const onCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (compareFull && !inCompare) {
      import("sonner").then(({ toast }) =>
        toast.error(`You can compare up to ${MAX_COMPARE} products`, {
          description: "Remove one to add another.",
        })
      );
      return;
    }
    compare.toggle(product.id);
  };

  // Color swatch click — changes the product image to the real photo for that
  // color. Does NOT navigate to the product page (preventDefault + stopPropagation).
  const onColorClick = (e: React.MouseEvent, hex: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedColor((prev) => (prev === hex ? null : hex));
    setImgLoaded(false);
  };

  const href = `/product/${product.id}`;

  return (
    <article
      className={cn(
        "group card-lift relative flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm",
        className
      )}
    >
      {/* Image area — links to PDP */}
      <Link
        href={href}
        aria-label={`View ${product.name}`}
        className="zoom-wrap relative block aspect-[4/5] w-full bg-secondary"
      >
        {product.badge ? (
          <Badge className="absolute left-3 top-3 z-10 bg-primary text-primary-foreground shadow-sm">
            {product.badge}
          </Badge>
        ) : null}
        {product.stock !== undefined && product.stock <= 5 ? (
          <Badge
            className={cn(
              "absolute right-3 top-3 z-10 shadow-sm",
              product.stock === 0
                ? "bg-destructive text-white"
                : "bg-[var(--gold)] text-primary"
            )}
          >
            {product.stock === 0
              ? "Sold Out"
              : `Only ${product.stock} left`}
          </Badge>
        ) : null}
        <img
          key={currentImage}
          src={currentImage}
          alt={product.name}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          className={cn(
            "zoom-img h-full w-full object-cover transition-opacity duration-300",
            imgLoaded ? "opacity-100" : "opacity-0"
          )}
        />
        {/* Hover overlay with Quick View */}
        <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/10" />
        <button
          type="button"
          onClick={onQuickView}
          aria-label={`Quick view ${product.name}`}
          className="pointer-events-auto absolute bottom-3 left-1/2 z-10 inline-flex -translate-x-1/2 translate-y-3 items-center gap-2 rounded-full bg-background/95 px-4 py-2 text-xs font-medium uppercase tracking-wider text-foreground opacity-0 shadow-sm backdrop-blur transition-all duration-500 hover:text-[var(--gold)] group-hover:translate-y-0 group-hover:opacity-100"
        >
          <Eye className="size-3.5" />
          Quick View
        </button>
        {/* Compare toggle (hover) */}
        <button
          type="button"
          onClick={onCompare}
          aria-pressed={inCompare}
          aria-label={inCompare ? "Remove from comparison" : "Add to comparison"}
          className={cn(
            "pointer-events-auto absolute bottom-3 right-3 z-10 inline-flex size-9 translate-y-3 items-center justify-center rounded-full bg-background/95 text-foreground opacity-0 shadow-sm backdrop-blur transition-all duration-500 hover:text-[var(--gold)] group-hover:translate-y-0 group-hover:opacity-100",
            inCompare && "text-[var(--gold)] opacity-100 translate-y-0"
          )}
        >
          <GitCompare className={cn("size-4", inCompare && "fill-current")} />
        </button>
      </Link>

      {/* Wishlist heart (separate, stopPropagation) */}
      <button
        type="button"
        aria-pressed={wished}
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        onClick={onWishlist}
        className="absolute right-3 top-3 z-20 inline-flex size-9 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur transition-colors hover:text-[var(--gold)]"
      >
        <Heart
          className={cn("size-4", wished && "fill-current text-[var(--gold)]")}
        />
      </button>

      {/* Body — links to PDP */}
      <Link
        href={href}
        className="flex flex-1 flex-col gap-2 p-4"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="eyebrow text-[var(--mocha)]">
            {product.category}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3.5 fill-[var(--gold)] text-[var(--gold)]" />
            {(product.rating ?? 0).toFixed(1)} ({product.reviews ?? 0})
          </span>
        </div>

        <h3 className="font-serif text-lg font-medium leading-snug text-foreground">
          {product.name}
        </h3>

        {/* Colour swatches — clickable to change the product image.
            Each swatch shows the real product photo for that color when
            clicked. Selected swatch gets a ring + check indicator. */}
        <div
          className="flex flex-wrap items-center gap-1.5"
          aria-label="Available colours — click to preview"
        >
          {(product.colorOptions ?? []).map((c) => {
            const isSelected = selectedColor === c.hex;
            return (
              <button
                key={c.hex}
                type="button"
                onClick={(e) => onColorClick(e, c.hex)}
                aria-pressed={isSelected}
                aria-label={`Preview ${c.name}`}
                title={c.name}
                style={{ backgroundColor: c.hex }}
                className={cn(
                  "flex size-5 items-center justify-center rounded-full ring-1 ring-inset ring-black/10 transition-all hover:scale-110",
                  isSelected && "ring-2 ring-[var(--gold)] ring-offset-1 ring-offset-background"
                )}
              >
                {isSelected ? (
                  <Check className="size-3 text-white drop-shadow" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="font-serif text-lg font-semibold text-foreground">
            {formatPKR(product.price)}
          </span>
          {product.originalPrice ? (
            <span className="text-sm text-muted-foreground line-through">
              {formatPKR(product.originalPrice)}
            </span>
          ) : null}
        </div>
      </Link>
    </article>
  );
}

export default ProductCard;
