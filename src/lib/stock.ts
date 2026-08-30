// Reusable stock logic for ShafaQ Atelier.
// Server-safe — no "use client" directive.

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

/**
 * Determine stock status from quantity and threshold.
 * - stockQuantity > lowStockThreshold → "in-stock"
 * - stockQuantity > 0 and <= lowStockThreshold → "low-stock"
 * - stockQuantity = 0 (or negative) → "out-of-stock"
 */
export function getStockStatus(
  stockQuantity: number,
  lowStockThreshold: number = DEFAULT_LOW_STOCK_THRESHOLD
): StockStatus {
  if (stockQuantity <= 0) return "out-of-stock";
  if (stockQuantity <= lowStockThreshold) return "low-stock";
  return "in-stock";
}

/**
 * Human-readable label for stock status.
 */
export function getStockLabel(
  stockQuantity: number,
  lowStockThreshold: number = DEFAULT_LOW_STOCK_THRESHOLD
): string {
  const status = getStockStatus(stockQuantity, lowStockThreshold);
  switch (status) {
    case "out-of-stock":
      return "Out of Stock";
    case "low-stock":
      return `Only ${stockQuantity} left`;
    case "in-stock":
      return "In Stock";
  }
}

/**
 * Whether a product can be added to cart.
 */
export function canAddToCart(
  stockQuantity: number,
  lowStockThreshold: number = DEFAULT_LOW_STOCK_THRESHOLD
): boolean {
  return getStockStatus(stockQuantity, lowStockThreshold) !== "out-of-stock";
}

/**
 * Whether a requested quantity is available.
 */
export function isQuantityAvailable(
  stockQuantity: number,
  requestedQty: number
): boolean {
  return stockQuantity >= requestedQty;
}

/**
 * Tailwind classes for stock status badge.
 */
export function getStockStatusColor(status: StockStatus): string {
  switch (status) {
    case "in-stock":
      return "text-green-700";
    case "low-stock":
      return "text-[var(--gold)]";
    case "out-of-stock":
      return "text-destructive";
  }
}

/**
 * Badge background classes for stock status.
 */
export function getStockBadgeClass(status: StockStatus): string {
  switch (status) {
    case "in-stock":
      return "bg-green-500/15 text-green-700";
    case "low-stock":
      return "bg-[var(--gold)]/15 text-[var(--gold)]";
    case "out-of-stock":
      return "bg-destructive/10 text-destructive";
  }
}

/**
 * Check if a productId is a customized abaya (made-to-order, no stock check).
 */
export function isCustomProduct(productId: string): boolean {
  return productId.startsWith("custom-");
}
