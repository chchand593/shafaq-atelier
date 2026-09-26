import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ColorImage, ColorOption } from "@/lib/site-data";

export const dynamic = "force-dynamic";

// GET /api/products/[slug]
// Customer-facing product detail. Inactive products return 404 ("not available").
//
// Robustness: every JSON column is parsed with a `|| "[]"` fallback + per-row
// try/catch so a malformed `colors`/`images`/`colorImages`/`sizes` value on the
// product (or a related product) never throws a 500. The whole handler is
// wrapped in a try/catch that returns 404 on unexpected errors so the customer
// sees the "not found" state instead of an error page.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const p = await db.product.findUnique({ where: { slug } });
    if (!p || !p.active) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const related = await db.product.findMany({
      where: { category: p.category, slug: { not: p.slug }, active: true },
      take: 4,
    });

    const mapProduct = (row: typeof p) => {
      let images: string[] = [];
      let colorImages: ColorImage[] = [];
      let colorOptions: ColorOption[] = [];
      let sizes: string[] = [];
      try { images = JSON.parse(row.images || "[]"); } catch { images = []; }
      try { colorImages = JSON.parse(row.colorImages || "[]"); } catch { colorImages = []; }
      try { colorOptions = JSON.parse(row.colors || "[]"); } catch { colorOptions = []; }
      try { sizes = JSON.parse(row.sizes || "[]"); } catch { sizes = []; }
      return {
        id: row.slug,
        name: row.name,
        category: row.category as
          | "Daily Wear"
          | "New Arrivals"
          | "Best Sellers",
        price: row.price,
        originalPrice: row.originalPrice ?? undefined,
        image: row.image,
        images,
        colorImages,
        colors: colorOptions.map((c) => c.hex),
        colorOptions,
        sizes,
        rating: row.rating,
        reviews: row.reviewCount,
        stock: row.stock,
        badge: row.badge ?? undefined,
        fabric: row.fabric,
        care: row.care,
        description: row.description,
        isNewArrival: row.isNewArrival,
        isBestSeller: row.isBestSeller,
        isFeatured: row.isFeatured,
      };
    };

    return NextResponse.json({
      product: mapProduct(p),
      related: related.map(mapProduct),
    });
  } catch (e) {
    console.error("[/api/products/[slug]] error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
}

