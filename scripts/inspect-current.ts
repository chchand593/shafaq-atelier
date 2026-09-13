import { db } from "../src/lib/db";
async function main() {
  const total = await db.product.count();
  const active = await db.product.count({ where: { active: true } });
  console.log(`Products: ${total} (active: ${active})`);
  console.log(`Orders: ${await db.order.count()}`);
  console.log(`Users: ${await db.user.count()}`);
  const p1 = await db.product.findUnique({ where: { slug: "royal-pleated-abaya" } });
  if (p1) {
    const ci = JSON.parse(p1.colorImages || "[]");
    console.log(`\nProduct #1: ${p1.name}`);
    console.log(`  colors: ${JSON.parse(p1.colors).map((c:any)=>c.name).join(", ")}`);
    console.log(`  colorImages entries: ${ci.length}`);
    for (const c of ci) {
      console.log(`    ${c.colorName}: ${c.image}${c.images ? ` + ${c.images.length} extra` : ""}`);
    }
  }
}
main().finally(() => db.$disconnect());
