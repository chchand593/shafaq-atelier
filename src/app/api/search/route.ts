import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ColorOption } from "@/lib/site-data";

export const dynamic = "force-dynamic";

// GET /api/search?q=gold
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const limit = Math.min(Number(searchParams.get("limit") || 8), 20);

  if (!q) {
    return NextResponse.json({ products: [] });
  }

  const tokens = q.split(/\s+/).filter(Boolean);
  // SQLite LIKE is case-insensitive for ASCII; we filter further in JS for robustness.
  // SECURITY: only active products are returned to customers. Inactive or deleted
  // products must never surface in search even if their row still exists.
  const products = await db.product.findMany({
    where: {
      active: true,
      OR: tokens.flatMap((t) => [
        { name: { contains: t } },
        { category: { contains: t } },
        { fabric: { contains: t } },
        { badge: { contains: t } },
        { description: { contains: t } },
        { colors: { contains: t } },
      ]),
    },
    take: limit,
  });

  const mapped = products.map((p) => ({
    id: p.slug,
    name: p.name,
    category: p.category as "Daily Wear" | "New Arrivals" | "Best Sellers",
    price: p.price,
    originalPrice: p.originalPrice ?? undefined,
    image: p.image,
    colors: (JSON.parse(p.colors) as ColorOption[]).map((c) => c.hex),
    colorOptions: JSON.parse(p.colors) as ColorOption[],
    sizes: JSON.parse(p.sizes) as string[],
    rating: p.rating,
    reviews: p.reviewCount,
    badge: p.badge ?? undefined,
    fabric: p.fabric,
    care: p.care,
    description: p.description,
  }));

  return NextResponse.json({ products: mapped });
}
