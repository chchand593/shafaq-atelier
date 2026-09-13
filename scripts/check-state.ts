import { db } from "../src/lib/db";
async function main() {
  console.log("Products:", await db.product.count());
  console.log("Orders:", await db.order.count());
  console.log("Users:", await db.user.count());
  const ps = await db.product.findMany({ select: { slug: true, name: true, active: true, category: true, colors: true, colorImages: true, image: true } });
  for (const p of ps) {
    const colors = JSON.parse(p.colors);
    const ci = JSON.parse(p.colorImages || "[]");
    console.log(`  ${p.slug}: ${p.name} | active=${p.active} | colors=${colors.length} | colorImages=${ci.length} | image=${p.image}`);
  }
}
main().finally(() => db.$disconnect());
