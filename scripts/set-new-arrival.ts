import { db } from "../src/lib/db";
async function main() {
  await db.product.update({
    where: { slug: "royal-pleated-abaya" },
    data: { isNewArrival: true, isFeatured: true },
  });
  const p = await db.product.findUnique({ where: { slug: "royal-pleated-abaya" } });
  console.log(`Product #1: isNewArrival=${p?.isNewArrival}, isBestSeller=${p?.isBestSeller}, isFeatured=${p?.isFeatured}`);
}
main().finally(() => db.$disconnect());
