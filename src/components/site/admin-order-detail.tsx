"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Ruler,
  Sparkles,
  Printer,
  Download,
  Check,
  X,
  ShieldCheck,
  Building2,
  Wallet,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/format";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  processing: "bg-blue-500/15 text-blue-700",
  confirmed: "bg-indigo-500/15 text-indigo-700",
  shipped: "bg-amber-500/15 text-amber-700",
  delivered: "bg-green-500/15 text-green-700",
  cancelled: "bg-red-500/15 text-red-700",
  returned: "bg-purple-500/15 text-purple-700",
};

const PAYMENT_COLORS: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700",
  paid: "bg-green-500/15 text-green-700",
  failed: "bg-red-500/15 text-red-700",
  refunded: "bg-blue-500/15 text-blue-700",
};

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  cod: "bg-secondary text-foreground",
  bank_transfer: "bg-[var(--gold)]/15 text-[var(--mocha)]",
  online: "bg-indigo-500/15 text-indigo-700",
};

const ORDER_STATUSES = ["processing", "confirmed", "shipped", "delivered", "cancelled", "returned"];
const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];

function getPaymentMethodLabel(method: string): string {
  if (method === "cod") return "Cash on Delivery";
  if (method === "bank_transfer") return "JazzCash / Bank Transfer";
  if (method === "online") return "Online Payment";
  return method;
}

type OrderItem = {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  qty: number;
  color: string;
  colorName: string;
  size: string;
  isCustom: boolean;
};

type OrderDetail = {
  id: string;
  number: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal: string;
  notes: string | null;
  payment: string;
  paymentStatus: string;
  paymentProvider: string | null;
  paymentReference: string | null;
  paymentScreenshotPath: string | null;
  paidAt: string | null;
  paymentFailureReason: string | null;
  paymentVerifiedById: string | null;
  paymentVerifiedAt: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  promoCode: string | null;
  status: string;
  createdAt: string;
  items: OrderItem[];
};

// Parse custom abaya measurements from the "size" field
// Format: "Custom (height: 165, bust: 94, waist: 76, ...)"
function parseCustomMeasurements(sizeField: string): Record<string, string> | null {
  const match = sizeField.match(/Custom\s*\((.*)\)/);
  if (!match) return null;
  const measurements: Record<string, string> = {};
  match[1].split(", ").forEach((pair) => {
    const [key, val] = pair.split(": ");
    if (key && val) measurements[key.trim()] = val.trim();
  });
  return Object.keys(measurements).length > 0 ? measurements : null;
}

