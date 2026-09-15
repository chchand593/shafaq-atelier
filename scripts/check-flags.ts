import { db } from "../src/lib/db";
async function main() {
  const ps = await db.product.findMany({ select: { slug: true, active: true, isNewArrival: true, isBestSeller: true, isFeatured: true } });
  for (const p of ps) console.log(`  ${p.slug}: active=${p.active} NA=${p.isNewArrival} BS=${p.isBestSeller} F=${p.isFeatured}`);
}
main().finally(() => db.$disconnect());
