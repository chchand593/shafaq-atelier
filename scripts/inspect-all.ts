import { db } from "../src/lib/db";
async function main() {
  console.log("Products:", await db.product.count());
  console.log("Active:", await db.product.count({ where: { active: true } }));
  console.log("Inactive:", await db.product.count({ where: { active: false } }));
  console.log("Orders:", await db.order.count());
  console.log("Users:", await db.user.count());
  console.log("Colors:", await db.color.count());
  console.log("Fabrics:", await db.fabric.count());
  const ps = await db.product.findMany({ select: { slug: true, name: true, active: true } });
  for (const p of ps) console.log(`  ${p.slug}: ${p.name} (active=${p.active})`);
}
main().finally(() => db.$disconnect());
