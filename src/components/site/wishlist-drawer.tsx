"use client";

import * as React from "react";
import { Heart, Trash2, ShoppingBag, X, ArrowRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useUI, useWishlist, useCart } from "@/lib/store";
import { PRODUCTS } from "@/lib/site-data";
import { formatPKR } from "@/lib/format";
import { toast } from "sonner";

function EmptyState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-[var(--mocha)]">
        <Heart className="size-7" />
      </span>
      <div>
        <h3 className="font-serif text-xl font-medium">Your wishlist is empty</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Tap the heart on any abaya to save it here for later.
        </p>
      </div>
      <Button asChild className="rounded-full px-6">
        <a href="#daily-wear" onClick={onClose}>
          Discover Abayas
        </a>
      </Button>
    </div>
  );
}

export function WishlistDrawer() {
  const { wishlistOpen, setWishlistOpen, openQuickView } = useUI();
  const { ids, toggle, clear } = useWishlist();
  const addToCart = useCart((s) => s.add);
  const setCartOpen = useUI((s) => s.setCartOpen);

  const items = React.useMemo(
    () =>
      ids
        .map((id) => PRODUCTS.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p)),
    [ids]
  );

  const onMoveToCart = (product: (typeof PRODUCTS)[number]) => {
    // default to first colour and a medium size for quick-add
    const color = product.colorOptions[0];
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      color: color.hex,
      colorName: color.name,
      size: "M",
      qty: 1,
    });
    toggle(product.id);
    toast.success("Moved to your bag", {
      description: `${product.name} · Size M (change in bag)`,
    });
  };

  const onView = (product: (typeof PRODUCTS)[number]) => {
    setWishlistOpen(false);
    openQuickView(product);
  };

  return (
    <Sheet open={wishlistOpen} onOpenChange={setWishlistOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-l bg-background p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="flex items-center justify-between font-serif text-lg">
            <span>
              Wishlist
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({items.length})
              </span>
            </span>
            {items.length > 0 ? (
              <button
                type="button"
                onClick={clear}
                className="text-xs font-normal uppercase tracking-wider text-muted-foreground transition-colors hover:text-destructive"
              >
                Clear all
              </button>
            ) : null}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Review the abayas you have saved to your wishlist
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <EmptyState onClose={() => setWishlistOpen(false)} />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto elegant-scroll px-5 py-4">
              <ul className="space-y-4">
                {items.map((product) => (
                  <li key={product.id} className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => onView(product)}
                      className="size-24 flex-none overflow-hidden rounded-md border bg-secondary"
                      aria-label={`View ${product.name}`}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </button>
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-serif text-sm font-medium leading-tight">
                            {product.name}
                          </h4>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {product.category}
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${product.name}`}
                          onClick={() => toggle(product.id)}
                          className="text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="font-serif text-sm font-semibold">
                          {formatPKR(product.price)}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-full px-3 text-xs hover:border-[var(--gold)] hover:text-[var(--gold)]"
                          onClick={() => onMoveToCart(product)}
                        >
                          <ShoppingBag className="size-3.5" />
                          Move to Bag
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t bg-background px-5 py-4">
              <Button
                onClick={() => {
                  setWishlistOpen(false);
                  setCartOpen(true);
                }}
                className="h-11 w-full rounded-full text-sm font-medium uppercase tracking-wider"
              >
                View Shopping Bag
                <ArrowRight className="ml-1 size-4" />
              </Button>
              <button
                type="button"
                onClick={() => setWishlistOpen(false)}
                className="mt-2 flex w-full items-center justify-center gap-1 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-3" /> Continue shopping
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default WishlistDrawer;
