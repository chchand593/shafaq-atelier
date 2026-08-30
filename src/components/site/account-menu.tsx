"use client";

import * as React from "react";
import { useSession, signOut } from "next-auth/react";
import { UserCircle2, Package, LogOut, ChevronRight, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUI } from "@/lib/store";
import { formatPKR } from "@/lib/format";
import { cn } from "@/lib/utils";

type Order = {
  id: string;
  number: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{ id: string; name: string; qty: number; image: string }>;
};

function initials(name?: string | null) {
  if (!name) return "LM";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AccountMenu({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { setAuthOpen } = useUI();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = React.useState(false);
  // Avoid SSR/CSR hydration mismatch: render a stable placeholder until [mmounted.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (status === "authenticated") {
      setLoadingOrders(true);
      fetch("/api/orders")
        .then((r) => r.json())
        .then((d: { orders: Order[] }) => setOrders(d.orders ?? []))
        .finally(() => setLoadingOrders(false));
    } else {
      setOrders([]);
    }
  }, [status]);

  if (!mounted || status === "loading") {
    return (
      <span className="inline-flex size-9 items-center justify-center text-muted-foreground">
        <User className="size-5" />
      </span>
    );
  }

  if (status !== "authenticated" || !session?.user) {
    return (
      <button
        type="button"
        onClick={() => setAuthOpen(true)}
        className="inline-flex size-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label="Sign in"
      >
        {children}
      </button>
    );
  }

  const user = session.user as { name?: string | null; email?: string | null; role?: string };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-md transition-colors hover:bg-accent"
          aria-label="Account menu"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-[0.7rem] font-semibold text-primary-foreground">
            {initials(user.name)}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 rounded-xl p-0">
        <DropdownMenuLabel className="flex items-center gap-3 px-4 py-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name || "Member"}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-0" />
        <div className="px-2 py-2">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="eyebrow text-[var(--mocha)]">Your Orders</span>
            <span className="text-xs text-muted-foreground">
              {loadingOrders ? "…" : orders.length}
            </span>
          </div>
          <div className="mt-1 max-h-56 overflow-y-auto elegant-scroll">
            {orders.length === 0 && !loadingOrders ? (
              <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                No orders yet.
              </p>
            ) : (
              orders.slice(0, 5).map((o) => (
                <div
                  key={o.id}
                  className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-secondary/60"
                >
                  <span className="flex size-9 flex-none items-center justify-center rounded-md bg-secondary text-[var(--mocha)]">
                    <Package className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs font-medium">{o.number}</p>
                    <p className="text-[0.7rem] text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · {o.status}
                    </p>
                  </div>
                  <span className="font-serif text-sm font-semibold">
                    {formatPKR(o.total)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        <DropdownMenuSeparator className="my-0" />
        <DropdownMenuItem asChild className="cursor-pointer rounded-md py-2 text-sm focus:bg-secondary/60">
          <a href="/account" className="flex items-center gap-2">
            <UserCircle2 className="size-4" />
            My Account
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer rounded-md py-2 text-sm focus:bg-secondary/60">
          <a href="/compare" className="flex items-center gap-2">
            <ChevronRight className="size-4" />
            Compare Abayas
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-0" />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/" })}
          className="cursor-pointer rounded-md py-2 text-sm text-destructive focus:bg-destructive/10"
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default AccountMenu;
