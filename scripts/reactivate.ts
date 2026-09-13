import { db } from "../src/lib/db";
async function main() {
  await db.product.updateMany({ where: { active: false }, data: { active: true } });
  // Set section flags
  await db.product.updateMany({ where: { category: "Daily Wear" }, data: { isFeatured: true } });
  await db.product.updateMany({ where: { category: "New Arrivals" }, data: { isNewArrival: true } });
  await db.product.updateMany({ where: { category: "Best Sellers" }, data: { isBestSeller: true } });
  // Also set flags for royal-pleated
  await db.product.update({ where: { slug: "royal-pleated-abaya" }, data: { isNewArrival: true, isFeatured: true } });
  console.log("All products activated with section flags");
  const active = await db.product.count({ where: { active: true } });
  const na = await db.product.count({ where: { active: true, isNewArrival: true } });
  const bs = await db.product.count({ where: { active: true, isBestSeller: true } });
  const dw = await db.product.count({ where: { active: true, isFeatured: true } });
  console.log(`Active: ${active}, NA: ${na}, BS: ${bs}, DW: ${dw}`);
}
main().finally(() => db.$disconnect());
