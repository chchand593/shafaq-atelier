"use client";

import {
  Instagram,
  Facebook,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Truck,
  RefreshCcw,
  Headphones,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/site-data";

const SHOP_LINKS = [
  "Daily Wear Abayas",
  "Customized Abayas",
  "New Arrivals",
  "Best Sellers",
  "Gift Cards",
];

const SUPPORT_LINKS: { label: string; href: string }[] = [
  { label: "Shipping & Returns", href: "#support" },
  { label: "Track Your Order", href: "#support" },
  { label: "Care Instructions", href: "#support" },
  { label: "FAQs", href: "#support" },
];

const COMPANY_LINKS: { label: string; href: string }[] = [
  { label: "About Us", href: "/about" },
  { label: "Our Artisans", href: "#company" },
  { label: "Sustainability", href: "#company" },
  { label: "Careers", href: "#company" },
  { label: "Contact Us", href: "/contact" },
];

const SOCIAL = [
  { label: "Instagram", icon: Instagram, href: "#instagram" },
  { label: "Facebook", icon: Facebook, href: "#facebook" },
  { label: "Email", icon: Mail, href: "mailto:hello@shafaqatelier.pk" },
];

const PROMISES = [
  { icon: Truck, label: "Free Nationwide Shipping" },
  { icon: RefreshCcw, label: "7-Day Easy Returns" },
  { icon: ShieldCheck, label: "Secure Checkout" },
  { icon: Headphones, label: "Dedicated Support" },
];

export function Footer() {
  return (
    <footer id="contact" className="bg-primary text-primary-foreground">
      {/* Promise strip */}
      <div className="border-b border-primary-foreground/15">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 py-6 sm:grid-cols-4 sm:px-6 lg:px-8">
          {PROMISES.map((p) => (
            <div
              key={p.label}
              className="flex items-center justify-center gap-2 px-3 py-2 text-center text-xs sm:text-sm"
            >
              <p.icon className="size-4 flex-none text-[var(--gold-soft)]" />
              <span className="font-medium">{p.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main footer */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-4">
            <div className="flex flex-col leading-none">
              <span className="font-serif text-2xl font-semibold tracking-wide">
                SHAFAQ
              </span>
              <span className="eyebrow mt-1 text-[0.55rem] text-[var(--gold-soft)]">
                ATELIER
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-primary-foreground/70">
              Your style, your modesty, your abaya. Premium Pakistani abayas
              crafted with elegance for the modern modest woman.
            </p>

            <div className="mt-6 space-y-2 text-sm text-primary-foreground/80">
              <p className="flex items-center gap-2">
                <MapPin className="size-4 text-[var(--gold-soft)]" />
                M.A. Jinnah Road, Okara, Punjab, Pakistan
              </p>
              <p className="flex items-center gap-2">
                <Phone className="size-4 text-[var(--gold-soft)]" />
                +92 300 1234567
              </p>
              <p className="flex items-center gap-2">
                <Mail className="size-4 text-[var(--gold-soft)]" />
                hello@shafaqatelier.pk
              </p>
            </div>

            <div className="mt-6 flex items-center gap-3">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-primary-foreground/25 text-primary-foreground/80 transition-colors hover:border-[var(--gold)] hover:text-[var(--gold-soft)]"
                >
                  <s.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <nav className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8">
            <div>
              <h3 className="eyebrow text-[var(--gold-soft)]">Shop</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {SHOP_LINKS.map((l) => (
                  <li key={l}>
                    <a
                      href="#shop"
                      className="text-primary-foreground/75 transition-colors hover:text-primary-foreground"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="eyebrow text-[var(--gold-soft)]">Support</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {SUPPORT_LINKS.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-primary-foreground/75 transition-colors hover:text-primary-foreground"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <h3 className="eyebrow text-[var(--gold-soft)]">Company</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {COMPANY_LINKS.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-primary-foreground/75 transition-colors hover:text-primary-foreground"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-primary-foreground/15">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-primary-foreground/60 sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} ShafaQ Atelier. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <a href="#privacy" className="hover:text-primary-foreground">
              Privacy Policy
            </a>
            <span className="h-3 w-px bg-primary-foreground/25" />
            <a href="#terms" className="hover:text-primary-foreground">
              Terms of Service
            </a>
            <span className="h-3 w-px bg-primary-foreground/25" />
            <span>Cash on Delivery · Visa · Mastercard · Easypaisa</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
