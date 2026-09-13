import { db } from "../src/lib/db";
async function main() {
  const products = await db.product.findMany({ select: { slug: true, image: true, images: true } });
  for (const p of products.slice(0, 3)) {
    console.log(`${p.slug}: image=${p.image}, images=${p.images}`);
  }
}
main().finally(() => db.$disconnect());
