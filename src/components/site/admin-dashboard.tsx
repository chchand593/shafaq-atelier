"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  Star,
  TrendingUp,
  Loader2,
  ArrowLeft,
  ExternalLink,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ProductCreateModal } from "@/components/site/product-create-modal";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/format";
import { toast } from "sonner";

type AdminOrder = {
  id: string;
  number: string;
  email: string;
  fullName: string;
  phone: string;
  city: string;
  payment: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: string;
  createdAt: string;
  itemCount: number;
  items: Array<{
    name: string;
    image: string;
    price: number;
    qty: number;
    colorName: string;
    size: string;
  }>;
};

type AdminProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  reviews: number;
  rating: number;
};

type Tab = "overview" | "orders" | "products";

const STATUS_COLORS: Record<string, string> = {
  processing: "bg-blue-500/15 text-blue-700",
  shipped: "bg-amber-500/15 text-amber-700",
  delivered: "bg-green-500/15 text-green-700",
  cancelled: "bg-red-500/15 text-red-700",
};

const STATUSES = ["processing", "shipped", "delivered", "cancelled"];

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Package;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="eyebrow text-[var(--mocha)]">{label}</span>
        <Icon className="size-4 text-[var(--gold)]" />
      </div>
      <p className="mt-2 font-serif text-3xl font-semibold">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = React.useState<AdminOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState("all");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?status=${filter}`);
      if (!res.ok) return;
      const d = (await res.json()) as { orders: AdminOrder[] };
      setOrders(d.orders);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success("Order updated", { description: `Status: ${status}` });
      void load();
    } catch {
      toast.error("Failed to update order");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" /> Loading orders…
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center">
        <ShoppingCart className="mx-auto size-8 text-muted-foreground/40" />
        <p className="mt-2 font-serif text-lg">No orders found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {["all", ...STATUSES].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all",
              filter === s
                ? "border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground hover:border-foreground/30"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {orders.map((o) => (
        <div key={o.id} className="rounded-xl border bg-card shadow-sm">
          <button
            type="button"
            onClick={() => setExpanded(expanded === o.id ? null : o.id)}
            className="flex w-full items-center gap-4 p-4 text-left"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium">{o.number}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[0.65rem] font-medium capitalize",
                    STATUS_COLORS[o.status] || "bg-secondary"
                  )}
                >
                  {o.status}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {o.fullName} · {o.email} · {new Date(o.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
            <div className="text-right">
              <p className="font-serif text-sm font-semibold">{formatPKR(o.total)}</p>
              <p className="text-xs text-muted-foreground">{o.itemCount} item{o.itemCount > 1 ? "s" : ""}</p>
            </div>
          </button>

          {expanded === o.id ? (
            <div className="border-t bg-secondary/30 px-4 py-4">
              {/* Items */}
              <div className="space-y-2">
                {o.items.map((it, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="size-12 flex-none overflow-hidden rounded-md border bg-background">
                      <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{it.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {it.colorName} · Size {it.size} · Qty {it.qty}
                      </p>
                    </div>
                    <span className="text-sm font-medium">{formatPKR(it.price * it.qty)}</span>
                  </div>
                ))}
              </div>

              {/* Address */}
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="eyebrow text-[var(--mocha)]">Shipping</p>
                  <p className="mt-1">{o.fullName}</p>
                  <p className="text-muted-foreground">{o.phone}</p>
                  <p className="text-muted-foreground">{o.city}</p>
                </div>
                <div>
                  <p className="eyebrow text-[var(--mocha)]">Payment</p>
                  <p className="mt-1 capitalize">{o.payment}</p>
                  <p className="text-muted-foreground">
                    Subtotal {formatPKR(o.subtotal)}
                    {o.discount > 0 ? ` · −${formatPKR(o.discount)}` : ""}
                    {o.shipping === 0 ? " · Free ship" : ` · ${formatPKR(o.shipping)}`}
                  </p>
                </div>
              </div>

              {/* Status changer */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Update status:</span>
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => updateStatus(o.id, s)}
                    disabled={o.status === s}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all",
                      o.status === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-foreground/30"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ProductsTab() {
  const [products, setProducts] = React.useState<AdminProduct[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [stockInput, setStockInput] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      if (!res.ok) return;
      const d = (await res.json()) as { products: AdminProduct[] };
      setProducts(d.products);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const updateStock = async (slug: string, stock: number) => {
    try {
      const res = await fetch(`/api/admin/products/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock }),
      });
      if (!res.ok) throw new Error();
      toast.success("Stock updated", { description: `${slug}: ${stock} units` });
      setEditing(null);
      void load();
    } catch {
      toast.error("Failed to update stock");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" /> Loading products…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {products.length} products in catalogue
        </p>
        <Button
          onClick={() => setCreateOpen(true)}
          className="rounded-full px-4 text-sm"
        >
          <Plus className="size-4" /> New Product
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50">
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3 text-right">Price</th>
            <th className="px-4 py-3 text-right">Stock</th>
            <th className="px-4 py-3 text-right">Reviews</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-secondary/30">
              <td className="px-4 py-3">
                <Link
                  href={`/product/${p.id}`}
                  className="font-medium hover:text-[var(--gold)]"
                  target="_blank"
                >
                  {p.name}
                  <ExternalLink className="ml-1 inline size-3 text-muted-foreground" />
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
              <td className="px-4 py-3 text-right font-medium">{formatPKR(p.price)}</td>
              <td className="px-4 py-3 text-right">
                {editing === p.id ? (
                  <div className="flex items-center justify-end gap-1">
                    <Input
                      type="number"
                      value={stockInput}
                      onChange={(e) => setStockInput(e.target.value)}
                      className="h-7 w-16 text-xs"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") updateStock(p.id, Number(stockInput));
                        if (e.key === "Escape") setEditing(null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => updateStock(p.id, Number(stockInput))}
                      className="text-xs font-medium text-[var(--gold)]"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(p.id);
                      setStockInput(String(p.stock));
                    }}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium",
                      p.stock === 0
                        ? "bg-destructive/15 text-destructive"
                        : p.stock <= 5
                          ? "bg-[var(--gold)]/15 text-[var(--gold)]"
                          : "text-foreground"
                    )}
                  >
                    {p.stock}
                    {p.stock <= 5 ? <span className="text-[0.6rem]">⚠</span> : null}
                  </button>
                )}
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground">
                {p.reviews} · {p.rating.toFixed(1)}★
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <ProductCreateModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => void load()}
      />
    </div>
  );
}

