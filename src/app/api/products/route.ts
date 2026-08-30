import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ColorOption } from "@/lib/site-data";

export const dynamic = "force-dynamic";

// GET /api/products?category=Daily+Wear
// Customer-facing product listing. Inactive products are hidden from customers.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const products = await db.product.findMany({
    where: {
      active: true,
      ...(category && category !== "All" ? { category } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const mapped = products.map((p) => ({
    id: p.slug,
    name: p.name,
    category: p.category as
      | "Daily Wear"
      | "New Arrivals"
      | "Best Sellers",
    price: p.price,
    originalPrice: p.originalPrice ?? undefined,
    image: p.image,
    colors: (JSON.parse(p.colors) as ColorOption[]).map((c) => c.hex),
    colorOptions: JSON.parse(p.colors) as ColorOption[],
    sizes: JSON.parse(p.sizes) as string[],
    rating: p.rating,
    reviews: p.reviewCount,
    stock: p.stock,
    badge: p.badge ?? undefined,
    fabric: p.fabric,
    care: p.care,
    description: p.description,
  }));

  return NextResponse.json({ products: mapped });
}

