import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { mapProduct } from "@/lib/product-mapper";
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
  // Robustness: the shared mapProduct parses every JSON column independently
  // with `|| "[]"` fallback + per-field try/catch so a single malformed value
  // never throws a 500 that would blank out the PDP.
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
