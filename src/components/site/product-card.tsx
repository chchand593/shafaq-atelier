"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, Star, Eye, GitCompare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useUI, useWishlist, useCompare, MAX_COMPARE } from "@/lib/store";
import { formatPKR } from "@/lib/format";
import type { Product } from "@/lib/site-data";

type ProductCardProps = {
  product: Product;
  className?: string;
};

export function ProductCard({ product, className }: ProductCardProps) {
  const { openQuickView } = useUI();
  const wishlist = useWishlist();
  const wished = wishlist.ids.includes(product.id);
  const compare = useCompare();
  const inCompare = compare.ids.includes(product.id);
  const compareFull = compare.ids.length >= MAX_COMPARE;

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
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="zoom-img h-full w-full object-cover"
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
            {product.rating.toFixed(1)} ({product.reviews})
          </span>
        </div>

        <h3 className="font-serif text-lg font-medium leading-snug text-foreground">
          {product.name}
        </h3>

        {/* Colour swatches */}
        <div
          className="flex items-center gap-1.5"
          aria-label="Available colours"
        >
          {product.colorOptions.map((c) => (
            <span
              key={c.hex}
              title={c.name}
              style={{ backgroundColor: c.hex }}
              className="size-3.5 rounded-full ring-1 ring-inset ring-black/10"
            />
          ))}
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
