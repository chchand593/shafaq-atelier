"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Star,
  ArrowLeft,
  Loader2,
  Menu,
  X,
  Settings,
  Palette,
  Shirt,
  Sparkles,
  Images,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/colors", label: "Colors", icon: Palette },
  { href: "/admin/fabrics", label: "Fabrics", icon: Shirt },
  { href: "/admin/customization", label: "Add-ons", icon: Sparkles },
  { href: "/admin/abaya-images", label: "Abaya Images", icon: Images },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status !== "authenticated" || (session?.user as { role?: string })?.role !== "admin") {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
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

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-none border-r bg-card lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b px-5 py-5">
            <span className="eyebrow text-[var(--gold)]">ShafaQ Atelier</span>
            <h2 className="mt-1 font-serif text-xl font-medium">Admin Panel</h2>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t px-3 py-4">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="w-full justify-start"
            >
              <Link href="/">
                <ArrowLeft className="size-4" /> View Store
              </Link>
            </Button>
            <Button
              onClick={() => signOut({ callbackUrl: "/" })}
              variant="ghost"
              size="sm"
              className="mt-1 w-full justify-start text-destructive"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile header with nav toggle */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b bg-card px-4 py-3 lg:hidden">
          <div>
            <span className="eyebrow text-[var(--gold)]">Admin</span>
            <h2 className="font-serif text-lg font-medium">ShafaQ Atelier</h2>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile nav dropdown */}
        {mobileNavOpen ? (
          <nav className="border-b bg-card px-3 py-2 lg:hidden">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/"
              onClick={() => setMobileNavOpen(false)}
              className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary"
            >
              <ArrowLeft className="size-4" />
              View Store
            </Link>
          </nav>
        ) : null}

        <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}

export default AdminLayout;
