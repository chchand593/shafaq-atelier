import { db } from "../src/lib/db";
async function main() {
  const products = await db.product.findMany({ select: { slug: true, name: true, image: true, colorImages: true } });
  for (const p of products) {
    const imgs = JSON.parse(p.colorImages || "[]");
    console.log(`  ${p.slug} (${p.name}) | main=${p.image} | colorImages=${imgs.length === 0 ? "EMPTY (fallback to own image)" : JSON.stringify(imgs)}`);
  }
  console.log(`\nTotal: ${products.length} products`);
  const withColorImages = products.filter(p => JSON.parse(p.colorImages || "[]").length > 0).length;
  console.log(`Products with colorImages: ${withColorImages} (should be 0)`);
  console.log(`Products falling back to own image: ${products.length - withColorImages} (should be ${products.length})`);
}
main().finally(() => db.$disconnect());
