import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import type { ColorOption } from "@/lib/site-data";

export const dynamic = "force-dynamic";

function mapProduct(p: {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number | null;
  image: string;
  colors: string;
  sizes: string;
  rating: number;
  reviewCount: number;
  stock: number;
  lowStockThreshold: number;
  active: boolean;
  badge: string | null;
  fabric: string;
  care: string;
  description: string;
  createdAt: Date;
}) {
  return {
    id: p.slug,
    name: p.name,
    category: p.category,
    price: p.price,
    originalPrice: p.originalPrice ?? undefined,
    image: p.image,
    colorOptions: JSON.parse(p.colors) as ColorOption[],
    sizes: JSON.parse(p.sizes) as string[],
    rating: p.rating,
    reviews: p.reviewCount,
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold,
    active: p.active,
    badge: p.badge ?? undefined,
    fabric: p.fabric,
    care: p.care,
    description: p.description,
    createdAt: p.createdAt,
  };
}

// GET /api/admin/products — list all products with stock
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await db.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ products: products.map(mapProduct) });
}

// POST /api/admin/products — create a product
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name: string;
    slug?: string;
    category: string;
    price: number;
    originalPrice?: number;
    image: string;
    colorOptions: ColorOption[];
    sizes: string[];
    badge?: string;
    fabric: string;
    care: string;
    description: string;
    stock?: number;
  };

  if (!body.name || !body.category || !body.price || !body.image) {
    return NextResponse.json(
      { error: "Name, category, price, and image are required." },
      { status: 400 }
    );
  }

  const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const existing = await db.product.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug already exists." }, { status: 409 });
  }

  const product = await db.product.create({
    data: {
      slug,
      name: body.name,
      category: body.category,
      price: body.price,
      originalPrice: body.originalPrice ?? null,
      image: body.image,
      colors: JSON.stringify(body.colorOptions || []),
      sizes: JSON.stringify(body.sizes || ["XS", "S", "M", "L", "XL", "XXL"]),
      badge: body.badge || null,
      fabric: body.fabric || "",
      care: body.care || "",
      description: body.description || "",
      stock: body.stock ?? 50,
      active: true,
    },
  });

  // Bust server-side caches so the new product shows up immediately on the
  // storefront (homepage + product detail route + the new product's own page).
  revalidatePath("/", "layout");
  revalidatePath(`/product/${slug}`);
  revalidatePath("/daily-wear");

  return NextResponse.json({ ok: true, product: mapProduct(product) });
}
