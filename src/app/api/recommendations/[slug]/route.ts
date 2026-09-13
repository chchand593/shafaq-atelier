import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ColorImage, ColorOption } from "@/lib/site-data";

export const dynamic = "force-dynamic";

function mapProduct(p: {
  slug: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number | null;
  image: string;
  colors: string;
  sizes: string;
  colorImages: string;
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
}) {
  return {
    id: p.slug,
    name: p.name,
    category: p.category,
    price: p.price,
    originalPrice: p.originalPrice ?? undefined,
    image: p.image,
    colors: (JSON.parse(p.colors) as ColorOption[]).map((c) => c.hex),
    colorOptions: JSON.parse(p.colors) as ColorOption[],
    sizes: JSON.parse(p.sizes) as string[],
    colorImages: JSON.parse(p.colorImages || "[]") as ColorImage[],
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

// GET /api/recommendations/[slug] — recommended products for a given product
// Returns same-category products (excluding self) + top-rated from other categories
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const viewed = searchParams.get("viewed")?.split(",").filter(Boolean) || [];

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

  const recommendations = [...sameCategory, ...fillers].slice(0, 4).map(mapProduct);

  return NextResponse.json({ products: recommendations });
}
