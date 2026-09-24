import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import type { ColorImage, ColorOption } from "@/lib/site-data";

export const dynamic = "force-dynamic";

// PATCH /api/admin/products/[slug] — update a product (incl. stock)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const body = (await request.json()) as Partial<{
    name: string;
    category: string;
    price: number;
    originalPrice: number;
    image: string;
    images: string[];
    colorImages?: ColorImage[];
    colorOptions: ColorOption[];
    sizes: string[];
    badge: string;
    fabric: string;
    care: string;
    description: string;
    stock: number;
    lowStockThreshold: number;
    active: boolean;
    isNewArrival?: boolean;
    isBestSeller?: boolean;
    isFeatured?: boolean;
  }>;

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.category !== undefined) data.category = body.category;
  if (body.price !== undefined) data.price = body.price;
  if (body.originalPrice !== undefined) data.originalPrice = body.originalPrice;
  if (body.image !== undefined) data.image = body.image;
  if (body.images !== undefined) data.images = JSON.stringify(body.images);
  if (body.colorImages !== undefined) data.colorImages = JSON.stringify(body.colorImages);
  if (body.colorOptions !== undefined) data.colors = JSON.stringify(body.colorOptions);
  if (body.sizes !== undefined) data.sizes = JSON.stringify(body.sizes);
  if (body.badge !== undefined) data.badge = body.badge;
  if (body.fabric !== undefined) data.fabric = body.fabric;
  if (body.care !== undefined) data.care = body.care;
  if (body.description !== undefined) data.description = body.description;
  if (body.stock !== undefined) data.stock = Math.max(0, body.stock);
  if (body.lowStockThreshold !== undefined) data.lowStockThreshold = Math.max(0, body.lowStockThreshold);
  if (body.active !== undefined) data.active = Boolean(body.active);
  if (body.isNewArrival !== undefined) data.isNewArrival = body.isNewArrival;
  if (body.isBestSeller !== undefined) data.isBestSeller = body.isBestSeller;
  if (body.isFeatured !== undefined) data.isFeatured = body.isFeatured;

  const product = await db.product.update({
    where: { slug },
    data,
  });

  // Bust caches so customers see the updated price/stock/visibility instantly.
  revalidatePath("/", "layout");
  revalidatePath(`/product/${slug}`);
  revalidatePath("/daily-wear");

  return NextResponse.json({ ok: true, slug: product.slug });
}

// DELETE /api/admin/products/[slug] — delete a product
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  // Fix #10: Safety guard — if this product is referenced by any existing
  // OrderItem, do NOT permanently delete it (would break order history /
  // reporting). Return 409 and tell the admin to deactivate instead.
  const referencedByOrder = await db.orderItem.findFirst({
    where: { productId: slug },
    select: { orderId: true },
  });
  if (referencedByOrder) {
    return NextResponse.json(
      {
        error:
          "Cannot delete this product because it is referenced by existing orders. Deactivate it instead to hide it from the storefront while preserving order history.",
      },
      { status: 409 }
    );
  }

  await db.product.delete({ where: { slug } });

  // Bust caches so the deleted product disappears from every customer-facing
  // route (homepage sections, collection, daily-wear, product detail, search).
  // The product detail page will now return 404 for this slug.
  revalidatePath("/", "layout");
  revalidatePath(`/product/${slug}`);
  revalidatePath("/daily-wear");

  return NextResponse.json({ ok: true });
}
