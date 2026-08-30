import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ColorOption } from "@/lib/site-data";

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
      colors: (JSON.parse(p.colors) as ColorOption[]).map((c) => c.hex),
      colorOptions: JSON.parse(p.colors) as ColorOption[],
      sizes: JSON.parse(p.sizes) as string[],
      rating: p.rating,
      reviews: p.reviewCount,
      badge: p.badge ?? undefined,
      fabric: p.fabric,
      care: p.care,
      description: p.description,
    };
  });
  return NextResponse.json({ products });
}

// POST /api/wishlist — add or remove a product (toggle)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Please sign in to sync your wishlist." },
      { status: 401 }
    );
  }
  const { productId } = (await request.json()) as { productId?: string };
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existing = await db.wishlistItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });

  if (existing) {
    await db.wishlistItem.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true, action: "removed" });
  }

  await db.wishlistItem.create({
    data: { userId: user.id, productId },
  });
  return NextResponse.json({ ok: true, action: "added" });
}
