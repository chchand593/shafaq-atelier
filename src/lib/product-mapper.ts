// Server-side shared product mapper.
//
// Used by ALL customer-facing product API routes + the product/[slug] server
// component to map a Prisma Product row to the customer `Product` shape from
// site-data.ts.
//
// Robustness contract:
// - Every JSON column is parsed independently with `|| "[]"` fallback +
//   per-field try/catch so one malformed value never throws a 500 that would
//   blank out the entire storefront listing.
// - Inactive style/fabric options are filtered out on the server so the
//   customer never sees options the admin has deactivated.
// - The function never throws; on any parse error it falls back to `[]` for
//   that field. Callers can safely use `.map(mapProduct)` without a
//   surrounding try/catch per row.
//
// This module is server-only (imports @/lib/db is not needed here; it only
// uses the Prisma row type). It is imported by route handlers and server
// components — never by client components.

import type {
  ColorImage,
  ColorOption,
  CombinationImage,
  FabricOption,
  Product,
  StyleOption,
} from "@/lib/site-data";

// The Prisma Product row type (only the fields we read). We use a structural
// type so this works with both the full Prisma row and any subset.
export type ProductRow = {
  slug: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number | null;
  image: string;
  images: string;
  colorImages: string;
  colors: string;
  sizes: string;
  styleOptions?: string;
  fabricOptions?: string;
  combinationImages?: string;
  rating: number;
  reviewCount: number;
  stock: number;
  badge: string | null;
  fabric: string;
  care: string;
  description: string;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
};

// Parse a JSON column safely. Returns `[]` on any error or empty input.
function parseJsonArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

// Filter active options (style/fabric) and sort by sortOrder then name.
function activeSorted<T extends { active?: boolean; sortOrder?: number; name?: string }>(
  options: T[]
): T[] {
  return options
    .filter((o) => o.active !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

// Map a Prisma Product row to the customer-facing Product shape.
export function mapProduct(p: ProductRow): Product {
  const images = parseJsonArray<string>(p.images);
  const colorImages = parseJsonArray<ColorImage>(p.colorImages);
  const colorOptions = parseJsonArray<ColorOption>(p.colors);
  const sizes = parseJsonArray<string>(p.sizes);
  const styleOptions = activeSorted(parseJsonArray<StyleOption>(p.styleOptions ?? "[]"));
  const fabricOptions = activeSorted(parseJsonArray<FabricOption>(p.fabricOptions ?? "[]"));
  const combinationImages = parseJsonArray<CombinationImage>(p.combinationImages ?? "[]");

  return {
    id: p.slug,
    name: p.name,
    category: p.category as Product["category"],
    price: p.price,
    originalPrice: p.originalPrice ?? undefined,
    image: p.image,
    images,
    colorImages,
    colors: colorOptions.map((c) => c.hex),
    colorOptions,
    sizes,
    styleOptions,
    fabricOptions,
    combinationImages,
    rating: p.rating,
    reviews: p.reviewCount,
    stock: p.stock,
    badge: p.badge ?? undefined,
    fabric: p.fabric,
    care: p.care,
    description: p.description,
    isNewArrival: p.isNewArrival,
    isBestSeller: p.isBestSeller,
    isFeatured: p.isFeatured,
  };
}