export function AdminOrderDetail({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = React.useState<OrderDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [updating, setUpdating] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectNote, setRejectNote] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderNumber}`);
      const d = (await res.json()) as { order: OrderDetail };
      setOrder(d.order || null);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (status: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { stockRestored?: boolean };
      if (data.stockRestored) {
        toast.success("Order status updated", {
          description: `${status} — stock restored for catalog products.`,
        });
      } else {
        toast.success("Order status updated", { description: status });
      }
      void load();
    } catch {
      toast.error("Failed to update order status");
    } finally {
      setUpdating(false);
    }
  };

  // --- Payment verification (admin-only) ---
  const verifyPayment = async () => {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "paid" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Payment verified", {
        description: "Payment marked as paid. Order will proceed.",
      });
      void load();
    } catch {
      toast.error("Failed to verify payment");
    } finally {
      setUpdating(false);
    }
  };

  const rejectPayment = async () => {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentStatus: "failed",
          paymentNote: rejectNote.trim() || "Payment rejected by admin.",
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Payment rejected", {
        description: "Customer has been notified of the rejected payment.",
      });
      setRejectOpen(false);
      setRejectNote("");
      void load();
    } catch {
      toast.error("Failed to reject payment");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-w-0 px-4 py-8 text-center">
        <p className="font-serif text-xl">Order not found.</p>
        <Button asChild className="mt-4 rounded-full">
          <Link href="/admin/orders"><ArrowLeft className="size-4" /> Back to Orders</Link>
        </Button>
      </div>
    );
  }

  const isBankTransfer = order.payment === "bank_transfer";
  const showVerifyReject =
    isBankTransfer && order.paymentStatus === "pending";

  return (
    <div className="min-w-0 px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Orders
      </Link>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-medium">{order.number}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => window.print()}
            variant="outline"
            size="sm"
            className="rounded-full"
          >
            <Printer className="size-4" />
            Print Invoice
          </Button>
          <span className={cn("rounded-full px-3 py-1 text-xs font-medium capitalize", STATUS_COLORS[order.status] || "bg-secondary")}>
            {order.status}
          </span>
          <span className={cn("rounded-full px-3 py-1 text-xs font-medium capitalize", PAYMENT_COLORS[order.paymentStatus] || "bg-secondary")}>
            {order.paymentStatus}
          </span>
        </div>
      </div>

      {/* Payment method banner */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", PAYMENT_METHOD_COLORS[order.payment] || "bg-secondary")}>
          {order.payment === "bank_transfer" ? (
            <Building2 className="size-3.5" />
          ) : order.payment === "cod" ? (
            <Wallet className="size-3.5" />
          ) : (
            <CreditCard className="size-3.5" />
          )}
          {getPaymentMethodLabel(order.payment)}
        </span>
        {order.paymentReference ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-secondary/40 px-3 py-1 text-xs font-mono">
            Ref: {order.paymentReference}
          </span>
        ) : null}
        <span className="font-serif text-lg font-semibold">{formatPKR(order.total)}</span>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Customer info */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="eyebrow text-[var(--mocha)]">Customer Information</h3>
          <div className="mt-3 space-y-1.5 text-sm">
            <p><span className="text-muted-foreground">Name:</span> {order.fullName}</p>
            <p><span className="text-muted-foreground">Email:</span> {order.email}</p>
            <p><span className="text-muted-foreground">Phone:</span> {order.phone}</p>
          </div>
          <div className="mt-4 border-t pt-3">
            <h4 className="eyebrow text-[var(--mocha)]">Delivery Address</h4>
            <div className="mt-2 space-y-0.5 text-sm text-muted-foreground">
              <p>{order.address}</p>
              <p>{order.city}, {order.province} {order.postal}</p>
            </div>
          </div>
          {order.notes ? (
            <div className="mt-4 border-t pt-3">
              <h4 className="eyebrow text-[var(--mocha)]">Order Notes</h4>
              <p className="mt-1 text-sm text-muted-foreground">{order.notes}</p>
            </div>
          ) : null}
        </div>

        {/* Payment + totals */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="eyebrow text-[var(--mocha)]">Payment & Totals</h3>
          <div className="mt-3 space-y-1.5 text-sm">
            <p><span className="text-muted-foreground">Method:</span> <span className="font-medium">{getPaymentMethodLabel(order.payment)}</span></p>
            <p><span className="text-muted-foreground">Payment Status:</span> <span className="font-medium capitalize">{order.paymentStatus}</span></p>
            {order.paymentProvider ? <p><span className="text-muted-foreground">Provider:</span> <span className="capitalize">{order.paymentProvider}</span></p> : null}
            {order.paymentReference ? (
              <p><span className="text-muted-foreground">Reference:</span> <span className="font-mono text-xs break-all">{order.paymentReference}</span></p>
            ) : null}
            {order.paidAt ? <p><span className="text-muted-foreground">Paid at:</span> {new Date(order.paidAt).toLocaleDateString("en-PK")}</p> : null}
            {order.paymentFailureReason ? <p className="text-destructive"><span className="text-muted-foreground">Failure:</span> {order.paymentFailureReason}</p> : null}
            {order.paymentVerifiedAt ? (
              <p className="text-muted-foreground">
                <span>Last verified:</span> {new Date(order.paymentVerifiedAt).toLocaleDateString("en-PK")}
              </p>
            ) : null}
          </div>
          <div className="mt-4 space-y-1.5 border-t pt-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPKR(order.subtotal)}</span></div>
            {order.discount > 0 ? <div className="flex justify-between text-[var(--gold)]"><span>Discount{order.promoCode ? ` (${order.promoCode})` : ""}</span><span>−{formatPKR(order.discount)}</span></div> : null}
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{order.shipping === 0 ? "Free" : formatPKR(order.shipping)}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="font-serif font-medium">Total</span><span className="font-serif text-lg font-semibold">{formatPKR(order.total)}</span></div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="mt-6">
        <h3 className="eyebrow text-[var(--mocha)]">Order Items</h3>
        <div className="mt-3 space-y-3">
          {order.items.map((it) => {
            const measurements = it.isCustom ? parseCustomMeasurements(it.size) : null;
            return (
              <div key={it.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex gap-4">
                  <div className="size-16 flex-none overflow-hidden rounded-md border bg-secondary">
                    <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-serif text-base font-medium">{it.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {it.isCustom ? (
                            <span className="inline-flex items-center gap-1">
                              <Sparkles className="size-3 text-[var(--gold)]" /> Custom Abaya
                            </span>
                          ) : (
                            <>
                              {it.colorName} · Size {it.size} · Qty {it.qty}
                            </>
                          )}
                        </p>
                      </div>
                      <span className="font-serif font-semibold">{formatPKR(it.price * it.qty)}</span>
                    </div>

                    {/* Customized Abaya — Production Details */}
                    {it.isCustom ? (
                      <div className="mt-3 rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-4">
                        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--gold)]">
                          <Sparkles className="size-3.5" />
                          Customized Abaya — Production Details
                        </p>

                        {/* Measurements */}
                        {measurements ? (
                          <div className="mt-3">
                            <p className="text-[0.65rem] uppercase tracking-wider text-[var(--mocha)]">Measurements (cm)</p>
                            <div className="mt-2 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                              {Object.entries(measurements).map(([key, val]) => (
                                <div key={key} className="flex flex-col border-b border-[var(--gold)]/10 pb-1.5">
                                  <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{key}</span>
                                  <span className="text-sm font-medium">{val}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {/* Config summary */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full border border-[var(--gold)]/20 bg-background px-3 py-1 text-xs">
                            Color: {it.colorName}
                          </span>
                          <span className="rounded-full border border-[var(--gold)]/20 bg-background px-3 py-1 text-xs">
                            Qty: {it.qty}
                          </span>
                          <span className="rounded-full border border-[var(--gold)]/20 bg-background px-3 py-1 text-xs">
                            Custom Price: {formatPKR(it.price)}
                          </span>
                          <span className="rounded-full border border-[var(--gold)]/20 bg-background px-3 py-1 text-xs">
                            Made-to-Order (No Stock)
                          </span>
                        </div>

                        {/* Reference image */}
                        {it.image ? (
                          <div className="mt-3">
                            <p className="text-[0.65rem] uppercase tracking-wider text-[var(--mocha)]">Reference Image</p>
                            <div className="mt-2 inline-block">
                              <img
                                src={it.image}
                                alt="Custom abaya reference"
                                className="max-h-32 rounded-md border border-[var(--gold)]/20 object-cover"
                              />
                            </div>
                          </div>
                        ) : null}

                        {/* Raw size field for any special instructions */}
                        {it.size && it.size.length > 0 && !measurements ? (
                          <p className="mt-3 text-xs text-muted-foreground">{it.size}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment verification section — only for manual bank_transfer with pending payment */}
      {showVerifyReject ? (
        <div className="mt-6 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-serif text-lg font-medium">
            <ShieldCheck className="size-5 text-[var(--gold)]" />
            Payment Verification
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            The customer paid via JazzCash / Bank Transfer and submitted this reference ID. Verify the payment against your bank account / JazzCash wallet statement before marking as paid.
          </p>
          <div className="mt-4 rounded-md border bg-background p-3 text-sm">
            <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">Customer-supplied reference</p>
            <p className="mt-1 break-all font-mono text-base font-medium">
              {order.paymentReference || "—"}
            </p>
          </div>
          {rejectOpen ? (
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Rejection reason (optional)
                </span>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="e.g. Transaction ID not found in our records"
                  maxLength={500}
                  rows={2}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={rejectPayment}
                  disabled={updating}
                  className="rounded-full bg-destructive text-white hover:bg-destructive/90"
                >
                  {updating ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
                  Confirm Reject
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setRejectOpen(false); setRejectNote(""); }}
                  disabled={updating}
                  className="rounded-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={verifyPayment}
                disabled={updating}
                className="rounded-full bg-green-600 text-white hover:bg-green-600/90"
              >
                {updating ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Verify Payment
              </Button>
              <Button
                type="button"
                onClick={() => setRejectOpen(true)}
                disabled={updating}
                variant="outline"
                className="rounded-full border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                <X className="size-4" />
                Reject Payment
              </Button>
            </div>
          )}
        </div>
      ) : null}

      {/* Status controls */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h4 className="eyebrow text-[var(--mocha)]">Update Order Status</h4>
          <div className="mt-3 flex flex-wrap gap-2">
            {ORDER_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                disabled={updating || order.status === s}
                onClick={() => updateStatus(s)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-all",
                  order.status === s
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-foreground/30"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h4 className="eyebrow text-[var(--mocha)]">Update Payment Status</h4>
          <div className="mt-3 flex flex-wrap gap-2">
            {PAYMENT_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                disabled={updating || order.paymentStatus === s}
                onClick={() => {
                  if (s === "paid") verifyPayment();
                  else if (s === "failed") {
                    setRejectOpen(true);
                  } else {
                    // Use the simple update path for other statuses (refunded, pending)
                    setUpdating(true);
                    fetch(`/api/admin/orders/${order.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ paymentStatus: s }),
                    })
                      .then(() => { void load(); })
                      .catch(() => toast.error("Failed to update payment status"))
                      .finally(() => setUpdating(false));
                  }
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-all",
                  order.paymentStatus === s
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-foreground/30"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[0.65rem] text-muted-foreground">
            Only admins can change payment status. Verification creates an audit entry.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminOrderDetail;
