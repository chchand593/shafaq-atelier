import { db } from "../src/lib/db";
async function main() {
  const total = await db.product.count();
  const active = await db.product.count({ where: { active: true } });
  const na = await db.product.count({ where: { active: true, isNewArrival: true } });
  const bs = await db.product.count({ where: { active: true, isBestSeller: true } });
  const dw = await db.product.count({ where: { active: true, isFeatured: true } });
  const users = await db.user.count();
  const admin = await db.user.count({ where: { role: "admin" } });
  console.log(`Products: ${total} (active: ${active})`);
  console.log(`Daily Wear (isFeatured): ${dw}`);
  console.log(`New Arrivals (isNewArrival): ${na}`);
  console.log(`Best Sellers (isBestSeller): ${bs}`);
  console.log(`Users: ${users} (admin: ${admin})`);
  console.log(`Orders: ${await db.order.count()}`);
  console.log(`Colors: ${await db.color.count()}`);
}
main().finally(() => db.$disconnect());
