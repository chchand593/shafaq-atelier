import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mapProduct } from "@/lib/product-mapper";

export const dynamic = "force-dynamic";

// GET /api/products?category=Daily+Wear
// Customer-facing product listing. Inactive products are hidden from customers.
//
// Robustness: the shared mapProduct parses every JSON column independently with
// `|| "[]"` fallback + per-field try/catch so a single malformed row never
// throws a 500 that would blank out the ENTIRE storefront listing. The whole
// handler is wrapped in a try/catch that returns `{ products: [] }` (200) on
// any unexpected error so the customer UI shows a graceful "no products" state
// instead of an error page.
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

    return NextResponse.json({ products: products.map(mapProduct) });
  } catch (e) {
    console.error("[/api/products] error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ products: [] });
  }
}
