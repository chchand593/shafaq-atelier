"use client";

import * as React from "react";
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
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { PRODUCTS, type Product } from "@/lib/site-data";
import { formatPKR } from "@/lib/format";
import { toast } from "sonner";
import { ProductCard } from "@/components/site/product-card";

// Gallery uses one source image with a few framing variants to feel like a lookbook.
const FRAMINGS = [
  { label: "Full", pos: "center" as const, zoom: "100%" as const },
  { label: "Detail", pos: "top" as const, zoom: "150%" as const },
  { label: "Hem", pos: "bottom" as const, zoom: "150%" as const },
];

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

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-3.5",
            i < Math.round(rating)
              ? "fill-[var(--gold)] text-[var(--gold)]"
              : "text-muted-foreground/40"
          )}
        />
      ))}
    </div>
  );
}

function QuickViewInner({ product }: { product: Product }) {
  const { closeQuickView } = useUI();
  const addToCart = useCart((s) => s.add);
  const { toggle, ids } = useWishlist();
  const pushRecentlyViewed = useRecentlyViewed((s) => s.push);

  const [activeColor, setActiveColor] = React.useState(product.colorOptions[0]);
  const [activeSize, setActiveSize] = React.useState<string | null>(null);
  const [qty, setQty] = React.useState(1);
  const [framing, setFraming] = React.useState(0);

  // reset selections when product changes
  React.useEffect(() => {
    setActiveColor(product.colorOptions[0]);
    setActiveSize(null);
    setQty(1);
    setFraming(0);
  }, [product.id]);

  // track recently viewed whenever a new product is opened
  React.useEffect(() => {
    pushRecentlyViewed(product.id);
  }, [product.id, pushRecentlyViewed]);

  const wished = ids.includes(product.id);

  const onAddToCart = () => {
    if (!activeSize) {
      toast.error("Please select a size", {
        description: "Choose your size to add this abaya to your bag.",
      });
      return;
    }
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      color: activeColor.hex,
      colorName: activeColor.name,
      size: activeSize,
      qty,
    });
    toast.success("Added to your bag", {
      description: `${product.name} · ${activeColor.name} · Size ${activeSize}`,
    });
    closeQuickView();
  };

  const onWishlist = () => {
    toggle(product.id);
    toast(wished ? "Removed from wishlist" : "Added to wishlist", {
      description: product.name,
    });
  };

  const related = PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 4);

  return (
    <DialogContent
      className="flex max-h-[92vh] w-full max-w-5xl flex-col gap-0 overflow-hidden rounded-xl border bg-background p-0 sm:max-w-5xl"
      showCloseButton
    >
      <DialogTitle className="sr-only">{product.name}</DialogTitle>
      <DialogDescription className="sr-only">
        Product details for {product.name}
      </DialogDescription>

      <div className="grid flex-1 grid-cols-1 overflow-y-auto elegant-scroll md:grid-cols-2">
        {/* Gallery */}
        <div className="flex flex-col gap-3 bg-secondary/40 p-4 md:p-6">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-secondary">
            {product.badge ? (
              <Badge className="absolute left-3 top-3 z-10 bg-primary text-primary-foreground">
                {product.badge}
              </Badge>
            ) : null}
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition-all duration-500"
              style={{
                objectPosition: FRAMINGS[framing].pos,
                objectFit: "cover",
                transform: `scale(${FRAMINGS[framing].zoom === "150%" ? 1.5 : 1})`,
              }}
            />
          </div>
          <div className="flex gap-2">
            {FRAMINGS.map((f, i) => (
              <button
                key={f.label}
                type="button"
                onClick={() => setFraming(i)}
                aria-label={`View ${f.label} angle`}
                aria-pressed={framing === i}
                className={cn(
                  "relative h-16 flex-1 overflow-hidden rounded-md border bg-secondary transition-all",
                  framing === i
                    ? "border-[var(--gold)] ring-2 ring-[var(--gold)]/30"
                    : "opacity-70 hover:opacity-100"
                )}
              >
                <img
                  src={product.image}
                  alt=""
                  className="h-full w-full object-cover"
                  style={{ objectPosition: f.pos, transform: `scale(${f.zoom === "150%" ? 1.5 : 1})` }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5 p-5 md:p-7">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">
            <a href="#home" className="hover:text-foreground">Home</a>
            <ChevronRight className="size-3" />
            <a href={`#${product.category === "Daily Wear" ? "daily-wear" : product.category === "New Arrivals" ? "new-arrivals" : "best-sellers"}`} className="hover:text-foreground">
              {product.category}
            </a>
            <ChevronRight className="size-3" />
            <span className="text-foreground">{product.name}</span>
          </nav>

          <div>
            <span className="eyebrow text-[var(--gold)]">{product.category}</span>
            <h2 className="mt-1 font-serif text-2xl font-medium leading-tight sm:text-3xl">
              {product.name}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <Stars rating={product.rating} />
              <span className="text-xs text-muted-foreground">
                {product.rating.toFixed(1)} · {product.reviews} reviews
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="font-serif text-2xl font-semibold">
              {formatPKR(product.price)}
            </span>
            {product.originalPrice ? (
              <>
                <span className="text-sm text-muted-foreground line-through">
                  {formatPKR(product.originalPrice)}
                </span>
                <Badge className="bg-[var(--gold)]/15 text-[var(--gold)]">
                  Save {formatPKR(product.originalPrice - product.price)}
                </Badge>
              </>
            ) : null}
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <Separator />

          {/* Colour */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Colour</span>
              <span className="text-sm text-muted-foreground">{activeColor.name}</span>
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
                    "flex size-9 items-center justify-center rounded-full ring-1 ring-inset ring-black/10 transition-all",
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
              <a
                href="/size-guide"
                onClick={() => closeQuickView()}
                className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Size guide
              </a>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setActiveSize(s)}
                  aria-pressed={activeSize === s}
                  className={cn(
                    "inline-flex h-10 min-w-11 items-center justify-center rounded-md border px-3 text-sm font-medium transition-all",
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
          <div className="sticky bottom-0 -mx-5 flex flex-col gap-3 bg-background/95 px-5 pb-3 pt-2 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none sm:flex-row sm:items-center">
            <div className="inline-flex h-11 items-center rounded-full border">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="inline-flex size-9 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center text-sm tabular-nums">{qty}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQty((q) => q + 1)}
                className="inline-flex size-9 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <Plus className="size-4" />
              </button>
            </div>

            <Button
              onClick={onAddToCart}
              className="h-11 flex-1 rounded-full text-sm font-medium uppercase tracking-wider"
            >
              <ShoppingBag className="size-4" />
              Add to Bag
            </Button>
            <Button
              variant="outline"
              onClick={onWishlist}
              aria-pressed={wished}
              className={cn(
                "h-11 rounded-full border-border px-4",
                wished && "border-[var(--gold)] text-[var(--gold)]"
              )}
            >
              <Heart className={cn("size-4", wished && "fill-current")} />
            </Button>
          </div>

          <TrustBadges />

          <Accordion type="single" collapsible defaultValue="details" className="w-full">
            <AccordionItem value="details">
              <AccordionTrigger className="text-sm font-medium">
                Product Details
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                <ul className="space-y-1.5">
                  <li><span className="font-medium text-foreground">Fabric:</span> {product.fabric}</li>
                  <li><span className="font-medium text-foreground">Care:</span> {product.care}</li>
                  <li><span className="font-medium text-foreground">Sku:</span> LM-{product.id.toUpperCase()}</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="shipping">
              <AccordionTrigger className="text-sm font-medium">
                Shipping & Returns
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Free, insured shipping across Pakistan on orders over PKR 10,000.
                Orders are dispatched within 1–2 business days and arrive in 3–5 days.
                Returns accepted within 7 days in original condition.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Related */}
          {related.length > 0 ? (
            <div className="mt-2">
              <h3 className="eyebrow text-[var(--mocha)]">You May Also Like</h3>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {related.slice(0, 2).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </DialogContent>
  );
}

export function QuickView() {
  const { quickView, closeQuickView } = useUI();
  const open = quickView !== null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeQuickView()}>
      {quickView ? <QuickViewInner product={quickView} /> : null}
    </Dialog>
  );
}

export default QuickView;