function OverviewTab({ orders, products }: { orders: AdminOrder[]; products: AdminProduct[] }) {
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.total, 0);
  const lowStock = products.filter((p) => p.stock <= 5);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ShoppingCart} label="Orders" value={String(orders.length)} sub="Total placed" />
        <StatCard icon={TrendingUp} label="Revenue" value={formatPKR(revenue)} sub="Excl. cancelled" />
        <StatCard icon={Package} label="Products" value={String(products.length)} sub="In catalogue" />
        <StatCard
          icon={Star}
          label="Low Stock"
          value={String(lowStock.length)}
          sub="≤ 5 units left"
        />
      </div>

      {/* Recent orders */}
      <div>
        <h3 className="eyebrow text-[var(--mocha)]">Recent Orders</h3>
        <div className="mt-3 space-y-2">
          {orders.slice(0, 5).map((o) => (
            <div key={o.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-2.5 text-sm">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-medium">{o.number}</span>
                <span className="text-muted-foreground">{o.fullName}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-serif font-semibold">{formatPKR(o.total)}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-medium capitalize", STATUS_COLORS[o.status])}>
                  {o.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 ? (
        <div>
          <h3 className="eyebrow text-[var(--gold)]">⚠ Low Stock Alert</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/5 px-4 py-2.5 text-sm">
                <span className="font-medium">{p.name}</span>
                <Badge className={p.stock === 0 ? "bg-destructive text-white" : "bg-[var(--gold)] text-primary"}>
                  {p.stock === 0 ? "Sold Out" : `${p.stock} left`}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AdminDashboard() {
  const { data: session, status } = useSession();
  const [tab, setTab] = React.useState<Tab>("overview");
  const [orders, setOrders] = React.useState<AdminOrder[]>([]);
  const [products, setProducts] = React.useState<AdminProduct[]>([]);
  const [loadingData, setLoadingData] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // Load overview data once
  React.useEffect(() => {
    if (status !== "authenticated") return;
    if ((session?.user as { role?: string })?.role !== "admin") return;
    Promise.all([
      fetch("/api/admin/orders").then((r) => r.json()),
      fetch("/api/admin/products").then((r) => r.json()),
    ])
      .then(([od, pd]: [{ orders: AdminOrder[] }, { products: AdminProduct[] }]) => {
        setOrders(od.orders || []);
        setProducts(pd.products || []);
      })
      .finally(() => setLoadingData(false));
  }, [status, session]);

  if (!mounted || status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status !== "authenticated" || (session?.user as { role?: string })?.role !== "admin") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <Package className="size-8" />
        </span>
        <div>
          <h1 className="font-serif text-2xl font-medium">Admin Access Required</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You need an admin account to access this dashboard.
          </p>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/">
            <ArrowLeft className="size-4" /> Back to Store
          </Link>
        </Button>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "products", label: "Products", icon: Package },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow text-[var(--gold)]">ShafaQ Atelier Admin</p>
          <h1 className="mt-1 font-serif text-3xl font-medium">Dashboard</h1>
        </div>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/">
            <ArrowLeft className="size-4" /> View Store
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 rounded-full bg-secondary p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-xs font-medium uppercase tracking-wider transition-all sm:text-sm",
                tab === t.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="mt-8">
        {loadingData ? (
          <div className="flex items-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" /> Loading…
          </div>
        ) : tab === "overview" ? (
          <OverviewTab orders={orders} products={products} />
        ) : tab === "orders" ? (
          <OrdersTab />
        ) : (
          <ProductsTab />
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
