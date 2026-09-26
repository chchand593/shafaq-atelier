import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ColorImage, ColorOption } from "@/lib/site-data";

export const dynamic = "force-dynamic";

// GET /api/search?q=gold&color=%231a1a1a
// Customer-facing product search. Supports an optional `color` query param
// (a HEX value) that filters products whose `colors` JSON contains that hex.
// Only active products are returned to customers.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const color = (searchParams.get("color") || "").trim();
  const limit = Math.min(Number(searchParams.get("limit") || 8), 20);

  const tokens = q.split(/\s+/).filter(Boolean);

  // Build the where clause. The q clause and the color clause are AND-ed
  // together. If q is empty we still want to support a pure color browse.
  // SECURITY: only active products are ever returned.
  const where: Record<string, unknown> = { active: true };

  if (tokens.length > 0) {
    where.OR = tokens.flatMap((t) => [
      { name: { contains: t } },
      { category: { contains: t } },
      { fabric: { contains: t } },
      { badge: { contains: t } },
      { description: { contains: t } },
      { colors: { contains: t } },
    ]);
  }

  // Optional color filter — match the hex anywhere in the colors JSON blob.
  // The colors column stores `[{hex:"#1a1a1a",name:"Onyx"}]`, so a substring
  // match on the hex value is sufficient and avoids cross-DB JSON ops.
  if (color) {
    where.colors = { contains: color };
  }

  // If neither q nor color is provided, return an empty list (no browse-all
  // via this endpoint — that's what the products endpoint is for).
  if (tokens.length === 0 && !color) {
    return NextResponse.json({ products: [] });
  }

  const products = await db.product.findMany({
    where,
    take: limit,
  });

  const mapped = products.map((p) => {
    let images: string[] = [];
    let colorImages: ColorImage[] = [];
    let colorOptions: ColorOption[] = [];
    let sizes: string[] = [];
    try { images = JSON.parse(p.images || "[]"); } catch { images = []; }
    try { colorImages = JSON.parse(p.colorImages || "[]"); } catch { colorImages = []; }
    try { colorOptions = JSON.parse(p.colors || "[]"); } catch { colorOptions = []; }
    try { sizes = JSON.parse(p.sizes || "[]"); } catch { sizes = []; }
    return {
      id: p.slug,
      name: p.name,
      category: p.category as "Daily Wear" | "New Arrivals" | "Best Sellers",
      price: p.price,
      originalPrice: p.originalPrice ?? undefined,
      image: p.image,
      images,
      colorImages,
      colors: colorOptions.map((c) => c.hex),
      colorOptions,
      sizes,
      rating: p.rating,
      reviews: p.reviewCount,
      // Fix #12: Include stock so search results can show low-stock/sold-out badges.
      stock: p.stock,
      badge: p.badge ?? undefined,
      fabric: p.fabric,
      care: p.care,
      description: p.description,
      isNewArrival: p.isNewArrival,
      isBestSeller: p.isBestSeller,
      isFeatured: p.isFeatured,
    };
  });

  return NextResponse.json({ products: mapped });
}
