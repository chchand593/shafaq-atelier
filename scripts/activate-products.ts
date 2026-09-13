import { db } from "../src/lib/db";

async function main() {
  console.log("Activating products and setting section flags…\n");

  // Activate all 8 original products + set their section flags
  // Daily Wear products (4)
  await db.product.update({ where: { slug: "dw-01" }, data: { active: true, isFeatured: true } });
  console.log("  ✓ dw-01 (Noor) — active, isFeatured");
  await db.product.update({ where: { slug: "dw-02" }, data: { active: true, isFeatured: true } });
  console.log("  ✓ dw-02 (Sahar) — active, isFeatured");
  await db.product.update({ where: { slug: "dw-03" }, data: { active: true, isFeatured: true } });
  console.log("  ✓ dw-03 (Ayla) — active, isFeatured");
  await db.product.update({ where: { slug: "dw-04" }, data: { active: true, isFeatured: true } });
  console.log("  ✓ dw-04 (Mira) — active, isFeatured");

  // New Arrivals (2)
  await db.product.update({ where: { slug: "na-01" }, data: { active: true, isNewArrival: true } });
  console.log("  ✓ na-01 (Zara) — active, isNewArrival");
  await db.product.update({ where: { slug: "na-02" }, data: { active: true, isNewArrival: true } });
  console.log("  ✓ na-02 (Leila) — active, isNewArrival");

  // Best Sellers (2)
  await db.product.update({ where: { slug: "bs-01" }, data: { active: true, isBestSeller: true } });
  console.log("  ✓ bs-01 (Rania) — active, isBestSeller");
  await db.product.update({ where: { slug: "bs-02" }, data: { active: true, isBestSeller: true } });
  console.log("  ✓ bs-02 (Yasmin) — active, isBestSeller");

  // Royal Pleated Abaya (already has isNewArrival=true, isFeatured=true)
  await db.product.update({ where: { slug: "royal-pleated-abaya" }, data: { active: true } });
  console.log("  ✓ royal-pleated-abaya — active, isNewArrival+isFeatured");

  console.log("\n--- Summary ---");
  const active = await db.product.count({ where: { active: true } });
  const na = await db.product.count({ where: { active: true, isNewArrival: true } });
  const bs = await db.product.count({ where: { active: true, isBestSeller: true } });
  const dw = await db.product.count({ where: { active: true, isFeatured: true } });
  console.log(`Active products: ${active}`);
  console.log(`New Arrivals: ${na}`);
  console.log(`Best Sellers: ${bs}`);
  console.log(`Daily Wear (Featured): ${dw}`);
}

main().catch(console.error).finally(() => db.$disconnect());
