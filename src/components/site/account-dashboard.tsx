"use client";

import * as React from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  Package,
  Heart,
  User,
  Loader2,
  LogOut,
  ShoppingBag,
  ChevronRight,
  Check,
  Pencil,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/format";
import { useUI, useWishlist } from "@/lib/store";
import { PRODUCTS } from "@/lib/site-data";
import { toast } from "sonner";

type Order = {
  id: string;
  number: string;
  status: string;
  total: number;
  createdAt: string;
  payment: string;
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

type Tab = "orders" | "wishlist" | "profile";

const STATUS_COLORS: Record<string, string> = {
  processing: "bg-blue-500/15 text-blue-700",
  shipped: "bg-amber-500/15 text-amber-700",
  delivered: "bg-green-500/15 text-green-700",
  cancelled: "bg-red-500/15 text-red-700",
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 text-center shadow-sm">
      <p className="font-serif text-2xl font-semibold">{value}</p>
      <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function OrdersTab({ orders, loading }: { orders: Order[]; loading: boolean }) {
  const [expanded, setExpanded] = React.useState<string | null>(null);

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
        <Package className="mx-auto size-8 text-muted-foreground/40" />
        <p className="mt-2 font-serif text-lg">No orders yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          When you place an order, it will appear here.
        </p>
        <Button asChild className="mt-4 rounded-full">
          <Link href="/">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
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
                {new Date(o.createdAt).toLocaleDateString("en-PK", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}{" "}
                · {o.itemCount} item{o.itemCount > 1 ? "s" : ""} ·{" "}
                <span className="capitalize">{o.payment}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-serif text-base font-semibold">
                {formatPKR(o.total)}
              </span>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="rounded-full"
              >
                <Link href={`/order/${o.number}`}>Track</Link>
              </Button>
              <button
                type="button"
                onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Toggle details"
              >
                <ChevronRight
                  className={cn(
                    "size-4 transition-transform",
                    expanded === o.id && "rotate-90"
                  )}
                />
              </button>
            </div>
          </div>

          {expanded === o.id ? (
            <div className="border-t bg-secondary/30 px-4 py-3">
              <ul className="space-y-2">
                {o.items.map((it, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="size-12 flex-none overflow-hidden rounded-md border bg-background">
                      <img
                        src={it.image}
                        alt={it.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-medium">{it.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {it.colorName} · Size {it.size} · Qty {it.qty}
                      </p>
                    </div>
                    <span className="text-sm font-medium">
                      {formatPKR(it.price * it.qty)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function WishlistTab() {
  const wishlistIds = useWishlist((s) => s.ids);
  const items = React.useMemo(
    () =>
      wishlistIds
        .map((id) => PRODUCTS.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p)),
    [wishlistIds]
  );

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center">
        <Heart className="mx-auto size-8 text-muted-foreground/40" />
        <p className="mt-2 font-serif text-lg">Your wishlist is empty</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tap the heart on any abaya to save it here.
        </p>
        <Button asChild className="mt-4 rounded-full">
          <Link href="/">Discover Abayas</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <Link
          key={p.id}
          href={`/product/${p.id}`}
          className="group flex gap-3 rounded-xl border bg-card p-3 shadow-sm transition-all hover:shadow-md"
        >
          <div className="size-20 flex-none overflow-hidden rounded-md bg-secondary">
            <img
              src={p.image}
              alt={p.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
          <div className="flex flex-1 flex-col">
            <p className="font-serif text-sm font-medium leading-tight">
              {p.name}
            </p>
            <p className="text-xs text-muted-foreground">{p.category}</p>
            <div className="mt-auto flex items-center justify-between pt-1">
              <span className="font-serif text-sm font-semibold">
                {formatPKR(p.price)}
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                <Star className="size-3 fill-[var(--gold)] text-[var(--gold)]" />
                {p.rating.toFixed(1)}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ProfileTab() {
  const { data: session, update } = useSession();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    const user = session?.user as { name?: string; email?: string } | undefined;
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [session]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to update profile");
      }
      setSaved(true);
      // Refresh the session to reflect new name/email
      await update();
      toast.success("Profile updated");
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSave} className="max-w-md space-y-4">
      <div>
        <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Full name
        </span>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-9"
            placeholder="Your name"
          />
        </div>
      </div>
      <div>
        <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Email address
        </span>
        <div className="relative">
          <ShoppingBag className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-9"
            placeholder="you@example.com"
          />
        </div>
      </div>
      <Button
        type="submit"
        disabled={saving}
        className="rounded-full px-6"
      >
        {saving ? (
          <Loader2 className="size-4 animate-spin" />
        ) : saved ? (
          <>
            <Check className="size-4" /> Saved
          </>
        ) : (
          <>
            <Pencil className="size-4" /> Save Changes
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground">
        Changing your email will update it across all future sessions.
      </p>
    </form>
  );
}

export function AccountDashboard() {
  const { data: session, status } = useSession();
  const { setAuthOpen } = useUI();
  const [tab, setTab] = React.useState<Tab>("orders");
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (status === "authenticated") {
      setLoadingOrders(true);
      fetch("/api/orders")
        .then((r) => r.json())
        .then((d: { orders: Order[] }) => setOrders(d.orders || []))
        .finally(() => setLoadingOrders(false));
    }
  }, [status]);

  if (!mounted || status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status !== "authenticated" || !session?.user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-[var(--mocha)]">
          <User className="size-8" />
        </span>
        <div>
          <h1 className="font-serif text-2xl font-medium">Welcome to Your Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to view your orders, wishlist, and profile.
          </p>
        </div>
        <Button
          onClick={() => setAuthOpen(true)}
          className="rounded-full px-8"
        >
          Sign In
        </Button>
      </div>
    );
  }

  const user = session.user as { name?: string; email?: string; role?: string };
  const totalSpent = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.total, 0);

  const tabs: { id: Tab; label: string; icon: typeof Package; count?: number }[] = [
    { id: "orders", label: "Orders", icon: Package, count: orders.length },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary font-serif text-lg font-semibold text-primary-foreground">
            {(user.name || user.email || "LM")
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </span>
          <div>
            <p className="eyebrow text-[var(--gold)]">My Account</p>
            <h1 className="font-serif text-2xl font-medium sm:text-3xl">
              {user.name || "Welcome back"}
            </h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-full"
        >
          <LogOut className="size-4" /> Sign Out
        </Button>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <StatCard label="Orders" value={String(orders.length)} />
        <StatCard label="Total Spent" value={formatPKR(totalSpent)} />
        <StatCard label="Member" value={user.role === "admin" ? "Admin" : "Customer"} />
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
              {t.count !== undefined ? (
                <span className="ml-1 rounded-full bg-primary/10 px-1.5 text-[0.6rem] text-primary">
                  {t.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="mt-8">
        {tab === "orders" ? (
          <OrdersTab orders={orders} loading={loadingOrders} />
        ) : tab === "wishlist" ? (
          <WishlistTab />
        ) : (
          <ProfileTab />
        )}
      </div>
    </div>
  );
}

export default AccountDashboard;
