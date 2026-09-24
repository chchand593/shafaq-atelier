"use client";

import * as React from "react";
import Link from "next/link";
import {
  Star,
  Heart,
  ShoppingBag,
  Minus,
  Plus,
  Truck,
  RefreshCcw,
  ShieldCheck,
  Check,
  ChevronRight,
  ChevronLeft,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useUI, useCart, useWishlist, useRecentlyViewed } from "@/lib/store";
import { formatPKR } from "@/lib/format";
import { toast } from "sonner";
import type { Product } from "@/lib/site-data";
import { getColorGallery } from "@/components/site/product-card";
import { ProductCard } from "@/components/site/product-card";
import { ProductReviews } from "@/components/site/product-reviews";
import { Recommendations } from "@/components/site/recommendations";

// Gallery uses one source image with framing variants to feel like a lookbook.
const FRAMINGS = [
  { label: "Full", pos: "center" as const, zoom: 1 },
  { label: "Detail", pos: "top" as const, zoom: 1.5 },
  { label: "Hem", pos: "bottom" as const, zoom: 1.5 },
];

// Build the list of gallery "views" for a product. When the product ships a
// multi-image `images` array we use those directly (each its own photo). When
// it only has a single `image` we fall back to the framing variants of that
// one image so the existing lookbook feel is preserved.
type GalleryView = { src: string; label: string; pos: string; zoom: number };

function buildGallery(product: Product, colorHex?: string | null): { views: GalleryView[]; isMulti: boolean } {
  // Get all images for the selected color (or the product's default gallery)
  const colorGallery = getColorGallery(product, colorHex ?? null);

  if (colorGallery.length > 1) {
    return {
      isMulti: true,
      views: colorGallery.map((src, i) => ({
        src,
        label: `View ${i + 1}`,
        pos: "center",
        zoom: 1,
      })),
    };
  }

  // Single image — use FRAMINGS of that image for the lookbook feel.
  const src = colorGallery[0] || product.image;
  return {
    isMulti: false,
    views: FRAMINGS.map((f) => ({
      src,
      label: f.label,
      pos: f.pos,
      zoom: f.zoom,
    })),
  };
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i < Math.round(rating)
              ? "fill-[var(--gold)] text-[var(--gold)]"
              : "text-muted-foreground/40"
          )}
        />
      ))}
    </div>
  );
}

