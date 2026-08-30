import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ColorOption } from "@/lib/site-data";

export const dynamic = "force-dynamic";

// GET /api/products/[slug]
// Customer-facing product detail. Inactive products return 404 ("not available").
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const p = await db.product.findUnique({ where: { slug } });
  if (!p || !p.active) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const related = await db.product.findMany({
    where: { category: p.category, slug: { not: p.slug }, active: true },
    take: 4,
  });

  const mapProduct = (row: typeof p) => ({
    id: row.slug,
    name: row.name,
    category: row.category as
      | "Daily Wear"
      | "New Arrivals"
      | "Best Sellers",
    price: row.price,
    originalPrice: row.originalPrice ?? undefined,
    image: row.image,
    colors: (JSON.parse(row.colors) as ColorOption[]).map((c) => c.hex),
    colorOptions: JSON.parse(row.colors) as ColorOption[],
    sizes: JSON.parse(row.sizes) as string[],
    rating: row.rating,
    reviews: row.reviewCount,
    stock: row.stock,
    badge: row.badge ?? undefined,
    fabric: row.fabric,
    care: row.care,
    description: row.description,
  });

  return NextResponse.json({
    product: mapProduct(p),
    related: related.map(mapProduct),
  });
}

