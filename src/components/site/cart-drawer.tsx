"use client";

import * as React from "react";
import {
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
  ArrowRight,
  Truck,
  Tag,
  Check,
  Gift,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  useCart,
  useUI,
  usePromo,
  cartCount,
  cartSubtotal,
  promoDiscount,
  shippingCost,
  FREE_SHIPPING_THRESHOLD,
} from "@/lib/store";
import { formatPKR } from "@/lib/format";
import { PRODUCTS } from "@/lib/site-data";
import { toast } from "sonner";

function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const qualified = remaining === 0;

  return (
    <div className="rounded-lg border bg-secondary/60 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Truck className="size-4 text-[var(--gold)]" />
        {qualified ? (
          <span className="font-medium text-foreground">
            You’ve unlocked free shipping
          </span>
        ) : (
          <span>
            Add <span className="font-medium text-foreground">{formatPKR(remaining)}</span>{" "}
            more for free shipping
          </span>
        )}
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background">
        <div
          className="h-full rounded-full bg-[var(--gold)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function PromoCodeInput() {
  const { applied, apply, remove } = usePromo();
  const [code, setCode] = React.useState("");

  const onApply = () => {
    if (!code.trim()) return;
    const result = apply(code);
    if (result) {
      toast.success("Promo applied", {
        description: `${result.label} (${result.code})`,
      });
      setCode("");
    } else {
      toast.error("Invalid promo code", {
        description: "Try WELCOME10, ATELIER500 or EID15.",
      });
    }
  };

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-3">
        <span className="flex items-center gap-2 text-sm">
          <Tag className="size-4 text-[var(--gold)]" />
          <span className="font-medium">{applied.code}</span>
          <span className="text-muted-foreground">· {applied.label}</span>
        </span>
        <button
          type="button"
          aria-label="Remove promo code"
          onClick={() => {
            remove();
            toast("Promo removed");
          }}
          className="text-muted-foreground transition-colors hover:text-destructive"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-2">
      <div className="flex items-center gap-2">
        <Tag className="ml-1 size-4 text-muted-foreground" />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onApply()}
          placeholder="Promo code"
          aria-label="Promo code"
          className="h-8 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onApply}
          className="h-8 rounded-full px-3 text-xs hover:border-[var(--gold)] hover:text-[var(--gold)]"
        >
          Apply
        </Button>
      </div>
      <p className="mt-1.5 px-1 text-[0.65rem] text-muted-foreground">
        Try <span className="font-medium">WELCOME10</span> for 10% off
      </p>
    </div>
  );
}

