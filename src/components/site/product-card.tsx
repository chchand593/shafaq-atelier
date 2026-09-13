"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, Star, Eye, GitCompare, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useUI, useWishlist, useCompare, MAX_COMPARE } from "@/lib/store";
import { formatPKR } from "@/lib/format";
import type { Product, ColorImage } from "@/lib/site-data";

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
