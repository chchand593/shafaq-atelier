import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mapProduct } from "@/lib/product-mapper";

export const dynamic = "force-dynamic";

// GET /api/products/[slug]
// Customer-facing product detail. Inactive products return 404 ("not available").
//
// Robustness: the shared mapProduct parses every JSON column independently with
// `|| "[]"` fallback + per-field try/catch so a malformed value never throws a
// 500. The whole handler is wrapped in a try/catch that returns 404 on
// unexpected errors so the customer sees the "not found" state instead of an
// error page.
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

    return NextResponse.json({
      product: mapProduct(p),
      related: related.map(mapProduct),
    });
  } catch (e) {
    console.error("[/api/products/[slug]] error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
}
