"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { formatPKR } from "@/lib/format";
import { cn } from "@/lib/utils";

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

export function AdminCustomerDetail({ customerId }: { customerId: string }) {
  const [loading, setLoading] = React.useState(true);
  const [customer, setCustomer] = React.useState<{
    name: string; email: string; createdAt: string;
  } | null>(null);
  const [stats, setStats] = React.useState<{
    orderCount: number; totalSpent: number; avgOrderValue: number;
  }>({ orderCount: 0, totalSpent: 0, avgOrderValue: 0 });
  const [orders, setOrders] = React.useState<
    { id: string; number: string; total: number; status: string; paymentStatus: string; createdAt: string }[]
  >([]);

  React.useEffect(() => {
    fetch(`/api/admin/customers/${customerId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.customer) {
          setCustomer(d.customer);
          setStats(d.stats);
          setOrders(d.orders || []);
        }
      })
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="font-serif text-xl">Customer not found.</p>
        <Link href="/admin/customers" className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="min-w-0 px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/admin/customers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Customers
      </Link>

      <div className="mt-4 flex flex-col gap-2">
        <h1 className="font-serif text-2xl font-medium">{customer.name || "Customer"}</h1>
        <p className="text-sm text-muted-foreground">{customer.email}</p>
        <p className="text-xs text-muted-foreground">
          Joined: {new Date(customer.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 text-center shadow-sm">
          <p className="font-serif text-2xl font-semibold">{stats.orderCount}</p>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Orders</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center shadow-sm">
          <p className="font-serif text-2xl font-semibold">{formatPKR(stats.totalSpent)}</p>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Spent</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center shadow-sm">
          <p className="font-serif text-2xl font-semibold">{stats.orderCount > 0 ? formatPKR(stats.avgOrderValue) : "—"}</p>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Avg Order</p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="eyebrow text-[var(--mocha)]">Order History</h3>
        {orders.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed py-8 text-center">
            <p className="text-sm text-muted-foreground">No orders found.</p>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders/${o.number}`}
                className="flex flex-col gap-2 rounded-xl border bg-card p-4 transition-colors hover:bg-secondary/20 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="font-mono text-sm font-medium">{o.number}</span>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-serif font-semibold">{formatPKR(o.total)}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-medium capitalize", STATUS_COLORS[o.status] || "bg-secondary")}>
                    {o.status}
                  </span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-medium capitalize", PAYMENT_COLORS[o.paymentStatus] || "bg-secondary")}>
                    {o.paymentStatus}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminCustomerDetail;
