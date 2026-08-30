"use client";

import * as React from "react";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Star,
  ArrowRight,
  Users,
  Bell,
  MessageSquare,
  XCircle,
  CalendarDays,
  Coins,
  CreditCard,
  Loader2,
} from "lucide-react";
import { formatPKR, formatPKRShort } from "@/lib/format";
import { cn } from "@/lib/utils";

type StatCard = {
  icon: typeof Package;
  label: string;
  value: string;
  sub?: string;
  href?: string;
  accent?: string;
};

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
  itemCount: number;
  createdAt: string;
};

type Analytics = {
  revenue: { today: number; month: number; total: number };
  orders: {
    today: number;
    month: number;
    total: number;
    processing: number;
    completed: number;
    cancelled: number;
    returned: number;
  };
  payments: {
    cod: number;
    online: number;
    paid: number;
    failed: number;
    pending: number;
  };
  avgOrderValue: number;
  monthlySeries: { label: string; total: number }[];
  statusBreakdown: { label: string; value: number; color: string }[];
};

export function AdminOverview() {
  const [orders, setOrders] = React.useState<AdminOrder[]>([]);
  const [analytics, setAnalytics] = React.useState<Analytics | null>(null);
  const [products, setProducts] = React.useState<
    { id: string; stock: number; lowStockThreshold: number; name: string }[]
  >([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      fetch("/api/admin/orders?limit=10").then((r) => r.json()),
      fetch("/api/admin/products").then((r) => r.json()),
      fetch("/api/admin/analytics").then((r) => r.json()),
    ])
      .then(
        (
          results: [
            { orders: AdminOrder[] },
            { products: { id: string; stock: number; lowStockThreshold: number; name: string }[] },
            Analytics
          ]
        ) => {
          const [od, pd, an] = results;
          setOrders(od.orders || []);
          setProducts(pd.products || []);
          setAnalytics(an);
        }
      )
      .catch(() => {
        // best-effort
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold);
  const outOfStock = products.filter((p) => p.stock <= 0);

  const a = analytics;
  const totalOrders = a?.orders.total ?? orders.length;
  const processingOrders = a?.orders.processing ?? orders.filter((o) => o.status === "processing").length;
  const completedOrders = a?.orders.completed ?? orders.filter((o) => o.status === "delivered").length;
  const cancelledOrders = a?.orders.cancelled ?? 0;
  const returnedOrders = a?.orders.returned ?? 0;
  const avgOrderValue = a?.avgOrderValue ?? 0;

  const stats: StatCard[] = [
    {
      icon: Coins,
      label: "Revenue Today",
      value: a ? formatPKR(a.revenue.today) : "—",
      sub: a ? `${a.orders.today} order${a.orders.today !== 1 ? "s" : ""} today` : undefined,
      accent: "var(--gold)",
    },
    {
      icon: CalendarDays,
      label: "Revenue This Month",
      value: a ? formatPKR(a.revenue.month) : "—",
      sub: a ? `${a.orders.month} order${a.orders.month !== 1 ? "s" : ""} this month` : undefined,
      accent: "var(--mocha)",
    },
    {
      icon: TrendingUp,
      label: "Total Revenue",
      value: a ? formatPKR(a.revenue.total) : "—",
      sub: `${completedOrders} delivered · ${cancelledOrders} cancelled · ${returnedOrders} returned`,
      accent: "var(--gold)",
    },
    {
      icon: ShoppingCart,
      label: "Total Orders",
      value: String(totalOrders),
      sub: `${processingOrders} processing`,
      href: "/admin/orders",
    },
    {
      icon: Package,
      label: "Products",
      value: String(products.length),
      href: "/admin/products",
    },
    {
      icon: AlertTriangle,
      label: "Low Stock",
      value: String(lowStock.length),
      sub: `${outOfStock.length} out of stock`,
      href: "/admin/products",
      accent: "var(--gold)",
    },
    {
      icon: CreditCard,
      label: "Avg Order Value",
      value: formatPKR(avgOrderValue),
      sub: a
        ? `${a.payments.cod} COD · ${a.payments.online} online`
        : undefined,
      accent: "var(--mocha)",
    },
    {
      icon: XCircle,
      label: "Failed Payments",
      value: a ? String(a.payments.failed) : "0",
      sub: a ? `${a.payments.pending} pending payment` : undefined,
      accent: "var(--gold)",
    },
  ];

  return (
    <div className="min-w-0 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2">
        <span className="eyebrow text-[var(--gold)]">ShafaQ Atelier Admin</span>
        <h1 className="font-serif text-3xl font-medium">Dashboard Overview</h1>
      </div>

      {/* Stat cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href || "#"}
            className="group flex flex-col gap-2 rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="eyebrow text-[var(--mocha)]">{s.label}</span>
              <s.icon className="size-4" style={{ color: s.accent || "var(--gold)" }} />
            </div>
            <p className="font-serif text-2xl font-semibold">{s.value}</p>
            {s.sub ? <p className="text-xs text-muted-foreground">{s.sub}</p> : null}
          </Link>
        ))}
      </div>

      {/* Charts row */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Revenue chart */}
        <div className="rounded-xl border bg-card p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-medium">Revenue (Last 6 Months)</h2>
            <span className="text-xs text-muted-foreground">
              Total: {formatPKR(a?.monthlySeries.reduce((s, m) => s + m.total, 0) || 0)}
            </span>
          </div>
          {a && a.monthlySeries.length > 0 ? (
            <RevenueChart data={a.monthlySeries} />
          ) : (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              No revenue data yet.
            </div>
          )}
        </div>

        {/* Order status breakdown */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-serif text-lg font-medium">Order Status</h2>
          {a && a.statusBreakdown.length > 0 ? (
            <div className="mt-4 space-y-2.5">
              {a.statusBreakdown.map((s) => {
                const total = a.statusBreakdown.reduce((n, x) => n + x.value, 0) || 1;
                const pct = Math.round((s.value / total) * 100);
                return (
                  <div key={s.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 capitalize">
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.label}
                      </span>
                      <span className="font-medium">
                        {s.value} <span className="text-muted-foreground">· {pct}%</span>
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: s.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No orders yet.</p>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-medium">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            View all <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {orders.length === 0 ? (
            <div className="rounded-xl border border-dashed py-12 text-center">
              <ShoppingCart className="mx-auto size-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">No orders yet.</p>
            </div>
          ) : (
            orders.slice(0, 8).map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders/${o.number}`}
                className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm transition-colors hover:bg-secondary/30"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs font-medium">{o.number}</span>
                  <span className="hidden text-muted-foreground sm:inline">{o.fullName}</span>
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
            ))
          )}
        </div>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 || outOfStock.length > 0 ? (
        <div className="mt-8">
          <h2 className="flex items-center gap-2 font-serif text-xl font-medium">
            <AlertTriangle className="size-5 text-[var(--gold)]" />
            Stock Alerts
          </h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {outOfStock.map((p) => (
              <Link
                key={p.id}
                href="/admin/products"
                className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm"
              >
                <span className="font-medium">{p.name}</span>
                <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[0.65rem] font-medium text-destructive">
                  Out of Stock
                </span>
              </Link>
            ))}
            {lowStock.map((p) => (
              <Link
                key={p.id}
                href="/admin/products"
                className="flex items-center justify-between rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/5 px-4 py-2.5 text-sm"
              >
                <span className="font-medium">{p.name}</span>
                <span className="rounded-full bg-[var(--gold)]/15 px-2 py-0.5 text-[0.65rem] font-medium text-[var(--gold)]">
                  Only {p.stock} left
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* Quick links */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/admin/products", label: "Manage Products", icon: Package },
          { href: "/admin/orders", label: "View Orders", icon: ShoppingCart },
          { href: "/admin/customers", label: "Customers", icon: Users },
          { href: "/admin/reviews", label: "Moderate Reviews", icon: Star },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 rounded-xl border bg-card px-5 py-4 text-sm shadow-sm transition-all hover:shadow-md"
          >
            <link.icon className="size-5 text-[var(--gold)]" />
            <span className="font-medium">{link.label}</span>
            <ArrowRight className="ml-auto size-4 text-muted-foreground" />
          </Link>
        ))}
      </div>

      {/* Admin Notifications */}
      <div className="mt-8">
        <h2 className="flex items-center gap-2 font-serif text-xl font-medium">
          <Bell className="size-5 text-[var(--gold)]" />
          Notifications
        </h2>
        <div className="mt-4 space-y-2">
          {/* Processing orders */}
          {processingOrders > 0 ? (
            <Link
              href="/admin/orders"
              className="flex items-center gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm transition-colors hover:bg-blue-500/10"
            >
              <ShoppingCart className="size-4 text-blue-600" />
              <span className="font-medium text-blue-700">
                {processingOrders} order{processingOrders > 1 ? "s" : ""} awaiting processing
              </span>
              <ArrowRight className="ml-auto size-3.5 text-muted-foreground" />
            </Link>
          ) : null}

          {/* Failed payments */}
          {a && a.payments.failed > 0 ? (
            <Link
              href="/admin/orders?status=all"
              className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm transition-colors hover:bg-red-500/10"
            >
              <CreditCard className="size-4 text-red-600" />
              <span className="font-medium text-red-700">
                {a.payments.failed} failed payment{a.payments.failed > 1 ? "s" : ""} need attention
              </span>
              <ArrowRight className="ml-auto size-3.5 text-muted-foreground" />
            </Link>
          ) : null}

          {/* Out of stock */}
          {outOfStock.length > 0 ? (
            <Link
              href="/admin/products"
              className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm transition-colors hover:bg-destructive/10"
            >
              <XCircle className="size-4 text-destructive" />
              <span className="font-medium text-destructive">
                {outOfStock.length} product{outOfStock.length > 1 ? "s" : ""} out of stock
              </span>
              <ArrowRight className="ml-auto size-3.5 text-muted-foreground" />
            </Link>
          ) : null}

          {/* Low stock */}
          {lowStock.length > 0 ? (
            <Link
              href="/admin/products"
              className="flex items-center gap-3 rounded-lg border border-[var(--gold)]/20 bg-[var(--gold)]/5 px-4 py-3 text-sm transition-colors hover:bg-[var(--gold)]/10"
            >
              <AlertTriangle className="size-4 text-[var(--gold)]" />
              <span className="font-medium text-[var(--gold)]">
                {lowStock.length} product{lowStock.length > 1 ? "s" : ""} running low on stock
              </span>
              <ArrowRight className="ml-auto size-3.5 text-muted-foreground" />
            </Link>
          ) : null}

          {/* New reviews */}
          <Link
            href="/admin/reviews"
            className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors hover:bg-secondary/30"
          >
            <MessageSquare className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Review moderation — check for new reviews
            </span>
            <ArrowRight className="ml-auto size-3.5 text-muted-foreground" />
          </Link>

          {/* All clear */}
          {processingOrders === 0 &&
          outOfStock.length === 0 &&
          lowStock.length === 0 &&
          (!a || a.payments.failed === 0) ? (
            <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm">
              <span className="size-2 rounded-full bg-green-500" />
              <span className="text-green-700">All caught up — no urgent notifications.</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Lightweight inline revenue bar chart — no external chart library.
function RevenueChart({ data }: { data: { label: string; total: number }[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div className="mt-4 flex h-44 items-end gap-3 sm:gap-5">
      {data.map((d, i) => {
        const h = Math.max(4, Math.round((d.total / max) * 100));
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-[var(--gold)]/60 to-[var(--gold)] transition-all hover:from-[var(--gold)] hover:to-[var(--gold)]"
                style={{ height: `${h}%` }}
                title={formatPKR(d.total)}
              />
            </div>
            <span className="text-[0.65rem] text-muted-foreground">{d.label}</span>
            <span className="text-[0.6rem] font-medium">{formatPKRShort(d.total)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default AdminOverview;
