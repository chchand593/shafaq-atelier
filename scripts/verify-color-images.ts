import { db } from "../src/lib/db";
async function main() {
  const products = await db.product.findMany({ select: { slug: true, colorImages: true } });
  for (const p of products) {
    const imgs = JSON.parse(p.colorImages || "[]");
    console.log(`  ${p.slug}: ${imgs.length} color images`);
  }
}
main().finally(() => db.$disconnect());
