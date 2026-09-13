import { db } from "../src/lib/db";
async function main() {
  const ps = await db.product.findMany({ select: { slug: true, name: true, active: true, category: true, isNewArrival: true, isBestSeller: true, isFeatured: true } });
  for (const p of ps) {
    console.log(`  ${p.slug}: ${p.name} | active=${p.active} | cat=${p.category} | NA=${p.isNewArrival} | BS=${p.isBestSeller} | F=${p.isFeatured}`);
  }
}
main().finally(() => db.$disconnect());
