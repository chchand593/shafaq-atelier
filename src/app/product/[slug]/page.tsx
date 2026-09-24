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
  const mapProduct = (r: typeof row): Product => ({
    id: r.slug,
    name: r.name,
    category: r.category as Product["category"],
    price: r.price,
    originalPrice: r.originalPrice ?? undefined,
    image: r.image,
    // Fix #3: Include the multi-image gallery array. Without this, the PDP
    // falls back to 3 framing variants of the single `image` and never shows
    // the multi-image gallery the admin uploaded.
    images: JSON.parse(r.images || "[]") as string[],
    colors: (JSON.parse(r.colors || "[]") as ColorOption[]).map((c) => c.hex),
    colorOptions: JSON.parse(r.colors || "[]") as ColorOption[],
    colorImages: JSON.parse(r.colorImages || "[]") as ColorImage[],
    sizes: JSON.parse(r.sizes || "[]") as string[],
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
  });
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
