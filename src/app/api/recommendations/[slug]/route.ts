import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mapProduct, type ProductRow } from "@/lib/product-mapper";

export const dynamic = "force-dynamic";

// GET /api/recommendations/[slug] — recommended products for a given product
// Returns same-category products (excluding self) + top-rated from other categories.
// Only active products are recommended — deleted/deactivated products never appear.
//
// Robustness: uses the shared mapProduct for defensive JSON parsing.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const viewed = searchParams.get("viewed")?.split(",").filter(Boolean) || [];

  try {
    const product = await db.product.findUnique({ where: { slug } });
    if (!product || !product.active) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Same category, excluding current product. Only active products are
    // recommended — deleted/deactivated products must never appear here.
    const sameCategory = await db.product.findMany({
      where: { category: product.category, slug: { not: slug }, active: true },
      take: 4,
      orderBy: { rating: "desc" },
    });

    // If we have recently viewed products, include some from those categories
    const viewedCategories: string[] = [];
    if (viewed.length > 0) {
      const viewedProducts = await db.product.findMany({
        where: { slug: { in: viewed }, category: { not: product.category }, active: true },
        select: { category: true },
        distinct: ["category"],
      });
      viewedCategories.push(...viewedProducts.map((p) => p.category));
    }

    // Fill remaining slots with top-rated from other categories
    const excludeSlugs = [slug, ...sameCategory.map((p) => p.slug)];
    const fillers = await db.product.findMany({
      where: {
        slug: { notIn: excludeSlugs },
        active: true,
        ...(viewedCategories.length > 0
          ? { category: { in: viewedCategories } }
          : {}),
      },
      take: Math.max(0, 4 - sameCategory.length),
      orderBy: { rating: "desc" },
    });

    // If still not enough, get any remaining
    const allExcluded = [...excludeSlugs, ...fillers.map((p) => p.slug)];
    if (sameCategory.length + fillers.length < 4) {
      const extra = await db.product.findMany({
        where: { slug: { notIn: allExcluded }, active: true },
        take: 4 - sameCategory.length - fillers.length,
        orderBy: { rating: "desc" },
      });
      fillers.push(...extra);
    }

    const recommendations = [...sameCategory, ...fillers]
      .slice(0, 4)
      .map((p) => mapProduct(p as ProductRow));

    return NextResponse.json({ products: recommendations });
  } catch (e) {
    console.error("[/api/recommendations/[slug]] error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ products: [] });
  }
}
