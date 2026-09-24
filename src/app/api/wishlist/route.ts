import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ColorImage, ColorOption } from "@/lib/site-data";

export const dynamic = "force-dynamic";

// GET /api/wishlist — list the signed-in user's wishlist products
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ products: [] });
  }
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    include: {
      wishlist: { include: { product: true } },
    },
  });
  if (!user) return NextResponse.json({ products: [] });

  const products = user.wishlist.map((w) => {
    const p = w.product;
    return {
      id: p.slug,
      name: p.name,
      category: p.category as "Daily Wear" | "New Arrivals" | "Best Sellers",
      price: p.price,
      originalPrice: p.originalPrice ?? undefined,
      image: p.image,
      // Fix #14: Include images, colorImages, stock, lowStockThreshold,
      // and active so wishlist items have the full product shape.
      images: JSON.parse(p.images || "[]") as string[],
      colorImages: JSON.parse(p.colorImages || "[]") as ColorImage[],
      colors: (JSON.parse(p.colors || "[]") as ColorOption[]).map((c) => c.hex),
      colorOptions: JSON.parse(p.colors || "[]") as ColorOption[],
      sizes: JSON.parse(p.sizes || "[]") as string[],
      rating: p.rating,
      reviews: p.reviewCount,
      stock: p.stock,
      lowStockThreshold: p.lowStockThreshold,
      active: p.active,
      badge: p.badge ?? undefined,
      fabric: p.fabric,
      care: p.care,
      description: p.description,
    };
  });
  return NextResponse.json({ products });
}

// POST /api/wishlist — add or remove a product (toggle)
// The client sends productId = product SLUG (the public id used everywhere
// on the storefront). The WishlistItem FK references Product.id (cuid), so we
// must resolve the slug to the actual product id before writing.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Please sign in to sync your wishlist." },
      { status: 401 }
    );
  }
  const { productId: productSlug } = (await request.json()) as { productId?: string };
  if (!productSlug) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Resolve slug → Product.id (cuid). If the product no longer exists (was
  // deleted by admin), silently no-op so the client wishlist stays consistent.
  const product = await db.product.findUnique({
    where: { slug: productSlug },
    select: { id: true },
  });
  if (!product) {
    return NextResponse.json({ ok: true, action: "noop", reason: "product-gone" });
  }

  const existing = await db.wishlistItem.findUnique({
    where: { userId_productId: { userId: user.id, productId: product.id } },
  });

  if (existing) {
    await db.wishlistItem.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true, action: "removed" });
  }

  await db.wishlistItem.create({
    data: { userId: user.id, productId: product.id },
  });
  return NextResponse.json({ ok: true, action: "added" });
}
