"use client";

import * as React from "react";
import { Menu, Search, User, Heart, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NAV_ITEMS } from "@/lib/site-data";
import { useUI, useCart, useWishlist, cartCount } from "@/lib/store";
import { AccountMenu } from "@/components/site/account-menu";

function Logo({ className }: { className?: string }) {
  return (
    <a
      href="#home"
      className={cn(
        "flex flex-col items-center leading-none text-foreground select-none",
        className
      )}
      aria-label="ShafaQ Atelier — home"
    >
      <span className="font-serif text-xl font-semibold tracking-wide sm:text-2xl">
        SHAFAQ
      </span>
      <span className="eyebrow text-[0.55rem] text-[var(--gold)]">ATELIER</span>
    </a>
  );
}

export function Header() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { setSearchOpen, setCartOpen, setWishlistOpen, setAuthOpen } = useUI();
  const cartLines = useCart((s) => s.lines);
  const wishlistIds = useWishlist((s) => s.ids);

  const cartCountVal = cartCount(cartLines);
  const wishlistCount = wishlistIds.length;

  const [scrolled, setScrolled] = React.useState(false);

  // Rotating announcement messages
  const announcements = [
    "Complimentary shipping across Pakistan",
    "Bespoke abaya design now open",
    "10% off your first order — subscribe today",
    "Free 7-day returns, always",
  ];
  const [annIndex, setAnnIndex] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(
      () => setAnnIndex((i) => (i + 1) % announcements.length),
      3500
    );
    return () => clearInterval(id);
  }, [announcements.length]);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Announcement bar — rotating */}
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-[0.7rem] uppercase tracking-[0.2em] sm:text-xs">
          <span className="hidden h-1.5 w-1.5 flex-none rounded-full bg-[var(--gold)] sm:inline-block" />
          <span key={annIndex} className="animate-in fade-in slide-in-from-top-1 duration-500 text-[var(--gold-soft)]">
            {announcements[annIndex]}
          </span>
        </div>
      </div>

      {/* Main header */}
      <div
        className={cn(
          "border-b bg-background/85 backdrop-blur-md transition-shadow",
          scrolled ? "shadow-sm" : "shadow-none"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          {/* Left: mobile menu + desktop nav */}
          <div className="flex flex-1 items-center gap-1">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[88%] max-w-xs border-r bg-background p-0"
              >
                <SheetHeader className="border-b px-5 py-4">
                  <SheetTitle className="text-left">
                    <span className="font-serif text-xl font-semibold">
                      SHAFAQ <span className="text-[var(--gold)]">ATELIER</span>
                    </span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col px-2 py-4">
                  {NAV_ITEMS.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between border-b border-border/60 px-3 py-3.5 font-serif text-lg text-foreground transition-colors hover:text-[var(--gold)]"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
                <div className="mt-auto flex flex-col gap-3 px-5 py-4 text-sm text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      setAuthOpen(true);
                    }}
                    className="text-left hover:text-foreground"
                  >
                    My Account
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      setWishlistOpen(true);
                    }}
                    className="text-left hover:text-foreground"
                  >
                    Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ""}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      setCartOpen(true);
                    }}
                    className="text-left hover:text-foreground"
                  >
                    Shopping Bag{cartCountVal > 0 ? ` (${cartCountVal})` : ""}
                  </button>
                  <a
                    href="#contact"
                    onClick={() => setMobileOpen(false)}
                    className="hover:text-foreground"
                  >
                    Help & Contact
                  </a>
                </div>
              </SheetContent>
            </Sheet>

            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="relative px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground after:absolute after:inset-x-3 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-[var(--gold)] after:transition-transform hover:after:scale-x-100"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Center: logo */}
          <div className="flex flex-none items-center justify-center">
            <Logo />
          </div>

          {/* Right: action icons */}
          <div className="flex flex-1 items-center justify-end gap-0.5 sm:gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="size-5" />
            </Button>

            {/* Desktop icon links */}
            <div className="hidden sm:contents">
              <span className="inline-flex">
                <AccountMenu>
                  <User className="size-5" />
                </AccountMenu>
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Wishlist"
                className="relative"
                onClick={() => setWishlistOpen(true)}
              >
                <Heart className="size-5" />
                {wishlistCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--gold)] px-1 text-[0.6rem] font-semibold text-primary-foreground">
                    {wishlistCount}
                  </span>
                ) : null}
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Cart"
              className="relative"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag className="size-5" />
              {cartCountVal > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.6rem] font-semibold text-primary-foreground">
                  {cartCountVal}
                </span>
              ) : null}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
