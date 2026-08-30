"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Loader2, ArrowRight, Download, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/format";

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

function getPaymentMethodLabel(method: string): string {
  if (method === "cod") return "COD";
  if (method === "bank_transfer") return "Bank Transfer";
  if (method === "online") return "Online";
  return method;
}

const FILTERS = ["all", "processing", "confirmed", "shipped", "delivered", "cancelled", "returned"];

type AdminOrder = {
  id: string;
  number: string;
  fullName: string;
  email: string;
  city: string;
  total: number;
  status: string;
  paymentStatus: string;
  payment: string;
  paymentReference?: string | null;
  itemCount: number;
  createdAt: string;
};

export function AdminOrders() {
  const [orders, setOrders] = React.useState<AdminOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?status=${filter}`);
      const d = (await res.json()) as { orders: AdminOrder[] };
      setOrders(d.orders || []);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return o.number.toLowerCase().includes(q)
      || o.fullName.toLowerCase().includes(q)
      || o.email.toLowerCase().includes(q)
      || (o.paymentReference || "").toLowerCase().includes(q);
  });

  return (
    <div className="min-w-0 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="eyebrow text-[var(--gold)]">Order Management</span>
          <h1 className="mt-1 font-serif text-2xl font-medium sm:text-3xl">Orders</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild className="rounded-full">
            <Link href="/admin/orders/create">
              <Plus className="size-4" /> Create Order
            </Link>
          </Button>
          <a
            href={`/api/admin/orders/bulk?format=csv&status=${filter}`}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:border-foreground/40"
          >
            <Download className="size-4" />
            Export CSV
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number, name, email, or payment reference…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all",
              filter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-foreground/30"
            )}
          >
            {f === "all" ? "All Orders" : f}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">No orders found.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {filtered.map((o) => (
            <Link
              key={o.id}
              href={`/admin/orders/${o.number}`}
              className="flex flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-secondary/20 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{o.number}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[0.6rem] font-medium", PAYMENT_METHOD_COLORS[o.payment] || "bg-secondary")}>
                      {getPaymentMethodLabel(o.payment)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {o.fullName} · {o.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })} · {o.itemCount} item{o.itemCount > 1 ? "s" : ""}
                  </p>
                  {o.paymentReference ? (
                    <p className="mt-0.5 truncate text-[0.65rem] text-muted-foreground">
                      Ref: <span className="font-mono">{o.paymentReference}</span>
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-serif font-semibold">{formatPKR(o.total)}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-medium capitalize", STATUS_COLORS[o.status] || "bg-secondary")}>
                  {o.status}
                </span>
                <span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-medium capitalize", PAYMENT_COLORS[o.paymentStatus] || "bg-secondary")}>
                  {o.paymentStatus}
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