function GiftCardInput({
  onApplied,
  appliedAmount,
}: {
  onApplied: (amount: number, code: string) => void;
  appliedAmount: number;
}) {
  const [code, setCode] = React.useState("");
  const [checking, setChecking] = React.useState(false);

  const onCheck = async () => {
    if (!code.trim()) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/gift-cards?code=${encodeURIComponent(code.trim())}`);
      const data = (await res.json()) as { balance?: number; error?: string };
      if (!res.ok) {
        toast.error(data.error || "Gift card not found");
        return;
      }
      onApplied(data.balance || 0, code.trim().toUpperCase());
      toast.success("Gift card applied", {
        description: `Balance: ${formatPKR(data.balance || 0)}`,
      });
      setCode("");
    } catch {
      toast.error("Failed to check gift card");
    } finally {
      setChecking(false);
    }
  };

  if (appliedAmount > 0) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-3">
        <span className="flex items-center gap-2 text-sm">
          <Gift className="size-4 text-[var(--gold)]" />
          <span className="font-medium">Gift card applied</span>
          <span className="text-muted-foreground">−{formatPKR(appliedAmount)}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-2">
      <div className="flex items-center gap-2">
        <Gift className="ml-1 size-4 text-muted-foreground" />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onCheck()}
          placeholder="Gift card code"
          aria-label="Gift card code"
          className="h-8 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onCheck}
          disabled={checking}
          className="h-8 rounded-full px-3 text-xs hover:border-[var(--gold)] hover:text-[var(--gold)]"
        >
          {checking ? "…" : "Apply"}
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-[var(--mocha)]">
        <ShoppingBag className="size-7" />
      </span>
      <div>
        <h3 className="font-serif text-xl font-medium">Your cart is empty</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Discover abayas crafted with elegance and grace.
        </p>
      </div>
      <Button asChild className="rounded-full px-6">
        <a href="#daily-wear" onClick={onClose}>
          Start Shopping
        </a>
      </Button>
    </div>
  );
}

export function CartDrawer() {
  const { cartOpen, setCartOpen, setCheckoutOpen } = useUI();
  const { lines, remove, setQty } = useCart();
  const promo = usePromo((s) => s.applied);
  const [giftCardAmount, setGiftCardAmount] = React.useState(0);

  const count = cartCount(lines);
  const subtotal = cartSubtotal(lines);
  const discount = promoDiscount(subtotal, promo);
  const afterPromo = Math.max(0, subtotal - discount);
  const shipping = shippingCost(afterPromo, count);
  const giftCardApplied = Math.min(giftCardAmount, afterPromo + shipping);
  const total = Math.max(0, afterPromo + shipping - giftCardApplied);

  const onCheckout = () => {
    // Validate stock for catalog products before checkout
    for (const line of lines) {
      // Custom abayas don't have stock limits
      if (line.productId.startsWith("custom-")) continue;
      // Check against static product data for client-side pre-validation
      const product = PRODUCTS.find((p) => p.id === line.productId);
      if (product?.stock !== undefined) {
        if (product.stock <= 0) {
          toast.error(`${line.name} is out of stock`);
          return;
        }
        if (product.stock < line.qty) {
          toast.error(`${line.name}: only ${product.stock} left in stock`);
          return;
        }
      }
    }
    setCartOpen(false);
    setTimeout(() => setCheckoutOpen(true), 200);
  };

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-l bg-background p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="flex items-center justify-between font-serif text-lg">
            <span>
              Shopping Bag
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({count})
              </span>
            </span>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Review the items in your shopping bag
          </SheetDescription>
        </SheetHeader>

        {lines.length === 0 ? (
          <EmptyState onClose={() => setCartOpen(false)} />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto elegant-scroll px-5 py-4">
              <FreeShippingBar subtotal={subtotal} />

              <ul className="mt-4 space-y-4">
                {lines.map((line) => (
                  <li key={line.key} className="flex gap-3">
                    <div className="size-20 flex-none overflow-hidden rounded-md border bg-secondary">
                      <img
                        src={line.image}
                        alt={line.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-serif text-sm font-medium leading-tight">
                            {line.name}
                          </h4>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {line.colorName} · Size {line.size}
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${line.name}`}
                          onClick={() => remove(line.key)}
                          className="text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="inline-flex items-center rounded-full border">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            className="inline-flex size-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                            onClick={() => setQty(line.key, line.qty - 1)}
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-7 text-center text-sm tabular-nums">
                            {line.qty}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            className="inline-flex size-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                            onClick={() => setQty(line.key, line.qty + 1)}
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                        <span className="font-serif text-sm font-semibold">
                          {formatPKR(line.price * line.qty)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-4 space-y-2">
                <PromoCodeInput />
                <GiftCardInput
                  onApplied={(amt) => setGiftCardAmount(amt)}
                  appliedAmount={giftCardApplied}
                />
              </div>
            </div>

            <div className="border-t bg-background px-5 py-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPKR(subtotal)}</span>
                </div>
                {discount > 0 ? (
                  <div className="flex items-center justify-between text-[var(--gold)]">
                    <span className="flex items-center gap-1.5">
                      <Check className="size-3.5" /> Discount
                    </span>
                    <span>−{formatPKR(discount)}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? "Free" : formatPKR(shipping)}
                  </span>
                </div>
                {giftCardApplied > 0 ? (
                  <div className="flex items-center justify-between text-[var(--gold)]">
                    <span className="flex items-center gap-1.5">
                      <Gift className="size-3.5" /> Gift Card
                    </span>
                    <span>−{formatPKR(giftCardApplied)}</span>
                  </div>
                ) : null}
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between">
                <span className="font-serif text-base font-medium">Total</span>
                <span className="font-serif text-xl font-semibold">
                  {formatPKR(total)}
                </span>
              </div>
              <Button
                onClick={onCheckout}
                className="mt-3 h-12 w-full rounded-full text-sm font-medium uppercase tracking-wider"
              >
                Proceed to Checkout
                <ArrowRight className="ml-1 size-4" />
              </Button>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
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

export default CartDrawer;
