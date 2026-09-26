import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ColorImage, ColorOption } from "@/lib/site-data";

export const dynamic = "force-dynamic";

// GET /api/products?category=Daily+Wear
// Customer-facing product listing. Inactive products are hidden from customers.
//
// Robustness: every JSON column is parsed with a `|| "[]"` fallback so a single
// product with a missing/empty `colors`, `images`, `colorImages`, or `sizes`
// value can never throw a 500 and blank out the ENTIRE storefront listing.
// The whole handler is also wrapped in a try/catch that returns
// `{ products: [] }` (200) on any unexpected error so the customer UI shows a
// graceful "no products" state instead of an error page. This mirrors the
// resilience already present in the admin product route.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  try {
    const products = await db.product.findMany({
      where: {
        active: true,
        ...(category && category !== "All" ? { category } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    const mapped = products.map((p) => {
      // Each parse is independently guarded so one bad row never poisons the
      // rest of the listing.
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
        category: p.category as
          | "Daily Wear"
          | "New Arrivals"
          | "Best Sellers",
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
  } catch (e) {
    // Never surface a 500 to the customer storefront — return an empty list so
    // the UI shows the "no products available" empty state instead of an error
    // page. The admin route logs the full error; here we only return `[]`.
    console.error("[/api/products] error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ products: [] });
  }
}

