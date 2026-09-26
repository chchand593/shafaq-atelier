import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import type { ColorImage, ColorOption, Product } from "@/lib/site-data";
import { ProductDetail } from "@/components/site/product-detail";
import { SiteChrome } from "@/components/site/site-chrome";

type Params = { params: Promise<{ slug: string }> };

async function getProduct(slug: string) {
  const row = await db.product.findUnique({ where: { slug } });
  // Fix #8: Inactive products must NOT be accessible via direct URL — only
  // via the admin panel. The /api/products/[slug] route already 404s inactive
  // products; the PDP page was bypassing that check.
  if (!row || !row.active) return null;
  const related = await db.product.findMany({
    // Fix #9: Only active products should appear in the related grid.
    where: { category: row.category, slug: { not: row.slug }, active: true },
    take: 4,
  });
  // Robustness: parse each JSON column independently with `|| "[]"` fallback
  // and per-field try/catch so a single malformed value on the product (or a
  // related product) never throws a 500 that would blank out the PDP. Mirrors
  // the resilience added to /api/products and /api/products/[slug].
  const mapProduct = (r: typeof row): Product => {
    let images: string[] = [];
    let colorImages: ColorImage[] = [];
    let colorOptions: ColorOption[] = [];
    let sizes: string[] = [];
    try { images = JSON.parse(r.images || "[]"); } catch { images = []; }
    try { colorImages = JSON.parse(r.colorImages || "[]"); } catch { colorImages = []; }
    try { colorOptions = JSON.parse(r.colors || "[]"); } catch { colorOptions = []; }
    try { sizes = JSON.parse(r.sizes || "[]"); } catch { sizes = []; }
    return {
      id: r.slug,
      name: r.name,
      category: r.category as Product["category"],
      price: r.price,
      originalPrice: r.originalPrice ?? undefined,
      image: r.image,
      // Fix #3: Include the multi-image gallery array. Without this, the PDP
      // falls back to 3 framing variants of the single `image` and never shows
      // the multi-image gallery the admin uploaded.
      images,
      colors: colorOptions.map((c) => c.hex),
      colorOptions,
      colorImages,
      sizes,
      rating: r.rating,
      reviews: r.reviewCount,
      stock: r.stock,
      badge: r.badge ?? undefined,
      fabric: r.fabric,
      care: r.care,
      description: r.description,
      isNewArrival: r.isNewArrival,
      isBestSeller: r.isBestSeller,
      isFeatured: r.isFeatured,
    };
  };
  return {
    product: mapProduct(row),
    related: related.map(mapProduct),
  };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) return { title: "Product not found — ShafaQ Atelier" };
  return {
    title: `${data.product.name} — ShafaQ Atelier`,
    description: data.product.description.slice(0, 155),
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) notFound();

  return (
    <SiteChrome>
      <ProductDetail product={data.product} related={data.related} />
    </SiteChrome>
  );
}
