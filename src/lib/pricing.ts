// Server-safe pricing utilities for ShafaQ Atelier.
// These are pure functions/constants that can be used in both server and client code.
// Do NOT add "use client" to this file.

export const FREE_SHIPPING_THRESHOLD = 10000;
export const FLAT_SHIPPING_COST = 350;

export type PromoCode = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  label: string;
};

export const PROMO_CODES: PromoCode[] = [
  { code: "WELCOME10", type: "percent", value: 10, label: "10% off welcome" },
  { code: "ATELIER500", type: "fixed", value: 500, label: "PKR 500 off" },
  { code: "EID15", type: "percent", value: 15, label: "Eid 15% off" },
];

export function promoDiscount(subtotal: number, promo: PromoCode | null): number {
  if (!promo) return 0;
  if (promo.type === "percent") return Math.round((subtotal * promo.value) / 100);
  return Math.min(promo.value, subtotal);
}

// Default shipping cost using static config (kept for backwards compat).
export function shippingCost(subtotal: number, itemCount: number): number {
  if (itemCount === 0) return 0;
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return FLAT_SHIPPING_COST;
}

// Store-settings-aware shipping calculation. Falls back to defaults if values
// are not provided (e.g. when settings table is unavailable).
export function shippingCostWith(
  subtotal: number,
  itemCount: number,
  flatCharge: number,
  freeThreshold: number
): number {
  if (itemCount === 0) return 0;
  if (subtotal >= freeThreshold) return 0;
  return flatCharge;
}

