import { db } from "../src/lib/db";
async function main() {
  const total = await db.product.count();
  const active = await db.product.count({ where: { active: true } });
  console.log(`Products: ${total} (active: ${active})`);
  const ps = await db.product.findMany({ select: { slug: true, name: true, category: true, active: true, badge: true, price: true } });
  for (const p of ps) {
    console.log(`  ${p.slug} | ${p.name} | cat=${p.category} | active=${p.active} | badge=${p.badge || "none"} | price=${p.price}`);
  }
  console.log(`\nOrders: ${await db.order.count()}`);
  console.log(`Users: ${await db.user.count()}`);
}
main().finally(() => db.$disconnect());