function TrustBadges() {
  const items = [
    { icon: Truck, label: "Free shipping over PKR 10,000" },
    { icon: RefreshCcw, label: "7-day easy returns" },
    { icon: ShieldCheck, label: "Secure checkout" },
  ];
  return (
    <ul className="grid grid-cols-3 gap-2 rounded-lg border bg-secondary/50 p-3 text-center">
      {items.map((it) => (
        <li key={it.label} className="flex flex-col items-center gap-1.5 px-1">
          <it.icon className="size-4 text-[var(--gold)]" />
          <span className="text-[0.65rem] leading-tight text-muted-foreground">
            {it.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ProductDetail({
  product,
  related,
}: {
  product: Product;
  related: Product[];
}) {
  const { setCartOpen, setCheckoutOpen } = useUI();
  const addToCart = useCart((s) => s.add);
  const { toggle, ids } = useWishlist();
  const pushRecentlyViewed = useRecentlyViewed((s) => s.push);

  const [activeColor, setActiveColor] = React.useState(
    product.colorOptions[0] ?? { hex: "#1a1a1a", name: "Default" }
  );
  const [activeSize, setActiveSize] = React.useState<string | null>(null);
  const [qty, setQty] = React.useState(1);
  const [framing, setFraming] = React.useState(0);

  // Build the gallery views for this product (multi-image if available,
  // otherwise framing variants of the single image).
  // Build gallery — color-aware so selecting a color shows the real photo.
  const gallery = React.useMemo(
    () => buildGallery(product, activeColor?.hex),
    [product, activeColor?.hex]
  );
  const views = gallery.views;

  React.useEffect(() => {
    setActiveColor(product.colorOptions[0] ?? { hex: "#1a1a1a", name: "Default" });
    setActiveSize(null);
    setQty(1);
    setFraming(0);
    pushRecentlyViewed(product.id);
    window.scrollTo({ top: 0 });
  }, [product.id, pushRecentlyViewed]);

  // Fix #5: Reset framing index to 0 when the active color changes —
  // otherwise switching from a color with N images to one with M < N
  // images leaves framing pointing past the end of the new views array
  // and the main image falls back to product.image.
  React.useEffect(() => {
    setFraming(0);
  }, [activeColor?.hex]);

  const wished = ids.includes(product.id);

  const stockQty = product.stock ?? 50;
  const outOfStock = stockQty <= 0;
  const lowStock = stockQty > 0 && stockQty <= 5;

  const discountPct = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const doAddToCart = (openCheckout = false) => {
    if (!activeSize) {
      toast.error("Please select a size", {
        description: "Choose your size to add this abaya to your bag.",
      });
      return;
    }
    // Use the color-specific image (real photo for the selected color) in the
    // cart. Falls back to the main product image if no color image exists.
    const cartImage = (() => {
      if (product.colorImages && product.colorImages.length > 0) {
        const match = product.colorImages.find(
          (ci) => ci.colorHex.toLowerCase() === activeColor.hex.toLowerCase()
        );
        if (match) return match.image;
      }
      return product.images?.[0] || product.image;
    })();
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: cartImage,
      color: activeColor.hex,
      colorName: activeColor.name,
      size: activeSize,
      qty,
    });
    toast.success("Added to your bag", {
      description: `${product.name} · ${activeColor.name} · Size ${activeSize}`,
    });
    if (openCheckout) {
      setCheckoutOpen(true);
    } else {
      setCartOpen(true);
    }
  };

  const onAddToCart = () => doAddToCart(false);
  const onBuyNow = () => doAddToCart(true);

  const onWishlist = () => {
    toggle(product.id);
    toast(wished ? "Removed from wishlist" : "Added to wishlist", {
      description: product.name,
    });
  };

  const prevFraming = () =>
    setFraming((f) => (f === 0 ? views.length - 1 : f - 1));
  const nextFraming = () =>
    setFraming((f) => (f === views.length - 1 ? 0 : f + 1));

  const categoryHref =
    product.category === "Daily Wear"
      ? "#daily-wear"
      : product.category === "New Arrivals"
        ? "#new-arrivals"
        : "#best-sellers";

  return (
    <div className="mx-auto max-w-7xl overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
      >
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="size-3" />
        <Link href={`/#${categoryHref.slice(1)}`} className="hover:text-foreground">
          {product.category}
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Gallery */}
        <div className="flex flex-col gap-3 lg:sticky lg:top-28 lg:self-start">
          <div className="group relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-secondary">
            {product.badge ? (
              <Badge className="absolute left-4 top-4 z-10 bg-primary text-primary-foreground">
                {product.badge}
              </Badge>
            ) : null}
            {discountPct > 0 ? (
              <Badge className="absolute right-4 top-4 z-10 bg-[var(--gold)] text-primary">
                {discountPct}% OFF
              </Badge>
            ) : null}
            <img
              src={views[framing]?.src || product.image}
              alt={product.name}
              className="h-full w-full object-cover transition-all duration-500"
              style={{
                objectPosition: views[framing]?.pos || "center",
                transform: `scale(${views[framing]?.zoom || 1})`,
              }}
            />
            {/* Prev/next controls (visible on mobile, also hover on desktop) */}
            <button
              type="button"
              onClick={prevFraming}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 z-10 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur transition-opacity opacity-0 group-hover:opacity-100 sm:opacity-100"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={nextFraming}
              aria-label="Next image"
              className="absolute right-2 top-1/2 z-10 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur transition-opacity opacity-0 group-hover:opacity-100 sm:opacity-100"
            >
              <ChevronRight className="size-5" />
            </button>
            {/* Framing counter */}
            <span className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-background/80 px-3 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur">
              {framing + 1} / {views.length} — {views[framing]?.label}
            </span>
          </div>

          {/* Thumbnail strip */}
          <div className="flex gap-2">
            {views.map((v, i) => (
              <button
                key={`${v.src}-${i}`}
                type="button"
                onClick={() => setFraming(i)}
                aria-label={`View ${v.label}`}
                aria-pressed={framing === i}
                className={cn(
                  "relative h-20 flex-1 overflow-hidden rounded-lg border bg-secondary transition-all",
                  framing === i
                    ? "border-[var(--gold)] ring-2 ring-[var(--gold)]/30"
                    : "opacity-70 hover:opacity-100"
                )}
              >
                <img
                  src={v.src}
                  alt=""
                  className="h-full w-full object-cover"
                  style={{
                    objectPosition: v.pos,
                    transform: `scale(${v.zoom})`,
                  }}
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-1 text-center text-[0.55rem] font-medium uppercase tracking-wider text-white">
                  {v.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5">
          <div>
            <span className="eyebrow text-[var(--gold)]">{product.category}</span>
            <h1 className="mt-2 font-serif text-3xl font-medium leading-tight sm:text-4xl">
              {product.name}
            </h1>
            <div className="mt-3 flex items-center gap-2">
              <Stars rating={product.rating} />
              <span className="text-sm text-muted-foreground">
                {product.rating.toFixed(1)} · {product.reviews} reviews
              </span>
            </div>
          </div>

          {/* Price + discount */}
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-3xl font-semibold">
              {formatPKR(product.price)}
            </span>
            {product.originalPrice ? (
              <>
                <span className="text-base text-muted-foreground line-through">
                  {formatPKR(product.originalPrice)}
                </span>
                <Badge className="bg-[var(--gold)]/15 text-[var(--gold)]">
                  Save {formatPKR(product.originalPrice - product.price)} ({discountPct}%)
                </Badge>
              </>
            ) : null}
          </div>

          {/* Short description */}
          <p className="text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <Separator />

          {/* Colour */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Colour</span>
              <span className="text-sm text-muted-foreground">
                {activeColor.name}
              </span>
            </div>
            <div className="mt-2 flex gap-2">
              {product.colorOptions.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setActiveColor(c)}
                  aria-label={c.name}
                  aria-pressed={activeColor.hex === c.hex}
                  title={c.name}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full ring-1 ring-inset ring-black/10 transition-all",
                    activeColor.hex === c.hex &&
                      "ring-2 ring-[var(--gold)] ring-offset-2 ring-offset-background"
                  )}
                  style={{ backgroundColor: c.hex }}
                >
                  {activeColor.hex === c.hex ? (
                    <Check className="size-4 text-white drop-shadow" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Size</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setActiveSize(s)}
                  aria-pressed={activeSize === s}
                  className={cn(
                    "inline-flex h-11 min-w-12 items-center justify-center rounded-md border px-3 text-sm font-medium transition-all",
                    activeSize === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:border-foreground/40"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity + actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex h-12 items-center rounded-full border">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="inline-flex size-10 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-10 text-center text-sm tabular-nums">{qty}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQty((q) => q + 1)}
                className="inline-flex size-10 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <Button
              onClick={onAddToCart}
              disabled={outOfStock}
              className="h-12 flex-1 rounded-full text-sm font-medium uppercase tracking-wider"
            >
              <ShoppingBag className="size-4" />
              {outOfStock ? "Out of Stock" : "Add to Bag"}
            </Button>
            <Button
              onClick={onBuyNow}
              disabled={outOfStock}
              variant="outline"
              className="h-12 rounded-full border-[var(--gold)] text-[var(--gold)] hover:bg-[var(--gold)]/10 hover:text-[var(--gold)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="size-4" />
              Buy Now
            </Button>
            <Button
              variant="outline"
              onClick={onWishlist}
              aria-pressed={wished}
              className={cn(
                "h-12 rounded-full border-border px-4",
                wished && "border-[var(--gold)] text-[var(--gold)]"
              )}
            >
              <Heart className={cn("size-4", wished && "fill-current")} />
            </Button>
          </div>

          {/* Stock status */}
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border p-3 text-sm",
              outOfStock
                ? "border-destructive/30 bg-destructive/5 text-destructive"
                : lowStock
                  ? "border-[var(--gold)]/30 bg-[var(--gold)]/5 text-[var(--gold)]"
                  : "border-green-500/20 bg-green-500/5 text-green-700"
            )}
          >
            {outOfStock
              ? "Out of Stock — pre-order available"
              : lowStock
                ? `Only ${stockQty} left in stock — order soon`
                : "In Stock — ready to ship"}
          </div>

          <TrustBadges />

          {/* Product information accordions */}
          <Accordion
            type="single"
            collapsible
            defaultValue="description"
            className="w-full"
          >
            <AccordionItem value="description">
              <AccordionTrigger className="text-sm font-medium">
                Description
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="fabric-care">
              <AccordionTrigger className="text-sm font-medium">
                Fabric &amp; Care
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                <ul className="space-y-2">
                  <li>
                    <span className="font-medium text-foreground">Fabric:</span>{" "}
                    {product.fabric}
                  </li>
                  <li>
                    <span className="font-medium text-foreground">Care:</span>{" "}
                    {product.care}
                  </li>
                  <li>
                    <span className="font-medium text-foreground">SKU:</span>{" "}
                    LM-{product.id.toUpperCase()}
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="size-fit">
              <AccordionTrigger className="text-sm font-medium">
                Size &amp; Fit
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                <p>
                  Our abayas are designed for a flowing, modest fit. For a
                  relaxed silhouette, consider sizing up. Measurements are of
                  the garment, not the body — allow ±2cm tolerance.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="shipping">
              <AccordionTrigger className="text-sm font-medium">
                Shipping &amp; Returns
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                <ul className="space-y-2">
                  <li>
                    <span className="font-medium text-foreground">
                      Free shipping:
                    </span>{" "}
                    on all orders over PKR 10,000 across Pakistan.
                  </li>
                  <li>
                    <span className="font-medium text-foreground">
                      Dispatch:
                    </span>{" "}
                    within 1–2 business days.
                  </li>
                  <li>
                    <span className="font-medium text-foreground">
                      Delivery:
                    </span>{" "}
                    3–5 business days nationwide.
                  </li>
                  <li>
                    <span className="font-medium text-foreground">Returns:</span>{" "}
                    accepted within 7 days in original, unworn condition.
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Related — smart Recommendations */}
      <Recommendations currentSlug={product.id} fallbackProducts={related} />

      {/* Reviews */}
      <ProductReviews productSlug={product.id} />

      {/* Back to shop */}
      <div className="mt-12 flex justify-center">
        <Button asChild variant="outline" className="rounded-full">
          <Link href={`/#${categoryHref.slice(1)}`}>
            <ChevronLeft className="size-4" />
            Back to {product.category}
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default ProductDetail;
