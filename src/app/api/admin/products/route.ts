import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import type {
  ColorImage,
  ColorOption,
  CombinationImage,
  FabricOption,
  StyleOption,
} from "@/lib/site-data";

export const dynamic = "force-dynamic";

// Admin mapProduct — includes ALL fields (active flag, lowStockThreshold,
// createdAt, and the new styleOptions/fabricOptions/combinationImages) so the
// admin UI can render the full edit form. The customer-facing mapProduct (in
// src/lib/product-mapper.ts) filters out inactive style/fabric options; this
// admin version returns them ALL so the admin can see/toggle them.
function mapProduct(p: {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number | null;
  image: string;
  images: string;
  colorImages: string;
  colors: string;
  sizes: string;
  styleOptions: string;
  fabricOptions: string;
  combinationImages: string;
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
  isNewArrival: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
}) {
  // Each parse is independently guarded so a bad value never breaks the whole list.
  let images: string[] = [];
  let colorImages: ColorImage[] = [];
  let colorOptions: ColorOption[] = [];
  let sizes: string[] = [];
  let styleOptions: StyleOption[] = [];
  let fabricOptions: FabricOption[] = [];
  let combinationImages: CombinationImage[] = [];
  try { images = JSON.parse(p.images || "[]"); } catch { images = []; }
  try { colorImages = JSON.parse(p.colorImages || "[]"); } catch { colorImages = []; }
  try { colorOptions = JSON.parse(p.colors || "[]"); } catch { colorOptions = []; }
  try { sizes = JSON.parse(p.sizes || "[]"); } catch { sizes = []; }
  try { styleOptions = JSON.parse(p.styleOptions || "[]"); } catch { styleOptions = []; }
  try { fabricOptions = JSON.parse(p.fabricOptions || "[]"); } catch { fabricOptions = []; }
  try { combinationImages = JSON.parse(p.combinationImages || "[]"); } catch { combinationImages = []; }

  return {
    id: p.slug,
    name: p.name,
    category: p.category,
    price: p.price,
    originalPrice: p.originalPrice ?? undefined,
    image: p.image,
    images,
    colorImages,
    colorOptions,
    sizes,
    styleOptions,
    fabricOptions,
    combinationImages,
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
    isNewArrival: p.isNewArrival,
    isBestSeller: p.isBestSeller,
    isFeatured: p.isFeatured,
  };
}

// GET /api/admin/products — list all products with stock
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await db.product.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products: products.map(mapProduct) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to load products: ${msg.substring(0, 200)}`, products: [] },
      { status: 500 }
    );
  }
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
    images?: string[];
    colorImages?: ColorImage[];
    colorOptions: ColorOption[];
    sizes: string[];
    badge?: string;
    fabric: string;
    care: string;
    description: string;
    stock?: number;
    // Fix #16: Accept lowStockThreshold on creation (defaults to 5).
    lowStockThreshold?: number;
    isNewArrival?: boolean;
    isBestSeller?: boolean;
    isFeatured?: boolean;
    // NEW: Per-product Style + Fabric options + combination images.
    styleOptions?: StyleOption[];
    fabricOptions?: FabricOption[];
    combinationImages?: CombinationImage[];
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
      images: JSON.stringify(body.images || []),
      colorImages: JSON.stringify(body.colorImages || []),
      colors: JSON.stringify(body.colorOptions || []),
      sizes: JSON.stringify(body.sizes || ["XS", "S", "M", "L", "XL", "XXL"]),
      // NEW: persist the 3 additive JSON columns. Default to "[]" when not sent
      // so existing admin UI flows (which don't send these fields) still work.
      styleOptions: JSON.stringify(body.styleOptions || []),
      fabricOptions: JSON.stringify(body.fabricOptions || []),
      combinationImages: JSON.stringify(body.combinationImages || []),
      badge: body.badge || null,
      fabric: body.fabric || "",
      care: body.care || "",
      description: body.description || "",
      stock: body.stock ?? 50,
      // Fix #16: Persist lowStockThreshold (defaults to 5 if not sent).
      lowStockThreshold: body.lowStockThreshold ?? 5,
      active: true,
      isNewArrival: body.isNewArrival ?? false,
      isBestSeller: body.isBestSeller ?? false,
      isFeatured: body.isFeatured ?? false,
    },
  });

  // Bust server-side caches so the new product shows up immediately on the
  // storefront (homepage + product detail route + the new product's own page).
  revalidatePath("/", "layout");
  revalidatePath(`/product/${slug}`);
  revalidatePath("/daily-wear");

  return NextResponse.json({ ok: true, product: mapProduct(product) });
}
