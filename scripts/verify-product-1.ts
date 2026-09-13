import { db } from "../src/lib/db";
async function main() {
  const total = await db.product.count();
  const active = await db.product.count({ where: { active: true } });
  const inactive = await db.product.count({ where: { active: false } });
  console.log(`Total products: ${total} (active: ${active}, inactive: ${inactive})`);
  console.log(`Orders: ${await db.order.count()} (preserved)`);
  console.log(`Users: ${await db.user.count()} (preserved)`);
  const p1 = await db.product.findUnique({ where: { slug: "royal-pleated-abaya" } });
  if (p1) {
    const colors = JSON.parse(p1.colors);
    const ci = JSON.parse(p1.colorImages);
    console.log(`\nProduct #1: ${p1.name}`);
    console.log(`  slug: ${p1.slug}`);
    console.log(`  price: ${p1.price}`);
    console.log(`  active: ${p1.active}`);
    console.log(`  colors: ${colors.map((c:any)=>c.name).join(", ")}`);
    console.log(`  colorImages:`);
    for (const c of ci) {
      console.log(`    ${c.colorName} (${c.colorHex}): ${c.image}${c.images ? ` + ${c.images.length} extra` : ""}`);
    }
  }
}
main().finally(() => db.$disconnect());
