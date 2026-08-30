"use client";

import * as React from "react";
import Link from "next/link";
import {
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Loader2,
  Search,
  MapPin,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/format";

type OrderData = {
  number: string;
  status: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal: string;
  payment: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  promoCode: string | null;
  createdAt: string;
  items: Array<{
    name: string;
    image: string;
    price: number;
    qty: number;
    colorName: string;
    size: string;
    productId: string;
  }>;
};

const STATUS_STEPS = [
  { key: "processing", label: "Processing", icon: ShoppingBag, desc: "Your order is being prepared with care" },
  { key: "shipped", label: "Shipped", icon: Truck, desc: "Your abaya is on its way" },
  { key: "delivered", label: "Delivered", icon: CheckCircle2, desc: "Your order has arrived" },
];

function getStatusIndex(status: string): number {
  if (status === "cancelled") return -1;
  return STATUS_STEPS.findIndex((s) => s.key === status);
}

function OrderTracking({ order }: { order: OrderData }) {
  const statusIdx = getStatusIndex(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="eyebrow text-[var(--gold)]">Order Tracking</span>
        <h1 className="font-serif text-3xl font-medium sm:text-4xl">
          {isCancelled ? "Order Cancelled" : "Track Your Order"}
        </h1>
        <p className="font-mono text-sm text-muted-foreground">{order.number}</p>
        <p className="text-sm text-muted-foreground">
          Placed on{" "}
          {new Date(order.createdAt).toLocaleDateString("en-PK", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Status timeline */}
      {!isCancelled ? (
        <div className="mt-10 rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, i) => {
              const Icon = step.icon;
              const done = i <= statusIdx;
              const active = i === statusIdx;
              return (
                <React.Fragment key={step.key}>
                  <div className="flex flex-col items-center gap-2">
                    <span
                      className={cn(
                        "flex size-12 items-center justify-center rounded-full border-2 transition-all sm:size-14",
                        done
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground",
                        active && "ring-4 ring-primary/15"
                      )}
                    >
                      <Icon className="size-5 sm:size-6" />
                    </span>
                    <span
                      className={cn(
                        "text-center text-xs font-medium uppercase tracking-wider sm:text-sm",
                        done ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                    <span className="hidden max-w-[120px] text-center text-[0.7rem] text-muted-foreground sm:block">
                      {step.desc}
                    </span>
                  </div>
                  {i < STATUS_STEPS.length - 1 ? (
                    <div className="mx-1 h-1 flex-1 overflow-hidden rounded-full bg-secondary sm:mx-2">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          i < statusIdx ? "bg-primary" : "bg-transparent"
                        )}
                        style={{ width: i < statusIdx ? "100%" : "0%" }}
                      />
                    </div>
                  ) : null}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <XCircle className="size-12 text-destructive" />
          <p className="font-serif text-xl">This order has been cancelled</p>
          <p className="text-sm text-muted-foreground">
            If you have questions about this cancellation, please contact us.
          </p>
        </div>
      )}

      {/* Order items */}
      <div className="mt-8">
        <h2 className="eyebrow text-[var(--mocha)]">Items in this order</h2>
        <ul className="mt-4 space-y-3">
          {order.items.map((it, i) => (
            <li
              key={i}
              className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm"
            >
              <Link
                href={`/product/${it.productId}`}
                className="size-16 flex-none overflow-hidden rounded-md border bg-secondary"
              >
                <img
                  src={it.image}
                  alt={it.name}
                  className="h-full w-full object-cover"
                />
              </Link>
              <div className="flex-1">
                <Link
                  href={`/product/${it.productId}`}
                  className="font-serif text-sm font-medium hover:text-[var(--gold)]"
                >
                  {it.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {it.colorName} · Size {it.size} · Qty {it.qty}
                </p>
              </div>
              <span className="font-serif text-sm font-semibold">
                {formatPKR(it.price * it.qty)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Order summary grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {/* Shipping */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-[var(--gold)]" />
            <h3 className="eyebrow text-[var(--mocha)]">Shipping Address</h3>
          </div>
          <div className="mt-3 space-y-0.5 text-sm">
            <p className="font-medium">{order.fullName}</p>
            <p className="text-muted-foreground">{order.address}</p>
            <p className="text-muted-foreground">
              {order.city}, {order.province} {order.postal}
            </p>
            <p className="text-muted-foreground">{order.phone}</p>
            <p className="text-muted-foreground">{order.email}</p>
          </div>
        </div>

        {/* Payment */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <CreditCard className="size-4 text-[var(--gold)]" />
            <h3 className="eyebrow text-[var(--mocha)]">Payment & Total</h3>
          </div>
          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPKR(order.subtotal)}</span>
            </div>
            {order.discount > 0 ? (
              <div className="flex justify-between text-[var(--gold)]">
                <span>Discount{order.promoCode ? ` (${order.promoCode})` : ""}</span>
                <span>−{formatPKR(order.discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{order.shipping === 0 ? "Free" : formatPKR(order.shipping)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t pt-2">
              <span className="font-serif font-medium">Total</span>
              <span className="font-serif text-lg font-semibold">{formatPKR(order.total)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Payment:{" "}
              <span className="font-medium">
                {order.payment === "cod"
                  ? "Cash on Delivery"
                  : order.payment === "bank_transfer"
                    ? "JazzCash / Bank Transfer"
                    : "Online Payment"}
              </span>
              {" · "}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[0.6rem] font-medium capitalize",
                  order.paymentStatus === "paid"
                    ? "bg-green-500/15 text-green-700"
                    : order.paymentStatus === "pending"
                      ? "bg-amber-500/15 text-amber-700"
                      : order.paymentStatus === "failed"
                        ? "bg-red-500/15 text-red-700"
                        : "bg-secondary text-muted-foreground"
                )}
              >
                {order.paymentStatus}
              </span>
            </p>
            {/* Customer-facing payment status message */}
            {order.payment === "bank_transfer" ? (
              <div className="mt-3 rounded-md border bg-secondary/30 p-2.5 text-xs">
                {order.paymentStatus === "pending" ? (
                  <p className="text-amber-700">
                    Your payment is awaiting verification. Our team will confirm your payment shortly.
                  </p>
                ) : order.paymentStatus === "paid" ? (
                  <p className="text-green-700">
                    Payment verified successfully. Your order is being processed.
                  </p>
                ) : order.paymentStatus === "failed" ? (
                  <p className="text-destructive">
                    Payment could not be verified. Please contact ShafaQ Atelier.
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Payment status: <span className="capitalize">{order.paymentStatus}</span>.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Status badge */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <span className="text-sm text-muted-foreground">Current status:</span>
        <Badge
          className={cn(
            "capitalize",
            order.status === "processing" && "bg-blue-500/15 text-blue-700",
            order.status === "shipped" && "bg-amber-500/15 text-amber-700",
            order.status === "delivered" && "bg-green-500/15 text-green-700",
            order.status === "cancelled" && "bg-red-500/15 text-red-700"
          )}
        >
          {order.status}
        </Badge>
      </div>

      <div className="mt-8 flex justify-center">
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/">
            <Package className="size-4" /> Continue Shopping
          </Link>
        </Button>
      </div>
    </div>
  );
}

function OrderNotFound({ number }: { number: string }) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <XCircle className="size-8" />
      </span>
      <div>
        <h1 className="font-serif text-2xl font-medium">Order not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We couldn&apos;t find an order with number{" "}
          <span className="font-mono">{number}</span>.
        </p>
      </div>
      <Button asChild className="rounded-full">
        <Link href="/">Back to Store</Link>
      </Button>
    </div>
  );
}

function OrderLookup() {
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [order, setOrder] = React.useState<OrderData | null>(null);
  const [notFound, setNotFound] = React.useState(false);

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setNotFound(false);
    setOrder(null);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(query.trim())}`);
      const data = (await res.json()) as { order?: OrderData; error?: string };
      if (res.ok && data.order) {
        setOrder(data.order);
      } else {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="eyebrow text-[var(--gold)]">Order Tracking</span>
        <h1 className="font-serif text-3xl font-medium sm:text-4xl">Track Your Order</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your order number to see its status and delivery details.
        </p>
      </div>
      <form onSubmit={onSearch} className="mt-8 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="LM-XXXXXXXX"
            className="pl-9"
            aria-label="Order number"
          />
        </div>
        <Button type="submit" disabled={loading} className="rounded-full px-6">
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Track"}
        </Button>
      </form>
      {notFound ? (
        <div className="mt-6 rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
          Order not found. Please check your order number and try again.
        </div>
      ) : null}
    </div>
  );
}

export function OrderTrackingPage({
  initialOrder,
  number,
}: {
  initialOrder: OrderData | null;
  number?: string;
}) {
  const [order, setOrder] = React.useState<OrderData | null>(initialOrder);
  const [notFound, setNotFound] = React.useState(false);

  // If no initial order (e.g. accessed via /track without number), show lookup
  if (!initialOrder && !number) {
    return <OrderLookup />;
  }

  if (!order) {
    return <OrderNotFound number={number || ""} />;
  }

  return <OrderTracking order={order} />;
}

export default OrderTrackingPage;
