import { db } from "../src/lib/db";
async function main() {
  console.log("Products:", await db.product.count());
  console.log("Users:", await db.user.count());
  console.log("Colors:", await db.color.count());
  console.log("Fabrics:", await db.fabric.count());
  const ps = await db.product.findMany({ select: { slug: true, name: true, colors: true } });
  for (const p of ps.slice(0, 2)) console.log(`  ${p.slug}: colors=${p.colors.substring(0,80)}...`);
}
main().finally(() => db.$disconnect());
